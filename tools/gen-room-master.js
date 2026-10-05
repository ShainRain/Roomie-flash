// Roomie Room Master Scene 生成器(Phase 1 · 等距微距 · 灯光分层 · 视觉母版)
// 坐标系(新·微距): P(u,v,h)=[414+480(u-v), 235+250(u+v)-h], 墙高 440, 画布 828×828
//   房间可视主体(地板菱形+两面墙)占画布 ~76%;墙顶有意被镜头裁切(微距特写)。
//   与 room-map.createMap({X0:414,Y0:235,SX:480,SY:250}) 一一对应;
//   旧几何(274/144)继续服务 duo/architect,互不影响。
// 输出(miniprogram/assets/img/room/):
//   room-base.webp          L0 中性材质基底(不烘焙主光照)
//   ambient-shadow.webp     L1 AO/接触阴影/暗角(黑色 alpha 层)
//   cool-night-window.webp  L2 窗外夜景+冷蓝溢光
//   warm-light-room.webp    L3 2700K 暖光洗(含家具受光,按 lightResponse 烘焙)
//   shelf-edge-glow.webp    L4 层板暖边(常开弱)
//   lamp-pool.webp          L5 落地灯光池
//   warm-veil-char.webp     L6 角色暖薄纱(低 alpha)
//   projector-beam.webp     L7 放映光束+幕布发光画面
//   furn-<key>.webp ×13 + furn-table.webp   家具覆盖层(全幅同坐标系)
//   rec-plate-<id>.webp ×24                 唱片槽位板材(新墙面剪切)
// 另输出:
//   miniprogram/utils/room-scene-layout.js       Master 场景数据(§5.1 schema)
//   visual-validation/rendered/room-master-geometry.json  测量地面真值
// 运行: node tools/gen-room-master.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { RECORDS } = require('../miniprogram/utils/records');

const OUT_DIR = path.join(__dirname, '..', 'miniprogram', 'assets', 'img', 'room');
const OUT_LAYOUT = path.join(__dirname, '..', 'miniprogram', 'utils', 'room-scene-layout.js');
const OUT_GEO = path.join(__dirname, '..', 'visual-validation', 'rendered', 'room-master-geometry.json');

// ---- 几何(测量地面真值,与 room-scene-layout.GEOMETRY 同源) ----
const GEO = {
  canvas: 828, X0: 414, Y0: 235, SX: 480, SY: 250, WALL_H: 440,
  depthTopMin: 32, depthTopMax: 85, charBaseHeight: 128
};
const P = (u, v, h = 0) => [GEO.X0 + GEO.SX * (u - v), GEO.Y0 + GEO.SY * (u + v) - h];
const pt = (u, v, h = 0) => P(u, v, h).map((n) => n.toFixed(1)).join(' ');
const pct = (px) => Number((px / 8.28).toFixed(2));
// 墙面参数:s 沿墙(0=墙角,1=墙外角),t 垂直(0=墙顶,1=墙脚)
const LW = (s, t) => [414 - 480 * s, -205 + 440 * t + 250 * s];
const RW = (s, t) => [414 + 480 * s, -205 + 440 * t + 250 * s];

// 等距方块(顶/左/右三面)
function isoBox(u0, v0, wu, wv, h, colors, baseH = 0) {
  const y = baseH + h;
  const top = `M${pt(u0, v0, y)} L${pt(u0 + wu, v0, y)} L${pt(u0 + wu, v0 + wv, y)} L${pt(u0, v0 + wv, y)}Z`;
  const left = `M${pt(u0, v0 + wv, y)} L${pt(u0 + wu, v0 + wv, y)} L${pt(u0 + wu, v0 + wv, baseH)} L${pt(u0, v0 + wv, baseH)}Z`;
  const right = `M${pt(u0 + wu, v0 + wv, y)} L${pt(u0 + wu, v0, y)} L${pt(u0 + wu, v0, baseH)} L${pt(u0 + wu, v0 + wv, baseH)}Z`;
  return `<path d="${top}" fill="${colors.top}"/><path d="${left}" fill="${colors.left}"/><path d="${right}" fill="${colors.right}"/>`;
}
const topPt = (u, v, baseH) => pt(u, v, baseH);

// 接触阴影(柔和椭圆)
const shadow = (cx, cy, rx, ry, op = 0.32) =>
  `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx}" ry="${ry}" fill="#120C06" opacity="${op}" filter="url(#soft)"/>`;

// 胡桃木顶面木纹:沿 u 方向细线
function grainTopU(u0, v0, wu, wv, h, n, color = '#5A3A1F', op = 0.38, width = 1.4) {
  const out = [];
  for (let i = 1; i <= n; i += 1) {
    const v = v0 + (wv * i) / (n + 1);
    const a = P(u0 + 0.006, v, h);
    const b = P(u0 + wu - 0.006, v, h);
    out.push(`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="${color}" stroke-width="${width}" opacity="${op}" fill="none"/>`);
  }
  return out.join('');
}

// 确定性散点(墙面哑光微颗粒)
function specklesIn(n, seed, rect, rMin, rMax, color, opMin, opMax) {
  let s = seed >>> 0;
  const next = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const dots = [];
  for (let i = 0; i < n; i += 1) {
    const x = (rect.x + next() * rect.w).toFixed(4);
    const y = (rect.y + next() * rect.h).toFixed(4);
    const r = (rMin + next() * (rMax - rMin)).toFixed(4);
    const o = (opMin + next() * (opMax - opMin)).toFixed(2);
    dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${o}"/>`);
  }
  return dots.join('');
}

const DEFS = `<defs>
  <linearGradient id="nightBg" x2="0" y2="1"><stop stop-color="#070C16"/><stop offset="1" stop-color="#0D1626"/></linearGradient>
  <linearGradient id="wallLeft" x2="1" y2="1"><stop stop-color="#F4E9CC"/><stop offset="1" stop-color="#DECCA4"/></linearGradient>
  <linearGradient id="wallRight" x2="0" y2="1"><stop stop-color="#EEE1C0"/><stop offset="1" stop-color="#D6C298"/></linearGradient>
  <linearGradient id="floorWood" x2="0" y2="1"><stop stop-color="#8D5B30"/><stop offset="1" stop-color="#4C2D15"/></linearGradient>
  <linearGradient id="woodTop" x2="1" y2="1"><stop stop-color="#9E6E3E"/><stop offset="1" stop-color="#7D5128"/></linearGradient>
  <linearGradient id="woodLeft" x2="0" y2="1"><stop stop-color="#754A2B"/><stop offset="1" stop-color="#55341B"/></linearGradient>
  <linearGradient id="woodRight" x2="0" y2="1"><stop stop-color="#5F3B21"/><stop offset="1" stop-color="#432912"/></linearGradient>
  <linearGradient id="fabTop" x2="0" y2="1"><stop stop-color="#E39D56"/><stop offset="1" stop-color="#CD8140"/></linearGradient>
  <linearGradient id="fabLeft" x2="0" y2="1"><stop stop-color="#CA813E"/><stop offset="1" stop-color="#AF692D"/></linearGradient>
  <linearGradient id="fabRight" x2="0" y2="1"><stop stop-color="#B97334"/><stop offset="1" stop-color="#9B5B21"/></linearGradient>
  <linearGradient id="cushTop" x2="0" y2="1"><stop stop-color="#EDAD64"/><stop offset="1" stop-color="#DC914A"/></linearGradient>
  <linearGradient id="charTop" x2="0" y2="1"><stop stop-color="#34312B"/><stop offset="1" stop-color="#222019"/></linearGradient>
  <linearGradient id="charLeft" x2="0" y2="1"><stop stop-color="#26221A"/><stop offset="1" stop-color="#181510"/></linearGradient>
  <linearGradient id="charRight" x2="0" y2="1"><stop stop-color="#1D1A14"/><stop offset="1" stop-color="#13110D"/></linearGradient>
  <linearGradient id="terraTop" x2="0" y2="1"><stop stop-color="#BD7046"/><stop offset="1" stop-color="#A15735"/></linearGradient>
  <linearGradient id="terraLeft" x2="0" y2="1"><stop stop-color="#99522E"/><stop offset="1" stop-color="#7B3F21"/></linearGradient>
  <linearGradient id="terraRight" x2="0" y2="1"><stop stop-color="#834521"/><stop offset="1" stop-color="#673419"/></linearGradient>
  <radialGradient id="rugGrad" cx="0.5" cy="0.45" r="0.7"><stop stop-color="#F2E7CC"/><stop offset="1" stop-color="#DCCDA5"/></radialGradient>
  <radialGradient id="vinylGrad" cx="0.38" cy="0.35" r="0.85"><stop stop-color="#262E39"/><stop offset="1" stop-color="#0B0E13"/></radialGradient>
  <radialGradient id="gtrGrad" cx="0.42" cy="0.38" r="0.85"><stop stop-color="#DD9049"/><stop offset="1" stop-color="#9D5825"/></radialGradient>
  <linearGradient id="metalGrad" x2="0" y2="1"><stop stop-color="#D4D8DE"/><stop offset="1" stop-color="#8B96AC"/></linearGradient>
  <linearGradient id="screenOff" x2="1" y2="1"><stop stop-color="#151D28"/><stop offset="1" stop-color="#0A0F16"/></linearGradient>
  <linearGradient id="glassDark" x2="1" y2="1"><stop stop-color="#1A2431" stop-opacity="0.92"/><stop offset="1" stop-color="#0B1119" stop-opacity="0.96"/></linearGradient>
  <linearGradient id="winSky" x2="0" y2="1"><stop stop-color="#0B1830"/><stop offset="1" stop-color="#1E3A5E"/></linearGradient>
  <linearGradient id="winSea" x2="0" y2="1"><stop stop-color="#13273F"/><stop offset="1" stop-color="#0A1524"/></linearGradient>
  <radialGradient id="moonGlow"><stop stop-color="#FFE9B0" stop-opacity="0.9"/><stop offset="0.4" stop-color="#FFE9B0" stop-opacity="0.28"/><stop offset="1" stop-color="#FFE9B0" stop-opacity="0"/></radialGradient>
  <radialGradient id="lampPool"><stop stop-color="#FFD9A0" stop-opacity="0.62"/><stop offset="0.55" stop-color="#FFCF8E" stop-opacity="0.26"/><stop offset="1" stop-color="#FFCF8E" stop-opacity="0"/></radialGradient>
  <linearGradient id="shadeGrad" x2="0" y2="1"><stop stop-color="#F9D37E"/><stop offset="1" stop-color="#E0A03A"/></linearGradient>
  <radialGradient id="warmWash" cx="0.46" cy="0.42" r="0.62"><stop stop-color="#F2A93C" stop-opacity="0.34"/><stop offset="0.6" stop-color="#F2A93C" stop-opacity="0.14"/><stop offset="1" stop-color="#F2A93C" stop-opacity="0"/></radialGradient>
  <linearGradient id="warmWallL" x2="1" y2="1"><stop stop-color="#FFC46B" stop-opacity="0.30"/><stop offset="1" stop-color="#FFC46B" stop-opacity="0"/></linearGradient>
  <linearGradient id="warmWallR" x2="0" y2="1"><stop stop-color="#F7B453" stop-opacity="0.22"/><stop offset="1" stop-color="#F7B453" stop-opacity="0"/></linearGradient>
  <linearGradient id="coolSpill" x2="1" y2="0"><stop stop-color="#8FC0EA" stop-opacity="0.30"/><stop offset="1" stop-color="#8FC0EA" stop-opacity="0"/></linearGradient>
  <linearGradient id="coolWall" x2="0" y2="1"><stop stop-color="#9CC8EE" stop-opacity="0.22"/><stop offset="1" stop-color="#9CC8EE" stop-opacity="0"/></linearGradient>
  <radialGradient id="vig" cx="0.5" cy="0.5" r="0.72"><stop stop-color="#140B04" stop-opacity="0"/><stop offset="0.66" stop-color="#140B04" stop-opacity="0"/><stop offset="1" stop-color="#140B04" stop-opacity="0.42"/></radialGradient>
  <linearGradient id="aoCorner" x2="1" y2="0"><stop stop-color="#2A1808" stop-opacity="0.28"/><stop offset="1" stop-color="#2A1808" stop-opacity="0"/></linearGradient>
  <linearGradient id="aoFloor" x2="0" y2="1"><stop stop-color="#1E1006" stop-opacity="0.30"/><stop offset="1" stop-color="#1E1006" stop-opacity="0"/></linearGradient>
  <linearGradient id="ledGrad" x2="0" y2="1"><stop stop-color="#FFBE5A" stop-opacity="0.34"/><stop offset="1" stop-color="#FFBE5A" stop-opacity="0"/></linearGradient>
  <linearGradient id="beamGrad" x2="1" y2="0"><stop stop-color="#FFF4DC" stop-opacity="0.55"/><stop offset="1" stop-color="#FFF4DC" stop-opacity="0.06"/></linearGradient>
  <linearGradient id="screenOn" x2="0" y2="1"><stop stop-color="#2A4E78"/><stop offset="1" stop-color="#102236"/></linearGradient>
  <radialGradient id="screenGlow"><stop stop-color="#BFD9F2" stop-opacity="0.30"/><stop offset="1" stop-color="#BFD9F2" stop-opacity="0"/></radialGradient>
  <linearGradient id="veilGrad" x2="1" y2="1"><stop stop-color="#FFC27A" stop-opacity="0.55"/><stop offset="1" stop-color="#F2A04A" stop-opacity="0.18"/></linearGradient>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
  <filter id="softBig" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="24"/></filter>
  <filter id="wsoft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="wbig" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="12"/></filter>
  <clipPath id="floorClip"><path d="M-66 485 414 235 894 485 414 735Z"/></clipPath>
  <clipPath id="roomClip"><path d="M-66 45 414 -205 894 45 894 485 414 735 -66 485Z"/></clipPath>
  <clipPath id="canvasClip"><rect x="0" y="0" width="828" height="828"/></clipPath>
</defs>`;

const WOOD = { top: 'url(#woodTop)', left: 'url(#woodLeft)', right: 'url(#woodRight)' };
const WOOD_DARK = { top: '#6C4527', left: '#4F3119', right: '#3F2813' };
const FAB = { top: 'url(#fabTop)', left: 'url(#fabLeft)', right: 'url(#fabRight)' };
const CUSH = { top: 'url(#cushTop)', left: '#C78041', right: '#B36F34' };
const CHAR = { top: 'url(#charTop)', left: 'url(#charLeft)', right: 'url(#charRight)' };
const TERRA = { top: 'url(#terraTop)', left: 'url(#terraLeft)', right: 'url(#terraRight)' };

