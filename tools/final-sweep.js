// 终验全页面截图巡扫:node tools/final-sweep.js
// 每页重试 2 次;失败记录但不中断。
const automator = require('miniprogram-automator');
const path = require('path');

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
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' });
  const results = [];
  for (const [route, name] of PAGES) {
    let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt += 1) {
      try {
        await mp.reLaunch('/' + route);
        await new Promise((r) => setTimeout(r, 4500));
        await mp.screenshot({ path: path.join(__dirname, '..', 'visual-validation', 'rendered', `${name}.png`) });
        ok = true;
      } catch (e) {
        console.log(`retry ${name}: ${e.message}`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    results.push(`${ok ? 'OK' : 'FAIL'} ${name}`);
    console.log(results[results.length - 1]);
  }
  await mp.disconnect();
  console.log('sweep done:', results.filter((r) => r.startsWith('OK')).length + '/' + PAGES.length);
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
