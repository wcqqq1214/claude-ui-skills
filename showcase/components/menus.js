'use strict';
function initMenusDemo() {
  // Parent/submenu ownership: arrows preview, native click/Enter commits.
  const modelButton = $('#modelMenuButton'),
    modelMenu = $('#modelMenu'),
    effortButton = $('#effortMenuButton'),
    effortMenu = $('#effortMenu');
  let committedEffort = 'High';
  function closeEffort() {
    effortMenu.hidden = true;
    effortButton.setAttribute('aria-expanded', 'false');
  }
  function closeModel(restore = false) {
    closeEffort();
    modelMenu.hidden = true;
    modelButton.setAttribute('aria-expanded', 'false');
    if (restore) modelButton.focus();
  }
  modelButton.onclick = () => {
    if (!modelMenu.hidden) return closeModel(true);
    modelMenu.hidden = false;
    modelButton.setAttribute('aria-expanded', 'true');
    effortButton.focus();
  };
  function openEffort() {
    effortMenu.hidden = false;
    effortButton.setAttribute('aria-expanded', 'true');
    effortMenu.querySelector(`[data-effort="${committedEffort}"]`).focus();
  }
  effortButton.onclick = openEffort;
  effortButton.onkeydown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      openEffort();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeModel(true);
    }
  };
  const effortOptions = [...effortMenu.querySelectorAll('[data-effort]')];
  effortOptions.forEach((b, i) => {
    b.onfocus = () => {
      DemoI18n.text($('#effortPreview'), () =>
        DemoI18n.t('Focus preview: {0} · Selected: {1}', b.dataset.effort, committedEffort)
      );
    };
    b.onclick = () => {
      committedEffort = b.dataset.effort;
      effortOptions.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      $('#effortCommitted').textContent = committedEffort + ' ›';
      DemoI18n.text($('#effortSelection'), () =>
        DemoI18n.t('Selected: {0}', committedEffort)
      );
      closeModel(true);
    };
    b.onkeydown = (e) => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        const next =
          e.key === 'Home' ? 0 : e.key === 'End' ? 3 : (i + (e.key === 'ArrowDown' ? 1 : 3)) % 4;
        effortOptions[next].focus();
      } else if (e.key === 'Escape' || e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        closeEffort();
        effortButton.focus();
      }
    };
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.menu-demo')) closeModel();
  });
  document.addEventListener('focusin', (e) => {
    if (!e.target.closest('.menu-demo')) closeModel();
  });
  // Fixed rows in this example are a local adaptation of settings row lookup.
  const searchData = [
    { group: 'Interface', name: 'Appearance', target: 'searchAppearance' },
    { group: 'Interface', name: 'Language', target: 'searchLanguage' },
    { group: 'Updates', name: 'Notifications', target: 'searchNotifications' }
  ];
  let cancelSearchHighlight = () => {};
  function renderSearch() {
    const query = $('#groupSearch').value,
      q = query.trim().toLocaleLowerCase(DemoI18n.locale),
      host = $('#searchResults');
    host.replaceChildren();
    const rows = searchData.filter((x) =>
      DemoI18n.t(x.name).toLocaleLowerCase(DemoI18n.locale).includes(q)
    );
    let group = '';
    rows.forEach((x) => {
      if (query === '' && group !== x.group) {
        const h = document.createElement('h4');
        DemoI18n.text(h, () => DemoI18n.t(x.group));
        host.append(h);
        group = x.group;
      }
      const b = document.createElement('button');
      DemoI18n.text(b, () => DemoI18n.t(x.name));
      b.onclick = () => {
        cancelSearchHighlight();
        $('#groupSearch').value = '';
        renderSearch();
        const row = $(`#${x.target}`);
        const title = row.querySelector('.search-target-title');
        // Keep keyboard navigation at the destination without adding another scroll.
        title.focus({ preventScroll: true });
        cancelSearchHighlight = highlightSearchTarget(row, title);
      };
      host.append(b);
    });
    if (!rows.length) {
      const p = document.createElement('p');
      DemoI18n.text(p, () => DemoI18n.t('No matching settings'));
      p.setAttribute('role', 'status');
      host.append(p);
    }
  }
  const search = $('#groupSearch');
  search.oninput = renderSearch;
  DemoI18n.onChange(renderSearch);
  window.addEventListener('pagehide', () => cancelSearchHighlight());
  renderSearch();
  let paletteFocusFrame = null;
  function cancelPaletteFocus() {
    if (paletteFocusFrame !== null) cancelAnimationFrame(paletteFocusFrame);
    paletteFocusFrame = null;
  }
  const paletteCard = $('#paletteCard'),
    paletteActions = paletteCard.querySelector('.palette-actions');
  paletteActions.addEventListener('animationend', (e) => {
    if (e.target === paletteActions) paletteCard.removeAttribute('data-opening');
  });
  $('#paletteOpen').onclick = () => {
    const card = paletteCard,
      trigger = $('#paletteOpen');
    if (!card.hidden) return;
    const from = trigger.getBoundingClientRect();
    card.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const to = card.getBoundingClientRect();
    card.style.setProperty('--cp-card-from-x', from.left - to.left + 'px');
    card.style.setProperty('--cp-card-from-y', from.top - to.top + 'px');
    card.setAttribute('data-opening', '');
    cancelPaletteFocus();
    paletteFocusFrame = requestAnimationFrame(() => {
      paletteFocusFrame = requestAnimationFrame(() => {
        paletteFocusFrame = null;
        if (!card.hidden && document.activeElement === trigger)
          $('#paletteClose').focus({ preventScroll: true });
      });
    });
  };
  $('#paletteClose').onclick = () => {
    cancelPaletteFocus();
    paletteCard.hidden = true;
    paletteCard.removeAttribute('data-opening');
    $('#paletteOpen').setAttribute('aria-expanded', 'false');
    $('#paletteOpen').focus();
  };
}

