// pages/profile 自定义形象流程测试（头像 / 服装 两条独立链路）
// 用 Page/wx/getApp 桩把 profile.js 跑在 Node 里，覆盖：
// 换头像与换服装互不影响、相册入口参数、聊天记录兜底（含目标选择）、
// webp/png 放行、非图片与超限拒绝、取消不打扰、权限拒绝给恢复路径、
// 落盘失败提示、文件被回收后自愈、恢复默认。
const path = require('path');

let passed = 0;
let failed = 0;
const assert = (cond, name) => { cond ? passed++ : failed++; console.log((cond ? '  ✓ ' : '  ✗ ') + name); };

const store = new Map();
const files = new Map();
const toasts = [];
const modals = [];
const actionSheets = [];
let openedSetting = 0;
let lastPicker = null;
let captured = null;

global.Page = (cfg) => { captured = cfg; };
global.getApp = () => ({ globalData: { user: { name: 'MOMO', level: 7, badge: '建筑师' }, room: {} } });

const realFileSystem = () => ({
  saveFileSync(src, dest) { files.set(dest, src); return dest; },
  unlinkSync(p) { files.delete(p); },
  accessSync(p) { if (!files.has(p)) throw new Error('no such file'); }
});

global.wx = {
  env: { USER_DATA_PATH: 'wxfile://usr' },
  getStorageSync: (k) => (store.has(k) ? store.get(k) : ''),
  setStorageSync: (k, v) => store.set(k, v),
  removeStorageSync: (k) => store.delete(k),
  getFileSystemManager: realFileSystem,
  showToast: (o) => toasts.push(o.title),
  showModal: (o) => modals.push(o),
  showActionSheet: (o) => actionSheets.push(o),
  openSetting: () => { openedSetting++; },
  chooseMedia: (o) => { lastPicker = { kind: 'media', o }; },
  chooseMessageFile: (o) => { lastPicker = { kind: 'file', o }; }
};

require(path.join(__dirname, '..', 'miniprogram', 'pages', 'profile', 'profile.js'));
const Avatar = require('../miniprogram/utils/avatar');

const page = Object.create(captured);
page.data = JSON.parse(JSON.stringify(captured.data));
page.setData = function (patch) { Object.assign(this.data, patch); };
const lastToast = () => toasts[toasts.length - 1];
const lastSheet = () => actionSheets[actionSheets.length - 1];
const avatarPath = () => Avatar.path('avatar');
const outfitPath = () => Avatar.path('outfit');

// ---- 1. 初始状态：头像与服装都是默认 ----
page.onLoad();
assert(page.data.avatarSrc === '', '未导入时卡片显示字母头像');
assert(page.data.hasCustom === false, '未导入时没有「恢复默认」入口');
assert(page.data.avatarHint.indexOf('头像：默认') >= 0, '文案标注头像为默认');
assert(page.data.avatarHint.indexOf('服装：默认') >= 0, '文案独立标注服装为默认');

// ---- 2. 换头像 → 相册（请求相册权限、取原图） ----
page.onImportAvatar();
assert(lastPicker && lastPicker.kind === 'media', '「换头像」打开相册选择器');
assert(lastPicker.o.sourceType.length === 1 && lastPicker.o.sourceType[0] === 'album', '只从相册取图（系统在此请求相册权限）');
assert(lastPicker.o.sizeType[0] === 'original', '取原图，避免压缩丢掉透明底');
assert(lastPicker.o.mediaType[0] === 'image' && lastPicker.o.count === 1, '限制为单张图片');
lastPicker.o.success({ tempFiles: [{ tempFilePath: 'tmp/head.webp', size: 3000 }] });
assert(page.data.avatarSrc === avatarPath() && page.data.avatarSrc !== '', '头像换成新图');
assert(store.has(Avatar.SLOTS.avatar.key), '头像写入 avatar 槽');
assert(!store.has(Avatar.SLOTS.outfit.key), '换头像不会写入服装槽');
assert(outfitPath() === '', '换头像后服装仍是默认');
assert(lastToast() === '头像已更新', '头像导入提示');
assert(page.data.hasCustom === true, '有自定义内容后出现「恢复默认」入口');

// ---- 3. 换服装 → 相册 → 写自己的槽位，不动头像 ----
const headAfter = page.data.avatarSrc;
page.onImportOutfit();
assert(lastPicker.kind === 'media', '「换服装」也直接打开相册');
lastPicker.o.success({ tempFiles: [{ tempFilePath: 'tmp/suit.png', size: 4000 }] });
assert(outfitPath() !== '' && /^wxfile:\/\/usr\/roomie-outfit-/.test(outfitPath()), '服装写入 outfit 槽');
assert(page.data.avatarSrc === headAfter, '换服装不会动头像');
assert(lastToast() === '服装已更新，去房间看看', '服装提示引导去房间查看');
assert(page.data.avatarHint.indexOf('头像：已导入') >= 0, '文案保留头像的导入状态');
assert(page.data.avatarHint.indexOf('服装：已导入') >= 0, '文案显示服装的导入状态');

// ---- 4. 反复换头像也不影响服装 ----
const outfitAfter = outfitPath();
page.onImportAvatar();
lastPicker.o.success({ tempFiles: [{ tempFilePath: 'tmp/head2.png', size: 100 }] });
assert(/\.png$/.test(page.data.avatarSrc), '头像换成 png');
assert(outfitPath() === outfitAfter, '换头像不影响已导入的服装');

