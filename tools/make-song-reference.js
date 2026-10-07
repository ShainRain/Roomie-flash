// 生成 reference-assets/ui-reference/song.png(按 song-reference-spec.md + Master 资产合成)
// 运行: node tools/make-song-reference.js
const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const W = 780;
const H = 1688;
const C = {
  night950: '#08111D', nightText: '#F4EFE4', nightSub: '#93A0B1',
  paper100: '#F7F1E4', ink900: '#26221A', ink500: '#8A8578', green: '#2BC96B', line: '#E3D9C2'
};
const F = 'font-family="Microsoft YaHei, Verdana, sans-serif"';
const layer = (svg) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`)).png().toBuffer();

(async () => {
  const heroY = 150;
  const heroH = 640;
  const bg = await sharp(path.join(ROOT, 'miniprogram/assets/img/song-hifi-bg.webp'))
    .resize(W, Math.round(W * 549 / 828)).png().toBuffer();
  const sleeve = await sharp(path.join(ROOT, 'miniprogram/assets/img/song-sleeve-sunny.webp'))
    .resize(300, 300).rotate(-7, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const disc = await sharp(path.join(ROOT, 'miniprogram/assets/img/song-disc.webp'))
    .resize(320, 320).png().toBuffer();

  const cardY = heroY + heroH - 70;
  const ui = `
    <text x="${W / 2}" y="86" ${F} font-size="22" font-weight="700" letter-spacing="4" fill="${C.nightText}" text-anchor="middle">ROOMIE</text>
    <text x="${W / 2}" y="116" ${F} font-size="16" fill="${C.nightSub}" text-anchor="middle">从放映室取出一张唱片</text>
    <rect x="0" y="${heroY}" width="${W}" height="120" fill="rgba(8,17,29,.45)"/>
    <rect x="0" y="${heroY + heroH - 120}" width="${W}" height="120" fill="rgba(8,17,29,.5)"/>

    <!-- 歌曲身份 + 进度 + 控制 + 歌词(米白纸卡) -->
    <rect x="40" y="${cardY}" width="${W - 80}" height="${H - cardY - 60}" rx="28" fill="${C.paper100}"/>
    <text x="80" y="${cardY + 56}" ${F} font-size="15" letter-spacing="4" fill="${C.ink500}">NOW SPINNING</text>
    <text x="80" y="${cardY + 106}" ${F} font-size="38" font-weight="700" fill="${C.ink900}">晴天</text>
    <text x="80" y="${cardY + 142}" ${F} font-size="19" fill="${C.ink500}">周杰伦 · MOMO 的收藏</text>
    <rect x="${W - 190}" y="${cardY + 36}" width="110" height="44" rx="22" fill="#DFF5E9"/>
    <text x="${W - 135}" y="${cardY + 65}" ${F} font-size="19" font-weight="700" fill="#1FA75A" text-anchor="middle">收藏中</text>

    <text x="80" y="${cardY + 204}" ${F} font-size="17" fill="${C.ink500}">2:14</text>
    <rect x="140" y="${cardY + 198}" width="${W - 320}" height="6" rx="3" fill="${C.line}"/>
    <rect x="140" y="${cardY + 198}" width="${Math.round((W - 320) * 0.5)}" height="6" rx="3" fill="${C.green}"/>
    <circle cx="${140 + Math.round((W - 320) * 0.5)}" cy="${cardY + 201}" r="10" fill="#FFF" stroke="${C.green}" stroke-width="3"/>
    <text x="${W - 126}" y="${cardY + 204}" ${F} font-size="17" fill="${C.ink500}" text-anchor="end">4:29</text>

    <circle cx="${W / 2}" cy="${cardY + 300}" r="44" fill="${C.green}"/>
    <path d="M${W / 2 - 12} ${cardY + 280} L${W / 2 - 12} ${cardY + 320} L${W / 2 + 20} ${cardY + 300}Z" fill="#FFF"/>
    <text x="${W / 2 - 150}" y="${cardY + 312}" ${F} font-size="30" fill="${C.ink500}" text-anchor="middle">|◂</text>
    <text x="${W / 2 + 150}" y="${cardY + 312}" ${F} font-size="30" fill="${C.ink500}" text-anchor="middle">▸|</text>
    <text x="${W / 2 - 270}" y="${cardY + 312}" ${F} font-size="26" fill="${C.ink500}" text-anchor="middle">⤨</text>
    <text x="${W / 2 + 270}" y="${cardY + 312}" ${F} font-size="26" fill="${C.ink500}" text-anchor="middle">↻</text>

    <text x="${W / 2 - 60}" y="${cardY + 396}" ${F} font-size="22" font-weight="700" fill="${C.ink900}" text-anchor="middle">歌词</text>
    <rect x="${W / 2 - 84}" y="${cardY + 408}" width="48" height="6" rx="3" fill="${C.green}"/>
    <text x="${W / 2 + 60}" y="${cardY + 396}" ${F} font-size="22" fill="${C.ink500}" text-anchor="middle">评论</text>

    <text x="${W / 2}" y="${cardY + 470}" ${F} font-size="23" font-weight="700" fill="#1FA75A" text-anchor="middle">我想起花瓣 试着掉落</text>
    <text x="${W / 2}" y="${cardY + 530}" ${F} font-size="21" fill="${C.ink500}" text-anchor="middle">为你翘课的那一天 花落的那一天</text>
    <text x="${W / 2}" y="${cardY + 586}" ${F} font-size="21" fill="${C.ink500}" text-anchor="middle">教室的那一间 我怎么看不见</text>
    <text x="${W / 2}" y="${cardY + 642}" ${F} font-size="21" fill="${C.ink500}" text-anchor="middle">消失的下雨天 我好想再淋一遍</text>`;

  await sharp({ create: { width: W, height: H, channels: 4, background: C.night950 } })
    .composite([
      { input: bg, left: 0, top: heroY },
      { input: sleeve, left: 74, top: heroY + 190 },
      { input: disc, left: W - 74 - 320, top: heroY + 220 },
      { input: await layer(ui), left: 0, top: 0 }
    ])
    .png().toFile(path.join(ROOT, 'reference-assets/ui-reference/song.png'));
  console.log('OK ui-reference/song.png');
})();
