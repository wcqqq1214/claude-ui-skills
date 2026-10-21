import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { classes } from '../../lib/classes';

export type SubmenuOption = { value: string; label: string; disabled?: boolean };
export type SubmenuSelectProps = {
  label: string;
  submenuLabel: string;
  options: readonly SubmenuOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onPreviewChange?: (value: string) => void;
  renderPreview?: (preview: string | undefined, selected: string | undefined) => ReactNode;
  active?: boolean;
  className?: string;
};
export function SubmenuSelect({ label, submenuLabel, options, value, defaultValue, onValueChange, onPreviewChange, renderPreview, active = true, className }: SubmenuSelectProps) {
  const [local, setLocal] = useState(defaultValue), [level, updateLevel] = useState<0 | 1 | 2>(0), [preview, setPreview] = useState<string>();
  const selected = value ?? local, selectedOption = options.find(option => option.value === selected), id = useId();
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), owner = useRef<HTMLButtonElement>(null), submenu = useRef<HTMLDivElement>(null);
  const currentLevel = useRef<0 | 1 | 2>(0), activeState = useRef(active), interaction = useRef(0);
  const enabled = options.filter(option => !option.disabled);
  function setLevel(next: 0 | 1 | 2) { interaction.current++; currentLevel.current = next; updateLevel(next); }
  function close(restore = false) { setLevel(0); if (restore) trigger.current?.focus({ preventScroll: true }); }
  function focusSelection() {
    const buttons = [...submenu.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    (buttons.find(button => button.dataset.value === selected) ?? buttons[0])?.focus({ preventScroll: true });
  }
  function openSubmenu() { if (level === 2) focusSelection(); else setLevel(2); }
  function select(option: SubmenuOption) {
    if (option.disabled || !activeState.current || currentLevel.current !== 2) return;
    const current = interaction.current;
    if (value === undefined) setLocal(option.value);
    onValueChange?.(option.value);
    // A synchronous host update owns any dismissal and new focus it causes.
    if (current === interaction.current && activeState.current && currentLevel.current === 2 && root.current?.isConnected) close(true);
  }
  useLayoutEffect(() => {
    activeState.current = active;
    if (!active) close();
    return () => { activeState.current = false; close(); };
  }, [active]);
  useLayoutEffect(() => {
    // A reconnect can run with the old level before cleanup's state update
    // renders. Its synchronous dismissal must win before any focus is moved.
    if (!active || currentLevel.current !== level) return;
    if (level === 1) owner.current?.focus({ preventScroll: true });
    if (level === 2) focusSelection();
  }, [level]);
  useEffect(() => {
    const outside = (event: Event) => { if (!root.current?.contains(event.target as Node)) close(); };
    const leave = () => close();
    document.addEventListener('pointerdown', outside); document.addEventListener('focusin', outside); window.addEventListener('pagehide', leave);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); window.removeEventListener('pagehide', leave); };
  }, []);
  return <div ref={root} className={classes('relative min-h-[42px] font-cui text-cui-text', className)}>
    <button ref={trigger} type="button" aria-haspopup="menu" aria-expanded={level > 0} aria-controls={level ? `${id}-parent` : undefined} disabled={!enabled.length} onClick={() => level ? close(true) : setLevel(1)} onKeyDown={event => {
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setLevel(1); }
      if (event.key === 'Escape' && level) { event.preventDefault(); close(true); }
    }} className="cui-submenu-trigger inline-block cursor-pointer rounded-[7px] border border-solid border-transparent bg-cui-surface px-[13px] py-2 text-xs leading-[1.6] font-(--cui-medium) whitespace-nowrap disabled:cursor-default disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-cui-accent">{label} <span aria-hidden="true">⌄</span></button>
    {level > 0 ? <div id={`${id}-parent`} role="menu" aria-label={label} className="cui-local-menu">
      <button ref={owner} type="button" role="menuitem" tabIndex={-1} aria-haspopup="menu" aria-expanded={level === 2} aria-controls={level === 2 ? `${id}-submenu` : undefined} onClick={openSubmenu} onKeyDown={event => {
        if (event.key === 'ArrowRight') { event.preventDefault(); openSubmenu(); }
        else if (event.key === 'Escape' || event.key === 'ArrowLeft') { event.preventDefault(); close(true); }
      }}>{submenuLabel}<span>{selectedOption?.label} <span aria-hidden="true">›</span></span></button>
    </div> : null}
    {level === 2 ? <div ref={submenu} id={`${id}-submenu`} role="menu" aria-label={submenuLabel} className="cui-local-menu cui-submenu">
      {options.map(option => <button key={option.value} type="button" role="menuitemradio" tabIndex={-1} data-value={option.value} aria-checked={option.value === selected} disabled={option.disabled} onFocus={() => { setPreview(option.value); onPreviewChange?.(option.value); }} onClick={() => select(option)} onKeyDown={event => {
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault(); const buttons = [...submenu.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')], index = buttons.indexOf(event.currentTarget);
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length;
          buttons[next]?.focus({ preventScroll: true });
        } else if (event.key === 'Escape' || event.key === 'ArrowLeft') { event.preventDefault(); event.stopPropagation(); setLevel(1); }
      }}>{option.label}{option.value === selected ? <span aria-hidden="true" className="text-(--cui-clay)">✓</span> : null}</button>)}
      {renderPreview ? <div className="mt-1.5 border-0 border-t border-solid border-cui-line px-3 py-2 text-[10px] leading-[1.6] text-cui-muted">{renderPreview(preview, selected)}</div> : null}
    </div> : null}
  </div>;
}