function wrap(content, bg = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="828" height="828" viewBox="0 0 828 828">${DEFS}${bg ? '<rect width="828" height="828" fill="url(#nightBg)"/>' : ''}${content}</svg>`;
}

// ================= L0 中性材质基底 =================
// 房体:左墙/右墙/地板(墙顶被镜头裁切,微距特写)
const ROOM_SHELL = `<path d="M-66 485 414 235 414 -205 -66 45Z" fill="url(#wallLeft)"/>
<path d="M414 235 894 485 894 45 414 -205Z" fill="url(#wallRight)"/>
<path d="M-66 485 414 235 894 485 414 735Z" fill="url(#floorWood)"/>`;

// 地板:木板(板面色差 + 板缝 + 板端接缝 + 漆面窄高光带)
function floorPlanks() {
  const parts = [];
  const NP = 9;
  for (let i = 0; i < NP; i += 1) {
    if (i % 2 === 0) {
      const a0 = i / NP;
      const a1 = (i + 1) / NP;
      parts.push(`<path d="M${pt(a0, 0)} L${pt(a1, 0)} L${pt(a1, 1)} L${pt(a0, 1)}Z" fill="#2E1A0A" opacity="0.08"/>`);
    }
    if (i % 3 === 1) {
      const a0 = i / NP;
      const a1 = (i + 1) / NP;
      parts.push(`<path d="M${pt(a0, 0)} L${pt(a1, 0)} L${pt(a1, 1)} L${pt(a0, 1)}Z" fill="#C08A4E" opacity="0.05"/>`);
    }
  }
  for (let i = 1; i < NP; i += 1) {
    const u = i / NP;
    parts.push(`<path d="M${pt(u, 0)} L${pt(u, 1)}" stroke="#38220F" stroke-width="2.6" opacity=".45" fill="none"/>`);
    parts.push(`<path d="M${pt(0, u)} L${pt(1, u)}" stroke="#38220F" stroke-width="1.6" opacity=".15" fill="none"/>`);
  }
  const seams = [[0.06, 0.3], [0.17, 0.72], [0.28, 0.18], [0.39, 0.55], [0.5, 0.85], [0.61, 0.4], [0.72, 0.62], [0.83, 0.25], [0.94, 0.78]];
  seams.forEach(([u, v]) => {
    const a = P(u, v);
    const b = P(u, v + 1 / NP);
    parts.push(`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="#38220F" stroke-width="2" opacity=".3" fill="none"/>`);
  });
  // 漆面高光窄带(沿板缝方向)
  parts.push(`<path d="M${pt(0.2, 0)} L${pt(0.2, 1)}" stroke="#C08A4E" stroke-width="10" opacity=".08" fill="none" filter="url(#soft)"/>`);
  parts.push(`<path d="M${pt(0.62, 0)} L${pt(0.62, 1)}" stroke="#C08A4E" stroke-width="13" opacity=".06" fill="none" filter="url(#soft)"/>`);
  return `<g clip-path="url(#floorClip)">${parts.join('')}</g>`;
}

// ---- 唱片墙(左墙):3 层胡桃木层板 + 12 槽位 + 固定装饰(海报/倚靠黑胶/平放叠片/小音箱) ----
const COVER_S = 0.10;   // 封套宽(墙面 s 单位)
const COVER_T = 0.1227; // 封套高(墙面 t 单位,视觉近方形)
const SHELVES = [0.50, 0.72, 0.94];
const SLOT_POS = [ // [层板序号, s] —— 12 槽,上 3 / 中 5 / 下 4,非均质排布
  [0, 0.20], [0, 0.34], [0, 0.48],
  [1, 0.08], [1, 0.22], [1, 0.36], [1, 0.50], [1, 0.68],
  [2, 0.10], [2, 0.24], [2, 0.38], [2, 0.52]
];
// 槽位板材参数(与 rec-plate-*.webp 对齐)
const PLATE_W = 108;
const PLATE_H = 96;
const PLATE_OX = 64;
const PLATE_OY = 8;

function slotWallRect(i) {
  const [sh, s] = SLOT_POS[i];
  const t1 = SHELVES[sh];
  return { s, t0: t1 - COVER_T - 0.006, t1: t1 - 0.006 };
}

function slotBBox(i) {
  const { s, t0 } = slotWallRect(i);
  const origin = LW(s, t0);
  return {
    left: pct(origin[0] - PLATE_OX),
    top: pct(origin[1] - PLATE_OY),
    width: pct(PLATE_W),
    height: pct(PLATE_H)
  };
}

// 唱片墙面积台账(屏幕 px²,墙面 (s,t) 单位面积 ×211200)
const WALL_UNIT_AREA = 480 * 440;
const recordWallArea = { covers: 12 * COVER_S * COVER_T * WALL_UNIT_AREA, shelves: 0, poster: 0, vinyl: 0, stack: 0 };

function recordWall() {
  const rw = [];
  // 层板 ×3:胡桃木(高光沿 + 木纹 + 托架)
  SHELVES.forEach((t) => {
    recordWallArea.shelves += 0.88 * 0.026 * WALL_UNIT_AREA;
    rw.push(`<rect x="0.06" y="${t}" width="0.88" height="0.026" fill="#7A5230"/>
      <rect x="0.06" y="${t + 0.026}" width="0.88" height="0.013" fill="#4E3319"/>
      <path d="M0.06 ${t + 0.002} H0.94" stroke="#A87B4A" stroke-width="0.004" opacity=".85"/>
      <path d="M0.09 ${t + 0.01} H0.91 M0.12 ${t + 0.019} H0.88" stroke="#5A3A1F" stroke-width="0.002" opacity=".5"/>`);
    [0.24, 0.56, 0.88].forEach((s) => {
      rw.push(`<path d="M${s} ${t + 0.039} l0.022 0 l-0.02 0.034 Z" fill="#4E3319" opacity=".85"/>`);
    });
  });
  // 槽位虚线导引(与页面槽位板材一一对应)
  for (let i = 0; i < 12; i += 1) {
    const { s, t0 } = slotWallRect(i);
    rw.push(`<rect x="${s}" y="${t0}" width="${COVER_S}" height="${COVER_T}" fill="rgba(78,51,25,.13)" stroke="#6B4A2E" stroke-width="0.004" stroke-dasharray="0.012 0.01" opacity=".6"/>`);
  }
  // 海报 A(倚在第一层板,胡桃木细框 + 抽象山月画芯)
  recordWallArea.poster = 0.15 * 0.20 * WALL_UNIT_AREA;
  rw.push(`<g transform="translate(0 0.115) rotate(-2 0.695 0.39)">
    <rect x="0.615" y="0.185" width="0.16" height="0.205" fill="#4A3624"/>
    <rect x="0.621" y="0.191" width="0.148" height="0.193" fill="#F3EAD6"/>
    <rect x="0.627" y="0.197" width="0.136" height="0.15" fill="#22384A"/>
    <circle cx="0.695" cy="0.252" r="0.032" fill="#F0A93C"/>
    <path d="M0.627 0.347 L0.662 0.282 L0.688 0.33 L0.716 0.272 L0.763 0.347Z" fill="#16263A"/>
    <path d="M0.627 0.347 L0.652 0.308 L0.672 0.347Z" fill="#2F6B4E"/>
    <rect x="0.627" y="0.355" width="0.136" height="0.024" fill="#B65A38"/>
    <path d="M0.637 0.367 h0.116" stroke="#F3E7CE" stroke-width="0.005" opacity=".8"/>
  </g>`);
  // 倚靠黑胶 ×2(第二层板右端,封套+露盘)
  recordWallArea.vinyl = 2 * Math.PI * Math.pow(0.032 * 440, 2) * 0.85;
  rw.push(`<g transform="rotate(6 0.86 0.61)">
    <rect x="0.815" y="0.475" width="0.098" height="0.121" fill="#EFE3C8"/>
    <rect x="0.815" y="0.475" width="0.098" height="0.121" fill="none" stroke="#C9B48E" stroke-width="0.003"/>
    <circle cx="0.864" cy="0.536" r="0.028" fill="#C9603C" opacity=".85"/>
  </g>`);
  rw.push(`<g transform="rotate(-4 0.9 0.61)">
    <rect x="0.862" y="0.468" width="0.104" height="0.128" fill="#3B4A6B"/>
    <circle cx="0.94" cy="0.532" r="0.034" fill="#14181F"/>
    <circle cx="0.94" cy="0.532" r="0.034" fill="none" stroke="#333C48" stroke-width="0.004"/>
    <circle cx="0.94" cy="0.532" r="0.011" fill="#F0A93C"/>
  </g>`);
  // 平放唱片叠(第三层板右段,4 张错开)
  recordWallArea.stack = 4 * 0.09 * 0.018 * WALL_UNIT_AREA;
  for (let i = 0; i < 4; i += 1) {
    const x = 0.66 + i * 0.008;
    const y = 0.916 - i * 0.017;
    const colors = ['#6B3B3B', '#22384A', '#3B6B4F', '#C9821E'];
    rw.push(`<rect x="${x}" y="${y}" width="0.1" height="0.016" fill="${colors[i]}" stroke="#26221A" stroke-width="0.002"/>`);
  }
  // 小音箱(第三层板最右,炭黑 + 低音盆)
  rw.push(`<rect x="0.865" y="0.82" width="0.07" height="0.115" rx="0.008" fill="#211E18"/>
    <rect x="0.865" y="0.82" width="0.07" height="0.115" rx="0.008" fill="none" stroke="#3A3F47" stroke-width="0.003"/>
    <circle cx="0.9" cy="0.885" r="0.026" fill="#22262E" stroke="#4B5158" stroke-width="0.005"/>
    <circle cx="0.9" cy="0.885" r="0.009" fill="#F0A93C"/>
    <circle cx="0.9" cy="0.84" r="0.01" fill="#22262E" stroke="#4B5158" stroke-width="0.003"/>`);
  return rw.join('');
}

// ---- 左墙氛围与壁挂装饰 ----
function leftWall() {
  const lw = [];
  lw.push(specklesIn(160, 11, { x: 0.02, y: 0.02, w: 0.96, h: 0.96 }, 0.0012, 0.003, '#8A6A44', 0.07, 0.18));
  lw.push('<rect x="0" y="0.962" width="1" height="0.038" fill="#DECCA6"/><path d="M0 0.962 H1" stroke="#B9A37E" stroke-width="0.004"/>');
  lw.push(recordWall());
  // 品牌霓虹在微距镜头下无干净墙面容纳,移至 UI Header 承担;墙面只留收藏与装饰
  // 黄铜圆镜(暗玻璃 + 月色反光)
  lw.push(`<circle cx="0.885" cy="0.42" r="0.07" fill="#B97F2E"/>
  <circle cx="0.885" cy="0.42" r="0.07" fill="none" stroke="#8A5A1C" stroke-width="0.006"/>
  <circle cx="0.885" cy="0.42" r="0.058" fill="#22303F"/>
  <path d="M0.853 0.398 a0.048 0.048 0 0 1 0.046 -0.028" stroke="#FFE9B0" stroke-width="0.009" fill="none" opacity=".8"/>
  <circle cx="0.885" cy="0.352" r="0.006" fill="#8A5A1C"/>`);
  // 挂墙耳机
  lw.push(`<rect x="0.06" y="0.6" width="0.02" height="0.012" rx="0.005" fill="#4A3624"/>
  <path d="M0.028 0.632 a0.042 0.042 0 0 1 0.084 0" fill="none" stroke="#26221A" stroke-width="0.013"/>
  <path d="M0.032 0.632 a0.038 0.038 0 0 1 0.076 0" fill="none" stroke="#4B5158" stroke-width="0.004" opacity=".8"/>
  <rect x="0.019" y="0.626" width="0.024" height="0.05" rx="0.01" fill="#26221A"/>
  <rect x="0.097" y="0.626" width="0.024" height="0.05" rx="0.01" fill="#26221A"/>
  <path d="M0.03 0.678 q0.012 0.05 -0.008 0.09" stroke="#26221A" stroke-width="0.006" fill="none"/>`);
  // 悬挂植物(左上角,壁挂陶盆 + 垂蔓)
  lw.push(`<g>
    <path d="M0.93 0.002 L0.941 0.058 M0.982 0.002 L0.966 0.058" stroke="#6B4A2E" stroke-width="0.006"/>
    <path d="M0.924 0.058 h0.06 l-0.009 0.048 h-0.042 Z" fill="#B65A38"/>
    <rect x="0.92" y="0.052" width="0.068" height="0.013" rx="0.005" fill="#8A4A28"/>
    <path d="M0.934 0.106 q-0.012 0.06 -0.03 0.1 q-0.01 0.05 -0.024 0.08" stroke="#2F5A38" stroke-width="0.009" fill="none"/>
    <path d="M0.952 0.106 q0.005 0.07 -0.006 0.13" stroke="#3E7048" stroke-width="0.008" fill="none"/>
    <path d="M0.97 0.106 q0.014 0.05 0.02 0.1" stroke="#35663F" stroke-width="0.008" fill="none"/>
    <ellipse cx="0.917" cy="0.152" rx="0.013" ry="0.021" fill="#3E7048" transform="rotate(-24 0.917 0.152)"/>
    <ellipse cx="0.9" cy="0.235" rx="0.012" ry="0.019" fill="#2F5A38" transform="rotate(-18 0.9 0.235)"/>
    <ellipse cx="0.945" cy="0.17" rx="0.012" ry="0.02" fill="#35663F"/>
    <ellipse cx="0.986" cy="0.178" rx="0.012" ry="0.019" fill="#2F5A38" transform="rotate(16 0.986 0.178)"/>
    <ellipse cx="0.938" cy="0.096" rx="0.016" ry="0.024" fill="#3E7048"/>
    <ellipse cx="0.963" cy="0.094" rx="0.015" ry="0.022" fill="#4A8256" transform="rotate(14 0.963 0.094)"/>
  </g>`);
  return `<g transform="matrix(-480 250 0 440 414 -205)">${lw.join('')}</g>`;
}

// ---- 右墙:放映幕(关态) + 夜景窗(窗框,L2 填夜景) + 墙脚层板 ----
const SCREEN = { s0: 0.30, t0: 0.32, s1: 0.72, t1: 0.70 };
const WINDOW = { s0: 0.72, t0: 0.30, s1: 0.88, t1: 0.80 };

function rightWall() {
  const rw = [];
  rw.push(specklesIn(160, 23, { x: 0.02, y: 0.02, w: 0.96, h: 0.96 }, 0.0012, 0.003, '#8A6A44', 0.07, 0.18));
  rw.push('<rect x="0" y="0.962" width="1" height="0.038" fill="#D8C69E"/><path d="M0 0.962 H1" stroke="#B29E7C" stroke-width="0.004"/>');

  // 放映幕(胡桃木框 + 黑 bezel + 关态暗幕带一丝反光)
  rw.push(`<rect x="${SCREEN.s0 - 0.014}" y="${SCREEN.t0 - 0.014}" width="${SCREEN.s1 - SCREEN.s0 + 0.028}" height="${SCREEN.t1 - SCREEN.t0 + 0.028}" fill="#33220F"/>`);
  rw.push(`<path d="M${SCREEN.s0 - 0.014} ${SCREEN.t0 - 0.014} H${SCREEN.s1 + 0.014} M${SCREEN.s0 - 0.014} ${SCREEN.t1 + 0.014} H${SCREEN.s1 + 0.014}" stroke="#54381C" stroke-width="0.004" opacity=".8"/>`);
  rw.push(`<rect x="${SCREEN.s0}" y="${SCREEN.t0}" width="${SCREEN.s1 - SCREEN.s0}" height="${SCREEN.t1 - SCREEN.t0}" fill="url(#screenOff)"/>`);
  rw.push(`<rect x="${SCREEN.s0}" y="${SCREEN.t0}" width="${SCREEN.s1 - SCREEN.s0}" height="${SCREEN.t1 - SCREEN.t0}" fill="none" stroke="#120C06" stroke-width="0.01"/>`);
  rw.push(`<path d="M${SCREEN.s0 + 0.03} ${SCREEN.t0} L${SCREEN.s0 + 0.19} ${SCREEN.t0} L${SCREEN.s0 + 0.05} ${SCREEN.t1} L${SCREEN.s0} ${SCREEN.t1} L${SCREEN.s0} ${SCREEN.t0}Z" fill="#FFFFFF" opacity="0.035"/>`);
  rw.push(`<circle cx="${SCREEN.s1 - 0.02}" cy="${SCREEN.t1 - 0.02}" r="0.005" fill="#F0A93C"/>`); // 待机灯

  // 夜景窗:胡桃木窗框 + 十字棂 + 窗台(玻璃夜景在 L2 同位置绘制)
  const { s0, t0, s1, t1 } = WINDOW;
  rw.push(`<rect x="${s0 - 0.016}" y="${t0 - 0.016}" width="${s1 - s0 + 0.032}" height="${t1 - t0 + 0.032}" fill="#4E3319"/>`);
  rw.push(`<path d="M${s0 - 0.016} ${t0 - 0.014} H${s1 + 0.016} M${s0 - 0.016} ${t0 - 0.006} H${s1 + 0.016}" stroke="#A87B4A" stroke-width="0.003" opacity=".7"/>`);
  rw.push(`<rect x="${s0}" y="${t0}" width="${s1 - s0}" height="${t1 - t0}" fill="#0D1828"/>`);
  rw.push(`<rect x="${(s0 + s1) / 2 - 0.005}" y="${t0}" width="0.01" height="${t1 - t0}" fill="#4E3319"/>`);
  rw.push(`<rect x="${s0}" y="${(t0 + t1) / 2 - 0.006}" width="${s1 - s0}" height="0.012" fill="#4E3319"/>`);
  rw.push(`<rect x="${s0}" y="${t0}" width="${s1 - s0}" height="${t1 - t0}" fill="none" stroke="#2A1A0C" stroke-width="0.006"/>`);
  rw.push(`<rect x="${s0 - 0.024}" y="${t1 + 0.012}" width="${s1 - s0 + 0.048}" height="0.02" fill="#7A5230"/>`);
  rw.push(`<path d="M${s0 - 0.024} ${t1 + 0.014} H${s1 + 0.024}" stroke="#A87B4A" stroke-width="0.003" opacity=".8"/>`);

  // 幕下小层板 + 两只相框(固定装饰)
  rw.push(`<rect x="0.30" y="0.76" width="0.30" height="0.022" fill="#7A5230"/>
    <rect x="0.30" y="0.782" width="0.30" height="0.011" fill="#4E3319"/>
    <path d="M0.30 0.762 H0.60" stroke="#A87B4A" stroke-width="0.003" opacity=".8"/>
    <path d="M0.36 0.793 l0.018 0 l-0.015 0.026 Z M0.52 0.793 l0.018 0 l-0.015 0.026 Z" fill="#4E3319" opacity=".85"/>`);
  rw.push(`<rect x="0.325" y="0.652" width="0.088" height="0.11" fill="#4A3624"/>
    <rect x="0.332" y="0.659" width="0.074" height="0.088" fill="#C9821E"/>
    <circle cx="0.369" cy="0.7" r="0.023" fill="#26221A"/>
    <circle cx="0.369" cy="0.7" r="0.009" fill="#D9A441"/>`);
  rw.push(`<rect x="0.452" y="0.668" width="0.088" height="0.094" fill="#4A3624"/>
    <rect x="0.459" y="0.675" width="0.074" height="0.074" fill="#3B4A6B"/>
    <path d="M0.459 0.749 L0.533 0.675" stroke="#ECE2CB" stroke-width="0.009"/>
    <circle cx="0.478" cy="0.694" r="0.01" fill="#FFE9B0"/>`);
  return `<g transform="matrix(480 250 0 440 414 -205)">${rw.join('')}</g>`;
}

// ---- 地面固定件:胡桃木茶几(杂志 + 咖啡杯) + 散落黑胶 + 线材 ----
// 茶几是固定件(碰撞保留),但作为独立覆盖层输出以获得正确遮挡 z
function tableOverlay() {
  const fl = [];
  const tc = P(0.36, 0.58);
  fl.push(shadow(tc[0], tc[1] + 3, 82, 24, 0.35));
  [[0.286, 0.506], [0.42, 0.506], [0.286, 0.62], [0.42, 0.62]].forEach(([u, v]) => {
    fl.push(isoBox(u, v, 0.02, 0.02, 28, WOOD_DARK));
  });
  fl.push(isoBox(0.275, 0.495, 0.17, 0.15, 12, WOOD, 28));
  fl.push(grainTopU(0.275, 0.495, 0.17, 0.15, 40, 3));
  fl.push(`<path d="M${topPt(0.275, 0.645, 40)} L${topPt(0.445, 0.645, 40)}" stroke="#C89A66" stroke-width="1.8" opacity=".6" fill="none"/>`);
  // 杂志叠(生活痕迹 1)
  fl.push(`<path d="M${topPt(0.288, 0.585, 40)} L${topPt(0.356, 0.585, 40)} L${topPt(0.356, 0.635, 40)} L${topPt(0.288, 0.635, 40)}Z" fill="#E8DCC2"/>`);
  fl.push(`<path d="M${topPt(0.293, 0.59, 41.2)} L${topPt(0.35, 0.59, 41.2)} L${topPt(0.35, 0.63, 41.2)} L${topPt(0.293, 0.63, 41.2)}Z" fill="#B65A38"/>`);
  fl.push(`<path d="M${topPt(0.297, 0.594, 42.4)} L${topPt(0.332, 0.594, 42.4)} L${topPt(0.332, 0.62, 42.4)} L${topPt(0.297, 0.62, 42.4)}Z" fill="#3B4A6B"/>`);
  // 咖啡杯 + 碟 + 热气(生活痕迹 2)
  const cup = P(0.41, 0.555, 40);
  fl.push(`<ellipse cx="${cup[0]}" cy="${cup[1]}" rx="11" ry="4.4" fill="#E3D5BC"/>`);
  fl.push(`<rect x="${cup[0] - 7}" y="${cup[1] - 16}" width="14" height="14" rx="3" fill="#F6EFDD"/>`);
  fl.push(`<rect x="${cup[0] - 7}" y="${cup[1] - 6}" width="14" height="4" rx="2" fill="#DCC9A8"/>`);
  fl.push(`<ellipse cx="${cup[0]}" cy="${cup[1] - 16}" rx="7" ry="3.2" fill="#C9821E"/><ellipse cx="${cup[0]}" cy="${cup[1] - 16}" rx="4.6" ry="2" fill="#6B4223"/>`);
  fl.push(`<path d="M${cup[0] + 7} ${cup[1] - 12} q7 1.5 0 7" stroke="#F6EFDD" stroke-width="2.4" fill="none"/>`);
  fl.push(`<path d="M${cup[0] - 2.5} ${cup[1] - 22} q2.5 -5 0 -11 M${cup[0] + 2.5} ${cup[1] - 23} q2.5 -5 0 -11" stroke="#FFF6E8" stroke-width="1.5" opacity=".4" fill="none"/>`);
  return fl.join('');
}

// 地面散落黑胶 ×2 + 封套 + 桌下电源线(画进 L0,扁平可跨越)
function floorClutter() {
  const fl = [];
  const disc = (u, v, label, rot) => {
    const c = P(u, v);
    return `<g transform="rotate(${rot} ${c[0].toFixed(1)} ${c[1].toFixed(1)})">
      <ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="34" ry="14" fill="url(#vinylGrad)"/>
      <ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="26.5" ry="10.8" fill="none" stroke="#333C48" stroke-width="1.2" opacity=".8"/>
      <ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="18" ry="7.2" fill="none" stroke="#333C48" stroke-width="1.1" opacity=".7"/>
      <ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="9.5" ry="3.8" fill="none" stroke="#333C48" stroke-width="1" opacity=".55"/>
      <circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="6.2" fill="${label}"/><circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="1.5" fill="#F6EFDD"/>
      <path d="M${(c[0] - 26).toFixed(1)} ${(c[1] - 7).toFixed(1)} a27 11 0 0 1 17 -4.8" stroke="#E8F0FF" stroke-width="2.2" opacity=".22" fill="none"/>
    </g>`;
  };
  const sleeveC = P(0.615, 0.685);
  fl.push(`<g transform="rotate(-14 ${sleeveC[0].toFixed(1)} ${sleeveC[1].toFixed(1)})">
    <rect x="${(sleeveC[0] - 34).toFixed(1)}" y="${(sleeveC[1] - 15).toFixed(1)}" width="68" height="30" rx="2" fill="#EFE3C8"/>
    <rect x="${(sleeveC[0] - 34).toFixed(1)}" y="${(sleeveC[1] - 15).toFixed(1)}" width="68" height="30" rx="2" fill="none" stroke="#C9B48E" stroke-width="1.6"/>
    <circle cx="${sleeveC[0].toFixed(1)}" cy="${sleeveC[1].toFixed(1)}" r="9.5" fill="#C9603C" opacity=".8"/>
  </g>`);
  fl.push(disc(0.56, 0.66, '#C9603C', -24));
  fl.push(disc(0.635, 0.70, '#F0A93C', -18));
  // 桌脚电源线(生活痕迹 3:线材,沿地面走向右墙)
  const c0 = P(0.43, 0.63);
  const c1 = P(0.72, 0.30);
  const c2 = P(0.97, 0.12);
  fl.push(`<path d="M${c0[0].toFixed(1)} ${c0[1].toFixed(1)} Q${c1[0].toFixed(1)} ${(c1[1] + 26).toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}" stroke="#14100B" stroke-width="3" opacity=".5" fill="none"/>`);
  return fl.join('');
}

// 地板收边线
const FLOOR_EDGE = `<path d="M-66 485 414 235 894 485" fill="none" stroke="#3E2812" stroke-width="10" opacity=".5"/>
<path d="M414 235V735" fill="none" stroke="#3E2812" stroke-width="10" opacity=".45"/>
<path d="M-66 485 414 735 894 485" fill="none" stroke="#F6ECCE" stroke-width="4" opacity=".15"/>`;

// 房外角落:极暗蓝 + 疏星(画布 24% 的房外区域,克制不抢戏)
const NIGHT_CORNERS = (() => {
  const stars = [[40, 700, 1.6], [90, 760, 1.2], [770, 720, 1.5], [800, 660, 1.1], [30, 120, 1.3], [790, 90, 1.4], [60, 60, 1.1], [760, 790, 1.2]];
  return stars.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF6D8" opacity=".5"/>`).join('');
})();

