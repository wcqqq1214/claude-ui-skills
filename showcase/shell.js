'use strict';
// Showcase chapter navigation and appearance; app.js initializes the component demonstrations.
(() => {
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const themes = ['system', 'light', 'dark'];
  const themeKey = 'claude-ui-studies.theme';
  let theme = 'system';
  try {
    const saved = localStorage.getItem(themeKey);
    if (themes.includes(saved)) theme = saved;
  } catch {}
  const applyTheme = () => {
    document.documentElement.dataset.theme = theme === 'system'
      ? (systemTheme.matches ? 'dark' : 'light') : theme;
  };
  applyTheme();
  systemTheme.addEventListener('change', () => { if (theme === 'system') applyTheme(); });

  document.addEventListener('DOMContentLoaded', () => {
    const themeButton = document.getElementById('themeBtn');
    const themeNames = {system: 'System', light: 'Light', dark: 'Dark'};
    const nextTheme = () => themes[(themes.indexOf(theme) + 1) % themes.length];
    function updateThemeControl() {
      const label = DemoI18n.t('Theme: {0}; switch to {1}', DemoI18n.t(themeNames[theme]), DemoI18n.t(themeNames[nextTheme()]));
      themeButton.title = label;
      themeButton.setAttribute('aria-label', label);
      themeButton.querySelectorAll('[data-theme-icon]').forEach(icon => {
        icon.toggleAttribute('hidden', icon.dataset.themeIcon !== theme);
      });
    }
    themeButton.addEventListener('click', () => {
      theme = nextTheme();
      try {
        if (theme === 'system') localStorage.removeItem(themeKey);
        else localStorage.setItem(themeKey, theme);
      } catch {}
      applyTheme();
      updateThemeControl();
    });
    const languageButton = document.getElementById('languageBtn');
    const languageMenu = document.getElementById('languageMenu');
    const options = [...languageMenu.querySelectorAll('[data-locale]')];
    function updateLanguageControl() {
      options.forEach(option => option.setAttribute('aria-checked', String(option.dataset.locale === DemoI18n.locale)));
    }
    function closeLanguage(restoreFocus = false) {
      languageMenu.hidden = true;
      languageButton.setAttribute('aria-expanded', 'false');
      if (restoreFocus) languageButton.focus({preventScroll: true});
    }
    function openLanguage(last = false) {
      languageMenu.hidden = false;
      languageButton.setAttribute('aria-expanded', 'true');
      (last ? options.at(-1) : options.find(option => option.dataset.locale === DemoI18n.locale)).focus({preventScroll: true});
    }
    languageButton.addEventListener('click', () => languageMenu.hidden ? openLanguage() : closeLanguage());
    languageButton.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openLanguage(event.key === 'ArrowUp');
      }
    });
    options.forEach(option => {
      option.tabIndex = -1;
      option.addEventListener('click', () => {
        DemoI18n.select(option.dataset.locale);
        closeLanguage(true);
      });
    });
    languageMenu.addEventListener('keydown', event => {
      const index = options.indexOf(document.activeElement);
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % options.length;
      else if (event.key === 'ArrowUp') next = (index + options.length - 1) % options.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = options.length - 1;
      else if (event.key === 'Escape') { event.preventDefault(); closeLanguage(true); return; }
      else return;
      event.preventDefault();
      options[next].focus({preventScroll: true});
    });
    for (const eventName of ['pointerdown', 'focusin']) {
      document.addEventListener(eventName, event => {
        if (!languageMenu.hidden && !languageButton.contains(event.target) && !languageMenu.contains(event.target)) closeLanguage();
      });
    }
    updateThemeControl();
    updateLanguageControl();
    DemoI18n.onChange(() => { updateThemeControl(); updateLanguageControl(); });

    // One chapter is shown at a time. The URL hash is the only chapter state:
    // links push it, back/forward and hash edits restore it, and language
    // changes keep it because they replace only the query string. Hidden
    // chapters stay mounted (content-visibility + inert) so their state,
    // timers, listeners and in-progress animations are preserved.
    const sidebar = document.querySelector('.sidebar');
    const links = [...sidebar.querySelectorAll('nav a')];
    const chapters = links.map(link => document.getElementById(link.hash.slice(1)));
    const picker = document.getElementById('chapterToggle');
    const pickerLabel = document.getElementById('chapterCurrent');
    let active = null;
    const chapterFor = hash => chapters.find(chapter => '#' + chapter.id === hash) || null;

    // Close overlays through their own exits so nothing from the previous
    // chapter stays above the next one or keeps focus.
    function closeTransientLayers() {
      for (const dialog of document.querySelectorAll('dialog[open]')) {
        if (dialog.dispatchEvent(new Event('cancel', {cancelable: true}))) dialog.close();
      }
      const toast = document.getElementById('toast');
      if (toast && !toast.hidden && !toast.inert) document.getElementById('closeToast').click();
      // The examples' menus and command suggestions already close on an outside press.
      document.body.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));
    }
    function show(chapter) {
      if (!chapter || chapter === active) return false;
      if (active) closeTransientLayers();
      active = chapter;
      chapters.forEach(section => {
        const selected = section === chapter;
        section.toggleAttribute('data-active', selected);
        section.inert = !selected;
      });
      links.forEach((link, index) => {
        const selected = chapters[index] === chapter;
        link.classList.toggle('active', selected);
        if (selected) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      // A translated clone keeps the compact label in the current language.
      pickerLabel.replaceChildren(...DemoI18n.clone(links[chapters.indexOf(chapter)]).childNodes);
      return true;
    }
    function setPicker(open, restoreFocus = false) {
      sidebar.toggleAttribute('data-picker-open', open);
      picker.setAttribute('aria-expanded', String(open));
      if (restoreFocus) picker.focus({preventScroll: true});
    }
    function navigate(chapter) {
      // The selected link is about to be hidden in the compact picker.
      setPicker(false, picker.getAttribute('aria-expanded') === 'true'
        && links.includes(document.activeElement));
      const url = new URL(location.href);
      url.hash = chapter.id;
      if (url.href !== location.href) {
        try {
          // Reselecting the default chapter only names it in the URL.
          if (chapter === active) history.replaceState(history.state, '', url.href);
          else history.pushState(null, '', url.href);
        } catch {
          // Some file:// previews deny history changes; hashchange then shows it.
          location.hash = chapter.id;
          return;
        }
      }
      show(chapter);
      window.scrollTo({top: 0, behavior: 'instant'});
    }
    function followLocation() {
      const chapter = chapterFor(location.hash)
        || (!location.hash || location.hash === '#intro' ? chapters[0] : null);
      if (show(chapter)) window.scrollTo({top: 0, behavior: 'instant'});
    }
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.('a[href^="#"]');
      const chapter = link && chapterFor(link.hash);
      if (!chapter) return;
      event.preventDefault();
      navigate(chapter);
    });
    // Examples that move focus to another chapter (search results) reveal it first.
    document.addEventListener('demo-reveal', event => {
      const chapter = event.target.closest?.('.specimen');
      if (chapters.includes(chapter)) navigate(chapter);
    });
    window.addEventListener('popstate', followLocation);
    window.addEventListener('hashchange', followLocation);

    // Narrow layouts collapse the same navigation behind the current chapter.
    picker.addEventListener('click', () => setPicker(picker.getAttribute('aria-expanded') !== 'true'));
    sidebar.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || picker.getAttribute('aria-expanded') !== 'true') return;
      event.preventDefault();
      setPicker(false, true);
    });
    for (const eventName of ['pointerdown', 'focusin']) {
      document.addEventListener(eventName, event => {
        if (picker.getAttribute('aria-expanded') === 'true' && !sidebar.contains(event.target)) setPicker(false);
      });
    }
    matchMedia('(max-width: 850px)').addEventListener('change', () => setPicker(false));

    show(chapterFor(location.hash) || chapters[0]);
  });
})();
