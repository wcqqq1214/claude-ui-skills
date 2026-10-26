import type { ComponentPropsWithRef, ReactNode } from 'react';
import { classes } from '../../lib/classes';

export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  children?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}

/** Native checkbox preserves form/reset semantics; className styles the label. */
export function Checkbox({ children, className, onChange, onCheckedChange, disabled, ...props }: CheckboxProps) {
  return (
    <label className={classes('group relative inline-flex cursor-pointer items-center gap-2.5 font-cui text-sm text-cui-text has-disabled:cursor-default has-disabled:opacity-40', className)}>
      <input {...props} type="checkbox" disabled={disabled}
        className="peer absolute top-0 left-0 m-0 size-5 cursor-inherit opacity-0"
        onChange={event => { onChange?.(event); onCheckedChange?.(event.currentTarget.checked); }} />
      <span aria-hidden="true" className="cui-check-box pointer-events-none box-border flex size-5 shrink-0 items-center justify-center rounded-[5px] border border-solid border-cui-check transition-[background-color,border-color] duration-(--cui-control-60) ease-cui-out peer-checked:border-transparent peer-checked:bg-cui-accent peer-focus-visible:shadow-cui-focus group-hover:peer-enabled:peer-checked:bg-cui-accent-hover group-hover:peer-enabled:peer-not-checked:border-cui-check-hover">
        <svg viewBox="0 0 16 16" className="size-4 shrink-0 fill-none stroke-white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 3 3 7-7" /></svg>
      </span>
      {children}
    </label>
  );
}