function buildL0() {
  return wrap([
    NIGHT_CORNERS,
    ROOM_SHELL,
    floorPlanks(),
    leftWall(),
    rightWall(),
    floorClutter(),
    FLOOR_EDGE
  ].join('\n'));
}

// ================= L1 环境阴影(AO/接触阴影/暗角,黑色 alpha 层) =================
function buildL1() {
  const g = [];
  // 两面墙与地板交界 AO + 墙角竖向 AO + 墙顶自然暗(裁剪在房体内)
  g.push(`<g clip-path="url(#roomClip)">
    <rect x="-66" y="45" width="130" height="640" fill="url(#aoCorner)" opacity=".8"/>
    <path d="M414 235 L414 735 L394 735 L394 235Z" fill="#1E1006" opacity=".10" filter="url(#soft)"/>
    <path d="M-66 485 414 235 894 485 894 520 414 270 -66 520Z" fill="#1E1006" opacity=".18" filter="url(#soft)"/>
    <rect x="-66" y="45" width="960" height="150" fill="#1E1006" opacity=".12" filter="url(#softBig)"/>
  </g>`);
  // 层板下投影(三层,墙面上)
  [0.50, 0.72, 0.94].forEach((t) => {
    g.push(`<g transform="matrix(-480 250 0 440 414 -205)"><rect x="0.06" y="${t + 0.039}" width="0.88" height="0.05" fill="#2A1808" opacity=".22" filter="url(#wsoft)"/></g>`);
  });
  // 幕框/窗框落影
  g.push(`<g transform="matrix(480 250 0 440 414 -205)">
    <rect x="${SCREEN.s0 - 0.03}" y="${SCREEN.t1 + 0.02}" width="${SCREEN.s1 - SCREEN.s0 + 0.06}" height="0.06" fill="#2A1808" opacity=".2" filter="url(#wsoft)"/>
    <rect x="${WINDOW.s0 - 0.02}" y="${WINDOW.t1 + 0.03}" width="${WINDOW.s1 - WINDOW.s0 + 0.04}" height="0.05" fill="#2A1808" opacity=".2" filter="url(#wsoft)"/>
  </g>`);
  // 全局暗角(房外四角更重)
  g.push('<rect width="828" height="828" fill="url(#vig)"/>');
  return wrap(`<g clip-path="url(#canvasClip)">${g.join('')}</g>`, false);
}

