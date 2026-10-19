import { useLayoutEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { classes } from '../../lib/classes';
import { useVisible } from '../../hooks/useVisible';

/** SkeletonLine descendants share a single sweep clipped to their rectangles. */
export function SkeletonGroup({ children, active = true, className, ...props }: ComponentPropsWithoutRef<'div'> & { active?: boolean }) {
  const root = useRef<HTMLDivElement>(null), clip = useRef<HTMLDivElement>(null);
  const visible = useVisible(root, active);
  useLayoutEffect(() => {
    const group = root.current!, mask = clip.current!;
    const lines = [...group.querySelectorAll<HTMLElement>('[data-cui-skeleton-line]')];
    const measure = () => {
      const box = group.getBoundingClientRect();
      const scaleX = box.width / group.offsetWidth || 1, scaleY = box.height / group.offsetHeight || 1;
      const paths = lines.map(line => {
        const rect = line.getBoundingClientRect();
        return `M${(rect.left - box.left) / scaleX},${(rect.top - box.top) / scaleY}h${rect.width / scaleX}v${rect.height / scaleY}h${-rect.width / scaleX}Z`;
      });
      mask.style.clipPath = paths.length ? `path("${paths.join(' ')}")` : '';
      mask.style.visibility = paths.length ? 'visible' : 'hidden';
    };
    const observer = new ResizeObserver(measure);
    observer.observe(group); lines.forEach(line => observer.observe(line)); measure();
    return () => observer.disconnect();
  }, [children]);
  return <div {...props} ref={root} data-active={visible} className={classes('cui-skeleton relative', className)}>
    <div ref={clip} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><div className="cui-skeleton-band absolute inset-0" /></div>
    {children}
  </div>;
}

export function SkeletonLine({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} aria-hidden="true" data-cui-skeleton-line="" className={classes('my-2 h-2.5 rounded bg-(--cui-skeleton-base)', className)} />;
}
