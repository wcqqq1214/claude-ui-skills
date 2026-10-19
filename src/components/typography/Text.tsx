import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import { classes } from '../../lib/classes';

export interface GraphemeRevealProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  text: string;
  locale?: string;
  animate?: boolean;
  replayKey?: string | number;
}

export function GraphemeReveal({ text, locale, animate = true, replayKey = 0, className, ...props }: GraphemeRevealProps) {
  const graphemes = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(text)].map(part => part.segment)
    : Array.from(text);
  return <span {...props} className={classes('font-cui-serif', className)}>
    <span className="sr-only">{text}</span>
    <span key={replayKey} aria-hidden="true">{graphemes.map((character, index) => <span key={index} className={animate ? 'cui-grapheme' : undefined} style={{ '--cui-grapheme-index': index } as CSSProperties}>{character}</span>)}</span>
  </span>;
}

export function FadeIn({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return <span {...props} className={classes('cui-word-fade', className)} />;
}

export function UserMessage({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={classes('box-border max-w-[85%] rounded-[10px] bg-cui-segment-track px-3 py-2 font-cui text-sm leading-[1.6] font-normal wrap-break-word text-cui-text select-text', className)} />;
}

export function Prose({ className, style, measure = '36em', ...props }: ComponentPropsWithoutRef<'div'> & { measure?: string }) {
  return <div {...props} style={{ maxWidth: measure, ...style }} className={classes('cui-prose w-full font-cui-serif text-[15px] leading-[1.6] font-(--cui-regular) wrap-anywhere text-pretty text-cui-text', className)} />;
}
