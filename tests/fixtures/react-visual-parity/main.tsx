import { StrictMode, useState } from 'react';
import type { CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { FileWorkspace, PinnedList } from '../../../src';
import type { WorkspaceLabels } from '../../../src';
import '../../../src/styles/index.css';

const labels: WorkspaceLabels = { title: 'Workspace', files: 'Files', resize: 'Resize file list', resizeHint: 'Drag', resizeKeys: 'Arrows: 8px', view: 'File view', preview: 'Preview', code: 'Code', source: 'Source code', expand: 'Expand', restore: 'Restore', empty: 'No files' };
const files = [{ id: 'notes', name: 'design-notes.md', preview: <p>Design notes</p>, code: '# Design notes' }];
const initial = [{ id: 'notes', title: 'Design notes' }, { id: 'reading', title: 'Reading list' }];

function Consumer() {
  const [theme, setTheme] = useState('light'), [custom, setCustom] = useState(false), [order, setOrder] = useState(initial.map(item => item.id));
  return <main data-cui-theme={theme} style={{ width: 960, maxWidth: '100%', fontWeight: 'var(--cui-regular)', ...(custom ? { '--cui-clay': '#4777a3' } : {}) } as CSSProperties}>
    <button onClick={() => { setTheme('light'); setCustom(false); }}>Light theme</button>
    <button onClick={() => { setTheme('dark'); setCustom(false); }}>Dark theme</button>
    <button onClick={() => { setTheme('dark'); setCustom(true); }}>Custom clay</button>
    <button>Outside focus</button>
    <section aria-label="Workspace sample" style={{ marginTop: 20 }}><FileWorkspace files={files} labels={labels} /></section>
    <section aria-label="Pinned sample" style={{ marginTop: 20 }}><PinnedList items={order.map(id => initial.find(item => item.id === id)!)} onOrderChange={setOrder} label="Pinned conversations" actionsLabel={item => `Actions for ${item.title}`} menuLabel="Move conversation" moveUpLabel="Move up" moveDownLabel="Move down" movedLabel={(item, position) => `${item.title} moved to ${position}`} cancelledLabel="Move cancelled" /></section>
  </main>;
}

const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
