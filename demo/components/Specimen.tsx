import type { ReactNode } from 'react';

export function Specimen({ title, description, parameters, children, wide = false }: {
  title: string; description?: string; parameters: string; children: ReactNode; wide?: boolean;
}) {
  return (
    <article className={`min-w-0 rounded-xl border border-solid border-cui-line bg-cui-surface ${wide ? 'sm:col-span-2' : ''}`}>
      <div className="flex min-h-40 items-center justify-center px-5 py-8 sm:px-8">{children}</div>
      <div className="px-5 pb-6 text-center">
        <h3 className="text-sm font-(--cui-medium)">{title}</h3>
        {description ? <p className="mt-1.5 text-xs text-cui-secondary">{description}</p> : null}
        <p className="mt-3 text-[11px] text-cui-muted">{parameters}</p>
      </div>
    </article>
  );
}
