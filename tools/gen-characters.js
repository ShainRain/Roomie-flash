// Roomie 角色精灵生成器(原创 Q 版团子):手写 SVG → sharp 栅格化为 webp
// 角色:MOMO(橙色圆团子)、KIKI(黄色团子);姿态:idle / walk-a / walk-b / sit
// 统一 144×184 viewBox,脚底带深色接触阴影(适配深色木地板),右向为准,左向由 CSS scaleX(-1) 翻转
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'miniprogram', 'assets', 'img');
const SVG_OUT = path.join(__dirname, '..', 'figma-assets');

const CHARACTERS = {
  momo: { body: '#F2994A', bodyDark: '#D17F33', belly: '#FBD9A8', cheek: '#E8703A', extra: 'tuft' },
  kiki: { body: '#F5C04A', bodyDark: '#D9A02E', belly: '#FBE4B0', cheek: '#F2994A', extra: 'sprout' }
};

function charSVG(c, pose) {
  const isSit = pose === 'sit';
  const tilt = pose === 'walk-a' ? -3 : pose === 'walk-b' ? 3 : 0;
  // 身体中心:idle/walk 站立,sit 下沉并略扁
  const cx = 72;
  const cy = isSit ? 122 : 104;
  const rx = isSit ? 48 : 46;
  const ry = isSit ? 44 : 50;

  // 脚底接触阴影(深色,不抢戏)
  const shadow = `<ellipse cx="${cx}" cy="${isSit ? 170 : 168}" rx="34" ry="8" fill="#140C06" opacity="0.28"/>`;

  // 脚:idle 并拢,walk 前后交替,sit 向前平伸
  let feet = '';
  if (pose === 'idle') {
    feet = `<ellipse cx="${cx - 14}" cy="160" rx="11" ry="6" fill="${c.bodyDark}"/>
            <ellipse cx="${cx + 14}" cy="160" rx="11" ry="6" fill="${c.bodyDark}"/>`;
  } else if (pose === 'walk-a') {
    feet = `<ellipse cx="${cx - 22}" cy="158" rx="11" ry="6" fill="${c.bodyDark}" transform="rotate(-10 ${cx - 22} 158)"/>
            <ellipse cx="${cx + 18}" cy="162" rx="11" ry="6" fill="${c.bodyDark}" transform="rotate(8 ${cx + 18} 162)"/>`;
  } else if (pose === 'walk-b') {
    feet = `<ellipse cx="${cx - 18}" cy="162" rx="11" ry="6" fill="${c.bodyDark}" transform="rotate(8 ${cx - 18} 162)"/>
            <ellipse cx="${cx + 22}" cy="158" rx="11" ry="6" fill="${c.bodyDark}" transform="rotate(-10 ${cx + 22} 158)"/>`;
  } else {
    feet = `<ellipse cx="${cx + 34}" cy="${cy + 34}" rx="14" ry="7" fill="${c.bodyDark}"/>`;
  }

  // 身体 + 肚皮 + 手臂
  const body = `<g transform="rotate(${tilt} ${cx} ${cy})">
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c.body}"/>
    <ellipse cx="${cx + 4}" cy="${cy + 16}" rx="${rx - 18}" ry="${ry - 22}" fill="${c.belly}"/>
    <ellipse cx="${cx - rx + 4}" cy="${cy + 2}" rx="9" ry="16" fill="${c.bodyDark}" transform="rotate(18 ${cx - rx + 4} ${cy + 2})"/>
    <ellipse cx="${cx + rx - 4}" cy="${cy + 2}" rx="9" ry="16" fill="${c.bodyDark}" transform="rotate(-14 ${cx + rx - 4} ${cy + 2})"/>
  </g>`;

  // 脸(略偏右,配合右向行走):眼 + 腮红 + 嘴
  const face = `<g transform="rotate(${tilt} ${cx} ${cy})">
    <circle cx="${cx + 10}" cy="${cy - 12}" r="4.2" fill="#26221A"/>
    <circle cx="${cx + 30}" cy="${cy - 12}" r="4.2" fill="#26221A"/>
    <circle cx="${cx + 11.5}" cy="${cy - 13.5}" r="1.4" fill="#FFFFFF"/>
    <circle cx="${cx + 31.5}" cy="${cy - 13.5}" r="1.4" fill="#FFFFFF"/>
    <ellipse cx="${cx - 2}" cy="${cy - 1}" r="5" fill="${c.cheek}" opacity="0.55"/>
    <ellipse cx="${cx + 40}" cy="${cy - 1}" r="5" fill="${c.cheek}" opacity="0.55"/>
    <path d="M ${cx + 16} ${cy - 2} q 4 5 8 0" fill="none" stroke="#26221A" stroke-width="2.5" stroke-linecap="round"/>
  </g>`;

  // 头饰:MOMO 小呆毛 / KIKI 小草芽
  const extra = c.extra === 'tuft'
    ? `<path d="M ${cx - 6} ${cy - ry + 4} q -2 -14 8 -16 q 10 -2 10 8" fill="none" stroke="${c.bodyDark}" stroke-width="5" stroke-linecap="round"/>`
    : `<g transform="rotate(${tilt} ${cx} ${cy})">
         <path d="M ${cx} ${cy - ry + 2} q 0 -12 2 -14" fill="none" stroke="#3E7048" stroke-width="4" stroke-linecap="round"/>
         <ellipse cx="${cx - 6}" cy="${cy - ry - 8}" rx="8" ry="5" fill="#4C8A56" transform="rotate(-24 ${cx - 6} ${cy - ry - 8})"/>
         <ellipse cx="${cx + 9}" cy="${cy - ry - 10}" rx="8" ry="5" fill="#5A9A5E" transform="rotate(20 ${cx + 9} ${cy - ry - 10})"/>
       </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="184" viewBox="0 0 144 184">
  ${shadow}${feet}${body}${face}${extra}
</svg>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(SVG_OUT, { recursive: true });
  const poses = ['idle', 'walk-a', 'walk-b', 'sit'];
  for (const [name, c] of Object.entries(CHARACTERS)) {
    for (const pose of poses) {
      const svg = charSVG(c, pose);
      fs.writeFileSync(path.join(SVG_OUT, `char-${name}-${pose}.svg`), svg);
      const out = path.join(OUT, `char-${name}-${pose}.webp`);
      await sharp(Buffer.from(svg), { density: 144 }).resize({ width: 144 }).webp({ quality: 90, alphaQuality: 95 }).toFile(out);
      const kb = (fs.statSync(out).size / 1024).toFixed(1);
      console.log(`OK char-${name}-${pose}.webp ${kb} KB`);
    }
  }
})();
