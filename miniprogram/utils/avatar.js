/**
 * Roomie 自定义形象（头像 / 服装 两个独立槽位）
 * - avatar：我的放映室卡片上的圆形头像
 * - outfit：房间与双人页里的角色形象（替代默认 char-momo-*.webp 精灵）
 * - 两者互不影响：各自独立导入、独立恢复默认；换了服装不会动头像，反之亦然
 * - 相册/聊天返回的都是临时文件路径，会话结束会被清理；必须搬进 USER_DATA_PATH 用户目录才持久
 * - 只存在本机，不上传、不进仓库：符合赛事「仅评审演示」要求
 * - 结构容错：旧缓存、文件被系统回收、体积超限都要能自愈，不能让页面白屏
 */

const SLOTS = {
  avatar: { key: 'roomie_avatar', file: 'roomie-avatar' },
  outfit: { key: 'roomie_outfit', file: 'roomie-outfit' }
};

// 2MB 上限：头像与角色在页面上最大只渲染到约 150rpx，
// 超过这个体积基本是没压缩的高分辨率原图，直接让用户先压一下。
const MAX_BYTES = 2 * 1024 * 1024;

const DEFAULT_PREFIX = '/assets/img/char-momo-';
const KNOWN_EXT = ['.webp', '.png', '.jpg', '.jpeg', '.gif'];

let seq = 0; // 同一毫秒内连续导入也能拿到不同文件名

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

function extOf(fileName, tempFilePath) {
  const source = String(fileName || '').trim() || String(tempFilePath || '');
  const matched = /\.([A-Za-z0-9]+)\s*$/.exec(source);
  const ext = matched ? `.${matched[1].toLowerCase()}` : '';
  return KNOWN_EXT.includes(ext) ? ext : '.webp';
}

// 导入前校验：只挡体积，不挡格式——相册路径下微信可能已经把 webp 转码成 jpg/png，
// 按扩展名拒绝会误伤正常流程；真正的扩展名过滤交给 chooseMessageFile 的 extension 参数。
function validate(size) {
  if (typeof size === 'number' && size > MAX_BYTES) {
    return { ok: false, reason: `图片 ${formatSize(size)}，超过 ${formatSize(MAX_BYTES)} 上限，请压缩后再导入` };
  }
  return { ok: true };
}

function fileSystem() {
  return wx.getFileSystemManager();
}

function userDir() {
  const env = (typeof wx !== 'undefined' && wx.env) || {};
  return env.USER_DATA_PATH || '';
}

function rawRecord(slotName) {
  const slot = slotOf(slotName);
  let raw;
  try {
    raw = wx.getStorageSync(slot.key);
  } catch (e) {
    return null;
  }
  if (!raw || typeof raw !== 'object' || typeof raw.path !== 'string' || !raw.path) return null;
  return raw;
}

function fileExists(path) {
  try {
    const fs = fileSystem();
    if (!fs || typeof fs.accessSync !== 'function') return true; // 校验不了时不误删记录
    fs.accessSync(path);
    return true;
  } catch (e) {
    return false;
  }
}

function removeFile(slotName) {
  const raw = rawRecord(slotName);
  if (!raw) return;
  try {
    fileSystem().unlinkSync(raw.path);
  } catch (e) {
    // 文件可能已被系统清理，忽略
  }
}

// 读取某个槽位；文件已被系统回收时顺手清掉失效记录（自愈）
function read(slotName) {
  const raw = rawRecord(slotName);
  if (!raw) return null;
  if (!fileExists(raw.path)) {
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

// WXML 里不能调用函数，页面把结果存进 data 即可。
// 头像没有默认素材，返回空串由页面显示字母占位；服装回退默认精灵图。
function path(slotName) {
  const rec = read(slotName);
  return rec ? rec.path : '';
}

function src(slotName, sprite) {
  const rec = read(slotName);
  return rec ? rec.path : defaultSrc(sprite);
}

function save(slotName, tempFilePath, file) {
  if (!tempFilePath) throw new Error('缺少临时文件路径');
  const slot = slotOf(slotName);
  const dir = userDir();
  if (!dir) throw new Error('当前环境不支持本地文件存储');
  const name = (file && file.name) || '';
  const ext = extOf(name, tempFilePath);
  // 每次导入都用新文件名：目标不会重名，且万一写入失败，旧文件与旧记录仍然完好。
  seq += 1;
  const dest = `${dir}/${slot.file}-${Date.now()}-${seq}${ext}`;
  const previous = rawRecord(slotName);
  fileSystem().saveFileSync(tempFilePath, dest);
  const rec = {
    path: dest,
    name: name || `自定义形象${ext}`,
    size: (file && file.size) || 0,
    at: Date.now()
  };
  wx.setStorageSync(slot.key, rec);
  // 新文件落盘、记录写好后，再清理旧文件；删不掉也不影响功能
  if (previous && previous.path !== dest) {
    try {
      fileSystem().unlinkSync(previous.path);
    } catch (e) {
      // 文件可能已被系统清理，忽略
    }
  }
  return rec;
}

function clear(slotName) {
  removeFile(slotName);
  try {
    wx.removeStorageSync(slotOf(slotName).key);
  } catch (e) {
    // 忽略：缓存本来就不存在
  }
}

module.exports = {
  SLOTS,
  MAX_BYTES,
  defaultSrc,
  formatSize,
  validate,
  read,
  path,
  src,
  save,
  clear
};
