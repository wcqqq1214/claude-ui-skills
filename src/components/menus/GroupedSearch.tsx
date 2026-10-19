import { useId, useLayoutEffect, useRef, useState } from 'react';
import { classes } from '../../lib/classes';
export type SearchItem = { id: string; label: string; group?: string };
export type GroupedSearchProps = {
  label: string;
  placeholder?: string;
  emptyMessage: string;
  items: readonly SearchItem[];
  locale?: string;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  onSelect: (item: SearchItem) => void;
  autoFocus?: boolean;
  className?: string;
};
export function GroupedSearch({ label, placeholder, emptyMessage, items, locale, query, defaultQuery = '', onQueryChange, onSelect, autoFocus = false, className }: GroupedSearchProps) {
  const [localQuery, setLocalQuery] = useState(defaultQuery), input = useRef<HTMLInputElement>(null), id = useId();
  const text = query ?? localQuery, filter = text.trim().toLocaleLowerCase(locale);
  const results = items.filter(item => item.label.toLocaleLowerCase(locale).includes(filter));
  function change(value: string) { if (query === undefined) setLocalQuery(value); onQueryChange?.(value); }
  useLayoutEffect(() => { if (autoFocus) input.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions); }, [autoFocus]);
  let group: string | undefined;
  return <div className={classes('min-w-0 font-cui text-cui-text', className)}>
    <label htmlFor={id} className="mb-2 block text-[11px] leading-[1.6] text-cui-muted">{label}</label>
    <input ref={input} id={id} type="search" value={text} placeholder={placeholder} onChange={event => change(event.target.value)} className="cui-local-search" />
    <div className="min-h-[130px] pt-2">
      {results.map(item => {
        const heading = text === '' && item.group && item.group !== group ? item.group : undefined;
        group = item.group;
        return <div key={item.id}>{heading ? <h4 className="mx-[5px] mt-2.5 mb-1 text-[9px] font-(--cui-regular) text-cui-muted">{heading}</h4> : null}
          <button type="button" onClick={() => { change(''); onSelect(item); }} className="block w-full cursor-pointer rounded-[5px] border-0 bg-transparent p-2 text-left text-xs leading-[1.6] font-(--cui-medium) text-cui-text hover:bg-cui-bg focus-visible:outline-2 focus-visible:outline-cui-accent">{item.label}</button>
        </div>;
      })}
      {!results.length ? <p role="status" className="mx-2 my-5 text-xs text-cui-muted">{emptyMessage}</p> : null}
    </div>
  </div>;
}
