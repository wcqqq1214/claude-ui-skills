import { Activity, StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ReadingChapter } from '../../../demo/chapters/ReadingChapter';
import '../../../demo/style.css';

function Consumer() {
  const [mounted, setMounted] = useState(true), [visible, setVisible] = useState(true), [active, setActive] = useState(true);
  return <main data-cui-theme="light" style={{ minHeight: '250vh', width: 940, maxWidth: '100%' }}>
    <nav style={{ position: 'fixed', top: 0, zIndex: 1, background: 'white' }}>
      <button data-hide onClick={() => flushSync(() => setVisible(false))}>Hide counter Activity</button>
      <button data-show onClick={() => flushSync(() => setVisible(true))}>Show counter Activity</button>
      <button data-inactive onClick={() => flushSync(() => setActive(false))}>Pause counter</button>
      <button data-active onClick={() => flushSync(() => setActive(true))}>Resume counter</button>
      <button data-unmount onClick={() => flushSync(() => setMounted(false))}>Unmount counter</button>
      <input data-outside aria-label="Outside counter input" />
    </nav>
    <div style={{ paddingTop: 100 }}>
      {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}><ReadingChapter locale="en" active={active} /></Activity> : null}
    </div>
  </main>;
}
const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
