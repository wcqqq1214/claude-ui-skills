import type { ComponentPropsWithoutRef } from 'react';
import { useClipboard } from '../../hooks/useClipboard';
import { classes } from '../../lib/classes';
import { Icon } from '../icons/Icon';
import { IconButton } from '../controls/IconButton';

export interface CodeBlockProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  code: string;
  language?: string;
  copyLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
}

export function CodeBlock({ code, language, copyLabel, copiedLabel, copyFailedLabel, className, ...props }: CodeBlockProps) {
  const { state, copy } = useClipboard();
  return <div {...props} role="group" tabIndex={0} dir="ltr" className={classes('cui-code-block group relative min-w-0 rounded-lg border-[.5px] border-solid border-cui-line bg-[color-mix(in_oklab,var(--cui-surface-popover)_50%,transparent)] text-cui-text focus-visible:outline-2 focus-visible:outline-cui-accent', className)}>
    <div className="cui-code-actions sticky top-2 z-10 float-right h-12 w-0 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
      <IconButton className="absolute right-2 backdrop-blur-[12px]" aria-label={copyLabel} title={copyLabel} onClick={() => { void copy(code); }}><Icon name={state === 'copied' ? 'Check' : 'Copy'} /></IconButton>
      <span role="status" className="sr-only">{state === 'copied' ? copiedLabel : state === 'failed' ? copyFailedLabel : ''}</span>
    </div>
    {language ? <div translate="no" className="px-3.5 pt-3.5 font-cui text-[11px] leading-[17px] text-cui-secondary">{language}</div> : null}
    <div className="overflow-x-auto"><pre className="m-0 rounded-lg p-3.5 font-cui-mono text-sm leading-[1.625] whitespace-pre wrap-normal"><code className="font-[inherit] text-[inherit]">{code}</code></pre></div>
  </div>;
}
