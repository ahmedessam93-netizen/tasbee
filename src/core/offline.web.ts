// Recitation kept on the phone, so a part can be heard with no connection (web: the browser's cache).
import { RECITER } from './recite';

const NAME = 'tasbee-recitation-v1';
const url = (file: string) => `${RECITER.base}${file}.mp3`;
const ok = () => typeof caches !== 'undefined';
const blobs = new Map<string, string>();

export const offlineSupported = ok;
/** A playable address for a kept recording, or null if it is not on the phone. */
export async function localUri(file: string): Promise<string | null> {
  if (!ok()) return null;
  try {
    const hit = blobs.get(file); if (hit) return hit;
    const c = await caches.open(NAME); const r = await c.match(url(file)); if (!r) return null;
    const u = URL.createObjectURL(await r.blob());
    blobs.set(file, u);
    if (blobs.size > 40) { const first = blobs.keys().next().value as string; URL.revokeObjectURL(blobs.get(first)!); blobs.delete(first); }
    return u;
  } catch { return null; }
}
export async function have(files: string[]): Promise<number> {
  if (!ok()) return 0;
  try { const c = await caches.open(NAME); const keys = new Set((await c.keys()).map((r) => r.url)); return files.filter((f) => keys.has(url(f))).length; } catch { return 0; }
}
export async function download(files: string[], onProgress: (done: number, total: number) => void, cancelled: () => boolean): Promise<boolean> {
  if (!ok()) return false;
  const c = await caches.open(NAME); const keys = new Set((await c.keys()).map((r) => r.url));
  const todo = files.filter((f) => !keys.has(url(f))); let done = files.length - todo.length; let failed = 0; let i = 0;
  onProgress(done, files.length);
  const worker = async () => {
    while (i < todo.length && !cancelled() && failed < 8) {
      const f = todo[i++];
      try {
        const r = await fetch(url(f), { mode: 'cors' });
        if (!r.ok) throw new Error(String(r.status));
        await c.put(url(f), r); done++; onProgress(done, files.length);
      } catch { failed++; }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return done === files.length;
}
export async function remove(files: string[]): Promise<void> {
  if (!ok()) return;
  try { const c = await caches.open(NAME); await Promise.all(files.filter((f) => f !== '001001').map((f) => c.delete(url(f)))); } catch {}
}
