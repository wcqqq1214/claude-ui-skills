import { Activity, StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { CodeBlock, ExpandableTable, GraphemeReveal, Prose, ScrollFollower } from '../../../src';
import '../../../src/styles/index.css';

function Consumer() {
  const [mounted, setMounted] = useState(true), [count, setCount] = useState(10), [theme, setTheme] = useState('light'), [replay, setReplay] = useState(0);
  const copyDialog = useRef<HTMLDialogElement>(null);
  return <main data-cui-theme={theme} style={{ width: 320, maxWidth: '100%', background: 'var(--cui-surface)', color: 'var(--cui-text)' }}>
    <button onClick={() => setMounted(!mounted)}>Mount</button><button onClick={() => setCount(value => value + 1)}>Append</button><button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Theme</button><button onClick={() => setReplay(value => value + 1)}>Replay following</button>
    {mounted ? <>
      <h1><GraphemeReveal text="A👨‍👩‍👧‍👦é中文" /></h1>
      <Prose><h3>Reading</h3><p>Inline <code>sample.tsx</code></p></Prose>
      <CodeBlock aria-label="Source" code={'  first\n\tsecond\n'} language="text" copyLabel="Copy source" copiedLabel="Copied" copyFailedLabel="Failed" />
      <ExpandableTable label="Independent table" expandLabel="Expand" closeLabel="Close table" columns={[{ key: 'name', header: 'Name', rowHeader: true }, { key: 'duration', header: 'Duration' }]} rows={[{ key: 'a', cells: { name: 'Fade', duration: '100ms' } }]} />
      <ScrollFollower label="Live content" returnLabel="Return" height={160} busy resetKey={replay}>
        {Array.from({ length: count }, (_, index) => <p key={index} style={{ margin: '16px 0', minHeight: 60 }}>Paragraph {index + 1}</p>)}
      </ScrollFollower>
      <button onClick={() => copyDialog.current?.showModal()}>Open copy modal</button>
      <dialog ref={copyDialog} aria-label="Copy modal">
        <p data-modal-selection>Read these words.</p>
        <CodeBlock aria-label="Modal source" code={'  modal\n\tcode\n'} copyLabel="Copy modal source" copiedLabel="Modal copied" copyFailedLabel="Modal failed" />
        <button onClick={() => copyDialog.current?.close()}>Close copy modal</button>
      </dialog>
    </> : null}
  </main>;
}
function ActivityConsumer() {
  const [mode, setMode] = useState<'hidden' | 'visible'>('visible'), [active, setActive] = useState(true), [count, setCount] = useState(20), [reset, setReset] = useState(0), [followContent, setFollowContent] = useState(true);
  const syncActive = new URLSearchParams(location.search).has('sync-active');
  const columns = [{ key: 'name', header: 'Name', rowHeader: true }, { key: 'duration', header: 'Duration' }], rows = [{ key: 'a', cells: { name: 'Fade', duration: '100ms' } }];
  return <main data-cui-theme="light" style={{ width: 320, maxWidth: '100%' }}>
    <button data-hide onClick={() => flushSync(() => setMode('hidden'))}>Hide Activity</button>
    <button data-show onClick={() => flushSync(() => setMode('visible'))}>Show Activity</button>
    <button data-reconnect onClick={() => { flushSync(() => setMode('hidden')); flushSync(() => setMode('visible')); }}>Reconnect Activity</button>
    <button data-active onClick={() => setActive(value => !value)}>Toggle active</button>
    <button data-append onClick={() => setCount(value => value + 1)}>Append Activity</button>
    <button data-reset onClick={() => setReset(value => value + 1)}>Reset Activity</button>
    <button data-follow onClick={() => setFollowContent(value => !value)}>Toggle following content</button>
    <input data-outside aria-label="Outside Activity" />
    <Activity mode={mode}>
      <section data-activity-host>
        <ExpandableTable active={active && (!syncActive || mode === 'visible')} label="Activity table" expandLabel="Expand Activity table" closeLabel="Close Activity table" columns={columns} rows={rows} />
        <ScrollFollower label="Activity scroll" returnLabel="Return Activity" height={160} active={active && (!syncActive || mode === 'visible')} followContent={followContent} resetKey={reset}>
          {Array.from({ length: count }, (_, index) => <p key={index} style={{ margin: '16px 0', minHeight: 60 }}>Activity paragraph {index + 1}</p>)}
        </ScrollFollower>
      </section>
    </Activity>
    <ExpandableTable label="Other table" expandLabel="Expand other table" closeLabel="Close other table" columns={columns} rows={rows} />
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode>{new URLSearchParams(location.search).has('activity') ? <ActivityConsumer /> : <Consumer />}</StrictMode>);
