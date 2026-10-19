import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { classes } from '../../lib/classes';
import { Icon } from '../icons/Icon';
import { IconButton } from '../controls/IconButton';

export interface TableColumn { key: string; header: ReactNode; rowHeader?: boolean }
export interface TableRow { key: string; cells: Readonly<Record<string, ReactNode>> }
export interface ExpandableTableProps {
  columns: readonly TableColumn[];
  rows: readonly TableRow[];
  label: string;
  expandLabel: string;
  closeLabel: string;
  minWidth?: number;
  className?: string;
  active?: boolean;
}

/** Data cells are rendered twice only while the expanded native dialog is open. */
export function ExpandableTable({ columns, rows, label, expandLabel, closeLabel, minWidth = 720, className, active = true }: ExpandableTableProps) {
  const viewport = useRef<HTMLDivElement>(null), table = useRef<HTMLTableElement>(null), dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const [overflowing, setOverflowing] = useState(false), [open, setOpen] = useState(false);
  const titleId = useId();
  useLayoutEffect(() => {
    const measure = () => setOverflowing(viewport.current!.scrollWidth > viewport.current!.clientWidth + 3);
    const observer = new ResizeObserver(measure);
    observer.observe(viewport.current!); observer.observe(table.current!); measure();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!active) { dialog.current?.close(); setOpen(false); }
  }, [active]);
  useEffect(() => {
    if (open && active) dialog.current?.showModal();
  }, [open, active]);
  function content(expanded = false) {
    return <table ref={expanded ? undefined : table} style={{ minWidth }} className="w-full border-collapse text-left text-[.9375em] leading-[1.5] tabular-nums lining-nums">
      <thead><tr>{columns.map(column => <th key={column.key} scope="col">{column.header}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.key}>{columns.map(column => column.rowHeader
        ? <th key={column.key} scope="row">{row.cells[column.key]}</th>
        : <td key={column.key}>{row.cells[column.key]}</td>)}</tr>)}</tbody>
    </table>;
  }
  return <div className={classes('min-w-0', className)}>
    <div className="mb-3 flex min-h-8 flex-wrap items-center justify-between gap-3"><span className="font-cui text-[13px] font-(--cui-medium)">{label}</span>
      <button ref={trigger} type="button" hidden={!overflowing} onClick={() => setOpen(true)} className="cursor-pointer rounded-md border-0 bg-cui-segment-track px-2.5 py-1.5 font-cui text-xs text-cui-text focus-visible:outline-2 focus-visible:outline-cui-accent">{expandLabel}</button></div>
    <div ref={viewport} role="region" aria-label={label} tabIndex={0} data-overflowing={overflowing || undefined} className="cui-table relative max-w-full overflow-auto rounded-lg border border-solid border-cui-line bg-cui-surface font-cui-serif text-[15px] focus-visible:outline-2 focus-visible:outline-cui-accent">{content()}</div>
    <dialog ref={dialog} aria-labelledby={titleId} className="cui-table-dialog" onClose={() => { setOpen(false); if (active && trigger.current?.offsetParent) trigger.current.focus(); }}>
      <header className="mb-3 flex items-center justify-between gap-4"><h2 id={titleId} className="m-0 font-cui text-base font-(--cui-medium)">{label}</h2><IconButton aria-label={closeLabel} onClick={() => dialog.current?.close()}><Icon name="X" /></IconButton></header>
      {open ? <div className="cui-table max-w-full overflow-auto rounded-lg border border-solid border-cui-line bg-cui-surface font-cui-serif text-[15px]">{content(true)}</div> : null}
    </dialog>
  </div>;
}
