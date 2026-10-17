'use strict';
function initModesDemo() {
  initPinnedDemo();
  // Sidebar pills: container-query folding and independent focus/selection.
  const modeTrack = $('#modeTrack'),
    modeButtons = [...modeTrack.querySelectorAll('button')];
  let selectedMode = modeButtons[0];
  const codeMode = modeButtons.find(button => button.dataset.mode === 'Code');
  const indicator = codeMode.querySelector('.mode-activity-indicator');
  // Fixed running sample; suppress attention in the current mode.
  function updateCodeActivity() {
    codeMode.setAttribute('aria-label', selectedMode === codeMode ? 'Code' : DemoI18n.t('{0}, working', 'Code'));
    if (selectedMode === codeMode) indicator.replaceChildren();
    else if (!indicator.firstChild) {
      const dot = document.createElement('span');
      dot.className = 'mode-running';
      indicator.append(dot);
    }
  }
  indicator.addEventListener('animationstart', event => {
    const target = event.target;
    if (typeof target.getAnimations !== 'function') return;
    const origin = target.ownerDocument.defaultView?.performance.timeOrigin ?? performance.timeOrigin;
    for (const animation of target.getAnimations()) {
      const timing = animation.effect?.getTiming();
      if (timing?.iterations === Infinity && typeof timing.duration === 'number' && timing.duration > 0)
        animation.startTime = -(origin % timing.duration);
    }
  });
  function visibleModes() {
    return modeButtons.filter((b) => !b.hidden);
  }
  function positionMode(animate = false) {
    const thumb = modeTrack.querySelector('.mode-thumb'),
      left = selectedMode.offsetLeft,
      width = selectedMode.offsetWidth,
      at = `${left},${width}`;
    if (thumb.dataset.at === at) return;
    if (animate) {
      thumb.removeAttribute('data-snap');
      void thumb.offsetWidth;
    } else thumb.setAttribute('data-snap', '');
    thumb.style.width = width + 'px';
    thumb.style.transform = `translateX(${left}px)`;
    thumb.dataset.at = at;
  }
  function chooseMode(b) {
    selectedMode = b;
    modeButtons.forEach((x) => {
      if (x === b) x.setAttribute('aria-current', 'page');
      else x.removeAttribute('aria-current');
    });
    DemoI18n.text($('#modeSelection'), () =>
      DemoI18n.t('Selected {0} · Arrows move focus only', b.dataset.mode)
    );
    updateCodeActivity();
    positionMode(true);
  }
  modeButtons.forEach((b) => {
    b.setAttribute('aria-label', b.dataset.mode);
    b.onclick = () => chooseMode(b);
    b.onkeydown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const options = visibleModes(),
        i = options.indexOf(b);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const rtl = getComputedStyle(modeTrack).direction === 'rtl';
        const forward = e.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
        const next = options[(i + (forward ? 1 : options.length - 1)) % options.length];
        next.focus();
      }
    };
  });
  DemoI18n.attr(codeMode, 'aria-label', () => selectedMode === codeMode ? 'Code' : DemoI18n.t('{0}, working', 'Code'));
  updateCodeActivity();
  $('#modeWidth').oninput = (e) => {
    $('#modeContainer').style.width = e.target.value + 'px';
    $('#modeWidthOutput').textContent = e.target.value + ' px';
  };
  $('#modeCount').onclick = () => {
    const two = !modeTrack.classList.contains('two');
    modeTrack.classList.toggle('two', two);
    modeButtons[1].hidden = two;
    if (selectedMode.hidden) chooseMode(modeButtons[0]);
    DemoI18n.text($('#modeCount'), () =>
      two ? DemoI18n.t('Show 3 items') : DemoI18n.t('Show 2 items')
    );
    positionMode();
  };
  new ResizeObserver(() => positionMode()).observe(modeTrack);
  modeButtons.forEach((b) => new ResizeObserver(() => positionMode()).observe(b));
}

