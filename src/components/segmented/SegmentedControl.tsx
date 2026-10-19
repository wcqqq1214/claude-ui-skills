import { useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { classes } from '../../lib/classes';

export interface SegmentOption { value: string; label: ReactNode; disabled?: boolean }
export interface SegmentedControlProps extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange' | 'children' | 'role'> {
  options: readonly SegmentOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: 'standard' | 'compact';
  disabled?: boolean;
}

/** An immediate-selection radio group, not a tab-panel navigation API. */
export function SegmentedControl({ options, value, defaultValue, onValueChange, size = 'standard', disabled = false, className, onKeyDown, ...props }: SegmentedControlProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? options.find(option => !option.disabled)?.value);
  const selected = value ?? internalValue;
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const geometryRef = useRef<{ left: number; width: number; value: string } | null>(null);
  const positionRef = useRef<(animate: boolean) => void>(() => {});
  const enabled = options.filter(option => !option.disabled);
  const tabValue = enabled.some(option => option.value === selected) ? selected : enabled[0]?.value;

  // React owns selection; refs own only the measured indicator geometry.
  useLayoutEffect(() => {
    positionRef.current = (animate: boolean) => {
      const root = rootRef.current, thumb = thumbRef.current;
      const button = root?.querySelector<HTMLButtonElement>('[aria-checked="true"]');
      if (!root || !thumb) return;
      if (!button) {
        animationRef.current?.cancel(); geometryRef.current = null; thumb.style.visibility = 'hidden'; return;
      }
      const rect = root.getBoundingClientRect(), target = button.getBoundingClientRect();
      const layoutWidth = parseFloat(getComputedStyle(root).width);
      const measuredScale = rect.width / layoutWidth;
      const scale = measuredScale > 0 && Number.isFinite(measuredScale) ? measuredScale : 1;
      const dpr = window.devicePixelRatio || 1;
      const round = (n: number) => Math.round(n * dpr) / dpr;
      const left = (round(target.left) - round(rect.left)) / scale;
      const width = (round(target.right) - round(target.left)) / scale;
      if (!(width > 0)) return;
      thumb.style.visibility = 'visible';
      const previous = geometryRef.current;
      if (previous?.left === left && previous.width === width) {
        geometryRef.current = { left, width, value: selected ?? '' }; return;
      }
      const current = thumb.getBoundingClientRect();
      animationRef.current?.cancel();
      thumb.style.width = `${width}px`;
      thumb.style.transform = `translateX(${left}px)`;
      if (animate && previous && previous.value !== selected) {
        animationRef.current = thumb.animate([
          { transform: `translateX(${(current.left - rect.left) / scale}px) scaleX(${current.width / scale / width})` },
          { transform: `translateX(${left}px) scaleX(1)` },
        ], { duration: 200, easing: 'cubic-bezier(.32,.72,0,1)' });
      }
      geometryRef.current = { left, width, value: selected ?? '' };
    };
    positionRef.current(true);
  });

  // Observe the options as well as the track: a label can move inside a fixed-width host.
  useLayoutEffect(() => {
    const root = rootRef.current!;
    const observer = new ResizeObserver(() => positionRef.current(false));
    observer.observe(root);
    root.querySelectorAll('button').forEach(button => observer.observe(button));
    return () => observer.disconnect();
  }, [options]);
  useLayoutEffect(() => () => { animationRef.current?.cancel(); geometryRef.current = null; }, []);

  function select(next: string) {
    if (next === selected) return;
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  }
  return (
    <div {...props} ref={rootRef} role="radiogroup" aria-disabled={disabled || undefined}
      data-size={size} className={classes('cui-segment relative isolate box-border inline-flex h-8 shrink-0 items-stretch rounded-lg bg-cui-segment-track p-px font-cui data-[size=compact]:h-6 data-[size=compact]:rounded-md', className)}
      onKeyDown={event => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled || !enabled.length || event.altKey || event.ctrlKey || event.metaKey) return;
        const current = enabled.findIndex(option => option.value === (event.target as HTMLButtonElement).dataset.value);
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        let next: number;
        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = enabled.length - 1;
        else if (event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = (current + 1) % enabled.length;
        else if (event.key === 'ArrowUp' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = (current - 1 + enabled.length) % enabled.length;
        else return;
        event.preventDefault();
        select(enabled[next].value);
        const button = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')].find(button => button.dataset.value === enabled[next].value);
        button?.focus();
      }}>
      <span ref={thumbRef} aria-hidden="true" data-part="indicator" className="pointer-events-none invisible absolute inset-y-px left-0 origin-left rounded-[7px] bg-cui-segment-thumb shadow-cui-segment in-data-[size=compact]:rounded-[5px]" />
      {options.map(option => <button key={option.value} type="button" role="radio" data-value={option.value}
        disabled={disabled || option.disabled} aria-checked={option.value === selected} tabIndex={!disabled && !option.disabled && option.value === tabValue ? 0 : -1}
        className="relative z-10 m-0 inline-flex h-full shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md border-0 bg-transparent px-3 py-0 font-cui text-sm leading-5 font-(--cui-regular) text-cui-secondary transition-shadow duration-[60ms] ease-cui-standard hover:text-cui-text aria-checked:text-cui-text focus-visible:outline-none focus-visible:shadow-cui-focus disabled:cursor-default disabled:opacity-40 in-data-[size=compact]:rounded in-data-[size=compact]:px-2 in-data-[size=compact]:text-[13px] in-data-[size=compact]:leading-[19px]"
        onClick={() => select(option.value)}>{option.label}</button>)}
    </div>
  );
}
