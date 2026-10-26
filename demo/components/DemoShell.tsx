import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import type { Copy, Locale } from '../i18n';
import logo from '../../src/assets/artwork/claude-logo.svg';
import { Icon } from '../../src';
import { DemoSelect } from './DemoSelect';

type Theme = 'system' | 'light' | 'dark';
export function DemoShell({ chapter, chapters, copy, locale, theme, onLocale, onTheme, children }: {
  chapter: keyof Copy; chapters: readonly (keyof Copy)[]; copy: Copy; locale: Locale; theme: Theme;
  onLocale: (locale: Locale) => void; onTheme: (theme: Theme) => void; children: ReactNode;
}) {
  const [picker, setPicker] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [language, setLanguage] = useState(false);
  const [menuFocus, setMenuFocus] = useState<Locale>(locale);
  const sidebar = useRef<HTMLElement>(null);
  const languageHost = useRef<HTMLDivElement>(null);
  const languageButton = useRef<HTMLButtonElement>(null);
  const pickerButton = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (language) menu.current?.querySelector<HTMLButtonElement>(`[lang="${menuFocus}"]`)?.focus();
  }, [language, menuFocus]);
  useEffect(() => {
    const outside = (event: Event) => {
      if (!(event.target instanceof Node)) return;
      if (!languageHost.current?.contains(event.target)) setLanguage(false);
      if (!sidebar.current?.contains(event.target)) setPicker(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (language) { setLanguage(false); languageButton.current?.focus(); event.preventDefault(); }
      else if (picker) { setPicker(false); pickerButton.current?.focus(); event.preventDefault(); }
    };
    const media = matchMedia('(max-width: 850px)');
    const resize = () => { if (!media.matches) setPicker(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    media.addEventListener('change', resize);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
      media.removeEventListener('change', resize);
    };
  }, [language, picker]);
  function navigate(event: MouseEvent<HTMLAnchorElement>, next: keyof Copy, focusTitle = false) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (picker) { setPicker(false); if (focusTitle) title.current?.focus({ preventScroll: true }); }
    if (next !== chapter) return;
    event.preventDefault();
    const url = new URL(location.href); url.hash = next;
    if (url.href !== location.href) {
      try { history.replaceState(history.state, '', url); }
      catch { location.hash = next; }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
  return <div className="demo-shell" data-show-notes={showNotes}>
    <aside ref={sidebar} className="demo-sidebar" data-picker-open={picker || undefined}>
      <a className="demo-brand" href="#type" onClick={event => navigate(event, 'type')}><img src={logo} width={36} height={36} alt="" /><span>Claude UI</span></a>
      <button ref={pickerButton} type="button" className="demo-chapter-toggle" aria-label={copy.components}
        aria-expanded={picker} aria-controls="demo-chapter-nav" onClick={() => setPicker(!picker)}>
        <span><small>{String(chapters.indexOf(chapter) + 1).padStart(2, '0')}</small>{copy[chapter]}</span><Icon name="CaretDown" size={16} className="demo-chapter-chevron" />
      </button>
      <nav id="demo-chapter-nav" aria-label={copy.components}>
        {chapters.map((id, index) => <a key={id} href={`#${id}`} aria-current={chapter === id ? 'page' : undefined}
          onClick={event => navigate(event, id, true)}>
          <span>{String(index + 1).padStart(2, '0')}</span>{copy[id]}</a>)}
        <p className="demo-sidebar-note">{locale === 'en' ? 'Unofficial examples' : '非官方示例'}</p>
      </nav>
    </aside>
    <div className="demo-page">
      <header className="demo-topbar">
        <div className="demo-shell-controls">
          <div ref={languageHost} className="demo-shell-control">
            <button ref={languageButton} type="button" className="demo-shell-icon" aria-label={copy.language} title={copy.language}
              aria-haspopup="menu" aria-expanded={language} aria-controls="demo-language-menu"
              onClick={() => { setMenuFocus(locale); setLanguage(!language); }} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setMenuFocus(event.key === 'ArrowUp' ? 'en' : locale); setLanguage(true); } }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></svg>
            </button>
            <div ref={menu} id="demo-language-menu" className="demo-shell-menu" role="menu" aria-label={copy.language} hidden={!language}
              onKeyDown={event => {
                const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
                const index = items.indexOf(document.activeElement as HTMLButtonElement);
                let next: number;
                if (event.key === 'ArrowDown') next = (index + 1) % items.length;
                else if (event.key === 'ArrowUp') next = (index + items.length - 1) % items.length;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = items.length - 1;
                else if (event.key === 'Tab') { setLanguage(false); return; }
                else return;
                event.preventDefault(); setMenuFocus(items[next]?.lang as Locale); items[next]?.focus();
              }}>
              {(['zh-Hans', 'en'] as const).map(id => <button key={id} type="button" role="menuitemradio" aria-checked={locale === id} tabIndex={menuFocus === id ? 0 : -1} lang={id} translate="no"
                onClick={() => { onLocale(id); setLanguage(false); languageButton.current?.focus(); }}>
                {id === 'en' ? 'English' : '简体中文'}<span aria-hidden="true">✓</span>
              </button>)}
            </div>
          </div>
          <DemoSelect className="demo-theme-select" label={copy.theme} value={theme} onChange={onTheme}
            options={(['light', 'dark', 'system'] as const).map(value => ({ value, label: copy[value] }))} />
        </div>
      </header>
      <main>
        <header className="demo-section-head"><h1 ref={title} tabIndex={-1}>{copy[chapter]}</h1>
          <button type="button" className="demo-notes-toggle demo-button small subtle" aria-pressed={showNotes} onClick={() => setShowNotes(value => !value)}>{copy.notes}</button>
        </header>
        <div className="demo-stage" data-chapter={chapter}>{children}</div>
      </main>
    </div>
  </div>;
}
