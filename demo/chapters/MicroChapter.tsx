import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { CopyButton, GhostButton, Icon, NotificationStack, Tooltip } from '../../src';
import type { NotificationStackHandle } from '../../src';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import '../styles/feedback-parity.css';

export const NoticeLocale = createContext<Locale>('en');
export function NoticeCopy({ source }: { source: string }) { return translate(useContext(NoticeLocale), source); }
export const demoButton = 'demo-button demo-button-small';

export function MicroChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string) => translate(locale, text);
  const [width, setWidth] = useState(160), [truncated, setTruncated] = useState(false);
  const notice = useRef<NotificationStackHandle>(null), trigger = useRef<HTMLButtonElement>(null), ghostHint = useId(), widthId = useId();
  useEffect(() => { if (!active) notice.current?.clear(); }, [active]);
  return <NoticeLocale value={locale}><article className="demo-card demo-micro-card">
    <div className="demo-micro-stage">
      <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3">
        <div className="flex size-12 items-center justify-center"><Tooltip active={active} content={t('View design notes')}>{props => <button {...props} type="button" aria-label={t('View design notes')} className="demo-round-tool inline-flex size-12 cursor-pointer items-center justify-center rounded-[10px] border-[.5px] border-solid border-cui-line p-0 text-cui-secondary focus-visible:outline-2 focus-visible:outline-cui-accent"><Icon name="File" size={24} /></button>}</Tooltip></div>
        <div><h2 className="text-xs leading-[1.5] font-(--cui-medium)">{t('Hover hint')}</h2><p className="mt-1 text-xs leading-[1.6] text-cui-secondary">{t('Hover or focus to see the hint.')}</p></div>
      </div>
      <div className="demo-micro-second grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3">
        <div className="flex size-12 items-center justify-center"><GhostButton aria-label={t('Ghost button')} aria-describedby={ghostHint} /></div>
        <div><h2 className="text-xs leading-[1.5] font-(--cui-medium)">{t('Ghost button')}</h2><p id={ghostHint} className="mt-1 text-xs leading-[1.6] text-cui-secondary">{t('Hover to look around; move away to reset. A motion preview only.')}</p></div>
      </div>
    </div>
    <div className="mx-[22px] mb-[22px] rounded-lg border-[.5px] border-solid border-cui-line p-3.5">
      <label htmlFor={widthId} className="flex justify-between gap-2 text-xs text-cui-muted">{t('Text container width')}<output>{width} px</output></label>
      <input id={widthId} type="range" min={100} max={320} value={width} onChange={event => setWidth(Number(event.target.value))} className="my-3 mx-0 block w-full accent-(--cui-clay)" />
      <Tooltip active={active} overflowOnly onOverflowChange={setTruncated} content={t('interface-interaction-guidelines.md')} className="max-w-full" style={{ width }}>{props => <button {...props} type="button" className="block w-full max-w-full cursor-pointer overflow-hidden border-0 bg-transparent px-0 py-[7px] text-left text-sm text-ellipsis whitespace-nowrap text-cui-text focus-visible:outline-2 focus-visible:outline-cui-accent">{t('interface-interaction-guidelines.md')}</button>}</Tooltip>
      <small className="demo-implementation text-xs text-cui-muted">{t(truncated ? 'Truncated; Hover or focus to read in full' : 'Not truncated; No hint needed')}</small>
    </div>
    <div className="demo-copy-row">
      <code className="font-cui-mono text-xs wrap-anywhere">--cds-dur-snap: 120ms;</code>
      <CopyButton text="--cds-dur-snap: 120ms;" copyLabel={t('Copy')} copiedLabel={t('✓ Copied')} failedLabel={t('Copy failed')} onCopyResult={copied => { if (!copied) notice.current?.notify({ message: <NoticeCopy source="The browser did not allow copying. You can select the text manually." /> }); }} />
    </div>
    <div className="demo-notice-controls"><button ref={trigger} type="button" className={`${demoButton} demo-button-subtle`} onClick={() => notice.current?.notify({ message: <NoticeCopy source="This notice closes after 6 seconds." /> })}>{t('Show notice')}</button></div>
    <footer className="demo-card-foot"><span><b>120 ms</b> {t('hint transition')}</span><span><b>6 s</b> {t('notice without action')}</span></footer>
    <div className="demo-toast-region">
      <NotificationStack ref={notice} mode="single" active={active} fallbackFocus={trigger} dismissLabel={t('Close notice')} className="pointer-events-auto" />
    </div>
  </article></NoticeLocale>;
}
