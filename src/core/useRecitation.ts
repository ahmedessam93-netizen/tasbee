// The listening session of the reader: which ayah is being recited, what comes after it,
// and the ways of repeating for memorizing.
import { useCallback, useEffect, useRef, useState } from 'react';
import { localUri } from './offline';
import { createPlayer, Player } from './player';
import { fileOf, Key, labelOf, next, opening, order, prev, RECITER, same, urlOf } from './recite';

/** on: straight through. ayah: the same ayah again and again. range: a run of ayahs again and again. */
export type Repeat = { kind: 'on' } | { kind: 'ayah' } | { kind: 'range'; from: Key; to: Key };
type Opts = {
  /** the last ayah to recite before stopping (the end of the sitting), or null to go on */
  until: (k: Key) => Key | null;
  /** called as each ayah begins, so the page can follow */
  onAyah: (k: Key) => void;
  /** called when the recitation reaches its end by itself */
  onDone: () => void;
};

export function useRecitation(opts: Opts) {
  const [cur, setCur] = useState<Key | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [repeat, setRepeatState] = useState<Repeat>({ kind: 'on' });
  const curRef = useRef<Key | null>(null); const repRef = useRef<Repeat>({ kind: 'on' }); const optsRef = useRef(opts); optsRef.current = opts;
  const player = useRef<Player | null>(null);
  const api = useRef<{ advance: () => void; toggle: () => void; skip: (d: 1 | -1) => void }>({ advance: () => {}, toggle: () => {}, skip: () => {} });

  const get = () => {
    if (!player.current) {
      player.current = createPlayer({
        onEnd: () => api.current.advance(),
        onError: () => { setError(true); setPlaying(false); },
        onPaused: () => setPlaying(false),
        onRemote: (w) => { if (w === 'play' || w === 'pause') api.current.toggle(); else api.current.skip(w === 'next' ? 1 : -1); },
      });
    }
    return player.current;
  };
  const playKey = useCallback(async (k: Key) => {
    curRef.current = k; setCur(k); setError(false); setPlaying(true);
    if (k.a > 0 || k.s === 1) optsRef.current.onAyah(k); else optsRef.current.onAyah({ s: k.s, a: 0 });
    const uri = (await localUri(fileOf(k))) || urlOf(k);
    if (!same(curRef.current, k)) return;            // the reader moved on while we looked
    const pl = get(); pl.play(uri, labelOf(k), RECITER.name);
    // have the next ayah on its way, so one follows the other without a wait
    const n = repRef.current.kind === 'ayah' ? null : next(k); if (n) { const kept = await localUri(fileOf(n)); if (!kept) pl.preload(urlOf(n)); }
  }, []);
  const stop = useCallback(() => {
    curRef.current = null; setCur(null); setPlaying(false); setError(false);
    repRef.current = { kind: 'on' }; setRepeatState({ kind: 'on' });
    player.current?.stop();
  }, []);

  api.current.advance = () => {
    const k = curRef.current; if (!k) return;
    const r = repRef.current;
    if (r.kind === 'ayah') { playKey(k); return; }
    if (r.kind === 'range') { const n = order(k) >= order(r.to) ? r.from : next(k); playKey(n || r.from); return; }
    const end = optsRef.current.until(k); const n = next(k);
    if (!n || (end && order(k) >= order(end))) { stop(); optsRef.current.onDone(); return; }
    playKey(n);
  };
  api.current.toggle = () => {
    const k = curRef.current; if (!k) return;
    if (playing && !error) { player.current?.pause(); setPlaying(false); return; }
    if (error) { playKey(k); return; }
    get().resume(); setPlaying(true);
  };
  api.current.skip = (d) => { const k = curRef.current; if (!k) return; const n = d === 1 ? next(k) : prev(k); if (n) playKey(n); };

  /** Start from this ayah (with the basmala, when it opens a surah). Must be called from a touch. */
  const start = useCallback((k: Key, rep?: Repeat) => {
    get().prime();
    const r = rep || { kind: 'on' as const }; repRef.current = r; setRepeatState(r);
    playKey(r.kind === 'on' ? opening(k) : k);
  }, [playKey]);
  const setRepeat = useCallback((r: Repeat) => { repRef.current = r; setRepeatState(r); }, []);
  const toggle = useCallback(() => api.current.toggle(), []);
  const skip = useCallback((d: 1 | -1) => api.current.skip(d), []);

  useEffect(() => () => { player.current?.release(); player.current = null; }, []);
  return { cur, playing, error, repeat, start, stop, toggle, skip, setRepeat };
}