// ---- 5. 聊天记录兜底：先选目标（头像 / 服装） ----
page.onImportImageFile();
assert(lastSheet().itemList.length === 2, '聊天导入先问清是头像还是服装');
assert(lastSheet().itemList[0].indexOf('头像') >= 0 && lastSheet().itemList[1].indexOf('服装') >= 0, '两个选项分别对应头像与服装');
lastSheet().success({ tapIndex: 1 });
assert(lastPicker.kind === 'file', '选定目标后打开聊天文件选择器');
assert(lastPicker.o.type === 'file', '按文件类型选择（可用扩展名过滤）');
assert(lastPicker.o.extension.indexOf('webp') >= 0 && lastPicker.o.extension.indexOf('png') >= 0, '放行 .webp 与 .png');
lastPicker.o.success({ tempFiles: [{ name: 'momo.png', path: 'tmp/chat.png', size: 8192 }] });
assert(outfitPath() !== outfitAfter, '聊天导入的 PNG 换掉了服装');
assert(page.data.avatarHint.indexOf('服装：已导入 momo.png') >= 0, '文案显示聊天导入的文件名');

// ---- 6. 聊天导入头像（扩展名大写同样识别） ----
const headBeforeChat = page.data.avatarSrc;
page.onImportImageFile();
lastSheet().success({ tapIndex: 0 });
lastPicker.o.success({ tempFiles: [{ name: 'face.PNG', path: 'tmp/face.png', size: 100 }] });
assert(page.data.avatarSrc !== headBeforeChat && /\.png$/.test(page.data.avatarSrc), '聊天导入的头像写入头像槽');

// ---- 7. 取消选择目标不打扰 ----
const toastCount = toasts.length;
page.onImportImageFile();
lastSheet().fail({ errMsg: 'showActionSheet:fail cancel' });
assert(toasts.length === toastCount, '取消目标选择不弹提示');

// ---- 8. 非图片文件必须拒绝 ----
page.onImportImageFile();
lastSheet().success({ tapIndex: 1 });
const outfitBefore = outfitPath();
lastPicker.o.success({ tempFiles: [{ name: 'notes.txt', path: 'tmp/n.txt', size: 10 }] });
assert(outfitPath() === outfitBefore, '非图片文件不会替换形象');
assert(lastToast() === '请选择 .webp 或 .png 文件', '非图片给出明确提示');

// ---- 9. 超过体积上限必须拒绝 ----
page.onImportOutfit();
lastPicker.o.success({ tempFiles: [{ tempFilePath: 'tmp/huge.webp', size: 5 * 1024 * 1024 }] });
assert(outfitPath() === outfitBefore, '超限图片不替换形象');
assert(lastToast().indexOf('上限') >= 0, '超限提示说明体积上限');

// ---- 10. 相册取消不打扰 ----
const modalCount = modals.length;
page.onImportAvatar();
lastPicker.o.fail({ errMsg: 'chooseMedia:fail cancel' });
assert(modals.length === modalCount, '用户取消相册时不弹窗打扰');

// ---- 11. 权限拒绝给出可恢复路径 ----
page.onImportAvatar();
lastPicker.o.fail({ errMsg: 'chooseMedia:fail auth deny' });
assert(modals.length === modalCount + 1, '权限被拒时弹窗说明原因');
assert(modals[modalCount].confirmText === '去设置', '弹窗提供「去设置」入口');
modals[modalCount].success({ confirm: true });
assert(openedSetting === 1, '确认后打开设置页');

// ---- 12. 落盘失败要给可恢复提示 ----
const originalFs = global.wx.getFileSystemManager;
global.wx.getFileSystemManager = () => ({
  saveFileSync() { throw new Error('disk full'); },
  unlinkSync() {},
  accessSync() {}
});
const outfitBeforeFail = outfitPath();
page.onImportOutfit();
lastPicker.o.success({ tempFiles: [{ tempFilePath: 'tmp/y.webp', size: 100 }] });
assert(lastToast() === '保存失败，请重试', '落盘失败提示重试而不是静默失败');
global.wx.getFileSystemManager = originalFs;
assert(outfitPath() === outfitBeforeFail, '落盘失败后原服装仍然可用（先写新文件再删旧文件）');

// ---- 13. 文件被系统回收 → 只自愈受影响的槽位 ----
files.delete(page.data.avatarSrc);
page.onShow();
assert(page.data.avatarSrc === '', '头像文件被回收后回到字母占位');
assert(!store.has(Avatar.SLOTS.avatar.key), '失效的头像记录被清空');
assert(outfitPath() === outfitBeforeFail, '头像自愈不影响服装');
assert(page.data.hasCustom === true, '还有服装时「恢复默认」入口仍然显示');

// ---- 14. 恢复默认：取消不清、确认才清 ----
const cancelCount = modalCount + 1;
page.onResetAvatar();
assert(modals.length === cancelCount + 1, '恢复默认先弹确认框');
modals[cancelCount].success({ cancel: true });
assert(outfitPath() !== '', '取消确认不会清掉形象');
page.onResetAvatar();
modals[modals.length - 1].success({ confirm: true });
assert(page.data.avatarSrc === '' && outfitPath() === '', '确认后头像与服装都回到默认');
assert(!store.has(Avatar.SLOTS.avatar.key) && !store.has(Avatar.SLOTS.outfit.key), '两个槽位的记录都被清空');
assert(page.data.hasCustom === false, '恢复默认后「恢复默认」入口消失');
assert(lastToast() === '已恢复默认形象', '恢复默认有提示');

console.log(`\n结果：${passed} 通过，${failed} 失败`);
process.exit(failed ? 1 : 0);
