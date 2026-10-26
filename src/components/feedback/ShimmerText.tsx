import type { ComponentPropsWithoutRef } from 'react';
import { classes } from '../../lib/classes';

export function ShimmerText({ children, shimmering = true, active = true, className, ...props }: Omit<ComponentPropsWithoutRef<'span'>, 'children'> & { children: string; shimmering?: boolean; active?: boolean }) {
  return <span {...props} data-shimmering={shimmering} data-active={active} className={classes('cui-shimmer relative block min-w-0', className)}>
    <span>{children}</span><span aria-hidden="true" translate="no" className="cui-shimmer-clone">{shimmering ? children : ''}</span>
  </span>;
}
