// The weekly plan: the Quran in seven parts, one a day, each read in five sittings after the
// five prayers. Everything (home screen, reader, notifications, widget) is computed from here.
import { minutesFor, PARTS, Part, posOf, sittingRange } from '../quran';
import PT from './prayer';

export const WIN_NAMES = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
export const WIN_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const ORDINALS = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع'];

export type Settings = {
  lat: number | null; lng: number | null; method: string; asr: number;
  offset: number; fixed: string[]; notif?: boolean; onboarded?: boolean;
  city?: number | 'geo'; cityName?: string; theme?: 'auto' | 'light' | 'dark'; wake?: boolean; haptics?: boolean;
  /** share anonymous use and error reports (on unless turned off); anon: a random number for this install */
  share?: boolean; anon?: string;
  travel?: boolean; pageZoom?: number;
  /** weekday (0 = Sunday … 6 = Saturday) on which the first part is read */
  startDay: number;
};
/** done: sittings finished (0–4). at: the saved place, a reader item key "k:page". */
export type DayState = { done: Record<number, number>; at?: string };
export type State = {
  settings: Settings;
  days: Record<string, DayState>;
  /** completed khatmas, and which weeks were already counted */
  khatma: { count: number; counted: Record<string, number> };
  /** the free-reading place in the whole mushaf (page) */
  mushafPage?: number;
  /** pages the reader marked to come back to */
  bookmarks?: number[];
};

export const DEFAULTS: Settings = {
  lat: null, lng: null, method: 'egypt', asr: 1,
  offset: 20, fixed: ['05:30', '13:00', '16:00', '18:30', '21:00'], notif: true,
  onboarded: false, city: 0, cityName: 'القاهرة', theme: 'auto', wake: true, haptics: true,
  travel: true, pageZoom: 1, startDay: 6,
};
export function normalize(raw: any): State {
  const s = raw && raw.settings ? raw.settings : {};
  const k = raw && raw.khatma ? raw.khatma : {};
  return {
    settings: { ...DEFAULTS, ...s, asr: 1, startDay: Number.isInteger(s.startDay) ? s.startDay : 6 },
    days: (raw && raw.days) || {},
    khatma: { count: Number(k.count) || 0, counted: k.counted || {} },
    mushafPage: raw && raw.mushafPage ? Number(raw.mushafPage) : undefined,
    bookmarks: Array.isArray(raw && raw.bookmarks) ? raw.bookmarks.map(Number).filter((n: number) => n >= 1 && n <= 604) : [],
  };
}

