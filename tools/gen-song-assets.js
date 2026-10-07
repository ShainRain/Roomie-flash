// Song 页资产:Hi-Fi 背景(Master 同源裁切) + 原创几何封套 ×3 + 黑胶盘(透明,供 CSS 旋转)
// 材质语言全部来自 Room Master 管线,无版权素材。
// 运行: node tools/gen-song-assets.js
const sharp = require('sharp');
const path = require('path');
const { composeScene } = require('./lib-scene-compose');
const { RECORDS } = require('../miniprogram/utils/records');

const IMG = path.join(__dirname, '..', 'miniprogram', 'assets', 'img');

// 曲目 → 唱片色(records.js 前 3 张)
const TRACKS = [
  { id: 'sunny', rec: RECORDS[0] },
  { id: 'sea', rec: RECORDS[1] },
  { id: 'night', rec: RECORDS[2] }
];

// 确定性散点(纸张颗粒/磨损)
function speckles(n, seed, w, h, color, opMin, opMax) {
  let s = seed >>> 0;
  const next = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const dots = [];
  for (let i = 0; i < n; i += 1) {
    dots.push(`<circle cx="${(next() * w).toFixed(1)}" cy="${(next() * h).toFixed(1)}" r="${(0.8 + next() * 2.2).toFixed(2)}" fill="${color}" opacity="${(opMin + next() * (opMax - opMin)).toFixed(2)}"/>`);
  }
  return dots.join('');
}

// 封套几何画芯(6 种轮换,与唱片墙板材同源设计)
function sleeveArt(rec, size) {
  const u = size / 100;
  const designs = [
    `<rect width="100" height="100" fill="#F3E7CE"/><circle cx="74" cy="26" r="14" fill="#F0A93C"/><rect x="0" y="58" width="100" height="42" fill="${rec.color}"/><path d="M0 58 h100" stroke="#26221A" stroke-width="2" opacity=".3"/><path d="M12 74 h60 M12 84 h44" stroke="#F3E7CE" stroke-width="4" opacity=".7"/>`,
    `<rect width="100" height="100" fill="${rec.color}"/><path d="M0 100 L100 0 V30 L0 130Z" fill="#E8F9EF" opacity=".85"/><rect x="8" y="8" width="20" height="6" fill="#F3E7CE" opacity=".9"/>`,
    `<rect width="100" height="100" fill="${rec.color}"/><path d="M0 100 A50 50 0 0 1 100 100Z" fill="#26221A"/><circle cx="50" cy="62" r="9" fill="#F0A93C"/>`,
    `<rect width="100" height="100" fill="${rec.color}"/><path d="M0 60 q25 -30 50 0 t50 0 V100 H0Z" fill="#DCE9EC"/><circle cx="78" cy="22" r="8" fill="#FFE9B0"/>`,
    `<rect width="100" height="100" fill="${rec.color}"/><rect x="14" y="14" width="30" height="30" fill="#F0A93C"/><rect x="56" y="56" width="30" height="30" fill="#2BC96B"/><circle cx="71" cy="29" r="8" fill="none" stroke="#F3E7CE" stroke-width="3"/>`,
    `<rect width="100" height="100" fill="#EFE3C8"/><path d="M0 50 q20 -35 40 0 t40 0" stroke="${rec.color}" stroke-width="7" fill="none"/><path d="M0 72 q20 -30 40 0 t40 0" stroke="${rec.color}" stroke-width="4" fill="none" opacity=".5"/><circle cx="20" cy="20" r="6" fill="${rec.color}" opacity=".8"/>`
  ];
  const d = designs[(rec.id - 1) % designs.length];
  return `<g transform="scale(${u})">${d}</g>`;
}

