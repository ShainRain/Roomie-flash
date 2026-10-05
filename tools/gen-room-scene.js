// Roomie 房间场景资产生成器(分层版 · 深夜听音室 v3 · 视觉母版)
// 画框不变:828×828 等距对称墙角。输出:
//   miniprogram/assets/img/room-interactive.webp  底图(墙面/地板/唱片架空槽/茶几等固定件)
//   miniprogram/assets/img/furn-<key>.webp        DIY 家具全幅透明覆盖层(与底图同坐标系)
//   miniprogram/assets/img/rec-<id>.webp          24 张唱片封面板材(已带墙面剪切,直接摆放)
//   miniprogram/assets/img/furn-icon-<key>.webp   建筑师模式统一双色图标
//   miniprogram/assets/img/room-hero.webp         首页主视觉(默认家具全开 + 唱片墙 + MOMO)
//   miniprogram/assets/img/room-postcard.jpg      明信片房间照片(深夜版)
//   miniprogram/utils/room-layout.js              布局元数据(家具层/热点/槽位/障碍映射)
// 运行:node tools/gen-room-scene.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { RECORDS } = require('../miniprogram/utils/records');

const OUT_IMG = path.join(__dirname, '..', 'miniprogram', 'assets', 'img');
const OUT_LAYOUT = path.join(__dirname, '..', 'miniprogram', 'utils', 'room-layout.js');

// ---- 坐标系(与 room-map.js 的地板菱形/障碍硬编码一致,勿动) ----
// 地板 uv(0..1)→ 画布 px
const P = (u, v, h = 0) => [414 + 274 * (u - v), 414 + 144 * (u + v) - h];
const pt = (u, v, h = 0) => P(u, v, h).map((n) => n.toFixed(1)).join(' ');
const pct = (px) => Number((px / 8.28).toFixed(2));

// 等距方块
function isoBox(u0, v0, wu, wv, h, colors, baseH = 0) {
  const y = baseH + h;
  const top = `M${pt(u0, v0, y)} L${pt(u0 + wu, v0, y)} L${pt(u0 + wu, v0 + wv, y)} L${pt(u0, v0 + wv, y)}Z`;
  const left = `M${pt(u0, v0 + wv, y)} L${pt(u0 + wu, v0 + wv, y)} L${pt(u0 + wu, v0 + wv, baseH)} L${pt(u0, v0 + wv, baseH)}Z`;
  const right = `M${pt(u0 + wu, v0 + wv, y)} L${pt(u0 + wu, v0, y)} L${pt(u0 + wu, v0, baseH)} L${pt(u0 + wu, v0 + wv, baseH)}Z`;
  return `<path d="${top}" fill="${colors.top}"/><path d="${left}" fill="${colors.left}"/><path d="${right}" fill="${colors.right}"/>`;
}
const topPt = (u, v, baseH) => pt(u, v, baseH);

// 左墙/右墙 0..1 → 画布
const LW = (s, t) => [414 - 274 * s, 126 + 288 * t + 144 * s];
const RW = (s, t) => [414 + 274 * s, 126 + 288 * t + 144 * s];

// ---- 材质/光照小助手 ----
// 接触阴影(柔和椭圆)
const shadow = (cx, cy, rx, ry, op = 0.32) =>
  `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx}" ry="${ry}" fill="#120C06" opacity="${op}" filter="url(#soft)"/>`;

// 胡桃木顶面木纹:沿 u 方向细线(端点落在顶面边上,无需裁剪)
function grainTopU(u0, v0, wu, wv, h, n, color = '#5A3A1F', op = 0.38) {
  const out = [];
  for (let i = 1; i <= n; i += 1) {
    const v = v0 + (wv * i) / (n + 1);
    const a = P(u0 + 0.008, v, h);
    const b = P(u0 + wu - 0.008, v, h);
    out.push(`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="${color}" stroke-width="1" opacity="${op}" fill="none"/>`);
  }
  return out.join('');
}

// 确定性散点(墙面哑光微颗粒/幕内星空),seed 固定 → 输出稳定
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
  <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#0A1120"/><stop offset="1" stop-color="#182A46"/></linearGradient>
  <linearGradient id="leftWall" x2="1" y2="1"><stop stop-color="#F6EACB"/><stop offset="1" stop-color="#E0CCA0"/></linearGradient>
  <linearGradient id="rightWall" x2="0" y2="1"><stop stop-color="#EFE1BF"/><stop offset="1" stop-color="#D4C094"/></linearGradient>
  <linearGradient id="floorWood" x2="0" y2="1"><stop stop-color="#87572F"/><stop offset="1" stop-color="#4A2C15"/></linearGradient>
  <radialGradient id="floorSheen" cx="0.42" cy="0.6" r="0.6"><stop stop-color="#FFC478" stop-opacity="0.2"/><stop offset="1" stop-color="#FFC478" stop-opacity="0"/></radialGradient>
  <radialGradient id="coolSpill"><stop stop-color="#8FC0EA" stop-opacity="0.13"/><stop offset="1" stop-color="#8FC0EA" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx="0.5" cy="0.46" r="0.72"><stop stop-color="#1A0E04" stop-opacity="0"/><stop offset="0.7" stop-color="#1A0E04" stop-opacity="0"/><stop offset="1" stop-color="#1A0E04" stop-opacity="0.3"/></radialGradient>
  <linearGradient id="screenSky" x2="0" y2="1"><stop stop-color="#1E3C62"/><stop offset="1" stop-color="#0C1B31"/></linearGradient>
  <linearGradient id="screenSea" x2="0" y2="1"><stop stop-color="#16304E"/><stop offset="1" stop-color="#0A1626"/></linearGradient>
  <radialGradient id="screenHalo"><stop stop-color="#9CC8EE" stop-opacity="0.2"/><stop offset="1" stop-color="#9CC8EE" stop-opacity="0"/></radialGradient>
  <linearGradient id="coolFade" x2="0" y2="1"><stop stop-color="#9CC8EE" stop-opacity="0.16"/><stop offset="1" stop-color="#9CC8EE" stop-opacity="0"/></linearGradient>
  <radialGradient id="moonGlow"><stop stop-color="#FFE9B0" stop-opacity="0.85"/><stop offset="0.4" stop-color="#FFE9B0" stop-opacity="0.25"/><stop offset="1" stop-color="#FFE9B0" stop-opacity="0"/></radialGradient>
  <radialGradient id="warmWash" cx="0.5" cy="0.52" r="0.58"><stop stop-color="#F0A93C" stop-opacity="0.18"/><stop offset="1" stop-color="#F0A93C" stop-opacity="0"/></radialGradient>
  <radialGradient id="lampPool"><stop stop-color="#FFD9A0" stop-opacity="0.5"/><stop offset="0.55" stop-color="#FFCF8E" stop-opacity="0.2"/><stop offset="1" stop-color="#FFCF8E" stop-opacity="0"/></radialGradient>
  <linearGradient id="lampCone" x2="0" y2="1"><stop stop-color="#FFE2B0" stop-opacity="0.26"/><stop offset="1" stop-color="#FFE2B0" stop-opacity="0"/></linearGradient>
  <linearGradient id="shadeGrad" x2="0" y2="1"><stop stop-color="#F9D37E"/><stop offset="1" stop-color="#E0A03A"/></linearGradient>
  <linearGradient id="woodTop" x2="1" y2="1"><stop stop-color="#9C6C3C"/><stop offset="1" stop-color="#7C5028"/></linearGradient>
  <linearGradient id="woodLeft" x2="0" y2="1"><stop stop-color="#74492A"/><stop offset="1" stop-color="#56341B"/></linearGradient>
  <linearGradient id="woodRight" x2="0" y2="1"><stop stop-color="#5E3A20"/><stop offset="1" stop-color="#432812"/></linearGradient>
  <linearGradient id="fabTop" x2="0" y2="1"><stop stop-color="#E29A54"/><stop offset="1" stop-color="#CC7F3E"/></linearGradient>
  <linearGradient id="fabLeft" x2="0" y2="1"><stop stop-color="#C9803D"/><stop offset="1" stop-color="#AE682C"/></linearGradient>
  <linearGradient id="fabRight" x2="0" y2="1"><stop stop-color="#B87233"/><stop offset="1" stop-color="#9A5A20"/></linearGradient>
  <linearGradient id="cushTop" x2="0" y2="1"><stop stop-color="#ECAB62"/><stop offset="1" stop-color="#DB9048"/></linearGradient>
  <linearGradient id="charTop" x2="0" y2="1"><stop stop-color="#33302A"/><stop offset="1" stop-color="#211E18"/></linearGradient>
  <linearGradient id="charLeft" x2="0" y2="1"><stop stop-color="#252119"/><stop offset="1" stop-color="#171410"/></linearGradient>
  <linearGradient id="charRight" x2="0" y2="1"><stop stop-color="#1C1913"/><stop offset="1" stop-color="#12100C"/></linearGradient>
  <linearGradient id="terraTop" x2="0" y2="1"><stop stop-color="#BC6E44"/><stop offset="1" stop-color="#A05634"/></linearGradient>
  <linearGradient id="terraLeft" x2="0" y2="1"><stop stop-color="#98512D"/><stop offset="1" stop-color="#7A3E20"/></linearGradient>
  <linearGradient id="terraRight" x2="0" y2="1"><stop stop-color="#824420"/><stop offset="1" stop-color="#663318"/></linearGradient>
  <radialGradient id="rugGrad" cx="0.5" cy="0.45" r="0.7"><stop stop-color="#F2E7CC"/><stop offset="1" stop-color="#DDCDA6"/></radialGradient>
  <linearGradient id="ledGrad" x2="0" y2="1"><stop stop-color="#FFBE5A" stop-opacity="0.26"/><stop offset="1" stop-color="#FFBE5A" stop-opacity="0"/></linearGradient>
  <linearGradient id="cornerShade" x2="1" y2="0"><stop stop-color="#46280C" stop-opacity="0.15"/><stop offset="1" stop-color="#46280C" stop-opacity="0"/></linearGradient>
  <linearGradient id="ceilShade" x2="0" y2="1"><stop stop-color="#46280C" stop-opacity="0.14"/><stop offset="1" stop-color="#46280C" stop-opacity="0"/></linearGradient>
  <radialGradient id="vinylGrad" cx="0.38" cy="0.35" r="0.85"><stop stop-color="#252D38"/><stop offset="1" stop-color="#0B0E13"/></radialGradient>
  <radialGradient id="gtrGrad" cx="0.42" cy="0.38" r="0.85"><stop stop-color="#DC8E48"/><stop offset="1" stop-color="#9C5724"/></radialGradient>
  <linearGradient id="plateSheen" x2="1" y2="1"><stop stop-color="#FFFFFF" stop-opacity="0.1"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="softBig" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="20"/></filter>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="0.018"/></filter>
  <filter id="wsoft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="0.016"/></filter>
  <filter id="wbig" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="0.04"/></filter>
  <clipPath id="floorClip"><path d="M140 558 414 414 688 558 414 710Z"/></clipPath>
  <clipPath id="roomClip"><path d="M140 270 414 126 688 270 688 558 414 710 140 558Z"/></clipPath>
  <clipPath id="screenClip"><rect x="0.157" y="0.117" width="0.706" height="0.346"/></clipPath>