// ================= L2 窗外夜景 + 冷蓝溢光 =================
function buildL2() {
  const g = [];
  const { s0, t0, s1, t1 } = WINDOW;
  // 窗内夜景:夜空 + 星 + 月 + 城市剪影亮窗 + 玻璃反光
  const win = [];
  win.push(`<rect x="${s0}" y="${t0}" width="${s1 - s0}" height="${t1 - t0}" fill="url(#winSky)"/>`);
  win.push(specklesIn(22, 47, { x: s0 + 0.01, y: t0 + 0.02, w: s1 - s0 - 0.02, h: 0.2 }, 0.0012, 0.003, '#FFF6D8', 0.3, 0.85));
  win.push(`<circle cx="${s0 + 0.105}" cy="${t0 + 0.1}" r="0.075" fill="url(#moonGlow)"/>`);
  win.push(`<circle cx="${s0 + 0.105}" cy="${t0 + 0.1}" r="0.036" fill="#FFE9B0"/>`);
  win.push(`<circle cx="${s0 + 0.094}" cy="${t0 + 0.09}" r="0.006" fill="#F0D18A" opacity=".8"/><circle cx="${s0 + 0.115}" cy="${t0 + 0.112}" r="0.004" fill="#F0D18A" opacity=".7"/>`);
  win.push(`<ellipse cx="${s0 + 0.05}" cy="${t0 + 0.13}" rx="0.055" ry="0.008" fill="#0E2240" opacity=".6" filter="url(#wsoft)"/>`);
  // 城市剪影 + 亮窗
  const horizon = t0 + (t1 - t0) * 0.62;
  win.push(`<path d="M${s0} ${horizon} V${horizon - 0.09} h0.018 V${horizon - 0.15} h0.024 V${horizon - 0.05} h0.02 V${horizon - 0.19} h0.026 V${horizon - 0.08} h0.018 V${horizon - 0.13} h0.022 V${horizon - 0.04} h0.02 V${horizon} Z" fill="#081222"/>`);
  const litWins = [[0.012, 0.1], [0.024, 0.13], [0.042, 0.07], [0.055, 0.11], [0.078, 0.05], [0.09, 0.09], [0.108, 0.03], [0.118, 0.12], [0.132, 0.08]];
  win.push(`<g fill="#FFC46B" opacity=".92">${litWins.map(([dx, dy]) => `<rect x="${s0 + dx}" y="${horizon - dy - 0.02}" width="0.004" height="0.006"/>`).join('')}</g>`);
  win.push(`<rect x="${s0}" y="${horizon}" width="${s1 - s0}" height="${t1 - horizon}" fill="url(#winSea)"/>`);
  // 月光倒影碎金
  [[0.02, 0.028, 0.7], [0.045, 0.04, 0.6], [0.075, 0.052, 0.5], [0.11, 0.062, 0.4], [0.15, 0.07, 0.3]].forEach(([dy, w, o]) => {
    win.push(`<path d="M${(s0 + 0.105 - w / 2).toFixed(3)} ${(horizon + dy).toFixed(3)} h${w.toFixed(3)}" stroke="#FFE9B0" stroke-width="0.005" opacity="${o}"/>`);
  });
  // 玻璃反光(玻璃材质线索)
  win.push(`<path d="M${s0 + 0.03} ${t0} L${s0 + 0.1} ${t0} L${s0 + 0.04} ${t1} L${s0} ${t1} L${s0} ${t0}Z" fill="#CFE4F6" opacity="0.08"/>`);
  g.push(`<g transform="matrix(480 250 0 440 414 -205)"><clipPath id="winClip"><rect x="${s0}" y="${t0}" width="${s1 - s0}" height="${t1 - t0}"/></clipPath><g clip-path="url(#winClip)">${win.join('')}</g></g>`);
  // 冷光溢入:窗下墙面冷晖 + 地板冷光洒(平行四边形,斜向室内)
  g.push(`<g transform="matrix(480 250 0 440 414 -205)"><rect x="${s0 - 0.05}" y="${t1}" width="${s1 - s0 + 0.1}" height="0.16" fill="url(#coolWall)"/></g>`);
  const sp0 = P(0.98, 0.28);
  const sp1 = P(0.72, 0.28);
  const sp2 = P(0.55, 0.62);
  const sp3 = P(0.85, 0.68);
  g.push(`<g clip-path="url(#floorClip)"><path d="M${sp0[0].toFixed(1)} ${sp0[1].toFixed(1)} L${sp1[0].toFixed(1)} ${sp1[1].toFixed(1)} L${sp2[0].toFixed(1)} ${sp2[1].toFixed(1)} L${sp3[0].toFixed(1)} ${sp3[1].toFixed(1)}Z" fill="url(#coolSpill)" filter="url(#soft)"/></g>`);
  // 幕框边缘冷反光(微弱,呼应放映墙冷调)
  g.push(`<g transform="matrix(480 250 0 440 414 -205)"><rect x="${SCREEN.s0 - 0.01}" y="${SCREEN.t0 - 0.01}" width="${SCREEN.s1 - SCREEN.s0 + 0.02}" height="0.05" fill="#9CC8EE" opacity=".07"/></g>`);
  return wrap(`<g clip-path="url(#canvasClip)">${g.join('')}</g>`, false);
}

// ================= L3 室内暖光洗(2700K 主层,加性) =================
// 家具受光按 lightResponse.warm 烘焙:每件地面家具位置一个暖光斑
function buildL3(furnitureMeta) {
  const g = [];
  // 全屋暖洗:墙/地大范围柔光(光源左上)
  g.push(`<g clip-path="url(#roomClip)">
    <ellipse cx="380" cy="380" rx="520" ry="420" fill="url(#warmWash)"/>
    <path d="M-66 45 414 -205 414 235 -66 485Z" fill="url(#warmWallL)"/>
    <path d="M414 -205 894 45 894 485 414 235Z" fill="url(#warmWallR)"/>
  </g>`);
  // 地板受光池(房间中心偏左,主光方向)
  g.push(`<g clip-path="url(#floorClip)">
    <ellipse cx="400" cy="520" rx="330" ry="130" fill="#FFC46B" opacity=".16" filter="url(#softBig)"/>
  </g>`);
  // 家具受光斑(warm 系数 → 不透明度;emissive 高的家具反而少受环境光)
  furnitureMeta.forEach((f) => {
    if (!f.glowAt) return;
    const [cx, cy, r] = f.glowAt;
    const op = Math.min(0.4, 0.34 * f.lightResponse.warm * (1 - 0.5 * f.lightResponse.emissive));
    g.push(`<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${(r * 0.62).toFixed(1)}" fill="#FFC46B" opacity="${op.toFixed(3)}" filter="url(#softBig)"/>`);
  });
  return wrap(`<g clip-path="url(#canvasClip)">${g.join('')}</g>`, false);
}

// ================= L4 层板暖边(唱片墙 LED 灯带,常开弱) =================
function buildL4() {
  const g = [];
  SHELVES.forEach((t) => {
    g.push(`<g transform="matrix(-480 250 0 440 414 -205)">
      <rect x="0.06" y="${t + 0.039}" width="0.88" height="0.09" fill="url(#ledGrad)"/>
      <path d="M0.06 ${t + 0.039} H0.94" stroke="#FFCF8E" stroke-width="0.004" opacity=".7"/>
    </g>`);
  });
  // 唱片墙整体淡暖晕
  g.push(`<g transform="matrix(-480 250 0 440 414 -205)"><ellipse cx="0.5" cy="0.62" rx="0.52" ry="0.3" fill="#FFBE5A" opacity=".08" filter="url(#wbig)"/></g>`);
  return wrap(`<g clip-path="url(#canvasClip)">${g.join('')}</g>`, false);
}

// ================= L5 落地灯光池 =================
function buildL5() {
  const b = P(0.9, 0.36);       // 灯座
  const sx = b[0] - 128;        // 灯罩中心(弧形伸向左)
  const sy = b[1] - 192;
  const g = [];
  // 地板椭圆光池 + 光锥 + 灯罩发光 + 周围暖晕
  g.push(`<ellipse cx="${sx.toFixed(1)}" cy="${(b[1] - 40).toFixed(1)}" rx="150" ry="52" fill="url(#lampPool)"/>`);
  g.push(`<path d="M${(sx - 20).toFixed(1)} ${(sy + 30).toFixed(1)} L${(sx + 20).toFixed(1)} ${(sy + 38).toFixed(1)} L${(sx + 72).toFixed(1)} ${(b[1] - 12).toFixed(1)} L${(sx - 78).toFixed(1)} ${(b[1] - 24).toFixed(1)} Z" fill="#FFE2B0" opacity=".18" filter="url(#soft)"/>`);
  g.push(`<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="86" fill="#FFD9A0" opacity=".38" filter="url(#softBig)"/>`);
  g.push(`<circle cx="${sx.toFixed(1)}" cy="${(sy + 10).toFixed(1)}" r="22" fill="#FFE9A8" opacity=".9" filter="url(#soft)"/>`);
  // 光池内的家具暖反射(茶几右沿/地毯)
  g.push(`<ellipse cx="${(sx + 30).toFixed(1)}" cy="${(b[1] - 24).toFixed(1)}" rx="60" ry="18" fill="#FFCF8E" opacity=".2" filter="url(#soft)"/>`);
  return wrap(`<g clip-path="url(#canvasClip)">${g.join('')}</g>`, false);
}

// ================= L6 角色暖薄纱(罩在角色之上,低 alpha) =================
function buildL6() {
  // 覆盖角色活动区(地板中前部)的柔和暖薄纱,左上亮右下衰;裁剪在地板内,不溢到房外夜景
  return wrap(`<g clip-path="url(#floorClip)">
  <path d="M60 320 L560 240 L760 560 L180 700Z" fill="url(#veilGrad)" opacity=".28" filter="url(#softBig)"/>
  <ellipse cx="420" cy="520" rx="360" ry="200" fill="#FFC27A" opacity=".10" filter="url(#softBig)"/>
</g>`, false);
}

// ================= L7 放映光束 + 幕布发光画面 =================
function buildL7() {
  const g = [];
  const { s0, t0, s1, t1 } = SCREEN;
  // 幕布发光画面:海景夜色(与 L2 窗景呼应但更亮,投影内容)
  const pic = [];
  pic.push(`<rect x="${s0}" y="${t0}" width="${s1 - s0}" height="${t1 - t0}" fill="url(#screenOn)"/>`);
  pic.push(specklesIn(30, 31, { x: s0 + 0.02, y: t0 + 0.02, w: s1 - s0 - 0.04, h: 0.16 }, 0.0012, 0.003, '#FFF6D8', 0.35, 0.9));
  pic.push(`<circle cx="${s0 + 0.3}" cy="${t0 + 0.1}" r="0.09" fill="url(#moonGlow)"/>`);
  pic.push(`<circle cx="${s0 + 0.3}" cy="${t0 + 0.1}" r="0.042" fill="#FFE9B0"/>`);
  const hor = t0 + (t1 - t0) * 0.58;
  pic.push(`<path d="M${s0} ${hor} V${hor - 0.07} h0.03 V${hor - 0.13} h0.04 V${hor - 0.05} h0.03 V${hor - 0.17} h0.05 V${hor - 0.07} h0.04 V${hor - 0.11} h0.05 V${hor - 0.04} h0.04 V${hor - 0.09} h0.04 V${hor} Z" fill="#0A1626"/>`);
  const lw2 = [[0.02, 0.05], [0.05, 0.09], [0.09, 0.04], [0.14, 0.11], [0.19, 0.06], [0.24, 0.03], [0.3, 0.08], [0.35, 0.05], [0.39, 0.1]];
  pic.push(`<g fill="#FFC46B" opacity=".95">${lw2.map(([dx, dy]) => `<rect x="${s0 + dx}" y="${hor - dy - 0.02}" width="0.006" height="0.009"/>`).join('')}</g>`);
  pic.push(`<rect x="${s0}" y="${hor}" width="${s1 - s0}" height="${t1 - hor}" fill="#0D1F33"/>`);
  [[0.02, 0.06, 0.65], [0.05, 0.09, 0.55], [0.09, 0.12, 0.45], [0.14, 0.14, 0.35]].forEach(([dy, w, o]) => {
    pic.push(`<path d="M${(s0 + 0.3 - w / 2).toFixed(3)} ${(hor + dy).toFixed(3)} h${w.toFixed(3)}" stroke="#FFE9B0" stroke-width="0.006" opacity="${o}"/>`);
  });
  // 幕布辉光(框外晕)
  g.push(`<g transform="matrix(480 250 0 440 414 -205)"><rect x="${s0 - 0.06}" y="${t0 - 0.06}" width="${s1 - s0 + 0.12}" height="${t1 - t0 + 0.12}" fill="url(#screenGlow)" filter="url(#wbig)"/></g>`);
  g.push(`<g transform="matrix(480 250 0 440 414 -205)"><clipPath id="scrClip"><rect x="${s0}" y="${t0}" width="${s1 - s0}" height="${t1 - t0}"/></clipPath><g clip-path="url(#scrClip)">${pic.join('')}</g></g>`);
  // 锥形光束:放映机镜头 → 幕布(屏幕空间三角锥,两层叠加出体积感)
  const lens = P(0.308, 0.562, 58);
  const scrA = RW(s0 + 0.02, t0 + 0.02);
  const scrB = RW(s1 - 0.02, t0 + 0.06);
  const scrC = RW(s1 - 0.04, t1 - 0.03);
  const scrD = RW(s0 + 0.03, t1 - 0.02);
  g.push(`<path d="M${lens[0].toFixed(1)} ${lens[1].toFixed(1)} L${scrB[0].toFixed(1)} ${scrB[1].toFixed(1)} L${scrC[0].toFixed(1)} ${scrC[1].toFixed(1)} L${scrD[0].toFixed(1)} ${scrD[1].toFixed(1)} L${scrA[0].toFixed(1)} ${scrA[1].toFixed(1)} Z" fill="url(#beamGrad)" opacity=".5" filter="url(#soft)"/>`);
  g.push(`<path d="M${lens[0].toFixed(1)} ${lens[1].toFixed(1)} L${((scrB[0] + scrC[0]) / 2).toFixed(1)} ${((scrB[1] + scrC[1]) / 2).toFixed(1)} L${((scrC[0] + scrD[0]) / 2).toFixed(1)} ${((scrC[1] + scrD[1]) / 2).toFixed(1)} Z" fill="#FFF4DC" opacity=".16" filter="url(#soft)"/>`);
  // 镜头亮点
  g.push(`<circle cx="${lens[0].toFixed(1)}" cy="${lens[1].toFixed(1)}" r="7" fill="#DFF8FF" opacity=".95" filter="url(#wsoft)"/>`);
  return wrap(`<g clip-path="url(#canvasClip)">${g.join('')}</g>`, false);
}

