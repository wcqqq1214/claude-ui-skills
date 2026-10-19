import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons/Icon';
import { classes } from '../../lib/classes';
import { createPinnedDrag } from './pinnedDrag';

export type PinnedItem = { id: string; title: string };
export type PinnedListProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange' | 'defaultValue'> & {
  items: readonly PinnedItem[];
  onOrderChange: (ids: string[]) => void;
  label: string;
  actionsLabel: (item: PinnedItem) => string;
  menuLabel: string;
  moveUpLabel: string;
  moveDownLabel: string;
  movedLabel: (item: PinnedItem, position: number, total: number) => string;
  cancelledLabel: string;
  initialStatus?: string;
  describedBy?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  active?: boolean;
};
export function PinnedList({ items, onOrderChange, label, actionsLabel, menuLabel, moveUpLabel, moveDownLabel, movedLabel, cancelledLabel, initialStatus = '', describedBy, value, defaultValue, onValueChange, active = true, className, ...props }: PinnedListProps) {
  const [initialMessage] = useState(initialStatus);
  const [local, setLocal] = useState(defaultValue), [tabId, setTabId] = useState(items[0]?.id), [menuId, setMenuId] = useState<string | null>(null), [highlighted, setHighlighted] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<{ id: string; position: number } | 'cancelled' | null>(null), [portalStyle, setPortalStyle] = useState({ theme: 'light', direction: 'ltr' as 'ltr' | 'rtl', font: '' });
  const selected = value ?? local, menuIndex = items.findIndex(item => item.id === menuId), id = useId();
  const stage = useRef<HTMLDivElement>(null), list = useRef<HTMLOListElement>(null), menu = useRef<HTMLDivElement>(null), drag = useRef<ReturnType<typeof createPinnedDrag> | null>(null);
  const latest = useRef({ items, onOrderChange }), menuKey = useRef(menuId), keyboardMenu = useRef(false), pendingFocus = useRef<string | null>(null);
  const row = (key: string) => [...(list.current?.children ?? [])].find(node => (node as HTMLElement).dataset.pin === key) as HTMLLIElement | undefined;
  const main = (key: string) => row(key)?.querySelector<HTMLButtonElement>('.cui-pinned-main');
  const more = (key: string) => row(key)?.querySelector<HTMLButtonElement>('.cui-pinned-more');
  function close(restore = false) {
    const target = menuKey.current; menuKey.current = null; setMenuId(null); setHighlighted(null);
    if (restore && target) more(target)?.focus({ preventScroll: true });
  }
  function move(key: string, index: number) {
    const current = latest.current, item = current.items.find(item => item.id === key);
    if (!item) return;
    const next = current.items.filter(item => item.id !== key).map(item => item.id); next.splice(index, 0, key);
    current.onOrderChange(next); setAnnouncement({ id: key, position: index + 1 });
  }
  function positionMenu() {
    const element = menu.current, trigger = menuKey.current && more(menuKey.current);
    if (!element || !trigger) return;
    const anchor = trigger.getBoundingClientRect(), padding = 5, offset = 6, width = document.documentElement.clientWidth, height = document.documentElement.clientHeight;
    const rtl = getComputedStyle(stage.current!).direction === 'rtl'; element.dir = rtl ? 'rtl' : 'ltr'; element.style.removeProperty('--cui-pin-menu-available-height');
    const box = element.getBoundingClientRect(), below = height - padding - anchor.bottom - offset, above = anchor.top - offset - padding, top = box.height > below && above > below, available = Math.max(0, top ? above : below);
    element.style.setProperty('--cui-pin-menu-available-height', `${available}px`);
    const x = rtl ? anchor.left : anchor.right - box.width, y = top ? anchor.top - offset - Math.min(box.height, available) : anchor.bottom + offset;
    const ratio = window.devicePixelRatio || 1, snap = (value: number) => Math.round(value * ratio) / ratio;
    element.style.left = `${snap(Math.max(padding, Math.min(x, width - padding - box.width)))}px`; element.style.top = `${snap(Math.max(padding, y))}px`; element.dataset.side = top ? 'top' : 'bottom';
  }
  function measureTitles() {
    list.current?.querySelectorAll<HTMLElement>('.cui-pinned-title').forEach(title => { if (title.clientWidth) title.toggleAttribute('data-overflow', title.firstElementChild!.scrollWidth > title.clientWidth); });
  }
  function syncPortalStyle() {
    if (!menuKey.current || !stage.current) return;
    const theme = stage.current.closest('[data-cui-theme]')?.getAttribute('data-cui-theme') ?? 'light', style = getComputedStyle(stage.current), direction = style.direction === 'rtl' ? 'rtl' : 'ltr', font = style.fontFamily;
    setPortalStyle(previous => previous.theme === theme && previous.direction === direction && previous.font === font ? previous : { theme, direction, font });
  }
  useLayoutEffect(() => {
    latest.current = { items, onOrderChange }; menuKey.current = menuId;
    measureTitles(); positionMenu(); syncPortalStyle();
    if (pendingFocus.current) { main(pendingFocus.current)?.focus({ preventScroll: true }); pendingFocus.current = null; }
  });
  useLayoutEffect(() => {
    if (!active) { close(); return; }
    drag.current = createPinnedDrag(list.current!, stage.current!, { onMove: move, onCancel: () => setAnnouncement('cancelled'), onStart: () => close() });
    return () => { drag.current?.dispose(); drag.current = null; };
  }, [active]);
  useLayoutEffect(() => { drag.current?.cancel(); if (menuKey.current && !items.some(item => item.id === menuKey.current)) close(); }, [items]);
  useLayoutEffect(() => {
    if (!menuId || !menu.current) return;
    menu.current.querySelector('.cui-pinned-menu-scroll')!.scrollTop = 0; positionMenu();
    (keyboardMenu.current ? menu.current.querySelector<HTMLButtonElement>('button') : menu.current)?.focus({ preventScroll: true });
    const observer = new ResizeObserver(positionMenu); observer.observe(menu.current);
    // Theme providers may update DOM attributes without rerendering consumers
    // (including the demo's system-theme listener). Watch only this scope's
    // ancestors while open, never the portal that this synchronization writes.
    const inherited = new MutationObserver(() => { syncPortalStyle(); positionMenu(); });
    for (let ancestor: Element | null = stage.current; ancestor; ancestor = ancestor.parentElement) inherited.observe(ancestor, { attributes: true, attributeFilter: ['data-cui-theme', 'dir', 'class', 'style'] });
    return () => { observer.disconnect(); inherited.disconnect(); };
  }, [menuId]);
  useLayoutEffect(() => { const observer = new ResizeObserver(measureTitles); observer.observe(stage.current!); return () => observer.disconnect(); }, []);
  useEffect(() => {
    const dismiss = () => { drag.current?.cancel(); close(); };
    const reposition = () => { drag.current?.cancel(); positionMenu(); };
    const scroll = (event: Event) => { if (!menu.current?.contains(event.target as Node)) reposition(); };
    const pointer = (event: Event) => { const key = menuKey.current; if (key && !menu.current?.contains(event.target as Node) && !more(key)?.contains(event.target as Node)) close(); };
    const focus = (event: Event) => { const key = menuKey.current; if (key && !menu.current?.contains(event.target as Node) && !row(key)?.contains(event.target as Node)) close(); };
    const visibility = () => { if (document.hidden) dismiss(); };
    document.addEventListener('pointerdown', pointer, true); document.addEventListener('focusin', focus); document.addEventListener('scroll', scroll, true); document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', dismiss); window.addEventListener('resize', reposition); window.addEventListener('pagehide', dismiss);
    return () => {
      document.removeEventListener('pointerdown', pointer, true); document.removeEventListener('focusin', focus); document.removeEventListener('scroll', scroll, true); document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', dismiss); window.removeEventListener('resize', reposition); window.removeEventListener('pagehide', dismiss);
    };
  }, []);
  const moved = announcement && announcement !== 'cancelled' ? items.find(item => item.id === announcement.id) : undefined;
  const liveText = announcement === 'cancelled' ? cancelledLabel : announcement && moved ? movedLabel(moved, announcement.position, items.length) : announcement ? '' : initialMessage;
  return <div {...props} ref={stage} className={classes('cui-pinned-stage relative w-[300px] max-w-full font-cui text-cui-text', className)}>
    <ol ref={list} aria-label={label} aria-describedby={describedBy} className="cui-pinned-list m-0 flex list-none flex-col gap-px p-0" onFocus={event => { const item = (event.target as HTMLElement).closest<HTMLElement>('[data-pin]'); if (item?.dataset.pin) setTabId(item.dataset.pin); }} onKeyDown={event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.nativeEvent.isComposing) return;
      const current = (event.target as HTMLElement).closest<HTMLElement>('[data-pin]'); if (!current) return;
      const ordered = latest.current.items, index = ordered.findIndex(item => item.id === current.dataset.pin);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? ordered.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : ordered.length - 1)) % ordered.length;
        const target = main(ordered[next].id); target?.focus(); target?.scrollIntoView({ block: 'nearest' });
      } else if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const rtl = getComputedStyle(stage.current!).direction === 'rtl', toward = event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
        const target = toward ? more(current.dataset.pin!) : main(current.dataset.pin!);
        if (target !== document.activeElement) { event.preventDefault(); target?.focus(); }
      }
    }}>
      {items.map(item => <li key={item.id} data-pin={item.id} data-selected={selected === item.id || undefined} data-menu-open={menuId === item.id || undefined} className="cui-pinned-row">
        <button type="button" className="cui-pinned-main" tabIndex={item.id === (items.some(option => option.id === tabId) ? tabId : items[0]?.id) ? 0 : -1} aria-current={selected === item.id ? 'page' : undefined} onClick={() => { if (value === undefined) setLocal(item.id); onValueChange?.(item.id); }}><span className="cui-pinned-title"><span>{item.title}</span></span></button>
        <button type="button" className="cui-pinned-more" tabIndex={-1} disabled={items.length < 2} aria-label={actionsLabel(item)} aria-haspopup="menu" aria-expanded={menuId === item.id} aria-controls={menuId === item.id ? id : undefined} onClick={event => {
          if (!active) return;
          drag.current?.cancel(); if (menuKey.current === item.id) return close(true);
          keyboardMenu.current = event.detail === 0; setHighlighted(null); menuKey.current = item.id; setMenuId(item.id);
        }} onKeyDown={event => { if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault(); }}><Icon name="DotsVertical" /></button>
      </li>)}
    </ol>
    <p role="status" aria-live="polite" className="mt-4 mb-0 min-h-[1.5em] text-xs text-cui-secondary">{liveText}</p>
    {menuId && menuIndex >= 0 ? createPortal(<div data-cui-theme={portalStyle.theme} dir={portalStyle.direction} style={{ fontFamily: portalStyle.font }}>
      <div ref={menu} id={id} role="menu" tabIndex={-1} aria-label={menuLabel} className="cui-pinned-menu" onPointerLeave={event => { if (event.pointerType !== 'touch') { setHighlighted(null); menu.current?.focus({ preventScroll: true }); } }} onPointerMove={event => {
        if (!(event.target as HTMLElement).closest('button') && !event.buttons && event.pointerType !== 'touch') { setHighlighted(null); menu.current?.focus({ preventScroll: true }); }
      }} onKeyDown={event => {
        if (event.nativeEvent.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
        if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault();
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
        else if (event.key === 'Tab') close(true);
        else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault(); const buttons = [...menu.current!.querySelectorAll<HTMLButtonElement>('button')], index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : index < 0 ? (event.key === 'ArrowDown' ? 0 : buttons.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length;
          buttons[next]?.focus();
        }
      }}><div className="cui-pinned-menu-scroll">
        {[-1, 1].filter(delta => menuIndex + delta >= 0 && menuIndex + delta < items.length).map(delta => <button key={delta} type="button" role="menuitem" tabIndex={-1} data-highlighted={highlighted === delta || undefined} onFocus={() => setHighlighted(delta)} onPointerMove={event => { if (event.pointerType !== 'touch' && !event.buttons && document.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true }); }} onClick={() => { const key = menuId; pendingFocus.current = key; close(); move(key, menuIndex + delta); }}><Icon name={delta < 0 ? 'ArrowUp' : 'ArrowDown'} /><span>{delta < 0 ? moveUpLabel : moveDownLabel}</span></button>)}
      </div></div>
    </div>, document.body) : null}
  </div>;
}
