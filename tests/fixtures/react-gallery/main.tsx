import { Activity, StrictMode, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Gallery } from '../../../src';
import type { GalleryHandle, GalleryLabels } from '../../../src';
import landscape from '../../../src/assets/artwork/landscape.svg';
import dusk from '../../../src/assets/artwork/landscape-dusk.svg';
import sand from '../../../src/assets/artwork/landscape-sand.svg';
import '../../../src/styles/index.css';
const original = [{ id: 'green', src: landscape, alt: 'Mountains', filename: 'landscape.svg' }, { id: 'dusk', src: dusk, alt: 'Dusk', filename: 'landscape-dusk.svg' }, { id: 'sand', src: sand, alt: 'Sand', filename: 'landscape-sand.svg' }];
const labels: GalleryLabels = { dialog: 'First gallery', close: 'Close', previous: 'Previous', next: 'Next', open: (_, index) => `Open image ${index + 1}`, zoom: (_, index) => `Zoom image ${index + 1}`, count: (position, total) => `${position} / ${total}` };
function Consumer() {
  const first = useRef<GalleryHandle>(null), second = useRef<GalleryHandle>(null);
  const [mounted, setMounted] = useState(true), [active, setActive] = useState(true), [rtl, setRtl] = useState(false), [items, setItems] = useState(original), [changes, setChanges] = useState<(boolean | string)[]>([]), [long, setLong] = useState(false);
  const count = (value: boolean | string) => setChanges(previous => [...previous, value]);
  return <main data-cui-theme="light" dir={rtl ? 'rtl' : 'ltr'}>
    <button onClick={() => setMounted(value => !value)}>Mount</button><button onClick={() => setActive(value => !value)}>Active</button><button onClick={() => setRtl(value => !value)}>RTL</button><button onClick={() => setLong(value => !value)}>Long</button>
    <button onClick={() => setItems(values => [...values].reverse())}>Reverse</button><button onClick={() => setItems(values => values.filter(item => item.id !== 'dusk'))}>Remove dusk</button><button onClick={() => setItems([])}>Empty</button><button onClick={() => setItems(original)}>Restore</button>
    <button onClick={() => first.current?.open()}>Open first</button><button onClick={() => first.current?.close()}>Close first</button><button onClick={() => second.current?.open()}>Open second</button><button onClick={() => second.current?.close()}>Close second</button><output data-changes>{JSON.stringify(changes)}</output>
    {mounted ? <>
      <section aria-label="First" style={{ maxWidth: 600, margin: '20px auto' }}><Gallery ref={first} active={active} items={items.map(item => ({ ...item, filename: long ? 'very-long-image-name-'.repeat(10) + item.filename : item.filename }))} labels={labels} onOpenChange={count} onValueChange={count} /></section>
      <section aria-label="Second" data-cui-theme="dark" style={{ maxWidth: 400, margin: '20px auto' }}><Gallery ref={second} defaultValue="dusk" items={original} labels={{ ...labels, dialog: 'Second gallery' }} /></section>
    </> : null}
  </main>;
}
function ActivityGallery({ gallery, autoReopen, onOpenChange, onValueChange }: { gallery: { current: GalleryHandle | null }; autoReopen: boolean; onOpenChange: (open: boolean) => void; onValueChange: (id: string) => void }) {
  useLayoutEffect(() => {
    let current = true;
    // Reopen after effects reconnect, outside React's current commit.
    queueMicrotask(() => { if (current && autoReopen) gallery.current?.open(); });
    return () => { current = false; };
  }, []);
  return <section data-activity-host style={{ maxWidth: 600, margin: '20px auto' }}>
    <button onClick={() => gallery.current?.open()}>Open Activity</button>
    <Gallery ref={gallery} items={original} labels={{ ...labels, dialog: 'Activity gallery' }} onOpenChange={onOpenChange} onValueChange={onValueChange} />
  </section>;
}
function ActivityConsumer() {
  const gallery = useRef<GalleryHandle>(null), autoReopen = !new URLSearchParams(location.search).has('no-reopen');
  const [mode, setMode] = useState<'hidden' | 'visible'>('visible'), [changes, setChanges] = useState<boolean[]>([]), [selections, setSelections] = useState<string[]>([]);
  return <main data-cui-theme="light">
    <button onClick={() => { flushSync(() => setMode('hidden')); flushSync(() => setMode('visible')); }}>Reconnect Activity</button>
    <button onClick={() => { flushSync(() => setMode('hidden')); flushSync(() => setMode('visible')); gallery.current?.open(); }}>Reconnect and open Activity</button>
    <button onClick={() => flushSync(() => setMode('hidden'))}>Hide Activity</button>
    <button onClick={() => flushSync(() => setMode('visible'))}>Show Activity</button>
    <output data-activity-changes>{JSON.stringify(changes)}</output>
    <output data-activity-selections>{JSON.stringify(selections)}</output>
    <Activity mode={mode}><ActivityGallery gallery={gallery} autoReopen={autoReopen} onOpenChange={value => setChanges(previous => [...previous, value])} onValueChange={id => setSelections(previous => [...previous, id])} /></Activity>
  </main>;
}
function SelectionConsumer() {
  const gallery = useRef<GalleryHandle>(null), handled = useRef(false);
  const action = new URLSearchParams(location.search).get('reentry');
  const [active, setActive] = useState(true), [mounted, setMounted] = useState(true), [items, setItems] = useState(original);
  const [changes, setChanges] = useState<boolean[]>([]), [selections, setSelections] = useState<string[]>([]);
  function select(id: string) {
    setSelections(previous => [...previous, id]);
    if (action === 'nested-cancel-after-close') {
      if (id === 'dusk') gallery.current?.open('sand');
      else gallery.current?.close();
      return;
    }
    if (handled.current) return;
    handled.current = true;
    if (action === 'inactive') flushSync(() => setActive(false));
    if (action === 'empty') flushSync(() => setItems([]));
    if (action === 'unmount') flushSync(() => setMounted(false));
    if (action === 'remove' || action === 'remove-after-close') flushSync(() => setItems(values => values.filter(item => item.id !== id)));
    if (action === 'replace') flushSync(() => setItems(values => values.map(item => item.id === id ? { ...item, src: sand, filename: 'replacement.svg' } : item)));
    if (action === 'close' || action === 'reopen' || action === 'close-after-close') gallery.current?.close();
    if (action === 'reopen') gallery.current?.open('sand');
  }
  return <main data-cui-theme="light" data-selection-active={active}>
    <button onClick={() => gallery.current?.open('dusk')}>Open selected</button>
    <button onClick={() => gallery.current?.open()}>Open current</button>
    <button onClick={() => { gallery.current?.close(); gallery.current?.open('dusk'); }}>Close and select</button>
    <output data-selection-changes>{JSON.stringify(changes)}</output><output data-selection-values>{JSON.stringify(selections)}</output>
    {mounted && <section aria-label="Selection"><Gallery ref={gallery} active={active} items={items} labels={{ ...labels, dialog: 'Selection gallery' }} onValueChange={select} onOpenChange={value => setChanges(previous => [...previous, value])} /></section>}
  </main>;
}
const parameters = new URLSearchParams(location.search);
createRoot(document.getElementById('root')!).render(<StrictMode>{parameters.has('activity') ? <ActivityConsumer /> : parameters.has('reentry') ? <SelectionConsumer /> : <Consumer />}</StrictMode>);
