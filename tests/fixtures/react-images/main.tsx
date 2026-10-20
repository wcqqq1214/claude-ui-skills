import { Activity, StrictMode, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ImagePreview } from '../../../src';
import type { ImagePreviewHandle } from '../../../src';
import landscape from '../../../src/assets/artwork/landscape.svg';
import dusk from '../../../src/assets/artwork/landscape-dusk.svg';
import '../../../src/styles/index.css';
function Consumer() {
  const first = useRef<ImagePreviewHandle>(null), second = useRef<ImagePreviewHandle>(null);
  const query = new URLSearchParams(location.search);
  const [preview, setPreview] = useState<string>();
  const [mounted, setMounted] = useState(true), [active, setActive] = useState(true), [theme, setTheme] = useState('light'), [contain, setContain] = useState(false), [changes, setChanges] = useState<boolean[]>([]);
  return <main data-cui-theme={theme}>
    <button onClick={() => setMounted(value => !value)}>Mount</button><button onClick={() => setActive(value => !value)}>Active</button><button onClick={() => setTheme(value => value === 'light' ? 'dark' : 'light')}>Theme</button><button onClick={() => setContain(value => !value)}>Contain</button>
    <button onClick={() => first.current?.open()}>Open first</button><button onClick={() => first.current?.close()}>Close first</button>
    <button onClick={() => second.current?.open()}>Open second</button><button onClick={() => second.current?.close()}>Close second</button>
    <button onClick={() => setPreview(query.get('preview') ?? landscape)}>Use preview</button><button onClick={() => setPreview(query.get('next-preview') ?? landscape)}>Replace preview</button>
    <output data-changes>{JSON.stringify(changes)}</output>
    {mounted ? <>
      <section aria-label="First"><ImagePreview ref={first} active={active} src={landscape} previewSrc={preview} alt="Mountains" openLabel="Enlarge first" dialogLabel="First preview" actionsLabel="First actions" closeLabel="Dismiss first" onOpenChange={open => setChanges(values => [...values, open])} thumbnailStyle={contain ? { width: 400, height: 300, objectFit: 'contain', objectPosition: '25% 75%' } : undefined} /></section>
      <section aria-label="Second" data-cui-theme="dark" style={{ marginTop: 30 }}><ImagePreview ref={second} src={landscape} alt="Other mountains" openLabel="Enlarge second" dialogLabel="Second preview" actionsLabel="Second actions" closeLabel="Dismiss second" /></section>
    </> : null}
  </main>;
}
function ActivityPreview({ preview, autoReopen, onOpenChange }: { preview: { current: ImagePreviewHandle | null }; autoReopen: boolean; onOpenChange: (open: boolean) => void }) {
  const reopen = useRef(false);
  useLayoutEffect(() => {
    let current = true;
    queueMicrotask(() => { if (current && autoReopen && reopen.current) preview.current?.open(); });
    return () => { current = false; };
  }, []);
  return <section data-activity-host>
    <button onClick={() => { reopen.current = true; preview.current?.open(); }}>Open Activity</button>
    <ImagePreview ref={preview} src={landscape} alt="Mountains" openLabel="Enlarge Activity" dialogLabel="Activity preview" actionsLabel="Activity actions" closeLabel="Dismiss Activity" onOpenChange={onOpenChange} />
  </section>;
}
function ActivityConsumer() {
  const preview = useRef<ImagePreviewHandle>(null), autoReopen = !new URLSearchParams(location.search).has('no-reopen');
  const [mode, setMode] = useState<'hidden' | 'visible'>('visible'), [changes, setChanges] = useState<boolean[]>([]);
  return <main data-cui-theme="light">
    <button onClick={() => { flushSync(() => setMode('hidden')); flushSync(() => setMode('visible')); }}>Reconnect Activity</button>
    <button onClick={() => { flushSync(() => setMode('hidden')); flushSync(() => setMode('visible')); preview.current?.open(); }}>Reconnect and open Activity</button>
    <button onClick={() => flushSync(() => setMode('hidden'))}>Hide Activity</button>
    <button onClick={() => flushSync(() => setMode('visible'))}>Show Activity</button>
    <output data-activity-changes>{JSON.stringify(changes)}</output>
    <Activity mode={mode}><ActivityPreview preview={preview} autoReopen={autoReopen} onOpenChange={value => setChanges(previous => [...previous, value])} /></Activity>
  </main>;
}
function FocusConsumer() {
  const preview = useRef<ImagePreviewHandle>(null), cancelOnFocus = useRef(true);
  const [active, setActive] = useState(true), [changes, setChanges] = useState<boolean[]>([]);
  return <main data-cui-theme="light" onFocusCapture={event => {
    if (cancelOnFocus.current && event.target.closest('dialog')) {
      cancelOnFocus.current = false;
      flushSync(() => setActive(false));
    }
  }}>
    <button onClick={() => setActive(true)}>Reactivate</button>
    <button onClick={() => preview.current?.open()}>Open focus preview</button>
    <button onClick={() => preview.current?.close()}>Close focus preview</button>
    <output data-focus-changes>{JSON.stringify(changes)}</output>
    <ImagePreview ref={preview} active={active} src={landscape} alt="Mountains" openLabel="Enlarge focus preview" dialogLabel="Focus preview" actionsLabel="Focus actions" closeLabel="Dismiss focus preview" onOpenChange={value => setChanges(previous => [...previous, value])} />
  </main>;
}
function RefreshFocusConsumer() {
  const preview = useRef<ImagePreviewHandle>(null), opener = useRef<HTMLButtonElement>(null), reopenOnFocus = useRef(false);
  const [src, setSrc] = useState(landscape), [changes, setChanges] = useState<boolean[]>([]);
  return <main data-cui-theme="light" onFocusCapture={event => {
    if (reopenOnFocus.current && event.target === opener.current) {
      reopenOnFocus.current = false;
      preview.current?.close(); preview.current?.open();
    }
  }}>
    <button ref={opener} onClick={() => preview.current?.open()}>Open refresh preview</button>
    <button onClick={() => { reopenOnFocus.current = true; setSrc(dusk); }}>Replace refresh thumbnail</button>
    <output data-refresh-changes>{JSON.stringify(changes)}</output>
    <ImagePreview ref={preview} src={src} previewSrc={landscape} alt="Mountains" openLabel="Enlarge refresh preview" dialogLabel="Refresh preview" actionsLabel="Refresh actions" closeLabel="Dismiss refresh preview" onOpenChange={value => setChanges(previous => [...previous, value])} />
  </main>;
}
const query = new URLSearchParams(location.search);
createRoot(document.getElementById('root')!).render(<StrictMode>{query.has('activity') ? <ActivityConsumer /> : query.has('focus') ? <FocusConsumer /> : query.has('refresh-focus') ? <RefreshFocusConsumer /> : <Consumer />}</StrictMode>);