</defs>`;

const WOOD = { top: 'url(#woodTop)', left: 'url(#woodLeft)', right: 'url(#woodRight)' };
const WOOD_DARK = { top: '#6B4426', left: '#4E3018', right: '#3E2712' };
const FAB = { top: 'url(#fabTop)', left: 'url(#fabLeft)', right: 'url(#fabRight)' };
const CUSH = { top: 'url(#cushTop)', left: '#C67F40', right: '#B26E33' };
const CHAR = { top: 'url(#charTop)', left: 'url(#charLeft)', right: 'url(#charRight)' };
const TERRA = { top: 'url(#terraTop)', left: 'url(#terraLeft)', right: 'url(#terraRight)' };

// 房体(顶沿背板/左墙/右墙/地板),夜空与房体分离便于 hero 复用
const ROOM_SHELL = `<path d="M140 270 414 126 688 270 414 414Z" fill="#F6ECCE"/>
<path d="M140 270 414 126 414 414 140 558Z" fill="url(#leftWall)"/>
<path d="M414 126 688 270 688 558 414 414Z" fill="url(#rightWall)"/>
<path d="M140 558 414 414 688 558 414 710Z" fill="url(#floorWood)"/>`;

// 深夜天幕:深蓝渐变 + 星 + 月
const STARS = [
  [62, 90, 2.4, 0.9], [150, 52, 1.6, 0.7], [248, 36, 2, 0.8], [330, 78, 1.4, 0.6],
  [586, 44, 2, 0.8], [662, 178, 1.6, 0.7], [768, 96, 2.2, 0.9], [796, 240, 1.4, 0.6],
  [42, 300, 1.8, 0.7], [84, 470, 1.4, 0.5], [770, 430, 1.8, 0.7], [744, 620, 1.4, 0.5],
  [58, 660, 2, 0.6], [204, 732, 1.4, 0.45], [620, 748, 1.6, 0.5], [400, 60, 1.5, 0.6],
  [716, 330, 1.3, 0.5], [120, 580, 1.5, 0.5]
];
const SKY = `<rect width="828" height="828" fill="url(#sky)"/>
${STARS.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF6D8" opacity="${o}"/>`).join('')}
<circle cx="700" cy="104" r="62" fill="url(#moonGlow)"/>
<circle cx="700" cy="104" r="26" fill="#FFE9B0"/>
<circle cx="692" cy="98" r="5" fill="#F5D78E" opacity=".7"/><circle cx="708" cy="112" r="3.4" fill="#F5D78E" opacity=".6"/>`;

const FRAME = SKY + ROOM_SHELL;

const FLOOR_EDGE = `<path d="M140 558 414 414 688 558" fill="none" stroke="#3E2812" stroke-width="8" opacity=".55"/>
<path d="M414 414V710" fill="none" stroke="#3E2812" stroke-width="8" opacity=".5"/>
<path d="M140 558 414 710 688 558" fill="none" stroke="#F6ECCE" stroke-width="3" opacity=".18"/>`;

// 地板:木板缝 + 板面色差 + 板端接缝 + 暖色反射 + 墙脚环境光遮蔽
function floorPlanks() {
  const parts = [];
  for (let i = 0; i < 7; i += 1) {
    if (i % 2 === 0) {
      const a0 = i / 7;
      const a1 = (i + 1) / 7;
      parts.push(`<path d="M${pt(a0, 0)} L${pt(a1, 0)} L${pt(a1, 1)} L${pt(a0, 1)}Z" fill="#2E1A0A" opacity="0.07"/>`);
    }
  }
  for (let i = 1; i < 7; i += 1) {
    const u = i / 7;
    parts.push(`<path d="M${pt(u, 0)} L${pt(u, 1)}" stroke="#3A2310" stroke-width="2" opacity=".42" fill="none"/>`);
    parts.push(`<path d="M${pt(0, u)} L${pt(1, u)}" stroke="#3A2310" stroke-width="1.2" opacity=".16" fill="none"/>`);
  }
  // 板端接缝(每板一道,位置拟手工错位)
  const seams = [[0.07, 0.3], [0.21, 0.72], [0.36, 0.18], [0.5, 0.55], [0.64, 0.85], [0.79, 0.4], [0.93, 0.62]];
  seams.forEach(([u, v]) => {
    const a = P(u, v);
    const b = P(u, v + 0.142);
    parts.push(`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="#3A2310" stroke-width="1.6" opacity=".3" fill="none"/>`);
  });
  // 高光走向(沿板缝方向的窄亮带,模拟漆面反光)
  parts.push(`<path d="M${pt(0.18, 0)} L${pt(0.18, 1)}" stroke="#C08A4E" stroke-width="7" opacity=".1" fill="none" filter="url(#soft)"/>`);
  parts.push(`<path d="M${pt(0.6, 0)} L${pt(0.6, 1)}" stroke="#C08A4E" stroke-width="9" opacity=".08" fill="none" filter="url(#soft)"/>`);
  return `<g clip-path="url(#floorClip)">${parts.join('')}</g>`;
}

// ---- 唱片墙槽位(左墙,2 层 × 6 槽) ----
const SLOT_S0 = 0.085;
const SLOT_PITCH = 0.143;
const SLOT_W = 0.125;
const SHELF_T = [0.56, 0.82];
const COVER_H = 0.16;

function slotWallRect(i) {
  const shelf = Math.floor(i / 6);
  const col = i % 6;
  const s = SLOT_S0 + col * SLOT_PITCH;
  const t1 = SHELF_T[shelf];
  return { s, t0: t1 - COVER_H - 0.005, t1: t1 - 0.005 };
}

// 槽位板材锚点(%):板材 130×96 内容固定偏移(ox=56, oy=10),直接换算
const PLATE_OX = 56;
const PLATE_OY = 10;

function slotBBox(i) {
  const { s, t0 } = slotWallRect(i);
  const origin = LW(s, t0); // 封套单位方形的 (0,0) 角在画布上的位置
  return {
    left: pct(origin[0] - PLATE_OX),
    top: pct(origin[1] - PLATE_OY),
    width: pct(PLATE_W),
    height: pct(PLATE_H)
  };
}

// ---- 左墙:唱片墙 + 海报 + 霓虹 + 圆镜 + 挂墙耳机 + 悬挂植物 ----
function leftWall() {
  const lw = [];
  // 墙面氛围:墙角/顶沿 AO + 哑光微颗粒 + 踢脚线
  lw.push('<rect x="0" y="0" width="0.08" height="1" fill="url(#cornerShade)"/>');
  lw.push('<rect x="0" y="0" width="1" height="0.07" fill="url(#ceilShade)"/>');
  lw.push(specklesIn(70, 11, { x: 0.02, y: 0.02, w: 0.96, h: 0.96 }, 0.0012, 0.0032, '#8A6A44', 0.08, 0.2));
  lw.push('<rect x="0" y="0.962" width="1" height="0.038" fill="#DECCA6"/><path d="M0 0.962 H1" stroke="#B9A37E" stroke-width="0.004"/>');

  // 顶部悬挂植物(壁挂陶盆 + 垂蔓)
  lw.push(`<g>
    <path d="M0.916 0.004 L0.929 0.064 M0.97 0.004 L0.953 0.064" stroke="#6B4A2E" stroke-width="0.006"/>
    <path d="M0.91 0.064 h0.062 l-0.009 0.05 h-0.044 Z" fill="#B65A38"/>
    <rect x="0.906" y="0.058" width="0.07" height="0.013" rx="0.005" fill="#8A4A28"/>
    <path d="M0.92 0.112 q-0.012 0.06 -0.03 0.1 q-0.01 0.05 -0.026 0.08" stroke="#2F5A38" stroke-width="0.009" fill="none"/>
    <path d="M0.94 0.112 q0.005 0.07 -0.006 0.13" stroke="#3E7048" stroke-width="0.008" fill="none"/>
    <path d="M0.958 0.112 q0.014 0.05 0.02 0.105" stroke="#35663F" stroke-width="0.008" fill="none"/>
    <ellipse cx="0.903" cy="0.16" rx="0.014" ry="0.022" fill="#3E7048" transform="rotate(-24 0.903 0.16)"/>
    <ellipse cx="0.884" cy="0.245" rx="0.013" ry="0.02" fill="#2F5A38" transform="rotate(-18 0.884 0.245)"/>
    <ellipse cx="0.933" cy="0.178" rx="0.013" ry="0.021" fill="#35663F"/>
    <ellipse cx="0.94" cy="0.238" rx="0.012" ry="0.019" fill="#3E7048"/>
    <ellipse cx="0.975" cy="0.188" rx="0.013" ry="0.02" fill="#2F5A38" transform="rotate(16 0.975 0.188)"/>
    <ellipse cx="0.912" cy="0.205" rx="0.012" ry="0.018" fill="#35663F" transform="rotate(-30 0.912 0.205)"/>
    <ellipse cx="0.928" cy="0.102" rx="0.017" ry="0.025" fill="#3E7048"/>
    <ellipse cx="0.953" cy="0.1" rx="0.016" ry="0.023" fill="#2F5A38" transform="rotate(14 0.953 0.1)"/>
    <ellipse cx="0.941" cy="0.09" rx="0.015" ry="0.02" fill="#4A8256" transform="rotate(-8 0.941 0.09)"/>
  </g>`);

  // 三联复古海报(胡桃木细框 + 卡纸 + 抽象画芯)
  const frameArt = (s, t, w, h, art) => `
    <rect x="${s - 0.008}" y="${t - 0.008}" width="${w + 0.016}" height="${h + 0.016}" fill="#4A3624"/>
    <rect x="${s}" y="${t}" width="${w}" height="${h}" fill="#F3EAD6"/>
    ${art}`;
  lw.push(frameArt(0.06, 0.05, 0.1, 0.13, `
    <rect x="0.066" y="0.056" width="0.088" height="0.118" fill="#22384A"/>
    <circle cx="0.11" cy="0.1" r="0.026" fill="#F0A93C"/>
    <path d="M0.066 0.174 L0.095 0.13 L0.115 0.155 L0.132 0.122 L0.154 0.174Z" fill="#16263A"/>`));
  lw.push(frameArt(0.18, 0.05, 0.1, 0.13, `
    <rect x="0.186" y="0.056" width="0.088" height="0.118" fill="#B65A38"/>
    <path d="M0.186 0.174 L0.274 0.056" stroke="#F3E7CE" stroke-width="0.014"/>
    <path d="M0.186 0.14 L0.25 0.056" stroke="#F3E7CE" stroke-width="0.006" opacity=".7"/>
    <circle cx="0.208" cy="0.14" r="0.012" fill="#26221A"/>`));
  lw.push(frameArt(0.76, 0.05, 0.1, 0.13, `
    <rect x="0.766" y="0.056" width="0.088" height="0.118" fill="#2F6B4E"/>
    <path d="M0.778 0.15 l0.024 -0.05 0.024 0.05Z" fill="#F0A93C"/>
    <path d="M0.8 0.15 l0.018 -0.036 0.018 0.036Z" fill="#1D4A34"/>
    <circle cx="0.836" cy="0.076" r="0.009" fill="#F3E7CE"/>`));

  // ROOMIE 琥珀霓虹(辉光 + 灯管描边 + 白熾灯芯)
  lw.push(`<ellipse cx="0.5" cy="0.158" rx="0.21" ry="0.06" fill="#F0A93C" opacity=".16" filter="url(#wbig)"/>`);
  lw.push(`<g transform="translate(1 0) scale(-1 1)"><g font-family="Verdana, sans-serif" font-weight="700" font-size="0.08" letter-spacing="0.008" text-anchor="middle">
    <text x="0.5" y="0.168" fill="none" stroke="#F0A93C" stroke-width="0.024" filter="url(#glow)">ROOMIE</text>
    <text x="0.5" y="0.168" fill="#FFF3D2" stroke="#FFDF96" stroke-width="0.005">ROOMIE</text>
  </g></g>`);

  // 拍立得小照片 ×2(胶带固定,微微倾斜)
  lw.push(`<g transform="rotate(-4 0.445 0.325)">
    <rect x="0.417" y="0.296" width="0.056" height="0.066" fill="#F6EFDD"/>
    <rect x="0.422" y="0.301" width="0.046" height="0.044" fill="#3B4A6B"/>
    <circle cx="0.445" cy="0.318" r="0.009" fill="#F0A93C"/>
    <rect x="0.436" y="0.289" width="0.018" height="0.009" fill="#D8C7AE" opacity=".85"/>
  </g>`);
  lw.push(`<g transform="rotate(3 0.52 0.33)">
    <rect x="0.492" y="0.3" width="0.056" height="0.066" fill="#F6EFDD"/>
    <rect x="0.497" y="0.305" width="0.046" height="0.044" fill="#6B3B3B"/>
    <path d="M0.497 0.349 L0.512 0.326 L0.522 0.34 L0.53 0.322 L0.543 0.349Z" fill="#3A1F1F"/>
    <rect x="0.511" y="0.293" width="0.018" height="0.009" fill="#D8C7AE" opacity=".85"/>
  </g>`);

  // 黄铜圆镜(暗玻璃 + 月色反光)
  lw.push(`<circle cx="0.13" cy="0.37" r="0.075" fill="#B97F2E"/>
  <circle cx="0.13" cy="0.37" r="0.075" fill="none" stroke="#8A5A1C" stroke-width="0.006"/>
  <circle cx="0.13" cy="0.37" r="0.062" fill="#22303F"/>
  <path d="M0.095 0.345 a0.05 0.05 0 0 1 0.05 -0.03" stroke="#FFE9B0" stroke-width="0.01" fill="none" opacity=".8"/>
  <circle cx="0.148" cy="0.392" r="0.012" fill="#FFE9B0" opacity=".35"/>
  <circle cx="0.13" cy="0.296" r="0.006" fill="#8A5A1C"/>`);

  // 挂墙耳机(挂钩 + 头梁 + 耳罩 + 垂线)
  lw.push(`<rect x="0.878" y="0.322" width="0.02" height="0.012" rx="0.005" fill="#4A3624"/>
  <path d="M0.845 0.352 a0.045 0.045 0 0 1 0.09 0" fill="none" stroke="#26221A" stroke-width="0.014"/>
  <path d="M0.849 0.352 a0.041 0.041 0 0 1 0.082 0" fill="none" stroke="#4B5158" stroke-width="0.004" opacity=".8"/>
  <rect x="0.835" y="0.345" width="0.026" height="0.052" rx="0.011" fill="#26221A"/>
  <rect x="0.839" y="0.35" width="0.014" height="0.042" rx="0.006" fill="#3A3F47"/>
  <rect x="0.919" y="0.345" width="0.026" height="0.052" rx="0.011" fill="#26221A"/>
  <rect x="0.923" y="0.35" width="0.014" height="0.042" rx="0.006" fill="#3A3F47"/>
  <path d="M0.848 0.398 q0.012 0.05 -0.008 0.092" stroke="#26221A" stroke-width="0.006" fill="none"/>`);

  // 唱片架:胡桃木层板(高光沿 + 木纹 + 托架)+ 层板下灯带 + 槽位虚线
  SHELF_T.forEach((t) => {
    lw.push(`<rect x="0.06" y="${t + 0.038}" width="0.9" height="0.08" fill="url(#ledGrad)"/>`);
    lw.push(`<rect x="0.06" y="${t}" width="0.9" height="0.026" fill="#7A5230"/>
      <rect x="0.06" y="${t + 0.026}" width="0.9" height="0.012" fill="#4E3319"/>
      <path d="M0.06 ${t + 0.002} H0.96" stroke="#A87B4A" stroke-width="0.004" opacity=".8"/>
      <path d="M0.08 ${t + 0.01} H0.94 M0.1 ${t + 0.019} H0.9" stroke="#5A3A1F" stroke-width="0.002" opacity=".5"/>`);
    [0.2, 0.55, 0.9].forEach((s) => {
      lw.push(`<path d="M${s} ${t + 0.038} l0.02 0 l-0.018 0.032 Z" fill="#4E3319" opacity=".85"/>`);
    });
  });
  for (let i = 0; i < 12; i += 1) {
    const { s, t0 } = slotWallRect(i);
    lw.push(`<rect x="${s}" y="${t0}" width="${SLOT_W}" height="${COVER_H}" fill="rgba(78,51,25,.14)" stroke="#6B4A2E" stroke-width="0.004" stroke-dasharray="0.012 0.01" opacity=".65"/>`);
  }

  return `<g transform="matrix(-274 144 0 288 414 126)">${lw.join('')}</g>`;
}

// ---- 右墙:放映幕(海上生明月)+ 小层板相框 + 冷光溢出 ----
function rightWall() {
  const rw = [];
  rw.push('<rect x="0" y="0" width="0.08" height="1" fill="url(#cornerShade)"/>');
  rw.push('<rect x="0" y="0" width="1" height="0.07" fill="url(#ceilShade)"/>');
  rw.push(specklesIn(70, 23, { x: 0.02, y: 0.02, w: 0.96, h: 0.96 }, 0.0012, 0.0032, '#8A6A44', 0.08, 0.2));
  rw.push('<rect x="0" y="0.962" width="1" height="0.038" fill="#D8C69E"/><path d="M0 0.962 H1" stroke="#B29E7C" stroke-width="0.004"/>');

  // 放映幕冷光晕(框后)+ 胡桃木框 + 黑 bezel
  rw.push('<rect x="0.05" y="0.02" width="0.92" height="0.56" fill="url(#screenHalo)" filter="url(#wbig)"/>');
  rw.push('<rect x="0.12" y="0.08" width="0.78" height="0.42" fill="#33220F"/>');
  rw.push('<path d="M0.12 0.08 H0.9 M0.12 0.5 H0.9" stroke="#54381C" stroke-width="0.004" opacity=".8"/>');
  rw.push('<rect x="0.13" y="0.09" width="0.76" height="0.4" fill="none" stroke="#120C06" stroke-width="0.012"/>');

  // 幕内夜景:深海蓝天 + 星 + 大月亮 + 云 + 城市剪影亮窗 + 海面月光倒影
  const scr = [];
  scr.push('<rect x="0.157" y="0.117" width="0.706" height="0.346" fill="url(#screenSky)"/>');
  scr.push(specklesIn(26, 31, { x: 0.18, y: 0.13, w: 0.64, h: 0.19 }, 0.0012, 0.003, '#FFF6D8', 0.3, 0.85));
  scr.push('<circle cx="0.72" cy="0.205" r="0.115" fill="url(#moonGlow)"/>');
  scr.push('<circle cx="0.72" cy="0.205" r="0.055" fill="#FFE9B0"/>');
  scr.push('<circle cx="0.703" cy="0.192" r="0.009" fill="#F0D18A" opacity=".8"/><circle cx="0.735" cy="0.222" r="0.006" fill="#F0D18A" opacity=".7"/><circle cx="0.727" cy="0.184" r="0.004" fill="#F0D18A" opacity=".6"/>');
  scr.push('<ellipse cx="0.6" cy="0.215" rx="0.1" ry="0.012" fill="#0E2240" opacity=".55" filter="url(#wsoft)"/>');
  scr.push('<ellipse cx="0.81" cy="0.168" rx="0.07" ry="0.01" fill="#162C4C" opacity=".5" filter="url(#wsoft)"/>');
  scr.push('<rect x="0.157" y="0.34" width="0.706" height="0.123" fill="url(#screenSea)"/>');
  scr.push('<path d="M0.157 0.34 V0.302 h0.028 V0.272 h0.035 V0.316 h0.026 V0.257 h0.038 V0.301 h0.028 V0.238 h0.042 V0.291 h0.026 V0.266 h0.036 V0.322 h0.028 V0.282 h0.034 V0.34 Z" fill="#081222"/>');
  const wins = [[0.168, 0.308], [0.179, 0.32], [0.196, 0.286], [0.206, 0.302], [0.228, 0.274], [0.239, 0.292], [0.262, 0.254], [0.273, 0.272], [0.286, 0.302], [0.3, 0.278], [0.318, 0.298], [0.336, 0.288], [0.352, 0.312], [0.366, 0.292]];
  scr.push(`<g fill="#FFC46B" opacity=".9">${wins.map(([x, y]) => `<rect x="${x}" y="${y}" width="0.005" height="0.007"/>`).join('')}</g>`);
  scr.push('<path d="M0.157 0.34 H0.51" stroke="#1E3C62" stroke-width="0.002" opacity=".8"/>');
  // 月光倒影:自月而下的碎金光柱
  const refl = [[0.352, 0.05, 0.68], [0.363, 0.078, 0.6], [0.376, 0.104, 0.52], [0.392, 0.132, 0.44], [0.41, 0.158, 0.36], [0.43, 0.186, 0.28], [0.45, 0.21, 0.2]];
  refl.forEach(([y, w, o]) => {
    scr.push(`<path d="M${(0.72 - w / 2).toFixed(3)} ${y} h${w.toFixed(3)}" stroke="#FFE9B0" stroke-width="0.0045" opacity="${o}"/>`);
  });
  scr.push('<path d="M0.2 0.378 h0.28 M0.55 0.4 h0.27 M0.23 0.428 h0.3 M0.6 0.448 h0.2" stroke="#2A4A6E" stroke-width="0.003" opacity=".5"/>');
  scr.push('<path d="M0.32 0.117 L0.56 0.117 L0.36 0.463 L0.157 0.463 Z" fill="#FFFFFF" opacity="0.045"/>');
  rw.push(`<g clip-path="url(#screenClip)">${scr.join('')}</g>`);
  rw.push('<circle cx="0.852" cy="0.478" r="0.005" fill="#F0A93C"/>'); // 待机灯

  // 幕下墙面冷光余晖
  rw.push('<rect x="0.157" y="0.505" width="0.706" height="0.09" fill="url(#coolFade)"/>');

  // 幕下小层板:胡桃木 + 托架 + 两只相框
  rw.push(`<rect x="0.2" y="0.6" width="0.42" height="0.022" fill="#7A5230"/>
    <rect x="0.2" y="0.622" width="0.42" height="0.01" fill="#4E3319"/>
    <path d="M0.2 0.602 H0.62" stroke="#A87B4A" stroke-width="0.003" opacity=".8"/>
    <path d="M0.28 0.632 l0.018 0 l-0.015 0.026 Z M0.54 0.632 l0.018 0 l-0.015 0.026 Z" fill="#4E3319" opacity=".85"/>`);
  rw.push(`<rect x="0.227" y="0.477" width="0.096" height="0.126" fill="#4A3624"/>
    <rect x="0.235" y="0.485" width="0.08" height="0.1" fill="#C9821E"/>
    <circle cx="0.275" cy="0.53" r="0.025" fill="#26221A"/>
    <circle cx="0.275" cy="0.53" r="0.01" fill="#D9A441"/>
    <path d="M0.235 0.585 L0.315 0.485" stroke="#F3E7CE" stroke-width="0.005" opacity=".5"/>`);
  rw.push(`<rect x="0.372" y="0.497" width="0.096" height="0.106" fill="#4A3624"/>
    <rect x="0.38" y="0.505" width="0.08" height="0.08" fill="#3B4A6B"/>
    <path d="M0.38 0.585 L0.46 0.505" stroke="#ECE2CB" stroke-width="0.01"/>
    <circle cx="0.4" cy="0.525" r="0.011" fill="#FFE9B0"/>`);

  return `<g transform="matrix(274 144 0 288 414 126)">${rw.join('')}</g>`;
}

// ---- 地面固定件:茶几(杂志+咖啡)+ 散落黑胶 ----
function floorFixtures() {
  const fl = [];

  // 胡桃木茶几:几面(顶高 26 不变)+ 细腿 + 杂志 + 咖啡杯
  const tc = P(0.36, 0.58);
  fl.push(shadow(tc[0], tc[1] + 2, 52, 15, 0.35));
  [[0.289, 0.509], [0.416, 0.509], [0.289, 0.616], [0.416, 0.616]].forEach(([u, v]) => {
    fl.push(isoBox(u, v, 0.016, 0.016, 18, WOOD_DARK));
  });
  fl.push(isoBox(0.28, 0.50, 0.16, 0.14, 8, WOOD, 18));
  fl.push(grainTopU(0.28, 0.50, 0.16, 0.14, 26, 3));
  fl.push(`<path d="M${topPt(0.28, 0.64, 26)} L${topPt(0.44, 0.64, 26)}" stroke="#C89A66" stroke-width="1.4" opacity=".6" fill="none"/>`);
  // 杂志叠(避开放映机位)
  fl.push(`<path d="M${topPt(0.292, 0.59, 26)} L${topPt(0.352, 0.59, 26)} L${topPt(0.352, 0.634, 26)} L${topPt(0.292, 0.634, 26)}Z" fill="#E8DCC2"/>`);
  fl.push(`<path d="M${topPt(0.296, 0.594, 26.8)} L${topPt(0.346, 0.594, 26.8)} L${topPt(0.346, 0.63, 26.8)} L${topPt(0.296, 0.63, 26.8)}Z" fill="#B65A38"/>`);
  fl.push(`<path d="M${topPt(0.3, 0.598, 27.6)} L${topPt(0.33, 0.598, 27.6)} L${topPt(0.33, 0.62, 27.6)} L${topPt(0.3, 0.62, 27.6)}Z" fill="#3B4A6B"/>`);
  // 咖啡杯 + 碟 + 热气
  const cup = P(0.405, 0.56, 26);
  fl.push(`<ellipse cx="${cup[0]}" cy="${cup[1]}" rx="8" ry="3.2" fill="#E3D5BC"/>`);
  fl.push(`<rect x="${cup[0] - 5}" y="${cup[1] - 12}" width="10" height="10" rx="2" fill="#F6EFDD"/>`);
  fl.push(`<rect x="${cup[0] - 5}" y="${cup[1] - 5}" width="10" height="3" rx="1.5" fill="#DCC9A8"/>`);
  fl.push(`<ellipse cx="${cup[0]}" cy="${cup[1] - 12}" rx="5" ry="2.4" fill="#C9821E"/><ellipse cx="${cup[0]}" cy="${cup[1] - 12}" rx="3.4" ry="1.5" fill="#6B4223"/>`);
  fl.push(`<path d="M${cup[0] + 5} ${cup[1] - 9} q5 1 0 5" stroke="#F6EFDD" stroke-width="1.8" fill="none"/>`);
  fl.push(`<path d="M${cup[0] - 2} ${cup[1] - 16} q2 -4 0 -8 M${cup[0] + 2} ${cup[1] - 17} q2 -4 0 -8" stroke="#FFF6E8" stroke-width="1.1" opacity=".4" fill="none"/>`);

  // 地面散落黑胶 ×2(一张垫着封套):同心纹 + 标签 + 高光弧
  const disc = (u, v, label, rot) => {
    const c = P(u, v);
    return `<g transform="rotate(${rot} ${c[0]} ${c[1]})">
      <ellipse cx="${c[0]}" cy="${c[1]}" rx="24" ry="10" fill="url(#vinylGrad)"/>
      <ellipse cx="${c[0]}" cy="${c[1]}" rx="18.5" ry="7.6" fill="none" stroke="#333C48" stroke-width="0.9" opacity=".8"/>
      <ellipse cx="${c[0]}" cy="${c[1]}" rx="12.5" ry="5" fill="none" stroke="#333C48" stroke-width="0.8" opacity=".7"/>
      <circle cx="${c[0]}" cy="${c[1]}" r="4.5" fill="${label}"/><circle cx="${c[0]}" cy="${c[1]}" r="1.1" fill="#F6EFDD"/>
      <path d="M${c[0] - 18} ${c[1] - 5} a19 8 0 0 1 12 -3.4" stroke="#E8F0FF" stroke-width="1.6" opacity=".22" fill="none"/>
    </g>`;
  };
  const sleeveC = P(0.615, 0.685);
  fl.push(`<g transform="rotate(-14 ${sleeveC[0]} ${sleeveC[1]})">
    <rect x="${sleeveC[0] - 24}" y="${sleeveC[1] - 11}" width="48" height="22" rx="1.5" fill="#EFE3C8"/>
    <rect x="${sleeveC[0] - 24}" y="${sleeveC[1] - 11}" width="48" height="22" rx="1.5" fill="none" stroke="#C9B48E" stroke-width="1.2"/>
    <circle cx="${sleeveC[0]}" cy="${sleeveC[1]}" r="7" fill="#C9603C" opacity=".8"/>
  </g>`);
  fl.push(disc(0.56, 0.66, '#C9603C', -24));
  fl.push(disc(0.635, 0.70, '#F0A93C', -18));

  return `<g>${fl.join('')}</g>`;
}

// ---- 光照:暖光洗墙 + 放映幕冷光溢地 + 全局暗角(裁剪在房体内) ----
function lighting() {
  return `<g clip-path="url(#roomClip)">
  <ellipse cx="420" cy="470" rx="330" ry="240" fill="url(#warmWash)"/>
  <rect x="430" y="471" width="260" height="68" fill="url(#coolSpill)" transform="rotate(20 560 505)" filter="url(#soft)"/>
  <rect width="828" height="828" fill="url(#vig)"/>
</g>
<path d="M140 558 414 414 688 558 414 710Z" fill="url(#floorSheen)"/>`;
}

// ---- 房间内容(墙面装饰 + 唱片架空槽 + 固定家具),底图与 hero 共用 ----
function roomContent() {
  return [floorPlanks(), leftWall(), rightWall(), floorFixtures(), lighting()].join('\n');
}

function buildBase() {
  return wrap(roomContent());
}

// ---- DIY 家具覆盖层 ----
const OVERLAYS = {
  // 橙褐布艺沙发:统一体量 + 软包卷边(圆头笔触)+ 斜倚靠枕 + 抱枕 + 搭毯
  sofa() {
    let s = shadow(P(0.11, 0.47)[0] + 6, P(0.11, 0.47)[1] + 4, 94, 24, 0.36);
    [[0.032, 0.335], [0.152, 0.335], [0.032, 0.545], [0.152, 0.545]].forEach(([u, v]) => {
      s += isoBox(u, v, 0.02, 0.02, 7, WOOD_DARK);
    });
    s += isoBox(0.02, 0.32, 0.16, 0.26, 26, FAB, 7); // 底座
    s += isoBox(0.02, 0.30, 0.05, 0.30, 50, FAB, 7); // 靠背体
    s += isoBox(0.02, 0.30, 0.16, 0.05, 33, FAB, 7); // 远扶手
    s += isoBox(0.02, 0.55, 0.16, 0.05, 33, FAB, 7); // 近扶手
    s += isoBox(0.07, 0.355, 0.11, 0.095, 8, CUSH, 33); // 坐垫 ×2
    s += isoBox(0.07, 0.455, 0.11, 0.095, 8, CUSH, 33);
    // 斜倚靠枕(屏幕空间圆角矩形,压出柔软感)
    [[P(0.075, 0.395, 52), -16], [P(0.075, 0.5, 52), -10]].forEach(([pc, rot]) => {
      s += `<g transform="rotate(${rot} ${pc[0].toFixed(1)} ${pc[1].toFixed(1)})">
        <rect x="${(pc[0] - 18).toFixed(1)}" y="${(pc[1] - 15).toFixed(1)}" width="36" height="30" rx="10" fill="#E7A964"/>
        <rect x="${(pc[0] - 13).toFixed(1)}" y="${(pc[1] - 10).toFixed(1)}" width="26" height="20" rx="7" fill="none" stroke="#C97C3C" stroke-width="1.4" opacity=".7"/>
        <path d="M${(pc[0] - 14).toFixed(1)} ${(pc[1] + 12).toFixed(1)} q14 5 28 0" stroke="#B26A30" stroke-width="2" opacity=".5" fill="none"/>
      </g>`;
    });
    // 软包卷边:靠背顶 / 双扶手顶 / 坐垫前唇(圆头粗笔触)
    const roll = (a, b, w, color) => `<path d="M${pt(a[0], a[1], a[2])} L${pt(b[0], b[1], b[2])}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
    s += roll([0.045, 0.315, 57], [0.045, 0.585, 57], 12, '#E8AC66');
    s += roll([0.035, 0.325, 40], [0.165, 0.325, 40], 10, '#E8AC66');
    s += roll([0.035, 0.575, 40], [0.165, 0.575, 40], 10, '#E8AC66');
    s += roll([0.178, 0.362, 39], [0.178, 0.443, 39], 9, '#E5A862');
    s += roll([0.178, 0.462, 39], [0.178, 0.543, 39], 9, '#E5A862');
    // 坐垫中缝 + 底座前缝
    s += `<path d="M${topPt(0.07, 0.4525, 41)} L${topPt(0.18, 0.4525, 41)}" stroke="#A86430" stroke-width="1.2" opacity=".65" fill="none"/>`;
    s += `<path d="M${pt(0.181, 0.34, 20)} L${pt(0.181, 0.56, 20)}" stroke="#8A5626" stroke-width="1.2" opacity=".45" fill="none"/>`;
    // 琥珀抱枕(微倾 + 收腰)
    const pc = P(0.135, 0.515, 47);
    s += `<g transform="rotate(18 ${pc[0].toFixed(1)} ${pc[1].toFixed(1)})">
      <rect x="${(pc[0] - 10).toFixed(1)}" y="${(pc[1] - 8).toFixed(1)}" width="20" height="16" rx="7" fill="#F0A93C"/>
      <path d="M${pc[0].toFixed(1)} ${(pc[1] - 7).toFixed(1)} q-2 8 0 15" stroke="#D98A1E" stroke-width="1.2" fill="none" opacity=".8"/>
    </g>`;
    // 搭毯(越过近扶手外侧垂下,波浪摆 + 条纹)
    const b0 = P(0.085, 0.572, 41);
    const b1 = P(0.155, 0.572, 41);
    const b2 = P(0.16, 0.612, 16);
    const b3 = P(0.085, 0.612, 16);
    s += `<path d="M${b0[0].toFixed(1)} ${b0[1].toFixed(1)} L${b1[0].toFixed(1)} ${b1[1].toFixed(1)} L${b2[0].toFixed(1)} ${b2[1].toFixed(1)} q-4 3 -8 0 q-5 2 -9 -1 L${b3[0].toFixed(1)} ${b3[1].toFixed(1)} q-3 -3 -4 -6 Z" fill="#EFE3C4"/>`;
    s += `<path d="M${(b0[0] + 8).toFixed(1)} ${(b0[1] + 3).toFixed(1)} L${(b2[0] - 8).toFixed(1)} ${(b2[1] + 2).toFixed(1)} M${(b0[0] + 15).toFixed(1)} ${(b0[1] + 5).toFixed(1)} L${(b2[0] - 2).toFixed(1)} ${(b2[1] + 2).toFixed(1)}" stroke="#C9603C" stroke-width="2" opacity=".8" fill="none"/>`;
    return s;
  },

  // 黑胶机柜:胡桃木长柜(竖排唱片收纳 + 柜门)+ 唱盘唱臂 + 炭黑书架箱 ×2
  'vinyl-player'() {
    let s = shadow(P(0.69, 0.11)[0], P(0.69, 0.11)[1] + 2, 114, 22, 0.33);
    // 电源线:柜底右端 → 右墙角(压在柜体下)
    const cb0 = P(0.955, 0.176, 5);
    const cb1 = P(0.995, 0.085);
    s += `<path d="M${cb0[0].toFixed(1)} ${cb0[1].toFixed(1)} Q${((cb0[0] + cb1[0]) / 2 + 4).toFixed(1)} ${(cb0[1] + 8).toFixed(1)} ${cb1[0].toFixed(1)} ${cb1[1].toFixed(1)}" stroke="#1A130C" stroke-width="2.2" opacity=".5" fill="none"/>`;
    [[0.435, 0.035], [0.918, 0.035], [0.435, 0.142], [0.918, 0.142]].forEach(([u, v]) => {
      s += isoBox(u, v, 0.022, 0.022, 8, WOOD_DARK);
    });
    s += isoBox(0.42, 0.02, 0.54, 0.16, 54, WOOD, 8); // 柜体(顶 62)
    s += grainTopU(0.42, 0.02, 0.54, 0.16, 62, 3);
    s += `<path d="M${topPt(0.42, 0.18, 62)} L${topPt(0.96, 0.18, 62)}" stroke="#C89A66" stroke-width="1.5" opacity=".55" fill="none"/>`;
    // 前面板:左-竖排唱片收纳格,右-对开柜门
    s += `<path d="M${pt(0.45, 0.18, 53)} L${pt(0.615, 0.18, 53)} L${pt(0.615, 0.18, 12)} L${pt(0.45, 0.18, 12)}Z" fill="#170E06"/>`;
    const spines = ['#3B4A6B', '#6B3B3B', '#3B6B4F', '#6B5A3B', '#4F3B6B', '#2F5D6B', '#B65A38', '#C9821E', '#5A3A5E', '#22384A'];
    for (let i = 0; i < 10; i += 1) {
      if (i === 6) continue; // 抽出一张的缺口
      const u = 0.456 + i * 0.0155;
      const top = 44 - (i % 3) * 3 - ((i * 7) % 4);
      s += `<path d="M${pt(u, 0.181, 13)} L${pt(u, 0.181, top)}" stroke="${spines[i]}" stroke-width="4.2" opacity=".95" fill="none"/>`;
    }
    s += `<path d="M${pt(0.45, 0.181, 53)} L${pt(0.615, 0.181, 53)}" stroke="#000" stroke-width="2" opacity=".4" fill="none"/>`;
    [[0.648, 0.782], [0.798, 0.932]].forEach(([du0, du1]) => {
      s += `<path d="M${pt(du0, 0.18, 54)} L${pt(du1, 0.18, 54)} L${pt(du1, 0.18, 10)} L${pt(du0, 0.18, 10)}Z" fill="#633F22" stroke="#3E2712" stroke-width="1"/>`;
      [0.33, 0.66].forEach((f) => {
        const u = du0 + (du1 - du0) * f;
        s += `<path d="M${pt(u, 0.181, 50)} L${pt(u, 0.181, 14)}" stroke="#54351C" stroke-width="1" opacity=".7" fill="none"/>`;
      });
    });
    [0.786, 0.794].forEach((u) => {
      const k = P(u, 0.182, 31);
      s += `<circle cx="${k[0].toFixed(1)}" cy="${k[1].toFixed(1)}" r="2.2" fill="#D9A441"/>`;
    });
    // 唱机:炭黑唱盘座 + 唱盘(同心纹+高光)+ 银色唱臂
    s += isoBox(0.46, 0.04, 0.17, 0.11, 12, CHAR, 62);
    s += `<path d="M${topPt(0.46, 0.15, 74)} L${topPt(0.63, 0.15, 74)}" stroke="#57503F" stroke-width="1.2" opacity=".7" fill="none"/>`;
    const led = P(0.615, 0.142, 70);
    s += `<circle cx="${led[0].toFixed(1)}" cy="${led[1].toFixed(1)}" r="1.3" fill="#F0A93C"/>`;
    const pl = P(PLATTER_POS.u, PLATTER_POS.v, PLATTER_POS.h);
    s += `<ellipse cx="${pl[0]}" cy="${pl[1]}" rx="27" ry="11.5" fill="url(#vinylGrad)"/>
      <ellipse cx="${pl[0]}" cy="${pl[1]}" rx="21" ry="8.8" fill="none" stroke="#333C48" stroke-width="0.9" opacity=".85"/>
      <ellipse cx="${pl[0]}" cy="${pl[1]}" rx="14.5" ry="6" fill="none" stroke="#333C48" stroke-width="0.8" opacity=".75"/>
      <ellipse cx="${pl[0]}" cy="${pl[1]}" rx="8.5" ry="3.4" fill="none" stroke="#333C48" stroke-width="0.7" opacity=".6"/>
      <circle cx="${pl[0]}" cy="${pl[1]}" r="5" fill="#D9A441"/><circle cx="${pl[0]}" cy="${pl[1]}" r="1.5" fill="#F6EFDD"/>
      <path d="M${(pl[0] - 21).toFixed(1)} ${(pl[1] - 6).toFixed(1)} a22 9 0 0 1 13 -4" stroke="#E8F0FF" stroke-width="1.8" opacity=".25" fill="none"/>`;
    const armBase = P(0.6, 0.055, 74);
    const armTip = P(0.545, 0.092, 77);
    s += `<path d="M${armBase[0].toFixed(1)} ${armBase[1].toFixed(1)} L${armTip[0].toFixed(1)} ${armTip[1].toFixed(1)}" stroke="#C9CDD4" stroke-width="3" fill="none"/>
      <path d="M${(armBase[0] - 1).toFixed(1)} ${(armBase[1] - 1).toFixed(1)} L${(armTip[0] - 1).toFixed(1)} ${(armTip[1] - 1).toFixed(1)}" stroke="#8B96AC" stroke-width="1" fill="none"/>
      <circle cx="${armBase[0]}" cy="${armBase[1]}" r="4" fill="#8B96AC" stroke="#C9CDD4" stroke-width="1.2"/>
      <circle cx="${(armBase[0] + 5).toFixed(1)}" cy="${(armBase[1] + 1).toFixed(1)}" r="2.6" fill="#4B5158"/>
      <rect x="${(armTip[0] - 4).toFixed(1)}" y="${(armTip[1] - 1).toFixed(1)}" width="7" height="4" rx="1.5" fill="#26221A" transform="rotate(38 ${armTip[0].toFixed(1)} ${armTip[1].toFixed(1)})"/>`;
    // 书架音箱 ×2(炭黑箱体 + 低音盆 + 高音)
    [0.67, 0.8].forEach((u) => {
      s += isoBox(u, 0.045, 0.08, 0.09, 30, CHAR, 62);
      s += `<path d="M${pt(u + 0.006, 0.136, 88)} L${pt(u + 0.074, 0.136, 88)} L${pt(u + 0.074, 0.136, 66)} L${pt(u + 0.006, 0.136, 66)}Z" fill="#100D09"/>`;
      const cone = P(u + 0.04, 0.137, 74);
      s += `<circle cx="${cone[0]}" cy="${cone[1]}" r="7" fill="#22262E" stroke="#4B5158" stroke-width="1.5"/>
        <circle cx="${cone[0]}" cy="${cone[1]}" r="2.2" fill="#F0A93C"/>`;
      const tw = P(u + 0.04, 0.137, 84.5);
      s += `<circle cx="${tw[0]}" cy="${tw[1]}" r="2.6" fill="#22262E" stroke="#4B5158" stroke-width="1"/>`;
      s += `<path d="M${topPt(u, 0.135, 92)} L${topPt(u + 0.08, 0.135, 92)}" stroke="#57503F" stroke-width="1" opacity=".6" fill="none"/>`;
    });
    return s;
  },

  // 弧形落地灯:光池 + 光锥 + 金属灯杆 + 半透灯罩
  lamp() {
    const b = P(0.9, 0.36);
    const sx = b[0] - 84;
    const sy = b[1] - 126;
    return `<ellipse cx="${sx}" cy="${b[1] - 26}" rx="98" ry="32" fill="url(#lampPool)"/>`
      + `<path d="M${sx - 14} ${sy + 20} L${sx + 14} ${sy + 26} L${sx + 48} ${b[1] - 8} L${sx - 52} ${b[1] - 16} Z" fill="url(#lampCone)" opacity=".55" filter="url(#soft)"/>`
      + `<circle cx="${sx}" cy="${sy}" r="62" fill="#FFD9A0" opacity=".32" filter="url(#softBig)"/>`
      + `<ellipse cx="${b[0]}" cy="${b[1]}" rx="18" ry="7.5" fill="#211D17"/><ellipse cx="${b[0] - 2}" cy="${b[1] - 1.5}" rx="11" ry="4.2" fill="#3A352B"/>`
      + `<path d="M${b[0]} ${b[1] - 4} C${b[0] - 6} ${b[1] - 130} ${b[0] - 60} ${b[1] - 150} ${b[0] - 84} ${b[1] - 146}" stroke="#2A2620" stroke-width="7" fill="none"/>`
      + `<path d="M${b[0] - 1.5} ${b[1] - 5} C${b[0] - 7.5} ${b[1] - 129} ${b[0] - 61} ${b[1] - 148.5} ${b[0] - 85} ${b[1] - 144.5}" stroke="#57503F" stroke-width="1.8" fill="none" opacity=".8"/>`
      + `<path d="M${b[0] - 96} ${b[1] - 148} l32 6 -6 26 -32 -6Z" fill="url(#shadeGrad)" stroke="#C9821E" stroke-width="2.5"/>`
      + `<ellipse cx="${sx - 2}" cy="${sy + 22}" rx="13" ry="4.5" fill="#FFE9A8" opacity=".9"/>`
      + `<circle cx="${sx}" cy="${sy + 6}" r="15" fill="#FFE9A8" opacity=".9" filter="url(#soft)"/>`;
  },

  // 陶盆绿植 ×2:主盆(阔叶,收口陶盆)+ 副盆(垂蔓)
  plant() {
    const leaf = P(0.095, 0.795, 24);
    let s = shadow(P(0.095, 0.795)[0], P(0.095, 0.795)[1], 30, 11, 0.3);
    // 收口陶盆(梯形侧面,上宽下窄)+ 盆沿 + 盆土
    s += `<path d="M${pt(0.05, 0.84, 24)} L${pt(0.14, 0.84, 24)} L${pt(0.126, 0.826, 0)} L${pt(0.064, 0.826, 0)}Z" fill="url(#terraLeft)"/>`;
    s += `<path d="M${pt(0.14, 0.84, 24)} L${pt(0.14, 0.75, 24)} L${pt(0.126, 0.764, 0)} L${pt(0.126, 0.826, 0)}Z" fill="url(#terraRight)"/>`;
    s += `<path d="M${pt(0.05, 0.75, 24)} L${pt(0.14, 0.75, 24)} L${pt(0.126, 0.764, 0)} L${pt(0.064, 0.764, 0)}Z" fill="#7A3E20"/>`;
    s += isoBox(0.043, 0.743, 0.104, 0.104, 4, TERRA, 20);
    s += `<path d="M${topPt(0.056, 0.756, 24)} L${topPt(0.134, 0.756, 24)} L${topPt(0.134, 0.834, 24)} L${topPt(0.056, 0.834, 24)}Z" fill="#3A2413"/>`;
    s += `<path d="M${pt(0.043, 0.847, 20)} L${pt(0.147, 0.847, 20)}" stroke="#5A2E14" stroke-width="1.4" opacity=".5" fill="none"/>`;
    s += `<ellipse cx="${leaf[0] - 14}" cy="${leaf[1] - 24}" rx="11" ry="22" fill="#2F5A38" transform="rotate(-26 ${leaf[0] - 14} ${leaf[1] - 24})"/>
      <ellipse cx="${leaf[0] + 12}" cy="${leaf[1] - 28}" rx="10" ry="24" fill="#3E7048" transform="rotate(20 ${leaf[0] + 12} ${leaf[1] - 28})"/>
      <ellipse cx="${leaf[0] - 2}" cy="${leaf[1] - 38}" rx="9.5" ry="22" fill="#35663F" transform="rotate(-4 ${leaf[0] - 2} ${leaf[1] - 38})"/>
      <ellipse cx="${leaf[0] + 22}" cy="${leaf[1] - 16}" rx="8" ry="17" fill="#2F5A38" transform="rotate(38 ${leaf[0] + 22} ${leaf[1] - 16})"/>
      <ellipse cx="${leaf[0] - 24}" cy="${leaf[1] - 12}" rx="8" ry="16" fill="#3E7048" transform="rotate(-42 ${leaf[0] - 24} ${leaf[1] - 12})"/>
      <path d="M${leaf[0] - 2} ${leaf[1] - 22} L${leaf[0] - 3} ${leaf[1] - 52}" stroke="#24452C" stroke-width="1.2" opacity=".6" fill="none"/>
      <path d="M${leaf[0] + 10} ${leaf[1] - 14} L${leaf[0] + 14} ${leaf[1] - 44}" stroke="#24452C" stroke-width="1.1" opacity=".5" fill="none"/>
      <ellipse cx="${leaf[0] - 6}" cy="${leaf[1] - 40}" rx="3.5" ry="8" fill="#5C9468" opacity=".45" transform="rotate(-8 ${leaf[0] - 6} ${leaf[1] - 40})"/>`;
    // 副盆:小陶盆 + 垂蔓(主盆左前角,错开成绿植角)
    const p2 = P(0.054, 0.882);
    s += shadow(p2[0], p2[1], 18, 7, 0.28);
    s += isoBox(0.024, 0.852, 0.06, 0.06, 13, TERRA);
    s += isoBox(0.021, 0.849, 0.066, 0.066, 3.2, TERRA, 13);
    s += `<ellipse cx="${p2[0] - 6}" cy="${p2[1] - 24}" rx="7" ry="12" fill="#3E7048" transform="rotate(-18 ${p2[0] - 6} ${p2[1] - 24})"/>
      <ellipse cx="${p2[0] + 5}" cy="${p2[1] - 26}" rx="6.5" ry="13" fill="#2F5A38" transform="rotate(14 ${p2[0] + 5} ${p2[1] - 26})"/>
      <path d="M${p2[0] - 8} ${p2[1] - 16} q-8 10 -6 22" stroke="#35663F" stroke-width="2.2" fill="none"/>
      <path d="M${p2[0] + 8} ${p2[1] - 15} q9 8 8 20" stroke="#3E7048" stroke-width="2.2" fill="none"/>
      <circle cx="${p2[0] - 13}" cy="${p2[1] + 2}" r="3" fill="#3E7048"/><circle cx="${p2[0] - 10}" cy="${p2[1] + 7}" r="2.5" fill="#2F5A38"/>
      <circle cx="${p2[0] + 15}" cy="${p2[1] + 3}" r="3" fill="#35663F"/><circle cx="${p2[0] + 12}" cy="${p2[1] + 8}" r="2.4" fill="#3E7048"/>`;
    return s;
  },

  // 椭圆织物地毯:流苏边 + 双色织纹
  rug() {
    const c = P(0.5, 0.56);
    let s = `<ellipse cx="${c[0]}" cy="${c[1] + 2}" rx="132" ry="48" fill="#120C06" opacity=".16" filter="url(#soft)"/>`;
    const fringe = [];
    for (let i = -3; i <= 3; i += 1) {
      const dy = i * 11;
      fringe.push(`<path d="M${c[0] - 126} ${c[1] + dy * 0.36} l-12 ${dy * 0.08}" stroke="#DFCFA8" stroke-width="2.4" opacity=".9"/>`);
      fringe.push(`<path d="M${c[0] + 126} ${c[1] + dy * 0.36} l12 ${dy * 0.08}" stroke="#DFCFA8" stroke-width="2.4" opacity=".9"/>`);
    }
    s += `<g>${fringe.join('')}</g>`;
    s += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="128" ry="46" fill="url(#rugGrad)"/>`;
    s += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="112" ry="39" fill="none" stroke="#C9603C" stroke-width="5" opacity=".85"/>`;
    s += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="88" ry="30" fill="none" stroke="#C9B48E" stroke-width="2" opacity=".6"/>`;
    s += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="34" ry="12" fill="none" stroke="#C9603C" stroke-width="2.5" opacity=".45"/>`;
    s += `<path d="M${c[0] - 70} ${c[1] - 14} q70 18 140 0 M${c[0] - 70} ${c[1] + 16} q70 18 140 0" stroke="#C9B48E" stroke-width="1.4" opacity=".35" fill="none"/>`;
    return s;
  },

  // 吉他角:炭黑音箱(栅格+旋钮)+ A 型琴架 + 木吉他(渐变漆面)
  guitar() {
    let s = shadow(P(0.865, 0.79)[0], P(0.865, 0.79)[1], 36, 12, 0.33);
    s += isoBox(0.8, 0.72, 0.13, 0.12, 32, CHAR);
    for (let i = 0; i < 5; i += 1) {
      const h = 8 + i * 4.4;
      s += `<path d="M${pt(0.806, 0.841, h)} L${pt(0.924, 0.841, h)}" stroke="#3A3F47" stroke-width="1.4" opacity=".8" fill="none"/>`;
    }
    s += `<path d="M${topPt(0.8, 0.84, 32)} L${topPt(0.93, 0.84, 32)}" stroke="#57503F" stroke-width="1.2" opacity=".7" fill="none"/>`;
    for (let i = 0; i < 3; i += 1) {
      const k = P(0.825 + i * 0.032, 0.775, 32.5);
      s += `<circle cx="${k[0].toFixed(1)}" cy="${k[1].toFixed(1)}" r="1.7" fill="#C9CDD4"/>`;
    }
    const ledG = P(0.905, 0.775, 32.5);
    s += `<circle cx="${ledG[0].toFixed(1)}" cy="${ledG[1].toFixed(1)}" r="1.4" fill="#F0A93C"/>`;
    const g = P(0.965, 0.79);
    // A 型琴架
    s += `<path d="M${g[0] - 4} ${g[1] - 2} L${g[0] - 14} ${g[1] - 46} M${g[0] + 8} ${g[1] - 2} L${g[0] + 1} ${g[1] - 46}" stroke="#2A2620" stroke-width="3" fill="none"/>`;
    s += `<g transform="rotate(-18 ${g[0]} ${g[1]})">
      <rect x="${g[0] - 3}" y="${g[1] - 76}" width="7" height="52" fill="#7A5230"/>
      <path d="M${g[0] - 3} ${g[1] - 66} h7 M${g[0] - 3} ${g[1] - 56} h7 M${g[0] - 3} ${g[1] - 47} h7 M${g[0] - 3} ${g[1] - 39} h7" stroke="#5A3A1F" stroke-width="1"/>
      <circle cx="${g[0] + 0.5}" cy="${g[1] - 61}" r="1" fill="#D8C7AE"/><circle cx="${g[0] + 0.5}" cy="${g[1] - 51}" r="1" fill="#D8C7AE"/>
      <rect x="${g[0] - 6}" y="${g[1] - 86}" width="13" height="12" rx="3" fill="#4E3319"/>
      <circle cx="${g[0] - 3}" cy="${g[1] - 82}" r="1.3" fill="#C9CDD4"/><circle cx="${g[0] + 4}" cy="${g[1] - 82}" r="1.3" fill="#C9CDD4"/>
      <path d="M${g[0]} ${g[1] - 26} c-14 0 -17 12 -8 18 c-13 6 -8 24 8 24 c16 0 21 -18 8 -24 c9 -6 6 -18 -8 -18Z" fill="url(#gtrGrad)" stroke="#7A4416" stroke-width="2.5"/>
      <circle cx="${g[0]}" cy="${g[1] - 4}" r="5.5" fill="#1A120A"/>
      <circle cx="${g[0]}" cy="${g[1] - 4}" r="7.2" fill="none" stroke="#D9A441" stroke-width="1" opacity=".8"/>
      <rect x="${g[0] - 6}" y="${g[1] + 8}" width="12" height="4" rx="1.5" fill="#2A1A0E"/>
      <path d="M${g[0] - 2} ${g[1] + 8} L${g[0] - 1.4} ${g[1] - 74} M${g[0] + 1} ${g[1] + 8} L${g[0] + 1} ${g[1] - 74} M${g[0] + 3.6} ${g[1] + 8} L${g[0] + 3.2} ${g[1] - 74}" stroke="#E8E2D2" stroke-width="0.6" opacity=".7"/>
    </g>`;
    // 连接线:吉他 → 音箱
    s += `<path d="M${g[0] - 6} ${g[1] + 4} q-18 10 -34 -2" stroke="#14100B" stroke-width="2" opacity=".55" fill="none"/>`;
    return s;
  },

  // 猫窝:绒面圆窝 + 蜷睡的猫(深色剪影)
  'cat-bed'() {
    const c = P(0.2, 0.76);
    return shadow(c[0], c[1], 34, 14, 0.3)
      + `<ellipse cx="${c[0]}" cy="${c[1] - 4}" rx="30" ry="13" fill="#B65A38"/>
      <ellipse cx="${c[0]}" cy="${c[1] - 4}" rx="30" ry="13" fill="none" stroke="#8A3F24" stroke-width="3" opacity=".8"/>
      <ellipse cx="${c[0]}" cy="${c[1] - 6}" rx="21" ry="8.5" fill="#EFE3C4"/>
      <ellipse cx="${c[0]}" cy="${c[1] - 5}" rx="21" ry="8.5" fill="none" stroke="#D8C7AE" stroke-width="1.4"/>
      <ellipse cx="${c[0] + 3}" cy="${c[1] - 10}" rx="13" ry="6.5" fill="#2E333B" transform="rotate(-8 ${c[0] + 3} ${c[1] - 10})"/>
      <circle cx="${c[0] - 8}" cy="${c[1] - 13}" r="5.2" fill="#2E333B"/>
      <path d="M${c[0] - 11.5} ${c[1] - 17} l2 -3.5 2.2 3 Z M${c[0] - 6.5} ${c[1] - 17.5} l2 -3.4 2.2 3 Z" fill="#2E333B"/>
      <path d="M${c[0] + 14} ${c[1] - 8} q4 5 -3 7.5 q-6 2 -10 -1" stroke="#2E333B" stroke-width="3.2" fill="none"/>
      <path d="M${c[0] - 10.5} ${c[1] - 12.5} q1 1 2 0" stroke="#575F6B" stroke-width="0.9" fill="none"/>`;
  },

  // 右墙小书架(层板 + 书列 + 斜倚书 + 书立)
  bookshelf() {
    const items = [];
    const books = [
      ['#B65A38', 0.13, 0.036], ['#22384A', 0.115, 0.034], ['#F0A93C', 0.128, 0.036],
      ['#2F6B4E', 0.108, 0.033], ['#5A3A5E', 0.12, 0.035], ['#C9821E', 0.1, 0.032]
    ];
    let bx = 0.632;
    books.forEach(([c, h, w]) => {
      items.push(`<rect x="${bx.toFixed(3)}" y="${(0.72 - h).toFixed(3)}" width="${w}" height="${h}" fill="${c}"/>`);
      items.push(`<path d="M${(bx + 0.004).toFixed(3)} ${(0.72 - h + 0.008).toFixed(3)} h${(w - 0.008).toFixed(3)}" stroke="#F3E7CE" stroke-width="0.003" opacity=".5"/>`);
      bx += w + 0.006;
    });
    items.push(`<g transform="rotate(12 0.872 0.72)"><rect x="0.862" y="0.612" width="0.032" height="0.108" fill="#6B3B3B"/></g>`);
    items.push(`<path d="M0.898 0.72 v-0.07 h0.012 v0.06 h0.02 v0.01 Z" fill="#8B96AC"/>`);
    return `<g transform="matrix(274 144 0 288 414 126)">`
      + `<rect x="0.60" y="0.72" width="0.30" height="0.02" fill="#7A5230"/><rect x="0.60" y="0.74" width="0.30" height="0.01" fill="#4E3319"/>`
      + `<path d="M0.60 0.722 H0.90" stroke="#A87B4A" stroke-width="0.003" opacity=".8"/>`
      + items.join('') + `</g>`;
  },

  // 右墙层板咖啡机(镀铬顶 + 冲煮头 + 手柄 + 小杯 + 热气)
  coffee() {
    return `<g transform="matrix(274 144 0 288 414 126)">`
      + `<rect x="0.525" y="0.50" width="0.065" height="0.098" rx="0.008" fill="#26221A"/>`
      + `<rect x="0.525" y="0.50" width="0.065" height="0.014" rx="0.006" fill="#8B96AC"/>`
      + `<rect x="0.532" y="0.522" width="0.051" height="0.03" fill="#3A3F47"/>`
      + `<circle cx="0.579" cy="0.53" r="0.006" fill="#F0A93C"/>`
      + `<rect x="0.541" y="0.556" width="0.032" height="0.018" rx="0.004" fill="#171410"/>`
      + `<path d="M0.556 0.562 L0.586 0.572" stroke="#0F0D0A" stroke-width="0.009" stroke-linecap="round"/>`
      + `<rect x="0.546" y="0.578" width="0.024" height="0.02" rx="0.004" fill="#F6EFDD"/>`
      + `<path d="M0.552 0.572 q0.004 -0.008 0 -0.014 M0.56 0.572 q0.004 -0.008 0 -0.014" stroke="#FFF6E8" stroke-width="0.003" opacity=".5" fill="none"/>`
      + `</g>`;
  },

  // 玩偶:布偶兔(耳内/肚皮拼布 + 缝线笑)
  doll() {
    const c = P(0.28, 0.68);
    return `<ellipse cx="${c[0]}" cy="${c[1]}" rx="16" ry="6" fill="#120C06" opacity=".3"/>`
      + `<ellipse cx="${c[0] - 9}" cy="${c[1] - 42}" rx="4.5" ry="7" fill="#D8A7B1" transform="rotate(-12 ${c[0] - 9} ${c[1] - 42})"/>`
      + `<ellipse cx="${c[0] + 9}" cy="${c[1] - 42}" rx="4.5" ry="7" fill="#D8A7B1" transform="rotate(12 ${c[0] + 9} ${c[1] - 42})"/>`
      + `<ellipse cx="${c[0] - 9}" cy="${c[1] - 41}" rx="2.2" ry="4" fill="#B97F8A" transform="rotate(-12 ${c[0] - 9} ${c[1] - 41})"/>`
      + `<ellipse cx="${c[0] + 9}" cy="${c[1] - 41}" rx="2.2" ry="4" fill="#B97F8A" transform="rotate(12 ${c[0] + 9} ${c[1] - 41})"/>`
      + `<ellipse cx="${c[0]}" cy="${c[1] - 12}" rx="11" ry="12" fill="#E3BCC4"/>`
      + `<ellipse cx="${c[0]}" cy="${c[1] - 9}" rx="6" ry="7" fill="#F2DDE2"/>`
      + `<circle cx="${c[0]}" cy="${c[1] - 30}" r="13" fill="#D8A7B1"/>`
      + `<circle cx="${c[0] - 4.5}" cy="${c[1] - 32}" r="1.7" fill="#26221A"/><circle cx="${c[0] + 4.5}" cy="${c[1] - 32}" r="1.7" fill="#26221A"/>`
      + `<path d="M${c[0] - 1.5} ${c[1] - 28} q1.5 1.6 3 0" stroke="#8A5560" stroke-width="1" fill="none"/>`;
  },

  // 右墙角落海报(框 + 山日出画芯)
  poster() {
    return `<g transform="matrix(274 144 0 288 414 126)">`
      + `<rect x="0.02" y="0.14" width="0.10" height="0.38" fill="#4A3624"/>`
      + `<rect x="0.026" y="0.146" width="0.088" height="0.368" fill="#F3EAD6"/>`
      + `<rect x="0.032" y="0.152" width="0.076" height="0.3" fill="#22384A"/>`
      + `<circle cx="0.07" cy="0.23" r="0.026" fill="#F0A93C"/>`
      + `<path d="M0.032 0.36 L0.058 0.29 L0.078 0.345 L0.096 0.28 L0.108 0.36Z" fill="#3E7048"/>`
      + `<path d="M0.032 0.36 L0.052 0.315 L0.07 0.36Z" fill="#26543A"/>`
      + `<path d="M0.05 0.19 q0.005 -0.008 0.01 0 M0.068 0.176 q0.005 -0.008 0.01 0" stroke="#F3E7CE" stroke-width="0.003" fill="none" opacity=".8"/>`
      + `<rect x="0.032" y="0.42" width="0.076" height="0.026" fill="#B65A38"/>`
      + `<path d="M0.04 0.433 h0.06" stroke="#F3E7CE" stroke-width="0.006" opacity=".85"/>`
      + `</g>`;
  },

  // 右墙挂帘:帘杆 + 褶皱帘身 + 束带
  curtain() {
    return `<g transform="matrix(274 144 0 288 414 126)">`
      + `<rect x="0.893" y="0.063" width="0.11" height="0.018" rx="0.008" fill="#4E3319"/>`
      + `<circle cx="0.895" cy="0.072" r="0.011" fill="#3A2413"/><circle cx="1.001" cy="0.072" r="0.011" fill="#3A2413"/>`
      + `<path d="M0.904 0.085 L0.997 0.085 L0.99 0.3 Q0.966 0.336 0.986 0.382 L0.996 0.52 Q0.95 0.552 0.91 0.52 L0.918 0.382 Q0.936 0.336 0.913 0.3 Z" fill="#A5563F"/>`
      + `<path d="M0.92 0.09 q0.004 0.2 -0.002 0.42 M0.94 0.09 q0.006 0.21 0 0.43 M0.961 0.09 q0.006 0.2 0.002 0.42 M0.98 0.09 q0.006 0.19 0.004 0.4" stroke="#7A3E28" stroke-width="0.005" opacity=".65" fill="none"/>`
      + `<path d="M0.928 0.09 q0.003 0.19 -0.002 0.4 M0.951 0.09 q0.004 0.2 0 0.41" stroke="#C97B5A" stroke-width="0.003" opacity=".5" fill="none"/>`
      + `<path d="M0.912 0.335 q0.037 0.016 0.076 0 l0.002 0.022 q-0.04 0.016 -0.08 0 Z" fill="#D9A441"/>`
      + `</g>`;
  },

  // 茶几上的放映机(镜头辉光 + 散热口)
  projector() {
    let s = `<ellipse cx="${P(0.335, 0.575)[0]}" cy="${P(0.335, 0.575)[1] - 24}" rx="16" ry="6" fill="#120C06" opacity=".3"/>`;
    s += isoBox(0.30, 0.53, 0.075, 0.06, 11, CHAR, 26);
    s += `<path d="M${topPt(0.30, 0.59, 37)} L${topPt(0.375, 0.59, 37)}" stroke="#57503F" stroke-width="1.1" opacity=".7" fill="none"/>`;
    const lens = P(0.31, 0.56, 37);
    s += `<circle cx="${lens[0]}" cy="${lens[1]}" r="5.5" fill="#3A3F47"/><circle cx="${lens[0]}" cy="${lens[1]}" r="3.4" fill="#DFF8FF"/><circle cx="${lens[0] - 1}" cy="${lens[1] - 1}" r="1.2" fill="#FFFFFF"/>`;
    for (let i = 0; i < 3; i += 1) {
      const v0 = P(0.352 + i * 0.008, 0.532, 33);
      s += `<path d="M${v0[0].toFixed(1)} ${v0[1].toFixed(1)} l0 4" stroke="#3A3F47" stroke-width="1.2" opacity=".9"/>`;
    }
    const pw = P(0.366, 0.55, 37.5);
    s += `<circle cx="${pw[0].toFixed(1)}" cy="${pw[1].toFixed(1)}" r="1.2" fill="#F0A93C"/>`;
    return s;
  }
};

