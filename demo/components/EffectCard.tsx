import type { ReactNode, Ref } from 'react';
import { Icon, IconButton } from '../../src';

export function EffectCard({ title, replayLabel, onReplay, parameters, children, className = '', ref }: {
  title: string; replayLabel?: string; onReplay?: () => void; parameters: string; children: ReactNode; className?: string; ref?: Ref<HTMLElement>;
}) {
  return <article ref={ref} className={`min-w-0 overflow-hidden rounded-xl border border-solid border-cui-line bg-cui-surface ${className}`}>
    <header className="flex min-h-[46px] items-center justify-between gap-3 px-5 pt-3"><h2 className="text-sm font-(--cui-medium)">{title}</h2>{onReplay ? <IconButton aria-label={replayLabel} onClick={onReplay}><Icon name="ArrowClockwise" /></IconButton> : null}</header>
    {children}
    <footer className="border-0 border-t border-solid border-cui-line px-5 py-3 text-[11px] text-cui-secondary">{parameters}</footer>
  </article>;
}
