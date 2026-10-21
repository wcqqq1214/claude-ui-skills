import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode, RefObject } from 'react';
import { classes } from '../../lib/classes';

export type TooltipTriggerProps<T extends HTMLElement = HTMLButtonElement> = Pick<HTMLAttributes<HTMLElement>, 'aria-describedby' | 'onPointerEnter' | 'onPointerLeave' | 'onFocus' | 'onBlur' | 'onKeyDown'> & { ref: RefObject<T | null> };
export type TooltipProps<T extends HTMLElement = HTMLButtonElement> = {
  content: ReactNode;
  children: (trigger: TooltipTriggerProps<T>) => ReactNode;
  overflowOnly?: boolean;
  onOverflowChange?: (truncated: boolean) => void;
  active?: boolean;
  delay?: number;
  describedBy?: string;
  className?: string;
  style?: CSSProperties;
};

/** Spread the trigger props onto a focusable element; keep its native semantics. */
export function Tooltip<T extends HTMLElement = HTMLButtonElement>({ content, children, overflowOnly = false, onOverflowChange, active = true, delay = 300, describedBy, className, style }: TooltipProps<T>) {
  const id = useId(), target = useRef<T>(null), anchor = useRef<HTMLSpanElement>(null), tip = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const deadline = useRef<number | undefined>(undefined), connection = useRef({ connected: false, active, delay, overflowOnly, probing: true });
  const requestedConfiguration = useRef({ active, delay, overflowOnly });
  const replayableFocus = useRef(false);
  const engagement = useRef({ pointer: false, focus: false, dismissed: false });
  const [open, setOpen] = useState(false), [position, setPosition] = useState<CSSProperties>({ left: 0 });
  const overflowCallback = useRef(onOverflowChange);
  const lastOverflow = useRef<boolean | undefined>(undefined);
  const lastMeasurement = useRef<string | undefined>(undefined);
  useLayoutEffect(() => { overflowCallback.current = onOverflowChange; });
  function truncated() {
    const element = target.current;
    if (!element) return false;
    const range = document.createRange(); range.selectNodeContents(element);
    const text = range.getBoundingClientRect(), box = element.getBoundingClientRect();
    return element.scrollWidth > element.clientWidth || text.right > box.right + .1 || text.left < box.left - .1;
  }
  function hide() { clearTimeout(timer.current); timer.current = undefined; deadline.current = undefined; replayableFocus.current = false; setOpen(false); }
  function schedule(at: number) {
    clearTimeout(timer.current); deadline.current = at;
    timer.current = setTimeout(() => {
      if (deadline.current !== at) return;
      timer.current = undefined; deadline.current = undefined; replayableFocus.current = false;
      const element = target.current, state = engagement.current;
      if (!connection.current.connected || !connection.current.active || !element?.isConnected || !element.getClientRects().length || state.dismissed) return;
      if (connection.current.overflowOnly && !truncated()) return;
      if (state.focus && document.activeElement === element || state.pointer && element.matches(':hover')) setOpen(true);
    }, Math.max(0, at - Date.now()));
  }
  function engage(kind: 'pointer' | 'focus', value: boolean) {
    const state = engagement.current;
    // Scroll/resize may dismiss before any engagement; a fresh entry must rearm.
    if (value && !state.pointer && !state.focus) state.dismissed = false;
    state[kind] = value;
    if (!state.pointer && !state.focus) { state.dismissed = false; hide(); return; }
    if (!value || state.dismissed || !active || overflowOnly && !truncated()) return;
    replayableFocus.current = kind === 'focus' && (!connection.current.connected || connection.current.probing);
    requestedConfiguration.current = { active, delay, overflowOnly }; schedule(Date.now() + delay);
  }
  useLayoutEffect(() => {
    const element = target.current;
    if (!element) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const range = document.createRange(); range.selectNodeContents(element);
      const text = range.getBoundingClientRect(), box = element.getBoundingClientRect();
      const measurement = JSON.stringify([element.textContent, tip.current?.textContent, element.clientWidth, element.clientHeight, element.scrollWidth, box.width, box.height, text.left - box.left, text.right - box.left]);
      // An initial observer pass or equivalent JSX content is not a dismissal.
      // Actual text/geometry changes still invalidate the displayed hint.
      if (lastMeasurement.current !== undefined && measurement !== lastMeasurement.current) hide();
      lastMeasurement.current = measurement;
      const next = truncated();
      // Notify the result, not each observer pass or new JSX content identity.
      // Store it before calling the host, which may synchronously rerender us.
      if (next !== lastOverflow.current) { lastOverflow.current = next; overflowCallback.current?.(next); }
    };
    const observer = new ResizeObserver(measure); observer.observe(element);
    const mutations = new MutationObserver(measure); mutations.observe(element, { childList: true, subtree: true, characterData: true });
    measure();
    void document.fonts?.ready.then(() => { if (!disposed) measure(); });
    return () => { disposed = true; observer.disconnect(); mutations.disconnect(); };
  }, [content, overflowOnly]);
  useLayoutEffect(() => {
    const previous = connection.current;
    const current = { connected: true, active, delay, overflowOnly, probing: true };
    connection.current = current;
    const configurationChanged = previous.active !== active || previous.delay !== delay || previous.overflowOnly !== overflowOnly;
    const freshRequest = deadline.current !== undefined && requestedConfiguration.current.active === active && requestedConfiguration.current.delay === delay && requestedConfiguration.current.overflowOnly === overflowOnly;
    if (!active || configurationChanged && !freshRequest) hide();
    else if (deadline.current !== undefined) {
      const element = target.current, state = engagement.current;
      // StrictMode probes both first mounts and Activity reconnections. Resume
      // a focus request from this connection at its original deadline, while a
      // settled connection discards old requests when Activity disconnects it.
      if (element && !state.dismissed && state.focus && document.activeElement === element) schedule(deadline.current);
      else hide();
    }
    return () => {
      current.connected = false; clearTimeout(timer.current); timer.current = undefined;
      lastMeasurement.current = undefined;
      if (!(current.probing && replayableFocus.current && deadline.current !== undefined)) {
        deadline.current = undefined; replayableFocus.current = false;
        engagement.current = { pointer: false, focus: false, dismissed: false };
      }
      setOpen(false);
    };
  }, [active, delay, overflowOnly]);
  useEffect(() => {
    const current = connection.current;
    // End the exception after this connection's StrictMode passive flush; an
    // older flush must not clear the focus request of a newer connection.
    queueMicrotask(() => { if (connection.current === current) { current.probing = false; replayableFocus.current = false; } });
  }, [active, delay, overflowOnly]);
  useEffect(() => {
    const dismiss = () => { engagement.current.dismissed = true; hide(); };
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    document.addEventListener('visibilitychange', dismiss);
    return () => {
      window.removeEventListener('scroll', dismiss, true); window.removeEventListener('resize', dismiss);
      document.removeEventListener('visibilitychange', dismiss);
    };
  }, []);
  useLayoutEffect(() => {
    if (!open || !anchor.current || !tip.current) return;
    const box = anchor.current.getBoundingClientRect(), element = tip.current;
    const scale = box.width / anchor.current.offsetWidth || 1;
    const width = element.offsetWidth * scale;
    const preferred = overflowOnly ? 0 : (box.width - width) / 2;
    const left = Math.max(8 - box.left, Math.min(preferred, innerWidth - 8 - box.left - width));
    const below = box.top < element.offsetHeight * scale + 8;
    setPosition({ left: left / scale, bottom: below ? 'auto' : 'calc(100% + 4px)', top: below ? 'calc(100% + 4px)' : 'auto', transformOrigin: below ? 'top center' : 'bottom center' });
  }, [open, content, overflowOnly]);
  return <span ref={anchor} className={classes('relative min-w-0', overflowOnly ? 'block' : 'inline-block', className)} style={style}>
    {children({ ref: target, 'aria-describedby': [describedBy, open && active ? id : undefined].filter(Boolean).join(' ') || undefined,
      onPointerEnter: () => engage('pointer', true), onPointerLeave: () => engage('pointer', false),
      onFocus: () => engage('focus', true), onBlur: () => engage('focus', false),
      onKeyDown: event => { if (event.key === 'Escape') { engagement.current.dismissed = true; hide(); } },
    })}
    <span ref={tip} id={id} role="tooltip" aria-hidden={!open || !active} data-open={open && active} className="cui-tooltip" style={position}>{content}</span>
  </span>;
}
