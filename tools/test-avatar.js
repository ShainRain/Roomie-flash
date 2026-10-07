// utils/avatar.js 行为测试（头像 / 服装 两个独立槽位）
// 用内存 storage + 假文件系统把 avatar.js 跑在 Node 里。
// 关注点：两槽位互不影响、临时文件搬进 USER_DATA_PATH、换图不留垃圾、
//        写入失败不丢旧形象、文件被回收要能自愈。
let passed = 0;
let failed = 0;
const assert = (cond, name) => { cond ? passed++ : failed++; console.log((cond ? '  ✓ ' : '  ✗ ') + name); };

// ---- wx 桩 ----
const store = new Map();
const files = new Map();   // path -> { from }
const unlinked = [];       // 被删除的路径

const realFileSystem = () => ({
  saveFileSync(src, dest) {
    if (files.has(dest)) throw new Error('file already exists');
    files.set(dest, { from: src });
    return dest;
  },
  unlinkSync(p) {
    if (!files.has(p)) throw new Error('no such file');
    files.delete(p);
    unlinked.push(p);
  },
  accessSync(p) {
    if (!files.has(p)) throw new Error('no such file');
  }
});

const brokenFileSystem = () => ({
  saveFileSync() { throw new Error('disk full'); },
  unlinkSync(p) { files.delete(p); unlinked.push(p); },
  accessSync(p) { if (!files.has(p)) throw new Error('no such file'); }
});

const wxStub = {
  env: { USER_DATA_PATH: 'wxfile://usr' },
  getStorageSync: (k) => (store.has(k) ? store.get(k) : ''),
  setStorageSync: (k, v) => store.set(k, v),
  removeStorageSync: (k) => store.delete(k),
  getFileSystemManager: realFileSystem
};
global.wx = wxStub;

const Avatar = require('../miniprogram/utils/avatar');
const AVATAR_KEY = Avatar.SLOTS.avatar.key;
const OUTFIT_KEY = Avatar.SLOTS.outfit.key;
const isAvatarFile = (p) => /^wxfile:\/\/usr\/roomie-avatar-\d+-\d+\.[a-z]+$/.test(String(p));
const isOutfitFile = (p) => /^wxfile:\/\/usr\/roomie-outfit-\d+-\d+\.[a-z]+$/.test(String(p));

// ---- 1. 未导入：头像为空串、服装回退默认精灵图 ----
assert(Avatar.path('avatar') === '', '未导入时头像路径为空（页面显示字母占位）');
assert(Avatar.path('outfit') === '', '未导入时服装路径为空');
assert(Avatar.src('outfit', 'walk-a') === '/assets/img/char-momo-walk-a.webp', '服装未导入时回退默认精灵图');
assert(Avatar.src('outfit', 'sit') === '/assets/img/char-momo-sit.webp', '坐下动作同样回退默认');
assert(Avatar.read('avatar') === null && Avatar.read('outfit') === null, '两个槽位初始都没有记录');
assert(Avatar.defaultSrc() === '/assets/img/char-momo-idle.webp', '默认路径未传动作时回退 idle');

// ---- 2. 头像与服装互不影响（本次需求核心） ----
const avatarRec = Avatar.save('avatar', 'tmp/a.webp', { name: 'me.webp', size: 1000 });
assert(isAvatarFile(avatarRec.path), `头像落盘到独立文件名：${avatarRec.path}`);
assert(Avatar.path('avatar') === avatarRec.path, '头像槽位读到自己的文件');
assert(Avatar.path('outfit') === '', '导入头像不会顺带设置服装');
assert(Avatar.src('outfit', 'idle') === '/assets/img/char-momo-idle.webp', '导入头像后服装仍走默认精灵图');

const outfitRec = Avatar.save('outfit', 'tmp/b.png', { name: 'suit.png', size: 2000 });
assert(isOutfitFile(outfitRec.path), `服装落盘到独立文件名：${outfitRec.path}`);
assert(/\.png$/.test(outfitRec.path), '服装保留来源扩展名');
assert(Avatar.path('avatar') === avatarRec.path, '导入服装不会覆盖头像');
assert(Avatar.path('outfit') === outfitRec.path, '服装槽位读到自己的文件');
assert(Avatar.src('outfit', 'walk-a') === outfitRec.path, '服装导入后所有动作共用同一张图');
assert(files.has(avatarRec.path) && files.has(outfitRec.path), '两个文件同时存在，互不覆盖');

// ---- 3. 只清一个槽位不影响另一个 ----
Avatar.clear('outfit');
assert(Avatar.path('outfit') === '', 'clear(outfit) 清空服装槽');
assert(!files.has(outfitRec.path), 'clear(outfit) 删除服装文件');
assert(Avatar.path('avatar') === avatarRec.path, 'clear(outfit) 不影响头像');
assert(files.has(avatarRec.path), '头像文件仍在');
assert(store.has(AVATAR_KEY) && !store.has(OUTFIT_KEY), '两个槽位使用各自的 storage key');

