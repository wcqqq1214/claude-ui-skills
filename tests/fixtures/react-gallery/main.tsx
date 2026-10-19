import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
createRoot(document.getElementById('root')!).render(<StrictMode><Consumer /></StrictMode>);
