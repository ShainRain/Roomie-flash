// Friends mini-room vignettes:从 Room Master 派生(同资产/同灯光/同视角/同几何,逐好友变体)
// 变体手段:整体色相/明度微调 + 角色换色 + 在线/离线亮度,不重画家具。
// 输出 miniprogram/assets/img/vignette-<name>.webp(768×600)
// 运行: node tools/gen-friends-vignettes.js
const sharp = require('sharp');
const path = require('path');
const { composeScene, charSprite, GEO, IMG } = require('./lib-scene-compose');

const OUT_DIR = path.join(IMG);

// [名字, 色相旋转(度), 饱和度, 明度, 角色方案]
const FRIENDS = [
  { name: 'kiki', hue: 0, sat: 1.05, bright: 1.0, char: 'kiki' },          // 黄团子本人
  { name: 'nana', hue: -14, sat: 1.0, bright: 1.0, char: 'momo', charHue: 175 },  // 蓝色系房间
  { name: 'abo', hue: 8, sat: 1.06, bright: 1.02, char: 'momo', charHue: -12 },   // 更暖更红
  { name: 'rita', hue: -8, sat: 0.55, bright: 0.62, char: 'momo', charHue: 0, charSat: 0.15 },  // 离线:暗
  { name: 'tao', hue: 4, sat: 0.5, bright: 0.58, char: 'momo', charHue: 0, charSat: 0.12 }
];

// 角色站在地毯左前(与 Master 同几何,foot 826 画布坐标)
const CHAR_FOOT = { x: 300, y: 500 }; // ≈ uv(0.24, 0.60) 前区

async function tintedChar(f) {
  const plan = GEO.characters.momo; // 复用 MOMO 的站位与尺寸
  const file = path.join(IMG, `char-${f.char}-idle.webp`);
  const h = plan.heightPx;
  const w = Math.round(h / (184 / 144));
  let sprite = sharp(file).resize({ width: w });
  if (f.charHue || f.charSat !== undefined) {
    const opts = {};
    if (f.charHue) opts.hue = f.charHue;
    if (f.charSat !== undefined) opts.saturation = f.charSat;
    sprite = sprite.modulate(opts);
  }
  const spriteBuf = await sprite.png().toBuffer();
  const bbox = { x: CHAR_FOOT.x - Math.round(w / 2), y: CHAR_FOOT.y - h, w, h };
  const shW = Math.round(w * 0.72);
  const shH = Math.round(shW * 0.22);
  const shBuf = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${shW + 20}" height="${shH + 12}"><ellipse cx="${shW / 2 + 12}" cy="${shH / 2 + 6}" rx="${shW / 2}" ry="${shH / 2}" fill="#0E0903" opacity="0.34"/></svg>`)).png().toBuffer();
  return [
    { input: shBuf, left: bbox.x + Math.round(w * 0.14) + 4, top: bbox.y + h - shH - 8, blend: 'over' },
    { input: spriteBuf, left: bbox.x, top: bbox.y, blend: 'over' }
  ];
}

(async () => {
  const base = await composeScene({ lightTemp: 2700, lampOn: true, projectorOn: true, characters: [] });
  for (const f of FRIENDS) {
    const charParts = await tintedChar(f);
    const composed = await sharp(base).composite(charParts).png().toBuffer();
    await sharp(composed)
      .modulate({ hue: f.hue, saturation: f.sat, brightness: f.bright })
      .extract({ left: 30, top: 110, width: 768, height: 600 })
      .webp({ quality: 88 })
      .toFile(path.join(OUT_DIR, `vignette-${f.name}.webp`));
    console.log(`OK vignette-${f.name}.webp`);
  }
})();
