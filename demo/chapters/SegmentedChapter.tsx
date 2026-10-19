import { useState } from 'react';
import { SegmentedControl } from '../../src';
import type { Copy } from '../i18n';
import { Specimen } from '../components/Specimen';

export function SegmentedChapter({ copy }: { copy: Copy }) {
  const [value, setValue] = useState('preview');
  const options = [{ value: 'preview', label: copy.preview }, { value: 'code', label: copy.code }, { value: 'details', label: copy.details }];
  return (
    <div className="grid grid-cols-1 gap-4">
      <Specimen title={copy.standard} parameters={copy.standardHint}>
        <div className="flex max-w-full flex-col items-center gap-6">
          <div className="max-w-full overflow-x-auto p-1"><SegmentedControl aria-label={copy.segmentLabel} options={options} value={value} onValueChange={setValue} /></div>
          <p className="text-xs text-cui-secondary">{copy.selection}: <span className="text-cui-text">{options.find(option => option.value === value)?.label}</span></p>
        </div>
      </Specimen>
      <Specimen title={copy.compact} parameters={copy.compactHint}>
        <SegmentedControl aria-label={copy.compactLabel} options={options.slice(0, 2)} defaultValue="code" size="compact" />
      </Specimen>
      <p className="px-1 text-xs text-cui-secondary">{copy.segmentHint}</p>
    </div>
  );
}
