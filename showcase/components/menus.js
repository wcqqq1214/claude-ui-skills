'use strict';
function initMenusDemo() {
  bindEffortPopover();
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
  bindArtifactActions();
}

// Expand the artifact thumbnail into its action card.
function bindArtifactActions() {
  const host = $('#artifactActionsDemo'), trigger = $('#paletteOpen'),
    thumb = $('#paletteThumb'), card = $('#paletteCard'),
    actions = [...card.querySelectorAll('[data-palette-action]')];
  let focusFrame = null, pinned = false;
  function cancelFocus() {
    if (focusFrame !== null) cancelAnimationFrame(focusFrame);
    focusFrame = null;
  }
  function clearReturn() {
    thumb.removeAttribute('data-returning');
    thumb.style.removeProperty('--cp-thumb-from-x');
    thumb.style.removeProperty('--cp-thumb-from-y');
  }
  function close(restore = true, returning = true) {
    cancelFocus();
    const from = returning && !card.hidden && $('#menus').hasAttribute('data-active')
      ? card.getBoundingClientRect() : null;
    clearReturn();
    card.hidden = true;
    card.removeAttribute('data-opening');
    host.classList.remove('palette-open');
    trigger.setAttribute('aria-expanded', 'false');
    // The fixed artifact stays selected; only return when its thumbnail is ready.
    const picture = thumb.querySelector('img');
    if (from && picture.complete && picture.naturalWidth > 0) {
      const to = thumb.getBoundingClientRect();
      if (from.width > 0 && to.width > 0) {
        thumb.style.setProperty('--cp-thumb-from-x', from.left - to.left + 'px');
        thumb.style.setProperty('--cp-thumb-from-y', from.top - to.top + 'px');
        thumb.setAttribute('data-returning', '');
      }
    }
    if (restore) trigger.focus({preventScroll: true});
  }
  function open() {
    if (!card.hidden) return close();
    const from = thumb.getBoundingClientRect();
    clearReturn();
    host.classList.add('palette-open');
    card.hidden = false;
    const to = card.getBoundingClientRect();
    card.style.setProperty('--cp-card-from-x', from.left - to.left + 'px');
    card.style.setProperty('--cp-card-from-y', from.top - to.top + 'px');
    trigger.setAttribute('aria-expanded', 'true');
    card.setAttribute('data-opening', '');
    cancelFocus();
    focusFrame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(() => {
        focusFrame = null;
        if (!card.hidden && document.activeElement === trigger)
          actions[0].focus({preventScroll: true});
      });
    });
  }
  function dismissWithKey(e) {
    if (card.hidden || !(e.key === 'Escape' || e.key === 'ArrowLeft' ||
      (e.key === 'Enter' && e.altKey && !e.metaKey && !e.shiftKey))) return false;
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) close();
    return true;
  }
  trigger.onclick = open;
  trigger.onkeydown = e => {
    if (dismissWithKey(e)) return;
    if (e.key === 'Enter' && e.altKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      if (!e.repeat) open();
    }
  };
  actions.forEach(button => {
    button.onclick = () => {
      const label = button.dataset.paletteAction === 'Pin' ? (pinned ? 'Unpin' : 'Pin') : button.dataset.paletteAction;
      if (button.dataset.paletteAction === 'Pin') {
        pinned = !pinned;
        DemoI18n.text($('#palettePinLabel'), () => DemoI18n.t(pinned ? 'Unpin' : 'Pin'));
      }
      // These controls never open a file, copy a real link or change an account.
      DemoI18n.text($('#paletteStatus'), () => DemoI18n.t('Demo action: {0}', DemoI18n.t(label)));
      close();
    };
  });
  card.onkeydown = e => {
    if (e.key === 'Enter' && e.repeat) { e.preventDefault(); return; }
    if (dismissWithKey(e)) return;
    if (e.altKey || e.metaKey || e.ctrlKey || e.repeat) return;
    const digit = /^[1-3]$/.test(e.key) ? Number(e.key) - 1 : -1;
    if (digit >= 0) { e.preventDefault(); actions[digit].click(); return; }
    const index = actions.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? actions.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : actions.length - 1)) % actions.length;
      actions[next].focus({preventScroll: true});
    }
  };
  thumb.addEventListener('animationend', e => {
    if (e.target === thumb && e.animationName === 'palette-thumb-return') clearReturn();
  });
  card.querySelector('.palette-actions').addEventListener('animationend', e => {
    if (e.target === e.currentTarget) card.removeAttribute('data-opening');
  });
  document.addEventListener('pointerdown', e => {
    if (!card.hidden && !host.contains(e.target)) close(false);
  });
  document.addEventListener('focusin', e => {
    if (!card.hidden && !host.contains(e.target)) close(false);
  });
  new MutationObserver(() => {
    if (!$('#menus').hasAttribute('data-active')) close(false, false);
  }).observe($('#menus'), {attributes: true, attributeFilter: ['data-active']});
  window.addEventListener('pagehide', () => close(false, false));
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

