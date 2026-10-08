/**
 * 自定义形象（头像 / 服装 两个独立槽位）— Web port of miniprogram/utils/avatar.js
 * 语义对齐：SLOTS/2MB 上限/独立槽位互不影响/自愈（记录失效即清除）。
 * Web 差异：文件落盘改为 dataURL 直接存 localStorage（浏览器无 USER_DATA_PATH；
 * dataURL 自包含，天然免疫"临时文件被回收"）。选择器 = <input type=file>。
 * 仅本机存储，不上传。
 */
import { getStorageSync, setStorageSync, removeStorageSync } from './storage.js';

const SLOTS = {
  avatar: { key: 'roomie_avatar' },
  outfit: { key: 'roomie_outfit' }
};

// 2MB 上限（原文件字节数；dataURL 约 ×1.33，仍在 localStorage 限额内）
const MAX_BYTES = 2 * 1024 * 1024;

const DEFAULT_PREFIX = '/assets/img/char-momo-';

function slotOf(name) {
  return SLOTS[name] || SLOTS.avatar;
}

function defaultSrc(sprite) {
  return `${DEFAULT_PREFIX}${sprite || 'idle'}.webp`;
}

function formatSize(bytes) {
  if (typeof bytes !== 'number' || !bytes) return '未知大小';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// 导入前校验：只挡体积，不挡格式（对齐小程序语义）
function validate(size) {
  if (typeof size === 'number' && size > MAX_BYTES) {
    return { ok: false, reason: `图片 ${formatSize(size)}，超过 ${formatSize(MAX_BYTES)} 上限，请压缩后再导入` };
  }
  return { ok: true };
}

function rawRecord(slotName) {
  const raw = getStorageSync(slotOf(slotName).key);
  if (!raw || typeof raw !== 'object' || typeof raw.path !== 'string' || !raw.path) return null;
  return raw;
}

// 读取槽位；记录结构失效时顺手清除（自愈，不让页面崩）
function read(slotName) {
  const raw = rawRecord(slotName);
  if (!raw) return null;
  if (!raw.path.startsWith('data:image/')) {
    clear(slotName);
    return null;
  }
  return {
    slot: slotOf(slotName) === SLOTS.outfit ? 'outfit' : 'avatar',
    path: raw.path,
    name: typeof raw.name === 'string' && raw.name ? raw.name : '自定义形象',
    size: typeof raw.size === 'number' ? raw.size : 0,
    at: typeof raw.at === 'number' ? raw.at : 0
  };
}

function path(slotName) {
  const rec = read(slotName);
  return rec ? rec.path : '';
}

function src(slotName, sprite) {
  const rec = read(slotName);
  return rec ? rec.path : defaultSrc(sprite);
}

function save(slotName, dataUrl, file) {
  if (!dataUrl) throw new Error('缺少图片数据');
  const rec = {
    path: dataUrl,
    name: (file && file.name) || '自定义形象',
    size: (file && file.size) || 0,
    at: Date.now()
  };
  setStorageSync(slotOf(slotName).key, rec);
  return rec;
}

function clear(slotName) {
  removeStorageSync(slotOf(slotName).key);
}

// 打开文件选择器，选中即返回 { dataUrl, file }；取消返回 null
function pickImage() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.webp,.png,.jpg,.jpeg,.gif';
    input.addEventListener('change', () => {
      const file = (input.files || [])[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result, file });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
    input.click();
  });
}

export default { SLOTS, MAX_BYTES, defaultSrc, formatSize, validate, read, path, src, save, clear, pickImage };
