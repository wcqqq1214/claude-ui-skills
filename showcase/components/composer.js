'use strict';
function initComposerDemo() {
  initComposerAttachments();
  const commands = [
    {
      name: 'prototype',
      get label() {
        return DemoI18n.t('Prototype');
      }
    },
    {
      name: 'research',
      get label() {
        return DemoI18n.t('Design research');
      }
    },
    {
      name: 'notes',
      get label() {
        return DemoI18n.t('Organize notes');
      }
    },
    {
      name: 'review',
      get label() {
        return DemoI18n.t('Review details');
      }
    }
  ];
  const prompt = $('#promptInput'),
    menu = $('#commandMenu');
  let matches = [],
    activeCommand = 0,
    menuDismissed = false;
  function renderCommands() {
    updateHint();
    const list = $('#commandList');
    list.replaceChildren();
    if (!matches.length) {
      const t = document.createElement('div');
      t.className = 'command-empty';
      DemoI18n.text(t, () => DemoI18n.t('No matching suggestions'));
      list.append(t);
      prompt.removeAttribute('aria-activedescendant');
      return;
    }
    matches.forEach((c, i) => {
      const row = document.createElement('div');
      row.id = 'command-option-' + i;
      row.role = 'option';
      row.setAttribute('aria-selected', i === activeCommand ? 'true' : 'false');
      const name = document.createElement('span');
      name.textContent = c.name;
      const label = document.createElement('small');
      DemoI18n.text(label, () => c.label);
      row.append(name, label);
      row.onpointerdown = (e) => e.preventDefault();
      row.onpointermove = () => {
        if (activeCommand !== i) {
          activeCommand = i;
          renderCommands();
        }
      };
      row.onclick = () => chooseCommand(i);
      list.append(row);
    });
    prompt.setAttribute('aria-activedescendant', 'command-option-' + activeCommand);
  }
  function updateHint() {
    DemoI18n.text($('#composerHint'), () => {
      if (!menu.hidden) return DemoI18n.t(matches.length
        ? '↑ ↓ to choose · Enter to insert · Esc to close'
        : 'Edit your query · Esc to close');
      return DemoI18n.t(prompt.value.trim()
        ? 'Enter to send · Shift Enter for a new line'
        : 'Type / for suggestions');
    });
  }
  function closeCommands() {
    menu.hidden = true;
    prompt.setAttribute('aria-expanded', 'false');
    prompt.removeAttribute('aria-activedescendant');
    updateHint();
  }
  function updateComposer() {
    prompt.style.height = 'auto';
    prompt.style.height = Math.min(prompt.scrollHeight, 130) + 'px';
    $('#sendBtn').disabled = !prompt.value.trim();
    if (prompt.value.startsWith('/') && !menuDismissed) {
      const q = prompt.value.slice(1).toLowerCase().trim();
      matches = commands.filter((x) => x.name.includes(q) || x.label.includes(q));
      activeCommand = Math.min(activeCommand, Math.max(matches.length - 1, 0));
      menu.hidden = false;
      prompt.setAttribute('aria-expanded', 'true');
      renderCommands();
    } else closeCommands();
  }
  function chooseCommand(i) {
    const c = matches[i];
    if (!c) return;
    prompt.value = '/' + c.name + ' ';
    menuDismissed = true;
    updateComposer();
    prompt.focus();
    DemoI18n.text($('#localResult'), () => DemoI18n.t('Selected “{0}”. Keep typing to continue.', c.label));
  }
  prompt.addEventListener('input', () => {
    menuDismissed = false;
    activeCommand = 0;
    updateComposer();
  });
  prompt.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    if (e.key === 'Escape' && !menu.hidden) {
      e.preventDefault();
      menuDismissed = true;
      closeCommands();
      return;
    }
    if (!menu.hidden && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      if (matches.length) {
        activeCommand =
          (activeCommand + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
        renderCommands();
      }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!menu.hidden) {
        if (matches.length) chooseCommand(activeCommand);
      } else sendLocal();
    }
  });
  function sendLocal() {
    const text = prompt.value.trim();
    if (!text) return;
    DemoI18n.text($('#localResult'), () => DemoI18n.t('Received on this page: ') + text);
    prompt.value = '';
    menuDismissed = false;
    updateComposer();
    prompt.focus();
  }
  $('#sendBtn').onclick = sendLocal;
  $('#suggestBtn').onclick = () => {
    prompt.value = '/';
    menuDismissed = false;
    activeCommand = 0;
    updateComposer();
    prompt.focus();
  };
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.composer-wrap')) {
      closeCommands();
      menuDismissed = true;
    }
  });
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
