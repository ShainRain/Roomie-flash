// pages/room 播放器同步行为测试
// 回归背景：room.js 曾只在 onShow 读一次 Player.snapshot()，导致在房间里切歌后，
// 墙上徽标与唱机柜提示仍显示进入房间时的那首（"歌换了，屋子没换"）。
// 这里用 Page/wx/getApp 桩把页面脚本跑在 Node 里，直接验证订阅链路是否成立。
// （迁移自旧版同名测试，适配 room-scene 组件化后的新页面结构）
const path = require('path');

let passed = 0;
let failed = 0;
const assert = (cond, name) => { cond ? passed++ : failed++; console.log((cond ? '  ✓ ' : '  ✗ ') + name); };

// ---- 运行环境桩 ----
let captured = null;
global.Page = (cfg) => { captured = cfg; };
global.getApp = () => ({
  globalData: {
    user: { name: 'MOMO', roomId: '0731' },
    room: { furniture: ['vinyl-player', 'sofa', 'guitar'], floor: 'blue-gray', lightTemp: 2700 }
  }
});
global.wx = {
  getWindowInfo: () => ({ statusBarHeight: 44 }),
  getStorageSync: () => undefined,
  showToast: () => {},
  showActionSheet: () => {},
  createSelectorQuery: () => ({ select: () => ({ boundingClientRect: () => ({ exec: () => {} }) }), in: () => global.wx.createSelectorQuery() })
};
// 页面里的 setTimeout 只用于提示气泡淡出，不真挂住 Node 进程
const realSetTimeout = global.setTimeout;
global.setTimeout = (fn, ms) => {
  const handle = realSetTimeout(fn, ms);
  if (handle && handle.unref) handle.unref();
  return handle;
};

require(path.join(__dirname, '..', 'miniprogram', 'pages', 'room', 'room.js'));
const Player = require('../miniprogram/utils/player');

function newPage() {
  const page = Object.create(captured);
  page.data = JSON.parse(JSON.stringify(captured.data));
  page.setData = function (patch) { Object.assign(this.data, patch); };
  return page;
}

// ---- 1. 进房即拿到当前曲目 + 订阅建立且幂等 ----
const page = newPage();
page.onLoad();
page.refreshRoomConfig();
assert(page.data.nowPlaying.title === 'Aruarian_Dance', '进房即显示当前曲目《Aruarian_Dance》');
assert(typeof page.unsubPlayer === 'function', 'onLoad 建立了播放器订阅');
const firstUnsub = page.unsubPlayer;
page.onLoad();
assert(page.unsubPlayer === firstUnsub, 'onLoad 重复调用不会重复订阅');

// ---- 2. 核心回归：切歌后房内标题实时更新 ----
Player.next();
assert(Player.snapshot().track.title === '晴天', '（前置）播放器已切到《晴天》');
assert(page.data.nowPlaying.title === '晴天', '切歌后房内标题实时变为《晴天》');
Player.next();
assert(page.data.nowPlaying.title === '花海', '再切一首仍实时变为《花海》');
Player.prev();
assert(page.data.nowPlaying.title === '晴天', '上一首同样实时更新');

// ---- 3. 唱机柜提示文案引用当前曲目 ----
page.onFurnitureTap({ detail: { id: 'turntable' } });
assert(page.data.roomState.recordPlaying === true, '点击唱机柜后唱片开始旋转');
assert(page.data.bubbles.some((b) => b.text.indexOf('晴天') >= 0), '唱机柜提示气泡引用当前曲目');
Player.next();
assert(page.data.roomState.recordPlaying === true, '切歌不打断唱片旋转状态');
assert(page.data.nowPlaying.title === '花海', '唱片旋转中切歌，标题继续跟随');

// ---- 4. 对端切歌：本端跟随 ----
Player.switchTo(0, false);
assert(page.data.nowPlaying.title === 'Aruarian_Dance', '本地切回《Aruarian_Dance》');
page.applyPeerPlayer({ index: 2, position: 5, playing: true, sentAt: Date.now(), from: 'KIKI' });
assert(page.data.nowPlaying.title === '花海', '对端切歌后本端房内标题跟随');
assert(Player.snapshot().playing === true, '对端播放态一并生效');

// ---- 5. 房间缓存补发（from: '__cache'）不吞掉本地进度 ----
Player.switchTo(0, false);
Player.seek(40);
const posBefore = Player.snapshot().position;
assert(posBefore > 0, `（前置）本地进度非零：${posBefore}s`);
page.applyPeerPlayer({ index: 1, position: 999, playing: false, sentAt: Date.now() - 600000, from: '__cache' });
assert(Player.snapshot().index === 1, '缓存补发仍能同步曲目');
assert(Player.snapshot().position === posBefore, '陈旧缓存不改动进度（避免进房瞬间跳歌）');

// ---- 6. 卸载退订：不留残余订阅 ----
page.onUnload();
const titleAfterUnload = page.data.nowPlaying.title;
Player.next();
assert(page.data.nowPlaying.title === titleAfterUnload, 'onUnload 退订后不再收到快照');
assert(page.unsubPlayer === null, 'onUnload 清空订阅句柄');

console.log(`\n结果：${passed} 通过，${failed} 失败`);
process.exit(failed ? 1 : 0);
