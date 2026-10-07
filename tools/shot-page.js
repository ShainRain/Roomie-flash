// 通用页面截图:node tools/shot-page.js <route> <outName> [waitMs]
// 前置:IDE automation 已在 9420 端口(tools\wx-auto.bat)
const automator = require('miniprogram-automator');
const path = require('path');

const [route, outName, waitMs] = process.argv.slice(2);
if (!route || !outName) {
  console.error('usage: node tools/shot-page.js <route> <outName> [waitMs]');
  process.exit(1);
}

(async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' });
  await mp.reLaunch('/' + route.replace(/^\//, ''));
  await new Promise((r) => setTimeout(r, Number(waitMs) || 4000));
  const out = path.join(__dirname, '..', 'visual-validation', 'rendered', `${outName}.png`);
  await mp.screenshot({ path: out });
  console.log('OK', out);
  await mp.disconnect();
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
