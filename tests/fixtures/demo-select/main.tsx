import { Activity, StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DemoSelect } from '../../../demo/components/DemoSelect';
import '../../../demo/style.css';
function Fixture() {
  const [visible, setVisible] = useState(true), [active, setActive] = useState(true), [mounted, setMounted] = useState(true);
  const [value, setValue] = useState('light'), [changes, setChanges] = useState(0);
  return <div className="demo-shell" style={{ padding: 20 }}>
    <button onClick={() => setVisible(!visible)}>Toggle visibility</button>
    <button onClick={() => setActive(!active)}>Toggle active</button>
    <button onClick={() => setMounted(!mounted)}>Toggle mount</button>
    <Activity mode={visible ? 'visible' : 'hidden'}>{mounted ? <DemoSelect label="Theme" value={value} active={active}
      options={['light', 'dark', 'system'].map(value => ({ value, label: value }))}
      onChange={value => { setValue(value); setChanges(count => count + 1); }} /> : null}</Activity>
    <input aria-label="Outside focus" /><output data-changes>{changes}</output>
  </div>;
}
const app = <Fixture />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'off' ? app : <StrictMode>{app}</StrictMode>);
