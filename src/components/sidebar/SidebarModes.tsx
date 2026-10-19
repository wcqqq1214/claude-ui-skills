import { useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { classes } from '../../lib/classes';
export type SidebarMode = { id: string; label: string; icon: ReactNode; selectedIcon?: ReactNode; running?: boolean; runningLabel?: string; disabled?: boolean };
export type SidebarModesProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange' | 'defaultValue'> & {
  options: readonly SidebarMode[]; value?: string; defaultValue?: string; onValueChange?: (id: string) => void; active?: boolean;
};
export function SidebarModes({ options, value, defaultValue, onValueChange, active = true, className, ...props }: SidebarModesProps) {
  const [local, setLocal] = useState(defaultValue ?? options.find(option => !option.disabled)?.id);
  const selected = options.find(option => option.id === (value ?? local) && !option.disabled)?.id ?? options.find(option => !option.disabled)?.id;
  // Removing a selected option commits the local fallback, so adding it later
  // cannot silently restore a selection the user already moved away from.
  if (value === undefined && local !== selected) setLocal(selected);
  const root = useRef<HTMLDivElement>(null), thumb = useRef<HTMLSpanElement>(null), last = useRef<{ geometry: string; selected: string | undefined } | null>(null), position = useRef<(animate: boolean) => void>(() => {});
  useLayoutEffect(() => {
    position.current = animate => {
      const target = root.current?.querySelector<HTMLButtonElement>('[aria-current="page"]'), node = thumb.current;
      if (!node) return;
      if (!target) { node.style.visibility = 'hidden'; last.current = null; return; }
      const left = target.offsetLeft, width = target.offsetWidth;
      if (!width) return;
      node.style.visibility = 'visible'; const geometry = `${left},${width}`;
      if (last.current?.geometry === geometry) { last.current.selected = selected; return; }
      if (animate && last.current && last.current.selected !== selected) { node.removeAttribute('data-snap'); void node.offsetWidth; }
      else node.setAttribute('data-snap', '');
      node.style.width = `${width}px`; node.style.transform = `translateX(${left}px)`; last.current = { geometry, selected };
    };
    position.current(true);
  });
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => position.current(false));
    observer.observe(root.current!); root.current!.querySelectorAll('button').forEach(button => observer.observe(button));
    return () => observer.disconnect();
  }, [options]);
  return <div {...props} ref={root} role="group" data-two={options.length === 2 || undefined} data-active={active || undefined} className={classes('cui-mode-track relative isolate box-border flex h-7 min-w-0 items-stretch gap-0 rounded-[7px] bg-cui-segment-track p-px font-cui', className)}>
    <span ref={thumb} aria-hidden="true" className="cui-mode-thumb" />
    {options.map(option => <button key={option.id} type="button" disabled={option.disabled} aria-label={option.running && selected !== option.id ? option.runningLabel ?? option.label : option.label} aria-current={selected === option.id ? 'page' : undefined} data-mode={option.id}
      className="relative z-10 flex min-w-0 flex-auto cursor-pointer items-center justify-center gap-1.5 rounded-[5px] border-0 bg-transparent px-2.5 py-0 text-[13px] font-(--cui-regular) whitespace-nowrap text-cui-muted hover:text-cui-text aria-[current=page]:text-cui-text focus-visible:text-cui-text focus-visible:outline-2 focus-visible:outline-cui-accent disabled:cursor-default disabled:opacity-40"
      onClick={() => { if (option.id === selected) return; if (value === undefined) setLocal(option.id); onValueChange?.(option.id); }} onKeyDown={event => {
        if (event.metaKey || event.ctrlKey || event.altKey || event.nativeEvent.isComposing || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault(); const buttons = [...root.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')], index = buttons.indexOf(event.currentTarget), rtl = getComputedStyle(root.current!).direction === 'rtl';
        const forward = event.key === (rtl ? 'ArrowLeft' : 'ArrowRight'); buttons[(index + (forward ? 1 : buttons.length - 1)) % buttons.length]?.focus();
      }}>
      <span className="cui-mode-activity" aria-hidden="true"><span className="cui-mode-activity-icon">{selected === option.id ? option.selectedIcon ?? option.icon : option.icon}</span><span className="cui-mode-activity-indicator" onAnimationStart={event => {
        for (const animation of (event.target as HTMLElement).getAnimations()) {
          const timing = animation.effect?.getTiming();
          if (timing?.iterations === Infinity && typeof timing.duration === 'number' && timing.duration > 0) animation.startTime = -(performance.timeOrigin % timing.duration);
        }
      }}>{option.running && selected !== option.id ? <span className="cui-mode-running" /> : null}</span></span>
      <span className="cui-mode-label overflow-hidden text-ellipsis">{option.label}</span>
    </button>)}
  </div>;
}
