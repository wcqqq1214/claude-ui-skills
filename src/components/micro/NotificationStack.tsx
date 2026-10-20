import { useCallback, useId, useImperativeHandle, useLayoutEffect, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, Ref, RefObject } from 'react';
import { Icon } from '../icons/Icon';
import { classes } from '../../lib/classes';

export type NotificationInput = {
  message: ReactNode;
  /** Reuse a non-exiting entry and increment its count. */
  key?: string;
  action?: { label: ReactNode; onClick: () => void };
  /** Milliseconds; null persists. Default: 6000, or null when an action exists. */
  duration?: number | null;
};
export type NotificationStackHandle = {
  notify: (notice: NotificationInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};
export type NotificationStackProps = {
  ref?: Ref<NotificationStackHandle>;
  dismissLabel: string;
  label?: string;
  mode?: 'stack' | 'single';
  defaultNotices?: readonly NotificationInput[];
  renderMessage?: (message: ReactNode, count: number) => ReactNode;
  fallbackFocus?: RefObject<HTMLElement | null>;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
  empty?: ReactNode;
};
type Notice = NotificationInput & { id: string; count: number; expires: number | null; exiting: boolean };
const noNotices: readonly NotificationInput[] = [];
function expiry(notice: NotificationInput) {
  const duration = notice.duration === undefined ? notice.action ? null : 6000 : notice.duration;
  return duration === null ? null : Date.now() + Math.max(0, duration);
}

/** Local notifications; no provider, global singleton, portal or demo dependency. */
export function NotificationStack({ ref, dismissLabel, label, mode = 'stack', defaultNotices = noNotices, renderMessage, fallbackFocus, active = true, className, style, empty }: NotificationStackProps) {
  const prefix = useId(), serial = useRef(defaultNotices.length);
  const [items, setItems] = useState<Notice[]>(() => defaultNotices.map((notice, index) => ({ ...notice, id: `${prefix}-${index}`, count: 1, expires: expiry(notice), exiting: false })));
  // Synchronous event snapshot allows notify() calls in one batch without lost entries.
  const snapshot = useRef(items), root = useRef<HTMLDivElement>(null), returnFocus = useRef<Element | null>(null), alive = useRef(true);
  const [frontHeight, setFrontHeight] = useState(0);
  const commit = useCallback((next: Notice[]) => { snapshot.current = next; setItems(next); }, []);
  const focusedId = () => root.current?.querySelector<HTMLElement>('[data-cui-notice]:focus-within')?.dataset.cuiNotice;
  const dismiss = useCallback((id: string) => {
    const item = snapshot.current.find(item => item.id === id);
    if (!alive.current || !item || item.exiting) return;
    if (focusedId() === id) returnFocus.current = document.activeElement;
    commit(snapshot.current.map(item => item.id === id ? { ...item, exiting: true } : item));
  }, [commit]);
  const remove = useCallback((id: string) => {
    // The card owns cancellation of its exit completion. Its reconnecting
    // layout effect can finish before this parent's effects reconnect.
    commit(snapshot.current.filter(item => item.id !== id || !item.exiting));
  }, [commit]);
  const notify = useCallback((input: NotificationInput) => {
    const current = snapshot.current;
    const existing = mode === 'single' ? current[0] : input.key === undefined ? undefined : current.find(item => item.key === input.key && !item.exiting);
    const item: Notice = { ...input, id: existing?.id ?? `${prefix}-${serial.current++}`, count: existing && mode !== 'single' ? existing.count + 1 : 1, expires: expiry(input), exiting: false };
    if (!alive.current) return item.id;
    if (mode === 'single') commit([item]);
    else if (focusedId()) commit(existing ? current.map(value => value.id === item.id ? item : value) : [...current, item]);
    else commit([item, ...current.filter(value => value.id !== item.id)]);
    return item.id;
  }, [commit, mode, prefix]);
  // A callback ref or a host layout effect may notify as soon as the handle is
  // attached, including an Activity reconnection. Invalidate old handles during
  // layout cleanup so a real unmount still rejects later imperative calls.
  useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useImperativeHandle(ref, () => ({ notify, dismiss, clear: () => { for (const item of snapshot.current) dismiss(item.id); } }), [notify, dismiss]);
  useEffect(() => {
    const timers = items.filter(item => !item.exiting && item.expires !== null).map(item => setTimeout(() => {
      // A host can refresh this ID before passive cleanup cancels the old
      // timer. Only the notice that registered this deadline may expire.
      if (snapshot.current.includes(item)) dismiss(item.id);
    }, Math.max(0, item.expires! - Date.now())));
    return () => timers.forEach(clearTimeout);
  }, [items, dismiss]);
  const front = items.find(item => !item.exiting);
  useLayoutEffect(() => {
    if (!front || !root.current) { if (!items.length) setFrontHeight(0); return; }
    const element = [...root.current.querySelectorAll<HTMLElement>('[data-cui-notice]')].find(element => element.dataset.cuiNotice === front.id)!;
    const content = element.firstElementChild as HTMLElement;
    const measure = () => setFrontHeight(content.offsetHeight);
    const observer = new ResizeObserver(measure); observer.observe(content); measure();
    return () => observer.disconnect();
  }, [front?.id, items.length]);
  useLayoutEffect(() => {
    if (!returnFocus.current) return;
    if (!active) { returnFocus.current = null; return; }
    let frame = 0;
    const restore = () => {
      if (!returnFocus.current) return;
      // Do not steal focus if the user moved elsewhere during the reveal.
      if (document.activeElement !== returnFocus.current && document.activeElement !== document.body) { returnFocus.current = null; return; }
      const target = root.current?.querySelector<HTMLElement>('[data-cui-notice]:not([inert]) button') ?? fallbackFocus?.current;
      target?.focus({ preventScroll: true });
      if (!target || document.activeElement === target) returnFocus.current = null;
    };
    restore();
    // The new front can still be visibility:hidden at the zero-time edge of
    // its reveal transition. Retry after styles advance, without delaying exit.
    frame = requestAnimationFrame(() => { restore(); if (returnFocus.current) frame = requestAnimationFrame(restore); });
    return () => cancelAnimationFrame(frame);
  }, [items, active, fallbackFocus]);
  let visibleIndex = 0;
  return <div ref={root} role={label ? 'region' : undefined} aria-label={label} aria-hidden={!active || undefined} inert={!active} className={classes('relative w-[360px] max-w-full font-cui', className)} style={{ ...style, height: items.length ? frontHeight : undefined }}>
    {!items.length ? empty : null}
    {items.map((item, index) => {
      const layer = item.exiting ? index : visibleIndex++;
      return <NotificationCard key={item.id} item={item} layer={layer} zIndex={items.length - index} height={frontHeight} dismissLabel={dismissLabel} active={active} onDismiss={dismiss} onExited={remove}>
        {renderMessage ? renderMessage(item.message, item.count) : <>{item.message}{item.count > 1 ? ` (×${item.count})` : null}</>}
      </NotificationCard>;
    })}
  </div>;
}

function NotificationCard({ item, layer, zIndex, height, dismissLabel, active, onDismiss, onExited, children }: {
  item: Notice; layer: number; zIndex: number; height: number; dismissLabel: string; active: boolean;
  onDismiss: (id: string) => void; onExited: (id: string) => void; children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null), [entering, setEntering] = useState(true);
  useLayoutEffect(() => { void root.current!.offsetHeight; setEntering(false); }, []);
  useLayoutEffect(() => {
    if (!item.exiting) return;
    let cancelled = false;
    const element = root.current!;
    void element.offsetHeight;
    async function finish() {
      // New stack positions can replace the transform during the opacity exit.
      while (!cancelled) {
        const animations = element.getAnimations();
        if (!animations.length) break;
        await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
      }
      if (!cancelled) onExited(item.id);
    }
    void finish();
    return () => { cancelled = true; };
  }, [item.exiting, item.id, onExited]);
  const hidden = layer > 0 || item.exiting || !active;
  return <div ref={root} role="status" aria-live={hidden || item.count > 2 ? 'off' : 'polite'} aria-atomic="true" aria-hidden={hidden} inert={hidden}
    data-cui-notice={item.id} data-starting={entering || undefined} data-ending={item.exiting || undefined} data-limited={layer >= 3 || undefined} data-behind={layer > 0 || undefined}
    className="cui-notice" style={{ '--cui-toast-index': layer, zIndex } as CSSProperties}>
    <div className="cui-notice-content" style={{ height: layer > 0 && !item.exiting && height ? height : undefined }}>
      <span aria-hidden="true" className="size-5 shrink-0 text-cui-secondary"><Icon name="Info" size={20} /></span>
      <div className="min-w-0 flex-1 text-pretty wrap-break-word"><div className="m-0 text-[inherit] leading-[inherit] font-medium">{children}</div>
        {item.action ? <div className="mt-2"><button type="button" onClick={() => { item.action!.onClick(); onDismiss(item.id); }} className="cursor-pointer whitespace-nowrap rounded border-0 bg-transparent px-1.5 py-px font-[inherit] text-[11px] text-[var(--cui-clay)] focus-visible:outline-2 focus-visible:outline-cui-accent">{item.action.label}</button></div> : null}
      </div>
      <button type="button" aria-label={dismissLabel} onClick={() => onDismiss(item.id)} className="cui-notice-dismiss box-border -mt-0.5 -mr-1 -mb-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-1 text-inherit focus-visible:outline-2 focus-visible:outline-cui-accent"><Icon name="X" size={16} /></button>
    </div>
  </div>;
}
