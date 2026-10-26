import type { ReactNode } from 'react';

export function Specimen({ title, description, parameters, children, wide = false }: {
  title: string; description?: string; parameters: string; children: ReactNode; wide?: boolean;
}) {
  return (
    <article className={`demo-card demo-control-card ${wide ? 'demo-wide' : ''}`}>
      <div className="demo-control-row">{children}</div>
      <div className="demo-control-caption">
        <h3>{title}</h3>
        {description ? <p className="demo-implementation">{description}</p> : null}
        <p className="demo-control-params demo-implementation">{parameters.split(/; |；/).map(part => <span key={part}>{part}</span>)}</p>
      </div>
    </article>
  );
}