// ================= 家具覆盖层(新几何重绘,材质六族可区分) =================
const OVERLAYS = {
  // 橙褐布艺沙发:织物 —— 柔和渐变 + 软包卷边 + 织纹细线 + 靠枕抱枕 + 搭毯
  sofa() {
    let s = shadow(P(0.11, 0.47)[0] + 8, P(0.11, 0.47)[1] + 6, 140, 36, 0.36);
    [[0.03, 0.332], [0.152, 0.332], [0.03, 0.542], [0.152, 0.542]].forEach(([u, v]) => {
      s += isoBox(u, v, 0.024, 0.024, 10, WOOD_DARK);
    });
    s += isoBox(0.02, 0.32, 0.16, 0.26, 38, FAB, 10);
    s += isoBox(0.02, 0.30, 0.05, 0.30, 74, FAB, 10);
    s += isoBox(0.02, 0.30, 0.16, 0.05, 48, FAB, 10);
    s += isoBox(0.02, 0.55, 0.16, 0.05, 48, FAB, 10);
    s += isoBox(0.07, 0.355, 0.11, 0.095, 12, CUSH, 48);
    s += isoBox(0.07, 0.455, 0.11, 0.095, 12, CUSH, 48);
    // 织纹:坐垫/靠背表面细横线(低透明)
    s += `<path d="M${topPt(0.075, 0.38, 60)} L${topPt(0.175, 0.38, 60)} M${topPt(0.075, 0.42, 60)} L${topPt(0.175, 0.42, 60)} M${topPt(0.075, 0.48, 60)} L${topPt(0.175, 0.48, 60)} M${topPt(0.075, 0.52, 60)} L${topPt(0.175, 0.52, 60)}" stroke="#A86430" stroke-width="1" opacity=".22" fill="none"/>`;
    // 斜倚靠枕
    [[P(0.075, 0.395, 76), -16], [P(0.075, 0.5, 76), -10]].forEach(([pc, rot]) => {
      s += `<g transform="rotate(${rot} ${pc[0].toFixed(1)} ${pc[1].toFixed(1)})">
        <rect x="${(pc[0] - 26).toFixed(1)}" y="${(pc[1] - 22).toFixed(1)}" width="52" height="44" rx="15" fill="#E7A964"/>
        <rect x="${(pc[0] - 19).toFixed(1)}" y="${(pc[1] - 15).toFixed(1)}" width="38" height="30" rx="10" fill="none" stroke="#C97C3C" stroke-width="1.8" opacity=".7"/>
        <path d="M${(pc[0] - 20).toFixed(1)} ${(pc[1] + 17).toFixed(1)} q20 7 40 0" stroke="#B26A30" stroke-width="2.6" opacity=".5" fill="none"/>
      </g>`;
    });
    // 软包卷边
    const roll = (a, b, w, color) => `<path d="M${pt(a[0], a[1], a[2])} L${pt(b[0], b[1], b[2])}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
    s += roll([0.045, 0.315, 84], [0.045, 0.585, 84], 17, '#E8AC66');
    s += roll([0.035, 0.325, 58], [0.165, 0.325, 58], 14, '#E8AC66');
    s += roll([0.035, 0.575, 58], [0.165, 0.575, 58], 14, '#E8AC66');
    s += roll([0.178, 0.362, 57], [0.178, 0.443, 57], 12, '#E5A862');
    s += roll([0.178, 0.462, 57], [0.178, 0.543, 57], 12, '#E5A862');
    s += `<path d="M${topPt(0.07, 0.4525, 60)} L${topPt(0.18, 0.4525, 60)}" stroke="#A86430" stroke-width="1.6" opacity=".65" fill="none"/>`;
    // 琥珀抱枕
    const pc = P(0.135, 0.515, 68);
    s += `<g transform="rotate(18 ${pc[0].toFixed(1)} ${pc[1].toFixed(1)})">
      <rect x="${(pc[0] - 14).toFixed(1)}" y="${(pc[1] - 11).toFixed(1)}" width="28" height="22" rx="10" fill="#F0A93C"/>
      <path d="M${pc[0].toFixed(1)} ${(pc[1] - 10).toFixed(1)} q-3 11 0 21" stroke="#D98A1E" stroke-width="1.6" fill="none" opacity=".8"/>
    </g>`;
    // 搭毯(越过近扶手垂下)
    const b0 = P(0.085, 0.572, 60);
    const b1 = P(0.155, 0.572, 60);
    const b2 = P(0.16, 0.616, 24);
    const b3 = P(0.085, 0.616, 24);
    s += `<path d="M${b0[0].toFixed(1)} ${b0[1].toFixed(1)} L${b1[0].toFixed(1)} ${b1[1].toFixed(1)} L${b2[0].toFixed(1)} ${b2[1].toFixed(1)} q-6 4 -12 0 q-7 3 -13 -1 L${b3[0].toFixed(1)} ${b3[1].toFixed(1)} q-4 -4 -5 -8 Z" fill="#EFE3C4"/>`;
    s += `<path d="M${(b0[0] + 11).toFixed(1)} ${(b0[1] + 4).toFixed(1)} L${(b2[0] - 11).toFixed(1)} ${(b2[1] + 3).toFixed(1)} M${(b0[0] + 21).toFixed(1)} ${(b0[1] + 7).toFixed(1)} L${(b2[0] - 3).toFixed(1)} ${(b2[1] + 3).toFixed(1)}" stroke="#C9603C" stroke-width="2.6" opacity=".8" fill="none"/>`;
    return s;
  },

  // 唱机 + Hi-Fi 胡桃木柜(主锚点):木纹方向 + 玻璃门唱片格 + 黑胶唱盘 + 金属唱臂 + 书架箱 ×2
  'vinyl-player'() {
    let s = shadow(P(0.69, 0.11)[0], P(0.69, 0.11)[1] + 3, 170, 32, 0.33);
    [[0.432, 0.032], [0.922, 0.032], [0.432, 0.14], [0.922, 0.14]].forEach(([u, v]) => {
      s += isoBox(u, v, 0.026, 0.026, 12, WOOD_DARK);
    });
    s += isoBox(0.42, 0.02, 0.54, 0.16, 82, WOOD, 12); // 柜体(顶 94)
    s += grainTopU(0.42, 0.02, 0.54, 0.16, 94, 4);
    s += `<path d="M${topPt(0.42, 0.18, 94)} L${topPt(0.96, 0.18, 94)}" stroke="#C89A66" stroke-width="2" opacity=".55" fill="none"/>`;
    // 前面板左:玻璃门唱片格(玻璃材质:深色玻璃 + 斜反光 + 内部书脊隐约可见)
    s += `<path d="M${pt(0.45, 0.18, 80)} L${pt(0.615, 0.18, 80)} L${pt(0.615, 0.18, 18)} L${pt(0.45, 0.18, 18)}Z" fill="#170E06"/>`;
    const spines = ['#3B4A6B', '#6B3B3B', '#3B6B4F', '#6B5A3B', '#4F3B6B', '#2F5D6B', '#B65A38', '#C9821E', '#5A3A5E', '#22384A'];
    for (let i = 0; i < 10; i += 1) {
      if (i === 6) continue;
      const u = 0.456 + i * 0.0155;
      const top = 66 - (i % 3) * 5 - ((i * 7) % 6);
      s += `<path d="M${pt(u, 0.181, 20)} L${pt(u, 0.181, top)}" stroke="${spines[i]}" stroke-width="6" opacity=".8" fill="none"/>`;
    }
    s += `<path d="M${pt(0.45, 0.182, 80)} L${pt(0.615, 0.182, 80)} L${pt(0.615, 0.182, 18)} L${pt(0.45, 0.182, 18)}Z" fill="url(#glassDark)"/>`;
    s += `<path d="M${pt(0.47, 0.183, 80)} L${pt(0.5, 0.183, 80)} L${pt(0.465, 0.183, 18)} L${pt(0.45, 0.183, 18)}Z" fill="#CFE4F6" opacity=".14"/>`;
    s += `<path d="M${pt(0.45, 0.184, 80)} L${pt(0.615, 0.184, 80)} L${pt(0.615, 0.184, 18)} L${pt(0.45, 0.184, 18)}Z" fill="none" stroke="#6B4A2E" stroke-width="1.6"/>`;
    // 前面板右:对开木门(木纹竖线 + 黄铜拉手)
    [[0.648, 0.782], [0.798, 0.932]].forEach(([du0, du1]) => {
      s += `<path d="M${pt(du0, 0.18, 81)} L${pt(du1, 0.18, 81)} L${pt(du1, 0.18, 15)} L${pt(du0, 0.18, 15)}Z" fill="#633F22" stroke="#3E2712" stroke-width="1.4"/>`;
      [0.25, 0.5, 0.75].forEach((f) => {
        const u = du0 + (du1 - du0) * f;
        s += `<path d="M${pt(u, 0.181, 76)} L${pt(u, 0.181, 21)}" stroke="#54351C" stroke-width="1.3" opacity=".7" fill="none"/>`;
      });
      s += `<path d="M${pt(du0 + 0.01, 0.1815, 79)} L${pt(du1 - 0.01, 0.1815, 79)}" stroke="#8A5A30" stroke-width="1.2" opacity=".5" fill="none"/>`;
    });
    [0.786, 0.794].forEach((u) => {
      const k = P(u, 0.183, 47);
      s += `<circle cx="${k[0].toFixed(1)}" cy="${k[1].toFixed(1)}" r="3" fill="#D9A441"/>`;
    });
    // 唱机:炭黑唱盘座 + 唱盘(黑胶同心纹 + 弧形高光) + 金属唱臂(冷色锐利小高光)
    s += isoBox(0.46, 0.04, 0.17, 0.11, 18, CHAR, 94);
    s += `<path d="M${topPt(0.46, 0.15, 112)} L${topPt(0.63, 0.15, 112)}" stroke="#57503F" stroke-width="1.6" opacity=".7" fill="none"/>`;
    const led = P(0.615, 0.142, 106);
    s += `<circle cx="${led[0].toFixed(1)}" cy="${led[1].toFixed(1)}" r="1.8" fill="#F0A93C"/>`;
    const pl = P(PLATTER_POS.u, PLATTER_POS.v, PLATTER_POS.h);
    s += `<ellipse cx="${pl[0].toFixed(1)}" cy="${pl[1].toFixed(1)}" rx="38" ry="16" fill="url(#vinylGrad)"/>
      <ellipse cx="${pl[0].toFixed(1)}" cy="${pl[1].toFixed(1)}" rx="30" ry="12.4" fill="none" stroke="#333C48" stroke-width="1.2" opacity=".85"/>
      <ellipse cx="${pl[0].toFixed(1)}" cy="${pl[1].toFixed(1)}" rx="21" ry="8.6" fill="none" stroke="#333C48" stroke-width="1.1" opacity=".75"/>
      <ellipse cx="${pl[0].toFixed(1)}" cy="${pl[1].toFixed(1)}" rx="12" ry="4.8" fill="none" stroke="#333C48" stroke-width="1" opacity=".6"/>
      <circle cx="${pl[0].toFixed(1)}" cy="${pl[1].toFixed(1)}" r="7" fill="#D9A441"/><circle cx="${pl[0].toFixed(1)}" cy="${pl[1].toFixed(1)}" r="2" fill="#F6EFDD"/>
      <path d="M${(pl[0] - 30).toFixed(1)} ${(pl[1] - 8.5).toFixed(1)} a31 13 0 0 1 18 -5.5" stroke="#E8F0FF" stroke-width="2.4" opacity=".25" fill="none"/>`;
    const armBase = P(0.6, 0.055, 112);
    const armTip = P(0.545, 0.092, 116);
    s += `<path d="M${armBase[0].toFixed(1)} ${armBase[1].toFixed(1)} L${armTip[0].toFixed(1)} ${armTip[1].toFixed(1)}" stroke="#C9CDD4" stroke-width="4" fill="none"/>
      <path d="M${(armBase[0] - 1.5).toFixed(1)} ${(armBase[1] - 1.5).toFixed(1)} L${(armTip[0] - 1.5).toFixed(1)} ${(armTip[1] - 1.5).toFixed(1)}" stroke="#8B96AC" stroke-width="1.4" fill="none"/>
      <circle cx="${armBase[0].toFixed(1)}" cy="${armBase[1].toFixed(1)}" r="5.5" fill="#8B96AC" stroke="#C9CDD4" stroke-width="1.6"/>
      <circle cx="${(armBase[0] + 7).toFixed(1)}" cy="${(armBase[1] + 1.5).toFixed(1)}" r="3.6" fill="#4B5158"/>
      <circle cx="${(armBase[0] - 2).toFixed(1)}" cy="${(armBase[1] - 2).toFixed(1)}" r="1.4" fill="#FFFFFF" opacity=".9"/>
      <rect x="${(armTip[0] - 5.5).toFixed(1)}" y="${(armTip[1] - 1.5).toFixed(1)}" width="10" height="5.5" rx="2" fill="#26221A" transform="rotate(38 ${armTip[0].toFixed(1)} ${armTip[1].toFixed(1)})"/>`;
    // 书架音箱 ×2(炭黑箱体 + 低音盆琥珀心 + 高音)
    [0.67, 0.8].forEach((u) => {
      s += isoBox(u, 0.045, 0.08, 0.09, 46, CHAR, 94);
      s += `<path d="M${pt(u + 0.006, 0.136, 134)} L${pt(u + 0.074, 0.136, 134)} L${pt(u + 0.074, 0.136, 100)} L${pt(u + 0.006, 0.136, 100)}Z" fill="#100D09"/>`;
      const cone = P(u + 0.04, 0.137, 112);
      s += `<circle cx="${cone[0].toFixed(1)}" cy="${cone[1].toFixed(1)}" r="9.5" fill="#22262E" stroke="#4B5158" stroke-width="2"/>
        <circle cx="${cone[0].toFixed(1)}" cy="${cone[1].toFixed(1)}" r="3" fill="#F0A93C"/>`;
      const tw = P(u + 0.04, 0.137, 127);
      s += `<circle cx="${tw[0].toFixed(1)}" cy="${tw[1].toFixed(1)}" r="3.6" fill="#22262E" stroke="#4B5158" stroke-width="1.4"/>`;
      s += `<path d="M${topPt(u, 0.135, 140)} L${topPt(u + 0.08, 0.135, 140)}" stroke="#57503F" stroke-width="1.4" opacity=".6" fill="none"/>`;
    });
    return s;
  },

  // 弧形落地灯:金属灯杆(冷色 + 锐利小高光) + 半透灯罩(发光体)
  lamp() {
    const b = P(0.9, 0.36);
    const sx = b[0] - 128;
    const sy = b[1] - 192;
    return `<ellipse cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" rx="26" ry="11" fill="#211D17"/><ellipse cx="${(b[0] - 3).toFixed(1)}" cy="${(b[1] - 2).toFixed(1)}" rx="16" ry="6" fill="#3A352B"/>`
      + `<path d="M${b[0].toFixed(1)} ${(b[1] - 6).toFixed(1)} C${(b[0] - 9).toFixed(1)} ${(b[1] - 198).toFixed(1)} ${(b[0] - 90).toFixed(1)} ${(b[1] - 228).toFixed(1)} ${(b[0] - 128).toFixed(1)} ${(b[1] - 222).toFixed(1)}" stroke="#2A2620" stroke-width="10" fill="none"/>`
      + `<path d="M${(b[0] - 2).toFixed(1)} ${(b[1] - 8).toFixed(1)} C${(b[0] - 11).toFixed(1)} ${(b[1] - 196).toFixed(1)} ${(b[0] - 91).toFixed(1)} ${(b[1] - 225).toFixed(1)} ${(b[0] - 129).toFixed(1)} ${(b[1] - 220).toFixed(1)}" stroke="#57503F" stroke-width="2.6" fill="none" opacity=".85"/>`
      + `<circle cx="${(b[0] - 40).toFixed(1)}" cy="${(b[1] - 160).toFixed(1)}" r="2.2" fill="#D4D8DE" opacity=".9"/>`
      + `<path d="M${(b[0] - 146).toFixed(1)} ${(b[1] - 224).toFixed(1)} l46 9 -9 38 -46 -9Z" fill="url(#shadeGrad)" stroke="#C9821E" stroke-width="3.4"/>`
      + `<ellipse cx="${(sx - 3).toFixed(1)}" cy="${(sy + 34).toFixed(1)}" rx="19" ry="6.5" fill="#FFE9A8" opacity=".95"/>`;
  },

  // 陶盆绿植 ×2:主盆(阔叶)+ 副盆(垂蔓)
  plant() {
    const leaf = P(0.095, 0.795, 36);
    let s = shadow(P(0.095, 0.795)[0], P(0.095, 0.795)[1], 44, 16, 0.3);
    s += `<path d="M${pt(0.048, 0.842, 36)} L${pt(0.142, 0.842, 36)} L${pt(0.128, 0.828, 0)} L${pt(0.062, 0.828, 0)}Z" fill="url(#terraLeft)"/>`;
    s += `<path d="M${pt(0.142, 0.842, 36)} L${pt(0.142, 0.748, 36)} L${pt(0.128, 0.766, 0)} L${pt(0.128, 0.828, 0)}Z" fill="url(#terraRight)"/>`;
    s += `<path d="M${pt(0.048, 0.748, 36)} L${pt(0.142, 0.748, 36)} L${pt(0.128, 0.766, 0)} L${pt(0.062, 0.766, 0)}Z" fill="#7A3E20"/>`;
    s += isoBox(0.041, 0.741, 0.108, 0.108, 6, TERRA, 30);
    s += `<path d="M${topPt(0.054, 0.754, 36)} L${topPt(0.136, 0.754, 36)} L${topPt(0.136, 0.836, 36)} L${topPt(0.054, 0.836, 36)}Z" fill="#3A2413"/>`;
    s += `<ellipse cx="${(leaf[0] - 20).toFixed(1)}" cy="${(leaf[1] - 36).toFixed(1)}" rx="16" ry="32" fill="#2F5A38" transform="rotate(-26 ${(leaf[0] - 20).toFixed(1)} ${(leaf[1] - 36).toFixed(1)})"/>
      <ellipse cx="${(leaf[0] + 17).toFixed(1)}" cy="${(leaf[1] - 42).toFixed(1)}" rx="14" ry="35" fill="#3E7048" transform="rotate(20 ${(leaf[0] + 17).toFixed(1)} ${(leaf[1] - 42).toFixed(1)})"/>
      <ellipse cx="${(leaf[0] - 3).toFixed(1)}" cy="${(leaf[1] - 56).toFixed(1)}" rx="13.5" ry="32" fill="#35663F" transform="rotate(-4 ${(leaf[0] - 3).toFixed(1)} ${(leaf[1] - 56).toFixed(1)})"/>
      <ellipse cx="${(leaf[0] + 32).toFixed(1)}" cy="${(leaf[1] - 24).toFixed(1)}" rx="11" ry="25" fill="#2F5A38" transform="rotate(38 ${(leaf[0] + 32).toFixed(1)} ${(leaf[1] - 24).toFixed(1)})"/>
      <ellipse cx="${(leaf[0] - 35).toFixed(1)}" cy="${(leaf[1] - 18).toFixed(1)}" rx="11" ry="23" fill="#3E7048" transform="rotate(-42 ${(leaf[0] - 35).toFixed(1)} ${(leaf[1] - 18).toFixed(1)})"/>
      <path d="M${(leaf[0] - 3).toFixed(1)} ${(leaf[1] - 32).toFixed(1)} L${(leaf[0] - 4).toFixed(1)} ${(leaf[1] - 76).toFixed(1)}" stroke="#24452C" stroke-width="1.7" opacity=".6" fill="none"/>
      <path d="M${(leaf[0] + 14).toFixed(1)} ${(leaf[1] - 20).toFixed(1)} L${(leaf[0] + 20).toFixed(1)} ${(leaf[1] - 64).toFixed(1)}" stroke="#24452C" stroke-width="1.5" opacity=".5" fill="none"/>
      <ellipse cx="${(leaf[0] - 9).toFixed(1)}" cy="${(leaf[1] - 58).toFixed(1)}" rx="5" ry="12" fill="#5C9468" opacity=".45" transform="rotate(-8 ${(leaf[0] - 9).toFixed(1)} ${(leaf[1] - 58).toFixed(1)})"/>`;
    const p2 = P(0.052, 0.885);
    s += shadow(p2[0], p2[1], 26, 10, 0.28);
    s += isoBox(0.022, 0.855, 0.062, 0.062, 20, TERRA);
    s += isoBox(0.019, 0.852, 0.068, 0.068, 5, TERRA, 20);
    s += `<ellipse cx="${(p2[0] - 9).toFixed(1)}" cy="${(p2[1] - 36).toFixed(1)}" rx="10" ry="17" fill="#3E7048" transform="rotate(-18 ${(p2[0] - 9).toFixed(1)} ${(p2[1] - 36).toFixed(1)})"/>
      <ellipse cx="${(p2[0] + 7).toFixed(1)}" cy="${(p2[1] - 39).toFixed(1)}" rx="9" ry="19" fill="#2F5A38" transform="rotate(14 ${(p2[0] + 7).toFixed(1)} ${(p2[1] - 39).toFixed(1)})"/>
      <path d="M${(p2[0] - 12).toFixed(1)} ${(p2[1] - 24).toFixed(1)} q-11 14 -8 31" stroke="#35663F" stroke-width="3" fill="none"/>
      <path d="M${(p2[0] + 12).toFixed(1)} ${(p2[1] - 22).toFixed(1)} q13 11 11 28" stroke="#3E7048" stroke-width="3" fill="none"/>
      <circle cx="${(p2[0] - 19).toFixed(1)}" cy="${(p2[1] + 3).toFixed(1)}" r="4.2" fill="#3E7048"/><circle cx="${(p2[0] - 15).toFixed(1)}" cy="${(p2[1] + 10).toFixed(1)}" r="3.5" fill="#2F5A38"/>
      <circle cx="${(p2[0] + 22).toFixed(1)}" cy="${(p2[1] + 4).toFixed(1)}" r="4.2" fill="#35663F"/><circle cx="${(p2[0] + 17).toFixed(1)}" cy="${(p2[1] + 11).toFixed(1)}" r="3.4" fill="#3E7048"/>`;
    return s;
  },

  // 椭圆织物地毯:流苏边 + 双色织纹(织物漫反射)
  rug() {
    const c = P(0.5, 0.56);
    let s = `<ellipse cx="${c[0].toFixed(1)}" cy="${(c[1] + 3).toFixed(1)}" rx="196" ry="72" fill="#120C06" opacity=".15" filter="url(#soft)"/>`;
    const fringe = [];
    for (let i = -3; i <= 3; i += 1) {
      const dy = i * 16;
      fringe.push(`<path d="M${(c[0] - 187).toFixed(1)} ${(c[1] + dy * 0.36).toFixed(1)} l-17 ${(dy * 0.08).toFixed(1)}" stroke="#DFCFA8" stroke-width="3.2" opacity=".9"/>`);
      fringe.push(`<path d="M${(c[0] + 187).toFixed(1)} ${(c[1] + dy * 0.36).toFixed(1)} l17 ${(dy * 0.08).toFixed(1)}" stroke="#DFCFA8" stroke-width="3.2" opacity=".9"/>`);
    }
    s += `<g>${fringe.join('')}</g>`;
    s += `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="190" ry="68" fill="url(#rugGrad)"/>`;
    s += `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="166" ry="58" fill="none" stroke="#C9603C" stroke-width="7" opacity=".85"/>`;
    s += `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="130" ry="44" fill="none" stroke="#C9B48E" stroke-width="2.6" opacity=".6"/>`;
    s += `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="50" ry="17" fill="none" stroke="#C9603C" stroke-width="3.4" opacity=".45"/>`;
    s += `<path d="M${(c[0] - 104).toFixed(1)} ${(c[1] - 20).toFixed(1)} q104 26 208 0 M${(c[0] - 104).toFixed(1)} ${(c[1] + 24).toFixed(1)} q104 26 208 0" stroke="#C9B48E" stroke-width="1.8" opacity=".35" fill="none"/>`;
    return s;
  },

  // 吉他角:炭黑音箱(栅格 + 金属旋钮)+ A 型琴架 + 木吉他(漆面渐变 + 金属弦钮)
  guitar() {
    let s = shadow(P(0.865, 0.79)[0], P(0.865, 0.79)[1], 52, 17, 0.33);
    s += isoBox(0.8, 0.72, 0.13, 0.12, 48, CHAR);
    for (let i = 0; i < 6; i += 1) {
      const h = 12 + i * 6.4;
      s += `<path d="M${pt(0.806, 0.841, h)} L${pt(0.924, 0.841, h)}" stroke="#3A3F47" stroke-width="1.8" opacity=".8" fill="none"/>`;
    }
    s += `<path d="M${topPt(0.8, 0.84, 48)} L${topPt(0.93, 0.84, 48)}" stroke="#57503F" stroke-width="1.6" opacity=".7" fill="none"/>`;
    for (let i = 0; i < 3; i += 1) {
      const k = P(0.825 + i * 0.032, 0.775, 48.8);
      s += `<circle cx="${k[0].toFixed(1)}" cy="${k[1].toFixed(1)}" r="2.4" fill="#C9CDD4"/><circle cx="${(k[0] - 0.8).toFixed(1)}" cy="${(k[1] - 0.8).toFixed(1)}" r="0.9" fill="#FFFFFF" opacity=".85"/>`;
    }
    const ledG = P(0.905, 0.775, 48.8);
    s += `<circle cx="${ledG[0].toFixed(1)}" cy="${ledG[1].toFixed(1)}" r="2" fill="#F0A93C"/>`;
    const g = P(0.965, 0.79);
    s += `<path d="M${(g[0] - 6).toFixed(1)} ${(g[1] - 3).toFixed(1)} L${(g[0] - 20).toFixed(1)} ${(g[1] - 66).toFixed(1)} M${(g[0] + 11).toFixed(1)} ${(g[1] - 3).toFixed(1)} L${(g[0] + 1).toFixed(1)} ${(g[1] - 66).toFixed(1)}" stroke="#2A2620" stroke-width="4" fill="none"/>`;
    s += `<g transform="rotate(-18 ${g[0].toFixed(1)} ${g[1].toFixed(1)})">
      <rect x="${(g[0] - 4.5).toFixed(1)}" y="${(g[1] - 110).toFixed(1)}" width="10" height="75" fill="#7A5230"/>
      <path d="M${(g[0] - 4.5).toFixed(1)} ${(g[1] - 96).toFixed(1)} h10 M${(g[0] - 4.5).toFixed(1)} ${(g[1] - 81).toFixed(1)} h10 M${(g[0] - 4.5).toFixed(1)} ${(g[1] - 68).toFixed(1)} h10 M${(g[0] - 4.5).toFixed(1)} ${(g[1] - 56).toFixed(1)} h10" stroke="#5A3A1F" stroke-width="1.4"/>
      <rect x="${(g[0] - 9).toFixed(1)}" y="${(g[1] - 124).toFixed(1)}" width="19" height="17" rx="4" fill="#4E3319"/>
      <circle cx="${(g[0] - 4.5).toFixed(1)}" cy="${(g[1] - 118).toFixed(1)}" r="1.8" fill="#C9CDD4"/><circle cx="${(g[0] + 6).toFixed(1)}" cy="${(g[1] - 118).toFixed(1)}" r="1.8" fill="#C9CDD4"/>
      <path d="M${g[0].toFixed(1)} ${(g[1] - 38).toFixed(1)} c-20 0 -24 17 -11 26 c-19 9 -12 34 11 34 c23 0 30 -26 11 -34 c13 -9 9 -26 -11 -26Z" fill="url(#gtrGrad)" stroke="#7A4416" stroke-width="3.4"/>
      <circle cx="${g[0].toFixed(1)}" cy="${(g[1] - 6).toFixed(1)}" r="8" fill="#1A120A"/>
      <circle cx="${g[0].toFixed(1)}" cy="${(g[1] - 6).toFixed(1)}" r="10.4" fill="none" stroke="#D9A441" stroke-width="1.4" opacity=".8"/>
      <rect x="${(g[0] - 8.5).toFixed(1)}" y="${(g[1] + 11).toFixed(1)}" width="17" height="5.5" rx="2" fill="#2A1A0E"/>
      <path d="M${(g[0] - 3).toFixed(1)} ${(g[1] + 11).toFixed(1)} L${(g[0] - 2).toFixed(1)} ${(g[1] - 107).toFixed(1)} M${(g[0] + 1.5).toFixed(1)} ${(g[1] + 11).toFixed(1)} L${(g[0] + 1.5).toFixed(1)} ${(g[1] - 107).toFixed(1)} M${(g[0] + 5).toFixed(1)} ${(g[1] + 11).toFixed(1)} L${(g[0] + 4.5).toFixed(1)} ${(g[1] - 107).toFixed(1)}" stroke="#E8E2D2" stroke-width="0.8" opacity=".7"/>
    </g>`;
    s += `<path d="M${(g[0] - 9).toFixed(1)} ${(g[1] + 6).toFixed(1)} q-26 14 -48 -3" stroke="#14100B" stroke-width="2.6" opacity=".55" fill="none"/>`;
    return s;
  },

  // 猫窝:绒面圆窝 + 蜷睡的猫
  'cat-bed'() {
    const c = P(0.2, 0.76);
    return shadow(c[0], c[1], 48, 20, 0.3)
      + `<ellipse cx="${c[0].toFixed(1)}" cy="${(c[1] - 6).toFixed(1)}" rx="43" ry="19" fill="#B65A38"/>
      <ellipse cx="${c[0].toFixed(1)}" cy="${(c[1] - 6).toFixed(1)}" rx="43" ry="19" fill="none" stroke="#8A3F24" stroke-width="4" opacity=".8"/>
      <ellipse cx="${c[0].toFixed(1)}" cy="${(c[1] - 9).toFixed(1)}" rx="30" ry="12" fill="#EFE3C4"/>
      <ellipse cx="${c[0].toFixed(1)}" cy="${(c[1] - 8).toFixed(1)}" rx="30" ry="12" fill="none" stroke="#D8C7AE" stroke-width="1.8"/>
      <ellipse cx="${(c[0] + 4).toFixed(1)}" cy="${(c[1] - 15).toFixed(1)}" rx="19" ry="9.5" fill="#2E333B" transform="rotate(-8 ${(c[0] + 4).toFixed(1)} ${(c[1] - 15).toFixed(1)})"/>
      <circle cx="${(c[0] - 12).toFixed(1)}" cy="${(c[1] - 19).toFixed(1)}" r="7.5" fill="#2E333B"/>
      <path d="M${(c[0] - 16.5).toFixed(1)} ${(c[1] - 25).toFixed(1)} l3 -5 3.2 4.4 Z M${(c[0] - 9.5).toFixed(1)} ${(c[1] - 25.5).toFixed(1)} l3 -5 3.2 4.4 Z" fill="#2E333B"/>
      <path d="M${(c[0] + 20).toFixed(1)} ${(c[1] - 12).toFixed(1)} q6 7 -4 11 q-9 3 -15 -1.5" stroke="#2E333B" stroke-width="4.5" fill="none"/>`;
  },

  // 右墙矮书架(幕下,层板 + 书列 + 斜倚书 + 金属书立)
  bookshelf() {
    const items = [];
    const books = [
      ['#B65A38', 0.125, 0.034], ['#22384A', 0.112, 0.032], ['#F0A93C', 0.122, 0.034],
      ['#2F6B4E', 0.105, 0.031], ['#5A3A5E', 0.118, 0.033], ['#C9821E', 0.098, 0.03]
    ];
    let bx = 0.352;
    books.forEach(([c, h, w]) => {
      items.push(`<rect x="${bx.toFixed(3)}" y="${(0.925 - h).toFixed(3)}" width="${w}" height="${h}" fill="${c}"/>`);
      items.push(`<path d="M${(bx + 0.004).toFixed(3)} ${(0.925 - h + 0.008).toFixed(3)} h${(w - 0.008).toFixed(3)}" stroke="#F3E7CE" stroke-width="0.003" opacity=".5"/>`);
      bx += w + 0.006;
    });
    items.push(`<g transform="rotate(12 0.585 0.925)"><rect x="0.575" y="0.82" width="0.03" height="0.105" fill="#6B3B3B"/></g>`);
    items.push(`<path d="M0.608 0.925 v-0.068 h0.012 v0.058 h0.02 v0.01 Z" fill="#8B96AC"/>`);
    return `<g transform="matrix(480 250 0 440 414 -205)">`
      + `<rect x="0.32" y="0.925" width="0.32" height="0.02" fill="#7A5230"/><rect x="0.32" y="0.945" width="0.32" height="0.01" fill="#4E3319"/>`
      + `<path d="M0.32 0.927 H0.64" stroke="#A87B4A" stroke-width="0.003" opacity=".8"/>`
      + items.join('') + `</g>`;
  },

  // 固定小层板上的咖啡机(镀铬顶 + 冲煮头 + 手柄 + 小杯 + 热气)
  coffee() {
    return `<g transform="matrix(480 250 0 440 414 -205)">`
      + `<rect x="0.632" y="0.648" width="0.062" height="0.094" rx="0.008" fill="#26221A"/>`
      + `<rect x="0.632" y="0.648" width="0.062" height="0.013" rx="0.006" fill="url(#metalGrad)"/>`
      + `<rect x="0.638" y="0.668" width="0.05" height="0.029" fill="#3A3F47"/>`
      + `<circle cx="0.685" cy="0.676" r="0.006" fill="#F0A93C"/>`
      + `<rect x="0.647" y="0.7" width="0.031" height="0.017" rx="0.004" fill="#171410"/>`
      + `<path d="M0.662 0.706 L0.69 0.715" stroke="#0F0D0A" stroke-width="0.009" stroke-linecap="round"/>`
      + `<rect x="0.652" y="0.721" width="0.023" height="0.019" rx="0.004" fill="#F6EFDD"/>`
      + `<path d="M0.658 0.715 q0.004 -0.008 0 -0.014 M0.666 0.715 q0.004 -0.008 0 -0.014" stroke="#FFF6E8" stroke-width="0.003" opacity=".5" fill="none"/>`
      + `</g>`;
  },

  // 玩偶:布偶兔(拼布 + 缝线)
  doll() {
    const c = P(0.28, 0.68);
    return `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="22" ry="8.5" fill="#120C06" opacity=".3"/>`
      + `<ellipse cx="${(c[0] - 13).toFixed(1)}" cy="${(c[1] - 60).toFixed(1)}" rx="6.5" ry="10" fill="#D8A7B1" transform="rotate(-12 ${(c[0] - 13).toFixed(1)} ${(c[1] - 60).toFixed(1)})"/>`
      + `<ellipse cx="${(c[0] + 13).toFixed(1)}" cy="${(c[1] - 60).toFixed(1)}" rx="6.5" ry="10" fill="#D8A7B1" transform="rotate(12 ${(c[0] + 13).toFixed(1)} ${(c[1] - 60).toFixed(1)})"/>`
      + `<ellipse cx="${(c[0] - 13).toFixed(1)}" cy="${(c[1] - 59).toFixed(1)}" rx="3.2" ry="5.8" fill="#B97F8A" transform="rotate(-12 ${(c[0] - 13).toFixed(1)} ${(c[1] - 59).toFixed(1)})"/>`
      + `<ellipse cx="${(c[0] + 13).toFixed(1)}" cy="${(c[1] - 59).toFixed(1)}" rx="3.2" ry="5.8" fill="#B97F8A" transform="rotate(12 ${(c[0] + 13).toFixed(1)} ${(c[1] - 59).toFixed(1)})"/>`
      + `<ellipse cx="${c[0].toFixed(1)}" cy="${(c[1] - 17).toFixed(1)}" rx="16" ry="17" fill="#E3BCC4"/>`
      + `<ellipse cx="${c[0].toFixed(1)}" cy="${(c[1] - 13).toFixed(1)}" rx="8.5" ry="10" fill="#F2DDE2"/>`
      + `<circle cx="${c[0].toFixed(1)}" cy="${(c[1] - 43).toFixed(1)}" r="19" fill="#D8A7B1"/>`
      + `<circle cx="${(c[0] - 6.5).toFixed(1)}" cy="${(c[1] - 46).toFixed(1)}" r="2.4" fill="#26221A"/><circle cx="${(c[0] + 6.5).toFixed(1)}" cy="${(c[1] - 46).toFixed(1)}" r="2.4" fill="#26221A"/>`
      + `<path d="M${(c[0] - 2).toFixed(1)} ${(c[1] - 40).toFixed(1)} q2 2.2 4 0" stroke="#8A5560" stroke-width="1.4" fill="none"/>`;
  },

  // 右墙边竖海报(胡桃木框 + 山日出画芯)
  poster() {
    return `<g transform="matrix(480 250 0 440 414 -205)">`
      + `<rect x="0.05" y="0.44" width="0.105" height="0.4" fill="#4A3624"/>`
      + `<rect x="0.056" y="0.446" width="0.093" height="0.388" fill="#F3EAD6"/>`
      + `<rect x="0.062" y="0.452" width="0.081" height="0.31" fill="#22384A"/>`
      + `<circle cx="0.102" cy="0.535" r="0.028" fill="#F0A93C"/>`
      + `<path d="M0.062 0.67 L0.088 0.6 L0.108 0.655 L0.126 0.59 L0.143 0.67Z" fill="#3E7048"/>`
      + `<path d="M0.062 0.67 L0.082 0.625 L0.102 0.67Z" fill="#26543A"/>`
      + `<rect x="0.062" y="0.73" width="0.081" height="0.027" fill="#B65A38"/>`
      + `<path d="M0.07 0.743 h0.065" stroke="#F3E7CE" stroke-width="0.006" opacity=".85"/>`
      + `</g>`;
  },

  // 窗边挂帘:帘杆 + 褶皱帘身 + 束带(织物垂坠)
  curtain() {
    return `<g transform="matrix(480 250 0 440 414 -205)">`
      + `<rect x="0.848" y="0.265" width="0.115" height="0.018" rx="0.008" fill="#4E3319"/>`
      + `<circle cx="0.85" cy="0.274" r="0.011" fill="#3A2413"/><circle cx="0.961" cy="0.274" r="0.011" fill="#3A2413"/>`
      + `<path d="M0.858 0.285 L0.955 0.285 L0.948 0.51 Q0.925 0.545 0.944 0.59 L0.953 0.83 Q0.908 0.86 0.868 0.83 L0.876 0.59 Q0.894 0.545 0.87 0.51 Z" fill="#A5563F"/>`
      + `<path d="M0.874 0.29 q0.004 0.27 -0.002 0.53 M0.895 0.29 q0.006 0.28 0 0.54 M0.916 0.29 q0.006 0.27 0.002 0.53 M0.935 0.29 q0.006 0.26 0.004 0.51" stroke="#7A3E28" stroke-width="0.005" opacity=".65" fill="none"/>`
      + `<path d="M0.884 0.29 q0.003 0.26 -0.002 0.51 M0.906 0.29 q0.004 0.27 0 0.52" stroke="#C97B5A" stroke-width="0.003" opacity=".5" fill="none"/>`
      + `<path d="M0.868 0.545 q0.04 0.017 0.08 0 l0.002 0.024 q-0.042 0.017 -0.084 0 Z" fill="#D9A441"/>`
      + `</g>`;
  },

  // 茶几上的放映机(金属镜头 + 散热口;光束在 L7)
  projector() {
    let s = `<ellipse cx="${P(0.335, 0.575)[0].toFixed(1)}" cy="${(P(0.335, 0.575)[1] - 36).toFixed(1)}" rx="23" ry="8.5" fill="#120C06" opacity=".3"/>`;
    s += isoBox(0.30, 0.53, 0.075, 0.06, 17, CHAR, 40);
    s += `<path d="M${topPt(0.30, 0.59, 57)} L${topPt(0.375, 0.59, 57)}" stroke="#57503F" stroke-width="1.5" opacity=".7" fill="none"/>`;
    const lens = P(0.31, 0.56, 57);
    s += `<circle cx="${lens[0].toFixed(1)}" cy="${lens[1].toFixed(1)}" r="8" fill="#3A3F47"/><circle cx="${lens[0].toFixed(1)}" cy="${lens[1].toFixed(1)}" r="5" fill="#DFF8FF"/><circle cx="${(lens[0] - 1.5).toFixed(1)}" cy="${(lens[1] - 1.5).toFixed(1)}" r="1.7" fill="#FFFFFF"/>`;
    for (let i = 0; i < 3; i += 1) {
      const v0 = P(0.352 + i * 0.008, 0.532, 50);
      s += `<path d="M${v0[0].toFixed(1)} ${v0[1].toFixed(1)} l0 6" stroke="#3A3F47" stroke-width="1.6" opacity=".9"/>`;
    }
    const pw = P(0.366, 0.55, 57.5);
    s += `<circle cx="${pw[0].toFixed(1)}" cy="${pw[1].toFixed(1)}" r="1.7" fill="#F0A93C"/>`;
    return s;
  }
};

