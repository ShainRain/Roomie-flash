// 首页房间插画的黑夜版：在既有资源 room-float.webp 上做夜色调色 + 室内暖光，
// 不重新画插画，保证黑夜模式和白天是同一张画、同一个构图，只是"关了灯"。
// 输出：miniprogram/assets/img/room-float-night.webp
// 运行：node tools/gen-home-hero-night.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMG = path.join(__dirname, '..', 'miniprogram', 'assets', 'img');
const IN = path.join(IMG, 'room-float.webp');
const OUT = path.join(IMG, 'room-float-night.webp');

// 夜色矩阵（3×3，输出 = M × RGB）：整体压暗 + 往深夜蓝偏。
// 调这个矩阵就能同时决定"夜里多暗"和"偏蓝多少"，房间地板绿会跟着变成深绿，
// 首页夜间的草坡色要拿这里的产物去取样对齐（见 tools/gen-home-backdrop.js 的 THEMES.night）。
const NIGHT = [
  [0.350, 0.028, 0.037],
  [0.018, 0.396, 0.046],
  [0.028, 0.055, 0.460]
];

// 室内暖光：房间整体暖洗 + 屏幕 + 台灯 + 投影仪。用 screen 混合叠上去，只加光不遮画。
// 坐标是 room-float.webp 的源图坐标（828×782），由页面坐标反推：
// source = (page + [37.9, -96]) / 0.99744
function glow(w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <radialGradient id="wash">
        <stop offset="0" stop-color="#FFB870" stop-opacity=".30"/>
        <stop offset="1" stop-color="#FFB870" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="screen">
        <stop offset="0" stop-color="#FFE0C4" stop-opacity=".55"/>
        <stop offset=".55" stop-color="#FFD0B0" stop-opacity=".22"/>
        <stop offset="1" stop-color="#FFD0B0" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="lamp">
        <stop offset="0" stop-color="#FFE6A8" stop-opacity="1"/>
        <stop offset=".28" stop-color="#FFD070" stop-opacity=".62"/>
        <stop offset="1" stop-color="#FFC96A" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="pool">
        <stop offset="0" stop-color="#FFC98A" stop-opacity=".38"/>
        <stop offset="1" stop-color="#FFC98A" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="proj">
        <stop offset="0" stop-color="#CFE6FF" stop-opacity=".5"/>
        <stop offset="1" stop-color="#CFE6FF" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="470" cy="390" rx="380" ry="290" fill="url(#wash)"/>
    <ellipse cx="567" cy="262" rx="215" ry="200" fill="url(#screen)"/>
    <ellipse cx="470" cy="560" rx="220" ry="110" fill="url(#pool)"/>
    <ellipse cx="612" cy="305" rx="120" ry="120" fill="url(#lamp)"/>
    <ellipse cx="440" cy="256" rx="80" ry="70" fill="url(#proj)"/>
  </svg>`;
}

(async () => {
  const meta = await sharp(IN).metadata();
  const w = meta.width;
  const h = meta.height;

  // 1. 压暗偏蓝（去掉 alpha，避免后面 screen 混光被透明区截断）
  const base = await sharp(IN).removeAlpha().recomb(NIGHT).toBuffer();
  // 2. screen 叠室内暖光：落在透明区的光会在第 3 步被 alpha 抹掉
  const lit = await sharp(base)
    .composite([{ input: Buffer.from(glow(w, h)), blend: 'screen' }])
    .toBuffer();
  // 3. 把原图 alpha 接回去，房间轮廓不变
  const alpha = await sharp(IN).ensureAlpha().extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
  const alphaPng = await sharp(alpha.data, { raw: { width: alpha.info.width, height: alpha.info.height, channels: 1 } }).png().toBuffer();

  await sharp(lit).joinChannel(alphaPng).webp({ quality: 86, alphaQuality: 92 }).toFile(OUT);
  console.log(`OK room-float-night.webp ${w}×${h} ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);

  // 顺便把夜里地板外圈/底尖的实测色打出来，给首页夜间草坡配色当基准
  const { data, info } = await sharp(OUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
  const toHex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('');
  // 地板贴边处（页面坐标 → 源图坐标）：左角内侧、右角内侧、正前角内侧
  const pts = [[132, 612], [628, 608], [381, 738], [160, 624], [600, 622]];
  const hexes = pts.map(([X, Y]) => toHex(px(Math.round((X + 37.9) / 0.99744), Math.round((Y - 96) / 0.99744))));
  console.log('夜间地板贴边取样:', hexes.join('  '));
})();