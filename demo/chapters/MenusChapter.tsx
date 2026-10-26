import { useRef, useState } from 'react';
import { ArtifactActionsCard, GroupedSearch, SubmenuSelect, useSearchHighlight } from '../../src';
import image from '../../src/assets/artwork/landscape.svg';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import '../styles/menus-parity.css';
const settings = [
  { id: 'appearance', label: 'Appearance', group: 'Interface', description: 'Choose a light or dark interface.' },
  { id: 'language', label: 'Language', group: 'Interface', description: 'Choose the interface language.' },
  { id: 'notifications', label: 'Notifications', group: 'Updates', description: 'Get notified when a response is ready.' },
];
const efforts = ['Low', 'Medium', 'High', 'Max'].map(value => ({ value, label: value }));
const article = 'demo-card min-w-0';
const footer = 'demo-card-foot';
export function MenusChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string) => translate(locale, text), [effort, setEffort] = useState('High'), [pinned, setPinned] = useState(false), [action, setAction] = useState<string>();
  const rows = useRef(new Map<string, HTMLDivElement>()), headings = useRef(new Map<string, HTMLHeadingElement>());
  const { highlight } = useSearchHighlight(active);
  return <div className="demo-menus-container"><div className="demo-menus-grid">
    <article className={`${article} demo-menus-selection`}>
      <h2 className="px-5 pt-5 text-sm leading-[1.6] font-(--cui-medium)">{t('Menu selection')}</h2>
      <div className="demo-menus-stage"><SubmenuSelect active={active} label={t('Model settings')} submenuLabel={t('Thinking effort')} options={efforts.map(option => ({ ...option, label: t(option.label) }))} value={effort} onValueChange={setEffort} renderPreview={(preview, selected) => translate(locale, 'Focus preview: {0}; Selected: {1}', t(preview ?? selected ?? ''), t(selected ?? ''))} />
        <p className="demo-menus-description">{translate(locale, 'Selected: {0}', t(effort))}</p>
      </div><footer className={footer}>{t('Arrows preview; Enter selects; Esc returns')}</footer>
    </article>
    <article className={`${article} demo-menus-artifact`}>
      <h2 className="px-5 pt-5 text-sm leading-[1.6] font-(--cui-medium)">{t('Artifact actions')}</h2>
      <div className="demo-menus-stage"><ArtifactActionsCard active={active} title={t('Landscape illustration')} subtitle={t('Today')} image={image} actionsLabel={t('Artifact actions')} actions={[
        { id: 'open', label: t('Open'), onSelect: () => setAction('Open') },
        { id: 'copy', label: t('Copy link'), onSelect: () => setAction('Copy link') },
        { id: 'pin', label: t(pinned ? 'Unpin' : 'Pin'), onSelect: () => { setAction(pinned ? 'Unpin' : 'Pin'); setPinned(value => !value); } },
      ]} /><p role="status" className="mt-3.5 min-h-4 text-xs leading-[1.6] text-cui-muted">{action ? translate(locale, 'Demo action: {0}', t(action)) : ''}</p></div>
      <footer className={footer}><span><b>200 / 120ms</b></span><span>{t('Open / return')}</span><span>Alt/Option + Enter; Esc</span></footer>
    </article>
    <article className={`${article} demo-menus-search`}>
      <h2 className="px-5 pt-5 text-sm leading-[1.6] font-(--cui-medium)">{t('Search & highlight')}</h2>
      <div className="demo-menus-search-layout px-5 py-4">
        <GroupedSearch label={t('Find a setting')} placeholder={t('Try “appearance” or “notifications”')} emptyMessage={t('No matching settings')} locale={locale} items={settings.map(item => ({ ...item, label: t(item.label), group: t(item.group) }))} onSelect={item => { const row = rows.current.get(item.id), title = headings.current.get(item.id); if (row && title) highlight(row, title); }} />
        <div className="min-w-0">{settings.map(item => <div key={item.id} ref={node => { if (node) rows.current.set(item.id, node); else rows.current.delete(item.id); }} className="border-0 border-t-[.5px] border-solid border-cui-line px-1 py-3 first:border-t-0">
          <h3 ref={node => { if (node) headings.current.set(item.id, node); else headings.current.delete(item.id); }} tabIndex={-1} className="m-0 w-fit max-w-full text-sm font-(--cui-medium)">{t(item.label)}</h3><p className="mt-2 text-xs leading-[1.6] text-cui-secondary">{t(item.description)}</p>
        </div>)}</div>
      </div><footer className={footer}><span><b>1.95s</b> {t('highlight')}</span><span>{t('Select a result to highlight it here')}</span></footer>
    </article>
  </div></div>;
}
