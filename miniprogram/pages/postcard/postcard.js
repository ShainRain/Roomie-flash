const app = getApp();
const RecordsUtil = require('../../utils/records');
const SceneLayout = require('../../utils/room-scene-layout');

const FLOOR_COLORS = { 'blue-gray': '#3B4A6B', walnut: '#8A5A33', slate: '#4A5A66' };
const GEO = SceneLayout.GEOMETRY;

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

Page({
  data: {
    user: {},
    saving: false,
    ready: false
  },

  onLoad() {
    this.setData({ user: app.globalData.user });
    // 明信片使用当前唱片墙选择，而不是固定装饰
    this.selectedRecords = RecordsUtil.readSelection((k) => wx.getStorageSync(k))
      .map((id) => RecordsUtil.byId(id))
      .filter(Boolean)
      .slice(0, 6);
    this.draw();
  },

  // 画布安全层(Canvas 不用 WebP):pc/ 目录由 tools/gen-postcard-layers.js 生成
  loadImages(canvas, entries) {
    return Promise.all(entries.map(([key, src]) => new Promise((resolve) => {
      const img = canvas.createImage();
      img.onload = () => resolve([key, img]);
      img.onerror = () => resolve([key, null]);
      img.src = src;
    }))).then((pairs) => Object.fromEntries(pairs));
  },

  async draw() {
    const query = wx.createSelectorQuery().in(this);
    query
      .select('#postcard')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        if (!res || !res[0]) return;
        const canvas = res[0].node;
        this.canvasNode = canvas;
        const ctx = canvas.getContext('2d');
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 2;
        const W = res[0].width;
        const H = res[0].height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        // 当前真实房间状态(roomie_room):地板 / 色温 / 家具显隐
        const room = app.globalData.room || {};
        const furniture = Array.isArray(room.furniture) ? room.furniture : [];
        const lightTemp = typeof room.lightTemp === 'number' ? room.lightTemp : 2700;
        const floorKey = room.floor || 'blue-gray';
        const selectedIds = (this.selectedRecords || []).map((r) => r.id);

        // 载入所需图层
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
        const imgs = await this.loadImages(canvas, entries);

        // ---- 纸张 + 颗粒 ----
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

        // ---- 房间主图(实时分层合成,与 room-scene 同图层栈) ----
        const pad = 18;
        const side = W - pad * 2;
        const t = Math.max(0, Math.min(1, (lightTemp - 2700) / 3300));
        ctx.save();
        this.roundRect(ctx, pad, pad, side, side, 12);
        ctx.clip();
        const px = (v) => pad + (v / 828) * side; // 828 画布坐标 → 画布内坐标

        if (imgs.base) ctx.drawImage(imgs.base, pad, pad, side, side);
        // L2 冷夜(色温反向)
        if (imgs.cool) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.5 + 0.5 * t;
          ctx.drawImage(imgs.cool, pad, pad, side, side);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        // 地板换色(clip 菱形,坐标与 room-map 同源)
        const { X0, Y0, SX, SY } = GEO;
        const diamond = [[X0 - SX, Y0 + SY], [X0, Y0], [X0 + SX, Y0 + SY], [X0, Y0 + 2 * SY]];
        ctx.beginPath();
        diamond.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(px(x), px(y)) : ctx.lineTo(px(x), px(y))));
        ctx.closePath();
        ctx.fillStyle = hexToRgba(FLOOR_COLORS[floorKey] || FLOOR_COLORS['blue-gray'], 0.45);
        ctx.fill();
        // L3 暖光洗(色温主层)
        if (imgs.warm) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = Math.max(0, 1 - t);
          ctx.drawImage(imgs.warm, pad, pad, side, side);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        // 唱片槽位(当前选择)
        slots.forEach((s, i) => {
          const img = imgs[`plate-${i}`];
          if (img) {
            ctx.drawImage(
              img,
              pad + (s.left / 100) * side,
              pad + (s.top / 100) * side,
              (s.width / 100) * side,
              (s.height / 100) * side
            );
          }
        });
        // 家具 + 角色(z 同轴)
        const zItems = furns.map((f) => ({ z: f.z, kind: 'furn', f }));
        const chars = [
          { name: 'momo', plan: this.charPlan('momo'), img: imgs.charMomo },
          { name: 'kiki', plan: this.charPlan('kiki'), img: imgs.charKiki }
        ].filter((c) => c.img);
        chars.forEach((c) => zItems.push({ z: c.plan.z, kind: 'char', ...c }));
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
            ctx.drawImage(item.img, pad + (b.x / 828) * side, pad + (b.y / 828) * side, (b.w / 828) * side, (b.h / 828) * side);
          }
        });
        // L7 放映光束(明信片默认呈现"放映中")
        if (imgs.beam) {
          ctx.globalCompositeOperation = 'screen';
          ctx.drawImage(imgs.beam, pad, pad, side, side);
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();

        // ---- 文字与印刷细节 ----
        this.drawText(ctx, W, H, pad, side);

        // 邮票(虚线框 + 黑胶)
        ctx.save();
        ctx.strokeStyle = '#9A9080';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        this.roundRect(ctx, W - pad - 46, pad + 8, 40, 50, 3);
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

        // 胶带(两角)
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

        // 邮戳(同心双环 + 23:59 + ROOMIE POST)
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

        this.setData({ ready: true });
      });
  },

  // 角色站位(与 Master 几何同源:uv → 828 坐标 → bbox)
  charPlan(name) {
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
  },

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  drawText(ctx, W, H, pad, side) {
    // 当前唱片墙：最多 6 张选中唱片的封面色块 + 黑胶圆心
    const records = this.selectedRecords || [];
    const recY = pad + side + 18;
    if (records.length) {
      const size = 30;
      const gap = 10;
      const total = records.length * size + (records.length - 1) * gap;
      const x0 = (W - total) / 2;
      records.forEach((rec, i) => {
        const x = x0 + i * (size + gap);
        ctx.save();
        this.roundRect(ctx, x, recY, size, size, 6);
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
    ctx.fillText(`一间安静的放映室 · Roomie · ROOM ID ${this.data.user.roomId}`, W / 2, H - 16);
  },

  onSave() {
    if (this.data.saving || !this.canvasNode) return;
    if (!this.data.ready) {
      wx.showToast({ title: '海报生成中，请稍候', icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    wx.canvasToTempFilePath({
      canvas: this.canvasNode,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: () => {
            wx.showModal({
              title: '需要相册权限',
              content: '请在设置中允许保存图片到相册',
              confirmText: '去设置',
              confirmColor: '#2FBF71',
              success: (r) => {
                if (r.confirm) wx.openSetting();
              }
            });
          },
          complete: () => this.setData({ saving: false })
        });
      },
      fail: () => {
        this.setData({ saving: false });
        wx.showToast({ title: '生成失败，请重试', icon: 'none' });
      }
    }, this);
  },

  onShareAppMessage() {
    return {
      title: `${this.data.user.name} 的放映室：有音乐的房间，抵千万句寒暄`,
      path: '/pages/home/home'
    };
  },

  onShare() {
    wx.showToast({ title: '点右上角「···」转发给好友', icon: 'none' });
  }
});
