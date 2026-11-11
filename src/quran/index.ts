// The Madinah mushaf (King Fahd Complex, 1421H print): 604 pages of 15 lines, drawn with the
// Complex's own page fonts. Built by scripts/build_quran.py, which checks every page.
import PAGES_RAW from './pages.json';
import META from './meta.json';

/** A word: its glyphs in the page font and its width in font units ([w1, w2] for "۞ word"). */
export type Word = [string, number | number[]];
/** A line: a surah title ['s', n], a basmala ['b', n], or the words of the line. */
export type Line = ['s', number] | ['b', number] | Word[];
export const PAGES = PAGES_RAW as unknown as Line[][];
export const PAGE_COUNT = 604;

export type Sitting = { from: [number, number, number]; to: [number, number, number]; w: number; v: [string, string] };
export type Part = { name: string; surahs: [number, number]; pages: [number, number]; w: number; sittings: Sitting[] };
type Meta = {
  source: string; fontCommit: string; upm: number;
  surahs: [string, number, number][]; juz: number[]; pageSurahs: number[][]; lineW: number[]; wide: Record<string, number>; fonts: [number, string][];
  parts: Part[];
};
export const Q = META as unknown as Meta;
export const PARTS = Q.parts;

export const isTitle = (l: Line): l is ['s', number] => l[0] === 's';
export const isBasmala = (l: Line): l is ['b', number] => l[0] === 'b';
export const isText = (l: Line): l is Word[] => l[0] !== 's' && l[0] !== 'b';

/** A place in the mushaf: page, line index (0-based, in the page's line list), word index. Comparable as a number. */
export const pos = (p: number, l: number, w: number) => p * 10000 + l * 100 + w;
export const posOf = (t: [number, number, number]) => pos(t[0], t[1], t[2]);
export const pageOfPos = (x: number) => Math.floor(x / 10000);

export const surahName = (n: number) => Q.surahs[n - 1]?.[0] ?? '';
export const surahPage = (n: number) => Q.surahs[n - 1]?.[1] ?? 1;
export const juzOf = (p: number) => Q.juz[p - 1] ?? 1;

/** Surahs whose verses appear on a page (in order). */
export const surahsOn = (p: number): number[] => Q.pageSurahs[p - 1] ?? [];

/** "البقرة ١٤١" style label for a verse key. */
const AD = '٠١٢٣٤٥٦٧٨٩';
const arn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => AD[+d]);
export function verseLabel(vk: string) {
  const [s, a] = vk.split(':').map(Number);
  return `${surahName(s)} ${arn(a)}`;
}
/** "الفاتحة ١ – البقرة ١٤١" */
export function sittingRange(st: Sitting) {
  const [s1, a1] = st.v[0].split(':').map(Number);
  const [s2, a2] = st.v[1].split(':').map(Number);
  const last = Q.surahs[s2 - 1]?.[2];
  const from = a1 === 1 ? surahName(s1) : verseLabel(st.v[0]);
  const to = a2 === last ? surahName(s2) : verseLabel(st.v[1]);
  if (s1 === s2 && a1 === 1 && a2 === last) return `سورة ${surahName(s1)}`;
  return `${from} – ${to}`;
}

/** Lines of text per page for a reading-time estimate. */
export const MIN_PER_LINE = 2 / 15; // about two minutes a page
export const minutesFor = (lines: number) => Math.max(1, Math.round(lines * MIN_PER_LINE));
