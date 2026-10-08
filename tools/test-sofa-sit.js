// 沙发坐下/站起交互链路测试：node tools/test-sofa-sit.js
// 场景：点沙发 → 保存原坐标并直接落座坐垫(sit) → 落座锁阻断其他交互 → 再点沙发 → 回原坐标站立
// 运行环境：Node（stub Page/wx/getApp，不依赖开发者工具）

let captured = null;
const listeners = [];

global.Page = (cfg) => { captured = cfg; };
global.getApp = () => ({
  globalData: {
    user: { name: 'MOMO', level: 7, badge: '建筑师', roomId: '0731', roomName: '深夜放映室' },
    room: { floor: 'blue-gray', lightTemp: 2700, lightBright: 100, furniture: ['sofa', 'lamp', 'projector', 'guitar'] }
  },
  normalizeRoom(raw) {
    const def = { floor: 'blue-gray', lightTemp: 2700, lightBright: 100, furniture: ['sofa'] };
    if (!raw || typeof raw !== 'object') return def;
    return def;
  }
});
global.wx = {
  getStorageSync: () => [],
  setStorageSync() {},
  getWindowInfo: () => ({ statusBarHeight: 20 }),
  nextTick: (fn) => fn(),
  showToast() {},
  showActionSheet() {},
  connectSocket: () => ({
    onOpen() {}, onMessage() {}, onClose() {}, onError() {}, send() {}, close() {}
  })
};

require('../miniprogram/pages/room/room.js');

let passed = 0;
let failed = 0;
function ok(cond, name) {
  if (cond) { passed += 1; console.log(`ok ${passed + failed} - ${name}`); }
  else { failed += 1; console.log(`not ok ${passed + failed} - ${name}`); }
}

// 构造页面实例：浅合并 setData（与微信语义一致：顶层 key 覆盖）
const page = Object.create(captured);
page.data = JSON.parse(JSON.stringify(captured.data));
page.setData = function (patch) {
  Object.keys(patch).forEach((k) => { this.data[k] = patch[k]; });
};
const seat = require('../miniprogram/utils/room-map.js')
  .createMap(require('../miniprogram/utils/room-scene-layout.js').GEOMETRY,
    require('../miniprogram/utils/room-scene-layout.js'))
  .fromUV(0.1, 0.45); // 沙发 collision uv 中心（与页面 SOFA_SEAT_UV 一致）

// 补全页面初始化（建立热点清单与场景配置）
page.onLoad();
page.onShow();

// ---- 1. 走路中途点沙发：取消寻路并直接落座 ----
page.moveTimer = setInterval(() => {}, 1000);
page.onFurnitureTap({ detail: { id: 'sofa' } });
ok(page.moveTimer === null, '坐下时取消进行中的寻路计时器');
ok(page.data.roomState.seated === true, '坐下后 seated=true');
ok(page.data.playerSprite === 'sit', '坐下后姿态为 sit');
ok(Math.abs(page.data.player.left - seat.left) < 0.01 && Math.abs(page.data.player.top - seat.top) < 0.01,
  `落座点=沙发坐垫 (${seat.left.toFixed(1)}, ${seat.top.toFixed(1)})`);
ok(page.preSeatPos && Math.abs(page.preSeatPos.left - 40) < 0.01 && Math.abs(page.preSeatPos.top - 74) < 0.01,
  '原坐标已保存 (40, 74)');
ok(page.data.characters[0].zBoost === 80, '坐下时角色渲染层级抬高（不被沙发遮挡）');

// ---- 2. 落座锁：其他交互全部阻断 ----
page.onFurnitureTap({ detail: { id: 'projector' } });
ok(page.data.roomState.projectorOn === false, '落座时点放映机被阻断');
page.onFurnitureTap({ detail: { id: 'lamp' } });
ok(page.data.roomState.lampOn === true, '落座时点落地灯被阻断');
page.onFurnitureTap({ detail: { id: 'turntable' } });
ok(page.data.roomState.recordPlaying === false, '落座时点唱机被阻断');
page.onSceneTap({ detail: { left: 55, top: 70 } });
ok(Math.abs(page.data.player.left - seat.left) < 0.01, '落座时点地面不移动');
page.onCharTap({ detail: { id: 'kiki' } });
ok(Math.abs(page.data.player.left - seat.left) < 0.01, '落座时点 KIKI 不触发互动');

// ---- 3. 再点沙发：回原坐标站立 ----
page.onFurnitureTap({ detail: { id: 'sofa' } });
ok(page.data.roomState.seated === false, '再点沙发 seated=false');
ok(page.data.playerSprite === 'idle', '站起后姿态为 idle');
ok(Math.abs(page.data.player.left - 40) < 0.01 && Math.abs(page.data.player.top - 74) < 0.01,
  '站起后回到原坐标 (40, 74)');
ok(page.preSeatPos === null, '站起后清空暂存坐标');
ok(page.data.characters[0].zBoost === 0, '站起后渲染层级还原');

// ---- 5. 站起后交互恢复 ----
page.onFurnitureTap({ detail: { id: 'projector' } });
ok(page.data.roomState.projectorOn === true, '站起后放映机恢复可用');

// ---- 6. 唱片墙：轮流展示「我的」中已选唱片名称 ----
const wallBubble = () => (page.data.bubbles.find((b) => b.id === 'record-wall') || {}).text || '';
page.onFurnitureTap({ detail: { id: 'record-wall' } });
ok(wallBubble().includes('1/6') && wallBubble().includes('晴天'), `第1次点击展示第一张：《${wallBubble()}》`);
page.onFurnitureTap({ detail: { id: 'record-wall' } });
ok(wallBubble().includes('2/6') && wallBubble().includes('花海'), `第2次点击切到下一张：《${wallBubble()}》`);
for (let i = 0; i < 5; i += 1) page.onFurnitureTap({ detail: { id: 'record-wall' } });
ok(wallBubble().includes('1/6') && wallBubble().includes('晴天'), `点满一轮后循环回第一张：《${wallBubble()}》`);
ok(page.data.roomState.recordPlaying === true, '点击唱片墙仍保持"正在播放"状态');

console.log(`\n结果：${passed} 通过，${failed} 失败`);
process.exit(failed ? 1 : 0);
