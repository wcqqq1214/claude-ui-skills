import { useEffect, useState } from 'react';
import { ArtifactActionsCard, NotificationStack, WorkingMark } from '../../../src';

export type Fixture = 'working' | 'default-notice' | 'render-notice' | 'artifact';
export function parseFixture(value: string | null): Fixture {
  return value === 'default-notice' || value === 'render-notice' || value === 'artifact' ? value : 'working';
}
const artwork = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="175"%3E%3C/svg%3E';
const blockNotices = [{ message: <div data-ssr-preserve data-default-message><p>Block notice</p></div>, duration: null }];
const plainNotices = [{ message: 'Plain notice', duration: null }];

export function App({ fixture = 'working' }: { fixture?: Fixture }) {
  const [hydrated, setHydrated] = useState(false), [mounted, setMounted] = useState(true);
  const [active, setActive] = useState(true), [replay, setReplay] = useState(0);
  useEffect(() => { setHydrated(true); }, []);
  return <main data-cui-theme="light" data-hydrated={hydrated}>
    {fixture === 'default-notice' ? <NotificationStack label="Default block notice" dismissLabel="Dismiss block notice" defaultNotices={blockNotices} /> : null}
    {fixture === 'render-notice' ? <NotificationStack label="Rendered block notice" dismissLabel="Dismiss rendered notice" defaultNotices={plainNotices} renderMessage={message => <div data-ssr-preserve data-rendered-message><p>{message}</p></div>} /> : null}
    {fixture === 'artifact' ? <>
      <section aria-label="Block artifact" style={{ width: 420 }}>
        <ArtifactActionsCard title="Block report" subtitle={<div data-ssr-preserve data-block-subtitle><p data-subtitle-paragraph>Block metadata</p></div>} image={artwork} actionsLabel="Block artifact actions" actions={[{ id: 'open', label: 'Open report', onSelect: () => {} }]} />
      </section>
      <section aria-label="Text artifact" style={{ width: 420 }}><ArtifactActionsCard title="Text report" subtitle="Artifact · Today" image={artwork} actionsLabel="Text artifact actions" actions={[]} /></section>
      <section aria-label="Empty artifact" style={{ width: 420 }}><ArtifactActionsCard title="Empty report" image={artwork} actionsLabel="Empty artifact actions" actions={[]} /></section>
      <section aria-label="Zero artifact" style={{ width: 420 }}><ArtifactActionsCard title="Zero report" subtitle={0} image={artwork} actionsLabel="Zero artifact actions" actions={[]} /></section>
    </> : null}
    {fixture === 'working' ? <>
      <button onClick={() => setMounted(value => !value)}>Mount</button>
      <button onClick={() => setActive(value => !value)}>Active</button>
      <button onClick={() => setReplay(value => value + 1)}>Replay</button>
      {mounted ? <WorkingMark key={replay} data-working active={active} fallback={<span data-failed>Artwork unavailable</span>} /> : null}
    </> : null}
  </main>;
}
