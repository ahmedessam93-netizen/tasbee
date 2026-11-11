// Listening to the Quran: which recording belongs to which ayah, the order they are played in,
// and where each ayah sits on the page.
// The recordings are whole ayahs by one reciter, played one after another, never cut or joined.
// Reciter: Sheikh Mahmoud Khalil al-Husary (murattal), from the everyayah.com library.
import AYAHS_RAW from '../quran/ayahs.json';
import { pageOfPos, PARTS, posOf, Q, surahName } from '../quran';
import { ar } from './plan';

/** An ayah. `a: 0` is the basmala recited before a surah (not an ayah of it, except in al-Fatiha). */
export type Key = { s: number; a: number };
const AYAHS = AYAHS_RAW as unknown as [number, number][][];   // [surah][ayah] = [first word, last word] (see quran/pos)

export const RECITER = { name: 'الشيخ محمود خليل الحصري', short: 'الحصري', base: 'https://everyayah.com/data/Husary_64kbps/' };

const pad = (n: number) => String(n).padStart(3, '0');
/** The basmala is the recording of al-Fatiha's first ayah, by the same reciter. */
export const fileOf = (k: Key) => (k.a === 0 ? '001001' : pad(k.s) + pad(k.a));
export const urlOf = (k: Key) => `${RECITER.base}${fileOf(k)}.mp3`;
export const same = (x: Key | null, y: Key | null) => !!x && !!y && x.s === y.s && x.a === y.a;
export const count = (s: number) => AYAHS[s - 1].length;
/** Surahs that open with a recited basmala: all but al-Fatiha (its first ayah) and at-Tawba (none). */
const hasBasmala = (s: number) => s !== 1 && s !== 9;

/** Before / at / after, in the order of the mushaf. The basmala comes just before ayah 1. */
export const order = (k: Key) => k.s * 1000 + k.a;
/** The first thing to play when starting at this ayah: the basmala, if it opens a surah. */
export const opening = (k: Key): Key => (k.a === 1 && hasBasmala(k.s) ? { s: k.s, a: 0 } : k);
export function next(k: Key): Key | null {
  if (k.a < count(k.s)) return { s: k.s, a: k.a + 1 };
  if (k.s >= 114) return null;
  return opening({ s: k.s + 1, a: 1 });
}
export function prev(k: Key): Key | null {
  if (k.a > 1) return { s: k.s, a: k.a - 1 };
  if (k.a === 1 && hasBasmala(k.s)) return { s: k.s, a: 0 };
  if (k.s <= 1) return null;
  return { s: k.s - 1, a: count(k.s - 1) };
}

/** The words of an ayah, first to last. The basmala has no words of its own: it stands at ayah 1. */
export const placeOf = (k: Key): [number, number] => AYAHS[k.s - 1][Math.max(1, k.a) - 1];
export const pageOf = (k: Key) => pageOfPos(placeOf(k)[0]);

// the ayahs that touch each page, found once
let byPage: Key[][] | null = null;
function index(): Key[][] {
  if (byPage) return byPage;
  const out: Key[][] = Array.from({ length: 605 }, () => []);
  AYAHS.forEach((surah, si) => surah.forEach(([from, to], ai) => {
    for (let p = pageOfPos(from); p <= pageOfPos(to); p++) out[p].push({ s: si + 1, a: ai + 1 });
  }));
  byPage = out; return out;
}
/** The ayah a word belongs to. */
export function ayahAt(pos: number): Key | null {
  for (const k of index()[pageOfPos(pos)] || []) { const [f, t] = placeOf(k); if (pos >= f && pos <= t) return k; }
  return null;
}
/** The first ayah that begins at or after `from` on this page; if none does (the page ends with the
 * title of the next surah, or `from` is past its last ayah), the first ayah of the next page. */
export function firstOn(page: number, from = 0): Key | null {
  const at = Math.max(from, page * 10000);
  for (let p = page; p <= Math.min(604, page + 1); p++) {
    const hit = (index()[p] || []).find((k) => placeOf(k)[0] >= at);
    if (hit) return hit;
  }
  const list = index()[page] || [];
  return list[list.length - 1] || null;
}
/** The last ayah that ends at or before this word. */
export function lastBy(pos: number): Key | null {
  const list = index()[pageOfPos(pos)] || [];
  for (let i = list.length - 1; i >= 0; i--) if (placeOf(list[i])[1] <= pos) return list[i];
  return null;
}

export const labelOf = (k: Key) => (k.a === 0 ? `سورة ${surahName(k.s)}، البسملة` : `سورة ${surahName(k.s)}، الآية ${ar(k.a)}`);
export const shortLabel = (k: Key) => (k.a === 0 ? `بسملة ${surahName(k.s)}` : `${surahName(k.s)} ${ar(k.a)}`);

/** Every recording of one of the seven weekly parts, in order, each file once. */
export function filesOfPart(d: number): string[] {
  const part = PARTS[d]; const from = posOf(part.sittings[0].from); const to = posOf(part.sittings[part.sittings.length - 1].to);
  const out = new Set<string>(['001001']);
  for (let s = part.surahs[0]; s <= part.surahs[1]; s++) AYAHS[s - 1].forEach(([f, t], ai) => { if (t >= from && f <= to) out.add(pad(s) + pad(ai + 1)); });
  return [...out];
}
export const TOTAL_AYAHS = Q.surahs.reduce((a, x) => a + x[2], 0);
