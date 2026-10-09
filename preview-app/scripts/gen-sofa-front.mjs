/**
 * gen-sofa-front.mjs — 生成沙发前沿遮挡层（web-only 派生资产）
 *
 * 从 Master 的 furn-sofa.webp 派生：保留坐垫前沿线（y=352px）以下的像素
 * （沙发前挡板+毯子+腿），以上全透明。与原图共享像素/透明度/尺寸/原点，
 * 作为独立节点叠在入座角色之上（腿在前挡板后 → 角色读作"坐进沙发"）。
 *
 * 产出：derived-assets/img/room/furn-sofa-front.webp（git 跟踪的唯一副本；
 *   sync-assets.mjs 在 clean-copy 后把 derived-assets/ 覆盖拷进 public/assets，
 *   因此不要直接提交 public/assets 下的产物）
 * 运行：cd preview-app && node scripts/gen-sofa-front.mjs && node scripts/sync-assets.mjs
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const sharp = require('../../tools/node_modules/sharp');

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(root, 'public', 'assets', 'img', 'room', 'furn-sofa.webp');
const DEST = join(root, 'derived-assets', 'img', 'room', 'furn-sofa-front.webp');

const CUT_Y = 352; // 坐垫前沿线（furn-sofa.webp 实测：300-350 坐垫区，360+ 前挡板/毯子）

mkdirSync(dirname(DEST), { recursive: true });

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let y = 0; y < info.height; y += 1) {
  if (y >= CUT_Y) continue;
  for (let x = 0; x < info.width; x += 1) {
    data[(y * info.width + x) * 4 + 3] = 0;
  }
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .webp({ quality: 90 })
  .toFile(DEST);
console.log(`[gen-sofa-front] ${DEST} (cut y>=${CUT_Y}px)`);
