import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/glyphs';
import { IconButton } from '../controls/IconButton';
import { SegmentedControl } from '../segmented/SegmentedControl';
import { classes } from '../../lib/classes';
import { usePaneResize } from './usePaneResize';

export type WorkspaceFile = { id: string; name: string; icon?: IconName; preview: ReactNode; code: string };
export type WorkspaceView = 'preview' | 'code';
export type WorkspaceLabels = { title: string; files: string; resize: string; resizeHint: string; resizeKeys: string; view: string; preview: string; code: string; source: string; expand: string; restore: string; empty: string };
export type FileWorkspaceProps = {
  files: readonly WorkspaceFile[];
  labels: WorkspaceLabels;
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  view?: WorkspaceView;
  defaultView?: WorkspaceView;
  onViewChange?: (view: WorkspaceView) => void;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  defaultPaneWidth?: number;
  onPaneWidthChange?: (width: number) => void;
  footer?: ReactNode;
  active?: boolean;
  className?: string;
};
export function FileWorkspace({ files, labels, value, defaultValue, onValueChange, view, defaultView = 'preview', onViewChange, expanded, defaultExpanded = false, onExpandedChange, defaultPaneWidth = 244, onPaneWidthChange, footer, active = true, className }: FileWorkspaceProps) {
  const [localValue, setLocalValue] = useState(defaultValue ?? files[0]?.id), [localView, setLocalView] = useState(defaultView), [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const selected = files.find(file => file.id === (value ?? localValue)) ?? files[0], mode = view ?? localView, isExpanded = expanded ?? localExpanded;
  const id = useId(), root = useRef<HTMLDivElement>(null), layout = useRef<HTMLDivElement>(null), list = useRef<HTMLElement>(null), handle = useRef<HTMLDivElement>(null), content = useRef<HTMLElement>(null), format = useRef<HTMLDivElement>(null), expandButton = useRef<HTMLButtonElement>(null);
  const pane = usePaneResize({ root, layout, list, handle, defaultWidth: defaultPaneWidth, expanded: isExpanded, active, onWidthChange: onPaneWidthChange });
  useLayoutEffect(() => {
    if (isExpanded && (list.current?.contains(document.activeElement) || document.activeElement === handle.current)) expandButton.current?.focus({ preventScroll: true });
  }, [isExpanded]);
  return <div ref={root} data-expanded={isExpanded || undefined} className={classes('cui-workspace box-border min-w-0 overflow-hidden rounded-xl border border-solid border-cui-line bg-cui-surface font-cui text-cui-text', className)} onKeyDown={event => {
    if (event.key !== 'F6' || event.altKey || event.nativeEvent.isComposing || event.repeat || !active) return;
    event.preventDefault();
    const regions = [list.current?.querySelector<HTMLButtonElement>('button'), format.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]'), content.current].filter((node): node is HTMLElement => !!node && !!node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden' && !node.closest('[inert]'));
    let index = regions.findIndex(node => node === document.activeElement || node.contains(document.activeElement));
    if (list.current?.contains(document.activeElement)) index = 0;
    if (format.current?.contains(document.activeElement)) index = regions.findIndex(node => format.current?.contains(node));
    regions[(index + (event.shiftKey ? regions.length - 1 : 1)) % regions.length]?.focus({ preventScroll: true });
  }}>
    <div className="cui-workspace-toolbar flex items-center justify-between gap-3 border-0 border-b border-solid border-transparent px-5 py-2.5 text-xs leading-[1.6]">
      <span className="flex min-w-0 items-center gap-2.5"><Icon name="File" size={20} className="text-(--cui-clay)" /><span className="min-w-0">{labels.title}</span></span>
      <IconButton ref={expandButton} aria-label={isExpanded ? labels.restore : labels.expand} aria-expanded={isExpanded} onClick={() => { if (expanded === undefined) setLocalExpanded(!isExpanded); onExpandedChange?.(!isExpanded); }}><Icon name={isExpanded ? 'Collapse' : 'Expand'} size={16} /></IconButton>
    </div>
    <div ref={layout} className="cui-workspace-layout">
      <aside ref={list} id={`${id}-files`} aria-label={labels.files} inert={isExpanded || undefined} className="cui-workspace-list">
        <div className="cui-workspace-list-heading flex items-baseline justify-between gap-2 px-2.5">
          <span className="text-[9px] tracking-[1.4px] text-cui-muted">{labels.files}</span><output className="cui-workspace-width whitespace-nowrap font-cui-mono text-xs leading-[1.6] text-cui-secondary tabular-nums">{pane.width} px</output>
        </div><p className="cui-workspace-hint mx-2.5 mt-1.5 mb-4 text-right text-[11px] text-cui-secondary">{labels.resizeHint}</p>
        {files.map(file => <button type="button" key={file.id} title={file.name} aria-pressed={file.id === selected?.id} className="cui-workspace-file flex min-h-[38px] w-full min-w-0 max-w-full cursor-pointer items-center gap-[9px] rounded-[5px] border-0 bg-transparent px-2.5 py-[9px] text-left text-[11px] font-(--cui-medium) whitespace-nowrap text-cui-text aria-pressed:bg-(--cui-muted-surface) focus-visible:outline-2 focus-visible:outline-cui-accent" onClick={() => { if (file.id === selected?.id) return; if (value === undefined) setLocalValue(file.id); onValueChange?.(file.id); }}>
          <Icon name={file.icon ?? 'File'} className="shrink-0" /><span className="min-w-0 overflow-hidden text-ellipsis">{file.name}</span>
        </button>)}
      </aside>
      <div ref={handle} role="separator" tabIndex={isExpanded ? -1 : 0} aria-controls={`${id}-files`} aria-label={labels.resize} aria-orientation="vertical" aria-valuemin={160} aria-valuemax={pane.max} aria-valuenow={pane.width} title={labels.resizeKeys} className="cui-workspace-resizer" {...pane.bindings} />
      <div className="min-w-0">
        <div className="cui-workspace-preview-toolbar flex items-center justify-between gap-3 border-0 border-b border-solid border-transparent px-[19px] py-3 text-[10px] text-cui-muted">
          <span title={selected?.name} className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{selected?.name ?? labels.empty}</span>
          <div ref={format}><SegmentedControl aria-label={labels.view} size="compact" className="cui-workspace-segment" value={mode} options={[
            { value: 'preview', label: <span aria-label={labels.preview} title={labels.preview}><Icon name="Eye" /></span> },
            { value: 'code', label: <span aria-label={labels.code} title={labels.code}><Icon name="Code" /></span> },
          ]} onValueChange={next => { if (view === undefined) setLocalView(next as WorkspaceView); onViewChange?.(next as WorkspaceView); }} /></div>
        </div>
        <article ref={content} tabIndex={-1} aria-label={selected?.name ?? labels.empty} className="cui-workspace-content">
          {!selected ? <p>{labels.empty}</p> : mode === 'preview' ? selected.preview : <pre aria-label={`${selected.name} ${labels.source}`}>{selected.code.split('\n').map((line, index) => <span key={index} className="cui-workspace-code-line">{line || ' '}</span>)}</pre>}
        </article>
      </div>
    </div>
    {footer ? <footer className="border-0 border-t border-solid border-cui-line px-5 py-3 text-[11px] text-cui-secondary">{footer}</footer> : null}
  </div>;
}
