import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Checkbox, DiscreteSlider, Switch } from '../../src';
import type { Copy, Locale } from '../i18n';
import { translate } from '../translations';
import { Specimen } from '../components/Specimen';

export function ControlsChapter({ copy, locale }: { copy: Copy; locale: Locale }) {
  const [slow, setSlow] = useState(false);
  const [checked, setChecked] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [effort, setEffort] = useState('2');
  const options = ['0', '1', '2', '3'].map((value, index) => ({
    value, label: translate(locale, 'Level {0} of {1}', index + 1, 4), recommended: index === 2,
  }));
  return (
    <div className="demo-controls-grid" style={{ '--cui-motion-scale': slow ? 5 : 1 } as CSSProperties}>
      <div className="demo-controls-toolbar">
        <label className="demo-speed-control">{copy.playback}
          <select aria-label={copy.playback} value={slow ? '0.2' : '1'} onChange={event => setSlow(event.target.value === '0.2')}>
            <option value="1">{copy.normalSpeed}</option><option value="0.2">{copy.slowSpeed}</option>
          </select>
        </label>
      </div>
        <Specimen title={copy.switch} description={copy.switchDescription} parameters={locale === 'en' ? "120ms; 16px travel; CSS transform" : "120ms; 16px 位移; CSS transform"}>
          <div className="[zoom:2]"><Switch aria-label={copy.switch} checked={enabled} onCheckedChange={setEnabled} /></div>
        </Specimen>
        <Specimen title={copy.checkbox} description={copy.checkboxDescription} parameters={locale === 'en' ? "200ms in; 120ms out; SVG clip-path" : "200ms 显现; 120ms 收回; SVG clip-path"}>
          <div className="flex [zoom:2]"><Checkbox aria-label={copy.checkbox} checked={checked} onCheckedChange={setChecked} /></div>
        </Specimen>
        <Specimen title={copy.slider} description={copy.sliderDescription} parameters={locale === 'en' ? "120ms; 1.12× press scale; 4 stops" : "120ms; 1.12× 按压缩放; 4 档"} wide>
          <div className="w-full max-w-[360px] [zoom:1.5]"><DiscreteSlider aria-label={copy.effort} options={options} value={effort} onValueChange={setEffort} /></div>
        </Specimen>
    </div>
  );
}
