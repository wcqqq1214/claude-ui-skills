import { Activity, StrictMode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { CodeBlock, CopyButton, GhostButton, NotificationStack, Tooltip } from '../../../src';
import type { NotificationStackHandle } from '../../../src';
import '../../../src/styles/index.css';

function ReactiveTooltip() {
  const [result, setResult] = useState({ truncated: false, changes: 0 });
  const [wide, setWide] = useState(false), [long, setLong] = useState(true), [revision, setRevision] = useState(0);
  return <section aria-label="Reactive tooltip">
    <button onClick={() => setWide(!wide)}>Resize JSX trigger</button><button onClick={() => setLong(!long)}>Change JSX label</button><button onClick={() => setRevision(value => value + 1)}>Refresh JSX content</button>
    <output data-overflow-result="">{String(result.truncated)}</output><output data-overflow-changes="">{result.changes}</output>
    <Tooltip content={<span>JSX explanation {revision}</span>} overflowOnly style={{ width: wide ? 400 : 80, maxWidth: '100%' }} onOverflowChange={truncated => setResult(current => ({ truncated, changes: current.changes + 1 }))}>
      {binding => <button {...binding} aria-label="Reactive target" style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', padding: 0, border: 0 }}>{long ? 'A long label that needs an overflow hint' : 'Short'}</button>}
    </Tooltip>
  </section>;
}

function Consumer() {
  const stack = useRef<NotificationStackHandle>(null), single = useRef<NotificationStackHandle>(null), trigger = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(true), [width, setWidth] = useState(80), [truncated, setTruncated] = useState(false), [theme, setTheme] = useState('light'), [copyResults, setCopyResults] = useState(0);
  const [long, setLong] = useState(false), [active, setActive] = useState(true);
  const serial = useRef(0);
  const add = () => stack.current?.notify({ message: `Message ${++serial.current}`, duration: null });
  return <main data-cui-theme={theme} onKeyDown={event => { if (event.key === 'F6') { event.preventDefault(); add(); } if (event.key === 'F7') { event.preventDefault(); single.current?.notify({ message: 'Reopened', duration: null }); } }} style={{ maxWidth: '100%', width: 480, color: 'var(--cui-text)', background: 'var(--cui-surface)' }}>
    <button onClick={() => setMounted(!mounted)}>Mount</button><button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Theme</button><button onClick={() => setActive(!active)}>Active</button>
    <button onClick={() => setWidth(width === 80 ? 400 : 80)}>Width</button><button onClick={() => setLong(!long)}>Long message</button><output id="truncation">{String(truncated)}</output><output id="copyResults">{copyResults}</output>
    {mounted ? <>
      <div style={{ paddingTop: 60 }}>
        <ReactiveTooltip />
        <Tooltip content="A useful explanation" active={active}>{props => <button {...props}>Hint</button>}</Tooltip>
        <Tooltip content="A long label that may need a hint" overflowOnly active={active} onOverflowChange={setTruncated} style={{ width, maxWidth: '100%' }}>{props => <button {...props} style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', padding: 0, border: 0 }}>A long label that may need a hint</button>}</Tooltip>
        <GhostButton aria-label="Ghost" />
        <CopyButton text={'  exact\n\tcode\n'} copyLabel="Copy" copiedLabel="Copied" failedLabel="Failed" onCopyResult={() => setCopyResults(value => value + 1)} />
      </div>
      <div style={{ marginTop: 70 }}>
        <button ref={trigger} onClick={add}>Add</button><button onClick={() => { for (let i = 0; i < 5; i++) add(); }}>Five</button>
        <button onClick={() => stack.current?.notify({ key: 'same', message: 'Repeated', duration: 900 })}>Repeat</button>
        <button onClick={() => stack.current?.notify({ message: 'Action', action: { label: 'View', onClick: () => single.current?.notify({ message: 'Viewed' }) } })}>Action</button>
        <button onClick={() => stack.current?.notify({ message: 'Timed' })}>Timed</button>
        <button onClick={() => stack.current?.clear()}>Clear</button>
        <button onClick={() => { stack.current?.clear(); add(); }}>Clear and add</button>
        <div style={{ marginTop: 70 }}>
          <NotificationStack ref={stack} active={active} fallbackFocus={trigger} label="Stack" dismissLabel="Dismiss" renderMessage={(message, count) => `${message}${count > 1 ? ` ×${count}` : ''}${long ? ' with a very long detailed description that wraps over several lines to resize every rear card consistently.' : ''}`} empty={<p>Empty</p>} />
        </div>
        <button onClick={() => single.current?.notify({ message: 'Single', duration: null })}>Single</button>
        <div style={{ marginTop: 50 }}><NotificationStack ref={single} mode="single" label="Single region" dismissLabel="Close single" fallbackFocus={trigger} /></div>
      </div>
    </> : null}
  </main>;
}
function DeadlineConsumer({ mode }: { mode: 'single' | 'stack' }) {
  const notices = useRef<NotificationStackHandle>(null);
  useEffect(() => {
    // A native event represents an asynchronous host result. Its imperative
    // notification update can precede React's next render/effect cleanup.
    const refresh = (event: Event) => notices.current?.notify({ key: 'repeat', message: 'Refreshed notice', duration: (event as CustomEvent<number | null>).detail });
    window.addEventListener('refresh-deadline-notice', refresh);
    return () => window.removeEventListener('refresh-deadline-notice', refresh);
  }, []);
  return <main>
    <button onClick={() => notices.current?.notify({ key: 'repeat', message: 'Original notice', duration: 60_000 })}>Seed deadline notice</button>
    <NotificationStack ref={notices} mode={mode} label="Deadline notices" dismissLabel="Dismiss deadline notice" />
  </main>;
}
function ActionRefreshConsumer({ params }: { params: URLSearchParams }) {
  const notices = useRef<NotificationStackHandle>(null), actionCount = useRef(0), currentId = useRef('');
  const [result, setResult] = useState({ count: 0, originalId: '', refreshedId: '' });
  const mode = params.get('notice-action') === 'single' ? 'single' : 'stack';
  const replacement = params.get('replacement') ?? 'same';
  const onAction = () => {
    const refresh = () => {
      actionCount.current++;
      let refreshedId = '';
      if (replacement !== 'none') refreshedId = notices.current!.notify({
        key: replacement === 'same' ? 'repeat' : replacement === 'different' || replacement === 'unrelated' ? `replacement-${actionCount.current}` : undefined,
        message: `Refreshed notice ${actionCount.current}`,
        duration: params.get('duration') === 'timed' ? 1200 : null,
        action: { label: 'Refresh notice', onClick: onAction },
      });
      currentId.current = refreshedId || currentId.current;
      setResult(value => ({ ...value, count: actionCount.current, refreshedId }));
    };
    if (params.get('delivery') === 'flush') flushSync(refresh);
    else refresh();
  };
  return <main>
    <button onClick={() => {
      const id = notices.current!.notify({ key: 'repeat', message: 'Original action notice', duration: null, action: { label: 'Refresh notice', onClick: onAction } });
      currentId.current = id; setResult({ count: 0, originalId: id, refreshedId: '' });
    }}>Seed action notice</button>
    <button onClick={() => notices.current?.dismiss(currentId.current)}>Dismiss refreshed ID</button>
    <button onClick={() => notices.current?.clear()}>Clear action notices</button>
    <output data-action-result>{JSON.stringify(result)}</output>
    <div style={{ marginTop: 50 }}><NotificationStack ref={notices} mode={mode} label="Action notices" dismissLabel="Dismiss action notice" /></div>
  </main>;
}
function CopyActivityConsumer() {
  const [mode, setMode] = useState<'hidden' | 'visible'>('visible'), [mounted, setMounted] = useState(true), [results, setResults] = useState(0);
  return <main data-cui-theme="light">
    <button onClick={() => flushSync(() => setMode('hidden'))}>Hide copy Activity</button>
    <button onClick={() => flushSync(() => setMode('visible'))}>Show copy Activity</button>
    <button onClick={() => setMounted(value => !value)}>Mount copy Activity</button>
    <output data-copy-results>{results}</output>
    {mounted ? <Activity mode={mode}><section data-copy-activity>
      <CopyButton text="Activity button text" copyLabel="Copy Activity button" copiedLabel="Activity button copied" failedLabel="Activity button failed" onCopyResult={() => setResults(value => value + 1)} />
      <CodeBlock aria-label="Activity source" code="Activity code text" copyLabel="Copy Activity source" copiedLabel="Activity source copied" copyFailedLabel="Activity source failed" />
    </section></Activity> : null}
  </main>;
}
type NoticeDelivery = 'exit' | 'ref' | 'layout';
const activityNotices = [{ message: 'Persistent Activity notice', duration: null }];
function NoticeActivityContent({ delivery, notices, attach }: { delivery: NoticeDelivery; notices: RefObject<NotificationStackHandle | null>; attach: (handle: NotificationStackHandle | null) => void }) {
  useLayoutEffect(() => {
    if (delivery === 'layout') notices.current?.notify({ key: 'connection', message: 'Layout connection', duration: null });
  }, [delivery, notices]);
  return <section data-notice-activity style={{ paddingTop: 80 }}>
    <NotificationStack ref={attach} label="Activity notices" dismissLabel="Dismiss Activity notice" defaultNotices={delivery === 'exit' ? activityNotices : undefined} empty={<p>Activity notices empty</p>} />
  </section>;
}
function NoticeActivityConsumer({ delivery }: { delivery: NoticeDelivery }) {
  const [mode, setMode] = useState<'hidden' | 'visible'>('visible'), [mounted, setMounted] = useState(true);
  const notices = useRef<NotificationStackHandle>(null), saved = useRef<NotificationStackHandle>(null);
  const attach = useCallback((handle: NotificationStackHandle | null) => {
    notices.current = handle;
    if (!handle) return;
    saved.current = handle;
    if (delivery === 'ref') handle.notify({ key: 'connection', message: 'Ref connection', duration: null });
  }, [delivery]);
  return <main data-cui-theme="light">
    <button onClick={() => flushSync(() => setMode('hidden'))}>Hide notice Activity</button>
    <button onClick={() => flushSync(() => setMode('visible'))}>Show notice Activity</button>
    <button onClick={() => { flushSync(() => notices.current?.clear()); flushSync(() => setMode('hidden')); }}>Dismiss and hide notice Activity</button>
    <button onClick={() => setMounted(value => !value)}>Mount notice Activity</button>
    <button onClick={() => saved.current?.notify({ message: 'Stale unmounted notice', duration: null })}>Notify saved notice handle</button>
    <button onClick={() => notices.current?.notify({ key: 'timer', message: 'Timed Activity notice', duration: 1200 })}>Add timed Activity notice</button>
    {mounted ? <Activity mode={mode}><NoticeActivityContent delivery={delivery} notices={notices} attach={attach} /></Activity> : null}
  </main>;
}
const deadlineMode = new URLSearchParams(location.search).get('deadline');
const noticeDelivery = new URLSearchParams(location.search).get('notice-activity');
const actionParams = new URLSearchParams(location.search);
const content = actionParams.has('notice-action') ? <ActionRefreshConsumer params={actionParams} /> : noticeDelivery ? <NoticeActivityConsumer delivery={noticeDelivery === 'ref' ? 'ref' : noticeDelivery === 'layout' ? 'layout' : 'exit'} /> : actionParams.has('copy-activity') ? <CopyActivityConsumer /> : deadlineMode ? <DeadlineConsumer mode={deadlineMode === 'single' ? 'single' : 'stack'} /> : <Consumer />;
createRoot(document.getElementById('root')!).render(actionParams.get('strict') === 'off' ? content : <StrictMode>{content}</StrictMode>);
