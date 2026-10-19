import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CopyButton, GhostButton, NotificationStack, Tooltip } from '../../../src';
import type { NotificationStackHandle } from '../../../src';
import '../../../src/styles/index.css';

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
createRoot(document.getElementById('root')!).render(<StrictMode><Consumer /></StrictMode>);