// Destination highlight: settle scroll, draw/wash, then clean up.
// The demo owns fixed local rows; no settings search or deferred row mounting.
function highlightSearchTarget(row, title) {
  function containers() {
    const scrollers = [],
      clipped = [];
    for (let parent = title.parentElement; parent; parent = parent.parentElement) {
      const { overflowY, position } = getComputedStyle(parent);
      const root = parent === document.scrollingElement;
      if (
        (root
          ? overflowY !== 'hidden' && overflowY !== 'clip'
          : overflowY === 'auto' || overflowY === 'scroll') &&
        parent.scrollHeight > parent.clientHeight
      )
        scrollers.push(parent);
      else if (overflowY === 'hidden' && !root && parent !== document.body) clipped.push(parent);
      if (position === 'fixed') break;
    }
    return { scrollers, clipped };
  }
  function viewport(scroller) {
    const top =
      scroller === document.scrollingElement
        ? 0
        : scroller.getBoundingClientRect().top + scroller.clientTop;
    return { top, bottom: top + scroller.clientHeight };
  }
  function center(behavior) {
    if (!title.getClientRects().length) return;
    const { scrollers, clipped } = containers();
    clipped.forEach((element) => {
      element.scrollTop = 0;
    });
    const bounds = title.getBoundingClientRect();
    let middle = (bounds.top + bounds.bottom) / 2;
    for (const scroller of scrollers) {
      const view = viewport(scroller);
      const top = Math.max(
        0,
        Math.min(
          scroller.scrollTop + middle - (view.top + view.bottom) / 2,
          scroller.scrollHeight - scroller.clientHeight
        )
      );
      middle -= top - scroller.scrollTop;
      scroller.scrollTo({ top, behavior });
    }
  }
  center('smooth');
  let stopped = false,
    frame,
    timeout,
    interacted = false;
  const markInteraction = () => {
    interacted = true;
  };
  const events = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  const arm = setTimeout(() => {
    if (!stopped)
      events.forEach((event) =>
        window.addEventListener(event, markInteraction, { once: true, passive: true })
      );
  }, 0);
  function cleanup() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    clearTimeout(timeout);
    clearTimeout(arm);
    events.forEach((event) => window.removeEventListener(event, markInteraction));
    title.classList.remove('feature-anchor-highlight');
    row.classList.remove('feature-anchor-row-fill');
    title.removeEventListener('animationend', onEnd);
  }
  function onEnd(event) {
    if (
      event.target === title &&
      ['feature-anchor-highlight-underline', 'feature-anchor-highlight-underline-rtl'].includes(
        event.animationName
      )
    )
      cleanup();
  }
  const start = performance.now();
  let previousTop,
    stableFrames = 0;
  function settle() {
    if (!title.isConnected) return cleanup();
    const { scrollers, clipped } = containers();
    clipped.forEach((element) => {
      element.scrollTop = 0;
    });
    const elapsed = performance.now() - start;
    const { top } = title.getBoundingClientRect();
    stableFrames =
      previousTop !== undefined && Math.abs(top - previousTop) < 0.5 ? stableFrames + 1 : 0;
    previousTop = top;
    if ((elapsed >= 250 && stableFrames >= 3) || elapsed >= 1500) {
      if (!interacted) {
        const bounds = title.getBoundingClientRect();
        const view = scrollers.length ? viewport(scrollers[0]) : { top: 0, bottom: innerHeight };
        if (
          Math.abs((bounds.top + bounds.bottom) / 2 - (view.top + view.bottom) / 2) >
          (view.bottom - view.top) / 4
        )
          center('instant');
      }
      title.classList.add('feature-anchor-highlight');
      row.classList.add('feature-anchor-row-fill');
      title.addEventListener('animationend', onEnd);
      timeout = setTimeout(cleanup, 2050);
    } else frame = requestAnimationFrame(settle);
  }
  frame = requestAnimationFrame(settle);
  return cleanup;
}
