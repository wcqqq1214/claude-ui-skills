import { Activity, StrictMode, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { useSearchHighlight } from '../../../src';
import '../../../src/styles/index.css';

type HighlightApi = ReturnType<typeof useSearchHighlight> & {
  firstRow: HTMLDivElement;
  firstTitle: HTMLHeadingElement;
  secondRow: HTMLDivElement;
  secondTitle: HTMLHeadingElement;
};

function Targets({ active, save, onFocus }: { active: boolean; save: (api: HighlightApi) => void; onFocus: () => void }) {
  const firstRow = useRef<HTMLDivElement>(null), firstTitle = useRef<HTMLHeadingElement>(null);
  const secondRow = useRef<HTMLDivElement>(null), secondTitle = useRef<HTMLHeadingElement>(null);
  const { highlight, cancel } = useSearchHighlight(active);
  useLayoutEffect(() => {
    save({ highlight, cancel, firstRow: firstRow.current!, firstTitle: firstTitle.current!, secondRow: secondRow.current!, secondTitle: secondTitle.current! });
  }, [highlight, cancel, save]);
  return <section aria-label="Highlight destinations" style={{ height: 240, overflowY: 'auto' }}>
    <div style={{ height: 180 }} />
    <div ref={firstRow} data-target="first" style={{ minHeight: 160 }}><h3 ref={firstTitle} tabIndex={-1} onFocus={onFocus} style={{ width: 'fit-content' }}>First destination</h3></div>
    <div ref={secondRow} data-target="second" style={{ minHeight: 160 }}><h3 ref={secondTitle} tabIndex={-1} style={{ width: 'fit-content' }}>Second destination</h3></div>
    <div style={{ height: 180 }} />
  </section>;
}

function Consumer() {
  const [active, setActive] = useState(true), [visible, setVisible] = useState(true), [mounted, setMounted] = useState(true);
  const api = useRef<HighlightApi | null>(null), saved = useRef<HighlightApi | null>(null), reentered = useRef(false);
  const focusCase = new URLSearchParams(location.search).get('focus');
  function save(value: HighlightApi) { api.current = value; saved.current ??= value; }
  function focus() {
    if (reentered.current) return;
    reentered.current = true;
    if (focusCase === 'cancel') api.current!.cancel();
    if (focusCase === 'inactive') flushSync(() => setActive(false));
    if (focusCase === 'replace') api.current!.highlight(api.current!.secondRow, api.current!.secondTitle);
    if (focusCase === 'unmount') flushSync(() => setMounted(false));
    if (focusCase === 'hidden') flushSync(() => setVisible(false));
    if (focusCase === 'pagehide') window.dispatchEvent(new Event('pagehide'));
  }
  return <main data-cui-theme="light">
    <button onClick={() => saved.current!.highlight(saved.current!.firstRow, saved.current!.firstTitle)}>Saved highlight first</button>
    <button onClick={() => saved.current!.highlight(saved.current!.secondRow, saved.current!.secondTitle)}>Saved highlight second</button>
    <button onClick={() => saved.current!.cancel()}>Cancel highlight</button>
    <button onClick={() => setActive(value => !value)}>Toggle active</button>
    <button onClick={() => setVisible(value => !value)}>Toggle Activity</button>
    <button onClick={() => setMounted(value => !value)}>Toggle mount</button>
    <output data-state>{JSON.stringify({ active, visible, mounted })}</output>
    {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}><Targets active={active} save={save} onFocus={focus} /></Activity> : null}
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Consumer /></StrictMode>);
