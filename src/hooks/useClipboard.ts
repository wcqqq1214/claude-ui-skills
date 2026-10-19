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
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const previous = document.activeElement;
        const selection = window.getSelection();
        const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
        const textarea = document.createElement('textarea');
        textarea.value = text; textarea.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.append(textarea);
        try { textarea.select(); if (!document.execCommand('copy')) throw new Error('Clipboard unavailable'); }
        finally {
          textarea.remove();
          if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
          selection?.removeAllRanges(); ranges.forEach(range => selection?.addRange(range));
        }
      }
      copied = true;
    } catch { /* Announce failure. */ }
    if (current !== request.current) return;
    clearTimeout(timer.current);
    setState(copied ? 'copied' : 'failed');
    if (copied) timer.current = setTimeout(() => setState('idle'), 2000);
    return copied;
  }
  return { state, copy };
}
