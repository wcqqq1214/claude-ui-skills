import { useCallback, useLayoutEffect, useRef } from 'react';
import { highlightSearchTarget } from '../components/menus/searchHighlight';
export function useSearchHighlight(active = true) {
  const cleanup = useRef<(() => void) | null>(null);
  const revision = useRef(0), available = useRef(false);
  const cancel = useCallback(() => {
    revision.current++;
    const stop = cleanup.current;
    cleanup.current = null;
    stop?.();
  }, []);
  const highlight = useCallback((row: HTMLElement, title: HTMLElement) => {
    cancel();
    const request = revision.current;
    const current = () => available.current && revision.current === request && row.isConnected && title.isConnected;
    if (!current()) return;
    title.focus({ preventScroll: true });
    // Focus can synchronously cancel, replace or disconnect this request.
    if (!current()) return;
    const stop = highlightSearchTarget(row, title);
    if (current()) cleanup.current = stop;
    else stop();
  }, [cancel]);
  useLayoutEffect(() => {
    available.current = active;
    if (!active) cancel();
    window.addEventListener('pagehide', cancel);
    return () => { available.current = false; cancel(); window.removeEventListener('pagehide', cancel); };
  }, [active, cancel]);
  return { highlight, cancel };
}
