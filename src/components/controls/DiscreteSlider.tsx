import { useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, CSSProperties } from 'react';
import { classes } from '../../lib/classes';

export interface SliderOption { value: string; label: string; recommended?: boolean }
export interface DiscreteSliderProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'children'> {
  options: readonly SliderOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

/** Values are stable IDs; native range values are zero-based option indexes. */
export function DiscreteSlider({ options, value, defaultValue, onValueChange, onChange, onPointerDown, onPointerUp, onPointerCancel, onLostPointerCapture, onBlur, className, style, disabled, ...props }: DiscreteSliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value);
  const [dragging, setDragging] = useState(false);
  const activePointer = useRef<number | null>(null);
  const connected = useRef(false), gestureRevision = useRef(0);
  const candidate = options.findIndex(option => option.value === (value ?? internalValue));
  const index = Math.max(0, candidate);
  const unavailable = disabled || options.length < 2;

  // Pointer capture covers release outside the control. Blur also covers a lost window.
  useEffect(() => {
    connected.current = true;
    window.addEventListener('blur', stop);
    // Activity can hide the retained input before its release is delivered.
    // Disconnecting ends that gesture without resetting the selected value.
    return () => { connected.current = false; window.removeEventListener('blur', stop); stop(); };
  }, []);

  function stop() { gestureRevision.current++; activePointer.current = null; setDragging(false); }
  return (
    <div data-dragging={dragging && !unavailable || undefined} data-disabled={unavailable || undefined}
      className={classes('cui-range relative h-8 w-full min-w-6 data-disabled:opacity-40', className)}
      style={{ ...style, '--cui-pos': options.length > 1 ? index / (options.length - 1) : 0 } as CSSProperties}>
      <div aria-hidden="true" className="absolute inset-x-0 inset-y-0.5 overflow-hidden rounded-lg bg-cui-range [container-type:inline-size]">
        <div className="cui-range-fill-origin absolute inset-y-0 inset-x-3"><div className="cui-range-fill-clip"><div className="cui-range-fill" /></div></div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-between px-3.5">
        {options.map(option => <i key={option.value} className={classes('block w-[3px] rounded-[3px] bg-cui-range-dot', option.recommended ? 'h-[9px]' : 'h-[3px]')} />)}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 inset-x-3"><div className="cui-range-position"><div className="cui-range-thumb" /></div></div>
      <input {...props} type="range" min={0} max={Math.max(0, options.length - 1)} step={1} value={index}
        aria-valuetext={props['aria-valuetext'] ?? options[index]?.label} disabled={unavailable}
        className="absolute inset-0 m-0 h-8 w-full cursor-pointer appearance-none border-0 bg-transparent p-0 opacity-0 disabled:cursor-default"
        onChange={event => {
          onChange?.(event);
          const option = options[Number(event.currentTarget.value)];
          if (!option) return;
          if (value === undefined) setInternalValue(option.value);
          onValueChange?.(option.value);
        }}
        onPointerDown={event => {
          const input = event.currentTarget, revision = gestureRevision.current;
          onPointerDown?.(event);
          // A host callback can disconnect and reconnect this same retained DOM.
          // Its old pointerdown must not resume a cancelled gesture afterwards.
          if (event.defaultPrevented || event.button !== 0 || activePointer.current !== null || !connected.current || gestureRevision.current !== revision || !input.isConnected || input.disabled) return;
          activePointer.current = event.pointerId;
          input.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerUp={event => { onPointerUp?.(event); if (event.pointerId === activePointer.current) stop(); }}
        onPointerCancel={event => { onPointerCancel?.(event); if (event.pointerId === activePointer.current) stop(); }}
        onLostPointerCapture={event => { onLostPointerCapture?.(event); if (event.pointerId === activePointer.current) stop(); }}
        onBlur={event => { onBlur?.(event); stop(); }} />
    </div>
  );
}
