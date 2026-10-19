import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Checkbox, DiscreteSlider, SegmentedControl, Switch } from '../../../src';
import '../../../src/styles/index.css';

// Deliberately imports no demo stylesheet, fonts, globals or fixtures.
const initialOptions = [{ value: 'a', label: 'One' }, { value: 'b', label: 'A longer label' }, { value: 'c', label: 'Three', disabled: true }, { value: 'd', label: 'Four' }];
function Consumer() {
  const [mounted, setMounted] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [selected, setSelected] = useState('b');
  const [calls, setCalls] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [scale, setScale] = useState(1);
  const options = initialOptions.map(option => ({ ...option, label: translated ? `Translated ${option.label} 汉字` : option.label }));
  return <main data-cui-theme={theme} style={{ padding: 20, background: 'var(--cui-bg)', color: 'var(--cui-text)' }}>
    <button onClick={() => setMounted(!mounted)}>Mount</button>
    <button onClick={() => setHidden(!hidden)}>Visibility</button>
    <button onClick={() => setTranslated(!translated)}>Translate</button>
    <button onClick={() => setSelected('d')}>Parent selection</button>
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Theme</button>
    <button onClick={() => setScale(scale === 1 ? .75 : 1)}>Scale</button>
    <output aria-label="Change calls">{calls}</output>
    {mounted ? <div style={{ zoom: scale }}>
      <div hidden={hidden}><SegmentedControl aria-label="Controlled" options={options} value={selected} onValueChange={next => { setSelected(next); setCalls(count => count + 1); }} /></div>
      <div><SegmentedControl aria-label="Independent" size="compact" options={initialOptions} defaultValue="a" /></div>
      <div><SegmentedControl aria-label="Disabled group" options={initialOptions} defaultValue="a" disabled /></div>
      <div><SegmentedControl aria-label="Empty group" options={[]} /></div>
      <Switch aria-label="Enabled switch" defaultChecked />
      <Switch aria-label="Disabled switch" disabled />
      <form><Checkbox aria-label="Native checkbox" defaultChecked /><button type="reset">Reset checkbox</button></form>
      <div style={{ width: 300, maxWidth: '100%' }}><DiscreteSlider aria-label="Independent slider" options={initialOptions} defaultValue="b" /></div>
      <DiscreteSlider aria-label="Empty slider" options={[]} />
    </div> : null}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Consumer /></StrictMode>);
