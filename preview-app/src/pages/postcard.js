/**
 * postcard — FUNCTIONAL port of miniprogram/pages/postcard
 * 把今晚的房间保存成一张明信片：Canvas 2D 实时分层合成（与 room-scene 同图层栈/
 * 同 layerOpacity 语义/同 charPlan uv→bbox 数学），纸张颗粒用固定种子 LCG（确定性），
 * 邮票/胶带/邮戳全部绘制进画布（导出图即含印刷细节）。
 *
 * 资产：复用 pc/ PNG 层（继承小程序已验证的合成参数；浏览器虽可解码 WebP，
 * 但 pc/ 与合成坐标同源，避免二次校准）。
 * 导出：canvas.toBlob(png) → adapters/canvas.js saveImage 下载；失败 → showModal。
 * 分享：Web Share API（带文件）→ 降级复制文案 + toast。
 */
import './postcard.css';
import RoomStore from '../state/room.js';
import RecordsUtil from '../state/records.js';
import SceneLayout from '../shared/room-scene-layout.js';
import { getStorageSync } from '../adapters/storage.js';
import { showToast, showModal } from '../adapters/platform.js';
import { loadImage, saveImage } from '../adapters/canvas.js';
import { assetUrl } from '../utils/asset-url.js';
import { back } from '../router/router.js';

