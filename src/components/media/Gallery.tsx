import { useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { CSSProperties, Ref } from 'react';
import { classes } from '../../lib/classes';
import { Icon } from '../icons/Icon';
import { createGalleryInteraction } from './galleryInteraction';
import type { GalleryState } from './galleryInteraction';

export interface GalleryItem { id: string; src: string; thumbnailSrc?: string; alt: string; filename: string }
export interface GalleryLabels {
  dialog: string; close: string; previous: string; next: string;
  open(item: GalleryItem, index: number): string;
  zoom(item: GalleryItem, index: number): string;
  count(position: number, total: number): string;
}
export interface GalleryHandle { open(id?: string): void; close(): void }
export interface GalleryProps {
  items: readonly GalleryItem[];
  labels: GalleryLabels;
  defaultValue?: string;
  onValueChange?(id: string): void;
  onOpenChange?(open: boolean): void;
  active?: boolean;
  className?: string;
  ref?: Ref<GalleryHandle>;
}

/** Stable item IDs preserve the current image across translation and reordering. */
export function Gallery({ items, labels, defaultValue, onValueChange, onOpenChange, active = true, className, ref }: GalleryProps) {
  const dialogId = useId();
  const [state, setState] = useState<GalleryState>(() => ({ id: items.find(item => item.id === defaultValue)?.id ?? items[0]?.id ?? null, open: false, zoomed: false }));
  const dialog = useRef<HTMLDialogElement>(null), rail = useRef<HTMLDivElement>(null), viewport = useRef<HTMLDivElement>(null), header = useRef<HTMLDivElement>(null), bottom = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null), previous = useRef<HTMLButtonElement>(null), next = useRef<HTMLButtonElement>(null);
  const slides = useRef(new Map<string, HTMLDivElement>()), triggers = useRef(new Map<string, HTMLButtonElement>());
  const controller = useRef<ReturnType<typeof createGalleryInteraction> | null>(null);
  const latest = useRef({ items, active, selectedId: state.id, onValueChange, onOpenChange });
  useLayoutEffect(() => { latest.current = { items, active, selectedId: state.id, onValueChange, onOpenChange }; }, [items, active, state.id, onValueChange, onOpenChange]);
  useLayoutEffect(() => {
    // Disposal silently closes the native dialog. Activity retains React state,
    // so reconnect its presentation to the new, closed controller as well.
    setState(value => value.open || value.zoomed ? { ...value, open: false, zoomed: false } : value);
    const interaction = createGalleryInteraction({ dialog: dialog.current!, rail: rail.current!, viewport: viewport.current!, header: header.current!, bottom: bottom.current!, close: close.current!, previous: previous.current!, next: next.current!, slides: slides.current, triggers: triggers.current, initialId: latest.current.selectedId,
      items: () => latest.current.items,
      change(value, synchronous) { if (synchronous) flushSync(() => setState(value)); else setState(value); },
      selection: value => latest.current.onValueChange?.(value), opened: value => latest.current.onOpenChange?.(value),
    });
    controller.current = interaction;
    return () => { interaction.dispose(); controller.current = null; };
  }, []);
  // Item labels may change without disturbing zoom. Resource/ID changes need new geometry.
  const resources = JSON.stringify(items.map(item => [item.id, item.src]));
  useLayoutEffect(() => { controller.current?.reconcile(); }, [resources]);
  useLayoutEffect(() => { if (!active) controller.current?.reset(); }, [active]);
  function open(id?: string, trigger?: HTMLElement) { if (latest.current.active) controller.current?.open(id, trigger); }
  useImperativeHandle(ref, () => ({ open, close: () => controller.current?.close() }), []);
  const index = Math.max(0, items.findIndex(item => item.id === state.id)), selected = items[index];
  return <>
    <div className={classes('grid grid-cols-3 gap-[3px]', className)}>{items.map((item, at) => <button key={item.id} ref={element => { if (element) triggers.current.set(item.id, element); else triggers.current.delete(item.id); }} type="button" aria-label={labels.open(item, at)} aria-haspopup="dialog" aria-controls={dialogId} aria-expanded={state.open && selected?.id === item.id} onClick={event => open(item.id, event.currentTarget)} className="aspect-[4/3] min-w-0 cursor-zoom-in overflow-hidden rounded-md border-0 bg-cui-bg p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cui-accent">
      <img src={item.thumbnailSrc ?? item.src} alt={item.alt} draggable={false} className="block h-full w-full object-cover" />
    </button>)}</div>
    <dialog ref={dialog} id={dialogId} aria-label={labels.dialog} className="cui-gallery-dialog">
      <div ref={header} className="cui-gallery-header"><button ref={close} type="button" className="cui-gallery-close" aria-label={labels.close}><Icon name="X" size={16} /></button></div>
      <div ref={viewport} className="cui-gallery-viewport">
        <div ref={rail} className="cui-gallery-rail" style={{ '--cui-gallery-index': index } as CSSProperties}>{items.map((item, at) => {
          const current = at === index;
          return <div key={item.id} ref={element => { if (element) slides.current.set(item.id, element); else slides.current.delete(item.id); }} data-cui-gallery-slide={item.id} className={classes('cui-gallery-slide', current && 'current', current && state.zoomed && 'zoomed')} tabIndex={current ? 0 : -1} role={current ? 'button' : undefined} aria-label={labels.zoom(item, at)} aria-hidden={!current} aria-pressed={current ? state.zoomed : undefined}>
            <img src={item.src} alt={item.alt} draggable={false} />
          </div>;
        })}</div>
        <div className="cui-gallery-bottom-shade" />
        <div ref={bottom} className="cui-gallery-bottom">
          <div className="flex min-w-0 flex-1 items-center justify-start"><bdi className="cui-gallery-filename" translate="no" title={selected?.filename}>{selected?.filename}</bdi></div>
          <div className="cui-gallery-navigation">
            <button ref={previous} type="button" aria-label={labels.previous} aria-disabled={index === 0}><Icon name="CaretLeft" size={20} className="rtl:rotate-180" /></button>
            <span className="cui-gallery-count" aria-live="polite" aria-atomic="true">{labels.count(selected ? index + 1 : 0, items.length)}</span>
            <button ref={next} type="button" aria-label={labels.next} aria-disabled={index === items.length - 1 || !items.length}><Icon name="CaretRight" size={20} className="rtl:rotate-180" /></button>
          </div>
          <div className="min-w-0 flex-1" />
        </div>
      </div>
    </dialog>
  </>;
}
