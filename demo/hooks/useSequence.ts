import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { useVisible } from '../../src/hooks/useVisible';

/** All sample arrival timing stays in the demo. Re-entry restarts the example. */
export function useSequence(ref: RefObject<Element | null>, delays: readonly number[], active: boolean, threshold = 0) {
  const visible = useVisible(ref, active, threshold);
  const [count, setCount] = useState(0), [request, setRequest] = useState(0), [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (!visible) return;
    setCount(0); setGeneration(value => value + 1);
    const timers = delays.map((delay, index) => setTimeout(() => setCount(index + 1), delay));
    return () => timers.forEach(clearTimeout);
  }, [delays, request, visible]);
  return { count, generation, visible, playing: visible && count < delays.length, replay: () => setRequest(value => value + 1) };
}
