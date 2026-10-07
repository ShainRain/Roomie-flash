// 生成 reference-assets/ui-reference/friends.png(从 Master vignette 派生的验收基准)
// 运行: node tools/make-friends-reference.js
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
  const online = [
    { name: 'KIKI', img: 'vignette-kiki.webp', status: '在你的房间 · 一起听《晴天》' },
    { name: 'NANA', img: 'vignette-nana.webp', status: '正在听《晴天》' },
    { name: 'ABO', img: 'vignette-abo.webp', status: '正在逛唱片墙' }
  ];
  const tiles = [];
  const cardW = 232;
  const cardH = 316;
  const rowY = 258;
  for (let i = 0; i < online.length; i++) {
    const x = 40 + i * (cardW + 18);
    tiles.push({
      input: await sharp(path.join(ROOT, 'miniprogram/assets/img', online[i].img)).resize(cardW, 218).png().toBuffer(),
      left: x, top: rowY
    });
    tiles.push({ input: await layer(`
      <rect x="${x}" y="${rowY}" width="${cardW}" height="${cardH}" rx="22" fill="none" stroke="rgba(244,239,228,.14)" stroke-width="2"/>
      <rect x="${x}" y="${rowY + 208}" width="${cardW}" height="108" rx="0" fill="rgba(8,17,29,.78)"/>
      <circle cx="${x + 30}" cy="${rowY + 244}" r="7" fill="${C.green}"/>
      <text x="${x + 48}" y="${rowY + 252}" ${F} font-size="22" font-weight="700" fill="${C.nightText}">${online[i].name}</text>
      <text x="${x + 20}" y="${rowY + 288}" ${F} font-size="16" fill="${C.nightSub}">${online[i].status}</text>
      <rect x="${x + cardW - 108}" y="${rowY + 228}" width="92" height="42" rx="21" fill="${C.green}"/>
      <text x="${x + cardW - 62}" y="${rowY + 256}" ${F} font-size="19" font-weight="700" fill="#FFF" text-anchor="middle">来坐坐</text>`), left: 0, top: 0 });
  }

  const listRow = (x, y, name, color, status, action, dim) => `
    <circle cx="${x + 26}" cy="${y}" r="26" fill="${color}"/>
    <text x="${x + 26}" y="${y + 8}" ${F} font-size="22" font-weight="700" fill="#FFF" text-anchor="middle">${name[0]}</text>
    ${dim ? '' : `<circle cx="${x + 44}" cy="${y - 18}" r="7" fill="${C.green}"/>`}
    <text x="${x + 66}" y="${y - 2}" ${F} font-size="22" font-weight="700" fill="${C.ink900}" opacity="${dim ? 0.55 : 1}">${name}</text>
    <text x="${x + 66}" y="${y + 26}" ${F} font-size="17" fill="${C.ink500}">${status}</text>
    <rect x="${W - 40 - 40 - 110}" y="${y - 24}" width="110" height="48" rx="24" fill="${dim ? 'none' : C.green}" stroke="${dim ? C.green : 'none'}" stroke-width="2"/>
    <text x="${W - 40 - 40 - 55}" y="${y + 6}" ${F} font-size="19" font-weight="700" fill="${dim ? C.green : '#FFF'}" text-anchor="middle">${action}</text>`;

  const ui = `
    <text x="40" y="80" ${F} font-size="20" font-weight="700" letter-spacing="6" fill="${C.nightSub}">ROOMIE</text>
    <text x="40" y="140" ${F} font-size="42" font-weight="700" fill="${C.nightText}">好友</text>
    <text x="120" y="142" ${F} font-size="16" fill="${C.nightSub}" letter-spacing="3">FRIENDS</text>
    <text x="40" y="196" ${F} font-size="20" fill="${C.nightSub}">夜里,每个朋友都住在自己的小房间里。</text>

    <text x="40" y="${rowY + cardH + 66}" ${F} font-size="24" font-weight="700" fill="${C.nightText}">在线 · 3</text>
    <rect x="40" y="${rowY + cardH + 88}" width="${W - 80}" height="300" rx="26" fill="${C.paper100}"/>
    ${listRow(60, rowY + cardH + 158, 'KIKI', '#F5C04A', '在你的房间 · 一起听《晴天》', '进入', false)}
    ${listRow(60, rowY + cardH + 246, 'NANA', '#7FB5E8', '正在听《晴天》', '来坐坐', false)}
    ${listRow(60, rowY + cardH + 334, 'ABO', '#E8734A', '正在逛唱片墙', '来坐坐', false)}

    <text x="40" y="${rowY + cardH + 460}" ${F} font-size="24" font-weight="700" fill="${C.nightText}">离线 · 2</text>
    <rect x="40" y="${rowY + cardH + 482}" width="${W - 80}" height="212" rx="26" fill="${C.paper100}" opacity="0.72"/>
    ${listRow(60, rowY + cardH + 552, 'RITA', '#C9CDD4', '2 小时前听过《花海》', '邀请', true)}
    ${listRow(60, rowY + cardH + 640, 'TAO', '#C9CDD4', '昨天布置了唱片墙', '邀请', true)}

    <rect x="40" y="${H - 268}" width="${W - 80}" height="92" rx="46" fill="${C.green}"/>
    <text x="${W / 2}" y="${H - 212}" ${F} font-size="25" font-weight="700" fill="#FFF" text-anchor="middle">邀请好友进房间</text>
    <rect x="0" y="${H - 128}" width="${W}" height="128" fill="${C.night900}"/>
    ${['房间', '好友', '消息', '我'].map((t, i) => `<text x="${[78, 234, 546, 702][i]}" y="${H - 52}" ${F} font-size="20" fill="${i === 1 ? C.green : C.nightSub}" text-anchor="middle">${t}</text>`).join('')}
    <circle cx="${W / 2}" cy="${H - 148}" r="42" fill="${C.green}"/>
    <text x="${W / 2}" y="${H - 132}" ${F} font-size="44" font-weight="300" fill="#FFF" text-anchor="middle">+</text>`;

  await sharp({ create: { width: W, height: H, channels: 4, background: C.night950 } })
    .composite([...tiles, { input: await layer(ui), left: 0, top: 0 }])
    .png().toFile(path.join(ROOT, 'reference-assets/ui-reference/friends.png'));
  console.log('OK ui-reference/friends.png');
})();
