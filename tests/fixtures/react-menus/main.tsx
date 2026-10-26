import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArtifactActionsCard, GroupedSearch, SubmenuSelect, useSearchHighlight } from '../../../src';
import '../../../src/styles/index.css';
import image from '../../../src/assets/artwork/landscape.svg';
const options = [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium', disabled: true }, { value: 'high', label: 'High' }, { value: 'max', label: 'Max' }];
const settings = [{ id: 'appearance', label: 'Appearance', group: 'Interface' }, { id: 'language', label: 'Language', group: 'Interface' }, { id: 'notifications', label: 'Notifications', group: 'Updates' }];
function Menus({ active }: { active: boolean }) {
  const [selected, setSelected] = useState('high'), [changes, setChanges] = useState(0), [action, setAction] = useState(''), [query, setQuery] = useState(''), [failedImage, setFailedImage] = useState(false);
  const rows = useRef(new Map<string, HTMLDivElement>()), headings = useRef(new Map<string, HTMLHeadingElement>());
  const { highlight } = useSearchHighlight(active);
  return <>
    <section aria-label="First menu" style={{ width: 340, maxWidth: '100%' }}>
      <SubmenuSelect active={active} label="Model settings" submenuLabel="Thinking effort" options={options} value={selected} onValueChange={value => { setSelected(value); setChanges(count => count + 1); }} renderPreview={(preview, committed) => <output>{preview ?? '-'} / {committed}</output>} />
      <output data-changes>{changes}</output><button onClick={() => setSelected('low')}>External selection</button><button onClick={() => setSelected('')}>Remove selection</button>
    </section>
    <section aria-label="Second menu" data-cui-theme="dark" style={{ width: 340, maxWidth: '100%', marginTop: 20 }}>
      <SubmenuSelect active={active} label="Other settings" submenuLabel="Other effort" options={options} defaultValue="max" />
    </section>
    <section aria-label="Search" style={{ width: 340, maxWidth: '100%', marginTop: 20 }}>
      <GroupedSearch label="Find a setting" placeholder="Search" emptyMessage="No matching settings" autoFocus items={settings} query={query} onQueryChange={setQuery} onSelect={item => highlight(rows.current.get(item.id)!, headings.current.get(item.id)!)} />
      <div data-scroll style={{ height: 180, overflowY: 'auto' }}>
        <div style={{ height: 250 }} />
        {settings.map(item => <div key={item.id} data-row={item.id} ref={node => { if (node) rows.current.set(item.id, node); else rows.current.delete(item.id); }} style={{ minHeight: 150, padding: 6 }}>
          <h3 tabIndex={-1} ref={node => { if (node) headings.current.set(item.id, node); else headings.current.delete(item.id); }} style={{ width: 'fit-content' }}>{item.label}</h3>
        </div>)}
        <div style={{ height: 250 }} />
      </div>
    </section>
    <section aria-label="Artifact" style={{ width: 420, maxWidth: '100%', marginTop: 20 }}>
      <button onClick={() => setFailedImage(value => !value)}>Image failure</button>
      <ArtifactActionsCard active={active} title="Landscape" subtitle="Artifact · Today" image={failedImage ? 'data:image/png;base64,broken' : image} actionsLabel="Artifact actions" actions={[
        { id: 'open', label: 'Open', onSelect: () => setAction('open') }, { id: 'copy', label: 'Copy link', disabled: true, onSelect: () => setAction('copy') }, { id: 'pin', label: 'Pin', onSelect: () => setAction('pin') },
      ]} /><output data-action>{action}</output>
    </section>
  </>;
}
function Consumer() {
  const [mounted, setMounted] = useState(true), [active, setActive] = useState(true);
  return <main data-cui-theme="light" style={{ maxWidth: 800 }}>
    <button onClick={() => setMounted(value => !value)}>Mount</button><button onClick={() => setActive(value => !value)}>Active</button><button>Outside</button>
    {mounted ? <Menus active={active} /> : null}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Consumer /></StrictMode>);
