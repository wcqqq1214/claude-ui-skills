import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import type { CSSProperties } from 'react';
import { Icon } from '../icons/Icon';
import { classes } from '../../lib/classes';

export type Attachment = { id: string; name: string; type?: string };
export type AttachmentListProps = {
  items: readonly Attachment[];
  label: string;
  removeLabel: (attachment: Attachment) => string;
  onRemove: (id: string) => void;
  onEmptyFocus?: () => void;
  className?: string;
};

export function AttachmentList({ items, label, removeLabel, onRemove, onEmptyFocus, className }: AttachmentListProps) {
  const instance = useId().replace(/[^a-zA-Z0-9_-]/g, ''), root = useRef<HTMLDivElement>(null);
  const latest = useRef({ onRemove, onEmptyFocus }), pending = useRef(new Set<string>()), transition = useRef<ViewTransition | null>(null), releaseKey = useRef<(() => void) | null>(null), alive = useRef(true), applying = useRef(false);
  useLayoutEffect(() => { latest.current = { onRemove, onEmptyFocus }; });
  useEffect(() => {
    alive.current = true;
    const leave = () => { transition.current?.skipTransition(); releaseKey.current?.(); };
    window.addEventListener('pagehide', leave);
    return () => { alive.current = false; leave(); pending.current.clear(); window.removeEventListener('pagehide', leave); };
  }, []);
  function guardHeldKey(key: string) {
    releaseKey.current?.();
    const repeat = (event: KeyboardEvent) => { if (event.key === key && event.repeat) { event.preventDefault(); event.stopPropagation(); } };
    const up = (event: KeyboardEvent) => { if (event.key === key) releaseKey.current?.(); };
    const release = () => { document.removeEventListener('keydown', repeat, true); document.removeEventListener('keyup', up, true); window.removeEventListener('blur', release); releaseKey.current = null; };
    releaseKey.current = release;
    document.addEventListener('keydown', repeat, true); document.addEventListener('keyup', up, true); window.addEventListener('blur', release);
  }
  function remove(item: Attachment, key?: string) {
    const tiles = [...(root.current?.querySelectorAll<HTMLElement>('[data-cui-attachment]') ?? [])];
    const tile = tiles.find(tile => tile.dataset.cuiAttachment === item.id);
    if (!tile?.isConnected || pending.current.has(item.id)) return;
    const animate = tiles.length - pending.current.size > 1;
    pending.current.add(item.id); if (key) guardHeldKey(key);
    let updated = false;
    const update = () => {
      if (updated || !alive.current) return;
      updated = true;
      const ownsFocus = tile.contains(document.activeElement), index = tiles.indexOf(tile);
      const next = [...tiles.slice(index + 1), ...tiles.slice(0, index).reverse()].find(candidate => !pending.current.has(candidate.dataset.cuiAttachment!));
      applying.current = true;
      try { flushSync(() => latest.current.onRemove(item.id)); }
      finally { applying.current = false; pending.current.delete(item.id); }
      if (ownsFocus) {
        const control = next?.isConnected ? next.querySelector('button') : root.current?.querySelector('button');
        if (control) control.focus({ preventScroll: true }); else latest.current.onEmptyFocus?.();
      }
    };
    transition.current?.skipTransition(); transition.current = null;
    if (!animate || document.visibilityState !== 'visible' || typeof document.startViewTransition !== 'function' || !CSS.supports('selector(:active-view-transition-type(cui-attachments))')) return update();
    try {
      const current = document.startViewTransition({ types: ['cui-attachments'], update });
      transition.current = current;
      void current.ready.catch(() => {}); void current.updateCallbackDone.catch(update);
      void current.finished.catch(() => {}).finally(() => { if (transition.current === current) transition.current = null; });
    } catch { update(); }
  }
  // Adding/replacing host items can interrupt snapshots, without cancelling removal updates.
  useLayoutEffect(() => { if (!applying.current) transition.current?.skipTransition(); }, [items]);
  return <div ref={root} role="group" aria-label={label} className={classes('cui-composer-attachments flex flex-wrap gap-1.5 px-1 pt-2 pb-2.5 empty:hidden', className)}>
    {items.map(item => <div key={item.id} data-cui-attachment={item.id} style={{ '--cui-attachment-name': `cui-attachment-${instance}-${Array.from(item.id).map(character => character.codePointAt(0)!.toString(16)).join('-')}` } as CSSProperties} className="cui-composer-attachment relative flex box-border size-[120px] flex-[0_0_120px] origin-left flex-col justify-between rounded-lg p-2.5" onKeyDown={event => {
      if (!['Delete', 'Backspace', 'Enter'].includes(event.key) || event.nativeEvent.isComposing || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault(); event.stopPropagation(); remove(item, event.key);
    }}>
      <span title={item.name} translate="no" className="line-clamp-4 text-xs leading-[17px] wrap-anywhere">{item.name}</span>
      <span translate="no" className="text-[10px] text-cui-secondary">{item.type ?? item.name.split('.').pop()?.toUpperCase()}</span>
      <button type="button" className="cui-composer-attachment-remove absolute -top-2 -end-2 inline-flex size-5 cursor-pointer items-center justify-center rounded-full border-0 p-0 text-cui-secondary hover:text-cui-text focus-visible:outline-2 focus-visible:outline-cui-accent" aria-label={removeLabel(item)} title={removeLabel(item)} onClick={() => remove(item)}><Icon name="X" size={12} /></button>
    </div>)}
  </div>;
}