// 黑胶机唱盘位置(覆盖层与布局元数据同一来源;room 页 CSS 旋转唱盘按此对位)
const PLATTER_POS = { u: 0.515, v: 0.095, h: 74 };

// 家具元数据:z 取前沿底部 top%×10;obstacle 对应 room-map.js 的障碍 id
// Phase 0 §5.1 schema:每件家具同时携带 id/label/asset/thumb/anchor/bounds/scale/rotation/z/
// lightResponse/occludesCharacter/hitArea/collision/fixed/interaction;
// 旧字段(key/name/overlay/icon/z/obstacle/hotspot)保留,duo/architect 零改动。
// uvFoot: 地面件脚印(u0,v0,u1,v1) + hPx(视觉上沿,px),生成器据此换算 anchor/bounds;
// 墙面件无 uvFoot,anchor/bounds 直接手填(stage %)。
const FURNITURE_META = [
  { key: 'sofa', name: '沙发', z: 639, obstacle: 'sofa', hotspot: { id: 'sofa', icon: '▰', name: '沙发', left: 29, top: 54, width: 18, height: 13, z: 641 },
    uvFoot: [0.02, 0.30, 0.18, 0.60], hPx: 64, collision: { u0: 0.02, v0: 0.30, u1: 0.18, v1: 0.60 },
    lightResponse: { warm: 0.85, cool: 0.2, emissive: 0 }, occludesCharacter: true, interaction: 'sit' },
  { key: 'vinyl-player', name: '黑胶机', z: 698, obstacle: 'credenza', hotspot: { id: 'turntable', icon: '◎', name: '唱机柜', left: 58, top: 46, width: 20, height: 13, z: 700 },
    uvFoot: [0.42, 0.02, 0.96, 0.18], hPx: 100, collision: { u0: 0.42, v0: 0.02, u1: 0.96, v1: 0.18 },
    lightResponse: { warm: 0.9, cool: 0.25, emissive: 0.15 }, occludesCharacter: true, interaction: 'play-hint' },
  { key: 'cat-bed', name: '猫窝', z: 684, obstacle: null, hotspot: null,
    uvFoot: [0.14, 0.70, 0.26, 0.82], hPx: 16, collision: null,
    lightResponse: { warm: 0.7, cool: 0.2, emissive: 0 }, occludesCharacter: true, interaction: null },
  { key: 'bookshelf', name: '书架', z: 400, obstacle: null, hotspot: null,
    anchorManual: { x: 74.8, y: 48.5 }, boundsManual: { left: 69.9, top: 45.5, width: 9.9, height: 6.5 }, collision: null,
    lightResponse: { warm: 0.8, cool: 0.35, emissive: 0 }, occludesCharacter: false, interaction: null },
  { key: 'lamp', name: '落地灯', z: 727, obstacle: 'lamp', hotspot: { id: 'lamp', icon: '☼', name: '落地灯', left: 55, top: 50, width: 12, height: 18, z: 730 },
    anchorManual: { x: 60, y: 62 }, boundsManual: { left: 50.5, top: 49, width: 20, height: 24 },
    collision: { u0: 0.85, v0: 0.30, u1: 0.95, v1: 0.42 },
    lightResponse: { warm: 0.35, cool: 0.15, emissive: 0.95 }, occludesCharacter: true, interaction: 'lamp' },
  { key: 'plant', name: '绿植', z: 670, obstacle: 'plant', hotspot: null,
    uvFoot: [0.02, 0.74, 0.15, 0.92], hPx: 70, collision: { u0: 0.02, v0: 0.74, u1: 0.15, v1: 0.92 },
    lightResponse: { warm: 0.75, cool: 0.3, emissive: 0 }, occludesCharacter: true, interaction: null },
  { key: 'rug', name: '地毯', z: 610, obstacle: null, hotspot: null,
    anchorManual: { x: 50, y: 68.4 }, boundsManual: { left: 34.1, top: 62.6, width: 31.9, height: 11.6 }, collision: null,
    lightResponse: { warm: 0.6, cool: 0.2, emissive: 0 }, occludesCharacter: false, interaction: null },
  { key: 'curtain', name: '挂帘', z: 400, obstacle: null, hotspot: null,
    anchorManual: { x: 81.3, y: 41 }, boundsManual: { left: 79.5, top: 32.5, width: 4.5, height: 18 }, collision: null,
    lightResponse: { warm: 0.5, cool: 0.45, emissive: 0 }, occludesCharacter: false, interaction: null },
  { key: 'projector', name: '放映机', z: 690, obstacle: null, hotspot: { id: 'projector', icon: '✦', name: '放映机', left: 38, top: 56, width: 9, height: 9, z: 692 },
    uvFoot: [0.30, 0.53, 0.375, 0.59], hPx: 40, collision: null,
    lightResponse: { warm: 0.5, cool: 0.3, emissive: 0.6 }, occludesCharacter: true, interaction: 'projector' },
  { key: 'poster', name: '海报', z: 400, obstacle: null, hotspot: null,
    anchorManual: { x: 52.3, y: 27.7 }, boundsManual: { left: 50.6, top: 20, width: 3.5, height: 16 }, collision: null,
    lightResponse: { warm: 0.8, cool: 0.4, emissive: 0 }, occludesCharacter: false, interaction: null },
  { key: 'coffee', name: '咖啡机', z: 400, obstacle: null, hotspot: null,
    anchorManual: { x: 68.4, y: 44 }, boundsManual: { left: 67.3, top: 41.5, width: 2.3, height: 5 }, collision: null,
    lightResponse: { warm: 0.7, cool: 0.4, emissive: 0.2 }, occludesCharacter: false, interaction: null },
  { key: 'doll', name: '玩偶', z: 681, obstacle: null, hotspot: null,
    anchorManual: { x: 36.8, y: 63.7 }, boundsManual: { left: 34.8, top: 60.7, width: 3.9, height: 6 }, collision: null,
    lightResponse: { warm: 0.7, cool: 0.2, emissive: 0 }, occludesCharacter: true, interaction: null },
  { key: 'guitar', name: '吉他角', z: 810, obstacle: 'guitar-corner', hotspot: { id: 'guitar', icon: '♪', name: '吉他角', left: 47, top: 72, width: 13, height: 12, z: 812 },
    uvFoot: [0.79, 0.70, 0.99, 0.85], hPx: 90, collision: { u0: 0.79, v0: 0.70, u1: 0.99, v1: 0.85 },
    lightResponse: { warm: 0.85, cool: 0.25, emissive: 0 }, occludesCharacter: true, interaction: 'play-hint' }
];

