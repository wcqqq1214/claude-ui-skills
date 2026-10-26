import { Activity, StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Accordion, ScrollFollower, ShimmerText, SkeletonGroup, SkeletonLine, StatusMark, WorkingMark } from '../../../src';
import type { Activity as StatusActivity } from '../../../src';
import '../../../src/styles/index.css';

function Consumer() {
  const [activity, setActivity] = useState<StatusActivity>('think'), [entered, setEntered] = useState('');
  const [running, setRunning] = useState(true), [active, setActive] = useState(true), [mounted, setMounted] = useState(true);
  const [replay, setReplay] = useState(0), [completed, setCompleted] = useState(0), [width, setWidth] = useState(300);
  const [open, setOpen] = useState(false), [theme, setTheme] = useState('light');
  return <main data-cui-theme={theme} style={{ width, maxWidth: '100%', background: 'var(--cui-surface)', color: 'var(--cui-text)' }}>
    <button onClick={() => setMounted(!mounted)}>Mount</button><button onClick={() => setActive(!active)}>Pause</button>
    <button onClick={() => setRunning(false)}>Finish</button><button onClick={() => { setReplay(value => value + 1); setRunning(true); }}>Replay</button>
    <button onClick={() => setWidth(width === 300 ? 200 : 300)}>Resize</button><button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Theme</button>
    {(['think', 'read', 'write', 'code'] as const).map(value => <button key={value} onClick={() => { setActivity(value); setRunning(true); }}>{value}</button>)}
    <output id="entered">{entered}</output><output id="completed">{completed}</output>
    {mounted ? <>
      <StatusMark activity={activity} running={running} active={active} replayKey={replay} onActivityEnter={setEntered} onComplete={() => setCompleted(value => value + 1)} />
      <ShimmerText active={active}>{activity}</ShimmerText>
      <SkeletonGroup active={active} aria-label="Loading"><SkeletonLine /><SkeletonLine className="w-[65%]" /></SkeletonGroup>
      <Accordion title="Details" open={open} onOpenChange={setOpen}><p>Content remains mounted</p><button onClick={() => setOpen(false)}>Close from inside</button><input aria-label="Retained input" /></Accordion>
      <Accordion title="Other details"><button>Other child</button></Accordion>
    </> : null}
  </main>;
}
function ActivityConsumer() {
  const [mode, setMode] = useState<'visible' | 'hidden'>('visible'), [mounted, setMounted] = useState(true);
  const [active, setActive] = useState(true), [running, setRunning] = useState(!new URLSearchParams(location.search).has('finished'));
  const [replay, setReplay] = useState(0), [entered, setEntered] = useState(0), [completed, setCompleted] = useState(0);
  return <main>
    <button onClick={() => flushSync(() => setMode('hidden'))}>Hide Status</button>
    <button onClick={() => flushSync(() => setMode('visible'))}>Show Status</button>
    <button onClick={() => { flushSync(() => setMode('hidden')); flushSync(() => setMode('visible')); }}>Reconnect Status</button>
    <button onClick={() => setActive(value => !value)}>Pause Status</button>
    <button onClick={() => setRunning(false)}>Finish Status</button>
    <button onClick={() => { setReplay(value => value + 1); setRunning(true); }}>Replay Status</button>
    <button onClick={() => setMounted(value => !value)}>Mount Status</button>
    <output data-status-entered>{entered}</output><output data-status-completed>{completed}</output>
    {mounted ? <Activity mode={mode}><StatusMark activity="think" active={active} running={running} replayKey={replay}
      onActivityEnter={() => setEntered(value => value + 1)} onComplete={() => setCompleted(value => value + 1)} /></Activity> : null}
  </main>;
}
function DynamicRows() {
  const [rows, setRows] = useState([{ id: 0, width: 80, left: 0 }]), [expanded, setExpanded] = useState(false);
  return <>
    <button onClick={() => setRows(value => [...value, { id: (value.at(-1)?.id ?? -1) + 1, width: 110, left: 0 }])}>Add row</button>
    <button onClick={() => setRows(value => value.slice(0, -1))}>Remove row</button>
    <button onClick={() => setRows(value => value.map((row, index) => index === value.length - 1 ? { ...row, id: row.id + 100 } : row))}>Replace row</button>
    <button onClick={() => setRows(value => value.map((row, index) => index === value.length - 1 ? { ...row, left: 17 } : row))}>Move row</button>
    <button onClick={() => setRows(value => value.map((row, index) => index === value.length - 1 ? { ...row, width: row.width + 30 } : row))}>Resize row</button>
    <button onClick={() => setExpanded(value => !value)}>Reflow text</button>
    <div style={{ width: 130 }}>{expanded ? 'A longer loading description moves the rows without resizing their group.' : 'Rows'}</div>
    <div style={{ position: 'relative' }}>{rows.map((row, index) => <SkeletonLine key={row.id} data-dynamic-row={row.id} style={{ position: 'absolute', top: index * 24, left: row.left, width: row.width }} />)}</div>
  </>;
}
function DynamicSkeletonConsumer() {
  const [mode, setMode] = useState<'visible' | 'hidden'>('visible'), [mounted, setMounted] = useState(true);
  return <main>
    <button onClick={() => flushSync(() => setMode('hidden'))}>Hide skeleton</button>
    <button onClick={() => flushSync(() => setMode('visible'))}>Show skeleton</button>
    <button onClick={() => { flushSync(() => setMode('hidden')); flushSync(() => setMode('visible')); }}>Reconnect skeleton</button>
    <button onClick={() => setMounted(value => !value)}>Mount skeleton</button>
    {mounted ? <Activity mode={mode}><SkeletonGroup data-dynamic-skeleton style={{ width: 300, height: 180 }}><DynamicRows /></SkeletonGroup></Activity> : null}
  </main>;
}
function WorkingConsumer() {
  const [mode, setMode] = useState<'visible' | 'hidden'>('visible'), [mounted, setMounted] = useState(true);
  return <main>
    <button onClick={() => flushSync(() => setMode('hidden'))}>Hide working</button>
    <button onClick={() => flushSync(() => setMode('visible'))}>Show working</button>
    <button onClick={() => setMounted(value => !value)}>Mount working</button>
    {mounted ? <Activity mode={mode}>
      <WorkingMark data-working-mark fallback={<span data-working-fallback>↓</span>} />
      <ScrollFollower label="Working content" returnLabel="Return to latest" busy height={200}><div style={{ height: 700 }}>Content to follow</div></ScrollFollower>
    </Activity> : null}
  </main>;
}
const query = new URLSearchParams(location.search);
createRoot(document.getElementById('root')!).render(<StrictMode>{query.has('activity') ? <ActivityConsumer /> : query.has('dynamic') ? <DynamicSkeletonConsumer /> : query.has('working') ? <WorkingConsumer /> : <Consumer />}</StrictMode>);
