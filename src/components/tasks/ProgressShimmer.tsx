import { useCallback, useLayoutEffect, useRef, useState } from 'react';

function band(node: HTMLElement | null) {
  return node?.getAnimations({ subtree: true }).find(animation => animation.effect instanceof KeyframeEffect && animation.effect.target === node && animation.effect.pseudoElement === '::after');
}
function eligibleLayout(element: HTMLElement) {
  const style = getComputedStyle(element);
  if (!['block', 'inline-block', 'flow-root', 'list-item'].includes(style.display) || style.webkitLineClamp !== 'none') return false;
  let parent = element.parentElement;
  for (let depth = 0; parent && depth < 16; depth++, parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    if (style.webkitLineClamp !== 'none') return false;
    if (!['block', 'flow-root', 'list-item', 'contents', 'inline'].includes(style.display)) break;
  }
  return true;
}
/** Rebuild the text mask on copy changes while preserving its running/paused phase. */
export function ProgressShimmer({ children, shimmering }: { children: string; shimmering: boolean }) {
  const root = useRef<HTMLSpanElement>(null), clone = useRef<HTMLSpanElement | null>(null);
  const phase = useRef<{ start: CSSNumberish | null; time: CSSNumberish | null } | null>(null);
  const [compositing, setCompositing] = useState(false), [eligible, setEligible] = useState(true);
  useLayoutEffect(() => { setCompositing(CSS.supports('(-webkit-mask-clip: text) and (-webkit-app-region: drag)')); }, []);
  useLayoutEffect(() => {
    setEligible(true);
    if (!shimmering || !compositing) return;
    if (typeof ResizeObserver === 'undefined') { setEligible(false); return; }
    const observer = new ResizeObserver(() => { observer.disconnect(); if (root.current) setEligible(eligibleLayout(root.current)); });
    try { observer.observe(root.current!); if (clone.current) observer.observe(clone.current); }
    catch { observer.disconnect(); setEligible(false); }
    return () => observer.disconnect();
  }, [shimmering, compositing]);
  const attachClone = useCallback((node: HTMLSpanElement | null) => {
    if (!node) { const animation = band(clone.current); phase.current = animation ? { start: animation.startTime, time: animation.currentTime } : null; }
    clone.current = node;
  }, []);
  const mode = !shimmering ? 'inactive' : compositing && eligible ? 'composited' : 'fallback';
  useLayoutEffect(() => {
    const animation = band(clone.current), previous = phase.current;
    if (animation && previous) {
      if (typeof previous.start === 'number' && animation.playState === 'running') animation.startTime = previous.start;
      else if (typeof previous.time === 'number') animation.currentTime = previous.time;
    }
    phase.current = null;
  });
  return <span ref={root} className="cui-shimmer" data-shimmering={shimmering} data-shimmer-mode={mode}>
    {children}{mode === 'composited' ? <span key={children} ref={attachClone} className="cui-shimmer-clone" aria-hidden="true" translate="no" inert>{children}</span> : null}
  </span>;
}
