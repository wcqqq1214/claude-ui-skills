import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { classes } from '../../lib/classes';
export interface TaskCardItem { id: string; title: string; status: 'done' | 'stopped' | 'failed'; statusLabel: string; detail: ReactNode }
export interface TaskCardsProps { items: readonly TaskCardItem[]; label: string; value?: string | null; defaultValue?: string | null; onValueChange?(id: string | null): void; className?: string }
export function TaskCards({ items, label, value, defaultValue = null, onValueChange, className }: TaskCardsProps) {
  const [local, setLocal] = useState(defaultValue), id = useId(), root = useRef<HTMLDivElement>(null);
  const selected = items.find(item => item.id === (value === undefined ? local : value));
  if (value === undefined && local && !selected) setLocal(null);
  return <div className={classes('font-cui', className)}>
    <div ref={root} role="group" aria-label={label} className="cui-task-grid">{items.map((item, index) => <button key={item.id} type="button" id={`${id}-${index}`} className="cui-task-card cursor-pointer font-cui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cui-accent" aria-expanded={selected?.id === item.id} aria-controls={`${id}-detail`} onClick={() => {
      const next = selected?.id === item.id ? null : item.id; if (value === undefined) setLocal(next); onValueChange?.(next);
    }} onKeyDown={event => {
      if (event.altKey || event.metaKey || event.ctrlKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); const buttons = [...root.current!.querySelectorAll('button')], rtl = getComputedStyle(root.current!).direction === 'rtl', forward = event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
      const next = buttons[(index + (forward ? 1 : buttons.length - 1)) % buttons.length]; next?.focus({ preventScroll: true }); next?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }}><span className="cui-task-title-row"><span className={classes('cui-task-status-icon', item.status)} aria-hidden="true">{item.status === 'done' ? '✓' : null}</span><span className="cui-task-title">{item.title}</span></span><span className="cui-task-status-row"><span className="cui-task-status-label">{item.statusLabel}</span></span></button>)}</div>
    <div id={`${id}-detail`} className="cui-task-detail" role="region" aria-labelledby={selected ? `${id}-${items.indexOf(selected)}` : undefined} hidden={!selected}>{selected?.detail}</div>
  </div>;
}
