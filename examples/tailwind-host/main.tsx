import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Icon, SegmentedControl, Switch, WorkingMark } from './ui';
import './style.css';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState(true);
  const [view, setView] = useState('preview');
  return <main data-cui-theme={theme} className="mx-auto min-h-screen max-w-xl space-y-6 bg-cui-bg p-6 text-cui-text">
    <h1 className="text-2xl font-semibold">Project settings</h1>
    <button type="button" className="host-theme rounded-lg bg-emerald-700 px-4 py-2 text-white" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Toggle theme</button>
    <div className="flex items-center gap-3"><Switch aria-label="Notifications" checked={notifications} onCheckedChange={setNotifications} /><span>Notifications</span></div>
    <SegmentedControl aria-label="View" value={view} onValueChange={setView} options={[{ value: 'preview', label: 'Preview' }, { value: 'code', label: 'Code' }]} />
    <output className="block" aria-live="polite">{notifications ? 'Notifications on' : 'Notifications off'}; {view}</output>
    <div className="flex items-center gap-2"><Icon name="Code" /><span>Local icon and sprite assets</span><WorkingMark active={false} /></div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