// ---- 4. 换图：写新的、删旧的 ----
const avatarRec2 = Avatar.save('avatar', 'tmp/a2.png', { name: 'me2.png', size: 500 });
assert(isAvatarFile(avatarRec2.path) && avatarRec2.path !== avatarRec.path, '换图换了新文件名');
assert(!files.has(avatarRec.path), '旧头像文件被删除，不留垃圾');
assert(unlinked.indexOf(avatarRec.path) >= 0, '旧文件走删除');
assert(store.get(AVATAR_KEY).path === avatarRec2.path, '头像 storage 指向新文件');

// ---- 5. 连续导入都成功（不再有"同名覆盖失败"问题） ----
const avatarRec3 = Avatar.save('avatar', 'tmp/a3.png', { name: 'me3.png', size: 100 });
assert(avatarRec3.path !== avatarRec2.path, '连续导入两次也拿到不同文件名');
assert(files.has(avatarRec3.path) && !files.has(avatarRec2.path), '后一次成功且清掉了前一次');

// ---- 6. 写入失败不能丢掉原来的形象 ----
const keep = Avatar.path('avatar');
wxStub.getFileSystemManager = brokenFileSystem;
let saveFailed = false;
try {
  Avatar.save('avatar', 'tmp/fail.webp', { name: 'fail.webp', size: 10 });
} catch (e) {
  saveFailed = true;
}
wxStub.getFileSystemManager = realFileSystem;
assert(saveFailed, '写入失败时抛出可捕获的错误（页面提示重试）');
assert(Avatar.path('avatar') === keep, '写入失败后原来的形象仍然可用');
assert(files.has(keep), '写入失败时旧文件没有被删掉');

// ---- 7. 文件被系统回收：只自愈该槽位 ----
const outfitKeep = Avatar.save('outfit', 'tmp/c.webp', { name: 'suit.webp', size: 30 });
files.delete(Avatar.path('avatar'));
assert(Avatar.read('avatar') === null, '头像文件丢失时 read 返回 null');
assert(!store.has(AVATAR_KEY), '失效的头像记录被清空');
assert(Avatar.path('outfit') === outfitKeep.path, '头像自愈不影响服装');
assert(store.has(OUTFIT_KEY), '服装记录仍然保留');

// ---- 8. 体积校验 ----
assert(Avatar.validate(0.5 * 1024 * 1024).ok === true, '0.5MB 通过校验');
assert(Avatar.validate(Avatar.MAX_BYTES).ok === true, '刚好 2MB 通过校验');
const big = Avatar.validate(3 * 1024 * 1024);
assert(big.ok === false, '3MB 被拒绝');
assert(big.reason.indexOf('3.0MB') >= 0, '拒绝原因带上实际体积');
assert(Avatar.validate(undefined).ok === true, '体积未知时放行（不阻塞相册导入）');

// ---- 9. 缓存结构损坏也要扛住 ----
store.set(AVATAR_KEY, 'not-an-object');
assert(Avatar.read('avatar') === null, '缓存是字符串时返回 null');
store.set(AVATAR_KEY, { path: '' });
assert(Avatar.read('avatar') === null, '缓存缺 path 时返回 null');
store.set(AVATAR_KEY, { path: 123 });
assert(Avatar.read('avatar') === null, 'path 类型错误时返回 null');

// ---- 10. 槽位名容错 ----
store.delete(AVATAR_KEY);
Avatar.save('avatar', 'tmp/d.webp', { name: 'd.webp', size: 1 });
assert(Avatar.path('不存在的槽位') === Avatar.path('avatar'), '未知槽位名回退到头像槽');

// ---- 11. 恢复默认 ----
Avatar.clear('avatar');
Avatar.clear('outfit');
assert(!store.has(AVATAR_KEY) && !store.has(OUTFIT_KEY), '两个槽位都能被清空');
assert(Avatar.path('avatar') === '', '清空后头像回到空');
assert(Avatar.src('outfit', 'idle') === '/assets/img/char-momo-idle.webp', '清空后服装回到默认');
Avatar.clear('avatar');
assert(Avatar.read('avatar') === null, '重复 clear 不报错（幂等）');

// ---- 12. 环境不支持本地文件时抛可捕获错误 ----
const envBackup = wxStub.env;
wxStub.env = {};
let threw = false;
try {
  Avatar.save('avatar', 'tmp/x.webp', {});
} catch (e) {
  threw = true;
}
wxStub.env = envBackup;
assert(threw, '缺少 USER_DATA_PATH 时抛出可捕获的错误');
let threw2 = false;
try {
  Avatar.save('avatar', '', {});
} catch (e) {
  threw2 = true;
}
assert(threw2, '缺少临时路径时抛出可捕获的错误');

// ---- 13. 体积文案 ----
assert(Avatar.formatSize(0) === '未知大小', '空体积显示未知大小');
assert(Avatar.formatSize(512) === '512B', '字节显示');
assert(Avatar.formatSize(2048) === '2KB', 'KB 显示');
assert(Avatar.formatSize(2 * 1024 * 1024) === '2.0MB', 'MB 显示');

console.log(`\n结果：${passed} 通过，${failed} 失败`);
process.exit(failed ? 1 : 0);
