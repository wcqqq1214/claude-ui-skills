'use strict';
function initWorkspaceDemo() {
  const docs = {
    notes: {
      name: 'panel-layout-and-resize-notes.md',
      get code() { return DemoI18n.t("# Space follows the content\n\nAs the panel narrows, filenames shorten while view controls stay visible.\n\n- Switch files without leaving Preview or Code\n- Expand the preview, then restore the chosen width"); },
      get html() { return DemoI18n.t("<h3>Space follows the content</h3><p>As the panel narrows, filenames shorten while view controls stay visible.</p><ul><li>Switch files without leaving Preview or Code</li><li>Expand the preview, then restore the chosen width</li></ul>"); }
    },
    tokens: {
      name: 'panel-layout.css',
      code: ".workspace-layout {\n  grid-template-columns:\n    clamp(160px, var(--pane-width),\n      min(520px, 60%))\n    5px minmax(0, 1fr);\n}",
      get html() {
        return DemoI18n.t('<h3>Bounded, flexible columns</h3>') +
          [['Minimum', '160px'], ['Initial', '244px'], ['Maximum', 'min(520px, 60%)']]
            .map(([label, value]) => `<div class="token-row"><span>${DemoI18n.t(label)}</span><code>${value}</code></div>`)
            .join('');
      }
    }
  };
  let currentFile = 'notes',
    fileMode = 'preview';
  function renderFile() {
    const d = docs[currentFile];
    $('#fileName').textContent = d.name;
    $('#fileName').title = d.name;
    if (fileMode === 'preview') $('#fileContent').innerHTML = d.html;
    else {
      const pre = document.createElement('pre');
      DemoI18n.attr(pre, 'aria-label', () => d.name + DemoI18n.t('Source code'));
      d.code.split('\n').forEach((l) => {
        const line = document.createElement('span');
        line.className = 'code-line';
        line.textContent = l || ' ';
        pre.append(line);
      });
      $('#fileContent').replaceChildren(pre);
    }
  }
  $$('[data-file]').forEach(button => { button.title = docs[button.dataset.file].name; });
  $$('[data-file]').forEach(
    (b) =>
      (b.onclick = () => {
        currentFile = b.dataset.file;
        $$('[data-file]').forEach((x) => x.classList.toggle('active', x === b));
        renderFile();
      })
  );
  const fileSegment = setupSegment($('#fileSegment'), (v) => {
    fileMode = v;
    renderFile();
  });
  const panel = $('#workspaceCard'),
    handle = $('#resizeHandle');
  let paneWidth = 244,
    expanded = false;
  function maxPane() {
    return Math.max(160, Math.min(520, $('#workspaceLayout').getBoundingClientRect().width * 0.6));
  }
  function measuredPane() {
    return Math.round($('#fileList').getBoundingClientRect().width);
  }
  function syncPane() {
    if (expanded || window.innerWidth <= 620) return;
    const width = measuredPane();
    $('#paneWidth').textContent = width + ' px';
    handle.setAttribute('aria-valuenow', width);
    handle.setAttribute('aria-valuemax', Math.round(maxPane()));
  }
  function renderPane(width = paneWidth) {
    panel.style.setProperty('--pane-width', width + 'px');
    syncPane();
  }
  function commitPane(width) {
    const before = measuredPane();
    renderPane(width);
    const after = measuredPane();
    if (after !== before) paneWidth = after;
    renderPane();
  }
  let resizeStart = null;
  handle.onpointerdown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    handle.focus();
    resizeStart = { x: e.clientX, width: measuredPane(), changed: false };
    handle.setPointerCapture(e.pointerId);
    panel.toggleAttribute('data-resizing', true);
  };
  handle.onpointermove = (e) => {
    if (!resizeStart) return;
    const delta = e.clientX - resizeStart.x;
    if (Math.abs(delta) > 3) resizeStart.changed = true;
    renderPane(resizeStart.width + delta);
  };
  function finishResize(commit) {
    if (!resizeStart) return;
    if (commit && resizeStart.changed && measuredPane() !== resizeStart.width)
      paneWidth = measuredPane();
    resizeStart = null;
    panel.removeAttribute('data-resizing');
    renderPane();
  }
  handle.onpointerup = () => finishResize(true);
  handle.onpointercancel = () => finishResize(false);
  handle.onlostpointercapture = () => finishResize(false);
  handle.onkeydown = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || resizeStart) return;
    let n;
    if (e.key === 'ArrowLeft') n = measuredPane() - (e.shiftKey ? 32 : 8);
    else if (e.key === 'ArrowRight') n = measuredPane() + (e.shiftKey ? 32 : 8);
    else {
      if (e.shiftKey) return;
      if (!['Home', 'End', 'Enter', ' '].includes(e.key)) return;
      e.preventDefault();
      if (e.repeat) return;
      if (e.key === 'Enter' || e.key === ' ') {
        paneWidth = 244;
        renderPane();
        return;
      }
      n = e.key === 'Home' ? 160 : 520;
    }
    e.preventDefault();
    commitPane(n);
  };
  $('#expandPanel').onclick = () => {
    expanded = !expanded;
    panel.classList.toggle('expanded', expanded);
    $('#fileList').inert = expanded;
    handle.tabIndex = expanded ? -1 : 0;
    $('#expandPanel').setAttribute('aria-expanded', String(expanded));
    DemoI18n.attr($('#expandPanel'), 'aria-label', () =>
      expanded ? DemoI18n.t('Restore file panel') : DemoI18n.t('Expand file panel')
    );
    $('#expandPanel').replaceChildren(DemoIcons.create(expanded ? 'Collapse' : 'Expand'));
    if (!expanded) renderPane();
    fileSegment.refresh();
  };
  new ResizeObserver(syncPane).observe($('#workspaceLayout'));
  renderPane();
  DemoI18n.onChange(renderFile);
  // F6 is contained to this demonstration, not a global application shortcut.
  $('#fileContent').tabIndex = -1;
  $('#workspaceCard').addEventListener('keydown', (e) => {
    if (e.key !== 'F6' || e.altKey || e.isComposing || e.repeat) return;
    e.preventDefault();
    const regions = [
      $('#fileList .file'),
      $('#fileSegment [aria-checked=true]'),
      $('#fileContent')
    ].filter((x) => x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden');
    let i = regions.findIndex(
      (x) => x === document.activeElement || x.contains(document.activeElement)
    );
    if ($('#fileList').contains(document.activeElement)) i = 0;
    if ($('#fileSegment').contains(document.activeElement))
      i = regions.indexOf($('#fileSegment [aria-checked=true]'));
    regions[(i + (e.shiftKey ? regions.length - 1 : 1)) % regions.length]?.focus({
      preventScroll: true
    });
  });
}
