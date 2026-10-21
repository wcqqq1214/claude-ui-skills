import { Activity, StrictMode, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { useSearchHighlight } from '../../../src';
import '../../../src/styles/index.css';

type HighlightApi = ReturnType<typeof useSearchHighlight>;
type SavedTarget = HighlightApi & { row: HTMLDivElement; title: HTMLHeadingElement };
type RequestSource = 'ref' | 'layout';
const options = new URLSearchParams(location.search);

// The hook deliberately belongs to the parent. Descendant refs and layout
// effects run before that parent's layout setup on mount and Activity reveal.
function Destination({ highlight, cancel, save, source, automatic }: HighlightApi & {
  save: (target: SavedTarget) => void;
  source: RequestSource;
  automatic: boolean;
}) {
  const target = useRef<SavedTarget | null>(null);
  const request = useCallback(({ row, title }: SavedTarget) => {
    highlight(row, title);
    const queued = options.get('queued');
    if (queued === 'cancel') cancel();
    if (queued === 'replace') {
      const replacement = row.parentElement!.querySelector<HTMLDivElement>('[data-mount-second-row]')!;
      highlight(replacement, replacement.querySelector('h3')!);
    }
    if (queued === 'pagehide') window.dispatchEvent(new Event('pagehide'));
  }, [highlight, cancel]);
  const attach = useCallback((row: HTMLDivElement | null) => {
    if (!row) return;
    const title = row.querySelector('h3')!;
    target.current = { highlight, cancel, row, title };
    save(target.current);
    if (automatic && source === 'ref') request(target.current);
  }, [highlight, cancel, save, source, automatic, request]);
  useLayoutEffect(() => {
    if (automatic && source === 'layout' && target.current) request(target.current);
    return () => {
      if (options.has('cleanup') && target.current) {
        const { row, title } = target.current;
        highlight(row, title);
      }
    };
  }, [highlight, request, source, automatic]);
  return <section aria-label="Mount highlight destinations" data-mount-scroll style={{ height: 240, overflowY: 'auto' }}>
    <div style={{ height: 360 }} />
    <div ref={attach} data-mount-row style={{ minHeight: 220 }}>
      <h3 tabIndex={-1} style={{ width: 'fit-content', margin: 0 }}>Mount destination</h3>
    </div>
    <div data-mount-second-row style={{ minHeight: 220 }}>
      <h3 tabIndex={-1} style={{ width: 'fit-content', margin: 0 }}>Replacement mount destination</h3>
    </div>
    <div style={{ height: 360 }} />
  </section>;
}

function HighlightOwner({ active, ...props }: { active: boolean } & Pick<Parameters<typeof Destination>[0], 'source' | 'automatic' | 'save'>) {
  const controller = useSearchHighlight(active);
  return <Destination {...controller} {...props} />;
}

function Consumer() {
  const [active, setActive] = useState(!options.has('inactive'));
  const [visible, setVisible] = useState(true), [automatic, setAutomatic] = useState(true);
  const saved = useRef<SavedTarget | null>(null);
  const externalRow = useRef<HTMLDivElement>(null), externalTitle = useRef<HTMLHeadingElement>(null);
  const save = useCallback((target: SavedTarget) => { saved.current ??= target; }, []);
  const source = options.get('source') === 'layout' ? 'layout' : 'ref';
  return <main data-cui-theme="light">
    <button data-mount-saved onClick={() => { const target = saved.current!; target.highlight(target.row, target.title); }}>Saved mounting highlight</button>
    <button onClick={() => saved.current!.cancel()}>Cancel mounting highlight</button>
    <button onClick={() => setActive(value => !value)}>Toggle mounting active</button>
    <button onClick={() => setVisible(value => !value)}>Toggle mounting Activity</button>
    <button onClick={() => setAutomatic(value => !value)}>Toggle automatic request</button>
    <button onClick={() => {
      const target = saved.current!;
      target.highlight(target.row, target.title);
      flushSync(() => setVisible(true));
    }}>Saved highlight then show Activity</button>
    <button onClick={() => {
      const target = saved.current!;
      target.highlight(target.row, target.title);
      flushSync(() => setActive(true));
    }}>Saved highlight then activate</button>
    <button onClick={() => {
      flushSync(() => setVisible(false));
      flushSync(() => setVisible(true));
    }}>Hide then show mounting Activity</button>
    <button onClick={() => {
      saved.current!.highlight(externalRow.current!, externalTitle.current!);
      flushSync(() => { setActive(true); setVisible(true); });
    }}>Inactive external highlight then activate and show</button>
    <output data-mount-state data-active={String(active)} data-visible={String(visible)} data-automatic={String(automatic)}>{JSON.stringify({ active, visible, automatic })}</output>
    <section aria-label="External highlight destinations" data-external-scroll style={{ height: 180, overflowY: 'auto' }}>
      <div style={{ height: 280 }} />
      <div ref={externalRow} data-external-row style={{ minHeight: 180 }}>
        <h3 ref={externalTitle} tabIndex={-1} style={{ width: 'fit-content', margin: 0 }}>External mount destination</h3>
      </div>
      <div style={{ height: 280 }} />
    </section>
    <Activity mode={visible ? 'visible' : 'hidden'}>
      <HighlightOwner active={active} source={source} automatic={automatic} save={save} />
    </Activity>
  </main>;
}

const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(options.get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
