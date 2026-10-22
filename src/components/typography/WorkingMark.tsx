import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useVisible } from '../../hooks/useVisible';
import { classes } from '../../lib/classes';

/** The authored default loop only. Activity entry/exit sheets belong to StatusMark. */
export function WorkingMark({ active = true, fallback = null, className, ...props }: Omit<ComponentPropsWithoutRef<'span'>, 'children'> & { active?: boolean; fallback?: ReactNode }) {
  const root = useRef<HTMLSpanElement>(null), image = useRef<HTMLImageElement>(null);
  const animation = useRef<Animation | null>(null);
  const pageActive = useRef(true);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [sheet, setSheet] = useState<string>();
  const visible = useVisible(root, active);
  useEffect(() => {
    // Keep SSR and the first client render identical; the server module URL is a file URL.
    setSheet(new URL('../../assets/status/default-loop.webp', import.meta.url).href);
  }, []);
  useEffect(() => {
    if (!sheet) return;
    let disposed = false;
    image.current?.decode().then(() => { if (!disposed) setReady(true); }, () => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, [sheet]);
  useEffect(() => {
    // Retained Activity effects may have missed pageshow while disconnected.
    pageActive.current = true;
    return () => { animation.current?.cancel(); animation.current = null; };
  }, []);
  const syncPlayback = useCallback(() => {
    if (!ready || !image.current || !pageActive.current) return;
    if (!visible || document.hidden) { animation.current?.pause(); return; }
    if (!animation.current) animation.current = image.current.animate(Array.from({ length: 40 }, (_, frame) => ({ transform: `translateY(-${frame * 20}px)` })), {
      duration: 40 * 33.3333, iterations: Infinity, easing: 'steps(40, jump-none)',
    });
    else animation.current.play();
  }, [ready, visible]);
  useEffect(() => {
    const hide = () => { pageActive.current = false; animation.current?.cancel(); animation.current = null; };
    const show = () => { pageActive.current = true; syncPlayback(); };
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', show);
    syncPlayback();
    return () => { window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show); };
  }, [syncPlayback]);
  return <span {...props} ref={root} aria-hidden="true" className={classes('inline-block size-5 shrink-0 overflow-clip', className)}>
    {!ready ? fallback : null}
    {failed ? null : <img ref={image} src={sheet} alt="" width="20" height="800" style={{ display: ready ? 'block' : 'none' }} className="block h-[800px] max-h-none w-5 max-w-none" />}
  </span>;
}