// 唱盘位置(覆盖层与布局同源;页面 CSS 旋转唱盘按此对位)
const PLATTER_POS = { u: 0.515, v: 0.095, h: 112 };

// ================= 家具元数据(§5.1 schema;z 由新几何前沿底部换算) =================
function footToStage(uvFoot, hPx) {
  const [u0, v0, u1, v1] = uvFoot;
  const corners = [P(u0, v0), P(u1, v0), P(u0, v1), P(u1, v1)];
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  const top = Math.min(...ys) - hPx;
  return {
    anchor: { x: pct((left + right) / 2), y: pct((top + bottom) / 2) },
    bounds: { left: pct(left), top: pct(top), width: pct(right - left), height: pct(bottom - top) },
    z: Math.round(pct(bottom) * 10),
    glow: [(left + right) / 2, (top + bottom) / 2 + hPx * 0.3, (right - left) * 0.62]
  };
}

const FURN_META = [
  { key: 'sofa', name: '沙发', uvFoot: [0.02, 0.30, 0.18, 0.60], hPx: 95,
    collision: { u0: 0.02, v0: 0.30, u1: 0.18, v1: 0.60 },
    lightResponse: { warm: 0.85, cool: 0.2, emissive: 0 }, occludesCharacter: true, interaction: 'sit',
    hotspot: { id: 'sofa', icon: '▰', name: '沙发', left: 18, top: 30, width: 24, height: 22 } },
  { key: 'vinyl-player', name: '黑胶机', uvFoot: [0.42, 0.02, 0.96, 0.18], hPx: 150,
    collision: { u0: 0.42, v0: 0.02, u1: 0.96, v1: 0.18 },
    lightResponse: { warm: 0.9, cool: 0.25, emissive: 0.15 }, occludesCharacter: true, interaction: 'play-hint',
    hotspot: { id: 'turntable', icon: '◎', name: '唱机柜', left: 64, top: 30, width: 28, height: 30 } },
  { key: 'table', name: '茶几', uvFoot: [0.275, 0.495, 0.445, 0.645], hPx: 58, fixed: true,
    collision: { u0: 0.28, v0: 0.50, u1: 0.44, v1: 0.64 },
    lightResponse: { warm: 0.9, cool: 0.25, emissive: 0 }, occludesCharacter: true, interaction: null, hotspot: null },
  { key: 'cat-bed', name: '猫窝', uvFoot: [0.14, 0.70, 0.26, 0.82], hPx: 24, collision: null,
    lightResponse: { warm: 0.7, cool: 0.2, emissive: 0 }, occludesCharacter: true, interaction: null, hotspot: null },
  { key: 'lamp', name: '落地灯', collision: { u0: 0.85, v0: 0.30, u1: 0.95, v1: 0.42 },
    anchorManual: { x: 76, y: 52 }, boundsManual: { left: 63, top: 34, width: 26, height: 34 }, zManual: 697,
    glowManual: [600, 480, 70],
    lightResponse: { warm: 0.35, cool: 0.15, emissive: 0.95 }, occludesCharacter: true, interaction: 'lamp',
    hotspot: { id: 'lamp', icon: '☼', name: '落地灯', left: 64, top: 38, width: 20, height: 30 } },
  { key: 'plant', name: '绿植', uvFoot: [0.02, 0.74, 0.15, 0.92], hPx: 100,
    collision: { u0: 0.02, v0: 0.74, u1: 0.15, v1: 0.92 },
    lightResponse: { warm: 0.75, cool: 0.3, emissive: 0 }, occludesCharacter: true, interaction: null, hotspot: null },
  { key: 'rug', name: '地毯', collision: null,
    anchorManual: { x: 50, y: 60.4 }, boundsManual: { left: 27, top: 52, width: 46, height: 17 }, zManual: 500,
    glowManual: [414, 500, 190],
    lightResponse: { warm: 0.6, cool: 0.2, emissive: 0 }, occludesCharacter: false, interaction: null, hotspot: null },
  { key: 'curtain', name: '挂帘', collision: null,
    anchorManual: { x: 104, y: 42 }, boundsManual: { left: 98, top: 25, width: 12, height: 34 }, zManual: 300,
    lightResponse: { warm: 0.5, cool: 0.45, emissive: 0 }, occludesCharacter: false, interaction: null, hotspot: null },
  { key: 'projector', name: '放映机', uvFoot: [0.30, 0.53, 0.375, 0.59], hPx: 24, collision: null,
    lightResponse: { warm: 0.5, cool: 0.3, emissive: 0.6 }, occludesCharacter: true, interaction: 'projector',
    hotspot: { id: 'projector', icon: '✦', name: '放映机', left: 33, top: 43, width: 10, height: 10 } },
  { key: 'poster', name: '海报', collision: null,
    anchorManual: { x: 47, y: 52 }, boundsManual: { left: 41, top: 34, width: 12, height: 36 }, zManual: 300,
    lightResponse: { warm: 0.8, cool: 0.4, emissive: 0 }, occludesCharacter: false, interaction: null, hotspot: null },
  { key: 'coffee', name: '咖啡机', collision: null,
    anchorManual: { x: 86, y: 55 }, boundsManual: { left: 82, top: 47, width: 8, height: 16 }, zManual: 300,
    lightResponse: { warm: 0.7, cool: 0.4, emissive: 0.2 }, occludesCharacter: false, interaction: null, hotspot: null },
  { key: 'bookshelf', name: '书架', collision: null,
    anchorManual: { x: 66, y: 72 }, boundsManual: { left: 52, top: 62, width: 28, height: 20 }, zManual: 300,
    lightResponse: { warm: 0.8, cool: 0.35, emissive: 0 }, occludesCharacter: false, interaction: null, hotspot: null },
  { key: 'doll', name: '玩偶', uvFoot: [0.26, 0.66, 0.30, 0.70], hPx: 80, collision: null,
    lightResponse: { warm: 0.7, cool: 0.2, emissive: 0 }, occludesCharacter: true, interaction: null, hotspot: null },
  { key: 'guitar', name: '吉他角', uvFoot: [0.79, 0.70, 0.99, 0.85], hPx: 135,
    collision: { u0: 0.79, v0: 0.70, u1: 0.99, v1: 0.85 },
    lightResponse: { warm: 0.85, cool: 0.25, emissive: 0 }, occludesCharacter: true, interaction: 'play-hint',
    hotspot: { id: 'guitar', icon: '♪', name: '吉他角', left: 47, top: 62, width: 19, height: 22 } }
];

