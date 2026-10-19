import { useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useVisible } from '../../hooks/useVisible';
import { classes } from '../../lib/classes';

const sheet = new URL('../../assets/status/default-loop.webp', import.meta.url).href;

/** The authored default loop only. Activity entry/exit sheets belong to StatusMark. */
export function WorkingMark({ active = true, fallback = null, className, ...props }: Omit<ComponentPropsWithoutRef<'span'>, 'children'> & { active?: boolean; fallback?: ReactNode }) {
  const root = useRef<HTMLSpanElement>(null), image = useRef<HTMLImageElement>(null);
  const animation = useRef<Animation | null>(null);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const visible = useVisible(root, active);
  useEffect(() => {
    let disposed = false;
    image.current?.decode().then(() => { if (!disposed) setReady(true); }, () => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, []);
  useEffect(() => {
    if (!ready || !image.current) return;
    const playback = image.current.animate(Array.from({ length: 40 }, (_, frame) => ({ transform: `translateY(-${frame * 20}px)` })), {
      duration: 40 * 33.3333, iterations: Infinity, easing: 'steps(40, jump-none)',
    });
    playback.pause(); animation.current = playback;
    return () => { playback.cancel(); animation.current = null; };
  }, [ready]);
  useEffect(() => { if (visible) animation.current?.play(); else animation.current?.pause(); }, [ready, visible]);
  return <span {...props} ref={root} aria-hidden="true" className={classes('inline-block size-5 shrink-0 overflow-clip', className)}>
    {failed ? fallback : <img ref={image} src={sheet} alt="" width="20" height="800" className="block h-[800px] max-h-none w-5 max-w-none" />}
  </span>;
}
