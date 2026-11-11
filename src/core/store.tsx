// App state: settings + reading progress, saved on the device.
// Every change is persisted, and notifications/widgets are refreshed from the same state.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { DayState, normalize, plan, planForDay, State } from './plan';
import { refreshReminders } from './notify';
import { refreshWidgets } from './widgets';

export const STORAGE_KEY = 'tasbee.v1';
const KEEP_DAYS = 70;

export async function loadState(): Promise<State> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return normalize(raw ? JSON.parse(raw) : null);
  } catch {
    return normalize(null);
  }
}

async function persist(s: State) {
  try {
    const keys = Object.keys(s.days).sort();
    while (keys.length > KEEP_DAYS) delete s.days[keys.shift() as string];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

type Ctx = {
  state: State;
  ready: boolean;
  now: Date;
  setSettings: (patch: Partial<State['settings']>) => void;
  /** A sitting is finished; the place moves to `nextAt` (the next sitting's first page). */
  finishSitting: (dayKey: string, k: number, nextAt?: string) => void;
  /** Save the place in a day's part (a reader item key "k:page"). Saved at once. */
  setPlace: (dayKey: string, at: string) => void;
  /** Count a completed khatma once for its week. Returns true if it was newly counted. */
  countKhatma: (cycle: string) => boolean;
  setMushafPage: (p: number) => void;
  /** Mark or unmark a mushaf page to come back to. */
  toggleBookmark: (p: number) => void;
  resetDay: (dayKey: string) => void;
  viewDay: string | null;
  setViewDay: (key: string | null) => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(normalize(null));
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(new Date());
  const [viewDay, setViewDay] = useState<string | null>(null);
  const latest = useRef(state);
  const sideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSideEffects = useCallback((s: State, delay = 1500) => {
    if (sideTimer.current) clearTimeout(sideTimer.current);
    sideTimer.current = setTimeout(() => {
      refreshReminders(s).catch(() => {});
      refreshWidgets(s).catch(() => {});
    }, delay);
  }, []);

  const commit = useCallback((next: State, effectsDelay?: number) => {
    latest.current = next;
    setState(next);
    persist(next);
    scheduleSideEffects(next, effectsDelay);
  }, [scheduleSideEffects]);
  // only the place changes: save it now, without touching notifications
  const quiet = useCallback((next: State) => { latest.current = next; setState(next); persist(next); }, []);

  useEffect(() => {
    loadState().then((s) => { latest.current = s; setState(s); setReady(true); scheduleSideEffects(s, 300); });
  }, [scheduleSideEffects]);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30000);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') { setNow(new Date()); setViewDay(null); scheduleSideEffects(latest.current, 500); }
    });
    return () => { clearInterval(tick); sub.remove(); };
  }, [scheduleSideEffects]);

  const dayOf = (s: State, key: string): DayState => s.days[key] ? { ...s.days[key], done: { ...(s.days[key].done || {}) } } : { done: {} };

  const api = useMemo<Ctx>(() => ({
    state, ready, now, viewDay, setViewDay,
    setSettings: (patch) => {
      const s = latest.current;
      commit({ ...s, settings: { ...s.settings, ...patch } }, 400);
    },
    finishSitting: (key, k, nextAt) => {
      const s = latest.current; const d = dayOf(s, key);
      if (d.done[k] && (!nextAt || d.at === nextAt)) return;
      d.done[k] = 1; if (nextAt) d.at = nextAt;
      commit({ ...s, days: { ...s.days, [key]: d } }, 800);
    },
    setPlace: (key, at) => {
      const s = latest.current;
      if (s.days[key]?.at === at) return;
      const d = dayOf(s, key); d.at = at;
      quiet({ ...s, days: { ...s.days, [key]: d } });
    },
    countKhatma: (cycle) => {
      const s = latest.current;
      if (s.khatma.counted[cycle]) return false;
      commit({ ...s, khatma: { count: s.khatma.count + 1, counted: { ...s.khatma.counted, [cycle]: 1 } } }, 800);
      return true;
    },
    setMushafPage: (p) => { const s = latest.current; if (s.mushafPage !== p) quiet({ ...s, mushafPage: p }); },
    toggleBookmark: (p) => { const s = latest.current; const b = s.bookmarks || []; quiet({ ...s, bookmarks: b.includes(p) ? b.filter((x) => x !== p) : [...b, p].sort((x, y) => x - y) }); },
    resetDay: (key) => {
      const s = latest.current; const days = { ...s.days }; delete days[key];
      commit({ ...s, days }, 400);
    },
  }), [state, ready, now, viewDay, commit, quiet]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

export function usePlan() {
  const { state, now } = useStore();
  return useMemo(() => plan(state, now), [state, now]);
}

export function useViewPlan() {
  const { state, now, viewDay } = useStore();
  return useMemo(() => planForDay(state, viewDay, now), [state, now, viewDay]);
}