// ================= 唱片槽位板材(新墙面剪切) =================
function plateInner(rec, slotIndex) {
  const m = { a: -48, b: 25, c: 0, d: 54, ox: PLATE_OX, oy: PLATE_OY };
  const designs = ['amber', 'green', 'rust', 'slate', 'dark', 'wave'];
  const design = designs[rec.id % designs.length];
  const sleeves = {
    amber: `<rect width="1" height="1" fill="#F3E7CE"/><circle cx="0.5" cy="0.5" r="0.32" fill="${rec.color}"/><circle cx="0.5" cy="0.5" r="0.32" fill="none" stroke="#26221A" stroke-width="0.025" opacity=".3"/><circle cx="0.5" cy="0.5" r="0.07" fill="#26221A"/>`,
    green: `<rect width="1" height="1" fill="${rec.color}"/><path d="M0 1 L1 0 V0.3 L0 1.3Z" fill="#E8F9EF" opacity=".85"/><path d="M0 0.86 L0.86 0" stroke="#26221A" stroke-width="0.03" opacity=".25"/><rect x="0.08" y="0.08" width="0.2" height="0.06" fill="#F3E7CE" opacity=".9"/>`,
    rust: `<rect width="1" height="1" fill="${rec.color}"/><path d="M0 1 A0.5 0.5 0 0 1 1 1Z" fill="#26221A"/><circle cx="0.5" cy="0.62" r="0.09" fill="#F0A93C"/><path d="M0 1 A0.5 0.5 0 0 1 1 1" fill="none" stroke="#F3E7CE" stroke-width="0.025" opacity=".5"/>`,
    slate: `<rect width="1" height="1" fill="${rec.color}"/><path d="M0 0.6 q0.25 -0.3 0.5 0 t0.5 0 V1 H0Z" fill="#DCE9EC"/><circle cx="0.78" cy="0.22" r="0.08" fill="#FFE9B0"/><path d="M0 0.72 q0.25 -0.28 0.5 0 t0.5 0" stroke="#8FB8CC" stroke-width="0.03" fill="none" opacity=".7"/>`,
    dark: `<rect width="1" height="1" fill="${rec.color}"/><rect x="0.14" y="0.14" width="0.3" height="0.3" fill="#F0A93C"/><rect x="0.56" y="0.56" width="0.3" height="0.3" fill="#22C55E"/><circle cx="0.71" cy="0.29" r="0.08" fill="none" stroke="#F3E7CE" stroke-width="0.03"/>`,
    wave: `<rect width="1" height="1" fill="#EFE3C8"/><path d="M0 0.5 q0.2 -0.35 0.4 0 t0.4 0" stroke="${rec.color}" stroke-width="0.07" fill="none"/><path d="M0 0.72 q0.2 -0.3 0.4 0 t0.4 0" stroke="${rec.color}" stroke-width="0.04" fill="none" opacity=".5"/><circle cx="0.2" cy="0.2" r="0.06" fill="${rec.color}" opacity=".8"/>`
  };
  const peek = slotIndex % 2 === 1
    ? `<g transform="matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.ox} ${m.oy})"><circle cx="1.04" cy="0.5" r="0.24" fill="url(#vinylGrad)"/><circle cx="1.04" cy="0.5" r="0.19" fill="none" stroke="#39414E" stroke-width="0.02"/><circle cx="1.04" cy="0.5" r="0.13" fill="none" stroke="#39414E" stroke-width="0.016" opacity=".8"/><circle cx="1.04" cy="0.5" r="0.08" fill="${rec.color}"/><circle cx="1.04" cy="0.5" r="0.02" fill="#F6EFDD"/></g>`
    : '';
  const sheen = '<linearGradient id="plateSheen" x2="1" y2="1"><stop stop-color="#FFFFFF" stop-opacity="0.1"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>';
  return peek
    + `<g transform="matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.ox} ${m.oy})">${sleeves[design]}<rect width="1" height="1" fill="url(#plateSheen)"/><rect width="1" height="1" fill="none" stroke="rgba(38,34,26,.35)" stroke-width="0.02"/></g>`
    .replace('</g>', `</g><defs>${sheen}</defs>`);
}

