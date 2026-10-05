// Roomie 真机截图自动化：连接已启动 automation 的 IDE（cli auto --auto-port 9420）
// 前置：① IDE 已登录 ② 项目已在 IDE 中打开 ③ 已执行 wx-auto.bat
const automator = require('miniprogram-automator');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'preview-app', 'shots-real');
const PAGES = [
  ['pages/home/home', 'home'],
  ['pages/room/room', 'room'],
  ['pages/song/song', 'song'],
  ['pages/friends/friends', 'friends'],
  ['pages/duo/duo?peer=KIKI', 'duo'],
  ['pages/architect/architect', 'architect'],
  ['pages/profile/profile', 'profile'],
  ['pages/postcard/postcard', 'postcard'],
  ['pages/messages/messages', 'messages'],
  ['pages/create/create', 'create']
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const miniProgram = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' });
  console.log('connected');

  for (const [route, name] of PAGES) {
    try {
      await miniProgram.reLaunch('/' + route);
      await miniProgram.waitFor(2500);
      const file = path.join(OUT, `${name}.png`);
      await miniProgram.screenshot({ path: file });
      console.log(`OK ${name}.png`);
    } catch (e) {
      console.log(`FAIL ${name}: ${e.message}`);
    }
  }

  // 抓编译告警
  try {
    const page = await miniProgram.currentPage();
    console.log('current page:', page.path);
  } catch (e) { /* ignore */ }

  await miniProgram.disconnect();
  console.log('done ->', OUT);
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
