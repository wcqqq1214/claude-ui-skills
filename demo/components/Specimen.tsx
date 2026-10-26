import type { ReactNode } from 'react';

export function Specimen({ title, description, parameters, children, wide = false }: {
  title: string; description?: string; parameters: string; children: ReactNode; wide?: boolean;
}) {
  return (
    <article className={`demo-card demo-control-card ${wide ? 'demo-wide' : ''}`}>
      <div className="demo-control-row">{children}</div>
      <div className="demo-control-caption">
        <h3 className="">{title}</h3>
        {description ? <p className="">{description}</p> : null}
        <p className="demo-control-params">{parameters}</p>
      </div>
    </article>
  );
}