function bindEffortPopover() {
  const trigger = $('#effortPopoverTrigger'), popup = $('#effortPopover'),
    input = $('#effortPopoverRange'), track = $('#effortPopoverTrack'),
    label = $('#effortAnimatedLabel'), valueLabel = $('#effortPopoverValue'),
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Reuse the existing menu's four local sample labels; no model catalog or settings writes.
  const options = ['Low', 'Medium', 'High', 'Max'];
  let committed = 2, preview = 2, currentWord = null, press = null, outsidePress = false;
  function clearWords() {
    for (const animation of label.getAnimations({subtree: true})) animation.cancel();
    label.replaceChildren();
    currentWord = null;
  }
  function showLabel(index, animate = true) {
    const direction = index > preview ? 1 : -1;
    const changed = index !== preview;
    preview = index;
    if (!animate || reduced.matches || !currentWord) {
      clearWords();
      currentWord = document.createElement('span');
      currentWord.className = 'effort-label-word';
      [0, .5, 1, 2].forEach((radius, i) => {
        const layer = document.createElement('span');
        layer.className = 'effort-label-layer';
        layer.textContent = options[index];
        layer.style.opacity = i === 0 ? '1' : '0';
        if (radius) layer.style.filter = `blur(${radius}px)`;
        currentWord.append(layer);
      });
      label.append(currentWord);
      return;
    }
    if (!changed) return;
    const old = currentWord;
    old.dataset.exiting = '';
    const exit = old.animate([
      {transform: getComputedStyle(old).transform, opacity: getComputedStyle(old).opacity},
      {transform: `translateY(${-direction * .55}em)`, opacity: 0}
    ], {duration: 200, easing: 'ease-out', fill: 'forwards'});
    [...old.children].forEach((layer, i) => layer.animate(
      [{opacity: getComputedStyle(layer).opacity}, {opacity: i === 3 ? 1 : 0}],
      {duration: 200, easing: 'ease-out', fill: 'forwards'}
    ));
    exit.finished.then(() => {
      for (const animation of old.getAnimations({subtree: true})) animation.cancel();
      old.remove();
    }, () => {});
    const word = document.createElement('span');
    word.className = 'effort-label-word';
    currentWord = word;
    label.append(word);
    const opacities = [[0, 0, 0, 1], [0, 0, 1, 0], [0, 1, 0, 0], [1, 0, 0, 0]];
    [0, .5, 1, 2].forEach((radius, i) => {
      const layer = document.createElement('span');
      layer.className = 'effort-label-layer';
      layer.textContent = options[index];
      if (radius) layer.style.filter = `blur(${radius}px)`;
      word.append(layer);
      layer.animate(opacities[i].map((opacity, j) => ({
        opacity, offset: [0, .342, .563, 1][j], easing: j === 2 ? 'ease-out' : 'linear'
      })), {duration: 200, fill: 'forwards'});
    });
    word.animate([
      {transform: `translateY(${direction * .55}em)`, opacity: 0},
      {transform: 'translateY(0em)', opacity: 1}
    ], {duration: 200, easing: 'ease-out', fill: 'forwards'});
  }
  function render(index, animate = true) {
    showLabel(index, animate);
    input.value = String(index);
    input.setAttribute('aria-valuetext', options[index]);
    track.style.setProperty('--pos', String(index / (options.length - 1)));
  }
  function commit() {
    committed = preview;
    valueLabel.textContent = options[committed];
    DemoI18n.attr(trigger, 'aria-label', () => DemoI18n.t('Effort: {0}', options[committed]));
  }
  function release() {
    const previous = press;
    press = null;
    if (previous && track.hasPointerCapture(previous.id)) track.releasePointerCapture(previous.id);
    track.classList.remove('dragging');
    track.style.removeProperty('--lean');
  }
  function close(restore = true) {
    release();
    outsidePress = false;
    render(committed, false);
    if (popup.open) popup.close();
    trigger.setAttribute('aria-expanded', 'false');
    if (restore) trigger.focus({preventScroll: true});
  }
  function position() {
    if (!popup.open) return;
    const rect = trigger.getBoundingClientRect(), width = popup.offsetWidth, height = popup.offsetHeight;
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
    const right = left + (viewport?.width ?? innerWidth), bottom = top + (viewport?.height ?? innerHeight);
    popup.style.left = Math.max(left + 8, Math.min(rect.left + (rect.width - width) / 2, right - width - 8)) + 'px';
    popup.style.top = Math.max(top + 8, Math.min(rect.bottom + 6 + height <= bottom - 8
      ? rect.bottom + 6 : rect.top - height - 6, bottom - height - 8)) + 'px';
  }
  trigger.onclick = event => {
    if (popup.open) return close();
    render(committed, false);
    popup.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    position();
    // EffortControl initially focuses the popup for pointers, the slider for keyboard.
    (event.detail === 0 ? input : popup).focus({preventScroll: true});
  };
  popup.addEventListener('cancel', event => { event.preventDefault(); close(); });
  const outside = event => {
    const rect = popup.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  popup.addEventListener('pointerdown', event => { outsidePress = event.target === popup && outside(event); });
  popup.addEventListener('click', event => {
    if (outsidePress && event.target === popup && outside(event)) close();
    outsidePress = false;
  });
  function movePointer(event) {
    if (!press || press.id !== event.pointerId) return;
    const rect = track.querySelector('.range-carriage').getBoundingClientRect();
    if (rect.width <= 0) return;
    const fraction = Math.max(0, Math.min(1, (event.clientX - press.offset - rect.left) / rect.width));
    render(Math.round(fraction * (options.length - 1)));
    const distance = (fraction - preview / (options.length - 1)) * (options.length - 1);
    const lean = reduced.matches ? 0 : Math.round(Math.sign(distance) * Math.min(.12 * (1 - Math.exp(-Math.abs(distance) / .12)), .48) * rect.width / (options.length - 1) / .5) * .5;
    track.style.setProperty('--lean', lean + 'px');
  }
  track.addEventListener('pointerdown', event => {
    if (event.button !== 0 || press) return;
    event.preventDefault();
    const rect = track.querySelector('.range-carriage').getBoundingClientRect();
    const delta = event.clientX - (rect.left + preview / (options.length - 1) * rect.width);
    const handleWidth = track.querySelector('.range-thumb').getBoundingClientRect().width;
    press = {id: event.pointerId, offset: Math.abs(delta) <= .7 * handleWidth / 2 ? delta : 0};
    track.setPointerCapture(event.pointerId);
    track.classList.add('dragging');
    input.focus({preventScroll: true});
    movePointer(event);
  });
  track.addEventListener('pointermove', event => {
    if (press && event.buttons === 0) { release(); render(committed, false); return; }
    movePointer(event);
  });
  track.addEventListener('pointerup', event => {
    if (press?.id !== event.pointerId) return;
    commit();
    release();
  });
  const cancelPress = event => {
    if (press?.id !== event.pointerId) return;
    release();
    render(committed, false);
  };
  track.addEventListener('pointercancel', cancelPress);
  track.addEventListener('lostpointercapture', cancelPress);
  input.addEventListener('keydown', event => {
    let next;
    const step = event.shiftKey ? 10 : 1;
    if (['ArrowUp', 'ArrowRight'].includes(event.key)) next = preview + step;
    else if (['ArrowDown', 'ArrowLeft'].includes(event.key)) next = preview - step;
    else if (event.key === 'PageUp') next = preview + 10;
    else if (event.key === 'PageDown') next = preview - 10;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else return;
    event.preventDefault();
    event.stopPropagation();
    release();
    render(Math.max(0, Math.min(options.length - 1, next)));
    commit();
  });
  input.addEventListener('input', () => { if (!press) { render(Number(input.value)); commit(); } });
  new MutationObserver(() => {
    if (!$('#menus').hasAttribute('data-active')) close(false);
  }).observe($('#menus'), {attributes: true, attributeFilter: ['data-active']});
  reduced.addEventListener('change', () => { render(preview, false); track.style.removeProperty('--lean'); });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);
  window.visualViewport?.addEventListener('resize', position);
  window.visualViewport?.addEventListener('scroll', position);
  window.addEventListener('pagehide', () => close(false));
  DemoI18n.onChange(position);
  render(committed, false);
  commit();
}