function sleeveSvg(rec) {
  const S = 600;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
  <defs>
    <linearGradient id="paper" x2="1" y2="1"><stop stop-color="#F7F1E4"/><stop offset="1" stop-color="#E8DFC9"/></linearGradient>
    <linearGradient id="spine" x2="1" y2="0"><stop stop-color="#D9CBA8"/><stop offset="1" stop-color="#EFE6D2"/></linearGradient>
    <linearGradient id="sheenS" x2="1" y2="1"><stop stop-color="#FFF" stop-opacity=".14"/><stop offset=".4" stop-color="#FFF" stop-opacity="0"/></linearGradient>
    <filter id="soft2"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <!-- 接触阴影由页面 CSS 承担;封套本体 -->
  <rect x="0" y="0" width="${S}" height="${S}" rx="6" fill="url(#paper)"/>
  <!-- 书脊(左侧压边) -->
  <rect x="0" y="0" width="26" height="${S}" fill="url(#spine)"/>
  <rect x="24" y="0" width="3" height="${S}" fill="#B9A67E" opacity=".7"/>
  <!-- 画芯(留纸边) -->
  <g transform="translate(48, 36) scale(5.16)">
    <rect width="100" height="100" fill="#F3E7CE"/>
  </g>
  ${(() => { const inner = sleeveArt(rec, 100); return `<g transform="translate(48, 36) scale(5.16)">${inner}</g>`; })()}
  <!-- 斜向印刷高光 -->
  <rect width="${S}" height="${S}" fill="url(#sheenS)"/>
  <!-- 磨损:四角微圆角缺纸 + 边缘擦白 -->
  <path d="M0 0 h34 q-26 4 -34 34 Z" fill="#FFF8E8" opacity=".55"/>
  <path d="M${S} ${S} h-30 q20 -4 30 -30 Z" fill="#FFF8E8" opacity=".4"/>
  <rect x="6" y="6" width="${S - 12}" height="${S - 12}" rx="4" fill="none" stroke="#FFF8E8" stroke-width="2" opacity=".35"/>
  ${speckles(90, 7, S, S, '#8A7A5E', 0.04, 0.12)}
  <!-- 底部印刷小字(虚构厂牌) -->
  <text x="56" y="${S - 26}" font-family="Verdana" font-size="17" letter-spacing="3" fill="#8A8578">ROOMIE RECORDS · 33⅓ RPM</text>
</svg>`;
}

function discSvg() {
  const S = 560;
  const c = S / 2;
  let grooves = '';
  for (let r = 108; r < c - 14; r += 7) {
    grooves += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#333C48" stroke-width="1.1" opacity="${(0.35 + (r % 21) / 60).toFixed(2)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
  <defs>
    <radialGradient id="vinyl" cx="0.38" cy="0.35" r="0.85"><stop stop-color="#262E39"/><stop offset="1" stop-color="#0B0E13"/></radialGradient>
  </defs>
  <circle cx="${c}" cy="${c}" r="${c - 4}" fill="url(#vinyl)"/>
  ${grooves}
  <!-- 弧形高光(两片,材质反射) -->
  <path d="M${c - 208} ${c - 60} a216 216 0 0 1 122 -96" stroke="#E8F0FF" stroke-width="14" fill="none" opacity=".14" stroke-linecap="round"/>
  <path d="M${c + 188} ${c + 96} a216 216 0 0 1 -88 82" stroke="#E8F0FF" stroke-width="9" fill="none" opacity=".09" stroke-linecap="round"/>
  <!-- 琥珀 label + 印刷环 -->
  <circle cx="${c}" cy="${c}" r="98" fill="#E9A942"/>
  <circle cx="${c}" cy="${c}" r="98" fill="none" stroke="#C9821E" stroke-width="3"/>
  <circle cx="${c}" cy="${c}" r="78" fill="none" stroke="#FFF1CF" stroke-width="1.6" opacity=".8"/>
  <text x="${c}" y="${c - 20}" font-family="Verdana" font-size="21" font-weight="700" letter-spacing="2" fill="#26221A" text-anchor="middle">ROOMIE</text>
  <text x="${c}" y="${c + 34}" font-family="Verdana" font-size="14" fill="#4A3A1E" text-anchor="middle">SIDE A · 33⅓</text>
  <circle cx="${c}" cy="${c}" r="10" fill="#0B0E13"/>
  <circle cx="${c}" cy="${c}" r="10" fill="none" stroke="#F6EFDD" stroke-width="1.6"/>
</svg>`;
}

(async () => {
  // Hi-Fi 背景:Master 唱机柜区域同源裁切(828 合成层上裁,不经 1024 放大)
  const master = await composeScene({ lightTemp: 2700, lampOn: true, projectorOn: true, characters: [] });
  await sharp(master)
    .extract({ left: 300, top: 150, width: 528, height: 350 })
    .resize(828, 549)
    .webp({ quality: 86 })
    .toFile(path.join(IMG, 'song-hifi-bg.webp'));
  console.log('OK song-hifi-bg.webp');

  for (const t of TRACKS) {
    await sharp(Buffer.from(sleeveSvg(t.rec)), { density: 96 })
      .webp({ quality: 90 })
      .toFile(path.join(IMG, `song-sleeve-${t.id}.webp`));
    console.log(`OK song-sleeve-${t.id}.webp`);
  }

  await sharp(Buffer.from(discSvg()), { density: 96 })
    .webp({ quality: 90 })
    .toFile(path.join(IMG, 'song-disc.webp'));
  console.log('OK song-disc.webp');
})();
