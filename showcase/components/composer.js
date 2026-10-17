'use strict';
function initComposerDemo() {
  initComposerAttachments();
  initComposerChin();
  const prompt = $('#promptInput');
  function resizeInput() {
    if (!prompt.clientWidth) return;
    prompt.style.height = 'auto';
    prompt.style.height = Math.min(prompt.scrollHeight, 130) + 'px';
  }
  prompt.addEventListener('input', resizeInput);
  let inputWidth = 0;
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width !== inputWidth) {
      inputWidth = entry.contentRect.width;
      resizeInput();
    }
  }).observe(prompt);
}

// Fixed presentation samples; no file input, file reading or upload.
function initComposerAttachments() {
  const list = $('#composerAttachments'), add = $('#addMockAttachment');
  const names = ['design-notes.md', 'component-motion-reference.css', '界面设计说明.txt'];
  const pending = new Set();
  let transition, releaseKey;
  function guardHeldKey(key) {
    releaseKey?.();
    const repeat = event => {
      if (event.key === key && event.repeat) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const up = event => { if (event.key === key) releaseKey?.(); };
    releaseKey = () => {
      document.removeEventListener('keydown', repeat, true);
      document.removeEventListener('keyup', up, true);
      window.removeEventListener('blur', releaseKey);
      releaseKey = null;
    };
    document.addEventListener('keydown', repeat, true);
    document.addEventListener('keyup', up, true);
    window.addEventListener('blur', releaseKey);
  }
  function updateAdd() { add.disabled = list.children.length === names.length; }
  function remove(tile, key) {
    if (!tile.isConnected || pending.has(tile)) return;
    const animate = list.children.length - pending.size > 1;
    pending.add(tile);
    if (key) guardHeldKey(key);
    let updated = false;
    const update = () => {
      if (updated) return;
      updated = true;
      const ownsFocus = tile.contains(document.activeElement);
      const next = tile.nextElementSibling || tile.previousElementSibling;
      tile.remove();
      pending.delete(tile);
      updateAdd();
      if (ownsFocus) (next?.querySelector('button') || $('#promptInput')).focus();
    };
    transition?.skipTransition();
    transition = null;
    if (!animate || document.visibilityState !== 'visible' ||
        typeof document.startViewTransition !== 'function' ||
        !CSS.supports('selector(:active-view-transition-type(demo-attachments))')) {
      update();
      return;
    }
    try {
      const current = document.startViewTransition({types: ['demo-attachments'], update});
      transition = current;
      current.ready.catch(() => {});
      current.updateCallbackDone.catch(update);
      current.finished.catch(() => {}).finally(() => {
        if (transition === current) transition = null;
      });
    } catch { update(); }
  }
  function addSample() {
    const index = names.findIndex((_, i) => !list.querySelector(`[data-sample="${i}"]`));
    if (index < 0) return;
    transition?.skipTransition();
    const name = names[index], tile = document.createElement('div');
    tile.className = 'composer-attachment';
    tile.dataset.sample = String(index);
    tile.style.setProperty('--attachment-name', `demo-attachment-${index}`);
    const filename = document.createElement('span');
    filename.className = 'composer-attachment-name';
    filename.textContent = name;
    filename.title = name;
    filename.setAttribute('translate', 'no');
    const type = document.createElement('span');
    type.className = 'composer-attachment-type';
    type.textContent = name.split('.').pop().toUpperCase();
    type.setAttribute('translate', 'no');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'composer-attachment-remove';
    close.append(DemoIcons.create('X', 12));
    DemoI18n.attr(close, 'aria-label', () => DemoI18n.t('Remove {0}', name));
    DemoI18n.attr(close, 'title', () => DemoI18n.t('Remove {0}', name));
    close.onclick = () => remove(tile);
    tile.onkeydown = event => {
      if (!['Delete', 'Backspace', 'Enter'].includes(event.key) || event.isComposing || event.repeat ||
          event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      remove(tile, event.key);
    };
    tile.append(filename, type, close);
    list.append(tile);
    updateAdd();
  }
  add.onclick = addSample;
  // Seed the local presentation through the same path as subsequent additions.
  addSample();
  addSample();
  window.addEventListener('pagehide', () => { transition?.skipTransition(); releaseKey?.(); });
}

// Keep the sample composer open with no project selected.
function initComposerChin() {
  const chin = $('#composerChin'), pickers = $('#composerPickers');
  const spacer = $('#composerChinSpacer'), project = $('#composerProject');
  const content = project.querySelector('.composer-picker-content');
  const label = project.querySelector('[data-picker-label]');
  const caret = project.querySelector('.composer-project-caret');
  const touch = matchMedia('(pointer: coarse), (hover: none)');
  let icon = DemoIcons.create('Projects', touch.matches ? 20 : 16);
  // Measure the button press-animation layer on pointer down and initial Space.
  for (const button of chin.querySelectorAll('.composer-picker')) {
    const fill = button.querySelector('.composer-picker-fill');
    function measurePress() {
      const distance = Math.min(1.5, Math.max(.5, button.offsetHeight / 32));
      if (fill.offsetWidth <= 0 || fill.offsetHeight <= 0) return;
      fill.style.setProperty('--cds-btn-press-sx', Math.max(.8, 1 - 2 * distance / fill.offsetWidth));
      fill.style.setProperty('--cds-btn-press-sy', Math.max(.8, 1 - 2 * distance / fill.offsetHeight));
    }
    button.addEventListener('pointerdown', measurePress, { capture: true });
    button.addEventListener('keydown', event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      if (event.key === ' ' && !event.repeat) measurePress();
      if (event.repeat) event.preventDefault();
    });
  }
  const modes = ['words-and-carets', 'words', 'icons'];
  const need = [null, null], seenAs = [null, null, null];
  let mode = 0;
  function signature() {
    return [pickers.querySelector('[data-home-project-slot]')?.textContent ?? '',
      ...Array.from(pickers.querySelectorAll('button')).map(button =>
        button.getAttribute('aria-label') ?? button.textContent)].join('|');
  }
  function requiredWidth() {
    const overflow = element => element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0;
    const width = pickers.getBoundingClientRect().width;
    const free = spacer.getBoundingClientRect().width;
    const slot = pickers.querySelector('[data-home-project-slot]');
    const text = slot?.querySelector('[data-picker-label]') ?? null;
    let required = width - free + overflow(pickers);
    const selected = slot !== null && slot.offsetWidth > 0 &&
      ![DemoI18n.t('Project')].includes(text?.textContent ?? '');
    if (slot && selected) {
      const slotWidth = slot.getBoundingClientRect().width;
      const clipped = text ? overflow(text) : free < 1 ? Infinity : 0;
      if (clipped > 0) required += Math.max(0, Math.min(64, slotWidth + clipped) - slotWidth);
    } else required += overflow(text) + 1;
    return required;
  }
  function render() {
    chin.dataset.pickerMode = modes[mode];
    // Keep the trigger node so resizing does not discard keyboard focus.
    if (mode === 2) content.replaceChildren(icon);
    else {
      label.textContent = DemoI18n.t('Project');
      content.replaceChildren(label, ...(mode === 0 ? [caret] : []));
    }
  }
  function measure() {
    // Showcase chapters stay mounted while hidden.
    if (!pickers.getClientRects().length) return;
    const width = pickers.getBoundingClientRect().width;
    const text = mode > 0 ? signature() : null;
    const previous = mode > 0 ? need[mode - 1] : null;
    if (mode > 0 && previous !== null && seenAs[mode] === null) seenAs[mode] = text;
    let next = mode;
    if (mode < 2) {
      const required = requiredWidth();
      need[mode] = required;
      seenAs[mode + 1] = null;
      if (required > width) next = mode + 1;
    }
    if (next === mode && mode > 0 &&
        (previous === null || seenAs[mode] !== text || previous + 2 <= width)) next = mode - 1;
    if (next !== mode) {
      mode = next;
      render();
      measure();
    }
  }
  const resize = new ResizeObserver(measure);
  resize.observe(pickers);
  resize.observe(spacer);
  new MutationObserver(measure).observe(pickers, {
    subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ['aria-label'],
  });
  DemoI18n.onChange(() => { render(); measure(); });
  const width = $('#composerWidth'), output = $('#composerWidthOutput');
  function updateFrame() {
    $('.composer-box').style.setProperty('--composer-demo-width', width.value + 'px');
    output.textContent = width.value + ' px';
  }
  function updateMinimum() {
    // Demo frame bounds keep the fixed samples usable at either input density.
    width.min = touch.matches ? '168' : '156';
    updateFrame();
  }
  width.addEventListener('input', updateFrame);
  touch.addEventListener('change', () => {
    icon = DemoIcons.create('Projects', touch.matches ? 20 : 16);
    render();
    updateMinimum();
    measure();
  });
  updateMinimum();
  measure();
}
