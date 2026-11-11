// App icon set: an open mushaf inside a pointed arch (mihrab), in lamp gold
// on the lapis night sky shared with أورادنا.
//   node scripts/make_icons.mjs <assets dir> <public/icons dir>
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const [out, web] = process.argv.slice(2);
const defs = `<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22408C"/><stop offset=".55" stop-color="#132656"/><stop offset="1" stop-color="#0A1330"/></linearGradient>
<radialGradient id="ll" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#F7C566" stop-opacity=".38"/><stop offset="1" stop-color="#F7C566" stop-opacity="0"/></radialGradient>
<linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE9B4"/><stop offset=".5" stop-color="#E2BC6A"/><stop offset="1" stop-color="#A8802F"/></linearGradient>
<linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF8E6"/><stop offset="1" stop-color="#EAD9B0"/></linearGradient>
<radialGradient id="tq" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#E4FFFA"/><stop offset=".5" stop-color="#53CDBF"/><stop offset="1" stop-color="#0D4A44"/></radialGradient>
</defs>`;
// a pointed arch (mihrab) in lamp gold, the mushaf resting inside it
const ARCH = (inset) => { const l = 46 + inset, r = 134 - inset, base = 146 - inset * 0.6, top = 26 + inset * 1.4, sh = 84;
  return `M${l} ${base} L${l} ${sh} C${l} ${sh - 30} ${90 - 14} ${top + 18} 90 ${top} C${90 + 14} ${top + 18} ${r} ${sh - 30} ${r} ${sh} L${r} ${base} Z`; };
const star = (mono) => mono
  ? `<path d="${ARCH(0)}" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>`
  : `<path d="${ARCH(0)}" fill="rgba(10,19,48,0.55)" stroke="url(#gd)" stroke-width="3" stroke-linejoin="round"/>
<path d="${ARCH(7)}" fill="none" stroke="url(#gd)" stroke-width="1" stroke-linejoin="round" opacity=".55"/>`;
// an open mushaf on its stand
const book = (mono) => {
  const page = mono ? 'fill="#fff"' : 'fill="url(#pg)" stroke="url(#gd)" stroke-width="2.2" stroke-linejoin="round"';
  const lines = mono ? '' : [0, 1, 2].map((i) => `<path d="M${66 + i * 0.6} ${80 + i * 7} q11 -3 20 0" stroke="#B48A36" stroke-width="1.1" fill="none" opacity=".5"/><path d="M${94} ${80 + i * 7} q9 -3 ${20 - i * 0.6} 0" stroke="#B48A36" stroke-width="1.1" fill="none" opacity=".5"/>`).join('');
  return `<path d="M90 76 C80 68 68 67 58 70 L58 108 C68 105 80 106 90 114 Z" ${page}/>
<path d="M90 76 C100 68 112 67 122 70 L122 108 C112 105 100 106 90 114 Z" ${page}/>${lines}
<path d="M64 118 L116 118 M70 112 L90 124 L110 112" stroke="${mono ? '#fff' : 'url(#gd)'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
`;
};
const svg = (w, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 180 180">${defs}${inner}</svg>`;
const mark = (mono, scale = 1) => `<g transform="translate(90 90) scale(${scale}) translate(-90 -90)">${star(mono)}<g transform="translate(90 102) scale(0.86) translate(-90 -92)">${book(mono)}</g></g>`;
const full = (scale = 1) => `<rect width="180" height="180" fill="url(#bg)"/><rect width="180" height="180" fill="url(#ll)"/>${mark(false, scale)}`;
const files = {
  [`${out}/icon.png`]: [1024, svg(1024, full()), false],
  [`${out}/adaptive-foreground.png`]: [1024, svg(1024, mark(false, 0.6)), true],
  [`${out}/adaptive-monochrome.png`]: [1024, svg(1024, mark(true, 0.6)), true],
  [`${out}/splash-mark.png`]: [600, svg(600, mark(false, 0.95)), true],
  [`${out}/notification-icon.png`]: [96, svg(96, mark(true, 1.15)), true],
  [`${web}/icon-180.png`]: [180, svg(180, full()), false],
  [`${web}/icon-192.png`]: [192, svg(192, full()), false],
  [`${web}/icon-512.png`]: [512, svg(512, full()), false],
  [`${web}/icon-512-maskable.png`]: [512, svg(512, full(0.78)), false],
  [`${web}/badge-96.png`]: [96, svg(96, mark(true, 1.15)), true],
};
const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 1 });
for (const [f, [w, s, tr]] of Object.entries(files)) {
  await p.setViewportSize({ width: w, height: w });
  await p.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
  await p.screenshot({ path: f, omitBackground: tr, clip: { x: 0, y: 0, width: w, height: w } });
}
await b.close(); console.log('ok');
