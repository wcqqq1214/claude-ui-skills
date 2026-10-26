import { Activity, StrictMode, useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { StatusMark } from '../../../src';
import '../../../src/styles/index.css';

type Interruption = 'hide' | 'unmount';
type Commit = { action: Interruption; node: HTMLElement; animation: Animation };
const events: Record<string, unknown>[] = [];
const lifecycle = { events, interrupt: (_action: Interruption) => {} };
Object.assign(window, { statusCommit: lifecycle });

function Mark({ running }: { running: boolean }) {
  useLayoutEffect(() => {
    events.push({ type: 'layout-connect' });
    return () => { events.push({ type: 'layout-disconnect' }); };
  }, []);
  useEffect(() => () => { events.push({ type: 'passive-disconnect' }); }, []);
  const notify = (type: 'enter' | 'complete') => {
    const node = document.querySelector<HTMLElement>('[data-status-commit]');
    events.push({ type, connected: !!node?.isConnected, visible: !!node?.getClientRects().length });
  };
  return <StatusMark data-status-commit activity="think" running={running} onActivityEnter={() => notify('enter')} onComplete={() => notify('complete')} />;
}
function SettleDuringCommit({ commit }: { commit: Commit | null }) {
  useLayoutEffect(() => {
    if (!commit) return;
    const { node, animation, action } = commit;
    // This sibling observes the real DOM mutation before passive cleanup. A
    // timer owns the update below; flushSync would conceal this delivery gap.
    events.push({ type: 'commit-settle', action, connected: node.isConnected, visible: !!node.getClientRects().length, phase: node.dataset.phase });
    animation.finish();
  }, [commit]);
  return null;
}
function Consumer() {
  const [visible, setVisible] = useState(true), [mounted, setMounted] = useState(true), [running, setRunning] = useState(true);
  const [commit, setCommit] = useState<Commit | null>(null);
  lifecycle.interrupt = action => {
    setTimeout(() => {
      const node = document.querySelector<HTMLElement>('[data-status-commit]')!;
      const animation = node.firstElementChild!.getAnimations()[0];
      events.push({ type: 'interrupt', action });
      if (action === 'hide') setVisible(false); else setMounted(false);
      setCommit({ action, node, animation });
    }, 0);
  };
  return <main data-cui-theme="light" style={{ padding: 40 }}>
    <button onClick={() => flushSync(() => setVisible(true))}>Show commit status</button>
    <button onClick={() => flushSync(() => setVisible(false))}>Hide commit status</button>
    <button onClick={() => setRunning(false)}>Finish commit status</button>
    <button onClick={() => { setRunning(true); setMounted(true); }}>Mount commit status</button>
    <input aria-label="Outside status focus" />
    {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}><Mark running={running} /></Activity> : null}
    <SettleDuringCommit commit={commit} />
  </main>;
}
const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'on' ? <StrictMode>{consumer}</StrictMode> : consumer);