function initPinnedDemo() {
  const list = $('#pinnedList'), stage = $('#pinnedStage'), menu = $('#pinnedMenu');
  const initialRows = [...list.children];
  const actions = [...menu.querySelectorAll('[data-move]')];
  let menuRow = null, drag = null, suppressClick = false;
  const rows = () => [...list.children];
  const main = row => row.querySelector('.pinned-main');
  const more = row => row.querySelector('.pinned-more');
  const rtl = () => getComputedStyle(stage).direction === 'rtl';
  document.body.append(menu);
  const visibleActions = () => actions.filter(action => !action.hidden);
  function highlight(action) {
    actions.forEach(item => item.toggleAttribute('data-highlighted', item === action));
  }
  function positionMenu() {
    if (!menuRow) return;
    const anchor = more(menuRow).getBoundingClientRect(), padding = 5, offset = 6;
    const width = document.documentElement.clientWidth, height = document.documentElement.clientHeight;
    menu.dir = rtl() ? 'rtl' : 'ltr';
    menu.style.removeProperty('--pin-menu-available-height');
    const box = menu.getBoundingClientRect();
    const below = height - padding - anchor.bottom - offset, above = anchor.top - offset - padding;
    const top = box.height > below && above > below;
    const available = Math.max(0, top ? above : below);
    menu.style.setProperty('--pin-menu-available-height', available + 'px');
    const x = rtl() ? anchor.left : anchor.right - box.width;
    const y = top ? anchor.top - offset - Math.min(box.height, available) : anchor.bottom + offset;
    const ratio = window.devicePixelRatio || 1, snap = value => Math.round(value * ratio) / ratio;
    menu.style.left = snap(Math.max(padding, Math.min(x, width - padding - box.width))) + 'px';
    menu.style.top = snap(Math.max(padding, y)) + 'px';
    menu.dataset.side = top ? 'top' : 'bottom';
  }
  new ResizeObserver(positionMenu).observe(menu);
  DemoI18n.onChange(positionMenu);
  function tabStop(row) {
    initialRows.forEach(item => { main(item).tabIndex = item === row ? 0 : -1; });
  }
  tabStop(initialRows[0]);
  function measureTitles() {
    for (const row of initialRows) {
      const title = row.querySelector('.pinned-title');
      if (title.clientWidth) title.toggleAttribute('data-overflow', title.firstElementChild.scrollWidth > title.clientWidth);
    }
  }
  new ResizeObserver(measureTitles).observe(stage);
  DemoI18n.onChange(measureTitles);
  list.addEventListener('focusin', event => {
    const row = event.target.closest('.pinned-row');
    if (row) tabStop(row);
  });
  list.addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
    const row = event.target.closest('.pinned-row');
    if (!row) return;
    const ordered = rows(), index = ordered.indexOf(row);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? ordered.length - 1 :
        (index + (event.key === 'ArrowDown' ? 1 : ordered.length - 1)) % ordered.length;
      main(ordered[next]).focus();
      main(ordered[next]).scrollIntoView({block: 'nearest'});
    } else if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const towardMenu = event.key === (rtl() ? 'ArrowLeft' : 'ArrowRight');
      const next = towardMenu ? more(row) : main(row);
      if (next !== document.activeElement) { event.preventDefault(); next.focus(); }
    }
  });
  function announce(message, ...args) {
    DemoI18n.text($('#pinnedStatus'), () => DemoI18n.t(message, ...args.map(a =>
      typeof a === 'function' ? a() : a)));
  }
  function closeMenu(restore = false) {
    const trigger = menuRow && more(menuRow);
    menuRow?.removeAttribute('data-menu-open');
    menuRow = null;
    menu.hidden = true;
    highlight(null);
    trigger?.setAttribute('aria-expanded', 'false');
    if (restore) trigger?.focus({preventScroll: true});
  }
  function moveRow(row, index) {
    const ordered = rows().filter(item => item !== row);
    list.insertBefore(row, ordered[index] || null);
    announce('{0} moved to position {1} of {2}',
      () => row.querySelector('.pinned-title').textContent, index + 1, initialRows.length);
  }
  function openMenu(row, keyboard = false) {
    finish(false);
    if (menuRow === row) return closeMenu(true);
    closeMenu();
    menuRow = row;
    row.setAttribute('data-menu-open', '');
    const index = rows().indexOf(row);
    actions[0].hidden = index === 0;
    actions[1].hidden = index === initialRows.length - 1;
    more(row).setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    menu.querySelector('.pinned-menu-scroll').scrollTop = 0;
    positionMenu();
    (keyboard ? visibleActions()[0] : menu).focus({preventScroll: true});
  }
  initialRows.forEach(row => {
    main(row).onclick = () => {
      initialRows.forEach(item => {
        item.toggleAttribute('data-selected', item === row);
        if (item === row) main(item).setAttribute('aria-current', 'page');
        else main(item).removeAttribute('aria-current');
      });
    };
    more(row).onclick = event => openMenu(row, event.detail === 0);
    more(row).onkeydown = event => {
      if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault();
    };
  });
  actions.forEach(action => {
    action.onfocus = () => highlight(action);
    action.onpointermove = event => {
      if (event.pointerType !== 'touch' && !event.buttons && document.activeElement !== action) action.focus({preventScroll: true});
    };
    action.onclick = () => {
      if (!menuRow || action.hidden) return;
      const row = menuRow, index = rows().indexOf(row) + Number(action.dataset.move);
      closeMenu();
      moveRow(row, index);
      main(row).focus({preventScroll: true});
    };
  });
  menu.onpointerleave = event => {
    if (event.pointerType !== 'touch' && menuRow) { highlight(null); menu.focus({preventScroll: true}); }
  };
  menu.onpointermove = event => {
    if (!event.target.closest('[data-move]') && !event.buttons) menu.onpointerleave(event);
  };
  menu.onkeydown = event => {
    if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault();
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
    } else if (event.key === 'Tab') closeMenu(true);
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const visible = visibleActions(), index = visible.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? visible.length - 1 :
        index < 0 ? (event.key === 'ArrowDown' ? 0 : visible.length - 1) :
          (index + (event.key === 'ArrowDown' ? 1 : visible.length - 1)) % visible.length;
      visible[next].focus();
    }
  };
  document.addEventListener('pointerdown', event => {
    suppressClick = false;
    if (!menu.contains(event.target) && !(menuRow && more(menuRow).contains(event.target))) closeMenu();
  }, true);
  document.addEventListener('focusin', event => {
    if (menuRow && !menu.contains(event.target) && !menuRow.contains(event.target)) closeMenu();
  });
  stage.addEventListener('click', event => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  function finish(commit = false) {
    if (!drag) return;
    const state = drag;
    drag = null;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    cancelAnimationFrame(state.frame);
    clearTimeout(state.releaseTimer);
    state.ghost?.remove();
    list.removeAttribute('data-pin-dragging');
    document.documentElement.classList.remove('pinned-dragging');
    initialRows.forEach(row => { row.style.transform = ''; row.style.visibility = ''; });
    if (state.row.hasPointerCapture(state.id)) state.row.releasePointerCapture(state.id);
    if (!state.ghost) return;
    suppressClick = true;
    if (commit && state.to !== state.from) moveRow(state.row, state.to);
    else if (!commit) announce('Move cancelled');
  }
  function onMove(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (!event.buttons || drag.releaseTimer) {
      drag.releaseTimer ||= setTimeout(() => finish(true), 200);
      return;
    }
    drag.pointerX = event.clientX;
    drag.pointerY = event.clientY;
    if (!drag.ghost) {
      if (Math.abs(event.clientX - drag.x) < 4 && Math.abs(event.clientY - drag.y) < 4) return;
      drag.ordered = rows();
      drag.boxes = drag.ordered.map(row => row.getBoundingClientRect());
      drag.bounds = list.getBoundingClientRect();
      const box = drag.boxes[drag.from];
      drag.dx = Math.min(Math.max(event.clientX - box.left, 4), box.width - 4);
      drag.dy = Math.min(Math.max(event.clientY - box.top, 2), Math.min(box.height, 26) - 2);
      const clone = drag.row.cloneNode(true);
      clone.removeAttribute('data-pin');
      clone.removeAttribute('style');
      clone.querySelectorAll('[id], [aria-controls]').forEach(e => {
        e.removeAttribute('id'); e.removeAttribute('aria-controls');
      });
      const ghost = document.createElement('div'), surface = document.createElement('div');
      ghost.className = 'pinned-ghost';
      ghost.inert = true;
      ghost.setAttribute('aria-hidden', 'true');
      surface.className = 'pinned-ghost-surface';
      surface.style.cssText = `left:${-drag.dx}px;top:${-drag.dy}px;width:${box.width}px;height:${box.height}px;transform-origin:${drag.dx}px ${drag.dy}px`;
      surface.append(clone);
      ghost.append(surface);
      stage.append(ghost);
      drag.ghost = ghost;
      drag.step = parseFloat(getComputedStyle(stage).getPropertyValue('--pin-row-h')) +
        parseFloat(getComputedStyle(stage).getPropertyValue('--pin-row-gap'));
      const paint = () => {
        if (!drag || drag.ghost !== ghost) return;
        ghost.style.transform = `translate(${drag.pointerX}px, ${drag.pointerY}px)`;
        drag.frame = requestAnimationFrame(paint);
      };
      paint();
      drag.row.style.visibility = 'hidden';
      list.setAttribute('data-pin-dragging', '');
      document.documentElement.classList.add('pinned-dragging');
      drag.row.setPointerCapture(event.pointerId);
      return;
    }
    event.preventDefault();
    let slot = drag.boxes.findIndex(box => event.clientY < box.top + box.height / 2);
    if (slot < 0) slot = drag.boxes.length;
    drag.to = slot > drag.from ? slot - 1 : slot;
    if (rtl() ? event.clientX < drag.bounds.left : event.clientX > drag.bounds.right) drag.to = drag.from;
    drag.ordered.forEach((row, index) => {
      const target = index === drag.from ? index :
        index > drag.from && index <= drag.to ? index - 1 :
        index < drag.from && index >= drag.to ? index + 1 : index;
      row.style.transform = `translateY(${(target - index) * drag.step}px)`;
    });
  }
  function onUp(event) {
    if (event.pointerId !== drag?.id) return;
    const current = list.getBoundingClientRect(), before = drag.bounds;
    const stable = !before || ['x', 'y', 'width', 'height'].every(key => current[key] === before[key]);
    finish(stable);
  }
  function onCancel(event) { if (event.pointerId === drag?.id) finish(false); }
  list.onpointerdown = event => {
    if (drag || event.button !== 0 || !event.isPrimary || event.target.closest('.pinned-more')) return;
    const row = event.target.closest('.pinned-row');
    if (!row) return;
    closeMenu();
    drag = {row, id: event.pointerId, x: event.clientX, y: event.clientY,
      from: rows().indexOf(row), to: rows().indexOf(row)};
    document.addEventListener('pointermove', onMove, {passive: false});
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
  };
  list.addEventListener('lostpointercapture', event => {
    if (event.target === drag?.row) onCancel(event);
  });
  document.addEventListener('keydown', event => {
    if (!event.repeat) suppressClick = false;
    if (event.key === 'Escape' && drag && !event.isComposing && !event.defaultPrevented) {
      event.preventDefault();
      event.stopImmediatePropagation();
      finish(false);
    }
  }, true);
  function dismiss() { finish(false); closeMenu(); }
  window.addEventListener('blur', dismiss);
  window.addEventListener('resize', () => { finish(false); positionMenu(); });
  document.addEventListener('scroll', event => {
    if (menu.contains(event.target)) return;
    finish(false);
    positionMenu();
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) dismiss(); });
  window.addEventListener('pagehide', dismiss);
  new MutationObserver(() => {
    if (!$('#modes').hasAttribute('data-active')) dismiss();
  }).observe($('#modes'), {attributes: true, attributeFilter: ['data-active']});
  $('#resetPinned').onclick = () => {
    dismiss();
    list.append(...initialRows);
    initialRows.forEach(row => { row.removeAttribute('data-selected'); main(row).removeAttribute('aria-current'); });
    tabStop(initialRows[0]);
    announce('Order restored');
  };
}
