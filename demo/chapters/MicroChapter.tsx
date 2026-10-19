import { createContext, useContext, useId, useRef, useState } from 'react';
import { CopyButton, GhostButton, Icon, NotificationStack, Tooltip } from '../../src';
import type { NotificationStackHandle } from '../../src';
import type { Locale } from '../i18n';
import { translate } from '../translations';

export const NoticeLocale = createContext<Locale>('en');
export function NoticeCopy({ source }: { source: string }) { return translate(useContext(NoticeLocale), source); }
export const demoButton = 'cursor-pointer rounded-md border border-solid border-cui-line bg-cui-surface px-3 py-1.5 text-xs text-cui-secondary focus-visible:outline-2 focus-visible:outline-cui-accent';

export function MicroChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string) => translate(locale, text);
  const [width, setWidth] = useState(160), [truncated, setTruncated] = useState(false);
  const notice = useRef<NotificationStackHandle>(null), trigger = useRef<HTMLButtonElement>(null), ghostHint = useId(), widthId = useId();
  return <NoticeLocale value={locale}><article className="min-w-0 rounded-xl border border-solid border-cui-line bg-cui-surface">
    <div className="grid grid-cols-1 gap-5 px-[22px] py-7 min-[480px]:grid-cols-2">
      <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3">
        <Tooltip active={active} content={t('View design notes')}>{props => <button {...props} type="button" aria-label={t('View design notes')} className="inline-flex size-12 cursor-pointer items-center justify-center rounded-[10px] border border-solid border-cui-line bg-cui-segment-track text-cui-secondary focus-visible:outline-2 focus-visible:outline-cui-accent"><Icon name="File" size={24} /></button>}</Tooltip>
        <div><h2 className="text-xs font-(--cui-medium)">{t('Hover hint')}</h2><p className="mt-1 text-[11px] leading-[1.6] text-cui-secondary">{t('Hover or focus to see the hint.')}</p></div>
      </div>
      <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 border-0 border-t border-solid border-cui-line pt-4 min-[480px]:border-t-0 min-[480px]:border-l min-[480px]:pt-0 min-[480px]:pl-5">
        <div className="flex size-12 items-center justify-center"><GhostButton aria-label={t('Ghost button')} aria-describedby={ghostHint} /></div>
        <div><h2 className="text-xs font-(--cui-medium)">{t('Ghost button')}</h2><p id={ghostHint} className="mt-1 text-[11px] leading-[1.6] text-cui-secondary">{t('Hover to look around; move away to reset. A motion preview only.')}</p></div>
      </div>
    </div>
    <div className="mx-[22px] mb-[22px] rounded-lg border border-solid border-cui-line p-3.5">
      <label htmlFor={widthId} className="flex justify-between gap-2 text-[10px] text-cui-muted">{t('Text container width')}<output>{width} px</output></label>
      <input id={widthId} type="range" min={100} max={320} value={width} onChange={event => setWidth(Number(event.target.value))} className="my-3 block w-full accent-[#d97757]" />
      <Tooltip active={active} overflowOnly onOverflowChange={setTruncated} content="interface-interaction-guidelines.md" className="max-w-full" style={{ width }}>{props => <button {...props} type="button" className="block w-full max-w-full cursor-pointer overflow-hidden border-0 bg-transparent px-0 py-[7px] text-left text-[13px] text-ellipsis whitespace-nowrap text-cui-text focus-visible:outline-2 focus-visible:outline-cui-accent">interface-interaction-guidelines.md</button>}</Tooltip>
      <small className="text-[9px] text-cui-muted">{t(truncated ? 'Truncated · Hover or focus to read in full' : 'Not truncated · No hint needed')}</small>
    </div>
    <div className="mx-5 mb-5 flex flex-wrap items-center justify-between gap-2.5 rounded-[7px] border border-solid border-cui-line bg-cui-bg px-4 py-[13px]">
      <code className="font-cui-mono text-[10px] wrap-anywhere">--cds-dur-snap: 120ms;</code>
      <CopyButton text="--cds-dur-snap: 120ms;" copyLabel={t('Copy')} copiedLabel={t('✓ Copied')} failedLabel={t('Copy failed')} onCopyResult={copied => { if (!copied) notice.current?.notify({ message: <NoticeCopy source="The browser did not allow copying. You can select the text manually." /> }); }} />
    </div>
    <div className="px-[22px] pb-[22px]"><button ref={trigger} type="button" className={demoButton} onClick={() => notice.current?.notify({ message: <NoticeCopy source="This notice closes after 6 seconds." /> })}>{t('Show notice')}</button></div>
    <footer className="border-0 border-t border-solid border-cui-line px-5 py-3 text-[11px] text-cui-secondary">120 ms · {t('hint transition')} / 6 s · {t('notice without action')}</footer>
    <div className="pointer-events-none fixed bottom-[26px] left-1/2 z-80 w-[360px] max-w-[calc(100vw-32px)] -translate-x-1/2 md:left-[calc(50%+113px)]">
      <NotificationStack ref={notice} mode="single" active={active} fallbackFocus={trigger} dismissLabel={t('Close notice')} className="pointer-events-auto" />
    </div>
  </article></NoticeLocale>;
}
