// Phase 1.5 Runtime Verification:连接 IDE automation,跑 room 页并截图 + 抓运行时状态
// 前置:cli.bat auto --project ... --auto-port 9420 已启动且 IDE 已登录
// 运行: node tools/verify-room-runtime.js
const automator = require('miniprogram-automator');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'visual-validation', 'rendered');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const miniProgram = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' });
  console.log('connected');

  // 收集控制台错误/告警
  const logs = [];
  miniProgram.on('console', (msg) => {
    if (['error', 'warn'].includes(msg.type)) logs.push(`[${msg.type}] ${msg.text}`);
  });

  await miniProgram.reLaunch('/pages/room/room');
  await sleep(1000);

  // 对齐离线 Master 的初始条件:walnut 地板 / 2700K / 全 13 件 DIY 家具。
  // 注意:不能在这里给 globalData 赋值对象——evaluate 创建的是跨 realm 对象,
  // setData 会把其中的数组从组件同步里丢弃(实测 furniture 丢失)。只写存储,
  // 然后让页面在自己的 realm 里读回。
  await miniProgram.evaluate(() => {
    wx.setStorageSync('roomie_room', {
      floor: 'walnut',
      lightTemp: 2700,
      furniture: ['sofa', 'vinyl-player', 'cat-bed', 'bookshelf', 'lamp', 'plant', 'rug', 'curtain', 'projector', 'poster', 'coffee', 'doll', 'guitar']
    });
  });
  await miniProgram.reLaunch('/pages/room/room');
  await sleep(2000);
  await (await miniProgram.currentPage()).callMethod('reloadRoomFromStorage');
  await sleep(2500);

  // 运行时状态探针:组件是否渲染、图层数量、角色/热点存在性、舞台几何
  const probe = await miniProgram.evaluate(() => {
    const page = getCurrentPages().pop();
    const data = page ? page.data : {};
    return {
      route: page ? page.route : null,
      floor: data.floor,
      lightTemp: data.lightTemp,
      furnitureKeys: data.furnitureKeys,
      recordIds: (data.recordIds || []).length,
      characters: (data.characters || []).map((c) => ({ id: c.id, x: Math.round(c.x), y: Math.round(c.y), frame: c.frame })),
      bubbles: (data.bubbles || []).length,
      roomState: data.roomState
    };
  });
  console.log('PROBE', JSON.stringify(probe, null, 2));

  // DOM 层探针:XPath 取组件 outerWxml 后计数(此环境 CSS 选择器/getElementsByXpath 均不可用)
  const page = await miniProgram.currentPage();
  const scene = await page.getElementByXpath('//room-scene');
  const wxml = await scene.outerWxml();
  const countC = (re) => (wxml.match(re) || []).length;
  const dom2 = {
    lightLayers: countC(/sc-ly sc-screen/g),
    totalLayerImages: countC(/class="sc-ly/g),
    furnitureOverlays: countC(/room\/furn-/g),
    chars: countC(/class="sc-sprite/g),
    charShadows: countC(/sc-char-shadow/g),
    hotspots: countC(/class="sc-hotspot"/g),
    slots: countC(/class="sc-slot"/g),
    floorTint: /sc-floor-tint/.test(wxml),
    turntableSpin: /sc-turntable-spin/.test(wxml)
  };
  const stageEl = await page.getElementByXpath('//*[contains(@class,"sc-stage")]');
  const sOff = await stageEl.offset();
  const sSize = await stageEl.size();
  dom2.stage = { left: Math.round(sOff.left), top: Math.round(sOff.top), w: Math.round(sSize.width), h: Math.round(sSize.height) };
  const spriteEl = await page.getElementByXpath('//*[contains(@class,"sc-sprite")]');
  const spSize = await spriteEl.size();
  dom2.sprite = { w: Math.round(spSize.width), h: Math.round(spSize.height) };
  console.log('DOM', JSON.stringify(dom2, null, 2));

  // 截图 1:初始状态(2700K 默认,放映机关)
  await miniProgram.screenshot({ path: path.join(OUT, 'room-runtime.png') });
  console.log('OK room-runtime.png');

  // 真实 tap(automator 触摸派发):舞台中央 → 组件 onStageTap 归一化 → 页面寻路移动
  await stageEl.tap();
  console.log('TAP dispatched at stage center');
  await sleep(2500);
  const afterMove = await miniProgram.evaluate(() => {
    const p = getCurrentPages().pop();
    return p ? { player: p.data.player, sprite: p.data.playerSprite } : null;
  });
  console.log('AFTER_TAP', JSON.stringify(afterMove));
  await miniProgram.screenshot({ path: path.join(OUT, 'room-runtime-moved.png') });
  console.log('OK room-runtime-moved.png');

  console.log('CONSOLE_ISSUES', JSON.stringify(logs.slice(0, 30), null, 2));
  await miniProgram.disconnect();
  console.log('done');
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
