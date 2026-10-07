// Profile 收藏网格用方形唱片封面 ×24(song 封套画芯同源设计:6 款几何 × records.js 24 色)
// 输出 miniprogram/assets/img/cover-<id>.webp(200×200)
// 运行: node tools/gen-record-covers.js
const sharp = require('sharp');
const path = require('path');
const { RECORDS } = require('../miniprogram/utils/records');

const IMG = path.join(__dirname, '..', 'miniprogram', 'assets', 'img');

function speckles(n, seed, w, h, color, opMin, opMax) {
  let s = seed >>> 0;
  const next = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const dots = [];
  for (let i = 0; i < n; i += 1) {
    dots.push(`<circle cx="${(next() * w).toFixed(1)}" cy="${(next() * h).toFixed(1)}" r="${(0.6 + next() * 1.6).toFixed(2)}" fill="${color}" opacity="${(opMin + next() * (opMax - opMin)).toFixed(2)}"/>`);
  }
  return dots.join('');
}

function art(rec) {
  const designs = [
    `<rect width="100" height="100" fill="#F3E7CE"/><circle cx="74" cy="26" r="14" fill="#F0A93C"/><rect x="0" y="58" width="100" height="42" fill="${rec.color}"/><path d="M12 74 h60 M12 84 h44" stroke="#F3E7CE" stroke-width="4" opacity=".7"/>`,
    `<rect width="100" height="100" fill="${rec.color}"/><path d="M0 100 L100 0 V30 L0 130Z" fill="#E8F9EF" opacity=".85"/><rect x="8" y="8" width="20" height="6" fill="#F3E7CE" opacity=".9"/>`,
    `<rect width="100" height="100" fill="${rec.color}"/><path d="M0 100 A50 50 0 0 1 100 100Z" fill="#26221A"/><circle cx="50" cy="62" r="9" fill="#F0A93C"/>`,
    `<rect width="100" height="100" fill="${rec.color}"/><path d="M0 60 q25 -30 50 0 t50 0 V100 H0Z" fill="#DCE9EC"/><circle cx="78" cy="22" r="8" fill="#FFE9B0"/>`,
    `<rect width="100" height="100" fill="${rec.color}"/><rect x="14" y="14" width="30" height="30" fill="#F0A93C"/><rect x="56" y="56" width="30" height="30" fill="#2BC96B"/><circle cx="71" cy="29" r="8" fill="none" stroke="#F3E7CE" stroke-width="3"/>`,
    `<rect width="100" height="100" fill="#EFE3C8"/><path d="M0 50 q20 -35 40 0 t40 0" stroke="${rec.color}" stroke-width="7" fill="none"/><path d="M0 72 q20 -30 40 0 t40 0" stroke="${rec.color}" stroke-width="4" fill="none" opacity=".5"/><circle cx="20" cy="20" r="6" fill="${rec.color}" opacity=".8"/>`
  ];
  return designs[(rec.id - 1) % designs.length];
}

function coverSvg(rec) {
  const S = 200;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
  <defs>
    <linearGradient id="sheenC" x2="1" y2="1"><stop stop-color="#FFF" stop-opacity=".12"/><stop offset=".45" stop-color="#FFF" stop-opacity="0"/></linearGradient>
  </defs>
  <g transform="scale(2)">${art(rec)}</g>
  <rect width="${S}" height="${S}" fill="url(#sheenC)"/>
  <rect x="3" y="3" width="${S - 6}" height="${S - 6}" fill="none" stroke="#FFF8E8" stroke-width="1.5" opacity=".3"/>
  ${speckles(24, rec.id * 13, S, S, '#3A3226', 0.05, 0.14)}
</svg>`;
}

(async () => {
  for (const rec of RECORDS) {
    await sharp(Buffer.from(coverSvg(rec)), { density: 96 })
      .webp({ quality: 88 })
      .toFile(path.join(IMG, `cover-${rec.id}.webp`));
  }
  console.log(`OK cover-*.webp ×${RECORDS.length}`);
})();
