/**
 * sync-assets.mjs — clean-copy miniprogram/assets → public/assets
 * The web demo references Master scene imagery from the /assets/... URL space;
 * this script is the single sync point (wired as predev/prebuild). Idempotent.
 */
import { cpSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, '..', 'miniprogram', 'assets');
const dest = join(root, 'public', 'assets');

if (!existsSync(src)) {
  console.error(`[sync-assets] source not found: ${src}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[sync-assets] ${src} -> ${dest}`);

// web-only 派生资产（derived-assets/，git 跟踪）覆盖拷贝到 public/assets。
// 注意本脚本会整体清空 dest，派生资产不能放进 public/assets 提交，必须经此拷贝。
const derived = join(root, 'derived-assets');
if (existsSync(derived)) {
  cpSync(derived, dest, { recursive: true });
  console.log(`[sync-assets] ${derived} -> ${dest} (web-only overlay)`);
}
