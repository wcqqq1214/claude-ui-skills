import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { highlightSearchTarget } from '../components/menus/searchHighlight';
export function useSearchHighlight(active = true) {
  const cleanup = useRef<(() => void) | null>(null);
  const revision = useRef(0), phase = useRef<'connecting' | 'active' | 'inactive'>('connecting');
  const activation = useMemo(() => ({ active, committed: false }), [active]);
  const committedActivation = useRef(activation);
  const cancel = useCallback(() => {
    revision.current++;
    const stop = cleanup.current;
    cleanup.current = null;
    stop?.();
  }, []);
  const highlight = useCallback((row: HTMLElement, title: HTMLElement) => {
    cancel();
    const request = revision.current;
    const current = () => phase.current === 'active' && revision.current === request && row.isConnected && title.isConnected;
    const start = () => {
      if (!current()) return;
      title.focus({ preventScroll: true });
      // Focus can synchronously cancel, replace or disconnect this request.
      if (!current()) return;
      const stop = highlightSearchTarget(row, title);
      if (current()) cleanup.current = stop;
      else stop();
    };
    const canConnect = committedActivation.current.active || activation.active && !activation.committed;
    if (phase.current === 'active') start();
    else if (phase.current === 'connecting' && canConnect && row.isConnected && title.isConnected && title.getClientRects().length) {
      // Descendant refs and layout effects run before this hook reconnects.
      // Accept their visible target, then recheck ownership after the commit.
      // Hidden retained DOM and committed inactive calls never queue work.
      // An old saved callback cannot revive an activation already made inactive.
      const onPageHide = () => cancel();
      const release = () => window.removeEventListener('pagehide', onPageHide);
      cleanup.current = release;
      window.addEventListener('pagehide', onPageHide);
      queueMicrotask(() => {
        release();
        if (cleanup.current === release) cleanup.current = null;
        start();
      });
    }
  }, [activation, cancel]);
  useLayoutEffect(() => {
    activation.committed = true;
    committedActivation.current = activation;
    phase.current = activation.active ? 'active' : 'inactive';
    if (!activation.active) cancel();
    window.addEventListener('pagehide', cancel);
    return () => { phase.current = 'connecting'; cancel(); window.removeEventListener('pagehide', cancel); };
  }, [activation, cancel]);
  // Child layout cleanups can call a saved method after our layout cleanup.
  // End those teardown requests before an Activity reconnect can accept them.
  useEffect(() => cancel, [cancel]);
  return { highlight, cancel };
}
