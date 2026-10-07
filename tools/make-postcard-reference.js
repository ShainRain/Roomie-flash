// 生成 reference-assets/ui-reference/postcard.png(按 postcard-reference-spec.md 合成)
// 运行: node tools/make-postcard-reference.js
const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const W = 780;
const H = 1688;
const C = {
  night950: '#08111D', nightText: '#F4EFE4', nightSub: '#93A0B1',
  paper: '#F6EFDD', ink900: '#26221A', ink500: '#9A9080',
  green: '#2BC96B', amber: '#E9A942', line: '#D8CBB0'
};
const F = 'font-family="Microsoft YaHei, Verdana, sans-serif"';
const layer = (svg) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`)).png().toBuffer();

// 纸粒散点(确定性)
function grain(n, seed, w, h) {
  let s = seed >>> 0;
  const next = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const dots = [];
  for (let i = 0; i < n; i += 1) {
    dots.push(`<circle cx="${(next() * w).toFixed(1)}" cy="${(next() * h).toFixed(1)}" r="${(0.7 + next() * 1.4).toFixed(2)}" fill="#8A7A5E" opacity="${(0.05 + next() * 0.08).toFixed(2)}"/>`);
  }
  return dots.join('');
}

(async () => {
  // 明信片本体 654×880(逻辑)× 2 展示
  const PC_W = 654;
  const PC_H = 880;
  const pcX = Math.round((W - PC_W) / 2) + 8;
  const pcY = 210;
  const pad = 36;
  const roomSide = PC_W - pad * 2;
  const roomH = Math.round(PC_H * 0.58);
  const room = await sharp(path.join(ROOT, 'miniprogram/assets/img/postcard-room.jpg'))
    .resize(roomSide, roomH).png().toBuffer();

  // 选中唱片色块(6 张)
  const picks = ['#23262B', '#3B4A6B', '#6B3B3B', '#6B5A3B', '#6B3B5A', '#4F3B6B'];
  const recSize = 60;
  const recGap = 20;
  const recY = pcY + pad + roomH + 28;
  const recX0 = pcX + (PC_W - (picks.length * recSize + (picks.length - 1) * recGap)) / 2;

  const postcardSvg = `
  <g transform="rotate(-2.5 ${pcX + PC_W / 2} ${pcY + PC_H / 2})">
    <rect x="${pcX}" y="${pcY}" width="${PC_W}" height="${PC_H}" rx="16" fill="${C.paper}"/>
    ${grain(160, 17, W, H).replace(/<circle/g, '<circle clip-path="url(#pcClip)"')}
    <clipPath id="pcClip"><rect x="${pcX}" y="${pcY}" width="${PC_W}" height="${PC_H}" rx="16"/></clipPath>
    <clipPath id="roomClip"><rect x="${pcX + pad}" y="${pcY + pad}" width="${roomSide}" height="${roomH}" rx="12"/></clipPath>
    <g clip-path="url(#roomClip)"><rect x="${pcX + pad}" y="${pcY + pad}" width="${roomSide}" height="${roomH}" fill="#223C5C"/></g>

    <!-- 胶带 -->
    <rect x="${pcX + 60}" y="${pcY - 18}" width="120" height="40" rx="4" fill="${C.amber}" opacity=".38" transform="rotate(-14 ${pcX + 120} ${pcY})"/>
    <rect x="${pcX + PC_W - 190}" y="${pcY - 16}" width="120" height="40" rx="4" fill="${C.amber}" opacity=".38" transform="rotate(12 ${pcX + PC_W - 130} ${pcY})"/>

    <!-- 邮票(虚线框 + 黑胶) -->
    <rect x="${pcX + PC_W - pad - 92}" y="${pcY + pad + 14}" width="78" height="96" rx="4" fill="none" stroke="${C.ink500}" stroke-width="2" stroke-dasharray="6 5" opacity=".8"/>
    <circle cx="${pcX + PC_W - pad - 53}" cy="${pcY + pad + 56}" r="24" fill="#23262B"/>
    <circle cx="${pcX + PC_W - pad - 53}" cy="${pcY + pad + 56}" r="24" fill="none" stroke="#3A3F47" stroke-width="2"/>
    <circle cx="${pcX + PC_W - pad - 53}" cy="${pcY + pad + 56}" r="8" fill="${C.amber}"/>

    <!-- 唱片行 -->
    ${picks.map((c, i) => {
      const x = recX0 + i * (recSize + recGap);
      return `<rect x="${x}" y="${recY}" width="${recSize}" height="${recSize}" rx="10" fill="${c}"/>
        <circle cx="${x + recSize / 2}" cy="${recY + recSize / 2}" r="15" fill="#10161F"/>
        <circle cx="${x + recSize / 2}" cy="${recY + recSize / 2}" r="4.5" fill="${C.paper}"/>`;
    }).join('')}

    <!-- tagline -->
    <text x="${pcX + PC_W / 2}" y="${recY + recSize + 72}" ${F} font-size="30" font-weight="600" fill="${C.ink900}" text-anchor="middle">有音乐的房间,抵千万句寒暄。</text>
    <line x1="${pcX + PC_W / 2 - 36}" y1="${recY + recSize + 106}" x2="${pcX + PC_W / 2 + 36}" y2="${recY + recSize + 106}" stroke="${C.line}" stroke-width="2"/>
    <text x="${pcX + PC_W / 2}" y="${pcY + PC_H - 34}" ${F} font-size="19" fill="${C.ink500}" text-anchor="middle">一间安静的放映室 · Roomie · ROOM ID 0731</text>

    <!-- 邮戳(同心双环 + 23:59) -->
    <g opacity=".82">
      <circle cx="${pcX + PC_W - 130}" cy="${pcY + PC_H - 150}" r="56" fill="none" stroke="${C.ink500}" stroke-width="3"/>
      <circle cx="${pcX + PC_W - 130}" cy="${pcY + PC_H - 150}" r="42" fill="none" stroke="${C.ink500}" stroke-width="2"/>
      <text x="${pcX + PC_W - 130}" y="${pcY + PC_H - 142}" font-family="Georgia, serif" font-size="26" fill="${C.ink500}" text-anchor="middle">23:59</text>
      <path id="pmArc" d="M${pcX + PC_W - 130 - 49} ${pcY + PC_H - 150} a49 49 0 0 1 98 0" fill="none"/>
      <text font-family="Georgia, serif" font-size="15" fill="${C.ink500}" letter-spacing="3"><textPath href="#pmArc" startOffset="12%">ROOMIE POST</textPath></text>
    </g>
  </g>`;

  const ui = `
    <text x="40" y="96" ${F} font-size="42" font-weight="700" fill="${C.nightText}">明信片</text>
    <text x="190" y="98" ${F} font-size="15" fill="${C.nightSub}" letter-spacing="2">POSTCARD · NIGHT MAIL</text>
    <rect x="${W - 240}" y="62" width="200" height="48" rx="24" fill="#162537"/>
    <text x="${W - 140}" y="94" ${F} font-size="19" fill="${C.nightText}" text-anchor="middle">ROOM ID · 0731</text>

    <rect x="40" y="${H - 300}" width="${W - 220}" height="88" rx="44" fill="none" stroke="${C.green}" stroke-width="2.5"/>
    <text x="${40 + (W - 220) / 2}" y="${H - 246}" ${F} font-size="23" font-weight="600" fill="${C.green}" text-anchor="middle">保存到相册</text>
    <rect x="${W - 160}" y="${H - 300}" width="120" height="88" rx="44" fill="${C.green}"/>
    <text x="${W - 100}" y="${H - 246}" ${F} font-size="23" font-weight="700" fill="#FFF" text-anchor="middle">分享</text>`;

  await sharp({ create: { width: W, height: H, channels: 4, background: C.night950 } })
    .composite([
      { input: await layer(postcardSvg), left: 0, top: 0 },
      { input: room, left: pcX + pad, top: pcY + pad },
      { input: await layer(ui), left: 0, top: 0 }
    ])
    .png().toFile(path.join(ROOT, 'reference-assets/ui-reference/postcard.png'));
  console.log('OK ui-reference/postcard.png');
})();
