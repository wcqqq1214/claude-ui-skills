import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { classes } from '../../lib/classes';
import { useVisible } from '../../hooks/useVisible';
import { ProgressShimmer } from './ProgressShimmer';
export type ProgressState = 'pending' | 'in_progress' | 'completed';
export interface ProgressItem { id: string; label: string; activeLabel?: string; state: ProgressState }
export interface ProgressLabels { list: string; earlier(count: number): string; hideEarlier: string; state: Record<ProgressState, string> }
export interface ProgressListProps {
  items: readonly ProgressItem[]; labels: ProgressLabels;
  expanded?: boolean; defaultExpanded?: boolean; onExpandedChange?(expanded: boolean): void;
  active?: boolean; className?: string;
}
function CurrentNode({ entering }: { entering: boolean }) {
  const [animate] = useState(entering);
  return <span className={classes('cui-progress-node', animate && 'cui-progress-node-enter')} data-kind="current"><span className="cui-progress-clay" onAnimationStart={event => {
    for (const animation of event.currentTarget.getAnimations()) {
      const timing = animation.effect?.getTiming();
      if (timing?.iterations === Infinity && typeof timing.duration === 'number' && timing.duration > 0) animation.startTime = -(performance.timeOrigin % timing.duration);
    }
  }} /></span>;
}
function ProgressRow({ item, labels, folded, first, last, allDone, walk, entering, nodeEntering }: {
  item: ProgressItem; labels: ProgressLabels; folded: boolean; first: boolean; last: boolean; allDone: boolean;
  walk: 'none' | 'whole' | 'to-node'; entering: boolean; nodeEntering: boolean;
}) {
  const [animate] = useState(entering);
  return <div className="cui-progress-row" data-step={item.id} data-state={item.state} data-folded={folded} data-first={first} data-last={last} data-finished={allDone && last}>
    <span className="cui-progress-track" aria-hidden="true"><span className={classes('cui-progress-rail', animate && 'cui-progress-rail-enter')}><span className="cui-progress-walked" data-walk={walk} /></span>
      {!folded && item.state === 'in_progress' ? <CurrentNode entering={nodeEntering} /> : !folded && allDone && last ? <span className="cui-progress-node" data-kind="finished"><Icon name="CheckCircleFilled" size={16} /></span> : null}
    </span>
    <span className={classes('cui-progress-text', animate && 'cui-progress-step-enter')}><ProgressShimmer shimmering={item.state === 'in_progress'}>{item.state === 'in_progress' ? item.activeLabel ?? item.label : item.label}</ProgressShimmer></span>
    <span className="sr-only">, {labels.state[item.state]}</span>
  </div>;
}
export function ProgressList({ items, labels, expanded, defaultExpanded = false, onExpandedChange, active = true, className }: ProgressListProps) {
  const root = useRef<HTMLDivElement>(null), foldId = useId(), playing = useVisible(root, active);
  const [local, setLocal] = useState(defaultExpanded);
  let leading = 0; while (items[leading]?.state === 'completed') leading++;
  const folded = Math.max(0, leading - 2), open = folded > 0 && (expanded ?? local);
  if (!folded && local) setLocal(false);
  const allDone = items.every(item => item.state === 'completed');
  let lastWalked = -1; if (!allDone) items.forEach((item, index) => { if (item.state !== 'pending') lastWalked = index; });
  const previous = useRef(new Map(items.map(item => [item.id, item.state])));
  const before = previous.current;
  useLayoutEffect(() => { previous.current = new Map(items.map(item => [item.id, item.state])); });
  function row(item: ProgressItem, index: number, inFold: boolean) {
    return <ProgressRow key={item.id} item={item} labels={labels} folded={inFold} first={index === 0} last={index === items.length - 1} allDone={allDone}
      walk={index > lastWalked ? 'none' : index === lastWalked && item.state === 'in_progress' ? 'to-node' : 'whole'}
      entering={!inFold && !before.has(item.id)} nodeEntering={!inFold && before.get(item.id) !== 'in_progress'} />;
  }
  return <div ref={root} role="group" aria-label={labels.list} className={classes('cui-progress-list font-cui', className)} data-playing={playing} data-all-done={allDone}>
    <button type="button" className="cui-progress-fold-button cursor-pointer border-0 font-cui" hidden={!folded} aria-expanded={open} aria-controls={foldId} onClick={() => { if (expanded === undefined) setLocal(!open); onExpandedChange?.(!open); }}>
      <span className="cui-progress-fold-glyph" aria-hidden="true"><span className="cui-progress-fold-marks">{[0, 1, 2, 3].map(index => <span key={index} hidden={index >= folded} style={{ opacity: folded > 4 && index === 3 ? .1 : [1, .7, .45, .25][index] }} />)}</span><span className="cui-progress-fold-line" /></span>
      <span className="cui-progress-fold-label"><span>{open ? labels.hideEarlier : labels.earlier(folded)}</span><span className="cui-progress-caret"><Icon name="CaretUp" size={12} /></span></span>
    </button>
    <div id={foldId} className="cui-progress-fold" hidden={!folded} inert={!open} data-expanded={open}><div className="cui-progress-fold-content">{items.slice(0, folded).map((item, index) => row(item, index, true))}</div><span className="cui-progress-fold-rail" aria-hidden="true" /></div>
    <div className="contents">{items.slice(folded).map((item, index) => row(item, index + folded, false))}</div>
    <span className="cui-progress-sweep" aria-hidden="true" data-building={items.length > 0 && items.every(item => item.state === 'pending')} />
  </div>;
}
