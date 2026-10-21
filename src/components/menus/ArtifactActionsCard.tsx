import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { IconButton } from '../controls/IconButton';
import { classes } from '../../lib/classes';

export type ArtifactAction = { id: string; label: string; onSelect: () => void; disabled?: boolean };
export type ArtifactActionsCardProps = {
  title: string;
  subtitle?: ReactNode;
  image: string;
  actionsLabel: string;
  actions: readonly ArtifactAction[];
  active?: boolean;
  className?: string;
};
export function ArtifactActionsCard({ title, subtitle, image, actionsLabel, actions, active = true, className }: ArtifactActionsCardProps) {
  const id = useId(), root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), thumb = useRef<HTMLDivElement>(null), card = useRef<HTMLDivElement>(null), picture = useRef<HTMLImageElement>(null);
  const [open, setOpen] = useState(false), [opening, setOpening] = useState(false), [returning, setReturning] = useState(false);
  const openState = useRef(false), activeState = useRef(active), interaction = useRef(0), origin = useRef<DOMRect | null>(null), returnFrom = useRef<DOMRect | null>(null), focusFrame = useRef(0);
  const enabledButtons = () => [...(card.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
  function cancelFocus() { cancelAnimationFrame(focusFrame.current); focusFrame.current = 0; }
  function clearReturn() {
    setReturning(false); thumb.current?.style.removeProperty('--cui-thumb-from-x'); thumb.current?.style.removeProperty('--cui-thumb-from-y');
  }
  function close(restore = true, animate = true) {
    interaction.current++;
    cancelFocus();
    returnFrom.current = animate && openState.current && activeState.current ? card.current?.getBoundingClientRect() ?? null : null;
    openState.current = false; clearReturn(); setOpen(false); setOpening(false);
    if (restore) trigger.current?.focus({ preventScroll: true });
  }
  function toggle() {
    if (openState.current) return close();
    if (!activeState.current) return;
    interaction.current++;
    origin.current = thumb.current?.getBoundingClientRect() ?? null;
    returnFrom.current = null; clearReturn(); cancelFocus(); setOpening(false);
    openState.current = true; setOpen(true);
  }
  useLayoutEffect(() => {
    activeState.current = active;
    if (!active) close(false, false);
    // Activity can disconnect before an inactive setup runs. Drop the open
    // request now so retained layout effects cannot restart entry on reveal.
    return () => { activeState.current = false; close(false, false); };
  }, [active]);
  useLayoutEffect(() => {
    if (open && openState.current && activeState.current && card.current && origin.current) {
      const to = card.current.getBoundingClientRect(), from = origin.current;
      card.current.style.setProperty('--cui-card-from-x', `${from.left - to.left}px`);
      card.current.style.setProperty('--cui-card-from-y', `${from.top - to.top}px`);
      setOpening(true);
      focusFrame.current = requestAnimationFrame(() => { focusFrame.current = requestAnimationFrame(() => {
        focusFrame.current = 0;
        if (openState.current && document.activeElement === trigger.current) enabledButtons()[0]?.focus({ preventScroll: true });
      }); });
    } else if (!open && returnFrom.current && thumb.current && picture.current?.complete && picture.current.naturalWidth > 0) {
      const from = returnFrom.current, to = thumb.current.getBoundingClientRect();
      if (from.width > 0 && to.width > 0) {
        thumb.current.style.setProperty('--cui-thumb-from-x', `${from.left - to.left}px`);
        thumb.current.style.setProperty('--cui-thumb-from-y', `${from.top - to.top}px`);
        setReturning(true);
      }
      returnFrom.current = null;
    }
    return cancelFocus;
  }, [open]);
  useEffect(() => {
    const outside = (event: Event) => { if (openState.current && !root.current?.contains(event.target as Node)) close(false); };
    const leave = () => close(false, false);
    document.addEventListener('pointerdown', outside); document.addEventListener('focusin', outside); window.addEventListener('pagehide', leave);
    return () => { cancelFocus(); document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); window.removeEventListener('pagehide', leave); };
  }, []);
  function dismissKey(event: KeyboardEvent) {
    if (!openState.current || !(event.key === 'Escape' || event.key === 'ArrowLeft' || event.key === 'Enter' && event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey)) return false;
    event.preventDefault(); event.stopPropagation(); if (!event.repeat) close(); return true;
  }
  function activate(action: ArtifactAction) {
    if (action.disabled || !activeState.current || !openState.current) return;
    const current = interaction.current;
    action.onSelect();
    // Host callbacks may disconnect this menu or start another interaction.
    if (current === interaction.current && activeState.current && openState.current && root.current?.isConnected) close();
  }
  return <div ref={root} className={classes('font-cui text-cui-text', className)}>
    <div className="flex items-center gap-2.5 rounded-md bg-(--cui-menu-hover) px-2.5 py-2">
      <Icon name="File" size={20} /><span className="min-w-0 flex-1 overflow-hidden text-[13px] text-ellipsis whitespace-nowrap">{title}</span>
      <IconButton ref={trigger} aria-label={actionsLabel} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} aria-keyshortcuts="Alt+Enter" onClick={toggle} onKeyDown={event => {
        if (dismissKey(event)) return;
        if (event.key === 'Enter' && event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey) { event.preventDefault(); if (!event.repeat) toggle(); }
      }}><Icon name="DotsHorizontal" /></IconButton>
    </div>
    <div className="relative mt-3">
      <div ref={thumb} aria-hidden="true" data-open={open || undefined} data-returning={returning || undefined} className="cui-palette-thumb" onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'cui-palette-thumb-return') clearReturn(); }}>
        <img ref={picture} src={image} alt="" width={280} height={175} /><div className="cui-palette-subtitle">{subtitle}</div>
      </div>
      {open ? <div ref={card} id={id} role="menu" aria-label={actionsLabel} data-opening={opening || undefined} className="cui-palette-card" onKeyDown={event => {
        if (event.key === 'Enter' && event.repeat) { event.preventDefault(); return; }
        if (dismissKey(event) || event.altKey || event.metaKey || event.ctrlKey || event.repeat) return;
        const digit = /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : -1;
        if (digit >= 0 && actions[digit]) { event.preventDefault(); activate(actions[digit]); return; }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault(); const buttons = enabledButtons(), index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length;
          buttons[next]?.focus({ preventScroll: true });
        }
      }}>
        <img src={image} alt="" width={280} height={175} />
        <div className="cui-palette-header px-1.5 py-2"><b>{title}</b><div className="cui-palette-subtitle">{subtitle}</div></div>
        <div className="cui-palette-actions" onAnimationEnd={event => { if (event.target === event.currentTarget) setOpening(false); }}><div className="cui-palette-inner">
          {actions.map((action, index) => <button key={action.id} type="button" role="menuitem" tabIndex={-1} disabled={action.disabled} aria-keyshortcuts={index < 9 ? String(index + 1) : undefined} onClick={() => activate(action)}><span>{action.label}</span>{index < 9 ? <kbd aria-hidden="true">{index + 1}</kbd> : null}</button>)}
        </div></div>
      </div> : null}
    </div>
  </div>;
}
