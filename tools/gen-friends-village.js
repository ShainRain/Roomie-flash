// Roomie 好友夜景村落生成器:多个微型等距小屋(暖房+暖光小窗),透明底 828×828
// 配色对齐房间母版 room-hero.webp:米白墙 #F7F3EA 系 / 胡桃木 #7B5030 系 / 暖窗 #FFD9A0 / 琥珀 #F5B83D
// 输出:miniprogram/assets/img/friends-village.webp
// 运行:node tools/gen-friends-village.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT_IMG = path.join(__dirname, '..', 'miniprogram', 'assets', 'img');

// 微型等距小屋:锚点 (cx, cy)=地板左角(近端左顶点),s=缩放
// 地板菱形:(cx,cy) 左角 → (cx+dx,cy+dy) 下角 → (cx+2dx,cy) 右角 → (cx+dx,cy-dy) 上角
// 左墙:左角-下角向上抬 wh;右墙:下角-右角向上抬 wh
function miniRoom(cx, cy, s, opts = {}) {
  const dx = 96 * s;
  const dy = 50 * s;
  const wh = 104 * s;
  const wallL = opts.wallL || '#F7F3EA';
  const wallR = opts.wallR || '#E9E1D0';
  const g = [];

  const LX = cx, LY = cy;                    // 左角
  const BX = cx + dx, BY = cy + dy;          // 下角(最前)
  const RX = cx + 2 * dx, RY = cy;           // 右角
  const TX = cx + dx, TY = cy - dy;          // 上角(最后)

  // 地面接触阴影(紧贴地板下方)
  g.push(`<ellipse cx="${BX}" cy="${BY + 6 * s}" rx="${dx * 1.08}" ry="${dy * 0.4}" fill="#070D18" opacity=".42"/>`);

  // 左墙(角平分向左上的平行四边形)
  g.push(`<path d="M${LX} ${LY} L${BX} ${BY} L${BX} ${BY - wh} L${LX} ${LY - wh} Z" fill="${wallL}"/>`);
  // 右墙
  g.push(`<path d="M${BX} ${BY} L${RX} ${RY} L${RX} ${RY - wh} L${BX} ${BY - wh} Z" fill="${wallR}"/>`);
  // 顶沿(墙顶收口)
  g.push(`<path d="M${LX} ${LY - wh} L${BX} ${BY - wh} L${RX} ${RY - wh} L${TX} ${TY - wh} Z" fill="#FBF8F1"/>`);
  // 地板(胡桃木)
  g.push(`<path d="M${LX} ${LY} L${BX} ${BY} L${RX} ${RY} L${TX} ${TY} Z" fill="#7B5030"/>`);
  g.push(`<path d="M${LX} ${LY} L${BX} ${BY} L${TX} ${TY} Z" fill="#4A2E1D" opacity=".38"/>`);
  // 地板板缝
  g.push(`<path d="M${LX + dx * 0.5} ${LY + dy * 0.5} L${TX + dx * 0.5} ${TY + dy * 0.5}" stroke="#4A2E1D" stroke-width="${1.6 * s}" opacity=".5"/>`);
  g.push(`<path d="M${TX - dx * 0.5 + dx} ${TY + dy * 0.5} L${BX} ${BY - dy * 0.0}" stroke="#4A2E1D" stroke-width="${1.6 * s}" opacity=".3"/>`);

  // ---- 左墙细节:墙面上沿斜率 dy/dx 分布(从左角到下角) ----
  const lwPt = (t, up) => [LX + (BX - LX) * t, LY + (BY - LY) * t - up]; // t∈0..1 沿墙底边,up=向上偏移
  // 两层胡桃木层板
  [0.42, 0.68].forEach((h) => {
    const [x0, y0] = lwPt(0.08, wh * h);
    const [x1, y1] = lwPt(0.88, wh * h);
    g.push(`<path d="M${x0} ${y0} L${x1} ${y1}" stroke="#4A2E1D" stroke-width="${5 * s}" stroke-linecap="round"/>`);
  });
  // 层板上的唱片:封套(方块)/黑胶(圆)交替,沿层板斜线站好
  const recColors = ['#3B4A6B', '#C9603C', '#3B6B4F', '#C9A24B'];
  [0.42, 0.68].forEach((h, row) => {
    for (let i = 0; i < 4; i += 1) {
      const t = 0.14 + i * 0.2;
      const [x, y] = lwPt(t, wh * h + 3 * s);
      if ((i + row) % 2 === 0) {
        g.push(`<rect x="${x - 4.5 * s}" y="${y - 13 * s}" width="${9 * s}" height="${13 * s}" fill="${recColors[(i + row) % 4]}"/>`);
      } else {
        g.push(`<circle cx="${x}" cy="${y - 7 * s}" r="${6 * s}" fill="#10161F"/><circle cx="${x}" cy="${y - 7 * s}" r="${2 * s}" fill="${recColors[(i + row) % 4]}"/>`);
      }
    }
  });
  // ROOMIE 小灯箱(琥珀)
  {
    const [x, y] = lwPt(0.12, wh * 0.9);
    g.push(`<rect x="${x}" y="${y - 6 * s}" width="${36 * s}" height="${13 * s}" rx="${3 * s}" fill="#F5B83D"/>`);
    g.push(`<rect x="${x + 5 * s}" y="${y - 1.5 * s}" width="${22 * s}" height="${3.5 * s}" rx="${1.5 * s}" fill="#4A2E1D"/>`);
  }

  // ---- 右墙细节:夜景小窗 ----
  const rwPt = (t, up) => [BX + (RX - BX) * t, BY + (RY - BY) * t - up];
  {
    const [x0, y0] = rwPt(0.16, wh * 0.34);
    const [x1, y1] = rwPt(0.84, wh * 0.34);
    const hgt = 40 * s;
    g.push(`<path d="M${x0} ${y0} L${x1} ${y1} L${x1} ${y1 - hgt} L${x0} ${y0 - hgt} Z" fill="#223C5C" stroke="#2B1A12" stroke-width="${3 * s}"/>`);
    // 月亮
    const [mx, my] = rwPt(0.62, wh * 0.34 + 22 * s);
    g.push(`<circle cx="${mx}" cy="${my}" r="${4.5 * s}" fill="#FFE9B0"/>`);
    // 城市剪影(窗底一排方块)
    for (let i = 0; i < 5; i += 1) {
      const t = 0.2 + i * 0.13;
      const [bx, by] = rwPt(t, wh * 0.34 + 2 * s);
      const bh = (6 + (i * 37) % 9) * s;
      g.push(`<rect x="${bx - 3.5 * s}" y="${by - bh}" width="${7 * s}" height="${bh}" fill="#0B1320"/>`);
    }
    // 亮窗(2700K 暖光)
    const [wxd, wyd] = rwPt(0.33, wh * 0.34 + 8 * s);
    g.push(`<rect x="${wxd}" y="${wyd - 4 * s}" width="${1.8 * s}" height="${2.4 * s}" fill="#FFD9A0"/>`);
  }
  // 右墙小海报
  {
    const [x, y] = rwPt(0.2, wh * 0.78);
    g.push(`<rect x="${x}" y="${y - 16 * s}" width="${12 * s}" height="${16 * s}" fill="#C9603C" stroke="#4A2E1D" stroke-width="${1.5 * s}"/>`);
  }

  // ---- 地面小物 ----
  // 绿植
  g.push(`<rect x="${LX + dx * 0.42}" y="${LY + dy * 0.28}" width="${11 * s}" height="${8 * s}" rx="${2 * s}" fill="#A96038"/>`);
  g.push(`<circle cx="${LX + dx * 0.42 + 2 * s}" cy="${LY + dy * 0.24}" r="${5.5 * s}" fill="#2F5A38"/>`);
  g.push(`<circle cx="${LX + dx * 0.42 + 8 * s}" cy="${LY + dy * 0.2}" r="${4.5 * s}" fill="#3E7048"/>`);
  // 落地灯(右后侧)+ 暖光晕
  g.push(`<circle cx="${RX - dx * 0.28}" cy="${RY - dy * 0.5}" r="${11 * s}" fill="#FFD9A0" opacity=".3"/>`);
  g.push(`<circle cx="${RX - dx * 0.28}" cy="${RY - dy * 0.5}" r="${3.5 * s}" fill="#FFE9A8"/>`);
  g.push(`<path d="M${RX - dx * 0.28} ${RY - dy * 0.44} L${RX - dx * 0.28} ${RY + dy * 0.05}" stroke="#2A2620" stroke-width="${2.5 * s}"/>`);
  // 地面唱片
  g.push(`<ellipse cx="${BX - dx * 0.1}" cy="${BY - dy * 0.32}" rx="${9 * s}" ry="${4 * s}" fill="#10161F"/>`);
  g.push(`<circle cx="${BX - dx * 0.1}" cy="${BY - dy * 0.32}" r="${1.6 * s}" fill="#C9603C"/>`);

  // 屋内 2700K 暖光洗
  g.push(`<ellipse cx="${BX}" cy="${BY - wh * 0.35}" rx="${dx * 0.85}" ry="${wh * 0.5}" fill="#FFD9A0" opacity=".1"/>`);

  return `<g>${g.join('')}</g>`;
}

