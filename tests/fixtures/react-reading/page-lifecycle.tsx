import { Activity, StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { WorkingMark } from '../../../src';
import '../../../src/styles/index.css';

function Consumer() {
  const [mounted, setMounted] = useState(true), [visible, setVisible] = useState(true), [active, setActive] = useState(true);
  return <main data-cui-theme="light" style={{ minHeight: '200vh' }}>
    <nav style={{ position: 'fixed', top: 0, zIndex: 1, background: 'white' }}>
      <button data-hide onClick={() => flushSync(() => setVisible(false))}>Hide working Activity</button>
      <button data-show onClick={() => flushSync(() => setVisible(true))}>Show working Activity</button>
      <button data-inactive onClick={() => flushSync(() => setActive(false))}>Pause working</button>
      <button data-active onClick={() => flushSync(() => setActive(true))}>Resume working</button>
      <button data-unmount onClick={() => flushSync(() => setMounted(false))}>Unmount working</button>
      <button data-mount onClick={() => flushSync(() => setMounted(true))}>Mount working</button>
      <input data-outside aria-label="Outside working input" />
    </nav>
    <div style={{ paddingTop: 100 }}>
      {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}>
        <WorkingMark active={active} data-working-mark fallback={<span data-working-fallback>Pending artwork</span>} />
      </Activity> : null}
    </div>
  </main>;
}
const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
