import { useId, useState } from 'react';
import { Icon, PinnedList, SidebarModes } from '../../src';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import '../styles/workspace-parity.css';
const initial = [{ id: 'notes', title: 'Design notes' }, { id: 'reading', title: 'Reading list' }, { id: 'weekend', title: 'Weekend plans' }, { id: 'ideas', title: 'A few ideas' }];
export function SidebarChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string) => translate(locale, text), help = useId(), widthId = useId();
  const [mode, setMode] = useState('Chat'), [width, setWidth] = useState(300), [two, setTwo] = useState(false), [order, setOrder] = useState(initial.map(item => item.id)), [reset, setReset] = useState(0);
  const options = [
    { id: 'Chat', label: 'Chat', icon: <Icon name="Chats" /> },
    ...(!two ? [{ id: 'Cowork', label: 'Cowork', icon: <Icon name="Tasks" /> }] : []),
    { id: 'Code', label: 'Code', icon: <Icon name="Code" />, selectedIcon: <Icon name="Code" style={{ fontWeight: 700 }} />, running: true, runningLabel: translate(locale, '{0}, working', 'Code') },
  ];
  const panel = 'demo-card demo-modes-card min-w-0';
  return <div className="grid min-w-0 gap-[18px]">
    <article className={panel}>
      <div className="demo-mode-controls"><label htmlFor={widthId}>{t('Container width')}</label><input id={widthId} type="range" min={160} max={360} value={width} onChange={event => setWidth(Number(event.target.value))} /><output>{width} px</output>
        <button type="button" className="demo-button demo-button-small demo-button-subtle" onClick={() => { if (!two && mode === 'Cowork') setMode('Chat'); setTwo(!two); }}>{t(two ? 'Show 3 items' : 'Show 2 items')}</button>
      </div>
      <div className="demo-mode-stage"><SidebarModes aria-label={t('Sidebar modes')} style={{ width, maxWidth: '100%' }} options={options} value={mode} onValueChange={setMode} active={active} /></div>
      <p className="demo-mode-description">{translate(locale, 'Selected {0} · Arrows move focus only', mode)}</p>
      <p className="demo-mode-description">{t('Code is working in this example. Switch to Code to hide its background indicator; switch away to see it again.')}</p>
      <footer className="demo-card-foot"><span><b>120 ms</b> snap</span><span><b>≤254 / ≤180 px</b> {t('3 / 2 item folding')}</span></footer>
    </article>
    <article className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="m-0 text-sm leading-[1.6] font-(--cui-medium)">{t('Pinned conversations')}</h2><button type="button" className="demo-button demo-button-small demo-button-subtle" onClick={() => { setOrder(initial.map(item => item.id)); setReset(value => value + 1); }}>{t('Restore order')}</button></div>
      <p id={help} className="demo-mode-description">{t('Drag to reorder; Esc cancels. Use ↑ ↓ to focus a conversation, then → and Enter for its menu.')}</p>
      <PinnedList key={reset} initialStatus={reset > 0 ? t('Order restored') : ''} className="mt-5" active={active} items={order.map(id => ({ id, title: t(initial.find(item => item.id === id)!.title) }))} onOrderChange={setOrder} label={t('Pinned conversations')} describedBy={help} actionsLabel={item => translate(locale, 'Actions for {0}', item.title)} menuLabel={t('Move conversation')} moveUpLabel={t('Move up')} moveDownLabel={t('Move down')} movedLabel={(item, position, total) => translate(locale, '{0} moved to position {1} of {2}', item.title, position, total)} cancelledLabel={t('Move cancelled')} />
    </article>
  </div>;
}