function plateSvg(rec, slotIndex) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PLATE_W}" height="${PLATE_H}" viewBox="0 0 ${PLATE_W} ${PLATE_H}">${DEFS}${plateInner(rec, slotIndex)}</svg>`;
}

// ================= 面积/多边形地面真值 =================
function polyArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

// Sutherland–Hodgman 裁剪到画布矩形
function clipToCanvas(poly) {
  let out = poly;
  const edges = [
    (p) => p[0] >= 0, (a, b) => intersect(a, b, 'x', 0),
    (p) => p[0] <= 828, (a, b) => intersect(a, b, 'x', 828),
    (p) => p[1] >= 0, (a, b) => intersect(a, b, 'y', 0),
    (p) => p[1] <= 828, (a, b) => intersect(a, b, 'y', 828)
  ];
  function intersect(a, b, axis, val) {
    const t = axis === 'x' ? (val - a[0]) / (b[0] - a[0]) : (val - a[1]) / (b[1] - a[1]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  for (let e = 0; e < edges.length; e += 2) {
    const inside = edges[e];
    const cut = edges[e + 1];
    const next = [];
    for (let i = 0; i < out.length; i += 1) {
      const cur = out[i];
      const prev = out[(i + out.length - 1) % out.length];
      if (inside(cur)) {
        if (!inside(prev)) next.push(cut(prev, cur));
        next.push(cur);
      } else if (inside(prev)) next.push(cut(prev, cur));
    }
    out = next;
  }
  return out;
}

const FLOOR_POLY = [[-66, 485], [414, 235], [894, 485], [414, 735]];
const LEFT_WALL_POLY = [[-66, 45], [414, -205], [414, 235], [-66, 485]];
const RIGHT_WALL_POLY = [[414, -205], [894, 45], [894, 485], [414, 235]];

// ================= 主流程 =================
async function render(svg, outFile, quality = 86) {
  await sharp(Buffer.from(svg), { density: 72 }).webp({ quality }).toFile(outFile);
  return (fs.statSync(outFile).size / 1024).toFixed(1);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 家具 meta 补全(stage anchor/bounds/z/glow)
  const furns = FURN_META.map((m) => {
    const stage = m.uvFoot ? footToStage(m.uvFoot, m.hPx) : null;
    return {
      ...m,
      anchor: stage ? stage.anchor : m.anchorManual,
      bounds: stage ? stage.bounds : m.boundsManual,
      z: stage ? stage.z : m.zManual,
      glowAt: stage ? stage.glow : (m.glowManual || null)
    };
  });

  // 灯光层
  const layers = [
    ['room-base', buildL0(), 88],
    ['ambient-shadow', buildL1(), 88],
    ['cool-night-window', buildL2(), 88],
    ['warm-light-room', buildL3(furns), 88],
    ['shelf-edge-glow', buildL4(), 88],
    ['lamp-pool', buildL5(), 88],
    ['warm-veil-char', buildL6(), 88],
    ['projector-beam', buildL7(), 88]
  ];
  for (const [name, svg, q] of layers) {
    const kb = await render(svg, path.join(OUT_DIR, `${name}.webp`), q);
    console.log(`OK room/${name}.webp ${kb} KB`);
  }

  // 家具覆盖层(含固定茶几)
  for (const f of furns) {
    const svg = wrap(f.key === 'table' ? tableOverlay() : OVERLAYS[f.key](), false);
    const kb = await render(svg, path.join(OUT_DIR, `furn-${f.key}.webp`), 86);
    console.log(`OK room/furn-${f.key}.webp ${kb} KB`);
  }

  // 唱片板材 ×24(封套/黑胶节奏按槽位奇偶)
  for (const rec of RECORDS) {
    await render(plateSvg(rec, 1), path.join(OUT_DIR, `rec-plate-${rec.id}.webp`), 88);
  }
  console.log(`OK room/rec-plate-*.webp ×${RECORDS.length}`);

  // 布局数据(room-scene 组件 + room 页消费)
  const slots = [];
  for (let i = 0; i < 12; i += 1) slots.push(slotBBox(i));
  const platter = P(PLATTER_POS.u, PLATTER_POS.v, PLATTER_POS.h);
  const layout = `// 由 tools/gen-room-master.js 生成,请勿手改
// Room Master Scene 单一数据源:几何/灯光层/家具(§5.1 schema)/唱片槽位/唱盘
module.exports = ${JSON.stringify({
    GEOMETRY: {
      canvas: GEO.canvas, X0: GEO.X0, Y0: GEO.Y0, SX: GEO.SX, SY: GEO.SY,
      WALL_H: GEO.WALL_H, depthTopMin: GEO.depthTopMin, depthTopMax: GEO.depthTopMax
    },
    LAYERS: {
      L0: '/assets/img/room/room-base.webp',
      L1: '/assets/img/room/ambient-shadow.webp',
      L2: '/assets/img/room/cool-night-window.webp',
      L3: '/assets/img/room/warm-light-room.webp',
      L4: '/assets/img/room/shelf-edge-glow.webp',
      L5: '/assets/img/room/lamp-pool.webp',
      L6: '/assets/img/room/warm-veil-char.webp',
      L7: '/assets/img/room/projector-beam.webp'
    },
    FURNITURE: furns.map((m) => ({
      id: m.key,
      key: m.key,
      label: m.name,
      name: m.name,
      asset: `/assets/img/room/furn-${m.key}.webp`,
      thumb: `/assets/img/room/furn-${m.key}.webp`,
      anchor: m.anchor,
      bounds: m.bounds,
      scale: 1,
      rotation: 0,
      z: m.z,
      lightResponse: m.lightResponse,
      occludesCharacter: m.occludesCharacter,
      hitArea: m.hotspot
        ? { left: m.hotspot.left, top: m.hotspot.top, width: m.hotspot.width, height: m.hotspot.height }
        : null,
      collision: m.collision,
      fixed: m.fixed === true,
      interaction: m.interaction,
      hotspot: m.hotspot
    })),
    FIXED_COLLIDERS: [{ id: 'table', furniture: null, collision: { u0: 0.28, v0: 0.50, u1: 0.44, v1: 0.64 } }],
    FIXTURE_OBJECTS: [
      { id: 'record-wall', icon: '◉', name: '唱片墙', left: 4, top: 0, width: 42, height: 54, z: 340, interaction: 'records' },
      { id: 'floor-records', icon: '●', name: '地面唱片', left: 40, top: 61, width: 15, height: 11, z: 100, interaction: 'play-hint' }
    ],
    RECORD_SLOTS: slots,
    PLATTER: { left: pct(platter[0]), top: pct(platter[1]) },
    WALL_NOW_PLAYING: { left: 8, top: 8 },
    CHAR: { baseHeight: GEO.charBaseHeight, spriteAspect: 184 / 144 }
  }, null, 2)};
`;
  fs.writeFileSync(OUT_LAYOUT, layout);
  console.log('OK utils/room-scene-layout.js');

  // 测量地面真值
  const floorVisible = polyArea(clipToCanvas(FLOOR_POLY));
  const leftWallVisible = polyArea(clipToCanvas(LEFT_WALL_POLY));
  const rightWallVisible = polyArea(clipToCanvas(RIGHT_WALL_POLY));
  const roomVisible = floorVisible + leftWallVisible + rightWallVisible;
  const rwTotal = recordWallArea.covers + recordWallArea.shelves + recordWallArea.poster
    + recordWallArea.vinyl + recordWallArea.stack;
  const momoFoot = P(0.68, 0.60);   // 地毯右前,茶几与唱机之间的空地
  const kikiFoot = P(0.20, 0.44);   // 沙发靠背正后方(验证遮挡:z<sofa)
  const depthOf = (topPct) => {
    const t = Math.max(0, Math.min(1, (topPct - GEO.depthTopMin) / (GEO.depthTopMax - GEO.depthTopMin)));
    return 0.82 + t * 0.23;
  };
  const charPlan = (name, uv, foot) => {
    const topPct = pct(foot[1]);
    const scale = Number(depthOf(topPct).toFixed(3));
    const h = Math.round(GEO.charBaseHeight * scale);
    const w = Math.round(h / (184 / 144));
    return {
      name, uv, footPx: foot.map((n) => Math.round(n)), topPct, scale, heightPx: h,
      z: Math.round(topPct * 10),
      bbox: { x: Math.round(foot[0] - w / 2), y: Math.round(foot[1] - h), w, h }
    };
  };
  const momo = charPlan('momo', [0.68, 0.60], momoFoot);
  const kiki = charPlan('kiki', [0.20, 0.44], kikiFoot);
  const lampBase = P(0.9, 0.36);
  const geo = {
    canvas: GEO.canvas,
    geometry: { X0: GEO.X0, Y0: GEO.Y0, SX: GEO.SX, SY: GEO.SY, WALL_H: GEO.WALL_H },
    polygons: { floor: FLOOR_POLY, leftWall: LEFT_WALL_POLY, rightWall: RIGHT_WALL_POLY },
    areas: {
      floorVisible: Math.round(floorVisible),
      leftWallVisible: Math.round(leftWallVisible),
      rightWallVisible: Math.round(rightWallVisible),
      roomVisible: Math.round(roomVisible),
      canvas: 828 * 828,
      roomRatio: Number((roomVisible / (828 * 828)).toFixed(4)),
      leftWallFull: WALL_UNIT_AREA
    },
    recordWall: {
      itemizedPx: Object.fromEntries(Object.entries(recordWallArea).map(([k, v]) => [k, Math.round(v)])),
      totalPx: Math.round(rwTotal),
      ratioOfLeftWallVisible: Number((rwTotal / leftWallVisible).toFixed(4)),
      ratioOfLeftWallFull: Number((rwTotal / WALL_UNIT_AREA).toFixed(4))
    },
    roomVisibleHeightPx: 735,
    characters: { momo, kiki },
    samples: {
      window: { x: 766, y: 118, w: 62, h: 200 },
      lampPool: { x: Math.round(lampBase[0] - 128 - 50), y: Math.round(lampBase[1] - 65), w: 100, h: 50 },
      charMomo: momo.bbox,
      charKiki: kiki.bbox
    },
    layers: layers.map(([name]) => `room/${name}.webp`),
    furnitureAssets: furns.map((m) => `room/furn-${m.key}.webp`)
  };
  fs.mkdirSync(path.dirname(OUT_GEO), { recursive: true });
  fs.writeFileSync(OUT_GEO, JSON.stringify(geo, null, 2));
  console.log('OK visual-validation/rendered/room-master-geometry.json');
  console.log(`roomRatio=${geo.areas.roomRatio} recordWallRatio(visible)=${geo.recordWall.ratioOfLeftWallVisible} charMomo=${momo.heightPx}px/${geo.roomVisibleHeightPx}px`);
})();
