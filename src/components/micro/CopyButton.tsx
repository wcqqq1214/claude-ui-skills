import type { ComponentPropsWithRef } from 'react';
import { useClipboard } from '../../hooks/useClipboard';
import { classes } from '../../lib/classes';

export type CopyButtonProps = Omit<ComponentPropsWithRef<'button'>, 'children' | 'onClick'> & {
  text: string;
  copyLabel: string;
  copiedLabel: string;
  failedLabel: string;
  onCopyResult?: (copied: boolean) => void;
};
export function CopyButton({ text, copyLabel, copiedLabel, failedLabel, onCopyResult, className, type = 'button', ...props }: CopyButtonProps) {
  const { state, copy } = useClipboard();
  const label = state === 'copied' ? copiedLabel : state === 'failed' ? failedLabel : copyLabel;
  return <>
    <button {...props} type={type} onClick={() => { void copy(text, onCopyResult); }} className={classes('shrink-0 cursor-pointer rounded-[7px] border border-solid border-transparent bg-cui-surface px-2.5 py-[5px] font-cui text-[11px] font-(--cui-medium) text-cui-text shadow-[0_0_0_1px_var(--cui-line)] transition-[background,color] duration-120 ease-[var(--cui-ease-snap)] enabled:hover:bg-[rgb(11_11_11_/_5%)] in-data-[cui-theme=dark]:shadow-[inset_0_0_0_1px_var(--cui-line)] in-data-[cui-theme=dark]:enabled:hover:bg-[#20201f] focus-visible:outline-2 focus-visible:outline-cui-accent disabled:cursor-default disabled:opacity-50', className)}>{label}</button>
    <span className="sr-only" role="status">{state === 'idle' ? '' : label}</span>
  </>;
}
