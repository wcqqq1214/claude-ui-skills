import { Activity, StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ControlsChapter } from '../../../demo/chapters/ControlsChapter';
import { messages } from '../../../demo/i18n';
import '../../../demo/style.css';
function Fixture() {
  const [visible, setVisible] = useState(true), [active, setActive] = useState(true), [mounted, setMounted] = useState(true);
  return <div className="demo-shell" style={{ padding: 20 }}>
    <button onClick={() => setVisible(!visible)}>Toggle visibility</button>
    <button onClick={() => setActive(!active)}>Toggle active</button>
    <button onClick={() => setMounted(!mounted)}>Toggle mount</button>
    <Activity mode={visible ? 'visible' : 'hidden'}>{mounted ? <ControlsChapter copy={messages.en} locale="en" active={active} /> : null}</Activity>
    <input aria-label="Outside focus" />
  </div>;
}
const app = <Fixture />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'off' ? app : <StrictMode>{app}</StrictMode>);
