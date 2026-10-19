import { useEffect, useRef, useState } from 'react';
import { CodeBlock, ExpandableTable, Icon, Prose, SegmentedControl, useVisible } from '../../src';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import { code } from '../fixtures/reading';
import '../styles/reading-parity.css';

function NumberSample({ locale, active }: { locale: Locale; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null), visible = useVisible(ref, active);
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => setFrame(value => (value + 7) % 6000), 50);
    return () => clearInterval(timer);
  }, [visible]);
  const t = (text: string) => translate(locale, text);
  const text = `00:${String(Math.floor(frame / 100)).padStart(2, '0')}.${String(frame % 100).padStart(2, '0')}`;
  return <div ref={ref} role="group" aria-label={t('Digits change, width stays steady')} className="demo-reading-comparison">
    <p className="demo-reading-label">{t('Digits change, width stays steady')}</p>
    {['Proportional digits', 'Tabular digits'].map((label, index) => <div key={label} className="min-w-0"><p className="demo-reading-baseline-label">{t(label)}</p><span dir="ltr" translate="no" aria-live="off" data-number-sample={index} className={`inline-block font-cui text-[28px] leading-[1.2] whitespace-nowrap shadow-[-1px_0_var(--cui-line),1px_0_var(--cui-line)] ${index ? 'tabular-nums' : 'proportional-nums'}`}>{text}</span></div>)}
    <p className="demo-reading-detail demo-reading-tech-detail">{t('tabular-nums · Simulated counter · Edge markers show width')}</p>
  </div>;
}

export function ReadingChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const [view, setView] = useState('layout'), [measure, setMeasure] = useState(36);
  const t = (text: string, ...values: (string | number)[]) => translate(locale, text, ...values);
  const columns = [{ key: 'context', header: t('Context'), rowHeader: true }, { key: 'duration', header: t('Duration') }, { key: 'curve', header: t('Curve / mechanism') }, { key: 'intent', header: t('Design intent') }];
  const rows = [
    { key: 'grapheme', cells: { context: t('Grapheme heading'), duration: '90 ms', curve: 'cubic-bezier(.215,.61,.355,1)', intent: t('Resolve a brief blur into clarity') } },
    { key: 'mode', cells: { context: t('Mode thumb'), duration: '120 ms', curve: 'cubic-bezier(.32,.72,0,1)', intent: t('Respond quickly to selection') } },
    { key: 'image', cells: { context: t('Image entry'), duration: '350 ms', curve: 'cubic-bezier(.32,.72,0,1)', intent: t('Connect thumbnail and full image') } },
  ];
  return <div className="demo-card demo-reading-card min-w-0">
    <div className="demo-reading-tabs"><SegmentedControl aria-label={t('Reading examples')} options={[{ value: 'layout', label: t('Typography details') }, { value: 'code', label: t('Code & tables') }]} value={view} onValueChange={setView} /></div>
    <div className="demo-reading-panels">
    <div hidden={view !== 'layout'} className="demo-reading-layout">
      <div className="min-w-0"><label className="demo-reading-width-control">{t('Resize to see wrapping')}<input aria-label={t('Resize to see wrapping')} aria-valuetext={t('{0} em · Maximum {1} px', measure, measure * 15)} type="range" min="12" max="36" step="1" value={measure} onChange={event => setMeasure(Number(event.target.value))} /></label>
        <Prose measure={`${measure}em`} className="my-[22px]">
          <h3>{t('Good reading starts with room for content.')}</h3>
          {locale === 'en' ? <p>A few quiet details make a page easier to read. <em>Leave room between ideas</em>, and let each sentence find its own rhythm.</p> : <p>{t('A few quiet details make a page easier to read.')}</p>}
          <p>{locale === 'en' ? <>Inline references such as <code>reading.js</code> stay within the paragraph.</> : <>例如 <code>reading.js</code> 这样的行内引用可以融入段落。</>}</p>
          <p className="text-[.85em] text-cui-muted"><code>claude-design-observation-local-demonstration-with-a-long-identifier</code></p>
        </Prose>
        <p className="demo-reading-detail">{t('text-wrap: balance for headings · pretty for paragraphs')}</p><p className="demo-reading-detail">{t('Inline code · 0.5px border · 0.9em type · 0.4em radius')}</p><output className="demo-reading-detail">{t('Demo width cap · {0}em / {1}px', measure, measure * 15)}</output>
      </div>
      <div className="demo-reading-comparisons">
        <div role="group" aria-label={t('Icon baseline comparison')} className="demo-reading-comparison"><p className="demo-reading-label">{t('Align icons with text')}</p>
          {['Default baseline', 'Offset −0.125em'].map((label, index) => <div key={label}><p className="demo-reading-baseline-label">{t(label)}</p><div className="demo-baseline-line"><span className="demo-baseline-guide" /><Icon name="File" style={index ? undefined : { verticalAlign: 'baseline' }} /> {t('File details')}</div></div>)}
          <p className="demo-reading-detail demo-reading-tech-detail">{t('vertical-align: −0.125em · 16px icon → 2px down')}</p>
        </div>
        <NumberSample locale={locale} active={active && view === 'layout'} />
        <div role="group" aria-label={t('Font weight comparison')} className="demo-reading-comparison font-cui"><p className="demo-reading-label">{t('Lighter weights in dark mode')}</p>
          {[false, true].map(themed => <div key={String(themed)}><p className="demo-reading-baseline-label">{t(themed ? 'Theme weights' : 'Fixed weights')}</p><div lang="en" translate="no"><div style={{ fontWeight: themed ? 'var(--cui-medium)' : 500 }}>Interface details</div><div style={{ fontWeight: themed ? 'var(--cui-bold)' : 600 }}>Interface details</div></div>{locale === 'zh-Hans' ? <div className="mt-1.5 text-xs leading-[1.6] text-cui-secondary"><div style={{ fontWeight: themed ? 'var(--cui-medium)' : 500 }}>{t('Thoughtful interface details')}</div><div style={{ fontWeight: themed ? 'var(--cui-bold)' : 600 }}>{t('Clear hierarchy')}</div></div> : null}</div>)}
          <p className="demo-reading-detail demo-reading-tech-detail">{t('Variable weight · Light 500 / 600 → Dark 460 / 560')}</p>
        </div>
      </div>
    </div>
    <div hidden={view !== 'code'} className="demo-reading-code min-w-0">
      <div className="min-w-0"><h3 className="demo-reading-code-title">{t('Code & copy feedback')}</h3><CodeBlock aria-label={t('CSS code')} code={code} language="css" copyLabel={t('Copy to clipboard')} copiedLabel={t('Copied')} copyFailedLabel={t('Copy failed')} /><p className="demo-reading-detail mt-2.5">{t('Hover or focus to copy · Check on success · Reset after 2000ms')}</p></div>
      <div className="min-w-0"><ExpandableTable active={active && view === 'code'} label={t('Motion parameters table')} heading={t('Scroll edge shadows')} dialogTitle={t('Motion parameters')} expandLabel={t('Expand table ↗')} closeLabel={t('Close table')} columns={columns} rows={rows} /><p className="demo-reading-detail mt-2.5">{t('Scroll horizontally · 3rem masks / 1.5rem shadows · CSS local / scroll')}</p><p className="demo-reading-detail">{t('Expand · 200ms · scale 0.98 → 1')}</p><p className="demo-reading-detail">cubic-bezier(.165, .84, .44, 1)</p></div>
    </div>
    </div>
  </div>;
}
