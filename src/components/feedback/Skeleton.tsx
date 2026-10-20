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
    const observed = new Set<HTMLElement>();
    const measure = () => {
      // Descendants can update from their own state without changing this
      // component's children. Include their current DOM in every measurement.
      const lines = [...group.querySelectorAll<HTMLElement>('[data-cui-skeleton-line]')];
      const current = new Set(lines);
      observed.forEach(line => { if (!current.has(line)) { resize.unobserve(line); observed.delete(line); } });
      lines.forEach(line => { if (!observed.has(line)) { resize.observe(line); observed.add(line); } });
      const box = group.getBoundingClientRect();
      const scaleX = box.width / group.offsetWidth || 1, scaleY = box.height / group.offsetHeight || 1;
      const paths = lines.map(line => {
        const rect = line.getBoundingClientRect();
        return `M${(rect.left - box.left) / scaleX},${(rect.top - box.top) / scaleY}h${rect.width / scaleX}v${rect.height / scaleY}h${-rect.width / scaleX}Z`;
      });
      mask.style.clipPath = paths.length ? `path("${paths.join(' ')}")` : '';
      mask.style.visibility = paths.length ? 'visible' : 'hidden';
    };
    const resize = new ResizeObserver(measure);
    const mutations = new MutationObserver(records => {
      // Updating our own absolute mask must not schedule another measurement.
      if (records.some(record => record.target !== mask && !mask.contains(record.target))) measure();
    });
    resize.observe(group);
    mutations.observe(group, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-cui-skeleton-line'] });
    measure();
    return () => { resize.disconnect(); mutations.disconnect(); };
  }, []);
  return <div {...props} ref={root} data-active={visible} className={classes('cui-skeleton relative', className)}>
    <div ref={clip} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><div className="cui-skeleton-band absolute inset-0" /></div>
    {children}
  </div>;
}

export function SkeletonLine({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} aria-hidden="true" data-cui-skeleton-line="" className={classes('my-2 h-2.5 rounded bg-(--cui-skeleton-base)', className)} />;
}
