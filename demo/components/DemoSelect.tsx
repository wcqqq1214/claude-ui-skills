import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../../src';

type Option<T extends string> = { value: T; label: string };

/** Compact demo settings picker; focus stays on its trigger while browsing. */
export function DemoSelect<T extends string>({ label, value, options, onChange, className = '', active = true }: {
  label: string; value: T; options: readonly Option<T>[]; onChange: (value: T) => void; className?: string; active?: boolean;
}) {
  const id = useId(), root = useRef<HTMLDivElement>(null), connected = useRef(false);
  const [open, setOpen] = useState(false), [cursor, setCursor] = useState(0);
  const selected = Math.max(0, options.findIndex(option => option.value === value));
  const expanded = open && active;
  useLayoutEffect(() => {
    connected.current = active;
    if (!active) setOpen(false);
    return () => { connected.current = false; setOpen(false); };
  }, [active]);
  useEffect(() => {
    if (!expanded) return;
    const dismiss = () => setOpen(false);
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) dismiss(); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('pagehide', dismiss);
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('pagehide', dismiss); };
  }, [expanded]);
  function show(index = selected) { if (connected.current) { setCursor(index); setOpen(true); } }
  function choose(index: number) {
    const option = options[index];
    if (!connected.current || !option) return;
    setOpen(false);
    if (option.value !== value) onChange(option.value);
  }
  return <div ref={root} className="demo-select" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <button type="button" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={expanded}
      aria-controls={id} aria-activedescendant={expanded ? `${id}-${cursor}` : undefined}
      className={`demo-select-trigger ${className}`} data-value={value} disabled={!active || !options.length}
      onClick={() => expanded ? setOpen(false) : show()}
      onKeyDown={event => {
        if (!connected.current) return;
        if (event.key === 'Tab') { setOpen(false); return; }
        if (event.key === 'Escape') { if (expanded) { event.preventDefault(); event.stopPropagation(); setOpen(false); } return; }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); if (expanded) choose(cursor); else show(); return;
        }
        let next: number;
        if (event.key === 'ArrowDown') next = expanded ? (cursor + 1) % options.length : selected;
        else if (event.key === 'ArrowUp') next = expanded ? (cursor + options.length - 1) % options.length : selected;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = options.length - 1;
        else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          next = options.findIndex(option => option.label.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
          if (next < 0) return;
        } else return;
        event.preventDefault(); show(next);
      }}>
      <span>{options[selected]?.label}</span><Icon name="CaretDown" size={12} />
    </button>
    <div id={id} role="listbox" aria-label={label} className="demo-select-menu" hidden={!expanded}>
      {options.map((option, index) => <button key={option.value} id={`${id}-${index}`} type="button" role="option"
        aria-selected={option.value === value} tabIndex={-1} data-value={option.value} data-highlighted={cursor === index || undefined}
        onPointerDown={event => event.preventDefault()} onPointerMove={() => setCursor(index)} onClick={() => choose(index)}>
        <span>{option.label}</span><Icon name="Check" size={16} />
      </button>)}
    </div>
  </div>;
}
