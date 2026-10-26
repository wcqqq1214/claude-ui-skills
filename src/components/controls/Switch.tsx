import { useState } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { classes } from '../../lib/classes';

export interface SwitchProps extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'value' | 'defaultValue' | 'role' | 'aria-checked'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/** Supply an accessible name using aria-label or aria-labelledby. */
export function Switch({ checked, defaultChecked = false, onCheckedChange, className, onClick, type = 'button', ...props }: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const selected = checked ?? internalChecked;
  return (
    <button {...props} type={type} role="switch" aria-checked={selected}
      className={classes('cui-switch group box-border inline-block h-5 w-9 shrink-0 cursor-pointer touch-manipulation rounded-full border-0 bg-cui-track p-0.5 align-middle hover:bg-cui-track-hover aria-checked:bg-cui-accent aria-checked:hover:bg-cui-accent-hover focus-visible:outline-none focus-visible:shadow-cui-focus disabled:cursor-default disabled:opacity-40', className)}
      onClick={event => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (checked === undefined) setInternalChecked(!selected);
        onCheckedChange?.(!selected);
      }}>
      <span aria-hidden="true" className="block size-4 rounded-full bg-cui-handle shadow-cui-switch transition-transform duration-(--cui-control-120) ease-cui-overshoot group-aria-checked:translate-x-4" />
    </button>
  );
}
