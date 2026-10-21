import { Activity, StrictMode, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ArtifactActionsCard, SubmenuSelect } from '../../../src';
import '../../../src/styles/index.css';
import image from '../../../src/assets/artwork/landscape.svg';

const query = new URLSearchParams(location.search), kind = query.get('kind') ?? 'artifact', controlled = query.get('controlled') === 'on';
function Consumer() {
  const outside = useRef<HTMLInputElement>(null), region = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true), [visible, setVisible] = useState(true), [mounted, setMounted] = useState(true);
  const [mode, setMode] = useState(query.get('mode') ?? 'normal'), [selected, setSelected] = useState('high'), [changes, setChanges] = useState<string[]>([]);
  function choose(next = 'action') {
    flushSync(() => { setChanges(previous => [...previous, next]); setSelected(next); });
    if (mode === 'normal') return;
    if (mode === 'inactive' || mode === 'reactivate') flushSync(() => setActive(false));
    if (mode === 'reactivate') flushSync(() => setActive(true));
    if (mode === 'unmount') flushSync(() => setMounted(false));
    if (mode === 'reconnect' || mode === 'reopen') flushSync(() => setVisible(false));
    if (mode === 'pagehide') window.dispatchEvent(new Event('pagehide'));
    outside.current?.focus();
    if (mode === 'reconnect' || mode === 'reopen') flushSync(() => setVisible(true));
    if (mode === 'reopen') {
      flushSync(() => {
        const trigger = region.current?.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
        trigger?.focus(); trigger?.click();
      });
      if (kind === 'submenu') flushSync(() => region.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]')?.click());
    }
  }
  return <main data-cui-theme="light" style={{ width: 520, padding: 24 }}>
    <input ref={outside} aria-label="Outside callback input" />
    <button data-callback-reset onClick={() => flushSync(() => { setActive(true); setVisible(true); setMounted(true); setMode('normal'); })}>Restore normal callback</button>
    <output data-callback-state>{JSON.stringify({ active, visible, mounted, selected, changes })}</output>
    <div ref={region} data-callback-region style={{ marginTop: 30 }}>
      <Activity mode={visible ? 'visible' : 'hidden'}>
        {mounted ? kind === 'artifact'
          ? <ArtifactActionsCard active={active} title="Landscape" subtitle="Artifact" image={image} actionsLabel="Callback Artifact actions" actions={[{ id: 'choose', label: 'Choose callback action', onSelect: () => choose() }]} />
          : <SubmenuSelect active={active} label="Callback model settings" submenuLabel="Callback thinking effort" defaultValue="high" value={controlled ? selected : undefined} options={[
            { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium', disabled: true }, { value: 'high', label: 'High' },
          ]} onValueChange={choose} /> : null}
      </Activity>
    </div>
  </main>;
}
const content = <Consumer />;
createRoot(document.getElementById('root')!).render(query.get('strict') === 'on' ? <StrictMode>{content}</StrictMode> : content);
