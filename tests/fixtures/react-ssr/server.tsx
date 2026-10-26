import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App, parseFixture } from './App';

export function render(fixture: string | null = null) { return renderToString(<StrictMode><App fixture={parseFixture(fixture)} /></StrictMode>); }
