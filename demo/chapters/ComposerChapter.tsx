import { useEffect, useId, useRef, useState } from 'react';
import { AttachmentList, ComposerSurface, ComposerToolbar, Icon, MentionEditor } from '../../src';
import type { Attachment, MentionEditorHandle } from '../../src';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import '../styles/feedback-parity.css';

const samples: readonly Attachment[] = [
  { id: 'notes', name: 'design-notes.md' }, { id: 'motion', name: 'component-motion-reference.css' }, { id: 'cn', name: '界面设计说明.txt' },
];
export function ComposerChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string) => translate(locale, text), hint = useId(), widthId = useId();
  const editor = useRef<MentionEditorHandle>(null), [items, setItems] = useState(samples.slice(0, 2));
  const [width, setWidth] = useState(680), [coarse, setCoarse] = useState(false);
  useEffect(() => { const media = matchMedia('(pointer: coarse), (hover: none)'); const sync = () => setCoarse(media.matches); sync(); media.addEventListener('change', sync); return () => media.removeEventListener('change', sync); }, []);
  return <div>
    <div className="mx-auto max-w-full" style={{ width: Math.max(coarse ? 168 : 156, width) }}>
      <ComposerSurface>
        <AttachmentList items={items} label={t('Mock attachments')} removeLabel={item => translate(locale, 'Remove {0}', item.name)} onRemove={id => setItems(current => current.filter(item => item.id !== id))} onEmptyFocus={() => editor.current?.focus()} />
        <MentionEditor ref={editor} active={active} label={t('Demo input')} placeholder={t('Type a few lines…')} mentionListLabel={t('Mention suggestions')} mentionHeading={t('Artifacts')} deleteLabel={t('Delete')} options={[{ id: 'landscape', title: t('Landscape illustration'), description: t('Design') }]} />
        <div className="mt-2 flex items-center justify-between gap-2">
          <button type="button" aria-label={t('Add mock attachment')} title={t('Add mock attachment')} disabled={items.length === samples.length} onClick={() => { const sample = samples.find(sample => !items.some(item => item.id === sample.id)); if (sample) setItems(current => [...current, sample]); }} className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-cui-text enabled:hover:bg-(--cui-composer-hover) disabled:opacity-40"><Icon name="Add" size={20} /></button>
          <button type="button" disabled aria-label={t('Send (preview only)')} title={t('Send (preview only)')} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-[#c6613f] text-white"><Icon name="ArrowUp" size={20} /></button>
        </div>
      </ComposerSurface>
      <ComposerToolbar projectLabel={t('Project')} modelLabel="Sonnet 4.6" modelAriaLabel={t('Model: Sonnet 4.6')} describedBy={hint} className="mx-1.5" />
    </div>
    <div className="demo-composer-controls"><label htmlFor={widthId}>{t('Width limit')}</label><input id={widthId} type="range" min={coarse ? 168 : 156} max={680} value={Math.max(coarse ? 168 : 156, width)} onChange={event => setWidth(Number(event.target.value))} /><output htmlFor={widthId}>{Math.max(coarse ? 168 : 156, width)} px</output></div>
    <p className="demo-implementation px-3.5 pt-3 text-xs leading-[1.5] text-cui-muted">{t('Type @ to reference the sample artwork. Choose with Enter or Tab, then keep typing. Esc dismisses the list.')}</p>
    <p id={hint} className="px-3.5 pt-3 text-xs leading-[1.5] text-cui-muted">{t('Narrow the input to watch the project label simplify. Project, model and send are previews. Enter inserts a new line.')}</p>
  </div>;
}
