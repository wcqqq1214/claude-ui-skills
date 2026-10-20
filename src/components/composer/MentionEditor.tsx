import { useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, Ref } from 'react';
import { Icon } from '../icons/Icon';
import { classes } from '../../lib/classes';
import { createMentionEditing } from './mentionEditing';
import type { ComposerDraft, MentionContext, MentionOption, MentionPopup } from './mentionEditing';

export type MentionEditorHandle = { focus: () => void; clear: () => void; getDraft: () => ComposerDraft };
export type MentionEditorProps = {
  ref?: Ref<MentionEditorHandle>;
  label: string;
  placeholder: string;
  mentionListLabel: string;
  mentionHeading?: string;
  deleteLabel: string;
  options?: readonly MentionOption[];
  defaultText?: string;
  /** Explicitly replace the editing transaction/draft with defaultText. */
  resetKey?: string | number;
  active?: boolean;
  maxHeight?: CSSProperties['maxHeight'];
  onDraftChange?: (draft: ComposerDraft) => void;
  className?: string;
};
const noOptions: readonly MentionOption[] = [];

export function MentionEditor({ ref, label, placeholder, mentionListLabel, mentionHeading, deleteLabel, options = noOptions, defaultText = '', resetKey, active = true, maxHeight = 'min(40svh, 384px)', onDraftChange, className }: MentionEditorProps) {
  const id = useId(), editor = useRef<HTMLDivElement>(null), template = useRef<HTMLSpanElement>(null), popup = useRef<HTMLDivElement>(null), menu = useRef<HTMLDivElement>(null);
  const editing = useRef<ReturnType<typeof createMentionEditing> | null>(null);
  const latest = useRef({ options, onDraftChange });
  const [suggestions, setSuggestions] = useState<MentionPopup>(null), [context, setContext] = useState<MentionContext>(null), [empty, setEmpty] = useState(!defaultText);
  const resize = () => { const element = editor.current; if (element?.clientWidth) { element.style.height = 'auto'; element.style.height = `${element.scrollHeight}px`; } };
  useLayoutEffect(() => { latest.current = { options, onDraftChange }; });
  useLayoutEffect(() => {
    const instance = createMentionEditing(editor.current!, template.current!, {
      options: () => latest.current.options, popup: () => popup.current, menu: () => menu.current,
      setPopup: setSuggestions, setContext, setEmpty,
      onChange: value => { resize(); latest.current.onDraftChange?.(value); },
    });
    editing.current = instance;
    let lastWidth = 0;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width !== lastWidth) { lastWidth = entry.contentRect.width; resize(); } });
    observer.observe(editor.current!);
    return () => { instance.dispose(); editing.current = null; observer.disconnect(); };
  }, []);
  useLayoutEffect(() => { editing.current?.reset(defaultText); resize(); }, [resetKey]);
  useLayoutEffect(() => { editing.current?.setActive(active); resize(); }, [active, maxHeight]);
  // Localizing the surrounding chrome never rewrites existing draft/atom text.
  useLayoutEffect(() => { editing.current?.update(); }, [options]);
  useLayoutEffect(() => { editing.current?.refresh(); }, [label, mentionListLabel, deleteLabel]);
  useLayoutEffect(() => { editing.current?.positionPopup(); }, [suggestions]);
  useLayoutEffect(() => {
    const element = menu.current;
    if (!context || !element) return;
    element.style.left = Math.max(16, Math.min(context.x, innerWidth - element.offsetWidth - 16)) + 'px';
    element.style.top = Math.max(16, Math.min(context.y, innerHeight - element.offsetHeight - 16)) + 'px';
    element.focus({ preventScroll: true });
  }, [context]);
  useImperativeHandle(ref, () => ({ focus: () => editor.current?.focus({ preventScroll: true }), clear: () => { editing.current?.reset('', true); resize(); }, getDraft: () => editing.current?.getDraft() ?? { text: '', mentions: [] } }), []);
  return <div className={classes('relative min-w-0 font-cui', className)}>
    {empty ? <span aria-hidden="true" className="cui-composer-placeholder pointer-events-none absolute inset-0 select-none text-cui-muted">{placeholder}</span> : null}
    <div ref={editor} className="cui-composer-editor" contentEditable suppressContentEditableWarning onInput={resize} role="textbox" aria-multiline="true" aria-label={label} aria-autocomplete="list" aria-controls={suggestions ? `${id}-list` : undefined} aria-expanded={!!suggestions} aria-activedescendant={suggestions ? `${id}-option-${suggestions.index}` : undefined} translate="no" style={{ maxHeight }} />
    <span ref={template} hidden aria-hidden="true" className="cui-composer-mention" contentEditable={false} dir="auto"><span className="cui-composer-mention-content"><Icon name="Palette" size={16} /><span data-cui-mention-title="" /></span></span>
    {suggestions ? <div ref={popup} id={`${id}-list`} role="listbox" aria-label={mentionListLabel} className="cui-composer-mention-popup">
      {mentionHeading ? <div aria-hidden="true" className="px-2.5 py-1 text-[13px] leading-[18px] font-(--cui-medium) text-cui-muted">{mentionHeading}</div> : null}
      {suggestions.items.map((item, index) => <div key={item.id} id={`${id}-option-${index}`} role="option" aria-selected={index === suggestions.index} onPointerDown={event => event.preventDefault()} onPointerMove={() => editing.current?.highlight(index)} onClick={() => editing.current?.choose(index)} className="cui-composer-mention-option flex w-full cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-start text-sm leading-5 text-cui-text aria-selected:bg-(--cui-composer-hover)">
        <Icon name="Palette" size={16} className="shrink-0" /><span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{item.title}</span>{item.description ? <span className="min-w-0 overflow-hidden text-xs text-ellipsis whitespace-nowrap text-cui-muted">{item.description}</span> : null}
      </div>)}
    </div> : null}
    {context ? <div ref={menu} role="menu" tabIndex={-1} className="cui-composer-mention-popup cui-composer-mention-menu" onKeyDown={event => {
      if (event.key === 'Escape' || event.key === 'Tab') { event.preventDefault(); event.stopPropagation(); editing.current?.closeMenu(true); }
      else if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) { event.preventDefault(); menu.current?.querySelector('button')?.focus({ preventScroll: true }); }
    }}><button type="button" role="menuitem" tabIndex={-1} onPointerMove={event => event.currentTarget.focus({ preventScroll: true })} onPointerLeave={() => menu.current?.focus({ preventScroll: true })} onClick={() => editing.current?.removeMention()}>{deleteLabel}</button></div> : null}
  </div>;
}
