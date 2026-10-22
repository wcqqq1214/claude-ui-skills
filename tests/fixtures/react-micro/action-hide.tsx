import { Activity, StrictMode, useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { NotificationStack } from '../../../src';
import type { NotificationStackHandle } from '../../../src';
import '../../../src/styles/index.css';

const params = new URLSearchParams(location.search), events: Record<string, unknown>[] = [];
Object.assign(window, { actionHide: { events } });
function Consumer() {
  const notices = useRef<NotificationStackHandle>(null), saved = useRef<NotificationStackHandle>(null);
  const seed = useRef<HTMLButtonElement>(null), outside = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(true), [mounted, setMounted] = useState(true);
  const attach = useCallback((handle: NotificationStackHandle | null) => { notices.current = handle; if (handle) saved.current = handle; }, []);
  const action = params.get('action') ?? 'hide', mode = params.get('mode') === 'single' ? 'single' : 'stack';
  const runAction = () => {
    const old = document.querySelector<HTMLElement>('[data-cui-notice]');
    events.push({ type: 'action' });
    if (action === 'refresh' || action === 'replace') flushSync(() => notices.current!.notify({ key: action === 'refresh' ? 'same' : 'different', message: 'Replacement action notice', duration: null }));
    if (action === 'unmount') flushSync(() => setMounted(false));
    else if (action !== 'normal') flushSync(() => setVisible(false));
    if (action !== 'normal') outside.current!.focus();
    events.push({ type: 'after-action', connected: !!old?.isConnected, visible: !!old?.getClientRects().length, outsideFocused: document.activeElement === outside.current });
  };
  return <main data-cui-theme="light" style={{ padding: 40 }}>
    <button ref={seed} onClick={() => notices.current?.notify({ key: 'same', message: 'Original action notice', duration: null, action: { label: 'Run interrupted action', onClick: runAction } })}>Seed interrupted action</button>
    <button onClick={() => flushSync(() => setVisible(true))}>Show action Activity</button>
    <button onClick={() => flushSync(() => setVisible(false))}>Hide action Activity</button>
    <button onClick={() => setMounted(true)}>Mount action stack</button>
    <button onClick={() => saved.current?.notify({ message: 'Stale saved notice', duration: null })}>Notify saved action handle</button>
    <input ref={outside} aria-label="Outside action focus" />
    {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}><section data-action-host style={{ marginTop: 80 }}>
      <NotificationStack ref={attach} mode={mode} label="Interrupted notices" dismissLabel="Dismiss interrupted notice" fallbackFocus={seed} empty={<p>Action stack empty</p>} />
    </section></Activity> : null}
  </main>;
}
const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(params.get('strict') === 'on' ? <StrictMode>{consumer}</StrictMode> : consumer);
