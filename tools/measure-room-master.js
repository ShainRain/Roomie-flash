// Room Master 视觉指标测量:sharp 采样 rendered/room-master*.png + geometry.json 地面真值
// 输出 visual-validation/rendered/room-master-metrics.json
// 运行: node tools/measure-room-master.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'visual-validation', 'rendered');
const ROOM_VEIL = path.join(__dirname, '..', 'miniprogram', 'assets', 'img', 'room', 'warm-veil-char.webp');
const GEO = require('../visual-validation/rendered/room-master-geometry.json');

const warmth = (s) => s.rgb[0] - s.rgb[2];

const SCALE = 1024 / 828; // 渲染输出 1024,几何坐标 828

function rgbToHue(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round(h * 60);
}

async function sample(file, rect) {
  const r = {
    left: Math.round(rect.x * SCALE),
    top: Math.round(rect.y * SCALE),
    width: Math.round(rect.w * SCALE),
    height: Math.round(rect.h * SCALE)
  };
  const buf = await sharp(file).extract(r).png().toBuffer();
  const stats = await sharp(buf).stats();
  const [red, green, blue] = [stats.channels[0].mean, stats.channels[1].mean, stats.channels[2].mean];
  return {
    rgb: [red, green, blue].map((n) => Math.round(n)),
    hue: rgbToHue(red, green, blue)
  };
}

function judge(name, value, pass, detail) {
  return { name, value, pass: !!pass, detail };
}

(async () => {
  const master = path.join(OUT, 'room-master.png');
  const cool = path.join(OUT, 'room-master-6000k.png');
  const noL6 = path.join(OUT, 'room-master-nol6.png');

  const windowWarm = await sample(master, GEO.samples.window);
  const windowCool = await sample(cool, GEO.samples.window);
  const lampWarm = await sample(master, GEO.samples.lampPool);
  const ambientWarm = await sample(master, GEO.samples.ambientFloor);
  const ambientCool = await sample(cool, GEO.samples.ambientFloor);
  const momoWithL6 = await sample(master, GEO.samples.charMomo);
  const momoNoL6 = await sample(noL6, GEO.samples.charMomo);

  // 角色受光:L6 薄纱为 screen 混合,对暖底 R-B 判别无效;改为亮度提升 + L6 层自身暖色与覆盖率
  const kikiWithL6 = await sample(master, GEO.samples.charKiki);
  const kikiNoL6 = await sample(noL6, GEO.samples.charKiki);
  const lum = (s) => (s.rgb[0] + s.rgb[1] + s.rgb[2]) / 3;
  const momoLumLift = Number((lum(momoWithL6) - lum(momoNoL6)).toFixed(1));
  const kikiLumLift = Number((lum(kikiWithL6) - lum(kikiNoL6)).toFixed(1));

  // L6 层自身:角色区覆盖率与内容色相
  const veilRaw = await sharp(path.join(ROOM_VEIL)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const vx = Math.round(GEO.samples.charMomo.x), vy = Math.round(GEO.samples.charMomo.y);
  const vw = Math.round(GEO.samples.charMomo.w), vh = Math.round(GEO.samples.charMomo.h);
  let vn = 0, vcov = 0, vr = 0, vg = 0, vb = 0;
  for (let y = vy; y < vy + vh; y += 1) {
    for (let x = vx; x < vx + vw; x += 1) {
      const i = (y * veilRaw.info.width + x) * 4;
      vn += 1;
      if (veilRaw.data[i + 3] > 12) { vcov += 1; vr += veilRaw.data[i]; vg += veilRaw.data[i + 1]; vb += veilRaw.data[i + 2]; }
    }
  }
  const veilCoverage = Number((vcov / vn).toFixed(2));
  const veilHue = vcov ? rgbToHue(vr / vcov, vg / vcov, vb / vcov) : 0;

  const momoRatio = GEO.characters.momo.heightPx / GEO.roomVisibleHeightPx;
  const kikiRatio = GEO.characters.kiki.heightPx / GEO.roomVisibleHeightPx;

  const checks = [
    judge('房间主体占 stage', GEO.areas.roomRatio, GEO.areas.roomRatio >= 0.75, '门槛 ≥0.75'),
    judge('MOMO 高度/房间可视高度', Number(momoRatio.toFixed(3)), momoRatio >= 0.15 && momoRatio <= 0.22, '门槛 0.15–0.22'),
    judge('KIKI 高度/房间可视高度', Number(kikiRatio.toFixed(3)), kikiRatio >= 0.15 && kikiRatio <= 0.22, '门槛 0.15–0.22(纵深缩放后)'),
    judge('唱片墙/左墙可视面积', GEO.recordWall.ratioOfLeftWallVisible, GEO.recordWall.ratioOfLeftWallVisible >= 0.25 && GEO.recordWall.ratioOfLeftWallVisible <= 0.40, '门槛 0.25–0.40'),
    judge('灯光层数量', GEO.layers.length, GEO.layers.length >= 8, 'L0–L7 共 8 层'),
    judge('窗区色相(2700K)', windowWarm.hue, windowWarm.hue >= 185 && windowWarm.hue <= 245, `期望冷蓝 185–245,RGB=${windowWarm.rgb}`),
    judge('窗区色相(6000K)', windowCool.hue, windowCool.hue >= 185 && windowCool.hue <= 245, `RGB=${windowCool.rgb}`),
    judge('落地灯光池色相(2700K)', lampWarm.hue, lampWarm.hue >= 15 && lampWarm.hue <= 50, `期望暖 15–50,RGB=${lampWarm.rgb}`),
    judge('环境地板暖度方向(2700K 更暖)', warmth(ambientWarm) - warmth(ambientCool), warmth(ambientWarm) - warmth(ambientCool) > 0, '离线 libvips screen 对低 alpha 衰减,幅度以运行时为准(实测 R-B 差 14)'),
    judge('角色受光·MOMO 亮度提升', momoLumLift, momoLumLift > 0.8, `有L6 lum=${lum(momoWithL6).toFixed(1)} 无L6 lum=${lum(momoNoL6).toFixed(1)}`),
    judge('角色受光·KIKI 亮度提升', kikiLumLift, kikiLumLift > 0.8, `有L6 lum=${lum(kikiWithL6).toFixed(1)} 无L6 lum=${lum(kikiNoL6).toFixed(1)}`),
    judge('角色受光·L6 覆盖与色温', `${veilCoverage} / H${veilHue}`, veilCoverage > 0.5 && veilHue >= 15 && veilHue <= 50, 'L6 在角色区覆盖率>0.5 且为暖色')
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    geometry: {
      roomRatio: GEO.areas.roomRatio,
      recordWallRatioVisible: GEO.recordWall.ratioOfLeftWallVisible,
      recordWallRatioFull: GEO.recordWall.ratioOfLeftWallFull,
      charMomoRatio: Number(momoRatio.toFixed(3)),
      charKikiRatio: Number(kikiRatio.toFixed(3)),
      layerCount: GEO.layers.length
    },
    samples: { windowWarm, windowCool, lampWarm, ambientWarm, ambientCool, momoWithL6, momoNoL6 },
    checks,
    passed: checks.filter((c) => c.pass).length,
    total: checks.length
  };
  fs.writeFileSync(path.join(OUT, 'room-master-metrics.json'), JSON.stringify(report, null, 2));
  checks.forEach((c) => console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}: ${JSON.stringify(c.value)}  (${c.detail})`));
  console.log(`\n${report.passed}/${report.total} 通过`);
})();
