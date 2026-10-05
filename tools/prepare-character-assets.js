// 从白底参考图提取透明角色，并生成小程序现有姿态接口所需的 WebP 资源。
// 默认映射：MOMO 使用橙色角色，KIKI 使用黄色角色。
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'miniprogram', 'assets', 'img');
const SOURCES = {
  momo: process.env.ROOMIE_MOMO_SOURCE || 'C:\\Users\\69297\\Downloads\\_1_宅甜小猫_来自小红书网页版.jpg',
  kiki: process.env.ROOMIE_KIKI_SOURCE || 'C:\\Users\\69297\\Downloads\\为什么没有人拿奶龙做海报_1_77i_来自小红书网页版.jpg'
};

const WIDTH = 144;
const HEIGHT = 184;
const POSES = [
  { name: 'idle', angle: 0 },
  { name: 'walk-a', angle: -2 },
  { name: 'walk-b', angle: 2 },
  { name: 'sit', angle: 0 }
];

function isBackgroundPixel(data, index) {
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  return red > 245 && green > 245 && blue > 245 && Math.max(red, green, blue) - Math.min(red, green, blue) < 12;
}

function floodWhite(raw) {
  const { data, info } = raw;
  const visited = new Uint8Array(info.width * info.height);
  const queue = [];
  const enqueue = (x, y) => {
    const point = y * info.width + x;
    if (visited[point]) return;
    const index = point * info.channels;
    if (!isBackgroundPixel(data, index)) return;
    visited[point] = 1;
    queue.push(point);
  };

  for (let x = 0; x < info.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, info.height - 1);
  }
  for (let y = 0; y < info.height; y += 1) {
    enqueue(0, y);
    enqueue(info.width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const point = queue[cursor];
    const x = point % info.width;
    const y = Math.floor(point / info.width);
    if (x > 0) enqueue(x - 1, y);
    if (x + 1 < info.width) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y + 1 < info.height) enqueue(x, y + 1);
  }

  for (let point = 0; point < visited.length; point += 1) {
    if (visited[point]) data[point * info.channels + 3] = 0;
  }
  return raw;
}

async function extract(source) {
  if (!fs.existsSync(source)) throw new Error(`找不到角色参考图：${source}`);
  const raw = await sharp(source)
    .ensureAlpha()
    .resize({ width: 480, height: 480, fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const transparent = floodWhite(raw);
  return sharp(transparent.data, { raw: transparent.info });
}

async function renderCharacter(name, source) {
  const base = await extract(source);
  const basePng = await base
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: WIDTH, height: HEIGHT, fit: 'contain', position: 'bottom', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  for (const pose of POSES) {
    const output = path.join(OUT, `char-${name}-${pose.name}.webp`);
    await sharp(basePng)
      .rotate(pose.angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize({ width: WIDTH, height: HEIGHT, fit: 'contain', position: 'bottom', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90, alphaQuality: 95 })
      .toFile(output);
    console.log(`OK ${path.basename(output)} ${(fs.statSync(output).size / 1024).toFixed(1)} KB`);
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await renderCharacter('momo', SOURCES.momo);
  await renderCharacter('kiki', SOURCES.kiki);
})();
