import { StrictMode, useId, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AttachmentList, ComposerSurface, ComposerToolbar, MentionEditor } from '../../../src';
import type { ComposerDraft, MentionEditorHandle } from '../../../src';
import '../../../src/styles/index.css';
import '../../../src/styles/fonts.css';

const samples = [{ id: 'a', name: 'design-notes.md' }, { id: 'b', name: 'component-motion.css' }, { id: 'c', name: '界面设计说明.txt' }];
function Instance({ label, onRemoved }: { label: string; onRemoved: () => void }) {
  const editor = useRef<MentionEditorHandle>(null), widthId = useId();
  const [items, setItems] = useState(samples.slice(0, 2)), [width, setWidth] = useState(680), [lang, setLang] = useState(false), [active, setActive] = useState(true), [replay, setReplay] = useState(0);
  const [draft, setDraft] = useState<ComposerDraft>({ text: '', mentions: [] }), [changes, setChanges] = useState(0);
  return <section aria-label={label}>
    <button onClick={() => setLang(!lang)}>Language</button><button onClick={() => setActive(!active)}>Visibility</button><button onClick={() => editor.current?.clear()}>Clear draft</button><button onClick={() => setReplay(value => value + 1)}>Reset</button><button onClick={() => setDraft(editor.current!.getDraft())}>Read draft</button>
    <output data-draft="">{JSON.stringify(draft)}</output><output data-changes="">{changes}</output>
    <label htmlFor={widthId}>Width</label><input id={widthId} type="range" min={156} max={680} value={width} onChange={event => setWidth(Number(event.target.value))} />
    <div hidden={!active} style={{ width, maxWidth: '100%' }}>
      <ComposerSurface>
        <AttachmentList label="Attachments" items={items} removeLabel={item => `Remove ${item.name}`} onRemove={id => { onRemoved(); setItems(current => current.filter(item => item.id !== id)); }} onEmptyFocus={() => editor.current?.focus()} />
        <MentionEditor ref={editor} label={lang ? '输入' : 'Draft'} placeholder="Type here" mentionListLabel="References" mentionHeading="Artifacts" deleteLabel="Delete reference" active={active} maxHeight={130} resetKey={replay} defaultText="" options={[{ id: 'landscape', title: lang ? '风景插画' : 'Landscape illustration', description: 'Design' }, { id: 'layout', title: 'Layout notes', description: 'Notes' }]} onDraftChange={value => { setDraft(value); setChanges(count => count + 1); }} />
        <button onClick={() => { const item = samples.find(item => !items.some(existing => existing.id === item.id)); if (item) setItems(current => [...current, item]); }} disabled={items.length === 3}>Add attachment</button>
      </ComposerSurface>
      <ComposerToolbar projectLabel={lang ? '项目' : 'Project'} modelLabel="Sonnet 4.6" className="mx-1.5" />
    </div>
  </section>;
}
function Consumer() {
  const [mounted, setMounted] = useState(true), [theme, setTheme] = useState('light'), [removed, setRemoved] = useState(0);
  const onRemoved = () => setRemoved(value => value + 1);
  return <main data-cui-theme={theme} style={{ color: 'var(--cui-text)', background: 'var(--cui-bg)', padding: 24 }}>
    <button onClick={() => setMounted(!mounted)}>Mount</button><button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Theme</button>
    <output id="removed">{removed}</output>{mounted ? <><Instance label="First composer" onRemoved={onRemoved} /><Instance label="Second composer" onRemoved={onRemoved} /></> : null}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Consumer /></StrictMode>);
