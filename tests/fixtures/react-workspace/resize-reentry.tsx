import { Activity, StrictMode, useState } from 'react';
import type { FocusEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { FileWorkspace } from '../../../src';
import type { WorkspaceLabels } from '../../../src';
import '../../../src/styles/index.css';

const options = new URLSearchParams(location.search);
const action = options.get('action') ?? 'inactive';
const labels: WorkspaceLabels = { title: 'Workspace', files: 'Files', resize: 'Resize', resizeHint: 'Drag', resizeKeys: 'Arrows', view: 'View', preview: 'Preview', code: 'Code', source: 'Source', expand: 'Expand', restore: 'Restore', empty: 'Empty' };
const files = [{ id: 'notes', name: 'notes.md', preview: <p>Preview</p>, code: 'Source' }];

function Consumer() {
  const [mounted, setMounted] = useState(true), [visible, setVisible] = useState(true), [active, setActive] = useState(true), [expanded, setExpanded] = useState(false);
  const [armed, setArmed] = useState(false), [reentries, setReentries] = useState(0), [changes, setChanges] = useState<number[]>([]);
  function reenter(event: FocusEvent<HTMLDivElement>) {
    if (!armed || event.target.getAttribute('role') !== 'separator') return;
    flushSync(() => {
      setArmed(false); setReentries(value => value + 1);
      if (action === 'unmount') setMounted(false);
      else if (action === 'hide' || action === 'hide-show') setVisible(false);
      else if (action === 'expanded') setExpanded(true);
      else setActive(false);
    });
    if (action === 'hide-show') flushSync(() => setVisible(true));
    if (action === 'inactive-active') flushSync(() => setActive(true));
  }
  return <main data-cui-theme="light" style={{ width: 900, maxWidth: '100%' }}>
    <button onClick={() => { setArmed(true); setChanges([]); }}>Arm resize reentry</button>
    <button onClick={() => { setMounted(true); setVisible(true); setActive(true); setExpanded(false); }}>Restore resize owner</button>
    <output data-resize-state>{JSON.stringify({ mounted, visible, active, expanded, armed, reentries, changes })}</output>
    <div {...(options.get('handler') === 'bubble' ? { onFocus: reenter } : { onFocusCapture: reenter })}>
      {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}><FileWorkspace active={active} expanded={expanded} files={files} labels={labels} onPaneWidthChange={width => setChanges(previous => [...previous, width])} /></Activity> : null}
    </div>
  </main>;
}

const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(options.get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
