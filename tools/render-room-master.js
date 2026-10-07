// Room Master 渲染验证:输出 2700K / 6000K / 无 L6 对照三张
// 图层规则在 tools/lib-scene-compose.js(与 room-scene 组件运行时镜像),本文件只负责输出。
// 运行: node tools/render-room-master.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { composeScene } = require('./lib-scene-compose');

const OUT = path.join(__dirname, '..', 'visual-validation', 'rendered');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const warm = await composeScene({ lightTemp: 2700, lampOn: true, projectorOn: true });
  fs.writeFileSync(path.join(OUT, 'room-master.png'), await sharp(warm).resize(1024, 1024).png().toBuffer());
  console.log('OK visual-validation/rendered/room-master.png (2700K, lamp+projector on)');
  const cool = await composeScene({ lightTemp: 6000, lampOn: true, projectorOn: true });
  fs.writeFileSync(path.join(OUT, 'room-master-6000k.png'), await sharp(cool).resize(1024, 1024).png().toBuffer());
  console.log('OK visual-validation/rendered/room-master-6000k.png (6000K)');
  const noL6 = await composeScene({ lightTemp: 2700, lampOn: true, projectorOn: true, veil: false });
  fs.writeFileSync(path.join(OUT, 'room-master-nol6.png'), await sharp(noL6).resize(1024, 1024).png().toBuffer());
  console.log('OK visual-validation/rendered/room-master-nol6.png (2700K 无 L6 对照)');
})();
