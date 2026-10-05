// 压缩 Roomie 美术资产：figma-assets/*.png -> miniprogram/assets/img/*.webp
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'figma-assets');
const OUT = path.join(__dirname, '..', 'miniprogram', 'assets', 'img');

const jobs = [
  // [源文件, 输出名, 宽度, 透明]
  ['hero-art-ghibli-float.png', 'room-float.webp', 828, true],
  ['hero-art-ghibli-1080.png', 'room-full.webp', 828, false],
  ['hero-art-duo-1080.png', 'room-duo.webp', 828, false],
  ['hero-art-duo-float-1080.png', 'room-duo-float.webp', 828, true],
  ['hero-art-1080.png', 'room-classic.webp', 828, false],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [src, name, width, alpha] of jobs) {
    const input = path.join(SRC, src);
    if (!fs.existsSync(input)) { console.log('SKIP missing:', src); continue; }
    const out = path.join(OUT, name);
    await sharp(input)
      .resize({ width })
      .webp({ quality: alpha ? 85 : 80, alphaQuality: alpha ? 90 : 100 })
      .toFile(out);
    const kb = (fs.statSync(out).size / 1024).toFixed(1);
    console.log(`OK ${name}  ${kb} KB`);
  }
})();
