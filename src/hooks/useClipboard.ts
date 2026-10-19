import { useEffect, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'failed';
/** Latest request wins. Page exit and unmount invalidate pending writes. */
export function useClipboard() {
  const [state, setState] = useState<CopyState>('idle');
  const request = useRef(0), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const invalidate = () => { ++request.current; clearTimeout(timer.current); };
    const leave = () => { invalidate(); setState('idle'); };
    window.addEventListener('pagehide', leave);
    return () => { invalidate(); window.removeEventListener('pagehide', leave); };
  }, []);
  async function copy(text: string) {
    const current = ++request.current;
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch { /* Announce failure. */ }
    if (current !== request.current) return;
    clearTimeout(timer.current);
    setState(copied ? 'copied' : 'failed');
    if (copied) timer.current = setTimeout(() => setState('idle'), 2000);
  }
  return { state, copy };
}
