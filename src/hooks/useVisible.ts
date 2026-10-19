import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** Playback visibility only; never changes semantic visibility or focus. */
export function useVisible(ref: RefObject<Element | null>, active = true, threshold = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !active) return;
    let intersecting = false;
    const sync = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting && entry.intersectionRatio >= threshold;
      sync();
    }, { threshold });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [ref, active, threshold]);
  return active && visible;
}
