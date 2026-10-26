import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Checkbox, DiscreteSlider, SegmentedControl, Switch } from '../../src';
import type { Copy, Locale } from '../i18n';
import { translate } from '../translations';
import { Specimen } from '../components/Specimen';

export function ControlsChapter({ copy, locale, active }: { copy: Copy; locale: Locale; active: boolean }) {
  const [slow, setSlow] = useState(true);
  const [checked, setChecked] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [effort, setEffort] = useState('2');
  const [view, setView] = useState('preview');
  const views = [{ value: 'preview', label: copy.preview }, { value: 'code', label: copy.code }, { value: 'details', label: copy.details }];
  const options = ['0', '1', '2', '3'].map((value, index) => ({
    value, label: translate(locale, 'Level {0} of {1}', index + 1, 4), recommended: index === 2,
  }));
  return (
    <div className="demo-controls-grid" style={{ '--cui-motion-scale': slow ? 5 : 1 } as CSSProperties}>
      <div className="demo-controls-toolbar">
        <button type="button" aria-label={copy.playback} disabled={!active} aria-pressed={slow} onClick={() => setSlow(!slow)}
          className="demo-slow"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15v-3a6 6 0 0 1 12 0v3H5Z M8 7l3 4 3-4 M11 11v4 M7 15l-1 3 M15 15l1 3 M5 12H3" /><path d="M17 11h2a2 2 0 0 1 0 4h-2" /></svg><span>{slow ? copy.slowSpeed : `${copy.normalSpeed} 1×`}</span></button>
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
        <Specimen title={copy.segmented} description={copy.segmentHint} parameters={`${copy.standardHint}; ${copy.compactHint}`} wide>
          <div className="demo-segmented-examples">
            <div className="flex min-w-0 max-w-full flex-col items-center gap-2">
              <span className="text-xs text-cui-secondary">{copy.standard}</span>
              <div className="max-w-full overflow-x-auto p-1"><SegmentedControl aria-label={copy.segmentLabel} options={views} value={view} onValueChange={setView} /></div>
            </div>
            <div className="flex min-w-0 max-w-full flex-col items-center gap-2">
              <span className="text-xs text-cui-secondary">{copy.compact}</span>
              <div className="max-w-full overflow-x-auto p-1"><SegmentedControl aria-label={copy.compactLabel} options={views.slice(0, 2)} defaultValue="code" size="compact" /></div>
            </div>
          </div>
        </Specimen>
    </div>
  );
}
