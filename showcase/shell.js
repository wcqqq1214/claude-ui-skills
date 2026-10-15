'use strict';
// Showcase navigation and appearance; app.js initializes the component demonstrations.
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
    DemoI18n.onChange(() => { updateThemeControl(); updateLanguageControl(); queueScroll(); });
    const links = [...document.querySelectorAll('.sidebar nav a')];
    const sections = links.map(link => document.getElementById(link.hash.slice(1)));
    let active = null;
    // Keep the clicked item during anchor scrolling, then follow actual document
    // movement. Nested scrolling must neither change the selection nor lock it.
    let destination = null;
    let frame = 0;
    let settleTimer = 0;
    function select(section) {
      if (active === section) return;
      active = section;
      links.forEach((link, index) => {
        const selected = sections[index] === section;
        link.classList.toggle('active', selected);
        if (selected) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    function settleScroll() {
      clearTimeout(settleTimer);
      destination = null;
      queueScroll();
    }
    function waitForScrollEnd() {
      clearTimeout(settleTimer);
      // Also covers same-position anchors and browsers without scrollend.
      settleTimer = setTimeout(settleScroll, 180);
    }
    function followDestination(section) {
      destination = section;
      select(section);
      waitForScrollEnd();
    }
    function followHash() {
      followDestination(sections.find(section => '#' + section.id === location.hash) || null);
    }
    links.forEach((link, index) => link.addEventListener('click', event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      followDestination(sections[index]);
    }));
    function syncScroll() {
      frame = 0;
      if (destination) return;
      const anchorOffset = (parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0)
        + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
      const line = Math.max(document.querySelector('.topbar').getBoundingClientRect().bottom + 32, anchorOffset + 1);
      const positions = sections.map(section => ({section, top: section.getBoundingClientRect().top}));
      const page = document.scrollingElement;
      const atEnd = page.scrollTop > 0 && page.scrollTop + page.clientHeight >= page.scrollHeight - 1;
      const passed = positions.filter(item => item.top <= line);
      if (!atEnd && !passed.length) { select(null); return; }
      const rowTop = atEnd ? positions[positions.length - 1].top : Math.max(...passed.map(item => item.top));
      const row = positions.filter(item => Math.abs(item.top - rowTop) < 2);
      select(row.find(item => item.section === active)?.section || row[0].section);
    }
    function queueScroll() {
      if (!frame) frame = requestAnimationFrame(syncScroll);
    }
    document.addEventListener('scroll', event => {
      if (event.target !== document) return;
      if (destination) waitForScrollEnd();
      else queueScroll();
    }, {passive: true});
    document.addEventListener('scrollend', event => {
      if (event.target === document) settleScroll();
    });
    window.addEventListener('resize', queueScroll);
    window.addEventListener('hashchange', followHash);
    followHash();
    queueScroll();
  });
})();
