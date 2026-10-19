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
    <button {...props} type={type} onClick={async () => { const result = await copy(text); if (result !== undefined) onCopyResult?.(result); }} className={classes('shrink-0 cursor-pointer rounded-md border border-solid border-cui-line bg-cui-surface px-3 py-1.5 font-cui text-xs text-cui-secondary focus-visible:outline-2 focus-visible:outline-cui-accent disabled:cursor-default disabled:opacity-50', className)}>{label}</button>
    <span className="sr-only" role="status">{state === 'idle' ? '' : label}</span>
  </>;
}
