import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DropTarget, ProgressList, TaskCards } from '../../../src';
import type { DropFeedbackState, ProgressLabels, ProgressState } from '../../../src';
import '../../../src/styles/index.css';
const initial: ProgressState[] = ['completed', 'completed', 'completed', 'in_progress', 'pending', 'pending'];
const english: ProgressLabels = { list: 'Progress steps', earlier: count => `${count} earlier`, hideEarlier: 'Hide earlier', state: { completed: 'Done', in_progress: 'In progress', pending: 'Not started' } };
function Consumer() {
  const [mounted, setMounted] = useState(true), [active, setActive] = useState(true), [rtl, setRtl] = useState(false), [zh, setZh] = useState(false), [dark, setDark] = useState(false), [states, setStates] = useState(initial), [drop, setDrop] = useState<DropFeedbackState>('idle'), [changes, setChanges] = useState(0), [controlled, setControlled] = useState(false), [selected, setSelected] = useState<string | null>(null);
  const count = () => setChanges(value => value + 1);
  const labels = zh ? { ...english, hideEarlier: '收起较早的步骤', earlier: (count: number) => `${count} 个较早步骤` } : english;
  return <main data-cui-theme={dark ? 'dark' : 'light'} dir={rtl ? 'rtl' : 'ltr'}>
    <button onClick={() => setMounted(value => !value)}>Mount</button><button onClick={() => setActive(value => !value)}>Active</button><button onClick={() => setRtl(value => !value)}>RTL</button><button onClick={() => setZh(value => !value)}>Language</button><button onClick={() => setDark(value => !value)}>Theme</button>
    <button onClick={() => setStates(initial)}>Initial</button><button onClick={() => setStates(['pending', 'pending', 'pending'])}>Pending</button><button onClick={() => setStates(['in_progress', 'pending', 'pending'])}>Start</button><button onClick={() => setStates(['completed', 'completed', 'in_progress', 'pending', 'pending', 'pending'])}>Append</button><button onClick={() => setStates(Array(8).fill('completed'))}>Done</button><button onClick={() => setStates([])}>Empty</button><button onClick={() => setStates(['completed'])}>Single</button>
    <button onClick={() => setDrop('off')}>Drag</button><button onClick={() => setDrop('on')}>Over</button><button onClick={() => setDrop('idle')}>Finish</button><button onClick={() => setControlled(value => !value)}>Controlled fold</button><output data-changes>{changes}</output>
    {mounted ? <>
      <div style={{ maxWidth: 500, marginTop: 20 }}><ProgressList items={states.map((state, index) => ({ id: String(index), state, label: `${zh ? '步骤' : 'Step'} ${index + 1}`, activeLabel: `${zh ? '正在处理' : 'Working on step'} ${index + 1}` }))} labels={labels} active={active} onExpandedChange={count} /></div>
      <section aria-label="Second" data-cui-theme="dark" style={{ maxWidth: 500, marginTop: 20 }}><ProgressList items={initial.map((state, index) => ({ id: String(index), state, label: `Other ${index + 1}` }))} labels={english} expanded={controlled} onExpandedChange={setControlled} active={active} /></section>
      <section aria-label="Cards" style={{ maxWidth: 500, marginTop: 20 }}><TaskCards label="Tasks" value={selected} onValueChange={value => { setSelected(value); count(); }} items={(['done', 'stopped', 'failed'] as const).map(status => ({ id: status, title: `${status} task with a long title that should truncate`, status, statusLabel: status, detail: `${status} details` }))} /></section>
      <DropTarget state={drop} active={active} aria-label="Drop area" style={{ maxWidth: 500 }}>Drop feedback</DropTarget>
    </> : null}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Consumer /></StrictMode>);
