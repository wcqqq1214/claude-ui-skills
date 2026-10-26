import { Activity, StrictMode, useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { CopyButton } from '../../../src';
import '../../../src/styles/index.css';

type Interruption = 'hide' | 'reconnect' | 'unmount' | 'unmount-remount' | 'pagehide' | 'latest';
type CopyRequest = { text: string; resolve: () => void; reject: () => void };
type Result = { copied: boolean; instance: number };
type DefaultCommit = { action: 'hide' | 'unmount'; outcome: 'resolve' | 'reject'; request: number; instance: number; node: HTMLButtonElement };
const events: Record<string, unknown>[] = [], requests: CopyRequest[] = [], nodes = new Map<number, HTMLButtonElement>();
let nextInstance = 0;
const lifecycle = {
  events, requests, nodes,
  interrupt: (_action: Interruption) => {},
  interruptDefault: (_action: DefaultCommit['action'], _outcome: DefaultCommit['outcome'], _request: number) => {},
  settle(index: number, outcome: 'resolve' | 'reject', interruption?: Interruption) {
    events.push({ type: 'settle', request: index, outcome });
    requests[index][outcome]();
    // Write completion resumes first. This interruption runs before the
    // following result-delivery turn, which must recheck request ownership.
    if (interruption) queueMicrotask(() => lifecycle.interrupt(interruption));
  },
};
Object.assign(window, { copyDelivery: lifecycle });
Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
  writeText: (text: string) => new Promise<void>((resolve, reject) => {
    events.push({ type: 'request', request: requests.length, text });
    requests.push({ text, resolve, reject: () => reject(new Error('Copy rejected')) });
  }),
} });

function CopyInstance({ onResult }: { onResult: (result: Result) => void }) {
  const [instance] = useState(() => ++nextInstance);
  useLayoutEffect(() => {
    events.push({ type: 'connect', instance });
    return () => { events.push({ type: 'disconnect', instance, connected: !!nodes.get(instance)?.isConnected }); };
  }, [instance]);
  useEffect(() => {
    events.push({ type: 'passive-connect', instance });
    return () => { events.push({ type: 'passive-disconnect', instance, connected: !!nodes.get(instance)?.isConnected }); };
  }, [instance]);
  return <section data-copy-host data-instance={instance}>
    <CopyButton id="delivery-copy" ref={node => { if (node) nodes.set(instance, node); }} text="Exact delivery text" copyLabel="Copy delivery" copiedLabel="Delivery copied" failedLabel="Delivery failed" onCopyResult={copied => {
      const node = nodes.get(instance);
      events.push({ type: 'result', copied, instance, connected: !!node?.isConnected, visible: !!node?.getClientRects().length, requests: requests.length });
      onResult({ copied, instance });
    }} />
  </section>;
}

function DefaultCommitSettlement({ commit }: { commit: DefaultCommit | null }) {
  useLayoutEffect(() => {
    if (!commit) return;
    const { action, outcome, request, instance, node } = commit;
    // This sibling runs after DOM mutation, before deferred passive cleanup.
    // Completing the write here exposes real default-priority disconnection.
    events.push({ type: 'default-settle', action, outcome, request, instance, connected: node.isConnected, visible: !!node.getClientRects().length });
    lifecycle.settle(request, outcome);
  }, [commit]);
  return null;
}

function Consumer() {
  const [visible, setVisible] = useState(true), [mounted, setMounted] = useState(true), [results, setResults] = useState<Result[]>([]);
  const [defaultCommit, setDefaultCommit] = useState<DefaultCommit | null>(null);
  lifecycle.interruptDefault = (action, outcome, request) => {
    // A timer gives these updates ordinary default priority. Do not flushSync:
    // that would eagerly run passive cleanup and conceal the delivery window.
    setTimeout(() => {
      const node = document.getElementById('delivery-copy') as HTMLButtonElement;
      const instance = Number(node.closest<HTMLElement>('[data-copy-host]')!.dataset.instance);
      events.push({ type: 'default-interrupt', action, instance, connected: node.isConnected, visible: !!node.getClientRects().length });
      if (action === 'hide') setVisible(false); else setMounted(false);
      setDefaultCommit({ action, outcome, request, instance, node });
    }, 0);
  };
  lifecycle.interrupt = action => {
    const node = document.getElementById('delivery-copy');
    events.push({ type: 'interrupt-before', action, connected: !!node?.isConnected, visible: !!node?.getClientRects().length, requests: requests.length });
    if (action === 'hide' || action === 'reconnect') {
      flushSync(() => setVisible(false));
      events.push({ type: 'hidden', connected: !!node?.isConnected, visible: !!node?.getClientRects().length });
      if (action === 'reconnect') flushSync(() => setVisible(true));
    } else if (action === 'unmount' || action === 'unmount-remount') {
      flushSync(() => setMounted(false));
      events.push({ type: 'unmounted', connected: !!node?.isConnected });
      if (action === 'unmount-remount') flushSync(() => setMounted(true));
    } else if (action === 'pagehide') window.dispatchEvent(new Event('pagehide'));
    else node?.click();
    events.push({ type: 'interrupt-after', action, connected: !!node?.isConnected, visible: !!node?.getClientRects().length, requests: requests.length });
  };
  return <main data-cui-theme="light" style={{ padding: 40 }}>
    <button onClick={() => flushSync(() => setVisible(false))}>Hide delivery Activity</button>
    <button onClick={() => flushSync(() => setVisible(true))}>Show delivery Activity</button>
    <button onClick={() => flushSync(() => setMounted(true))}>Mount delivery copy</button>
    <output data-copy-results>{JSON.stringify(results)}</output>
    {mounted ? <Activity mode={visible ? 'visible' : 'hidden'}><CopyInstance onResult={result => setResults(previous => [...previous, result])} /></Activity> : null}
    <DefaultCommitSettlement commit={defaultCommit} />
  </main>;
}

const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'on' ? <StrictMode>{consumer}</StrictMode> : consumer);
