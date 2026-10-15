'use strict';
function initComposerDemo() {
  initComposerAttachments();
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
