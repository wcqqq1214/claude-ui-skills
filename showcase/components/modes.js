'use strict';
function initModesDemo() {
  initPinnedDemo();
  // Sidebar pills: container-query folding and independent focus/selection.
  const modeTrack = $('#modeTrack'),
    modeButtons = [...modeTrack.querySelectorAll('button')];
  let selectedMode = modeButtons[0];
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
        const next =
          options[(i + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length];
        next.focus();
      }
    };
  });
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
  function announce(message, ...args) {
    DemoI18n.text($('#pinnedStatus'), () => DemoI18n.t(message, ...args.map(a =>
      typeof a === 'function' ? a() : a)));
  }
  function closeMenu(restore = false) {
    const trigger = menuRow?.querySelector('button');
    menuRow = null;
    menu.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
    if (restore) trigger?.focus({preventScroll: true});
  }
  function moveRow(row, index) {
    const ordered = rows().filter(item => item !== row);
    list.insertBefore(row, ordered[index] || null);
    announce('{0} moved to position {1} of {2}',
      () => row.querySelector('.pinned-title').textContent, index + 1, initialRows.length);
  }
  function openMenu(row, last = false) {
    if (menuRow === row) return closeMenu(true);
    closeMenu();
    menuRow = row;
    const index = rows().indexOf(row);
    actions[0].hidden = index === 0;
    actions[1].hidden = index === initialRows.length - 1;
    row.querySelector('button').setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    menu.style.top = row.getBoundingClientRect().bottom - stage.getBoundingClientRect().top + 4 + 'px';
    const visible = actions.filter(a => !a.hidden);
    visible[last ? visible.length - 1 : 0].focus({preventScroll: true});
  }
  initialRows.forEach(row => {
    const trigger = row.querySelector('button');
    trigger.onclick = () => openMenu(row);
    trigger.onkeydown = event => {
      if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault();
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        openMenu(row, event.key === 'ArrowUp');
      }
    };
  });
  actions.forEach(action => {
    action.onclick = () => {
      if (!menuRow || action.hidden) return;
      const row = menuRow, index = rows().indexOf(row) + Number(action.dataset.move);
      closeMenu();
      moveRow(row, index);
      row.querySelector('button').focus({preventScroll: true});
    };
  });
  menu.onkeydown = event => {
    if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault();
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
    } else if (event.key === 'Tab') closeMenu(true);
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const visible = actions.filter(a => !a.hidden), index = visible.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? visible.length - 1 :
        (index + (event.key === 'ArrowDown' ? 1 : visible.length - 1)) % visible.length;
      visible[next].focus();
    }
  };
  document.addEventListener('pointerdown', event => {
    suppressClick = false;
    if (!menu.contains(event.target) && !menuRow?.querySelector('button').contains(event.target)) closeMenu();
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
    if (!event.buttons) return finish(false);
    if (!drag.ghost) {
      if (Math.abs(event.clientX - drag.x) < 4 && Math.abs(event.clientY - drag.y) < 4) return;
      drag.ordered = rows();
      drag.boxes = drag.ordered.map(row => row.getBoundingClientRect());
      drag.bounds = list.getBoundingClientRect();
      const box = drag.boxes[drag.from];
      drag.dx = Math.min(Math.max(event.clientX - box.left, 4), box.width - 4);
      drag.dy = Math.min(Math.max(event.clientY - box.top, 2), Math.min(box.height, 26) - 2);
      const ghost = drag.row.cloneNode(true);
      ghost.classList.add('pinned-ghost');
      ghost.inert = true;
      ghost.setAttribute('aria-hidden', 'true');
      ghost.removeAttribute('data-pin');
      ghost.querySelectorAll('[aria-controls]').forEach(e => e.removeAttribute('aria-controls'));
      ghost.style.width = box.width + 'px';
      ghost.style.height = Math.min(box.height, 26) + 'px';
      document.body.append(ghost);
      drag.ghost = ghost;
      drag.row.style.visibility = 'hidden';
      list.setAttribute('data-pin-dragging', '');
      document.documentElement.classList.add('pinned-dragging');
      drag.row.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    drag.ghost.style.left = event.clientX - drag.dx + 'px';
    drag.ghost.style.top = event.clientY - drag.dy + 'px';
    let slot = drag.boxes.findIndex(box => event.clientY < box.top + box.height / 2);
    if (slot < 0) slot = drag.boxes.length;
    drag.to = slot > drag.from ? slot - 1 : slot;
    if (event.clientX < drag.bounds.left || event.clientX > drag.bounds.right) drag.to = drag.from;
    drag.ordered.forEach((row, index) => {
      const target = index === drag.from ? index :
        index > drag.from && index <= drag.to ? index - 1 :
        index < drag.from && index >= drag.to ? index + 1 : index;
      row.style.transform = `translateY(${drag.boxes[target].top - drag.boxes[index].top}px)`;
    });
  }
  function onUp(event) { if (event.pointerId === drag?.id) finish(true); }
  function onCancel(event) { if (event.pointerId === drag?.id) finish(false); }
  list.onpointerdown = event => {
    if (drag || event.button !== 0 || !event.isPrimary || event.target.closest('button')) return;
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
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      finish(false);
    }
  }, true);
  function dismiss() { finish(false); closeMenu(); }
  window.addEventListener('blur', dismiss);
  window.addEventListener('resize', dismiss);
  document.addEventListener('scroll', dismiss, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) dismiss(); });
  window.addEventListener('pagehide', dismiss);
  new MutationObserver(() => {
    if (!$('#modes').hasAttribute('data-active')) dismiss();
  }).observe($('#modes'), {attributes: true, attributeFilter: ['data-active']});
  $('#resetPinned').onclick = () => {
    dismiss();
    list.append(...initialRows);
    announce('Order restored');
  };
}
