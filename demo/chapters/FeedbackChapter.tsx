import { useEffect, useRef, useState } from 'react';
import { Accordion, Icon, SegmentedControl, ShimmerText, SkeletonGroup, SkeletonLine, StatusMark, useVisible } from '../../src';
import type { Activity } from '../../src';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import { EffectCard } from '../components/EffectCard';

const activities = [
  { value: 'think', label: 'Thinking', status: 'Organizing content', frames: 110 },
  { value: 'read', label: 'Reading', status: 'Reading content', frames: 60 },
  { value: 'write', label: 'Writing', status: 'Writing content', frames: 60 },
  { value: 'code', label: 'Coding', status: 'Working with code', frames: 75 },
] as const;
const observations = [
  ['Observe the interface', 'First, establish what the user sees.'],
  ['Check the implementation', 'Connect parameters to specific components.'],
  ['Record the limits', 'Separate observations from static parameters.'],
];

export function FeedbackChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string) => translate(locale, text);
  const [activity, setActivity] = useState<Activity>('think'), [entered, setEntered] = useState<Activity>('think');
  const [phase, setPhase] = useState<'working' | 'finishing' | 'done'>('working');
  const [replay, setReplay] = useState(0), [skeleton, setSkeleton] = useState(false);
  const card = useRef<HTMLElement>(null), visible = useVisible(card, active);
  const status = activities.find(item => item.value === entered)!;
  useEffect(() => {
    if (!visible || phase === 'done' || skeleton) return;
    const timer = setTimeout(() => setSkeleton(true), 500);
    return () => clearTimeout(timer);
  }, [visible, phase, replay, skeleton]);
  function restart(next = activity) {
    setActivity(next); setEntered(next); setPhase('working'); setSkeleton(false); setReplay(value => value + 1);
  }
  return <div className="grid min-w-0 grid-cols-1 items-start gap-5 min-[1100px]:grid-cols-2">
    <EffectCard ref={card} title={t('Waiting')} parameters={`${Number((status.frames / 30).toFixed(2))} s · ${t('dot cycle')} / 500 ms · ${t('skeleton delay')}`}>
      <div className="flex flex-wrap items-center gap-3 px-6 py-4">
        <SegmentedControl size="compact" aria-label={t('Status animation')} value={activity} options={activities.map(item => ({ value: item.value, label: t(item.label) }))} onValueChange={value => {
          const next = value as Activity;
          if (phase === 'done') restart(next);
          else { setActivity(next); setPhase('working'); }
        }} />
        <button type="button" aria-disabled={phase === 'finishing'} onClick={() => { if (phase === 'done') restart(); else if (phase === 'working') setPhase('finishing'); }} className="ml-auto cursor-pointer rounded-md border border-solid border-cui-line bg-cui-surface px-3 py-1.5 text-xs text-cui-secondary aria-disabled:opacity-50">
          {t(phase === 'done' ? 'Replay' : 'Finish')}
        </button>
      </div>
      <div className="flex items-center gap-3 px-6 pt-2.5 pb-4 text-xs text-cui-secondary">
        <StatusMark activity={activity} active={active} running={phase === 'working'} replayKey={replay} onActivityEnter={setEntered} onComplete={() => { setPhase('done'); setSkeleton(false); }} />
        <ShimmerText shimmering={phase !== 'done'} active={visible}>{t(phase === 'done' ? 'Example content is ready' : status.status)}</ShimmerText>
      </div>
      <div className="min-h-[84px] px-6 pb-[23px]">
        {phase === 'done' ? <div className="flex min-h-14 items-center gap-3"><Icon name="File" size={20} /><div><b className="text-xs">{t('A clear set of design notes')}</b><p className="mt-1 text-[10px] text-cui-muted">{t('Reading rhythm, state changes and spatial continuity')}</p></div></div>
          : skeleton ? <SkeletonGroup active={active} aria-label={t('Loading content')} className="pt-1.5"><SkeletonLine /><SkeletonLine className="w-[65%]" /></SkeletonGroup> : null}
      </div>
    </EffectCard>
    <EffectCard title={t('Disclosure')} parameters={`200 ms · ${t('expand / collapse')}`}>
      <Accordion title={<><span className="flex size-[25px] shrink-0 items-center justify-center rounded-full bg-[#d9775714] text-[#d97757]"><Icon name="Check" /></span><span><b className="text-xs">{t('3 design observations collected')}</b><small className="mt-1 block text-[10px] text-cui-muted">{t('Expand to see the process')}</small></span></>}>
        <ol className="m-0 list-none px-6 pb-6 pl-[27px]">
          {observations.map(([title, detail], index) => <li key={title} className="relative flex items-start gap-3.5 pb-5 last:pb-0">
            {index < observations.length - 1 ? <span aria-hidden="true" className="absolute top-[22px] bottom-0 left-[9px] w-px bg-cui-line" /> : null}
            <span className="h-[23px] w-[19px] shrink-0 font-cui-mono text-[9px] leading-[23px] text-cui-muted">0{index + 1}</span><div><b className="text-[11px]">{t(title)}</b><p className="mt-0.5 text-[10px] text-cui-muted">{t(detail)}</p></div><span aria-hidden="true" className="ml-auto text-[10px] text-cui-muted">✓</span>
          </li>)}
        </ol>
      </Accordion>
    </EffectCard>
  </div>;
}
