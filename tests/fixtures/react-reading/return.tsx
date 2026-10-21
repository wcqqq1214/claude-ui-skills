import { Activity, StrictMode, useRef, useState } from 'react';
import type { FocusEvent } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ScrollFollower } from '../../../src';
import '../../../src/styles/index.css';

const options = new URLSearchParams(location.search);
function Consumer() {
  const [mounted, setMounted] = useState(true), [visible, setVisible] = useState(true), [active, setActive] = useState(true);
  const [count, setCount] = useState(20), [reentries, setReentries] = useState(0);
  const armed = useRef(false);
  const focus = (event: FocusEvent<HTMLDivElement>) => {
    if (!armed.current || event.target.getAttribute('role') !== 'region') return;
    armed.current = false;
    const action = options.get('action');
    flushSync(() => {
      setReentries(value => value + 1);
      if (action === 'unmount') setMounted(false);
      else if (action === 'hide' || action === 'hide-show') setVisible(false);
      else if (action === 'inactive' || action === 'inactive-active') setActive(false);
    });
    if (action === 'hide-show') flushSync(() => setVisible(true));
    if (action === 'inactive-active') flushSync(() => setActive(true));
  };
  return <main data-cui-theme="light" style={{ width: 320 }}>
    <button onClick={() => { armed.current = true; }}>Arm Return reentry</button>
    <button onClick={() => flushSync(() => { setMounted(true); setVisible(true); setActive(true); })}>Restore Return owner</button>
    <button onClick={() => setCount(value => value + 1)}>Append Return content</button>
    <input aria-label="Outside Return input" />
    <output data-return-state>{JSON.stringify({ mounted, visible, active, reentries })}</output>
    {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}>
      <ScrollFollower label="Return content" returnLabel="Return to latest" height={160} active={active}
        {...(options.get('handler') === 'capture' ? { onFocusCapture: focus } : { onFocus: focus })}>
        {Array.from({ length: count }, (_, index) => <p key={index} style={{ height: 60, margin: '16px 0' }}>Paragraph {index + 1}</p>)}
      </ScrollFollower>
    </Activity> : null}
  </main>;
}
const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(options.get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
