import { useLayoutEffect, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'failed';
/** Latest request wins. Page exit and unmount invalidate pending writes. */
export function useClipboard() {
  const [state, setState] = useState<CopyState>('idle');
  const request = useRef(0), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const expiresAt = useRef<number | undefined>(undefined);
  function resumeFeedback() {
    clearTimeout(timer.current);
    const deadline = expiresAt.current;
    if (deadline === undefined) return;
    const reset = () => { if (expiresAt.current === deadline) { expiresAt.current = undefined; setState('idle'); } };
    const remaining = deadline - Date.now();
    if (remaining <= 0) reset();
    else timer.current = setTimeout(reset, remaining);
  }
  useLayoutEffect(() => {
    const invalidate = () => { ++request.current; clearTimeout(timer.current); };
    const leave = () => { invalidate(); expiresAt.current = undefined; setState('idle'); };
    // Activity disconnects effects while retaining state. Keep the original
    // expiry so time spent hidden still counts toward the two-second feedback.
    resumeFeedback();
    window.addEventListener('pagehide', leave);
    // Cancel during the hide/unmount commit, before Promise continuations can
    // deliver a result while passive cleanup is still deferred.
    return () => { invalidate(); window.removeEventListener('pagehide', leave); };
  }, []);
  async function copy(text: string, onResult?: (copied: boolean) => void) {
    const current = ++request.current;
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const previous = document.activeElement;
        const selection = window.getSelection();
        const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
        const textarea = document.createElement('textarea');
        textarea.value = text; textarea.readOnly = true; textarea.tabIndex = -1; textarea.style.cssText = 'position:fixed;left:-9999px;top:0';
        // Nodes outside the active native modal are inert, so selecting a
        // body-level input can leave execCommand copying the previous range.
        (previous?.closest('dialog:modal') ?? document.body).append(textarea);
        try {
          textarea.focus({ preventScroll: true }); textarea.select();
          if (document.activeElement !== textarea || textarea.selectionStart !== 0 || textarea.selectionEnd !== textarea.value.length || !document.execCommand('copy')) throw new Error('Clipboard unavailable');
        }
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
    expiresAt.current = copied ? Date.now() + 2000 : undefined;
    resumeFeedback();
    if (onResult) {
      // Preserve the consumer's delivery turn, but recheck ownership after it.
      // A completed write can be superseded or disconnected before delivery.
      await Promise.resolve();
      if (current !== request.current) return;
      onResult(copied);
    }
    return copied;
  }
  return { state, copy };
}
