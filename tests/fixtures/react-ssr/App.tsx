import { useEffect, useState } from 'react';
import { WorkingMark } from '../../../src';

export function App() {
  const [hydrated, setHydrated] = useState(false), [mounted, setMounted] = useState(true);
  const [active, setActive] = useState(true), [replay, setReplay] = useState(0);
  useEffect(() => { setHydrated(true); }, []);
  return <main data-cui-theme="light" data-hydrated={hydrated}>
    <button onClick={() => setMounted(value => !value)}>Mount</button>
    <button onClick={() => setActive(value => !value)}>Active</button>
    <button onClick={() => setReplay(value => value + 1)}>Replay</button>
    {mounted ? <WorkingMark key={replay} data-working active={active} fallback={<span data-failed>Artwork unavailable</span>} /> : null}
  </main>;
}
