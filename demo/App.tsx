import { useEffect, useState } from 'react';
import { ControlsChapter } from './chapters/ControlsChapter';
import { TypographyChapter } from './chapters/TypographyChapter';
import { ComposerChapter } from './chapters/ComposerChapter';
import { MicroChapter } from './chapters/MicroChapter';
import { NotificationsChapter } from './chapters/NotificationsChapter';
import { FeedbackChapter } from './chapters/FeedbackChapter';
import { ReadingChapter } from './chapters/ReadingChapter';
import { SegmentedChapter } from './chapters/SegmentedChapter';
import { messages } from './i18n';
import type { Locale } from './i18n';

type Theme = 'system' | 'light' | 'dark';
const chapters = ['controls', 'segmented', 'type', 'reading', 'feedback', 'micro', 'recovery', 'composer'] as const;
type Chapter = typeof chapters[number];
function readPreference(key: string) { try { return localStorage.getItem(`cui-demo-${key}`); } catch { return null; } }
function savePreference(key: string, value: string) { try { localStorage.setItem(`cui-demo-${key}`, value); } catch { /* Storage is optional. */ } }
function currentChapter(): Chapter { return chapters.find(chapter => location.hash === `#${chapter}`) ?? 'controls'; }
function initialLocale(): Locale {
  const preference = new URLSearchParams(location.search).get('lang') ?? readPreference('locale');
  return preference === 'zh-Hans' || (!preference && navigator.language.startsWith('zh')) ? 'zh-Hans' : 'en';
}
function initialTheme(): Theme {
  const theme = readPreference('theme');
  return theme === 'light' || theme === 'dark' ? theme : 'system';
}

export function App() {
  const [chapter, setChapter] = useState(currentChapter);
  const [locale, setLocale] = useState(initialLocale);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const copy = messages[locale];
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

  return (
    <div className="min-h-screen">
      <aside className="border-0 border-b border-solid border-cui-line px-5 py-5 md:fixed md:inset-y-0 md:left-0 md:w-[226px] md:border-r md:border-b-0 md:px-6 md:py-8">
        <a href="#controls" className="flex items-center gap-3 text-base font-semibold"><span aria-hidden="true" className="text-3xl text-[#c6613f]">✳</span>Claude UI</a>
        <p className="mt-1 text-[11px] text-cui-muted">{copy.source}</p>
        <nav aria-label={copy.components} className="mt-6 flex flex-wrap gap-2 md:flex-col">
          {chapters.map((id, index) => <a key={id} href={`#${id}`} aria-current={chapter === id ? 'page' : undefined}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-cui-secondary hover:bg-cui-segment-track aria-[current=page]:bg-cui-segment-track aria-[current=page]:text-cui-text"><span className="text-[10px] text-cui-muted">0{index + 1}</span>{copy[id]}</a>)}
        </nav>
      </aside>
      <main className="px-5 py-7 md:ml-[226px] md:px-10 md:py-10">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-10 flex flex-wrap items-center justify-end gap-3 text-xs text-cui-secondary">
            <select aria-label={copy.language} value={locale} onChange={event => {
              const next = event.target.value as Locale; setLocale(next);
              const url = new URL(location.href); url.searchParams.set('lang', next); history.replaceState(null, '', url);
            }} className="rounded-lg border border-solid border-cui-line bg-cui-surface px-2 py-2">
              <option value="en">English</option><option value="zh-Hans">简体中文</option>
            </select>
            <select aria-label={copy.theme} value={theme} onChange={event => setTheme(event.target.value as Theme)} className="rounded-lg border border-solid border-cui-line bg-cui-surface px-2 py-2">
              <option value="system">{copy.system}</option><option value="light">{copy.light}</option><option value="dark">{copy.dark}</option>
            </select>
          </div>
          <header className="mb-8"><p className="mb-3 text-xs text-cui-muted">{copy.introduction}</p><h1 className="text-[28px] leading-tight font-(--cui-medium)">{copy[chapter]}</h1><p className="mt-3 text-sm text-cui-secondary">{{ controls: copy.controlDescription, segmented: copy.segmentDescription, type: copy.typeDescription, reading: copy.readingDescription, feedback: copy.feedbackDescription, micro: copy.microDescription, recovery: copy.recoveryDescription, composer: copy.composerDescription }[chapter]}</p></header>
          <section hidden={chapter !== 'controls'} aria-label={copy.controls}><ControlsChapter copy={copy} locale={locale} /></section>
          <section hidden={chapter !== 'segmented'} aria-label={copy.segmented}><SegmentedChapter copy={copy} /></section>
          <section hidden={chapter !== 'type'} aria-label={copy.type}><TypographyChapter locale={locale} active={chapter === 'type'} /></section>
          <section hidden={chapter !== 'reading'} aria-label={copy.reading}><ReadingChapter locale={locale} active={chapter === 'reading'} /></section>
          <section hidden={chapter !== 'feedback'} aria-label={copy.feedback}><FeedbackChapter locale={locale} active={chapter === 'feedback'} /></section>
          <section hidden={chapter !== 'micro'} aria-label={copy.micro}><MicroChapter locale={locale} active={chapter === 'micro'} /></section>
          <section hidden={chapter !== 'recovery'} aria-label={copy.recovery}><NotificationsChapter locale={locale} active={chapter === 'recovery'} /></section>
          <section hidden={chapter !== 'composer'} aria-label={copy.composer}><ComposerChapter locale={locale} active={chapter === 'composer'} /></section>
          <footer className="mt-12 text-[11px] text-cui-muted">{copy.footer}</footer>
        </div>
      </main>
    </div>
  );
}
