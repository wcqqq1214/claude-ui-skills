import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
createRoot(document.getElementById('root')!).render(<StrictMode><Consumer /></StrictMode>);
