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
