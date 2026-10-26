import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FileWorkspace, Icon, PinnedList, SidebarModes } from '../../../src';
import type { WorkspaceLabels } from '../../../src';
import '../../../src/styles/index.css';
const labels: WorkspaceLabels = { title: 'Workspace', files: 'Files', resize: 'Resize file list', resizeHint: 'Drag', resizeKeys: 'Arrows: 8px · Shift: 32px · Enter: reset', view: 'File view', preview: 'Preview', code: 'Code', source: 'Source code', expand: 'Expand', restore: 'Restore', empty: 'No files' };
const files = [{ id: 'notes', name: 'a-very-long-file-name-that-must-yield-space-to-the-view-control.md', preview: <h3>Notes</h3>, code: 'first\nsecond' }, { id: 'tokens', name: 'tokens.css', preview: <h3>Tokens</h3>, code: ':root {\n  color: red;\n}' }];
const initial = ['notes', 'reading', 'weekend', 'ideas'];
function Consumer() {
  const [mounted, setMounted] = useState(true), [active, setActive] = useState(true), [width, setWidth] = useState(900), [modeWidth, setModeWidth] = useState(300), [two, setTwo] = useState(false), [rtl, setRtl] = useState(false), [theme, setTheme] = useState('light');
  const [changes, setChanges] = useState(0), [order, setOrder] = useState(initial), [reset, setReset] = useState(0), [long, setLong] = useState(false);
  const count = () => setChanges(value => value + 1);
  const modes = [{ id: 'Chat', label: 'Chat', icon: <Icon name="Chats" /> }, ...(!two ? [{ id: 'Cowork', label: 'Cowork', icon: <Icon name="Tasks" /> }] : []), { id: 'Code', label: 'Code', icon: <Icon name="Code" />, selectedIcon: <Icon name="Code" style={{ fontWeight: 700 }} />, running: true, runningLabel: 'Code, working' }];
  return <main data-cui-theme={theme}>
    <button onClick={() => setMounted(value => !value)}>Mount</button><button onClick={() => setActive(value => !value)}>Active</button><button onClick={() => setTheme(value => value === 'light' ? 'dark' : 'light')}>Theme</button><button onClick={() => setRtl(value => !value)}>RTL</button><button onClick={() => setTwo(value => !value)}>Two modes</button><button onClick={() => { setOrder(initial); setReset(value => value + 1); }}>Reset pins</button><button onClick={() => setLong(value => !value)}>Long title</button><button>Outside</button>
    <label>Workspace width<input type="range" min={300} max={1200} value={width} onChange={event => setWidth(Number(event.target.value))} /></label><label>Mode width<input type="range" min={160} max={360} value={modeWidth} onChange={event => setModeWidth(Number(event.target.value))} /></label><output data-changes>{changes}</output>
    {mounted ? <>
      <section aria-label="First workspace" style={{ width, maxWidth: '100%', marginTop: 20 }}><FileWorkspace files={files} labels={labels} active={active} onValueChange={count} onViewChange={count} onExpandedChange={count} onPaneWidthChange={count} /></section>
      <section aria-label="Second workspace" style={{ width: 700, maxWidth: '100%', marginTop: 20 }}><FileWorkspace files={files} labels={labels} defaultView="code" defaultValue="tokens" /></section>
      <section aria-label="Sidebar" dir={rtl ? 'rtl' : 'ltr'} style={{ width: modeWidth, marginTop: 20 }}><SidebarModes aria-label="Modes" options={modes} active={active} onValueChange={count} /></section>
      <section aria-label="Pins" dir={rtl ? 'rtl' : 'ltr'} style={{ marginTop: 20 }}><PinnedList key={reset} active={active} items={order.map(id => ({ id, title: long && id === 'notes' ? 'A long conversation title that must fade before the action control' : id }))} onOrderChange={ids => { setOrder(ids); count(); }} label="Pinned conversations" actionsLabel={item => `Actions for ${item.id}`} menuLabel="Move conversation" moveUpLabel="Move up" moveDownLabel="Move down" movedLabel={(item, position, total) => `${item.id} moved to ${position} of ${total}`} cancelledLabel="Move cancelled" /></section>
      <section aria-label="Other pins" data-cui-theme="dark" style={{ marginTop: 20 }}><PinnedList items={initial.map(id => ({ id, title: id }))} onOrderChange={count} label="Other conversations" actionsLabel={item => `Other actions for ${item.id}`} menuLabel="Other move" moveUpLabel="Up" moveDownLabel="Down" movedLabel={() => 'Moved'} cancelledLabel="Cancelled" /></section>
    </> : null}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Consumer /></StrictMode>);