const STARS = [
  [70, 90, 2.2, .8], [180, 48, 1.5, .6], [320, 70, 1.8, .7], [520, 42, 2, .8],
  [680, 66, 1.6, .7], [770, 140, 2.2, .8], [46, 260, 1.6, .6], [792, 330, 1.5, .6],
  [60, 560, 1.8, .6], [780, 610, 1.6, .5], [120, 740, 1.5, .5], [700, 760, 1.8, .5]
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="828" height="828" viewBox="0 0 828 828">
${STARS.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF6D8" opacity="${o}"/>`).join('')}
<circle cx="712" cy="96" r="46" fill="#FFE9B0" opacity=".18"/><circle cx="712" cy="96" r="20" fill="#FFE9B0"/>
${miniRoom(250, 300, 1.06)}
${miniRoom(80, 470, 0.78, { wallL: '#F3EEE2', wallR: '#E3DCC9' })}
${miniRoom(500, 460, 0.88, { wallL: '#F7F3EA', wallR: '#DFD7C2' })}
${miniRoom(270, 600, 1.0, { wallL: '#F5F0E5', wallR: '#E9E1D0' })}
</svg>`;

(async () => {
  fs.mkdirSync(OUT_IMG, { recursive: true });
  const out = path.join(OUT_IMG, 'friends-village.webp');
  await sharp(Buffer.from(svg), { density: 72 }).webp({ quality: 86 }).toFile(out);
  console.log(`OK friends-village.webp ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
})();
