import { Activity, StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ArtifactActionsCard, SubmenuSelect } from '../../../src';
import '../../../src/styles/index.css';
import image from '../../../src/assets/artwork/landscape.svg';

function Consumer() {
  const [active, setActive] = useState(true), [visible, setVisible] = useState(true), [changes, setChanges] = useState(0);
  function hide() { flushSync(() => { setActive(false); setVisible(false); }); }
  function show() { flushSync(() => { setActive(true); setVisible(true); }); }
  return <main data-cui-theme="light" style={{ maxWidth: 800, padding: 20 }}>
    <button data-menu-hide onClick={hide}>Hide menu Activity</button>
    <button data-menu-show onClick={show}>Show menu Activity</button>
    <button data-menu-cycle onClick={() => { hide(); show(); }}>Hide then show menu Activity</button>
    <button data-menu-active onClick={() => flushSync(() => setActive(value => !value))}>Toggle menu active</button>
    <input data-menu-outside aria-label="Outside menu input" />
    <output data-menu-state data-active={active} data-visible={visible} data-changes={changes}>{String(active)} / {String(visible)} / {changes}</output>
    <Activity mode={visible ? 'visible' : 'hidden'}>
      <section aria-label="Retained Artifact" data-retained-artifact style={{ width: 420, marginTop: 30 }}>
        <ArtifactActionsCard active={active} title="Landscape" subtitle="Artifact" image={image} actionsLabel="Retained Artifact actions" actions={[
          { id: 'open', label: 'Open retained artwork', onSelect: () => setChanges(count => count + 1) },
        ]} />
      </section>
      <section aria-label="Retained submenu" data-retained-submenu style={{ width: 340, marginTop: 30 }}>
        <SubmenuSelect active={active} label="Retained model settings" submenuLabel="Retained thinking effort" defaultValue="high" options={[
          { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium', disabled: true }, { value: 'high', label: 'High' },
        ]} onValueChange={() => setChanges(count => count + 1)} />
      </section>
    </Activity>
  </main>;
}
const content = <Consumer />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'on' ? <StrictMode>{content}</StrictMode> : content);
