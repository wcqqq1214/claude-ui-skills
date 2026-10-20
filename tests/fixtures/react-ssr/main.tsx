import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { App, parseFixture } from './App';
import '../../../src/styles/index.css';

declare global {
  interface Window {
    ssrCheck: { nodes: Element[]; recoverableErrors: string[] };
  }
}
// Keep the parser-created server nodes, rather than merely checking that
// equivalent client content appeared after hydration recovered by rebuilding.
window.ssrCheck = { nodes: [...document.querySelectorAll('[data-ssr-preserve]')], recoverableErrors: [] };
hydrateRoot(document.getElementById('root')!, <StrictMode><App fixture={parseFixture(new URLSearchParams(location.search).get('fixture'))} /></StrictMode>, {
  onRecoverableError: error => window.ssrCheck.recoverableErrors.push(error instanceof Error ? error.message : String(error)),
});
