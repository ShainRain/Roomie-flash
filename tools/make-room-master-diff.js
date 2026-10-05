// 生成 visual-validation/diff/room-master.png：baseline 房间页 vs 新 Room Master 并排对比
// 运行: node tools/make-room-master-diff.js
const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');

(async () => {
  const H = 900;
  const before = await sharp(path.join(ROOT, 'visual-validation/baseline/room.png'))
    .resize({ height: H }).png().toBuffer();
  const beforeMeta = await sharp(before).metadata();
  const after = await sharp(path.join(ROOT, 'visual-validation/rendered/room-master.png'))
    .resize({ height: H }).png().toBuffer();

  const pad = 40;
  const labelH = 64;
  const W = pad * 3 + beforeMeta.width + H;
  const label = (text, x) => ({
    input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${labelH}">
      <text x="0" y="42" font-family="Verdana, sans-serif" font-size="30" font-weight="700" fill="#F7F3EA">${text}</text>
    </svg>`),
    left: 0, top: 0
  });

  const canvas = sharp({
    create: { width: W, height: H + pad * 2 + labelH, channels: 4, background: '#0B1320' }
  }).composite([
    { input: before, left: pad, top: pad + labelH },
    { input: after, left: pad * 2 + beforeMeta.width, top: pad + labelH },
    { ...label('BEFORE · baseline room page (2026-10-05)', beforeMeta.width), left: pad, top: pad },
    { ...label('AFTER · Room Master Scene (Phase 1)', H), left: pad * 2 + beforeMeta.width, top: pad }
  ]);
  await canvas.png().toFile(path.join(ROOT, 'visual-validation/diff/room-master.png'));
  console.log('OK visual-validation/diff/room-master.png');
})();
