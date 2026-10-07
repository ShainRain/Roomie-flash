// Room Master 离线合成库:L0–L7 + 地板 tint + 唱片槽位 + 家具 + 角色(与 room-scene 组件同规则)
// 供 render-room-master.js / gen-friends-vignettes.js 等工具复用,避免第二份图层逻辑。
const sharp = require('sharp');
const path = require('path');
const { RECORDS } = require('../miniprogram/utils/records');

const IMG = path.join(__dirname, '..', 'miniprogram', 'assets', 'img');
const ROOM = path.join(IMG, 'room');
const LAYOUT = require('../miniprogram/utils/room-scene-layout');
const GEO = require('../visual-validation/rendered/room-master-geometry.json');

const FLOOR_COLORS = { 'blue-gray': '#3B4A6B', walnut: '#8A5A33', slate: '#4A5A66' };

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

// 角色精灵 + 脚底接触阴影(主光源左上 → 投影右下)
async function charSprite(name, frame, plan, facing) {
  const file = path.join(IMG, `char-${name}-${frame}.webp`);
  const h = plan.heightPx;
  const w = Math.round(h / (184 / 144));
  let sprite = sharp(file).resize({ width: w });
  if (facing === -1) sprite = sprite.flop();
  const spriteBuf = await sprite.png().toBuffer();
  const shW = Math.round(w * 0.72);
  const shH = Math.round(shW * 0.22);
  const shSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${shW + 20}" height="${shH + 12}"><ellipse cx="${shW / 2 + 12}" cy="${shH / 2 + 6}" rx="${shW / 2}" ry="${shH / 2}" fill="#0E0903" opacity="0.34"/></svg>`;
  const shBuf = await sharp(Buffer.from(shSvg)).png().toBuffer();
  return [
    { input: shBuf, left: Math.round(plan.bbox.x + w * 0.14 + 4), top: Math.round(plan.bbox.y + h - shH - 8), blend: 'over' },
    { input: spriteBuf, left: plan.bbox.x, top: plan.bbox.y, blend: 'over' }
  ];
}

/**
 * characters: null = Master 默认(MOMO+KIKI);[] = 无角色;[{name, frame, plan, facing}]
 * plan 形如 GEO.characters.momo(含 bbox/heightPx/z)
 */
async function composeScene({ lightTemp = 2700, lampOn = true, projectorOn = true, veil = true, characters = null, floor = 'walnut' } = {}) {
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
  steps.push({ input: await floorTintBuffer(floor), blend: 'over' });
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
  const chars = characters === null
    ? [
        { name: 'momo', frame: 'idle', plan: GEO.characters.momo, facing: 1 },
        { name: 'kiki', frame: 'idle', plan: GEO.characters.kiki, facing: 1 }
      ]
    : characters;
  chars.forEach((c) => zItems.push({ z: c.plan.z, kind: 'char', ...c }));
  zItems.sort((a, b) => a.z - b.z);
  for (const item of zItems) {
    if (item.kind === 'furn') {
      steps.push({ input: await sharp(path.join(ROOM, `furn-${item.f.key}.webp`)).png().toBuffer(), blend: 'over' });
    } else {
      const parts = await charSprite(item.name, item.frame || 'idle', item.plan, item.facing || 1);
      steps.push(...parts);
    }
  }

  steps.push({ input: await withOpacity(path.join(ROOM, 'lamp-pool.webp'), op.L5), blend: 'screen' });
  if (op.L6 > 0) steps.push({ input: await withOpacity(path.join(ROOM, 'warm-veil-char.webp'), op.L6), blend: 'screen' });
  if (op.L7 > 0) steps.push({ input: await withOpacity(path.join(ROOM, 'projector-beam.webp'), op.L7), blend: 'screen' });

  return sharp(base).composite(steps).png().toBuffer();
}

module.exports = { composeScene, charSprite, GEO, LAYOUT, ROOM, IMG };
