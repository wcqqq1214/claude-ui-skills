import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';

type Options = {
  root: RefObject<HTMLDivElement | null>;
  layout: RefObject<HTMLDivElement | null>;
  list: RefObject<HTMLElement | null>;
  handle: RefObject<HTMLDivElement | null>;
  defaultWidth: number;
  expanded: boolean;
  active: boolean;
  onWidthChange?: (width: number) => void;
};
type Drag = { id: number; x: number; width: number; changed: boolean };
/** Owns only the pane CSS variable and pointer transaction; React owns content. */
export function usePaneResize({ root, layout, list, handle, defaultWidth, expanded, active, onWidthChange }: Options) {
  const chosen = useRef(defaultWidth), drag = useRef<Drag | null>(null), notify = useRef(onWidthChange);
  const [geometry, setGeometry] = useState({ width: defaultWidth, max: 520 });
  useLayoutEffect(() => { notify.current = onWidthChange; });
  const measured = () => Math.round(list.current?.getBoundingClientRect().width ?? chosen.current);
  function sync() {
    if (!handle.current?.getClientRects().length || getComputedStyle(handle.current).visibility === 'hidden') return;
    const width = measured(), max = Math.round(Math.max(160, Math.min(520, (layout.current?.getBoundingClientRect().width ?? 0) * .6)));
    setGeometry(previous => previous.width === width && previous.max === max ? previous : { width, max });
  }
  function render(width = chosen.current) { root.current?.style.setProperty('--cui-pane-width', `${width}px`); sync(); }
  function save(width: number) { if (chosen.current === width) return; chosen.current = width; notify.current?.(width); }
  function finish(commit = false) {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    if (commit && state.changed && measured() !== state.width) save(measured());
    root.current?.removeAttribute('data-resizing');
    if (handle.current?.hasPointerCapture(state.id)) handle.current.releasePointerCapture(state.id);
    render();
  }
  function reset() { save(defaultWidth); render(); }
  useLayoutEffect(() => {
    render();
    const observer = new ResizeObserver(sync);
    if (layout.current) observer.observe(layout.current);
    if (list.current) observer.observe(list.current);
    return () => { observer.disconnect(); finish(); };
  }, []);
  useLayoutEffect(() => { if (expanded || !active) finish(); if (!expanded && active) render(); }, [expanded, active]);
  useEffect(() => {
    const cancel = () => finish();
    window.addEventListener('blur', cancel); window.addEventListener('pagehide', cancel);
    return () => { window.removeEventListener('blur', cancel); window.removeEventListener('pagehide', cancel); };
  }, []);
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary || !active || expanded || drag.current) return;
    event.preventDefault(); event.currentTarget.focus();
    drag.current = { id: event.pointerId, x: event.clientX, width: measured(), changed: false };
    event.currentTarget.setPointerCapture(event.pointerId); root.current?.setAttribute('data-resizing', '');
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || event.pointerId !== state.id) return;
    const delta = event.clientX - state.x;
    if (Math.abs(delta) > 3) state.changed = true;
    render(state.width + delta);
  }
  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.metaKey || event.ctrlKey || event.altKey || event.nativeEvent.isComposing || drag.current || !active || expanded) return;
    let next: number;
    if (event.key === 'ArrowLeft') next = measured() - (event.shiftKey ? 32 : 8);
    else if (event.key === 'ArrowRight') next = measured() + (event.shiftKey ? 32 : 8);
    else {
      if (event.shiftKey || !['Home', 'End', 'Enter', ' '].includes(event.key)) return;
      event.preventDefault(); if (event.repeat) return;
      if (event.key === 'Enter' || event.key === ' ') { reset(); return; }
      next = event.key === 'Home' ? 160 : 520;
    }
    event.preventDefault();
    const before = measured(); render(next); const after = measured();
    if (after !== before) save(after);
    render();
  }
  return { ...geometry, bindings: {
    onPointerDown: pointerDown, onPointerMove: pointerMove,
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => { if (event.pointerId === drag.current?.id) finish(true); },
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => { if (event.pointerId === drag.current?.id) finish(); },
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => { if (event.pointerId === drag.current?.id) finish(); },
    onDoubleClick: () => { if (active && !expanded && !drag.current) reset(); }, onKeyDown: keyDown,
  } };
}
