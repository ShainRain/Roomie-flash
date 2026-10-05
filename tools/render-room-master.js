// Room Master 渲染验证:sharp 合成 L0–L7 + 地板 tint + 唱片槽位 + 家具 + MOMO/KIKI
// 与 room-scene 组件运行时的图层栈/透明度规则一致(组件逻辑的离线镜像):
//   L0 → L1 → L2(色温反向) → 地板 tint → L3(色温主层×lampFactor) → L4 → 唱片槽位
//   → 家具+角色(按 z 排序插入,角色 depthFor 缩放 + 脚底阴影) → L5(lamp) → L6(暖薄纱) → L7(放映)
// 输出:
//   visual-validation/rendered/room-master.png        2700K 全开灯 + 放映机开
//   visual-validation/rendered/room-master-6000k.png  6000K 同开关对比
//   visual-validation/rendered/room-master-nol6.png   2700K 无 L6(角色受光对照)
// 运行: node tools/render-room-master.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { RECORDS } = require('../miniprogram/utils/records');

const IMG = path.join(__dirname, '..', 'miniprogram', 'assets', 'img');
const ROOM = path.join(IMG, 'room');
const LAYOUT = require('../miniprogram/utils/room-scene-layout');
const GEO = require('../visual-validation/rendered/room-master-geometry.json');
const OUT = path.join(__dirname, '..', 'visual-validation', 'rendered');

const FLOOR_COLORS = { 'blue-gray': '#3B4A6B', walnut: '#8A5A33', slate: '#4A5A66' };

// alpha 缩放(图层不透明度)
async function withOpacity(file, opacity) {
  if (opacity >= 0.999) return sharp(file).png().toBuffer();
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * opacity);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

function floorPolygonPoints() {
  const { X0, Y0, SX, SY } = GEO.geometry;
  return [
    [X0 - SX, Y0 + SY], [X0, Y0], [X0 + SX, Y0 + SY], [X0, Y0 + 2 * SY]
  ].map(([x, y]) => `${x},${y}`).join(' ');
}

async function floorTintBuffer(floorKey) {
  const hex = FLOOR_COLORS[floorKey] || FLOOR_COLORS.walnut;
  const n = parseInt(hex.slice(1), 16);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="828" height="828"><polygon points="${floorPolygonPoints()}" fill="rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0.45)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function depthFor(topPct) {
  const t = Math.max(0, Math.min(1, (topPct - GEO.geometry.depthTopMin || 32) / ((GEO.geometry.depthTopMax || 85) - (GEO.geometry.depthTopMin || 32))));
  return { scale: Number((0.82 + t * 0.23).toFixed(3)), z: Math.round(topPct * 10) };
}

async function charSprite(name, frame, plan, facing) {
  const file = path.join(IMG, `char-${name}-${frame}.webp`);
  const h = plan.heightPx;
  const w = Math.round(h / (184 / 144));
  let sprite = sharp(file).resize({ width: w });
  if (facing === -1) sprite = sprite.flop();
  const spriteBuf = await sprite.png().toBuffer();
  // 脚底接触阴影(主光源左上 → 投影右下,随景深缩放)
  const shW = Math.round(w * 0.72);
  const shH = Math.round(shW * 0.22);
  const shSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${shW + 20}" height="${shH + 12}"><ellipse cx="${shW / 2 + 12}" cy="${shH / 2 + 6}" rx="${shW / 2}" ry="${shH / 2}" fill="#0E0903" opacity="0.34"/></svg>`;
  const shBuf = await sharp(Buffer.from(shSvg)).png().toBuffer();
  return [
    { input: shBuf, left: Math.round(plan.bbox.x + w * 0.14 + 4), top: Math.round(plan.bbox.y + h - shH - 8), blend: 'over' },
    { input: spriteBuf, left: plan.bbox.x, top: plan.bbox.y, blend: 'over' }
  ];
}

