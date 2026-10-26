import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useVisible } from '../../src/hooks/useVisible';

/** All sample arrival timing stays in the demo. Re-entry restarts the example. */
export function useSequence(ref: RefObject<Element | null>, delays: readonly number[], active: boolean, threshold = 0) {
  const visible = useVisible(ref, active, threshold);
  const [count, setCount] = useState(0), [generation, setGeneration] = useState(0), [playing, setPlaying] = useState(false);
  const restart = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!active) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const stop = () => { timers.forEach(clearTimeout); timers = []; setPlaying(false); };
    const start = () => {
      if (document.hidden) return;
      stop(); setCount(0); setGeneration(value => value + 1); setPlaying(delays.length > 0);
      timers = delays.map((delay, index) => setTimeout(() => {
        setCount(index + 1);
        if (index === delays.length - 1) setPlaying(false);
      }, delay));
    };
    // Visibility owns automatic entry/exit playback. An explicit Replay may
    // start below the entry threshold, just as the original button did.
    restart.current = start;
    if (visible) start();
    const visibility = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', stop);
    return () => {
      restart.current = null; stop();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', stop);
    };
  }, [active, delays, visible]);
  return { count, generation, visible, playing, replay: () => restart.current?.() };
}
