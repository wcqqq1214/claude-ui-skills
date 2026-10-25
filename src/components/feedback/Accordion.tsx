import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { classes } from '../../lib/classes';

export type AccordionProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  title: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerClassName?: string;
};

/** A disclosure. The panel stays mounted so content can retain its local state. */
export function Accordion({ title, children, open, defaultOpen = false, onOpenChange, disabled, triggerClassName, className, ...props }: AccordionProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const expanded = open ?? localOpen;
  const id = useId(), trigger = useRef<HTMLButtonElement>(null), content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!expanded && content.current?.contains(document.activeElement)) trigger.current?.focus({ preventScroll: true });
  }, [expanded]);
  return <div {...props} className={classes('font-cui text-cui-text', className)}>
    <button ref={trigger} id={`${id}-trigger`} type="button" aria-expanded={expanded} aria-controls={`${id}-panel`} disabled={disabled}
      onClick={() => { if (open === undefined) setLocalOpen(!expanded); onOpenChange?.(!expanded); }}
      className={classes('cui-accordion-trigger flex w-full cursor-pointer items-center gap-[13px] rounded-xl border-0 bg-transparent px-[23px] py-[25px] text-left text-inherit disabled:cursor-default disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-cui-accent', triggerClassName)}>
      {title}<span aria-hidden="true" className={classes('ml-auto text-cui-muted transition-transform duration-200 ease-[cubic-bezier(.19,1,.22,1)]', expanded && 'rotate-180')}><Icon name="CaretDown" /></span>
    </button>
    <div id={`${id}-panel`} ref={content} role="region" aria-labelledby={`${id}-trigger`} aria-hidden={!expanded} inert={!expanded} className={classes('cui-accordion', expanded && 'cui-accordion-open')}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  </div>;
}
