// 生成 reference-assets/ui-reference/home.png:Home 视觉验收基准(设计目标合成图)
// 构成:深夜壳 + masthead + 今晚文案 + Room Master hero(~52%) + 悬浮 pill + 任务卡 + 播放器 + CTA + tab
// 运行: node tools/make-home-reference.js
const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const W = 780;
const H = 1688;
const S = W / 750; // rpx → px(以 750rpx 设计宽)

const C = {
  night950: '#08111D', night900: '#0E1A29', night850: '#162537',
  nightText: '#F4EFE4', nightSub: '#93A0B1',
  paper100: '#F7F1E4', ink900: '#26221A', ink500: '#8A8578',
  green: '#2BC96B', greenDeep: '#1FA75A', amber: '#E9A942'
};

async function textLayer(svg) {
  return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`)).png().toBuffer();
}

(async () => {
  const heroSize = Math.round(H * 0.56); // 舞台 56vh,容器 52vh 居中裁切
  const heroY = Math.round(H * 0.205);
  const heroVisH = Math.round(H * 0.52);
  const hero = await sharp(path.join(ROOT, 'visual-validation/rendered/room-master.png'))
    .resize(heroSize, heroSize)
    .extract({
      left: Math.round((heroSize - W) / 2),
      top: Math.round((heroSize - heroVisH) / 2),
      width: W,
      height: heroVisH
    }).png().toBuffer();

  const ui = `
  <defs>
    <linearGradient id="heroFade" x2="0" y2="1"><stop stop-color="rgba(8,17,29,0)" offset=".82"/><stop offset="1" stop-color="rgba(8,17,29,.9)"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>

  <!-- masthead -->
  <text x="40" y="78" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="20" font-weight="700" letter-spacing="6" fill="${C.nightSub}">ROOMIE</text>
  <text x="40" y="104" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="17" fill="${C.nightSub}">深夜放映室 · ROOM 0731</text>
  <circle cx="${W - 56}" cy="82" r="26" fill="${C.night850}"/>
  <text x="${W - 56}" y="92" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="26" font-weight="700" fill="${C.amber}" text-anchor="middle">M</text>

  <!-- 今晚文案(克制,不抢房间) -->
  <text x="40" y="${heroY - 78}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="22" fill="${C.nightSub}">今晚,</text>
  <text x="40" y="${heroY - 34}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="38" font-weight="700" fill="${C.nightText}"><tspan fill="${C.amber}">MOMO</tspan> 想放一首歌</text>

  <!-- hero 底部渐隐,与夜色衔接 -->
  <rect x="0" y="${heroY}" width="${W}" height="${Math.round(H * 0.52)}" fill="url(#heroFade)"/>

  <!-- 悬浮 pill:左上 LIVE / 右上 氛围值 -->
  <g>
    <rect x="40" y="${heroY + 40}" width="252" height="46" rx="23" fill="rgba(22,37,55,.82)"/>
    <circle cx="66" cy="${heroY + 63}" r="7" fill="${C.green}"/>
    <text x="84" y="${heroY + 70}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="20" fill="${C.nightText}">放映中 · 2 位 roomie</text>
    <rect x="${W - 40 - 150}" y="${heroY + 40}" width="150" height="46" rx="23" fill="${C.green}"/>
    <text x="${W - 40 - 75}" y="${heroY + 70}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF" text-anchor="middle">+12 氛围值</text>
  </g>

  <!-- 左下角色 chip -->
  <g>
    <rect x="52" y="${heroY + Math.round(H * 0.52) - 92}" width="240" height="56" rx="28" fill="${C.paper100}"/>
    <circle cx="86" cy="${heroY + Math.round(H * 0.52) - 64}" r="16" fill="${C.amber}"/>
    <text x="86" y="${heroY + Math.round(H * 0.52) - 58}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="18" font-weight="700" fill="#FFF" text-anchor="middle">M</text>
    <text x="112" y="${heroY + Math.round(H * 0.52) - 57}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="20" font-weight="600" fill="${C.ink900}">MOMO 走近唱机</text>
  </g>

  <!-- 任务卡(叠 hero 下缘) -->
  <g>
    <rect x="40" y="${Math.round(H * 0.705)}" width="${W - 80}" height="118" rx="26" fill="${C.paper100}"/>
    <circle cx="96" cy="${Math.round(H * 0.705) + 59}" r="27" fill="${C.green}"/>
    <text x="96" y="${Math.round(H * 0.705) + 72}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="40" font-weight="300" fill="#FFF" text-anchor="middle">+</text>
    <text x="140" y="${Math.round(H * 0.705) + 48}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="17" fill="${C.ink500}">今晚的放映任务</text>
    <text x="140" y="${Math.round(H * 0.705) + 84}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="24" font-weight="700" fill="${C.ink900}">让 KIKI 找到唱片墙</text>
    <rect x="${W - 40 - 128}" y="${Math.round(H * 0.705) + 38}" width="108" height="44" rx="22" fill="#FBF0D8"/>
    <text x="${W - 40 - 74}" y="${Math.round(H * 0.705) + 67}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="19" font-weight="700" fill="${C.amber}" text-anchor="middle">+80 XP</text>
  </g>

  <!-- mini player -->
  <g>
    <rect x="40" y="${Math.round(H * 0.795)}" width="${W - 80}" height="104" rx="24" fill="${C.night850}"/>
    <circle cx="92" cy="${Math.round(H * 0.795) + 52}" r="34" fill="#23262B"/>
    <circle cx="92" cy="${Math.round(H * 0.795) + 52}" r="12" fill="${C.amber}"/>
    <text x="146" y="${Math.round(H * 0.795) + 46}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="22" font-weight="700" fill="${C.nightText}">晴天</text>
    <text x="146" y="${Math.round(H * 0.795) + 76}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="17" fill="${C.nightSub}">周杰伦 · 叶惠美</text>
    <circle cx="${W - 100}" cy="${Math.round(H * 0.795) + 52}" r="30" fill="${C.green}"/>
    <path d="M${W - 110} ${Math.round(H * 0.795) + 38} L${W - 110} ${Math.round(H * 0.795) + 66} L${W - 88} ${Math.round(H * 0.795) + 52}Z" fill="#FFF"/>
  </g>

  <!-- CTA(文字单独一层渲染,见下方 ctaText) -->
  <rect x="40" y="${Math.round(H * 0.875)}" width="${W - 80}" height="92" rx="46" fill="${C.green}"/>

  <!-- tab bar -->
  <rect x="0" y="${H - 128}" width="${W}" height="128" fill="${C.night900}"/>
  <rect x="0" y="${H - 128}" width="${W}" height="2" fill="rgba(244,239,228,.08)"/>
  <circle cx="${W / 2}" cy="${H - 148}" r="42" fill="${C.green}"/>
  <text x="${W / 2}" y="${H - 132}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="44" font-weight="300" fill="#FFF" text-anchor="middle">+</text>
  ${[0, 1, 3, 4].map((slot, i) => {
    const labels = ['房间', '好友', '消息', '我'];
    const x = [78, 234, 546, 702][i];
    return `<text x="${x}" y="${H - 52}" font-family="Microsoft YaHei, Verdana, sans-serif" font-size="20" fill="${i === 0 ? C.green : C.nightSub}" text-anchor="middle">${labels[i]}</text>`;
  }).join('')}
  `;

  const nightLayer = await textLayer(`<defs><linearGradient id="nightBg" x2="0" y2="1"><stop stop-color="${C.night950}"/><stop offset=".55" stop-color="${C.night900}"/><stop offset="1" stop-color="${C.night950}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#nightBg)"/>`);

  // CTA 文字+箭头单独成层(大 SVG 内该元素渲染异常,单独渲染稳定)
  const ctaY = Math.round(H * 0.875);
  const ctaLayer = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W - 80}" height="92"><text x="${(W - 80) / 2 - 14}" y="57" font-family="Microsoft YaHei" font-size="26" font-weight="700" fill="#FFFFFF" text-anchor="middle">进入放映室</text><path d="M${(W - 80) / 2 + 84} 36 L${(W - 80) / 2 + 104} 46 L${(W - 80) / 2 + 84} 56" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`)).png().toBuffer();

  await sharp({
    create: { width: W, height: H, channels: 4, background: C.night950 }
  }).composite([
    { input: nightLayer, left: 0, top: 0 },
    { input: hero, left: 0, top: heroY },
    { input: await textLayer(ui), left: 0, top: 0 },
    { input: ctaLayer, left: 40, top: ctaY }
  ]).png().toFile(path.join(ROOT, 'reference-assets/ui-reference/home.png'));
  console.log('OK reference-assets/ui-reference/home.png');
})();
