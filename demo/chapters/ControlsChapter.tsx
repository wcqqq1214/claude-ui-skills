import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Checkbox, DiscreteSlider, Switch } from '../../src';
import type { Copy, Locale } from '../i18n';
import { Specimen } from '../components/Specimen';

export function ControlsChapter({ copy, locale }: { copy: Copy; locale: Locale }) {
  const [slow, setSlow] = useState(true);
  const [checked, setChecked] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [effort, setEffort] = useState('2');
  const options = ['0', '1', '2', '3'].map((value, index) => ({
    value, label: locale === 'en' ? `Level ${index + 1} of 4` : `第 ${index + 1} 级，共 4 级`, recommended: index === 2,
  }));
  return (
    <div style={{ '--cui-motion-scale': slow ? 5 : 1 } as CSSProperties}>
      <div className="mb-4 flex justify-end">
        <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}
          className="cursor-pointer rounded-lg border border-solid border-cui-line bg-transparent px-3 py-2 text-xs text-cui-secondary aria-pressed:border-cui-accent aria-pressed:text-cui-accent">{copy.slow} {slow ? '⅕×' : '1×'}</button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Specimen title={copy.switch} description={copy.switchDescription} parameters="20px · 120ms · overshoot">
          <div className="[zoom:2]"><Switch aria-label={copy.switch} checked={enabled} onCheckedChange={setEnabled} /></div>
        </Specimen>
        <Specimen title={copy.checkbox} description={copy.checkboxDescription} parameters="200ms in · 120ms out · SVG clip-path">
          <div className="flex [zoom:2]"><Checkbox aria-label={copy.checkbox} checked={checked} onCheckedChange={setChecked} /></div>
        </Specimen>
        <Specimen title={copy.slider} description={copy.sliderDescription} parameters="120ms · 1.12× · 4 stops" wide>
          <div className="w-full max-w-[360px] [zoom:1.5]"><DiscreteSlider aria-label={copy.effort} options={options} value={effort} onValueChange={setEffort} /></div>
        </Specimen>
      </div>
    </div>
  );
}
