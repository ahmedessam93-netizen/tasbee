// Web: the browser loads each page font from the first server that answers and keeps it in its
// cache (the service worker keeps them for offline use).
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import { Q } from './index';

const C = Q.fontCommit;
const SOURCES = [
  (p: number) => `https://cdn.jsdelivr.net/gh/nuqayah/qpc-fonts@${C}/mushaf-v2/QCF2${String(p).padStart(3, '0')}.ttf`,
  (p: number) => `https://raw.githubusercontent.com/nuqayah/qpc-fonts/${C}/mushaf-v2/QCF2${String(p).padStart(3, '0')}.ttf`,
  (p: number) => `https://verses.quran.com/fonts/quran/hafs/v2/ttf/p${p}.ttf`,
];
export const family = (p: number) => `qcf2_${p}`;
export const TOTAL_BYTES = Q.fonts.reduce((a, f) => a + f[0], 0);

const loaded = new Set<number>();
const listeners = new Set<() => void>();
const loading = new Map<number, Promise<boolean>>();
export function loadPage(p: number): Promise<boolean> {
  if (loaded.has(p)) return Promise.resolve(true);
  let x = loading.get(p);
  if (!x) {
    x = (async () => {
      for (const src of SOURCES) {
        try {
          // load through FontFace directly so a failed server can fall through to the next
          const face = new (window as any).FontFace(family(p), `url(${src(p)})`);
          await face.load();
          (document as any).fonts.add(face);
          loaded.add(p); listeners.forEach((l) => l());
          return true;
        } catch {}
      }
      try { await Font.loadAsync({ [family(p)]: SOURCES[0](p) }); loaded.add(p); listeners.forEach((l) => l()); return true; } catch { return false; }
    })().finally(() => loading.delete(p));
    loading.set(p, x);
  }
  return x;
}
export const isLoaded = (p: number) => loaded.has(p);
export const isDownloaded = (_p: number) => true;
export const ensureDownloaded = (_p: number) => Promise.resolve(true);
export function usePageFonts(pages: number[]) {
  const [, bump] = useState(0);
  const key = pages.join(',');
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    pages.forEach((p) => { loadPage(p); });
    return () => { listeners.delete(l); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return pages.map((p) => loaded.has(p));
}
export async function downloadRange(from: number, to: number, onProgress?: (done: number, total: number) => void) {
  const total = to - from + 1; onProgress?.(total, total);
  return { done: total, failed: 0, total };
}
export const downloadedCount = () => 604;