// 地面脚印(u0,v0,u1,v1)+ 视觉高 hPx → stage% anchor(中心)与 bounds(包围盒)
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
    bounds: { left: pct(left), top: pct(top), width: pct(right - left), height: pct(bottom - top) }
  };
}

// ---- 建筑师模式双色图标(96×96) ----
function iconSvg(key) {
  const ink = '#1F2329';
  const green = '#22C55E';
  const shapes = {
    sofa: `<rect x="18" y="34" width="60" height="16" rx="6" fill="${ink}"/><rect x="14" y="48" width="68" height="22" rx="6" fill="${green}"/><rect x="20" y="70" width="6" height="10" fill="${ink}"/><rect x="70" y="70" width="6" height="10" fill="${ink}"/>`,
    'vinyl-player': `<rect x="14" y="26" width="68" height="46" rx="8" fill="${ink}"/><circle cx="44" cy="49" r="17" fill="#3A3F47"/><circle cx="44" cy="49" r="6" fill="${green}"/><path d="M64 34 L72 52" stroke="${green}" stroke-width="4" stroke-linecap="round"/>`,
    'cat-bed': `<ellipse cx="48" cy="56" rx="30" ry="16" fill="${ink}"/><ellipse cx="48" cy="53" rx="20" ry="9" fill="${green}"/><circle cx="62" cy="30" r="4" fill="${ink}"/><circle cx="70" cy="36" r="4" fill="${ink}"/><circle cx="66" cy="24" r="4" fill="${ink}"/>`,
    bookshelf: `<rect x="16" y="20" width="64" height="56" rx="4" fill="none" stroke="${ink}" stroke-width="5"/><rect x="24" y="30" width="8" height="22" fill="${green}"/><rect x="36" y="28" width="8" height="24" fill="${ink}"/><rect x="48" y="32" width="8" height="20" fill="${green}"/><rect x="24" y="60" width="48" height="5" fill="${ink}"/>`,
    lamp: `<path d="M34 16 h28 l8 22 h-44Z" fill="${green}"/><rect x="45" y="38" width="6" height="30" fill="${ink}"/><rect x="32" y="68" width="32" height="8" rx="4" fill="${ink}"/>`,
    plant: `<path d="M30 58 h36 l-5 22 h-26Z" fill="${ink}"/><ellipse cx="40" cy="38" rx="9" ry="18" fill="${green}" transform="rotate(-20 40 38)"/><ellipse cx="56" cy="36" rx="9" ry="20" fill="${ink}" transform="rotate(16 56 36)"/><ellipse cx="48" cy="28" rx="8" ry="16" fill="${green}"/>`,
    rug: `<rect x="14" y="32" width="68" height="32" rx="16" fill="${green}"/><rect x="24" y="40" width="48" height="16" rx="8" fill="none" stroke="${ink}" stroke-width="4"/>`,
    curtain: `<path d="M22 16 h22 v50 q-6 6 -11 0 q-5 6 -11 0Z" fill="${ink}"/><path d="M52 16 h22 v50 q-6 6 -11 0 q-5 6 -11 0Z" fill="${green}"/><rect x="16" y="12" width="64" height="7" rx="3.5" fill="${ink}"/>`,
    projector: `<rect x="16" y="32" width="64" height="34" rx="8" fill="${ink}"/><circle cx="36" cy="49" r="11" fill="${green}"/><circle cx="36" cy="49" r="5" fill="#DFF8FF"/><rect x="58" y="42" width="16" height="6" rx="3" fill="${green}"/>`,
    poster: `<rect x="24" y="14" width="48" height="62" rx="4" fill="none" stroke="${ink}" stroke-width="5"/><path d="M32 62 L46 38 L54 50 L62 34 L66 62Z" fill="${green}"/><circle cx="58" cy="26" r="6" fill="${ink}"/>`,
    coffee: `<rect x="26" y="18" width="44" height="42" rx="6" fill="${ink}"/><rect x="34" y="28" width="28" height="10" rx="2" fill="${green}"/><path d="M40 60 h16 v12 a6 6 0 0 1 -6 6 h-4 a6 6 0 0 1 -6 -6Z" fill="${green}"/>`,
    doll: `<circle cx="34" cy="26" r="8" fill="${ink}"/><circle cx="62" cy="26" r="8" fill="${ink}"/><circle cx="48" cy="38" r="18" fill="${ink}"/><ellipse cx="48" cy="70" rx="16" ry="14" fill="${green}"/>`,
    guitar: `<path d="M48 40 c-14 0 -18 10 -10 16 c-12 4 -8 22 8 22 c16 0 20 -18 8 -22 c8 -6 4 -16 -6 -16Z" fill="${green}"/><rect x="45" y="12" width="7" height="30" fill="${ink}"/><circle cx="48" cy="58" r="5" fill="${ink}"/>`
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${shapes[key] || ''}</svg>`;
}

// ---- 唱片封面板材(已带左墙剪切,页面直接按槽位 bbox 摆放) ----
const PLATE_W = 130;
const PLATE_H = 96;

// 板材内部内容(单位方形封套 → 平行四边形),独立出来供 hero 复用
function plateInner(rec, slotIndex) {
  const m = { a: -34.25, b: 18, c: 0, d: 46.1, ox: PLATE_OX, oy: PLATE_OY };
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
    ? `<g transform="matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.ox} ${m.oy})"><circle cx="1.08" cy="0.5" r="0.42" fill="url(#vinylGrad)"/><circle cx="1.08" cy="0.5" r="0.34" fill="none" stroke="#39414E" stroke-width="0.025"/><circle cx="1.08" cy="0.5" r="0.26" fill="none" stroke="#39414E" stroke-width="0.02" opacity=".8"/><circle cx="1.08" cy="0.5" r="0.16" fill="${rec.color}"/><circle cx="1.08" cy="0.5" r="0.035" fill="#F6EFDD"/><path d="M0.76 0.26 A0.42 0.42 0 0 1 1.0 0.12" stroke="#E8F0FF" stroke-width="0.03" opacity=".25" fill="none"/></g>`
    : '';
  return peek
    + `<g transform="matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.ox} ${m.oy})">${sleeves[design]}<rect width="1" height="1" fill="url(#plateSheen)"/><rect width="1" height="1" fill="none" stroke="rgba(38,34,26,.35)" stroke-width="0.02"/></g>`;
}

function plateSvg(rec, slotIndex) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PLATE_W}" height="${PLATE_H}" viewBox="0 0 ${PLATE_W} ${PLATE_H}">${DEFS}`
    + plateInner(rec, slotIndex)
    + `</svg>`;
}

function wrap(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="828" height="828" viewBox="0 0 828 828">${DEFS}${FRAME}${content}${FLOOR_EDGE}</svg>`;
}

function wrapOverlay(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="828" height="828" viewBox="0 0 828 828">${DEFS}${content}</svg>`;
}

// 首页 hero:无夜空、房体 + 默认家具 + 满墙唱片(前 12 张),MOMO 由 sharp 二次合成
function buildHeroSvg() {
  const parts = [];
  // 唱片墙(12 槽全放,封套/黑胶按槽位奇偶交替)
  for (let i = 0; i < 12; i += 1) {
    const rec = RECORDS[i % RECORDS.length];
    const bb = slotBBox(i);
    const sx = (bb.left / 100) * 828;
    const sy = (bb.top / 100) * 828;
    const sw = ((bb.width / 100) * 828) / PLATE_W;
    const sh = ((bb.height / 100) * 828) / PLATE_H;
    parts.push(`<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${sw.toFixed(4)} ${sh.toFixed(4)})">${plateInner(rec, i)}</g>`);
  }
  // 默认 7 件家具按 z 升序
  const HERO_FURNITURE = ['sofa', 'vinyl-player', 'lamp', 'plant', 'rug', 'projector', 'guitar'];
  const sorted = FURNITURE_META.filter((m) => HERO_FURNITURE.includes(m.key)).sort((a, b) => a.z - b.z);
  sorted.forEach((m) => parts.push(OVERLAYS[m.key]()));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="828" height="828" viewBox="0 0 828 828">${DEFS}${ROOM_SHELL}${roomContent()}${parts.join('')}${FLOOR_EDGE}</svg>`;
}

async function render(svg, outFile, quality = 82) {
  await sharp(Buffer.from(svg), { density: 72 }).webp({ quality }).toFile(outFile);
  return (fs.statSync(outFile).size / 1024).toFixed(1);
}

(async () => {
  fs.mkdirSync(OUT_IMG, { recursive: true });

  // 底图
  const base = buildBase();
  fs.writeFileSync(path.join(__dirname, 'room-interactive.svg'), base);
  const baseKb = await render(base, path.join(OUT_IMG, 'room-interactive.webp'));
  console.log(`OK room-interactive.webp ${baseKb} KB`);

  // 家具覆盖层
  for (const meta of FURNITURE_META) {
    const kb = await render(wrapOverlay(OVERLAYS[meta.key]()), path.join(OUT_IMG, `furn-${meta.key}.webp`), 85);
    console.log(`OK furn-${meta.key}.webp ${kb} KB`);
  }

  // 图标
  for (const meta of FURNITURE_META) {
    await render(iconSvg(meta.key), path.join(OUT_IMG, `furn-icon-${meta.key}.webp`), 90);
  }
  console.log(`OK furn-icon-*.webp ×${FURNITURE_META.length}`);

  // 唱片板材(封面设计按槽位奇偶决定是否露黑胶,与唱片 id 无关,同一 id 放不同槽位视觉一致即可)
  for (const rec of RECORDS) {
    await render(plateSvg(rec, 1), path.join(OUT_IMG, `rec-${rec.id}.webp`), 88);
  }
  console.log(`OK rec-*.webp ×${RECORDS.length}`);

  // 首页 hero:SVG 渲染后叠加 MOMO 角色(站在唱机柜前)
  const heroPng = await sharp(Buffer.from(buildHeroSvg()), { density: 72 }).png().toBuffer();
  const momoSrc = path.join(OUT_IMG, 'char-momo-idle.webp');
  const momo = await sharp(momoSrc).resize(150).png().toBuffer();
  const momoAt = P(0.60, 0.30); // 脚底落点(画布坐标)
  await sharp(heroPng)
    .composite([{ input: momo, left: Math.round(momoAt[0] - 75), top: Math.round(momoAt[1] - 172) }])
    .webp({ quality: 86 })
    .toFile(path.join(OUT_IMG, 'room-hero.webp'));
  console.log('OK room-hero.webp');

  // 明信片房间照片:hero 压到深夜底上
  const postcardBg = `<svg xmlns="http://www.w3.org/2000/svg" width="828" height="828" viewBox="0 0 828 828">${DEFS}${SKY}</svg>`;
  const bgPng = await sharp(Buffer.from(postcardBg), { density: 72 }).png().toBuffer();
  await sharp(bgPng)
    .composite([{ input: await sharp(path.join(OUT_IMG, 'room-hero.webp')).resize(760).png().toBuffer(), left: 34, top: 34 }])
    .jpeg({ quality: 88 })
    .toFile(path.join(OUT_IMG, 'room-postcard.jpg'));
  console.log('OK room-postcard.jpg');

  // 布局元数据
  const slots = [];
  for (let i = 0; i < 12; i += 1) slots.push(slotBBox(i));
  const platter = P(PLATTER_POS.u, PLATTER_POS.v, PLATTER_POS.h);
  const layout = `// 由 tools/gen-room-scene.js 生成,请勿手改
module.exports = ${JSON.stringify({
    FURNITURE: FURNITURE_META.map((m) => {
      const stage = m.uvFoot
        ? footToStage(m.uvFoot, m.hPx)
        : { anchor: m.anchorManual, bounds: m.boundsManual };
      return {
        // 旧字段(duo/architect 直接消费,勿删)
        key: m.key,
        name: m.name,
        z: m.z,
        obstacle: m.obstacle,
        hotspot: m.hotspot,
        overlay: `/assets/img/furn-${m.key}.webp`,
        icon: `/assets/img/furn-icon-${m.key}.webp`,
        // Phase 0 §5.1 schema
        id: m.key,
        label: m.name,
        asset: `/assets/img/furn-${m.key}.webp`,
        thumb: `/assets/img/furn-icon-${m.key}.webp`, // TODO(Phase≥2): 同源渲染缩略图 furn-thumb-*
        anchor: stage.anchor,
        bounds: stage.bounds,
        scale: 1,
        rotation: 0,
        lightResponse: m.lightResponse,
        occludesCharacter: m.occludesCharacter,
        hitArea: m.hotspot
          ? { left: m.hotspot.left, top: m.hotspot.top, width: m.hotspot.width, height: m.hotspot.height }
          : null,
        collision: m.collision,
        fixed: false,
        interaction: m.interaction
      };
    }),
    // 固定件碰撞体(茶几等,不参与 DIY 显隐);room-map.js 与 FURNITURE.collision 合并构建障碍
    FIXED_COLLIDERS: [
      { id: 'table', furniture: null, collision: { u0: 0.28, v0: 0.50, u1: 0.44, v1: 0.64 } }
    ],
    FIXTURE_OBJECTS: [
      { id: 'record-wall', icon: '◉', name: '唱片墙', left: 17, top: 33, width: 28, height: 27, z: 400, collision: null, fixed: true, interaction: 'records' },
      { id: 'floor-records', icon: '●', name: '地面唱片', left: 43, top: 69, width: 11, height: 7, z: 100, collision: null, fixed: true, interaction: 'play-hint' }
    ],
    RECORD_SLOTS: slots,
    PLATTER: { left: pct(platter[0]), top: pct(platter[1]) },
    WALL_NOW_PLAYING: { left: 20, top: 30 }
  }, null, 2)};
`;
  fs.writeFileSync(OUT_LAYOUT, layout);
  console.log('OK utils/room-layout.js');
})();
