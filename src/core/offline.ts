// Recitation kept on the phone, so a part can be heard with no connection (app: its documents folder).
import { Directory, File, Paths } from 'expo-file-system';
import { RECITER } from './recite';

const dir = new Directory(Paths.document, 'recitation-husary');
const url = (file: string) => `${RECITER.base}${file}.mp3`;
const fileOf = (file: string) => new File(dir, `${file}.mp3`);
const ready = () => { try { if (!dir.exists) dir.create({ intermediates: true }); } catch {} };

export const offlineSupported = () => true;
/** A playable address for a kept recording, or null if it is not on the phone. */
export async function localUri(file: string): Promise<string | null> {
  try { const f = fileOf(file); return f.exists && f.size > 0 ? f.uri : null; } catch { return null; }
}
export async function have(files: string[]): Promise<number> {
  try { return files.filter((f) => fileOf(f).exists).length; } catch { return 0; }
}
export async function download(files: string[], onProgress: (done: number, total: number) => void, cancelled: () => boolean): Promise<boolean> {
  ready();
  const todo = files.filter((f) => !fileOf(f).exists); let done = files.length - todo.length; let failed = 0; let i = 0;
  onProgress(done, files.length);
  const worker = async () => {
    while (i < todo.length && !cancelled() && failed < 8) {
      const f = todo[i++]; const tmp = new File(dir, `${f}.part`);
      try {
        if (tmp.exists) tmp.delete();
        await File.downloadFileAsync(url(f), tmp, { idempotent: true });
        if (tmp.size < 1000) throw new Error('short');
        const out = fileOf(f); if (out.exists) out.delete();
        tmp.move(out); done++; onProgress(done, files.length);
      } catch { failed++; try { if (tmp.exists) tmp.delete(); } catch {} }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return done === files.length;
}
export async function remove(files: string[]): Promise<void> {
  for (const f of files) { if (f === '001001') continue; try { const x = fileOf(f); if (x.exists) x.delete(); } catch {} }
}
