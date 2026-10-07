// Postcard 画布安全层(Canvas 不使用 WebP):pc-base.jpg / pc-warm.png / pc-cool.png / pc-beam.png
//   / pc-furn-*.png / pc-plate-*.png / pc-char-*.png + postcard-room.jpg(reference 与兜底用)
// 与 room-scene 组件同一图层栈;色温/地板/家具显隐在 Canvas 绘制时实时合成。
// 运行: node tools/gen-postcard-layers.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { composeScene, ROOM, IMG } = require('./lib-scene-compose');

const OUT = path.join(__dirname, '..', 'miniprogram', 'assets', 'img', 'pc');
const PC_SIZE = 700; // 统一降采样(画布坐标仍按 828 比例换算,绘制时等比缩放,不影响对齐)

async function layerOpacity(file, opacity) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * opacity);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const L = (n) => path.join(ROOM, n);

  // pc-base.jpg = L0 + L1(不透明基底,JPG;先合成再缩放,避免管线内部 resize 先于 composite 的尺寸冲突)
  const baseMerged = await sharp(L('room-base.webp'))
    .composite([{ input: await sharp(L('ambient-shadow.webp')).png().toBuffer(), blend: 'over' }])
    .png().toBuffer();
  await sharp(baseMerged)
    .flatten({ background: '#0D1626' })
    .resize(PC_SIZE, PC_SIZE)
    .jpeg({ quality: 88 })
    .toFile(path.join(OUT, 'pc-base.jpg'));
  console.log('OK pc/pc-base.jpg');

  // pc-warm.png = L3 + L4 + L5 + L6 合并的暖光层(透明;Canvas screen 合成,强度用 globalAlpha 控)
  const warmMerged = await sharp(await layerOpacity(L('warm-light-room.webp'), 1))
    .composite([
      { input: await sharp(L('shelf-edge-glow.webp')).png().toBuffer(), blend: 'over' },
      { input: await sharp(L('lamp-pool.webp')).png().toBuffer(), blend: 'over' },
      { input: await sharp(L('warm-veil-char.webp')).png().toBuffer(), blend: 'over' }
    ]).png().toBuffer();
  await sharp(warmMerged).resize(PC_SIZE, PC_SIZE).png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(path.join(OUT, 'pc-warm.png'));
  console.log('OK pc/pc-warm.png');

  await sharp(L('cool-night-window.webp')).resize(PC_SIZE, PC_SIZE).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(path.join(OUT, 'pc-cool.png'));
  await sharp(L('projector-beam.webp')).resize(PC_SIZE, PC_SIZE).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(path.join(OUT, 'pc-beam.png'));
  console.log('OK pc/pc-cool.png pc-beam.png');

  // 家具与唱片板、角色(PNG 透明,统一降采样 + 调色板量化)
  const furns = fs.readdirSync(ROOM).filter((f) => /^furn-(?!thumb-).+\.webp$/.test(f));
  for (const f of furns) {
    await sharp(path.join(ROOM, f)).resize(PC_SIZE, PC_SIZE).png({ compressionLevel: 9, palette: true, quality: 88 }).toFile(path.join(OUT, f.replace('.webp', '.png')));
  }
  const plates = fs.readdirSync(ROOM).filter((f) => /^rec-plate-.+\.webp$/.test(f));
  for (const f of plates) {
    await sharp(path.join(ROOM, f)).resize(96, 96).png({ compressionLevel: 9, palette: true, quality: 88 }).toFile(path.join(OUT, f.replace('rec-plate-', 'pc-plate-').replace('.webp', '.png')));
  }
  for (const n of ['momo', 'kiki']) {
    await sharp(path.join(IMG, `char-${n}-idle.webp`)).png().toFile(path.join(OUT, `pc-char-${n}.png`));
  }
  console.log(`OK pc/furn ×${furns.length} plate ×${plates.length} char ×2`);
})();