const FLOOR_COLORS = { 'blue-gray': '#3B4A6B', walnut: '#8A5A33', slate: '#4A5A66' };
const GEO = SceneLayout.GEOMETRY;
const USER = { name: 'MOMO', roomId: '0731' };

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function mount(container) {
  let ready = false;
  let saving = false;
  let drawSeq = 0; // 并发守卫：只让最后一次 draw 生效
  let canvas = null;

  const page = document.createElement('div');
  page.className = 'p-postcard page';
  const scroller = document.createElement('div');
  scroller.className = 'page-scroll';
  page.appendChild(scroller);

  // ---- 顶部返回栏：小程序原生导航返回键的 web 对应（push 页无 tabbar，必须自带出口） ----
  const topbar = document.createElement('div');
  topbar.className = 'topbar';
  const backBtn = document.createElement('button');
  backBtn.className = 'nav-ic';
  backBtn.textContent = '‹';
  backBtn.setAttribute('aria-label', '返回');
  backBtn.addEventListener('click', () => back());
  topbar.appendChild(backBtn);
  scroller.appendChild(topbar);

  // ---- 刊头 ----
  const head = document.createElement('div');
  head.className = 'pc-head rise';
  const headMain = document.createElement('div');
  headMain.className = 'pc-head-main';
  const headTitle = document.createElement('span');
  headTitle.className = 'pc-head-title';
  headTitle.textContent = '明信片';
  const headEn = document.createElement('span');
  headEn.className = 'en-serif pc-head-en';
  headEn.textContent = 'Postcard · Night Mail';
  headMain.append(headTitle, headEn);
  const roomPill = document.createElement('span');
  roomPill.className = 'pill pill-dark pc-room-pill';
  roomPill.textContent = `ROOM ID · ${USER.roomId}`;
  head.append(headMain, roomPill);
  scroller.appendChild(head);

  // ---- 明信片舞台 ----
  const stage = document.createElement('div');
  stage.className = 'pc-stage';
  const wrap = document.createElement('div');
  wrap.className = 'pc-wrap tilt rise-d1';
  canvas = document.createElement('canvas');
  canvas.className = 'pc-canvas';
  wrap.appendChild(canvas);
  stage.appendChild(wrap);
  scroller.appendChild(stage);

  // ---- 行动 ----
  const btnRow = document.createElement('div');
  btnRow.className = 'pc-btn-row rise rise-d2';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-ghost-night pc-btn';
  const shareBtn = document.createElement('button');
  shareBtn.className = 'btn-primary pc-btn';
  shareBtn.textContent = '分享';
  btnRow.append(saveBtn, shareBtn);
  scroller.appendChild(btnRow);
  container.appendChild(page);

  function renderBtns() {
    saveBtn.textContent = saving ? '保存中…' : (ready ? '保存到相册' : '制作中…');
  }

  // 角色站位（与 Master 几何同源：uv → 828 坐标 → bbox）
  function charPlan(name) {
    const uv = name === 'momo' ? [0.68, 0.60] : [0.20, 0.44];
    const foot = [GEO.X0 + GEO.SX * (uv[0] - uv[1]), GEO.Y0 + GEO.SY * (uv[0] + uv[1])];
    const topPct = foot[1] / 8.28;
    const dt = Math.max(0, Math.min(1, (topPct - GEO.depthTopMin) / (GEO.depthTopMax - GEO.depthTopMin)));
    const scale = 0.82 + dt * 0.23;
    const h = Math.round(128 * scale);
    const w = Math.round(h / (184 / 144));
    return {
      z: Math.round(topPct * 10),
      bbox: { x: Math.round(foot[0] - w / 2), y: Math.round(foot[1] - h), w, h }
    };
  }

  async function draw() {
    const seq = ++drawSeq;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (!W || !H) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 2); // 2x 起步保证导出清晰
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 当前真实房间状态（roomie_room）：地板 / 色温 / 家具显隐
    const room = RoomStore.getRoom();
    const furniture = room.furniture;
    const lightTemp = room.lightTemp;
    const floorKey = room.floor;
    // 当前唱片墙选择（最多 6 张进明信片）
    const selectedRecords = RecordsUtil.readSelection(getStorageSync)
      .map((id) => RecordsUtil.byId(id))
      .filter(Boolean)
      .slice(0, 6);
    const selectedIds = selectedRecords.map((r) => r.id);

    // 载入所需图层（pc/ 画布安全层）
    const entries = [
      ['base', '/assets/img/pc/pc-base.jpg'],
      ['cool', '/assets/img/pc/pc-cool.png'],
      ['warm', '/assets/img/pc/pc-warm.png'],
      ['beam', '/assets/img/pc/pc-beam.png'],
      ['charMomo', '/assets/img/pc/pc-char-momo.png'],
      ['charKiki', '/assets/img/pc/pc-char-kiki.png']
    ];
    const furns = SceneLayout.FURNITURE.filter((f) => f.fixed || furniture.includes(f.id));
    furns.forEach((f) => entries.push([`furn-${f.key}`, `/assets/img/pc/furn-${f.key}.png`]));
    const slots = SceneLayout.RECORD_SLOTS.slice(0, selectedIds.length);
    slots.forEach((s, i) => entries.push([`plate-${i}`, `/assets/img/pc/pc-plate-${selectedIds[i]}.png`]));
    const pairs = await Promise.all(entries.map(([key, src]) =>
      loadImage(assetUrl(src)).then((img) => [key, img]).catch(() => [key, null])));
    if (seq !== drawSeq) return; // 期间状态又变了，丢弃这次绘制
    const imgs = Object.fromEntries(pairs);

    // ---- 纸张 + 颗粒（固定种子 → 确定性纹理） ----
    ctx.fillStyle = '#F6EFDD';
    ctx.fillRect(0, 0, W, H);
    let seed = 17;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    ctx.fillStyle = '#8A7A5E';
    for (let i = 0; i < 150; i += 1) {
      ctx.globalAlpha = 0.05 + rnd() * 0.08;
      ctx.beginPath();
      ctx.arc(rnd() * W, rnd() * H, 0.7 + rnd() * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ---- 房间主图（实时分层合成，与 room-scene 同图层栈） ----
    const pad = 18;
    const side = W - pad * 2;
    const t = Math.max(0, Math.min(1, (lightTemp - 2700) / 3300));
    ctx.save();
    roundRect(ctx, pad, pad, side, side, 12);
    ctx.clip();
    const px = (v) => pad + (v / 828) * side;

    if (imgs.base) ctx.drawImage(imgs.base, pad, pad, side, side);
    // L2 冷夜（色温反向）
    if (imgs.cool) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.5 + 0.5 * t;
      ctx.drawImage(imgs.cool, pad, pad, side, side);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    // 地板换色（clip 菱形，坐标与 room-map 同源）
    const { X0, Y0, SX, SY } = GEO;
    const diamond = [[X0 - SX, Y0 + SY], [X0, Y0], [X0 + SX, Y0 + SY], [X0, Y0 + 2 * SY]];
    ctx.beginPath();
    diamond.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(px(x), px(y)) : ctx.lineTo(px(x), px(y))));
    ctx.closePath();
    ctx.fillStyle = hexToRgba(FLOOR_COLORS[floorKey] || FLOOR_COLORS['blue-gray'], 0.45);
    ctx.fill();
    // L3 暖光洗（色温主层）
    if (imgs.warm) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.drawImage(imgs.warm, pad, pad, side, side);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    // 唱片槽位（当前选择）
    slots.forEach((s, i) => {
      const img = imgs[`plate-${i}`];
      if (img) {
        ctx.drawImage(img, pad + (s.left / 100) * side, pad + (s.top / 100) * side,
          (s.width / 100) * side, (s.height / 100) * side);
      }
    });
    // 家具 + 角色（z 同轴排序）
    const zItems = furns.map((f) => ({ z: f.z, kind: 'furn', f }));
    [
      { name: 'momo', plan: charPlan('momo'), img: imgs.charMomo },
      { name: 'kiki', plan: charPlan('kiki'), img: imgs.charKiki }
    ].filter((c) => c.img).forEach((c) => zItems.push({ z: c.plan.z, kind: 'char', ...c }));
    zItems.sort((a, b) => a.z - b.z);
    zItems.forEach((item) => {
      if (item.kind === 'furn') {
        const img = imgs[`furn-${item.f.key}`];
        if (img) ctx.drawImage(img, pad, pad, side, side);
      } else {
        const b = item.plan.bbox;
        // 脚底接触阴影
        ctx.save();
        ctx.fillStyle = 'rgba(14, 9, 3, 0.34)';
        ctx.beginPath();
        ctx.ellipse(
          pad + ((b.x + b.w / 2 + 3) / 828) * side,
          pad + ((b.y + b.h - 4) / 828) * side,
          (b.w * 0.36 / 828) * side,
          (b.w * 0.08 / 828) * side,
          0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
        ctx.drawImage(item.img, pad + (b.x / 828) * side, pad + (b.y / 828) * side,
          (b.w / 828) * side, (b.h / 828) * side);
      }
    });
    // L7 放映光束（明信片默认呈现"放映中"）
    if (imgs.beam) {
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(imgs.beam, pad, pad, side, side);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();

    // ---- 当前唱片墙：最多 6 张封面色块 + 黑胶圆心 ----
    const recY = pad + side + 18;
    if (selectedRecords.length) {
      const size = 30;
      const gap = 10;
      const total = selectedRecords.length * size + (selectedRecords.length - 1) * gap;
      const x0 = (W - total) / 2;
      selectedRecords.forEach((rec, i) => {
        const x = x0 + i * (size + gap);
        ctx.save();
        roundRect(ctx, x, recY, size, size, 6);
        ctx.fillStyle = rec.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size / 2, recY + size / 2, size * 0.26, 0, Math.PI * 2);
        ctx.fillStyle = '#10161F';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size / 2, recY + size / 2, size * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = '#F6EFDD';
        ctx.fill();
        ctx.restore();
      });
    }

    ctx.fillStyle = '#26221A';
    ctx.textAlign = 'center';
    ctx.font = '600 15px sans-serif';
    ctx.fillText('有音乐的房间，抵千万句寒暄。', W / 2, recY + 62);
    ctx.strokeStyle = '#D8CBB0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 18, recY + 80);
    ctx.lineTo(W / 2 + 18, recY + 80);
    ctx.stroke();
    ctx.fillStyle = '#9A9080';
    ctx.font = '10px sans-serif';
    ctx.fillText(`一间安静的放映室 · Roomie · ROOM ID ${USER.roomId}`, W / 2, H - 16);

    // 邮票（虚线框 + 黑胶）
    ctx.save();
    ctx.strokeStyle = '#9A9080';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    roundRect(ctx, W - pad - 46, pad + 8, 40, 50, 3);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(W - pad - 26, pad + 30, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#23262B';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W - pad - 26, pad + 30, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#E9A942';
    ctx.fill();
    ctx.restore();

    // 胶带（两角）
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = '#E9A942';
    ctx.translate(pad + 44, pad - 4);
    ctx.rotate(-0.24);
    ctx.fillRect(-30, -8, 60, 20);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = '#E9A942';
    ctx.translate(W - pad - 48, pad - 2);
    ctx.rotate(0.2);
    ctx.fillRect(-30, -8, 60, 20);
    ctx.restore();

    // 邮戳（同心双环 + 23:59 + ROOMIE POST）
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.strokeStyle = '#9A9080';
    ctx.lineWidth = 1.6;
    const pcx = W - 60;
    const pcy = H - 64;
    ctx.beginPath();
    ctx.arc(pcx, pcy, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(pcx, pcy, 21, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#9A9080';
    ctx.textAlign = 'center';
    ctx.font = '13px Georgia, serif';
    ctx.fillText('23:59', pcx, pcy + 4);
    ctx.font = '7.5px Georgia, serif';
    ctx.fillText('ROOMIE POST', pcx, pcy + 16);
    ctx.restore();

    ready = true;
    renderBtns();
  }

  async function onSave() {
    if (saving) return;
    if (!ready) {
      showToast({ title: '海报生成中，请稍候', icon: 'none' });
      return;
    }
    saving = true;
    renderBtns();
    try {
      await saveImage(canvas, 'roomie-postcard.png');
      showToast({ title: '已保存到相册（下载）', icon: 'success' });
    } catch (e) {
      showModal({
        title: '保存失败',
        content: '浏览器没有完成下载，请重试或检查下载权限',
        confirmText: '知道了',
        showCancel: false
      });
    } finally {
      saving = false;
      renderBtns();
    }
  }

  async function onShare() {
    const text = `${USER.name} 的放映室：有音乐的房间，抵千万句寒暄`;
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = blob && new File([blob], 'roomie-postcard.png', { type: 'image/png' });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Roomie 明信片', text });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'Roomie 明信片', text, url: location.href });
        return;
      }
      throw new Error('no-share');
    } catch (e) {
      if (e && e.name === 'AbortError') return; // 用户取消，不打扰
      try {
        await navigator.clipboard.writeText(`${text} ${location.href}`);
        showToast({ title: '已复制分享文案', icon: 'none' });
      } catch (e2) {
        showToast({ title: '分享不可用，已保留明信片', icon: 'none' });
      }
    }
  }

  saveBtn.addEventListener('click', onSave);
  shareBtn.addEventListener('click', onShare);

  // 房间状态变化 → 实时重绘（record 选择在 profile 页修改，重挂载即读取）
  const unsubRoom = RoomStore.subscribe(() => { ready = false; renderBtns(); draw(); });

  renderBtns();
  draw();

  return {
    unmount() {
      drawSeq += 1; // 使进行中的绘制作废
      unsubRoom();
      page.remove();
    }
  };
}

let ctx = null;

export default {
  mount(containerEl) {
    ctx = mount(containerEl);
  },
  unmount() {
    if (ctx) {
      ctx.unmount();
      ctx = null;
    }
  }
};
