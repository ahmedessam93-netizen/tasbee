// Widget picker previews (Android), drawn like the real widgets.
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const out = process.argv[2]; const fonts = process.argv[3];
const ring = (s, f) => { const r = s / 2 - 7, c = s / 2, L = 2 * Math.PI * r; return `<svg width="${s}" height="${s}"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(226,188,106,0.22)" stroke-width="6"/><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#7FE3D7" stroke-width="6" stroke-linecap="round" stroke-dasharray="${L * f} ${L}" transform="rotate(-90 ${c} ${c})"/><text x="${c}" y="${c + s * 0.09}" text-anchor="middle" font-size="${s * 0.26}" fill="#F3EAD7" font-family="Amiri">۞</text></svg>`; };
const css = `@font-face{font-family:Kufi;src:url(file://${fonts}/ReemKufi_600SemiBold.ttf)}@font-face{font-family:Amiri;src:url(file://${fonts}/Amiri_700Bold.ttf)}@font-face{font-family:Plex;src:url(file://${fonts}/IBMPlexSansArabic_500Medium.ttf)}
body{margin:0;background:transparent;direction:rtl}.w{box-sizing:border-box;border-radius:28px;border:1px solid rgba(226,188,106,.32);background:linear-gradient(#132350f7,#070c1af7);color:#F3EAD7;display:flex;align-items:center}`;
const med = `<div class="w" style="width:500px;height:220px;padding:14px 22px;gap:14px"><div style="flex:1;text-align:right">
<div style="font:12px Plex;color:#E9C677">الأحد: الجزء الثاني</div><div style="font:22px Kufi">جلسة العصر</div>
<div style="font:18px/1.5 Amiri">الأنعام ١٤١ – الأعراف ١٤١</div><div style="height:1px;background:rgba(226,188,106,.2);margin:6px 0"></div>
<div style="font:13px Plex;color:#7FE3D7">التالية: المغرب ٥:٠٦ م</div></div>${ring(120, 0.46)}</div>`;
const small = `<div class="w" style="width:220px;height:220px;flex-direction:column;justify-content:center">${ring(110, 0.46)}<div style="font:17px Kufi;margin-top:6px">جلسة العصر</div><div style="font:12px Plex;color:rgba(243,234,215,.66)">الأنعام ١٤١ – الأعراف ١٤١</div></div>`;
const b = await chromium.launch(); const p = await b.newPage();
for (const [f, html, w, h] of [['widget-preview.png', med, 500, 220], ['widget-preview-small.png', small, 220, 220]]) {
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(`<html><head><style>${css}</style></head><body>${html}</body></html>`); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/${f}`, omitBackground: true });
}
await b.close(); console.log('ok');
