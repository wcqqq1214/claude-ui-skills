import { useId, useLayoutEffect, useRef, useState } from 'react';
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
  heading?: ReactNode;
  dialogTitle?: ReactNode;
  expandLabel: string;
  closeLabel: string;
  minWidth?: number;
  className?: string;
  active?: boolean;
}

/** Data cells are rendered twice only while the expanded native dialog is open. */
export function ExpandableTable({ columns, rows, label, heading = label, dialogTitle = label, expandLabel, closeLabel, minWidth = 720, className, active = true }: ExpandableTableProps) {
  const viewport = useRef<HTMLDivElement>(null), table = useRef<HTMLTableElement>(null), dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const [overflowing, setOverflowing] = useState(false), [open, setOpen] = useState(false);
  const nativeOpened = useRef(false);
  const titleId = useId();
  useLayoutEffect(() => {
    const measure = () => setOverflowing(viewport.current!.scrollWidth > viewport.current!.clientWidth + 3);
    const observer = new ResizeObserver(measure);
    observer.observe(viewport.current!); observer.observe(table.current!); measure();
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const element = dialog.current!;
    if (!active) { nativeOpened.current = false; element.close(); if (open) setOpen(false); return; }
    if (!open) return;
    nativeOpened.current = true;
    if (!element.open) element.showModal();
    return () => {
      // Activity retains the user's open intent while disconnecting effects.
      // Release the top layer now; its queued close belongs to this setup.
      nativeOpened.current = false;
      element.close();
    };
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
    <div className="mb-4 flex min-h-8 flex-wrap items-center justify-between gap-3"><span className="font-cui text-[13px] leading-[1.6] font-(--cui-medium)">{heading}</span>
      <button ref={trigger} type="button" hidden={!overflowing} onClick={() => setOpen(true)} className="cui-table-expand cursor-pointer rounded-[7px] border border-solid border-transparent bg-cui-surface px-2.5 py-[5px] font-cui text-[11px] leading-[1.6] font-(--cui-medium) text-cui-text focus-visible:outline-2 focus-visible:outline-cui-accent">{expandLabel}</button></div>
    <div ref={viewport} role="region" aria-label={label} tabIndex={0} data-overflowing={overflowing || undefined} className="cui-table relative max-w-full overflow-auto rounded-lg border border-solid border-cui-line bg-cui-surface font-cui-serif text-[15px] focus-visible:outline-2 focus-visible:outline-cui-accent">{content()}</div>
    <dialog ref={dialog} aria-labelledby={titleId} className="cui-table-dialog" onClose={event => {
      if (event.currentTarget.open || !nativeOpened.current) return;
      nativeOpened.current = false;
      setOpen(false);
      if (active && trigger.current?.offsetParent) trigger.current.focus();
    }}>
      <header className="mb-3 flex items-center justify-between gap-4"><h2 id={titleId} className="m-0 font-cui text-sm font-(--cui-bold)">{dialogTitle}</h2><IconButton aria-label={closeLabel} onClick={() => dialog.current?.close()}><Icon name="X" /></IconButton></header>
      {open ? <div className="cui-table max-w-full overflow-auto rounded-lg border border-solid border-cui-line bg-cui-surface font-cui-serif text-[15px]">{content(true)}</div> : null}
    </dialog>
  </div>;
}
