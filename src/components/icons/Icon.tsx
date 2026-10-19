import type { ComponentPropsWithoutRef } from 'react';
import { glyphs, secondary } from './glyphs';
import type { IconName } from './glyphs';
import { classes } from '../../lib/classes';

export interface IconProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  name: IconName;
  size?: 12 | 16 | 20 | 24 | 28 | 32;
}
const strokes = { 12: .8, 16: 1, 20: 1.2, 24: 1.4, 28: 1.6, 32: 1.8 };

/** Decorative icon. Give the surrounding control its accessible name. */
export function Icon({ name, size = 16, className, style, ...props }: IconProps) {
  const master = size <= 18 ? 16 : 20;
  const low = master === 16 ? .8 : 1.125, high = master === 16 ? 1.25 : 1.8;
  const weight = Math.round(Math.max(400, Math.min(700, 400 + 300 * (strokes[size] * master / size - low) / (high - low))) * 10) / 10;
  return <span {...props} aria-hidden="true" data-glyph={name} className={classes('cui-icon', className)} style={{ fontSize: size, fontWeight: weight, ...style }}>
    {secondary[name] ? <span data-icon-layer="secondary">{String.fromCodePoint(secondary[name])}</span> : null}
    {String.fromCodePoint(glyphs[name])}
  </span>;
}
