import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ImagePreview } from '../../../src';
import type { ImagePreviewHandle } from '../../../src';
import landscape from '../../../src/assets/artwork/landscape.svg';
import '../../../src/styles/index.css';
function Consumer() {
  const first = useRef<ImagePreviewHandle>(null), second = useRef<ImagePreviewHandle>(null);
  const [mounted, setMounted] = useState(true), [active, setActive] = useState(true), [theme, setTheme] = useState('light'), [contain, setContain] = useState(false), [changes, setChanges] = useState<boolean[]>([]);
  return <main data-cui-theme={theme}>
    <button onClick={() => setMounted(value => !value)}>Mount</button><button onClick={() => setActive(value => !value)}>Active</button><button onClick={() => setTheme(value => value === 'light' ? 'dark' : 'light')}>Theme</button><button onClick={() => setContain(value => !value)}>Contain</button>
    <button onClick={() => first.current?.open()}>Open first</button><button onClick={() => first.current?.close()}>Close first</button>
    <button onClick={() => second.current?.open()}>Open second</button><button onClick={() => second.current?.close()}>Close second</button>
    <output data-changes>{JSON.stringify(changes)}</output>
    {mounted ? <>
      <section aria-label="First"><ImagePreview ref={first} active={active} src={landscape} alt="Mountains" openLabel="Enlarge first" dialogLabel="First preview" actionsLabel="First actions" closeLabel="Dismiss first" onOpenChange={open => setChanges(values => [...values, open])} thumbnailStyle={contain ? { width: 400, height: 300, objectFit: 'contain', objectPosition: '25% 75%' } : undefined} /></section>
      <section aria-label="Second" data-cui-theme="dark" style={{ marginTop: 30 }}><ImagePreview ref={second} src={landscape} alt="Other mountains" openLabel="Enlarge second" dialogLabel="Second preview" actionsLabel="Second actions" closeLabel="Dismiss second" /></section>
    </> : null}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Consumer /></StrictMode>);
