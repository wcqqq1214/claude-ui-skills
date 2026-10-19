import { useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, Ref } from 'react';
import { classes } from '../../lib/classes';
import { Icon } from '../icons/Icon';
import { createImagePreview } from './imagePreviewTransition';

export interface ImagePreviewHandle { open(): void; close(): void }
export interface ImagePreviewProps {
  src: string;
  alt: string;
  previewSrc?: string;
  previewAlt?: string;
  openLabel: string;
  dialogLabel: string;
  actionsLabel: string;
  closeLabel: string;
  /** Styling for the thumbnail image, including contain/scale-down crops. */
  thumbnailStyle?: CSSProperties;
  className?: string;
  /** Hidden chapters can cancel a preview without destroying the component. */
  active?: boolean;
  onOpenChange?(open: boolean): void;
  ref?: Ref<ImagePreviewHandle>;
}

export function ImagePreview({ src, alt, previewSrc = src, previewAlt = alt, openLabel, dialogLabel, actionsLabel, closeLabel, thumbnailStyle, className, active = true, onOpenChange, ref }: ImagePreviewProps) {
  const id = useId(), name = `cui-image-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const trigger = useRef<HTMLButtonElement>(null), origin = useRef<HTMLImageElement>(null), target = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null), closeButton = useRef<HTMLButtonElement>(null);
  const controller = useRef<ReturnType<typeof createImagePreview> | null>(null);
  const latest = useRef({ active, onOpenChange });
  const [open, setOpen] = useState(false), [coarse, setCoarse] = useState(false);
  useLayoutEffect(() => { latest.current = { active, onOpenChange }; }, [active, onOpenChange]);
  useLayoutEffect(() => {
    const next = createImagePreview({ origin: origin.current!, target: target.current!, dialog: dialog.current!, name, onChange(value) { setOpen(value); latest.current.onOpenChange?.(value); } });
    controller.current = next;
    return () => { next.dispose(); controller.current = null; };
  }, [name]);
  useLayoutEffect(() => { if (!active) controller.current?.reset(); }, [active]);
  useLayoutEffect(() => { controller.current?.refresh(); }, [src, previewSrc]);
  useLayoutEffect(() => {
    const button = trigger.current!;
    const measure = () => {
      if (button.offsetWidth > 0 && button.offsetHeight > 0) {
        button.style.setProperty('--cui-image-press-x', String(Math.max(.8, 1 - 4 / button.offsetWidth)));
        button.style.setProperty('--cui-image-press-y', String(Math.max(.8, 1 - 4 / button.offsetHeight)));
      }
    };
    const observer = new ResizeObserver(measure); observer.observe(button); measure();
    const media = matchMedia('(pointer: coarse)'), update = () => setCoarse(media.matches);
    update(); media.addEventListener('change', update);
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
  }, []);
  const show = () => { if (latest.current.active) controller.current?.setOpen(true); };
  const close = () => controller.current?.setOpen(false);
  useImperativeHandle(ref, () => ({ open: show, close }), []);
  return <>
    <button ref={trigger} type="button" aria-label={openLabel} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={show} className={classes('cui-image-origin relative isolate mx-auto block w-fit max-w-[min(100%,480px)] cursor-zoom-in rounded-[9px] border-0 bg-transparent p-0', className)}>
      <span className="cui-image-origin-body"><img ref={origin} src={src} alt={alt} style={thumbnailStyle} draggable={false} /></span>
    </button>
    <dialog ref={dialog} id={id} aria-label={dialogLabel} className="cui-image-dialog" onClick={close} onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Tab') { event.preventDefault(); closeButton.current?.focus({ preventScroll: true }); }
      else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); }
    }}>
      <div className="w-full max-w-[40rem]">
        <div className="relative mx-auto w-fit" onClick={event => event.stopPropagation()}>
          <div className="cui-image-preview-actions" role="toolbar" aria-orientation="vertical" aria-label={actionsLabel}>
            <button ref={closeButton} type="button" aria-label={closeLabel} className="cui-image-preview-close" onClick={close}>
              <span className="cui-image-preview-squish" aria-hidden="true"><span className="cui-image-preview-paint" /></span>
              <Icon name="X" size={coarse ? 20 : 16} />
            </button>
          </div>
          <div ref={target} className="cui-image-preview-surface" onClick={close}><img src={previewSrc} alt={previewAlt} draggable={false} /></div>
        </div>
      </div>
    </dialog>
  </>;
}
