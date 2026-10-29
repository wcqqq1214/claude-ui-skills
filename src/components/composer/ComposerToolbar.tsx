import { useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ComponentPropsWithoutRef, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { classes } from '../../lib/classes';

export function ComposerSurface({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={classes('cui-composer-surface cursor-text rounded-xl border-0 px-3.5 pt-3.5 pb-[9px] font-cui text-cui-text', className)} />;
}
export function ComposerPicker({ className, children, type = 'button', onPointerDownCapture, onKeyDown, ...props }: ComponentPropsWithRef<'button'>) {
  function measure(button: HTMLButtonElement) {
    const fill = button.querySelector<HTMLElement>('.cui-composer-picker-fill')!;
    const distance = Math.min(1.5, Math.max(.5, button.offsetHeight / 32));
    if (!fill.offsetWidth || !fill.offsetHeight) return;
    fill.style.setProperty('--cui-press-x', String(Math.max(.8, 1 - 2 * distance / fill.offsetWidth)));
    fill.style.setProperty('--cui-press-y', String(Math.max(.8, 1 - 2 * distance / fill.offsetHeight)));
  }
  return <button {...props} type={type} className={classes('cui-composer-picker relative isolate inline-flex min-w-0 cursor-pointer select-none items-center justify-center border-0 bg-transparent whitespace-nowrap disabled:cursor-default disabled:opacity-50', className)} onPointerDownCapture={event => { measure(event.currentTarget); onPointerDownCapture?.(event); }} onKeyDown={event => {
    if (event.key === ' ' && !event.repeat) measure(event.currentTarget);
    if ([' ', 'Enter'].includes(event.key) && event.repeat) event.preventDefault();
    onKeyDown?.(event);
  }}><span aria-hidden="true" className="cui-composer-picker-fill absolute inset-0 -z-10 rounded-[inherit]" /><span className="cui-composer-picker-content inline-flex min-w-0 items-center gap-1">{children}</span></button>;
}
export type ComposerToolbarProps = {
  projectLabel: string;
  modelLabel: string;
  modelAriaLabel?: string;
  describedBy?: string;
  onProjectClick?: () => void;
  onModelClick?: () => void;
  trailing?: ReactNode;
  className?: string;
};
const modes = ['words-and-carets', 'words', 'icons'] as const;

/** The empty-project variant; folding preserves the same project trigger node. */
export function ComposerToolbar({ projectLabel, modelLabel, modelAriaLabel, describedBy, onProjectClick, onModelClick, trailing, className }: ComposerToolbarProps) {
  const root = useRef<HTMLDivElement>(null), pickers = useRef<HTMLDivElement>(null), spacer = useRef<HTMLSpanElement>(null), label = useRef<HTMLSpanElement>(null);
  const mode = useRef(0), needs = useRef<(number | null)[]>([null, null]), seen = useRef<(string | null)[]>([null, null, null]);
  const signature = useRef(projectLabel), [renderedMode, setRenderedMode] = useState(0);
  useLayoutEffect(() => { signature.current = projectLabel; }, [projectLabel]);
  useLayoutEffect(() => {
    function measure() {
      const row = pickers.current!, space = spacer.current!, text = label.current!, host = root.current!;
      if (!row.getClientRects().length) return;
      for (let attempt = 0; attempt < 6; attempt++) {
        const current = mode.current, width = row.getBoundingClientRect().width;
        const previous = current > 0 ? needs.current[current - 1] : null;
        if (current > 0 && previous !== null && seen.current[current] === null) seen.current[current] = signature.current;
        let next = current;
        if (current < 2) {
          const required = width - space.getBoundingClientRect().width + Math.max(0, row.scrollWidth - row.clientWidth) + Math.max(0, text.scrollWidth - text.clientWidth) + 1;
          needs.current[current] = required; seen.current[current + 1] = null;
          if (required > width) next = current + 1;
        }
        if (next === current && current > 0 && (previous === null || seen.current[current] !== signature.current || previous + 2 <= width)) next = current - 1;
        if (next === current) break;
        mode.current = next; host.dataset.pickerMode = modes[next];
      }
      setRenderedMode(mode.current);
    }
    // Folding changes the observed row/spacer geometry. Apply it outside the
    // observer delivery cycle, coalescing notifications from both elements.
    let measureFrame = 0;
    const observer = new ResizeObserver(() => {
      if (!measureFrame) measureFrame = requestAnimationFrame(() => { measureFrame = 0; measure(); });
    });
    observer.observe(pickers.current!); observer.observe(spacer.current!);
    const touch = matchMedia('(pointer: coarse), (hover: none)'); touch.addEventListener('change', measure);
    let disposed = false;
    void document.fonts?.ready.then(() => { if (!disposed) measure(); });
    measure();
    return () => { disposed = true; observer.disconnect(); cancelAnimationFrame(measureFrame); touch.removeEventListener('change', measure); };
  }, [projectLabel, modelLabel, trailing]);
  return <div ref={root} data-picker-mode={modes[renderedMode]} className={classes('cui-composer-chin relative z-0 overflow-clip p-2', className)}>
    <div className="cui-composer-chin-row flex items-center gap-2 text-cui-secondary">
      <div ref={pickers} className="flex min-w-0 flex-1 items-center gap-1">
        <div className="min-w-0 shrink-[999]"><ComposerPicker aria-label={projectLabel} aria-describedby={describedBy} onClick={onProjectClick} className="cui-composer-project">
          <span ref={label} className="cui-composer-project-label overflow-hidden text-ellipsis whitespace-nowrap">{projectLabel}</span>
          <span className="cui-composer-project-caret -me-1 shrink-0 text-cui-muted"><Icon name="CaretDown" size={12} /></span>
          <span className="cui-composer-project-icon"><Icon name="Projects" size={16} className="cui-composer-mouse-icon" /><Icon name="Projects" size={20} className="cui-composer-touch-icon" /></span>
        </ComposerPicker></div>
        <span ref={spacer} aria-hidden="true" className="-ms-1 min-w-0 flex-1 self-stretch" />
      </div>
      <div className="flex shrink-0 items-center"><ComposerPicker aria-label={modelAriaLabel ?? modelLabel} aria-describedby={describedBy} onClick={onModelClick} className="cui-composer-model"><span translate="no">{modelLabel}</span></ComposerPicker>{trailing}</div>
    </div>
  </div>;
}
