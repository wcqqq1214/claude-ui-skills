import { useRef } from 'react';
import { NotificationStack } from '../../src';
import type { NotificationInput, NotificationStackHandle } from '../../src';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import { demoButton, NoticeCopy, NoticeLocale } from './MicroChapter';

export function NotificationsChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string) => translate(locale, text);
  const stack = useRef<NotificationStackHandle>(null), detail = useRef<NotificationStackHandle>(null), trigger = useRef<HTMLButtonElement>(null);
  function action(): NotificationInput {
    return { message: <NoticeCopy source="Design notes are ready" />, action: { label: <NoticeCopy source="View" />, onClick: () => detail.current?.notify({ message: <NoticeCopy source="Local notes: reading rhythm, spatial continuity and state feedback." /> }) } };
  }
  return <NoticeLocale value={locale}><article className="mx-auto flex max-w-[640px] flex-col gap-3.5 rounded-xl border border-solid border-cui-line bg-cui-surface p-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-[15px] font-(--cui-medium)">{t('Notification stack')}</h2><button type="button" className={demoButton} onClick={() => stack.current?.clear()}>{t('Clear notices')}</button></header>
    <div className="flex flex-wrap gap-[7px]">
      <button ref={trigger} type="button" className={demoButton} onClick={() => { for (let i = 0; i < 3; i++) stack.current?.notify({ message: <NoticeCopy source="Design notes saved" /> }); }}>{t('Stack three')}</button>
      <button type="button" className={demoButton} onClick={() => stack.current?.notify({ key: 'repeat', message: 'Design notes saved' })}>{t('Repeat notice')}</button>
      <button type="button" className={demoButton} onClick={() => stack.current?.notify(action())}>{t('Notice with action')}</button>
    </div>
    <div className="relative flex min-h-[210px] items-center justify-center pt-[34px] pb-2.5">
      <NotificationStack ref={stack} active={active} defaultNotices={[action()]} fallbackFocus={trigger} label={t('Notification stack')} dismissLabel={t('Dismiss this notice')} empty={<p className="text-center text-xs text-cui-muted">{t('No notices. Add a stack to replay.')}</p>}
        renderMessage={(message, count) => typeof message === 'string' ? count > 1 ? translate(locale, 'Design notes saved (×{0})', count) : t(message) : message} />
    </div>
    <footer><p className="text-xs leading-[1.6] text-cui-secondary">{t('New notices move to the front; repeated messages merge.')}</p><p className="mt-1.5 text-[11px] text-cui-muted">{t('200ms · −14px / −4% per layer · standard notices dismiss after 6s')}</p></footer>
    <div className="pointer-events-none fixed bottom-[26px] left-1/2 z-80 w-[360px] max-w-[calc(100vw-32px)] -translate-x-1/2 md:left-[calc(50%+113px)]">
      <NotificationStack ref={detail} mode="single" active={active} fallbackFocus={trigger} dismissLabel={t('Close notice')} className="pointer-events-auto" />
    </div>
  </article></NoticeLocale>;
}
