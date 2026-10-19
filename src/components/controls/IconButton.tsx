import type { ComponentPropsWithRef } from 'react';
import { classes } from '../../lib/classes';

export function IconButton({ className, type = 'button', ...props }: ComponentPropsWithRef<'button'>) {
  return <button {...props} type={type} className={classes('box-border inline-flex size-8 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-md border-0 bg-transparent p-0 text-cui-secondary hover:bg-cui-segment-track hover:text-cui-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cui-accent disabled:cursor-default disabled:opacity-40', className)} />;
}
