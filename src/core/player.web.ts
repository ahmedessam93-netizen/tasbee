// Plays the recitation on the web (iPhone Home Screen app).
// One audio element for the whole session: the phone only lets sound start from a touch, and an
// element that was started by a touch may go on to the next ayah by itself.
export type PlayerEvents = { onEnd: () => void; onError: () => void; onRemote: (what: 'play' | 'pause' | 'next' | 'prev') => void; onPaused: () => void };
export type Player = { prime: () => void; play: (uri: string, title: string, artist: string) => void; pause: () => void; resume: () => void; stop: () => void; preload: (uri: string) => void; release: () => void };

// a moment of silence, to wake the element inside the touch that asked for sound
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export function createPlayer(ev: PlayerEvents): Player {
  const el = new Audio(); el.preload = 'auto';
  let primed = false; let ours = false;          // `ours`: we asked for the pause, not the phone
  let warm: HTMLAudioElement | null = null;
  el.addEventListener('ended', () => ev.onEnd());
  el.addEventListener('error', () => { if (el.src && !el.src.startsWith('data:')) ev.onError(); });
  el.addEventListener('pause', () => { if (!ours && !el.ended && el.src && !el.src.startsWith('data:')) ev.onPaused(); ours = false; });
  const ms: any = typeof navigator !== 'undefined' ? (navigator as any).mediaSession : null;
  if (ms) {
    try {
      ms.setActionHandler('play', () => ev.onRemote('play')); ms.setActionHandler('pause', () => ev.onRemote('pause'));
      ms.setActionHandler('nexttrack', () => ev.onRemote('next')); ms.setActionHandler('previoustrack', () => ev.onRemote('prev'));
    } catch {}
  }
  const start = () => { const pr = el.play(); if (pr && pr.catch) pr.catch((e: any) => { if (e && e.name === 'NotAllowedError') ev.onPaused(); else if (e && e.name !== 'AbortError') ev.onError(); }); };
  return {
    prime() { if (primed) return; primed = true; try { el.src = SILENCE; const pr = el.play(); if (pr && pr.catch) pr.catch(() => {}); } catch {} },
    play(uri, title, artist) {
      el.src = uri; start();
      if (ms && typeof (window as any).MediaMetadata !== 'undefined') { try { ms.metadata = new (window as any).MediaMetadata({ title, artist, album: 'القرآن الكريم' }); } catch {} }
    },
    pause() { ours = true; el.pause(); },
    resume() { start(); },
    stop() { ours = true; el.pause(); el.removeAttribute('src'); try { el.load(); } catch {} },
    preload(uri) { try { warm = new Audio(); warm.preload = 'auto'; warm.src = uri; } catch {} },
    release() { ours = true; el.pause(); el.removeAttribute('src'); warm = null; if (ms) { try { ms.metadata = null; } catch {} } },
  };
}
