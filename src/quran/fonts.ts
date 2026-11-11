// The mushaf's page fonts: one font per page, from the King Fahd Complex (QCF V2).
// They are not inside the app (200 MB in all): each is downloaded once, the first time its page
// is needed, checked against its SHA-256, and kept on the phone. Three servers hold the very same
// files; if one cannot be reached (as can happen in some countries), the next is tried.
import * as Font from 'expo-font';
import { Directory, File, Paths } from 'expo-file-system';
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

const dir = new Directory(Paths.document, 'mushaf-v2');
const fileOf = (p: number) => new File(dir, `p${p}.ttf`);
const ensureDir = () => { try { if (!dir.exists) dir.create({ intermediates: true, idempotent: true }); } catch {} };

/** Downloaded and verified (checked once per run, then remembered). */
const verified = new Set<number>();
export function isDownloaded(p: number) {
  if (verified.has(p)) return true;
  try { const f = fileOf(p); return f.exists && f.size === Q.fonts[p - 1][0]; } catch { return false; }
}

const inflight = new Map<number, Promise<boolean>>();
async function download(p: number): Promise<boolean> {
  ensureDir();
  const [size, sha] = Q.fonts[p - 1];
  const f = fileOf(p);
  try {
    if (f.exists) {
      if (f.size === size && (await f.digest('SHA-256')) === sha) { verified.add(p); return true; }
      f.delete();
    }
  } catch {}
  for (const src of SOURCES) {
    const tmp = new File(dir, `p${p}.part`);
    try {
      if (tmp.exists) tmp.delete();
      await File.downloadFileAsync(src(p), tmp, { idempotent: true });
      if (tmp.size === size && (await tmp.digest('SHA-256')) === sha) {
        if (f.exists) f.delete();
        tmp.move(f);
        verified.add(p);
        return true;
      }
      tmp.delete();
    } catch {
      try { if (tmp.exists) tmp.delete(); } catch {}
    }
  }
  return false;
}
export function ensureDownloaded(p: number): Promise<boolean> {
  if (verified.has(p)) return Promise.resolve(true);
  let x = inflight.get(p);
  if (!x) { x = download(p).finally(() => inflight.delete(p)); inflight.set(p, x); }
  return x;
}

const loaded = new Set<number>();
const listeners = new Set<() => void>();
const loading = new Map<number, Promise<boolean>>();
/** Downloads (if needed) and loads a page font. */
export function loadPage(p: number): Promise<boolean> {
  if (loaded.has(p)) return Promise.resolve(true);
  let x = loading.get(p);
  if (!x) {
    x = (async () => {
      if (!(await ensureDownloaded(p))) return false;
      try { await Font.loadAsync({ [family(p)]: fileOf(p).uri }); loaded.add(p); listeners.forEach((l) => l()); return true; } catch { return false; }
    })().finally(() => loading.delete(p));
    loading.set(p, x);
  }
  return x;
}
export const isLoaded = (p: number) => loaded.has(p);

/** Re-renders when page fonts finish loading; loads the given pages. */
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

/** Downloads a range of pages a few at a time; reports progress. Stops early if offline. */
export async function downloadRange(from: number, to: number, onProgress?: (done: number, total: number) => void, signal?: { stop?: boolean }) {
  const pages: number[] = [];
  for (let p = from; p <= to; p++) pages.push(p);
  let done = 0; let failed = 0;
  const queue = pages.slice();
  const worker = async () => {
    while (queue.length && !signal?.stop) {
      const p = queue.shift() as number;
      const ok = await ensureDownloaded(p);
      if (ok) done++; else failed++;
      onProgress?.(done, pages.length);
      if (failed >= 6 && done === 0) return; // no connection: try again later
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return { done, failed, total: pages.length };
}

/** How many of the 604 pages are on the phone. */
export function downloadedCount() {
  let n = 0;
  for (let p = 1; p <= 604; p++) if (isDownloaded(p)) n++;
  return n;
}