async function composeScene({ lightTemp = 2700, lampOn = true, projectorOn = true, veil = true } = {}) {
  const t = (lightTemp - 2700) / 3300;
  const lampFactor = lampOn ? 1 : 0.25;
  const op = {
    L2: 0.5 + 0.5 * t,
    L3: Math.max(0, (1 - t)) * lampFactor,
    L4: 0.85,
    L5: lampOn ? 1 : 0,
    L6: veil ? Math.max(0.08, (1 - t) * (0.35 + 0.65 * lampFactor)) : 0,
    L7: projectorOn ? 1 : 0
  };

  const base = await sharp(path.join(ROOM, 'room-base.webp')).png().toBuffer();
  const steps = [];
  steps.push({ input: await withOpacity(path.join(ROOM, 'ambient-shadow.webp'), 1), blend: 'over' });
  steps.push({ input: await withOpacity(path.join(ROOM, 'cool-night-window.webp'), op.L2), blend: 'screen' });
  steps.push({ input: await floorTintBuffer('walnut'), blend: 'over' });
  steps.push({ input: await withOpacity(path.join(ROOM, 'warm-light-room.webp'), op.L3), blend: 'screen' });
  steps.push({ input: await withOpacity(path.join(ROOM, 'shelf-edge-glow.webp'), op.L4), blend: 'screen' });

  // 唱片槽位(默认 12 张:默认选择 + 顺序补足)
  const picks = [...RECORDS.map((r) => r.id)].slice(0, 12);
  for (let i = 0; i < LAYOUT.RECORD_SLOTS.length && i < picks.length; i += 1) {
    const slot = LAYOUT.RECORD_SLOTS[i];
    const plate = await sharp(path.join(ROOM, `rec-plate-${picks[i]}.webp`))
      .resize({ width: Math.round((slot.width / 100) * 828), height: Math.round((slot.height / 100) * 828) })
      .png().toBuffer();
    steps.push({
      input: plate,
      left: Math.round((slot.left / 100) * 828),
      top: Math.round((slot.top / 100) * 828),
      blend: 'over'
    });
  }

  // 家具 + 角色按 z 排序(角色 z = top%×10,同轴遮挡)
  const zItems = LAYOUT.FURNITURE.map((f) => ({ z: f.z, kind: 'furn', f }));
  const momoPlan = GEO.characters.momo;
  const kikiPlan = GEO.characters.kiki;
  zItems.push({ z: momoPlan.z, kind: 'char', name: 'momo', plan: momoPlan, facing: 1 });
  zItems.push({ z: kikiPlan.z, kind: 'char', name: 'kiki', plan: kikiPlan, facing: 1 });
  zItems.sort((a, b) => a.z - b.z);
  for (const item of zItems) {
    if (item.kind === 'furn') {
      steps.push({ input: await sharp(path.join(ROOM, `furn-${item.f.key}.webp`)).png().toBuffer(), blend: 'over' });
    } else {
      const parts = await charSprite(item.name, 'idle', item.plan, item.facing);
      steps.push(...parts);
    }
  }

  steps.push({ input: await withOpacity(path.join(ROOM, 'lamp-pool.webp'), op.L5), blend: 'screen' });
  if (op.L6 > 0) steps.push({ input: await withOpacity(path.join(ROOM, 'warm-veil-char.webp'), op.L6), blend: 'screen' });
  if (op.L7 > 0) steps.push({ input: await withOpacity(path.join(ROOM, 'projector-beam.webp'), op.L7), blend: 'screen' });

  return sharp(base).composite(steps).resize(1024, 1024).png().toBuffer();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const warm = await composeScene({ lightTemp: 2700, lampOn: true, projectorOn: true });
  fs.writeFileSync(path.join(OUT, 'room-master.png'), warm);
  console.log('OK visual-validation/rendered/room-master.png (2700K, lamp+projector on)');
  const cool = await composeScene({ lightTemp: 6000, lampOn: true, projectorOn: true });
  fs.writeFileSync(path.join(OUT, 'room-master-6000k.png'), cool);
  console.log('OK visual-validation/rendered/room-master-6000k.png (6000K)');
  const noL6 = await composeScene({ lightTemp: 2700, lampOn: true, projectorOn: true, veil: false });
  fs.writeFileSync(path.join(OUT, 'room-master-nol6.png'), noL6);
  console.log('OK visual-validation/rendered/room-master-nol6.png (2700K 无 L6 对照)');
})();
