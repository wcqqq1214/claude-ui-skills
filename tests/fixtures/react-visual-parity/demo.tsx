import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../../../demo/App';
import '../../../demo/style.css';

const app = <App />;
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('strict') === 'off' ? app : <StrictMode>{app}</StrictMode>);
