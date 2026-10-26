import { Activity, StrictMode, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Tooltip } from '../../../src';
import type { TooltipTriggerProps } from '../../../src';
import '../../../src/styles/index.css';

const params = new URLSearchParams(location.search);
const focusMode = params.get('focus') ?? 'manual';
const earlyReconnect = params.has('early-reconnect');
const lifecycle = { events: [] as string[], initialTarget: null as HTMLButtonElement | null };
Object.assign(window, { tooltipRequestLifecycle: lifecycle });

function ConnectionProbe() {
  useLayoutEffect(() => {
    lifecycle.events.push('connect');
    return () => { lifecycle.events.push('disconnect'); };
  }, []);
  return null;
}

function Trigger({ binding, long }: { binding: TooltipTriggerProps; long: boolean }) {
  const attach = useCallback((element: HTMLButtonElement | null) => {
    binding.ref.current = element;
    if (element && focusMode === 'ref') element.focus();
  }, [binding.ref]);
  useLayoutEffect(() => { if (focusMode === 'child') binding.ref.current?.focus(); }, [binding.ref]);
  return <button {...binding} ref={attach} id="request-target" aria-label="Tooltip request target" autoFocus={focusMode === 'auto'} onFocus={event => {
    if (earlyReconnect) { lifecycle.initialTarget ??= event.currentTarget; lifecycle.events.push('focus'); }
    binding.onFocus?.(event);
  }} style={{ width: '100%', padding: 0, border: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{long ? 'A label that is much too long for its narrow trigger' : 'Short'}</button>;
}

function Consumer() {
  const [ticking, setTicking] = useState(false), [revision, setRevision] = useState(0);
  const [active, setActive] = useState(true), [mounted, setMounted] = useState(true), [visible, setVisible] = useState(true);
  const [overflowOnly, setOverflowOnly] = useState(params.has('overflow'));
  const [wide, setWide] = useState(false), [long, setLong] = useState(true), [changes, setChanges] = useState(0);
  const [explanation, setExplanation] = useState('Explanation');
  const [earlyStep, setEarlyStep] = useState(0);
  useLayoutEffect(() => { if (focusMode === 'parent') document.getElementById('request-target')?.focus(); }, []);
  useLayoutEffect(() => {
    if (!earlyReconnect) return;
    lifecycle.events.push(`parent:${earlyStep}`);
    // These parent layout updates produce separate hidden and visible commits
    // in the initial task, before Tooltip's passive microtasks can settle.
    if (earlyStep < 2) setEarlyStep(earlyStep + 1);
  }, [earlyStep]);
  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => setRevision(value => value + 1), 50);
    return () => clearInterval(timer);
  }, [ticking]);
  const tooltip = <Tooltip active={active} overflowOnly={overflowOnly} content={params.has('string') ? explanation : <span>{explanation}</span>} style={{ width: wide ? 500 : 90 }} onOverflowChange={() => setChanges(value => value + 1)}>
    {binding => <Trigger binding={binding} long={long} />}
  </Tooltip>;
  return <main data-cui-theme="light" style={{ padding: 80 }}>
    <button onClick={() => setTicking(value => !value)}>Toggle unrelated updates</button>
    <button onClick={() => setActive(value => !value)}>Toggle tooltip active</button>
    <button onClick={() => setMounted(value => !value)}>Toggle tooltip mount</button>
    <button onClick={() => flushSync(() => setVisible(value => !value))}>Toggle tooltip Activity</button>
    <button onClick={() => setWide(value => !value)}>Resize tooltip trigger</button>
    <button onClick={() => setLong(value => !value)}>Change tooltip label</button>
    <button onClick={() => setOverflowOnly(value => !value)}>Toggle overflow mode</button>
    <button onClick={() => setExplanation(value => value === 'Explanation' ? 'Updated explanation' : 'Explanation')}>Change tooltip explanation</button>
    <button id="outside">Outside focus</button>
    <output data-revision>{revision}</output><output data-overflow-changes>{changes}</output>
    {mounted ? <Activity mode={visible && (!earlyReconnect || earlyStep !== 1) ? 'visible' : 'hidden'}>
      {earlyReconnect && params.has('direct') ? <><ConnectionProbe />{tooltip}</> : <section data-tooltip-host style={{ marginTop: 60 }}>
        {earlyReconnect ? <ConnectionProbe /> : null}
        {tooltip}
      </section>}
    </Activity> : null}
  </main>;
}

const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(params.get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
