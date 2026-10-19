import { useEffect, useRef, useState } from 'react';
import { DropTarget, ProgressList, TaskCards } from '../../src';
import type { DropFeedbackState, ProgressState } from '../../src';
import { useVisible } from '../../src/hooks/useVisible';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import '../styles/media-parity.css';
const samples = [
  ['Read the design notes', 'Reading the design notes'], ['Group related ideas', 'Grouping related ideas'],
  ['Outline the document', 'Outlining the document'], ['Write the first draft', 'Writing the first draft'],
  ['Check the wording', 'Checking the wording'], ['Prepare the summary', 'Preparing the summary'],
];
const initial: ProgressState[] = ['completed', 'completed', 'completed', 'in_progress', 'pending', 'pending'];
const frames: ProgressState[][] = [
  ['in_progress', 'pending', 'pending'], ['completed', 'in_progress', 'pending'],
  ['completed', 'completed', 'in_progress', 'pending', 'pending', 'pending'],
  initial, ['completed', 'completed', 'completed', 'completed', 'in_progress', 'pending'],
  ['completed', 'completed', 'completed', 'completed', 'completed', 'in_progress'], Array(6).fill('completed'),
];
export function TasksChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string, ...values: (string | number)[]) => translate(locale, text, ...values);
  const progress = useRef<HTMLDivElement>(null), timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const visible = useVisible(progress, active);
  const [states, setStates] = useState(initial), [replay, setReplay] = useState(0);
  const [drop, setDrop] = useState<DropFeedbackState>('idle'), [added, setAdded] = useState(false), dragging = useRef(false);
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const finishDrop = () => { dragging.current = false; setDrop('idle'); };
  useEffect(() => { if (!visible) stop(); }, [visible]);
  useEffect(() => { if (!active) finishDrop(); }, [active]);
  useEffect(() => () => stop(), []);
  useEffect(() => { const leave = () => { stop(); finishDrop(); }; window.addEventListener('pagehide', leave); return () => window.removeEventListener('pagehide', leave); }, []);
  const add = () => { if (!active) return; setAdded(true); finishDrop(); };
  return <div className="demo-tasks-grid grid min-w-0 gap-[18px]">
    <article className="demo-card demo-progress-card" aria-label={t('Progress')}>
      <div className="flex flex-wrap items-center gap-3"><h3 className="m-0 text-sm font-(--cui-medium)">{t('Progress')}</h3><span className="text-xs text-cui-muted" data-progress-count>{t('{0} of {1}', states.filter(state => state === 'completed').length, states.length)}</span>
        <button type="button" className="demo-button small subtle ml-auto" onClick={() => {
          stop(); setStates(['pending', 'pending', 'pending']); setReplay(value => value + 1);
          if (visible) timers.current = frames.map((frame, index) => setTimeout(() => setStates(frame), 1800 + index * 1600));
        }}>{t('Replay')}</button></div>
      <p className="demo-task-description">{t('Replay to watch the steps unfold. Expand earlier steps to read them again.')}</p>
      <div ref={progress}><ProgressList key={replay} active={active} items={states.map((state, index) => ({ id: String(index), state, label: t(samples[index][0]), activeLabel: t(samples[index][1]) }))} labels={{ list: t('Progress'), earlier: count => t(count === 1 ? '{0} earlier step' : '{0} earlier steps', count), hideEarlier: t('Hide earlier steps'), state: { completed: t('Done'), in_progress: t('In progress'), pending: t('Not started') } }} /></div>
    </article>
    <article className="demo-card">
      <TaskCards label={t('Task cards')} items={[
        { id: 'notes', title: t('Organize design notes'), status: 'done', statusLabel: t('Done'), detail: t('Done: reading rhythm and visual hierarchy organized.') },
        { id: 'motion', title: t('Check motion parameters'), status: 'stopped', statusLabel: t('Stopped'), detail: t('Stopped: this is a local state example.') },
        { id: 'details', title: t('Inspect interface details'), status: 'failed', statusLabel: t('Failed'), detail: t('Incomplete: this is a local state example.') },
      ]} />
      <div className="mt-[18px] border-0 border-t border-solid border-cui-line pt-[15px]">
        <div draggable tabIndex={0} role="button" aria-label={t('Design notes, press Enter to simulate a drop')} className="inline-flex cursor-grab flex-wrap items-center gap-2 rounded-[7px] border border-solid border-cui-line bg-cui-bg px-3 py-2.5 text-xs leading-[1.6] focus-visible:outline-2 focus-visible:outline-cui-accent" onDragStart={event => {
          if (!active) { event.preventDefault(); return; } dragging.current = true; setDrop('off'); event.dataTransfer.setData('text/plain', 'local-design-note'); event.dataTransfer.effectAllowed = 'copy';
        }} onDragEnd={finishDrop} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); add(); } }}>{t('▤ design-notes.md')}</div>
        <DropTarget state={drop} active={active} onDragOver={event => { if (!dragging.current || !active) return; event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setDrop('on'); }} onDragLeave={event => { if (dragging.current && !(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) setDrop('off'); }} onDrop={event => { if (!dragging.current || !active) return; event.preventDefault(); add(); }}>
          <span role="status">{t(added ? 'Added: design-notes.md (local page text only)' : 'Drop here to see the target boundary')}</span>
        </DropTarget>
        <button type="button" className="demo-task-reset" onClick={() => { finishDrop(); setAdded(false); }}>{t('Reset drop demo')}</button>
      </div>
      <div className="demo-card-foot"><span><b>150 ms</b> {t('card transition')}</span><span><b>150 / 200 ms</b> {t('drop in / out')}</span></div>
    </article>
  </div>;
}
