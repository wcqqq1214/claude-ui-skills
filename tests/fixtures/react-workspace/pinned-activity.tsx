import { Activity, StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { PinnedList } from '../../../src';
import '../../../src/styles/index.css';

const options = new URLSearchParams(location.search);
function Consumer() {
  const [visible, setVisible] = useState(true), [active, setActive] = useState(true), [order, setOrder] = useState(['a', 'b', 'c']);
  const [mounted, setMounted] = useState(true), [cancelledLabel, setCancelledLabel] = useState('Cancelled');
  const [changes, setChanges] = useState<string[][]>([]), outside = useRef<HTMLInputElement>(null);
  function hide() {
    flushSync(() => { setVisible(false); if (options.get('sync') === 'on') setActive(false); });
    outside.current?.focus();
  }
  function show() { flushSync(() => { setVisible(true); setActive(true); }); }
  return <main data-cui-theme="light" style={{ padding: 30 }}>
    <button onClick={hide}>Hide pins</button><button onClick={show}>Show pins</button>
    <button onClick={() => flushSync(() => { setVisible(true); setActive(false); })}>Show inactive pins</button>
    <button onClick={() => { hide(); show(); }}>Reconnect pins</button>
    <button onClick={() => flushSync(() => setActive(false))}>Deactivate pins</button>
    <button onClick={() => flushSync(() => setActive(true))}>Activate pins</button>
    <button onClick={() => flushSync(() => setMounted(false))}>Unmount pins</button>
    <button onClick={() => { hide(); flushSync(() => setMounted(false)); }}>Hide and unmount pins</button>
    <button onClick={() => { flushSync(() => setMounted(true)); show(); }}>Mount pins</button>
    <button onClick={() => setCancelledLabel('Cancelled translated')}>Translate cancellation</button>
    <input ref={outside} aria-label="Outside draft" />
    <output data-pinned-state>{JSON.stringify({ visible, active, order, changes })}</output>
    <Activity mode={visible ? 'visible' : 'hidden'}>
      {mounted ? <section aria-label="Pins" style={{ marginTop: 20 }}><PinnedList active={active} items={order.map(id => ({ id, title: id }))}
        onOrderChange={ids => { setOrder(ids); setChanges(previous => [...previous, ids]); }}
        label="Pinned conversations" actionsLabel={item => `Actions ${item.id}`} menuLabel="Move pin"
        moveUpLabel="Move up" moveDownLabel="Move down" movedLabel={(item, position) => `${item.id} moved to ${position}`} cancelledLabel={cancelledLabel} initialStatus="Ready" />
      </section> : null}
    </Activity>
  </main>;
}

const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(options.get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
