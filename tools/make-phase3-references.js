// 生成 ui-reference/duo.png + architect.png(从 Room Master 派生的验收基准)
// 运行: node tools/make-phase3-references.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const W = 780;
const H = 1688;
const C = {
  night950: '#08111D', night900: '#0E1A29', night850: '#162537',
  nightText: '#F4EFE4', nightSub: '#93A0B1',
  paper100: '#F7F1E4', ink900: '#26221A', ink500: '#8A8578',
  green: '#2BC96B', amber: '#E9A942', danger: '#E2604C', line: '#E3D9C2'
};
const F = 'font-family="Microsoft YaHei, Verdana, sans-serif"';
const layer = (svg) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg}</svg>`)).png().toBuffer();

async function build() {
  const master = await sharp(path.join(ROOT, 'visual-validation/rendered/room-master.png')).png().toBuffer();

  // ================= DUO =================
  // 顶栏 + 刊头(双人同频/DUO + 同频 pill) + 大场景(~56%) + 共享播放卡 + 退出
  {
    const heroSize = Math.round(H * 0.60);
    const heroVisH = Math.round(H * 0.56);
    const heroY = Math.round(H * 0.16);
    const hero = await sharp(master).resize(heroSize, heroSize)
      .extract({ left: Math.round((heroSize - W) / 2), top: Math.round((heroSize - heroVisH) / 2), width: W, height: heroVisH }).png().toBuffer();
    const cardY = heroY + heroVisH - 46;
    const ui = `
      <text x="40" y="96" ${F} font-size="46" font-weight="700" fill="${C.nightText}">双人同频</text>
      <text x="40" y="126" ${F} font-size="18" fill="${C.nightSub}">DUO</text>
      <rect x="${W - 250}" y="66" width="210" height="52" rx="26" fill="${C.green}"/>
      <text x="${W - 145}" y="100" ${F} font-size="21" font-weight="700" fill="#FFF" text-anchor="middle">◉ 同频中 · 96%</text>
      <g>
        <rect x="40" y="${cardY}" width="${W - 80}" height="240" rx="28" fill="${C.paper100}"/>
        <text x="76" y="${cardY + 58}" ${F} font-size="26" font-weight="700" fill="${C.ink900}">与 KIKI 一起听</text>
        <text x="76" y="${cardY + 92}" ${F} font-size="19" font-weight="600" fill="#1FA75A">同频中 · 96%</text>
        <rect x="76" y="${cardY + 112}" width="${W - 152}" height="2" fill="${C.line}"/>
        <circle cx="130" cy="${cardY + 178}" r="34" fill="#23262B"/><circle cx="130" cy="${cardY + 178}" r="12" fill="${C.amber}"/>
        <text x="186" y="${cardY + 172}" ${F} font-size="23" font-weight="700" fill="${C.ink900}">晴天</text>
        <text x="186" y="${cardY + 202}" ${F} font-size="17" fill="${C.ink500}">歌单由 MOMO 控制</text>
        <circle cx="${W - 110}" cy="${cardY + 178}" r="30" fill="${C.green}"/>
        <rect x="${W - 121}" y="${cardY + 166}" width="7" height="24" rx="3.5" fill="#FFF"/><rect x="${W - 108}" y="${cardY + 166}" width="7" height="24" rx="3.5" fill="#FFF"/>
      </g>
      <rect x="40" y="${cardY + 268}" width="${W - 80}" height="88" rx="44" fill="none" stroke="${C.danger}" stroke-width="2.5"/>
      <text x="${W / 2}" y="${cardY + 322}" ${F} font-size="24" font-weight="600" fill="${C.danger}" text-anchor="middle">退出双人房</text>`;
    await sharp({ create: { width: W, height: H, channels: 4, background: C.night950 } })
      .composite([{ input: hero, left: 0, top: heroY }, { input: await layer(ui), left: 0, top: 0 }])
      .png().toFile(path.join(ROOT, 'reference-assets/ui-reference/duo.png'));
    console.log('OK ui-reference/duo.png');
  }

  // ================= ARCHITECT =================
  // 刊头(建筑师模式 + 保存) + 正方形 Master 预览 + 工作台 sheet(家具网格=真实缩略图)
  {
    const prevY = Math.round(H * 0.145);
    const prevSide = W - 80;
    const preview = await sharp(master).resize(prevSide, prevSide).png().toBuffer();
    const sheetY = prevY + prevSide - 60;
    const keys = ['sofa', 'vinyl-player', 'cat-bed', 'lamp', 'plant', 'rug', 'curtain', 'projector', 'poster', 'coffee', 'bookshelf', 'doll', 'guitar'];
    const names = ['沙发', '黑胶机', '猫窝', '落地灯', '绿植', '地毯', '挂帘', '放映机', '海报', '咖啡机', '书架', '玩偶', '吉他角'];
    const tiles = [];
    const cellW = (W - 80 - 30) / 4;
    for (let i = 0; i < keys.length; i++) {
      const cx = 40 + 18 + (i % 4) * (cellW + 10);
      const cy = sheetY + 128 + Math.floor(i / 4) * 224;
      tiles.push({ input: await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(cellW)}" height="224"><rect width="${Math.round(cellW)}" height="216" rx="16" fill="#EFE8D8" stroke="${C.green}" stroke-width="2.5"/><text x="${Math.round(cellW / 2)}" y="186" ${F} font-size="19" fill="${C.ink500}" text-anchor="middle">${names[i]}</text><circle cx="${Math.round(cellW) - 18}" cy="20" r="13" fill="${C.green}"/><text x="${Math.round(cellW) - 18}" y="27" ${F} font-size="17" font-weight="700" fill="#FFF" text-anchor="middle">✓</text></svg>`)).png().toBuffer(), left: Math.round(cx - 9), top: cy });
      tiles.push({ input: await sharp(path.join(ROOT, 'miniprogram/assets/img/room', `furn-thumb-${keys[i]}.webp`)).resize(96, 96).png().toBuffer(), left: Math.round(cx + (cellW - 96) / 2 - 9), top: cy + 18 });
    }
    const ui = `
      <text x="40" y="96" ${F} font-size="46" font-weight="700" fill="${C.nightText}">建筑师模式</text>
      <text x="40" y="126" ${F} font-size="18" fill="${C.nightSub}">ARCHITECT STUDIO</text>
      <rect x="${W - 196}" y="66" width="156" height="52" rx="26" fill="#DFF5E9"/>
      <text x="${W - 118}" y="100" ${F} font-size="21" font-weight="700" fill="#1FA75A" text-anchor="middle">已保存</text>
      <rect x="40" y="${prevY}" width="${prevSide}" height="${prevSide}" rx="22" fill="none" stroke="rgba(244,239,228,.14)" stroke-width="2"/>
      <rect x="60" y="${prevY + prevSide - 92}" width="196" height="46" rx="23" fill="${C.green}"/>
      <text x="158" y="${prevY + prevSide - 62}" ${F} font-size="20" font-weight="700" fill="#FFF" text-anchor="middle">正在播放 · 晴天</text>
      <rect x="24" y="${sheetY}" width="${W - 48}" height="${H - sheetY - 40}" rx="30" fill="${C.paper100}"/>
      <rect x="${W / 2 - 36}" y="${sheetY + 16}" width="72" height="8" rx="4" fill="${C.line}"/>
      <text x="70" y="${sheetY + 74}" ${F} font-size="24" font-weight="700" fill="${C.ink900}">家具</text>
      <text x="196" y="${sheetY + 74}" ${F} font-size="24" fill="${C.ink500}">地板</text>
      <text x="322" y="${sheetY + 74}" ${F} font-size="24" fill="${C.ink500}">灯光</text>
      <rect x="70" y="${sheetY + 88}" width="48" height="6" rx="3" fill="${C.green}"/>`;
    await sharp({ create: { width: W, height: H, channels: 4, background: C.night950 } })
      .composite([
        { input: preview, left: 40, top: prevY },
        { input: await layer(ui), left: 0, top: 0 },
        ...tiles
      ])
      .png().toFile(path.join(ROOT, 'reference-assets/ui-reference/architect.png'));
    console.log('OK ui-reference/architect.png');
  }
}

build().catch((e) => { console.error(e); process.exit(1); });