// ---- numbers and time in Arabic, without relying on Intl (Hermes) ----
const AD = '٠١٢٣٤٥٦٧٨٩';
export const ar = (n: number | string) => String(n).replace(/[0-9]/g, (d) => AD[+d]);
export function cnt(n: number, one: string, two: string, few: string) {
  n = Math.round(n);
  if (n === 1) return one; if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${ar(n)} ${few}`;
  return `${ar(n)} ${one}`;
}
export const PG = (n: number) => cnt(n, 'صفحة', 'صفحتان', 'صفحات');
export const MN = (n: number) => cnt(n, 'دقيقة', 'دقيقتان', 'دقائق');
export function fmtTime(d: Date | null) {
  if (!d) return '—';
  let h = d.getHours(); const m = d.getMinutes(); const pm = h >= 12;
  h = h % 12; if (h === 0) h = 12;
  return `${ar(h)}:${ar(String(m).padStart(2, '0'))} ${pm ? 'م' : 'ص'}`;
}

// ---- dates ----
export const dkey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => { const x = atMidnight(d); x.setDate(x.getDate() + n); return x; };
export const fromKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const hasLoc = (s: Settings) => typeof s.lat === 'number' && typeof s.lng === 'number';
const fixedDate = (date: Date, hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0); };

export type Times = Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', Date | null>;
export function times(s: Settings, date: Date): Times {
  if (hasLoc(s)) return PT.compute(date, s.lat, s.lng, { method: s.method, asr: s.asr }) as Times;
  const f = s.fixed;
  return { fajr: fixedDate(date, f[0]), dhuhr: fixedDate(date, f[1]), asr: fixedDate(date, f[2]), maghrib: fixedDate(date, f[3]), isha: fixedDate(date, f[4]) };
}
/** The day's reading starts at Fajr: before Fajr it is still the previous day. */
export function wirdDate(s: Settings, now: Date) { const t = times(s, now); return (t.fajr && now < t.fajr) ? addDays(now, -1) : atMidnight(now); }
export function windowsFor(s: Settings, date: Date) {
  const t = times(s, date);
  return WIN_KEYS.map((k, i) => ({ i, name: WIN_NAMES[i], time: t[k] }));
}

/** Which of the seven parts is read on a date. */
export const partIndex = (s: Settings, date: Date) => (date.getDay() - s.startDay + 7) % 7;
/** The first day of the week (khatma) a date belongs to. */
export const cycleStart = (s: Settings, date: Date) => addDays(date, -partIndex(s, date));

// ---- reader items: the pages of each sitting, in order ----
export type RItem = { key: string; k: number; page: number; from: number; to: number; first: boolean; last: boolean };
export function itemsFor(part: Part): RItem[] {
  const out: RItem[] = [];
  part.sittings.forEach((st, k) => {
    const a = st.from[0], b = st.to[0];
    for (let p = a; p <= b; p++) out.push({ key: `${k}:${p}`, k, page: p, from: posOf(st.from), to: posOf(st.to), first: p === a, last: p === b });
  });
  return out;
}

export type Plan = {
  date: Date; key: string; wd: number; dayName: string; d: number; part: Part; partTitle: string;
  wins: { i: number; name: string; time: Date | null }[]; cur: number; curDone: boolean; nextIdx: number;
  done: Record<number, number>; at: string | null;
  total: number; readW: number; left: number; complete: boolean; cycle: string;
};
export const sitW = (part: Part, k: number) => part.sittings[k].w;
export const sitPages = (part: Part, k: number) => part.sittings[k].to[0] - part.sittings[k].from[0] + 1;
export const sitLabel = (part: Part, k: number) => sittingRange(part.sittings[k]);
export const partTitleOf = (d: number) => `الحزب ${ORDINALS[d]}: ${PARTS[d].name}`;

/** How much of a sitting is behind the saved place (0–1). */
function placeFrac(part: Part, at: string | null, k: number) {
  if (!at) return 0;
  const [ak, ap] = at.split(':').map(Number);
  if (ak !== k) return 0;
  const n = sitPages(part, k);
  return Math.max(0, Math.min(1, (ap - part.sittings[k].from[0]) / n));
}

export function plan(st: State, now: Date = new Date()): Plan {
  const s = st.settings;
  const date = wirdDate(s, now); const key = dkey(date); const wd = date.getDay();
  const d = partIndex(s, date); const part = PARTS[d];
  const ds = st.days[key] || { done: {} };
  const done = ds.done || {};
  const wins = windowsFor(s, date);
  let cur = 0; wins.forEach((w, i) => { if (w.time && w.time <= now) cur = i; });
  const curDone = !!done[cur];
  let nextIdx = wins.findIndex((w, k) => k >= cur && !done[k]);
  if (nextIdx < 0) nextIdx = wins.findIndex((w, k) => !done[k]);
  const complete = nextIdx < 0;
  if (nextIdx < 0) nextIdx = 4;
  const total = part.w;
  const at = ds.at || null;
  let readW = 0;
  part.sittings.forEach((x, k) => { readW += done[k] ? x.w : x.w * placeFrac(part, at, k); });
  return {
    date, key, wd, dayName: DAY_NAMES[wd], d, part, partTitle: partTitleOf(d),
    wins, cur, curDone, nextIdx, done, at, total, readW, left: Math.max(0, total - readW), complete,
    cycle: dkey(cycleStart(s, date)),
  };
}

/** The plan of any day: today as it stands now; another day as at its start. */
export function planForDay(st: State, key: string | null, now: Date = new Date()): Plan {
  const today = plan(st, now);
  if (!key || key === today.key) return today;
  const date = fromKey(key);
  if (date < today.date) return plan(st, new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 50));
  const f = times(st.settings, date).fajr;
  return plan(st, new Date((f ? f.getTime() : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 5).getTime()) + 60000));
}

/** The seven days of the week (khatma) a day belongs to, with how far each went. */
export function weekOf(st: State, P: Plan) {
  const start = fromKey(P.cycle);
  return Array.from({ length: 7 }, (_, d) => {
    const date = addDays(start, d); const key = dkey(date);
    const done = st.days[key]?.done || {};
    const n = [0, 1, 2, 3, 4].filter((k) => done[k]).length;
    return { d, date, key, part: PARTS[d], n, full: n === 5 };
  });
}
export const weekComplete = (st: State, P: Plan) => weekOf(st, P).every((x) => x.full);

// What a widget shows at a given moment.
export type Snapshot = { day: string; title: string; detail: string; progress: number; next: string; complete: boolean };
export function snapshot(st: State, at: Date = new Date()): Snapshot {
  const P = plan(st, at);
  const w = P.wins[P.nextIdx];
  const nextWin = P.wins.find((x) => x.time && x.time > at);
  const tomorrowFajr = times(st.settings, addDays(P.date, 1)).fajr;
  const next = nextWin ? `${nextWin.name} ${fmtTime(nextWin.time)}` : `الفجر ${fmtTime(tomorrowFajr)}`;
  const progress = P.total ? P.readW / P.total : 0;
  const day = `${P.dayName}: الحزب ${ORDINALS[P.d]}`;
  if (P.complete) return { day, title: 'تمّ حزب اليوم', detail: P.part.name, progress: 1, next: `الفجر ${fmtTime(tomorrowFajr)}`, complete: true };
  const title = (P.curDone && P.nextIdx > P.cur) ? `القادمة: جلسة ${w.name}` : `جلسة ${w.name}`;
  return { day, title, detail: sitLabel(P.part, P.nextIdx), progress, next, complete: false };
}

// Notifications for the coming days, assuming the person follows the plan from now on.
export type Planned = { at: Date; title: string; body: string; id: string };
export function upcomingNotifications(st: State, now: Date, maxCount = 60): Planned[] {
  const s = st.settings; const out: Planned[] = [];
  const offset = (s.offset || 0) * 60000;
  for (let dd = -1; dd < 15 && out.length < maxCount; dd++) {
    const date = addDays(now, dd);
    const key = dkey(date); const d = partIndex(s, date); const part = PARTS[d];
    const ds = st.days[key] || { done: {} };
    const wins = windowsFor(s, date);
    wins.forEach((w, k) => {
      if (!w.time) return;
      const at = new Date(w.time.getTime() + offset);
      if (at <= now) return;
      if ((ds.done || {})[k]) return;
      const mins = minutesFor(part.sittings[k].w);
      out.push({ at, id: `${key}-${k}`, title: `جلسة ${w.name}: ${sitLabel(part, k)}`, body: `${PG(sitPages(part, k))}، نحو ${MN(mins)}. الحزب ${ORDINALS[d]} من التسبيع.` });
    });
  }
  return out.sort((a, b) => +a.at - +b.at).slice(0, maxCount);
}

/** Days in a row with a finished part, ending today (or yesterday while today is still open). */
export function streak(st: State, P: Plan): number {
  const full = (d: Date) => { const done = st.days[dkey(d)]?.done || {}; return [0, 1, 2, 3, 4].every((k) => done[k]); };
  let n = 0; let d = full(P.date) ? P.date : addDays(P.date, -1);
  while (n < 400 && full(d)) { n++; d = addDays(d, -1); }
  return n;
}
