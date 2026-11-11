// The meaning of an ayah: al-Tafsir al-Muyassar, by the scholars of the King Fahd Complex for the
// Printing of the Holy Quran. The text is kept in seven files, one per weekly part, and a file is
// read only when the reader first asks for a meaning in it (scripts/build_tafsir.py).
import { PARTS } from '../quran';
import { count, Key } from './recite';

export const TAFSIR = { name: 'التفسير الميسّر', by: 'مجمع الملك فهد لطباعة المصحف الشريف' };

type Book = Record<string, string>;
const LOAD: (() => Promise<any>)[] = [
  () => import('../quran/tafsir/h0.json'), () => import('../quran/tafsir/h1.json'), () => import('../quran/tafsir/h2.json'), () => import('../quran/tafsir/h3.json'),
  () => import('../quran/tafsir/h4.json'), () => import('../quran/tafsir/h5.json'), () => import('../quran/tafsir/h6.json'),
];
const books: Record<number, Book> = {};

/** The explanation of an ayah. The tafsir explains some neighbouring ayahs in one passage: `shared` says so. */
export async function tafsirOf(k: Key): Promise<{ text: string; shared: boolean } | null> {
  const d = PARTS.findIndex((p) => k.s >= p.surahs[0] && k.s <= p.surahs[1]);
  if (d < 0) return null;
  try {
    if (!books[d]) { const m = await LOAD[d](); books[d] = (m.default || m) as Book; }
    const book = books[d]; const a = Math.max(1, k.a);
    const raw = book[`${k.s}:${a}`]; if (!raw) return null;
    const at = (n: number) => { const t = n >= 1 && n <= count(k.s) ? book[`${k.s}:${n}`] : ''; return t && t[0] === '@' ? book[t.slice(1)] : t; };
    const text = at(a);
    return text ? { text, shared: raw[0] === '@' || at(a - 1) === text || at(a + 1) === text } : null;
  } catch { return null; }
}
