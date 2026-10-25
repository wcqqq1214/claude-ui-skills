import { Activity, StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { GroupedSearch } from '../../../src';
import '../../../src/styles/index.css';
function Consumer() {
  const [visible, setVisible] = useState(true), [mounted, setMounted] = useState(true), [revision, setRevision] = useState(0);
  const [autoFocus, setAutoFocus] = useState(!new URLSearchParams(location.search).has('no-focus'));
  return <main data-cui-theme="light">
    <input aria-label="Outside search" />
    <button onClick={() => flushSync(() => setVisible(false))}>Hide search</button>
    <button onClick={() => flushSync(() => setVisible(true))}>Show search</button>
    <button onClick={() => setMounted(value => !value)}>Toggle mount</button>
    <button onClick={() => setRevision(value => value + 1)}>Rerender</button>
    <button onClick={() => setAutoFocus(value => !value)}>Toggle autofocus</button>
    <Activity mode={visible ? 'visible' : 'hidden'}>{mounted && <GroupedSearch autoFocus={autoFocus} label="Retained search" placeholder={String(revision)} emptyMessage="No results" items={[{ id: 'one', label: 'One' }]} onSelect={() => {}} />}</Activity>
  </main>;
}
const app = <Consumer />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'on' ? <StrictMode>{app}</StrictMode> : app);
