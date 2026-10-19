import { useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { classes } from '../../lib/classes';
import { Icon } from '../icons/Icon';
import { WorkingMark } from './WorkingMark';

export interface ScrollFollowerProps extends Omit<ComponentPropsWithoutRef<'div'>, 'aria-label'> {
  label: string;
  returnLabel: string;
  busy?: boolean;
  active?: boolean;
  followContent?: boolean;
  resetKey?: string | number;
  height?: number;
}

/** Content is supplied by the host. It never schedules or appends sample text. */
export function ScrollFollower({ label, returnLabel, busy = false, active = true, followContent = true, resetKey = 0, height = 300, children, className, ...props }: ScrollFollowerProps) {
  const viewport = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null), end = useRef<HTMLSpanElement>(null);
  const pinned = useRef(true), lastTop = useRef(0), touchY = useRef<number | null>(null);
  const nearEnd = useRef(true), fadeNearEnd = useRef(true);
  const followAllowed = useRef(followContent);
  const [showReturn, setShowReturn] = useState(false), [showFade, setShowFade] = useState(false);
  function update() { setShowReturn(!pinned.current && !nearEnd.current); setShowFade(!pinned.current && !fadeNearEnd.current); }
  function follow() {
    const element = viewport.current!;
    if (pinned.current && followAllowed.current) {
      const bottom = element.scrollHeight - element.clientHeight;
      if (bottom - element.scrollTop > 2) element.scrollTop = bottom;
      lastTop.current = element.scrollTop;
    }
    update();
  }
  useLayoutEffect(() => {
    pinned.current = true; lastTop.current = 0; touchY.current = null;
    viewport.current!.scrollTop = 0; update();
  }, [resetKey]);
  useLayoutEffect(() => { followAllowed.current = followContent; if (active) follow(); }, [children, followContent, active]);
  useLayoutEffect(() => {
    if (!active) return;
    const element = viewport.current!;
    const pause = () => { pinned.current = false; update(); };
    const wheel = (event: WheelEvent) => { if (!event.ctrlKey && Math.abs(event.deltaY) > Math.abs(event.deltaX) && event.deltaY < 0 && element.scrollTop > 0) pause(); };
    const key = (event: KeyboardEvent) => { if (event.target === element && (['ArrowUp', 'PageUp', 'Home'].includes(event.key) || event.key === ' ' && event.shiftKey)) pause(); };
    const touchStart = (event: TouchEvent) => { touchY.current = event.touches[0]?.clientY ?? null; };
    const touchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (touchY.current !== null && y !== undefined && y > touchY.current && element.scrollTop > 0) pause();
      touchY.current = y ?? null;
    };
    const scroll = () => {
      const top = element.scrollTop, gap = element.scrollHeight - element.clientHeight - top;
      if (top < lastTop.current && gap > 2) pinned.current = false;
      else if (top > lastTop.current && gap <= 1) pinned.current = true;
      lastTop.current = top; update();
    };
    const resize = new ResizeObserver(follow); resize.observe(element); resize.observe(content.current!);
    const near = new IntersectionObserver(entries => { nearEnd.current = entries.at(-1)!.isIntersecting; update(); }, { root: element, rootMargin: '0px 0px 200px 0px' });
    const fade = new IntersectionObserver(entries => { fadeNearEnd.current = entries.at(-1)!.isIntersecting; update(); }, { root: element, rootMargin: '0px 0px 8px 0px' });
    near.observe(end.current!); fade.observe(end.current!);
    element.addEventListener('wheel', wheel, { passive: true }); element.addEventListener('keydown', key);
    element.addEventListener('touchstart', touchStart, { passive: true }); element.addEventListener('touchmove', touchMove, { passive: true }); element.addEventListener('scroll', scroll, { passive: true });
    return () => {
      resize.disconnect(); near.disconnect(); fade.disconnect();
      element.removeEventListener('wheel', wheel); element.removeEventListener('keydown', key);
      element.removeEventListener('touchstart', touchStart); element.removeEventListener('touchmove', touchMove); element.removeEventListener('scroll', scroll);
    };
  }, [active]);
  return <div {...props} className={classes('relative', className)}>
    <div ref={viewport} role="region" aria-label={label} tabIndex={0} style={{ height }} className="overflow-x-hidden overflow-y-auto overscroll-contain [overflow-anchor:none] [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cui-accent">
      <div ref={content} className="cui-scroll-content">{children}<span ref={end} aria-hidden="true" className="block h-px" /></div>
    </div>
    <div aria-hidden="true" data-visible={showFade || undefined} className="cui-scroll-fade pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-cui-surface to-transparent" />
    <button type="button" aria-label={returnLabel} aria-hidden={!showReturn} inert={!showReturn} tabIndex={showReturn ? 0 : -1}
      onClick={event => {
        if (document.activeElement === event.currentTarget) viewport.current!.focus({ preventScroll: true });
        pinned.current = true; viewport.current!.scrollTo({ top: viewport.current!.scrollHeight, behavior: 'instant' }); lastTop.current = viewport.current!.scrollTop; update();
      }}
      className={classes('cui-return-button group absolute bottom-5 left-1/2 inline-flex size-9 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-[.5px] border-solid border-cui-line bg-[color-mix(in_srgb,var(--cui-surface)_80%,transparent)] p-0 text-cui-text backdrop-blur-[8px] transition-opacity duration-200 ease-[ease] hover:bg-cui-surface focus-visible:outline-2 focus-visible:outline-cui-accent', showReturn ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')}>
      <span className={classes('absolute inset-0 m-auto size-5 transition-opacity duration-200 ease-[ease-out]', busy ? 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100' : 'opacity-100')}><Icon name="ArrowDown" size={20} /></span>
      {busy ? <WorkingMark key={resetKey} active={active && showReturn} fallback={<Icon name="ArrowDown" size={20} />} className="absolute inset-0 m-auto transition-opacity duration-200 ease-[ease-out] group-hover:opacity-0 group-focus-visible:opacity-0" /> : null}
    </button>
  </div>;
}
