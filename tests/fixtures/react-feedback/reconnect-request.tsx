import { Activity, StrictMode, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { StatusMark } from '../../../src';
import '../../../src/styles/index.css';

type Request = 'replay' | 'resume' | null;
const events: Record<string, unknown>[] = [];
const lifecycle = { events, hide: () => {}, prepare: (_request: Request) => {}, show: (_request: Request, _settle: boolean) => {}, finish: () => {} };
Object.assign(window, { statusReconnect: lifecycle });

function Consumer() {
  const [visible, setVisible] = useState(true), [running, setRunning] = useState(true), [replay, setReplay] = useState(0);
  const [reveal, setReveal] = useState({ id: 0, settle: false });
  const apply = (request: Request) => {
    if (request === 'replay') { setReplay(value => value + 1); setRunning(true); }
    if (request === 'resume') setRunning(true);
  };
  lifecycle.hide = () => flushSync(() => setVisible(false));
  lifecycle.prepare = request => flushSync(() => apply(request));
  lifecycle.show = (request, settle) => {
    // A timer owns this ordinary update. A flushSync reveal would flush passive
    // playback updates before animation Promise continuations can expose a gap.
    setTimeout(() => { apply(request); setVisible(true); setReveal(value => ({ id: value.id + 1, settle })); }, 0);
  };
  lifecycle.finish = () => flushSync(() => setRunning(false));
  useLayoutEffect(() => {
    if (!visible || !reveal.id) return;
    const node = document.querySelector<HTMLElement>('[data-status-reconnect]')!;
    const animation = node.firstElementChild!.getAnimations().find(value => value.playState === 'paused');
    events.push({ type: 'reveal-layout', phase: node.dataset.phase, connected: node.isConnected, visible: !!node.getClientRects().length });
    // A host may complete resumed motion in its own layout effect. New request
    // selection must already own any callbacks released by this completion.
    if (reveal.settle) animation?.finish();
  }, [visible, reveal]);
  return <main data-cui-theme="light" style={{ padding: 40 }}>
    <input aria-label="Outside reconnect focus" />
    <Activity mode={visible ? 'visible' : 'hidden'}>
      <StatusMark data-status-reconnect activity="think" running={running} replayKey={replay}
        onActivityEnter={() => events.push({ type: 'enter', replay, running })}
        onComplete={() => events.push({ type: 'complete', replay, running })} />
    </Activity>
  </main>;
}
const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'on' ? <StrictMode>{consumer}</StrictMode> : consumer);
