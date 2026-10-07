// 通用并排 diff:node tools/make-diff.js <refPng> <renPng> <outName> [labelRef] [labelRen]
const sharp = require('sharp');
const path = require('path');

const [refPath, renPath, outName, labelRef, labelRen] = process.argv.slice(2);
if (!refPath || !renPath || !outName) {
  console.error('usage: node tools/make-diff.js <refPng> <renPng> <outName> [labelRef] [labelRen]');
  process.exit(1);
}

(async () => {
  const H = 1100;
  const ref = await sharp(refPath).resize({ height: H }).png().toBuffer();
  const rm = await sharp(ref).metadata();
  const ren = await sharp(renPath).resize({ height: H }).png().toBuffer();
  const rn = await sharp(ren).metadata();
  const pad = 36;
  const labelH = 56;
  const label = (t) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="56"><text x="0" y="38" font-family="Verdana" font-size="26" font-weight="700" fill="#F7F3EA">${t}</text></svg>`);
  await sharp({ create: { width: pad * 3 + rm.width + rn.width, height: H + pad * 2 + labelH, channels: 4, background: '#0B1320' } })
    .composite([
      { input: ref, left: pad, top: pad + labelH },
      { input: ren, left: pad * 2 + rm.width, top: pad + labelH },
      { input: label(labelRef || 'REFERENCE'), left: pad, top: pad },
      { input: label(labelRen || 'RENDERED'), left: pad * 2 + rm.width, top: pad }
    ]).png().toFile(path.join(__dirname, '..', 'visual-validation', 'diff', `${outName}.png`));
  console.log('OK diff/' + outName + '.png');
})();
