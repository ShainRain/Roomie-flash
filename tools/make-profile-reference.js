// 生成 reference-assets/ui-reference/profile.png(按 profile-reference-spec.md 合成)
// 运行: node tools/make-profile-reference.js
const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const W = 780;
const H = 1688;
const C = {
  night950: '#08111D', night900: '#0E1A29', nightText: '#F4EFE4', nightSub: '#93A0B1',
  paper100: '#F7F1E4', ink900: '#26221A', ink500: '#8A8578', green: '#2BC96B', amber: '#E9A942', line: '#E3D9C2'
};
const F = 'font-family="Microsoft YaHei, Verdana, sans-serif"';
const layer = (svg) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`)).png().toBuffer();

(async () => {
  const heroH = Math.round(H * 0.36);
  const hero = await sharp(path.join(ROOT, 'miniprogram/assets/img/vignette-momo.webp'))
    .resize(W, Math.round(W * 600 / 768)).extract({ left: 0, top: 0, width: W, height: heroH }).png().toBuffer();

  const cardY = heroH + 108 - 56;
  const gridY = cardY + 132;
  const cellW = (W - 80 - 56 - 24 * 3) / 4;
  const covers = [];
  const picks = [1, 2, 3, 5, 8, 19];
  for (let i = 0; i < 8; i++) {
    const id = [1, 2, 3, 5, 8, 19, 7, 11][i];
    const x = 68 + (i % 4) * (cellW + 24);
    const y = gridY + Math.floor(i / 4) * (cellW + 46);
    covers.push({ input: await sharp(path.join(ROOT, `miniprogram/assets/img/cover-${id}.webp`)).resize(Math.round(cellW), Math.round(cellW)).png().toBuffer(), left: Math.round(x), top: y });
    if (picks.includes(id)) {
      covers.push({ input: await layer(`<circle cx="${Math.round(x + cellW - 16)}" cy="${y + 16}" r="14" fill="${C.green}"/><text x="${Math.round(x + cellW - 16)}" y="${y + 23}" ${F} font-size="18" font-weight="700" fill="#FFF" text-anchor="middle">✓</text>`), left: 0, top: 0 });
    }
  }

  const ui = `
    <text x="40" y="80" ${F} font-size="20" font-weight="700" letter-spacing="6" fill="${C.nightSub}">ROOMIE</text>
    <text x="40" y="130" ${F} font-size="40" font-weight="700" fill="${C.nightText}">我的放映室</text>
    <text x="228" y="132" ${F} font-size="15" fill="${C.nightSub}" letter-spacing="2">MY ROOM</text>
    <circle cx="${W - 60}" cy="110" r="26" fill="#162537"/>
    <text x="${W - 60}" y="120" ${F} font-size="24" fill="${C.nightSub}" text-anchor="middle">⚙</text>

    <!-- Hero 身份浮层 -->
    <rect x="40" y="${heroH - 66}" width="360" height="64" rx="32" fill="rgba(8,17,29,.78)"/>
    <text x="72" y="${heroH - 24}" ${F} font-size="28" font-weight="700" fill="${C.nightText}">MOMO</text>
    <rect x="196" y="${heroH - 54}" width="86" height="40" rx="20" fill="#162537"/>
    <text x="239" y="${heroH - 27}" ${F} font-size="19" font-weight="700" fill="${C.nightText}" text-anchor="middle">Lv.7</text>
    <rect x="294" y="${heroH - 54}" width="100" height="40" rx="20" fill="#FBF0D8"/>
    <text x="344" y="${heroH - 27}" ${F} font-size="19" font-weight="700" fill="${C.amber}" text-anchor="middle">建筑师</text>
    <rect x="${W - 40 - 210}" y="${heroH - 66}" width="210" height="64" rx="32" fill="rgba(8,17,29,.78)"/>
    <text x="${W - 40 - 105}" y="${heroH - 24}" ${F} font-size="20" fill="${C.nightText}" text-anchor="middle">深夜放映室 · 0731</text>

    <!-- 唱片收藏纸卡 -->
    <rect x="40" y="${cardY}" width="${W - 80}" height="${gridY + 2 * (cellW + 46) + 168 - cardY}" rx="26" fill="${C.paper100}"/>
    <text x="68" y="${cardY + 52}" ${F} font-size="24" font-weight="700" fill="${C.ink900}">我的唱片墙</text>
    <text x="${W - 68}" y="${cardY + 52}" ${F} font-size="19" fill="${C.ink500}" text-anchor="end">已选 6 / 12</text>
    <text x="68" y="${cardY + 88}" ${F} font-size="17" fill="${C.ink500}">从收藏的 24 张唱片中挑选,挂在房间的墙上</text>
    <rect x="68" y="${gridY + 2 * (cellW + 46) + 26}" width="${W - 136}" height="80" rx="40" fill="${C.green}"/>
    <text x="${W / 2}" y="${gridY + 2 * (cellW + 46) + 76}" ${F} font-size="23" font-weight="700" fill="#FFF" text-anchor="middle">保存布置</text>

    <!-- 成就 + 房间档案 -->
    <text x="40" y="${H - 330}" ${F} font-size="24" font-weight="700" fill="${C.nightText}">我的成就</text>
    ${[['♪', '新晋达人', '#F0A93C', 3], ['⚒', '建筑师傅', '#8A5A33', 4], ['✦', '愈音之友', '#3B4A6B', 2]].map(([g, n, c, lv], i) => `
      <rect x="${40 + i * 176}" y="${H - 300}" width="164" height="92" rx="18" fill="#162537"/>
      <circle cx="${40 + i * 176 + 34}" cy="${H - 254}" r="20" fill="${c}"/>
      <text x="${40 + i * 176 + 34}" y="${H - 246}" ${F} font-size="20" fill="#FFF" text-anchor="middle">${g}</text>
      <text x="${40 + i * 176 + 64}" y="${H - 262}" ${F} font-size="18" font-weight="700" fill="${C.nightText}">${n}</text>
      <text x="${40 + i * 176 + 64}" y="${H - 236}" ${F} font-size="15" fill="${C.nightSub}">Lv.${lv}</text>`).join('')}

    <rect x="0" y="${H - 128}" width="${W}" height="128" fill="${C.night900}"/>
    ${['房间', '好友', '消息', '我'].map((t, i) => `<text x="${[78, 234, 546, 702][i]}" y="${H - 52}" ${F} font-size="20" fill="${i === 3 ? C.green : C.nightSub}" text-anchor="middle">${t}</text>`).join('')}
    <circle cx="${W / 2}" cy="${H - 148}" r="42" fill="${C.green}"/>
    <text x="${W / 2}" y="${H - 132}" ${F} font-size="44" font-weight="300" fill="#FFF" text-anchor="middle">+</text>`;

  await sharp({ create: { width: W, height: H, channels: 4, background: C.night950 } })
    .composite([{ input: hero, left: 0, top: 158 }, { input: await layer(ui), left: 0, top: 0 }, ...covers])
    .png().toFile(path.join(ROOT, 'reference-assets/ui-reference/profile.png'));
  console.log('OK ui-reference/profile.png');
})();
