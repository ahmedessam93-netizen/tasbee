// Plays the recitation on Android and iPhone (expo-audio). It keeps playing with the screen
// locked, with the ayah's name and the play and pause buttons on the lock screen.
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type PlayerEvents = { onEnd: () => void; onError: () => void; onRemote: (what: 'play' | 'pause' | 'next' | 'prev') => void; onPaused: () => void };
export type Player = { prime: () => void; play: (uri: string, title: string, artist: string) => void; pause: () => void; resume: () => void; stop: () => void; preload: (uri: string) => void; release: () => void };

export function createPlayer(ev: PlayerEvents): Player {
  let p: AudioPlayer | null = null; let ours = false; let wasPlaying = false; let watch: ReturnType<typeof setTimeout> | null = null;
  const unwatch = () => { if (watch) { clearTimeout(watch); watch = null; } };
  setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  const make = (uri: string) => {
    const pl = createAudioPlayer({ uri }, { updateInterval: 500 });
    pl.addListener('playbackStatusUpdate', (st) => {
      if (st.isLoaded) unwatch();
      if (st.didJustFinish) { wasPlaying = false; ev.onEnd(); return; }
      // a pause we did not ask for: a call, the headphones pulled out, the lock-screen button
      if (wasPlaying && !st.playing && st.isLoaded && !st.isBuffering && !ours) ev.onPaused();
      if (st.playing) { wasPlaying = true; ours = false; }
    });
    return pl;
  };
  return {
    prime() {},
    play(uri, title, artist) {
      try {
        wasPlaying = false; ours = false;
        if (!p) p = make(uri); else p.replace({ uri });
        try { p.setActiveForLockScreen(true, { title, artist, albumTitle: 'القرآن الكريم' }); } catch {}
        p.play();
        // a recording that never loads (no connection) must not leave the reader waiting forever
        unwatch(); watch = setTimeout(() => { watch = null; ev.onError(); }, 20000);
      } catch { ev.onError(); }
    },
    pause() { ours = true; wasPlaying = false; unwatch(); try { p?.pause(); } catch {} },
    resume() { try { p?.play(); } catch { ev.onError(); } },
    stop() { ours = true; wasPlaying = false; unwatch(); try { p?.pause(); p?.setActiveForLockScreen(false); } catch {} },
    preload() {},
    release() { unwatch(); try { p?.setActiveForLockScreen(false); p?.release(); } catch {} p = null; },
  };
}
