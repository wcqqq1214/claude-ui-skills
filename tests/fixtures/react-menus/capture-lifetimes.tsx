import { Activity, StrictMode, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { FileWorkspace, PinnedList, SubmenuSelect } from '../../../src';
import type { WorkspaceLabels } from '../../../src';
import '../../../src/styles/index.css';

const options = new URLSearchParams(location.search), kind = options.get('kind'), action = options.get('action') ?? 'hide';
const labels: WorkspaceLabels = { title: 'Workspace', files: 'Files', resize: 'Resize', resizeHint: 'Drag', resizeKeys: 'Arrows', view: 'View', preview: 'Preview', code: 'Code', source: 'Source', expand: 'Expand', restore: 'Restore', empty: 'Empty' };
const files = [{ id: 'notes', name: 'notes.md', preview: <p>Preview</p>, code: 'Source' }];

function Consumer() {
  const [mounted, setMounted] = useState(true), [visible, setVisible] = useState(true), [active, setActive] = useState(true), [expanded, setExpanded] = useState(false);
  const [armed, setArmed] = useState(false), [entries, setEntries] = useState(0), [changes, setChanges] = useState<(string | number | string[])[]>([]), [previews, setPreviews] = useState<string[]>([]);
  const [order, setOrder] = useState(['a', 'b', 'c']), outside = useRef<HTMLInputElement>(null);
  function capture(event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (!armed || !(kind === 'pinned' ? target.closest('.cui-pinned-more') : kind === 'pane' ? target.closest('[role="separator"]') : target.closest('button[aria-haspopup="menu"]'))) return;
    // Moving focus during capture otherwise lets Space's native text insertion
    // target the outside input. The obsolete bubble handler must still be silent.
    if (kind === 'pane' && 'key' in event && event.key === ' ') event.preventDefault();
    flushSync(() => {
      setArmed(false); setEntries(value => value + 1);
      if (action === 'unmount') setMounted(false);
      else if (action === 'inactive') setActive(false);
      else if (action === 'expanded') setExpanded(true);
      else { setVisible(false); if (action === 'hide-inactive') setActive(false); }
    });
    outside.current?.focus();
  }
  function restore() { setMounted(true); setVisible(true); setActive(true); setExpanded(false); }
  return <main data-cui-theme="light" style={{ width: 900, maxWidth: '100%', padding: 20 }}>
    <button data-capture-arm onClick={() => { setArmed(true); setChanges([]); setPreviews([]); }}>Arm capture</button>
    <button data-capture-restore onClick={restore}>Restore owner</button>
    <button data-capture-hide onClick={() => { flushSync(() => setVisible(false)); outside.current?.focus(); }}>Hide owner</button>
    <input data-capture-outside ref={outside} aria-label="Outside draft" />
    <output data-capture-state>{JSON.stringify({ mounted, visible, active, expanded, armed, entries, changes, previews, order })}</output>
    <div {...(options.get('event') === 'keydown' ? { onKeyDownCapture: capture } : { onClickCapture: capture })}>
      {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}><section data-capture-owner style={{ marginTop: 30 }}>
        {kind === 'pinned' ? <PinnedList active={active} items={order.map(id => ({ id, title: `Pin ${id}` }))} onOrderChange={ids => { setOrder(ids); setChanges(previous => [...previous, ids]); }} label="Pinned conversations" actionsLabel={item => `Actions ${item.id}`} menuLabel="Move pin" moveUpLabel="Move up" moveDownLabel="Move down" movedLabel={(item, position) => `${item.id} moved to ${position}`} cancelledLabel="Cancelled" initialStatus="Ready" /> : kind === 'pane' ? <FileWorkspace active={active} expanded={expanded} files={files} labels={labels} onPaneWidthChange={width => setChanges(previous => [...previous, width])} /> : <SubmenuSelect active={active} label="Model settings" submenuLabel="Thinking effort" defaultValue="high" options={[{ value: 'low', label: 'Low' }, { value: 'high', label: 'High' }]} onValueChange={value => setChanges(previous => [...previous, value])} onPreviewChange={value => setPreviews(previous => [...previous, value])} />}
      </section></Activity> : null}
    </div>
  </main>;
}
const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(options.get('strict') === 'on' ? <StrictMode>{consumer}</StrictMode> : consumer);
