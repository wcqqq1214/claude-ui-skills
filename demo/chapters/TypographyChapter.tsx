import { useEffect, useRef, useState } from 'react';
import { FadeIn, GraphemeReveal, Icon, ScrollFollower, UserMessage, WorkingMark, useVisible } from '../../src';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import { bodyChunks, bodyText, headingText, paragraphs } from '../fixtures/reading';
import { EffectCard } from '../components/EffectCard';
import { useSequence } from '../hooks/useSequence';
import '../styles/reading-parity.css';

const bodyDelays = bodyChunks.map((_, index) => 320 + index * 155);
const paragraphDelays = paragraphs.map((_, index) => index < 3 ? 400 + index * 700 : 1800 + (index - 2) * 2000);

export function TypographyChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string) => translate(locale, text);
  const headingRef = useRef<HTMLElement>(null), bodyRef = useRef<HTMLElement>(null), scrollRef = useRef<HTMLDivElement>(null);
  const headingVisible = useVisible(headingRef, active);
  const [replay, setReplay] = useState(0), [playedLocale, setPlayedLocale] = useState(locale);
  useEffect(() => { if (headingVisible) { setReplay(value => value + 1); setPlayedLocale(locale); } }, [headingVisible]);
  const body = useSequence(bodyRef, bodyDelays, active);
  const stream = useSequence(scrollRef, paragraphDelays, active, .25);
  return <div className="demo-type-effects">
    <EffectCard ref={headingRef} title={t('Grapheme reveal')} replayLabel={t('Replay grapheme reveal')} onReplay={() => { setReplay(value => value + 1); setPlayedLocale(locale); }} parameters={<><span><b>90ms</b></span><span><b>6px</b> {t('blur')}</span><span><b>30ms</b> {t('stagger')}</span></>}>
      <div className="demo-type-effect-stage"><h3 className="demo-type-heading"><GraphemeReveal text={t(headingText)} locale={locale} animate={headingVisible && playedLocale === locale} replayKey={replay} /></h3></div>
    </EffectCard>
    <EffectCard ref={bodyRef} title={t('Body fade')} replayLabel={t('Replay body fade')} onReplay={body.replay} parameters={<span><b>100ms</b> {t('body fade')}</span>}>
      <div className="demo-type-effect-stage"><p className="demo-type-body"><span className="sr-only">{t(bodyText)}</span><span key={body.generation} aria-hidden="true">{bodyChunks.slice(0, body.count).map((text, index) => <FadeIn key={index}>{t(text)}</FadeIn>)}</span></p></div>
    </EffectCard>
    <EffectCard title={t('User message')} parameters={<><span><b>10px</b> {t('radius')}</span><span><b>85%</b> {t('maximum width')}</span></>}>
      <div className="demo-type-effect-stage demo-type-user-stage"><UserMessage>Talk is cheap. <em>Show me the code.</em></UserMessage></div>
    </EffectCard>
    <EffectCard title={t('Working dots')} parameters={<><span><b>1.333s</b> {t('loop')}</span><span>{t('Hover or focus for the arrow')}</span></>}>
      <div className="demo-type-effect-stage demo-type-working-stage"><button type="button" aria-label={t('Preview loading feedback')} className="cui-return-button group relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-[.5px] border-solid border-cui-line bg-[color-mix(in_srgb,var(--cui-surface)_80%,transparent)] p-0 text-cui-text backdrop-blur-[8px] hover:bg-cui-surface focus-visible:outline-2 focus-visible:outline-cui-accent">
        <WorkingMark active={active} fallback={<Icon name="ArrowDown" size={20} />} className="transition-opacity duration-200 ease-[ease-out] group-hover:opacity-0 group-focus-visible:opacity-0" /><span className="absolute inset-0 m-auto size-5 opacity-0 transition-opacity duration-200 ease-[ease-out] group-hover:opacity-100 group-focus-visible:opacity-100"><Icon name="ArrowDown" size={20} /></span>
      </button></div>
    </EffectCard>
    <EffectCard title={t('Scroll following')} replayLabel={t('Replay scroll following')} onReplay={stream.replay} parameters={t('Scroll up to pause · Return to follow')} className="demo-type-scroll-example">
      <div ref={scrollRef} className="mt-4"><ScrollFollower label={t('Streaming text example')} returnLabel={t('Return to bottom')} active={active} busy={stream.playing} followContent={stream.count > 0} resetKey={stream.generation}>
        <div className="font-cui-serif text-[13px] leading-[1.85] text-cui-secondary">
          <p className="max-w-[36em]">{t(bodyText)}</p>
          <div key={stream.generation}>{paragraphs.slice(0, stream.count).map((text, index) => <p key={index} className="my-[18px] max-w-[36em]"><FadeIn>{t(text)}</FadeIn></p>)}</div>
          <div className="mt-5 mb-3.5 h-px w-[35px] bg-cui-line" /><blockquote className="m-0">{t('A quieter interface brings content into focus.')}</blockquote>
        </div>
      </ScrollFollower></div>
    </EffectCard>
  </div>;
}
