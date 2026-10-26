import { Activity, StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
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
function ActivitySliderConsumer() {
  const [visible, setVisible] = useState(true), [mounted, setMounted] = useState(true), [changes, setChanges] = useState(0);
  return <main style={{ padding: 20 }}>
    <button onClick={() => flushSync(() => setVisible(false))}>Hide slider</button>
    <button onClick={() => flushSync(() => setVisible(true))}>Show slider</button>
    <button onClick={() => flushSync(() => setMounted(false))}>Unmount slider</button>
    <output data-slider-changes>{changes}</output>
    {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}>
      <div style={{ width: 300, marginTop: 20 }}><DiscreteSlider aria-label="Activity slider" options={initialOptions} defaultValue="b" onValueChange={() => setChanges(value => value + 1)} /></div>
    </Activity> : null}
  </main>;
}
function PointerBoundarySliderConsumer({ mode }: { mode: string }) {
  const [visible, setVisible] = useState(true), [mounted, setMounted] = useState(true), [disabled, setDisabled] = useState(mode === 'disabled'), [single, setSingle] = useState(false);
  const [downs, setDowns] = useState(0), [changes, setChanges] = useState(0);
  return <main style={{ padding: 20 }}>
    <button onClick={() => flushSync(() => { setVisible(true); setDisabled(false); setSingle(false); })}>Restore slider</button>
    <output data-pointer-downs>{downs}</output><output data-pointer-changes>{changes}</output>
    {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}>
      <div style={{ width: 300, marginTop: 20 }}><DiscreteSlider aria-label="Pointer boundary slider" options={single ? initialOptions.slice(0, 1) : initialOptions} defaultValue="b" disabled={disabled}
        onValueChange={() => setChanges(value => value + 1)} onPointerDown={event => {
          setDowns(value => value + 1);
          if (mode === 'prevented') event.preventDefault();
          if (mode === 'unmount') flushSync(() => setMounted(false));
          if (mode === 'disable') flushSync(() => setDisabled(true));
          if (mode === 'single') flushSync(() => setSingle(true));
          if (mode === 'hide' || mode === 'reconnect') flushSync(() => setVisible(false));
          if (mode === 'reconnect') flushSync(() => setVisible(true));
          if (mode === 'blur') window.dispatchEvent(new Event('blur'));
        }} /></div>
    </Activity> : null}
  </main>;
}
const query = new URLSearchParams(location.search);
createRoot(document.getElementById('root')!).render(<StrictMode>{query.has('pointer-boundary') ? <PointerBoundarySliderConsumer mode={query.get('pointer-boundary')!} /> : query.has('activity') ? <ActivitySliderConsumer /> : <Consumer />}</StrictMode>);
