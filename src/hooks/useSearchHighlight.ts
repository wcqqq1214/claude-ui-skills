import { useCallback, useEffect, useRef } from 'react';
import { highlightSearchTarget } from '../components/menus/searchHighlight';
export function useSearchHighlight(active = true) {
  const cleanup = useRef<(() => void) | null>(null);
  const cancel = useCallback(() => { cleanup.current?.(); cleanup.current = null; }, []);
  const highlight = useCallback((row: HTMLElement, title: HTMLElement) => {
    cancel();
    if (!active) return;
    title.focus({ preventScroll: true });
    cleanup.current = highlightSearchTarget(row, title);
  }, [active, cancel]);
  useEffect(() => {
    if (!active) cancel();
    window.addEventListener('pagehide', cancel);
    return () => { cancel(); window.removeEventListener('pagehide', cancel); };
  }, [active, cancel]);
  return { highlight, cancel };
}
