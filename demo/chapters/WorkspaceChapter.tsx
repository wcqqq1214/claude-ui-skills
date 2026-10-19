import { FileWorkspace } from '../../src';
import type { Locale } from '../i18n';
import { translate } from '../translations';
import '../styles/workspace-parity.css';
export function WorkspaceChapter({ locale, active }: { locale: Locale; active: boolean }) {
  const t = (text: string) => translate(locale, text);
  return <FileWorkspace className="demo-card demo-workspace-card" active={active} labels={{ title: t('Resize, switch, restore'), files: t('Files'), resize: t('Resize file list'), resizeHint: t('Drag the divider →'), resizeKeys: t('Arrows: 8px · Shift: 32px · Enter: reset'), view: t('File view'), preview: t('Preview'), code: t('Code'), source: t('Source code'), expand: t('Expand file panel'), restore: t('Restore file panel'), empty: locale === 'en' ? 'No files' : '暂无文件' }} files={[
    { id: 'notes', name: 'panel-layout-and-resize-notes.md', code: t('# Space follows the content\n\nAs the panel narrows, filenames shorten while view controls stay visible.\n\n- Switch files without leaving Preview or Code\n- Expand the preview, then restore the chosen width'), preview: <><h3>{t('Space follows the content')}</h3><p>{t('As the panel narrows, filenames shorten while view controls stay visible.')}</p><ul><li>{t('Switch files without leaving Preview or Code')}</li><li>{t('Expand the preview, then restore the chosen width')}</li></ul></> },
    { id: 'tokens', name: 'panel-layout.css', icon: 'Code', code: '.workspace-layout {\n  grid-template-columns:\n    clamp(160px, var(--pane-width),\n      min(520px, 60%))\n    5px minmax(0, 1fr);\n}', preview: <><h3>{t('Bounded, flexible columns')}</h3>{[['Minimum', '160px'], ['Initial', '244px'], ['Maximum', 'min(520px, 60%)']].map(([label, value]) => <div key={label} className="flex justify-between gap-2 border-0 border-b border-solid border-cui-line py-[9px] text-[11px]"><span>{t(label)}</span><code>{value}</code></div>)}</> },
  ]} footer={<div className="flex flex-wrap gap-[15px]"><span>{t('Filename yields; view controls stay visible')}</span><span><b>200ms</b> cubic-bezier(.32,.72,0,1)</span><span>{t('Restore keeps the chosen width')}</span></div>} />;
}
