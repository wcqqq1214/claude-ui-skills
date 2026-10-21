import { Activity, StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FileWorkspace } from '../../../src';
import type { WorkspaceFile, WorkspaceLabels, WorkspaceView } from '../../../src';
import '../../../src/styles/index.css';

const options = new URLSearchParams(location.search);
const controlled = options.get('controlled') === 'true';
const labels: WorkspaceLabels = { title: 'Workspace', files: 'Files', resize: 'Resize', resizeHint: 'Drag', resizeKeys: 'Arrows', view: 'View', preview: 'Preview', code: 'Code', source: 'Source', expand: 'Expand', restore: 'Restore', empty: 'Empty' };

function Preview({ owner, file, revision }: { owner: string; file: string; revision: number }) {
  const [draft, setDraft] = useState(`${owner} ${file}`);
  return <section data-preview-file={file} data-preview-revision={revision}>
    <label>Preview draft<input aria-label={`${owner} draft`} value={draft} onChange={event => setDraft(event.target.value)} /></label>
  </section>;
}

function Consumer() {
  const [revision, setRevision] = useState(0), [visible, setVisible] = useState(true);
  const [firstFile, setFirstFile] = useState('a'), [secondFile, setSecondFile] = useState('a');
  const [firstView, setFirstView] = useState<WorkspaceView>('preview'), [secondView, setSecondView] = useState<WorkspaceView>('preview');
  const files = (owner: string): WorkspaceFile[] => ['a', 'b'].map(file => ({ id: file, name: `File ${file.toUpperCase()}`, preview: <Preview owner={owner} file={file} revision={revision} />, code: `${owner} ${file} source ${revision}` }));
  return <main data-cui-theme="light" style={{ width: 900, maxWidth: '100%' }}>
    <button onClick={() => setRevision(value => value + 1)}>Rerender workspaces</button>
    <button onClick={() => setVisible(false)}>Hide workspaces</button>
    <button onClick={() => setVisible(true)}>Show workspaces</button>
    <output data-preview-state>{JSON.stringify({ revision, visible, firstFile, secondFile, firstView, secondView })}</output>
    <Activity mode={visible ? 'visible' : 'hidden'}>
      <section aria-label="First preview workspace">
        <FileWorkspace files={files('First')} labels={labels} value={controlled ? firstFile : undefined} view={controlled ? firstView : undefined} onValueChange={setFirstFile} onViewChange={setFirstView} />
      </section>
      <section aria-label="Second preview workspace">
        <FileWorkspace files={files('Second')} labels={labels} value={controlled ? secondFile : undefined} view={controlled ? secondView : undefined} onValueChange={setSecondFile} onViewChange={setSecondView} />
      </section>
    </Activity>
  </main>;
}

const consumer = <Consumer />;
createRoot(document.getElementById('root')!).render(options.get('strict') === 'off' ? consumer : <StrictMode>{consumer}</StrictMode>);
