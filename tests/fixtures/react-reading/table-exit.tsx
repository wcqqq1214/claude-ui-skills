import { Activity, StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ExpandableTable } from '../../../src';
import '../../../src/styles/index.css';

const options = new URLSearchParams(location.search);
const columns = [{ key: 'name', header: 'Name', rowHeader: true }, { key: 'duration', header: 'Duration' }];
const rows = Array.from({ length: 4 }, (_, index) => ({ key: String(index), cells: { name: `Transition ${index + 1}`, duration: `${100 + index * 50}ms` } }));
function Consumer() {
  const [mounted, setMounted] = useState(true), [visible, setVisible] = useState(true), [active, setActive] = useState(true);
  return <main data-cui-theme="light" style={{ width: 320, maxWidth: '100%' }}>
    <button data-hide onClick={() => flushSync(() => setVisible(false))}>Hide table Activity</button>
    <button data-show onClick={() => flushSync(() => setVisible(true))}>Show table Activity</button>
    <button data-reconnect onClick={() => { flushSync(() => setVisible(false)); flushSync(() => setVisible(true)); }}>Reconnect table Activity</button>
    <button data-inactive onClick={() => flushSync(() => setActive(false))}>Deactivate table</button>
    <button data-active onClick={() => flushSync(() => setActive(true))}>Activate table</button>
    <button data-toggle-active onClick={() => setActive(value => !value)}>Toggle table active</button>
    <button data-unmount onClick={() => flushSync(() => setMounted(false))}>Unmount table</button>
    <input data-outside aria-label="Outside table input" />
    {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}>
      <section data-table-host>
        <ExpandableTable active={active && (!options.has('sync-active') || visible)} label="Exit lifecycle table" expandLabel="Expand lifecycle table" closeLabel="Close lifecycle table" columns={columns} rows={rows} />
      </section>
    </Activity> : null}
    <ExpandableTable label="Other table" expandLabel="Expand other table" closeLabel="Close other table" columns={columns} rows={rows} />
  </main>;
}
const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(options.get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
