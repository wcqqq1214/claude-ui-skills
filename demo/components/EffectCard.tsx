import type { ReactNode, Ref } from 'react';
import { Icon, IconButton } from '../../src';

export function EffectCard({ title, replayLabel, onReplay, parameters, children, className = '', ref }: {
  title: string; replayLabel?: string; onReplay?: () => void; parameters: ReactNode; children: ReactNode; className?: string; ref?: Ref<HTMLElement>;
}) {
  return <article ref={ref} className={`demo-card demo-effect-card ${className}`}>
    <header className="demo-effect-heading"><h2 className="">{title}</h2>{onReplay ? <IconButton aria-label={replayLabel} onClick={onReplay}><Icon name="ArrowClockwise" /></IconButton> : null}</header>
    {children}
    <footer className="demo-card-foot">{parameters}</footer>
  </article>;
}
