'use strict';
function initWorkspaceDemo() {
  const docs = {
    notes: {
      name: 'design-notes.md',
      get code() {
        return DemoI18n.t(
          '# Leave room for content\n\nFold a complex process into an expandable layer.\nKeep common actions within reach,\nand reveal details when needed.\n\n- Keep the reading position\n- Make state changes visible\n- Return to the original workspace after closing'
        );
      },
      get html() {
        return DemoI18n.t(
          '<h3>Leave room for content</h3><p>Fold a complex process into an expandable layer. Keep common actions within reach, and reveal details when needed.</p><ul><li>Keep the reading position</li><li>Make state changes visible</li><li>Return to the original workspace after closing</li></ul>'
        );
      }
    },
    tokens: {
      name: 'motion-tokens.css',
      code: ':root {\n  --cds-dur-fast: 60ms;\n  --cds-dur-snap: 120ms;\n  --cds-dur-base: 200ms;\n  --cds-dur-sheet: 300ms;\n  --cds-dur-slow: 450ms;\n}',
      get html() {
        return (
          DemoI18n.t('<h3>Five measures of time</h3>') +
          [
            ['fast', '60 ms'],
            ['snap', '120 ms'],
            ['base', '200 ms'],
            ['sheet', '300 ms'],
            ['slow', '450 ms']
          ]
            .map((x) => `<div class="token-row"><span>${x[0]}</span><code>${x[1]}</code></div>`)
            .join('')
        );
      }
    }
  };
  let currentFile = 'notes',
    fileMode = 'preview';
  function renderFile() {
    const d = docs[currentFile];
    $('#fileName').textContent = d.name;
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
