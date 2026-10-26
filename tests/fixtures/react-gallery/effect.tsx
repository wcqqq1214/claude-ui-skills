import { Activity, StrictMode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Gallery } from '../../../src';
import type { GalleryHandle } from '../../../src';
import landscape from '../../../src/assets/artwork/landscape.svg';
import dusk from '../../../src/assets/artwork/landscape-dusk.svg';
import '../../../src/styles/index.css';
const parameters = new URLSearchParams(location.search);
const useHostEffect = parameters.get('effect') === 'layout' ? useLayoutEffect : useEffect;
function Host({ open, active, onOpenChange }: { open: boolean; active: boolean; onOpenChange: (open: boolean) => void }) {
  const ref = useRef<GalleryHandle>(null);
  useHostEffect(() => {
    if (open) ref.current?.open('dusk'); else ref.current?.close();
    if (parameters.get('cancel') === 'pagehide') queueMicrotask(() => window.dispatchEvent(new Event('pagehide')));
  }, [open]);
  return <Gallery ref={ref} active={active} onOpenChange={onOpenChange} items={[{ id: 'green', src: landscape, alt: 'Mountains', filename: 'green.svg' }, { id: 'dusk', src: dusk, alt: 'Dusk', filename: 'dusk.svg' }]} labels={{ dialog: 'Effect gallery', close: 'Close', previous: 'Previous', next: 'Next', open: item => `Open ${item.id}`, zoom: item => `Zoom ${item.id}`, count: (position, total) => `${position} / ${total}` }} />;
}
function Consumer() {
  const [open, setOpen] = useState(true), [visible, setVisible] = useState(true), [changes, setChanges] = useState<boolean[]>([]), [active, setActive] = useState(!parameters.has('initial-inactive')), [mounted, setMounted] = useState(true);
  useLayoutEffect(() => {
    const cancel = parameters.get('cancel');
    if (cancel === 'inactive') setActive(false);
    if (cancel === 'hide') setVisible(false);
    if (cancel === 'unmount') setMounted(false);
    if (parameters.has('initial-inactive')) setActive(true);
  }, []);
  return <main data-cui-theme="light">
    <input aria-label="Outside gallery" />
    <button onClick={() => setOpen(false)}>Effect close</button>
    <button onClick={() => setOpen(true)}>Effect open</button>
    <button onClick={() => flushSync(() => setVisible(false))}>Hide gallery</button>
    <button onClick={() => flushSync(() => setVisible(true))}>Show gallery</button>
    <output data-effect-changes>{JSON.stringify(changes)}</output>
    <Activity mode={visible ? 'visible' : 'hidden'}>{mounted && <Host open={open} active={active} onOpenChange={value => setChanges(previous => [...previous, value])} />}</Activity>
  </main>;
}
const app = <Consumer />;
createRoot(document.getElementById('root')!).render(parameters.get('strict') === 'on' ? <StrictMode>{app}</StrictMode> : app);
