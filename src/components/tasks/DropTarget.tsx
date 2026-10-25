import { useLayoutEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { classes } from '../../lib/classes';
export type DropFeedbackState = 'idle' | 'off' | 'on';
export type DropTargetProps = ComponentPropsWithoutRef<'div'> & { state: DropFeedbackState; active?: boolean };

/** Visual feedback only. The host owns drag acceptance, payloads and drop effects. */
export function DropTarget({ state, active = true, children, className, ...props }: DropTargetProps) {
  const overlay = useRef<HTMLDivElement>(null), animation = useRef<Animation | null>(null), revision = useRef(0);
  useLayoutEffect(() => {
    const element = overlay.current!, current = ++revision.current;
    if (!active) { animation.current?.cancel(); animation.current = null; element.hidden = true; return; }
    if (state === 'idle') {
      if (element.hidden) return;
      const style = getComputedStyle(element), from = { opacity: style.opacity, transform: style.transform };
      animation.current?.cancel();
      const next = element.animate([from, { opacity: 0, transform: 'scale(.95)' }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
      animation.current = next;
      next.onfinish = () => { if (current !== revision.current) return; element.hidden = true; next.cancel(); animation.current = null; };
    } else {
      const visible = !element.hidden, style = animation.current ? getComputedStyle(element) : null, from = style ? { opacity: style.opacity, transform: style.transform } : null;
      animation.current?.cancel(); animation.current = null;
      element.dataset.state = state; element.hidden = false;
      // WAAPI copy of --cui-ease-out-cubic.
      if (visible && from) animation.current = element.animate([from, { opacity: 1, transform: 'scale(1)' }], { duration: 150, easing: 'cubic-bezier(.215,.61,.355,1)' });
    }
  }, [state, active]);
  useLayoutEffect(() => () => { ++revision.current; animation.current?.cancel(); animation.current = null; }, []);
  return <div {...props} className={classes('cui-drop-target font-cui', className)} data-state={active ? state : 'idle'}>{children}
    <div ref={overlay} className="cui-drop-overlay" aria-hidden="true" hidden><span className="cui-drop-ring-off" /><span className="cui-drop-ring-on" /><span className="cui-drop-glow" /></div>
  </div>;
}
