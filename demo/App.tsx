import { TasksChapter } from './chapters/TasksChapter';
import { GalleryChapter } from './chapters/GalleryChapter';
import { ImagesChapter } from './chapters/ImagesChapter';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ControlsChapter } from './chapters/ControlsChapter';
import { TypographyChapter } from './chapters/TypographyChapter';
import { SidebarChapter } from './chapters/SidebarChapter';
import { WorkspaceChapter } from './chapters/WorkspaceChapter';
import { MenusChapter } from './chapters/MenusChapter';
import { ComposerChapter } from './chapters/ComposerChapter';
import { MicroChapter } from './chapters/MicroChapter';
import { NotificationsChapter } from './chapters/NotificationsChapter';
import { FeedbackChapter } from './chapters/FeedbackChapter';
import { ReadingChapter } from './chapters/ReadingChapter';
import { SegmentedChapter } from './chapters/SegmentedChapter';
import { DemoShell } from './components/DemoShell';
import { messages } from './i18n';
import type { Locale } from './i18n';

type Theme = 'system' | 'light' | 'dark';
const chapters = ['type', 'controls', 'composer', 'feedback', 'workspace', 'images', 'micro', 'reading', 'gallery', 'menus', 'modes', 'tasks', 'recovery', 'segmented'] as const;
type Chapter = typeof chapters[number];
function readPreferences(key: 'locale' | 'theme') {
  try { return [localStorage.getItem(`cui-demo-${key}`), localStorage.getItem(key === 'locale' ? 'claude-ui-studies.language' : 'claude-ui-studies.theme')]; }
  catch { return []; }
}
function savePreference(key: string, value: string) { try { localStorage.setItem(`cui-demo-${key}`, value); } catch { /* Storage is optional. */ } }
function currentChapter(): Chapter { return chapters.find(chapter => location.hash === `#${chapter}`) ?? 'type'; }
function initialLocale(): Locale {
  const preference = [new URLSearchParams(location.search).get('lang'), ...readPreferences('locale')]
    .find((value): value is Locale => value === 'en' || value === 'zh-Hans');
  const browserLanguage = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  return preference ?? (browserLanguage.startsWith('zh') ? 'zh-Hans' : 'en');
}
function initialTheme(): Theme {
  return readPreferences('theme').find((value): value is Theme => value === 'system' || value === 'light' || value === 'dark') ?? 'system';
}

export function App() {
  const [chapter, setChapter] = useState(currentChapter);
  const [locale, setLocale] = useState(initialLocale);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const copy = messages[locale];
  useLayoutEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [chapter]);
  useEffect(() => {
    const onLocation = () => {
      setChapter(currentChapter());
      const language = new URLSearchParams(location.search).get('lang');
      if (language === 'en' || language === 'zh-Hans') setLocale(language);
    };
    // Replacing the query while choosing a language creates history traversals
    // that do not consistently emit hashchange. Read both from popstate too.
    window.addEventListener('hashchange', onLocation);
    window.addEventListener('popstate', onLocation);
    return () => {
      window.removeEventListener('hashchange', onLocation);
      window.removeEventListener('popstate', onLocation);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    savePreference('locale', locale);
  }, [locale]);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? media.matches ? 'dark' : 'light' : theme;
      document.documentElement.dataset.cuiTheme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    apply(); savePreference('theme', theme);
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return <DemoShell chapter={chapter} chapters={chapters} copy={copy} locale={locale} theme={theme}
    onLocale={next => {
      setLocale(next);
      const url = new URL(location.href); url.searchParams.set('lang', next); history.replaceState(null, '', url);
    }} onTheme={setTheme}>
          <section className="demo-specimen" hidden={chapter !== 'controls'} aria-label={copy.controls}><ControlsChapter copy={copy} locale={locale} /></section>
          <section className="demo-specimen" hidden={chapter !== 'segmented'} aria-label={copy.segmented}><SegmentedChapter copy={copy} /></section>
          <section className="demo-specimen" hidden={chapter !== 'type'} aria-label={copy.type}><TypographyChapter locale={locale} active={chapter === 'type'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'reading'} aria-label={copy.reading}><ReadingChapter locale={locale} active={chapter === 'reading'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'feedback'} aria-label={copy.feedback}><FeedbackChapter locale={locale} active={chapter === 'feedback'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'micro'} aria-label={copy.micro}><MicroChapter locale={locale} active={chapter === 'micro'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'recovery'} aria-label={copy.recovery}><NotificationsChapter locale={locale} active={chapter === 'recovery'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'composer'} aria-label={copy.composer}><ComposerChapter locale={locale} active={chapter === 'composer'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'menus'} aria-label={copy.menus}><MenusChapter locale={locale} active={chapter === 'menus'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'workspace'} aria-label={copy.workspace}><WorkspaceChapter locale={locale} active={chapter === 'workspace'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'modes'} aria-label={copy.modes}><SidebarChapter locale={locale} active={chapter === 'modes'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'images'} aria-label={copy.images}><ImagesChapter locale={locale} active={chapter === 'images'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'gallery'} aria-label={copy.gallery}><GalleryChapter locale={locale} active={chapter === 'gallery'} /></section>
          <section className="demo-specimen" hidden={chapter !== 'tasks'} aria-label={copy.tasks}><TasksChapter locale={locale} active={chapter === 'tasks'} /></section>
  </DemoShell>;
}
