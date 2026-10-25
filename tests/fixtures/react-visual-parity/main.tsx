import { Activity, StrictMode, useState } from 'react';
import type { CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { Accordion, FileWorkspace, GroupedSearch, NotificationStack, PinnedList, SidebarModes, SubmenuSelect } from '../../../src';
import type { WorkspaceLabels } from '../../../src';
import '../../../src/styles/index.css';

const labels: WorkspaceLabels = { title: 'Workspace', files: 'Files', resize: 'Resize file list', resizeHint: 'Drag', resizeKeys: 'Arrows: 8px', view: 'File view', preview: 'Preview', code: 'Code', source: 'Source code', expand: 'Expand', restore: 'Restore', empty: 'No files' };
const files = [{ id: 'notes', name: 'design-notes.md', preview: <p>Design notes</p>, code: '# Design notes' }];
const initial = [{ id: 'notes', title: 'Design notes' }, { id: 'reading', title: 'Reading list' }];

function Consumer() {
  const [theme, setTheme] = useState('light'), [custom, setCustom] = useState(false), [order, setOrder] = useState(initial.map(item => item.id)), [typographyVisible, setTypographyVisible] = useState(true);
  return <main data-cui-theme={theme} style={{ width: 960, maxWidth: '100%', fontWeight: 'var(--cui-regular)', ...(custom ? { '--cui-clay': '#4777a3' } : {}) } as CSSProperties}>
    <button onClick={() => { setTheme('light'); setCustom(false); }}>Light theme</button>
    <button onClick={() => { setTheme('dark'); setCustom(false); }}>Dark theme</button>
    <button onClick={() => { setTheme('dark'); setCustom(true); }}>Custom clay</button>
    <button>Outside focus</button>
    <section aria-label="Workspace sample" style={{ marginTop: 20 }}><FileWorkspace className="consumer-typography" files={files} labels={labels} /></section>
    <section aria-label="Button samples" style={{ fontSize: 18, lineHeight: 1.6 }}>
      <SubmenuSelect className="consumer-typography" label="Model settings" submenuLabel="Effort" options={[{ value: 'high', label: 'High' }]} />
      <GroupedSearch className="consumer-typography" label="Search" emptyMessage="No results" items={[{ id: 'result', label: 'Search result' }]} onSelect={() => {}} />
      <SidebarModes className="consumer-typography" aria-label="Modes" options={[{ id: 'chat', label: 'Chat mode', icon: null }]} />
      <Accordion className="consumer-typography" title="Disclosure title">Disclosure content</Accordion>
      <NotificationStack className="consumer-typography" dismissLabel="Dismiss" defaultNotices={[{ message: 'Notice', duration: null, action: { label: 'Undo action', onClick: () => {} } }]} />
    </section>
    <button onClick={() => setTypographyVisible(value => !value)}>Toggle typography Activity</button>
    <Activity mode={typographyVisible ? 'visible' : 'hidden'}>
      <section aria-label="Accordion typography" style={{ fontSize: 18, lineHeight: 1.8 }}>
        <Accordion title="Custom disclosure" triggerClassName="font-cui-mono text-xs font-medium leading-[1.6]" defaultOpen><input aria-label="Disclosure draft" /></Accordion>
        <Accordion title="Size override" triggerClassName="text-xs">Content</Accordion>
        <Accordion title="Weight override" triggerClassName="font-medium">Content</Accordion>
        <Accordion title="Line height override" triggerClassName="leading-[1.6]">Content</Accordion>
        <Accordion title="Family override" triggerClassName="font-cui-mono">Content</Accordion>
      </section>
    </Activity>
    <section aria-label="Pinned sample" style={{ marginTop: 20 }}><PinnedList items={order.map(id => initial.find(item => item.id === id)!)} onOrderChange={setOrder} label="Pinned conversations" actionsLabel={item => `Actions for ${item.title}`} menuLabel="Move conversation" moveUpLabel="Move up" moveDownLabel="Move down" movedLabel={(item, position) => `${item.title} moved to ${position}`} cancelledLabel="Move cancelled" /></section>
  </main>;
}

const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
