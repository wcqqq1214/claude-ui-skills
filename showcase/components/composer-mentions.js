'use strict';
// One local Artifact fixture; no account data, file providers or sending workflow.
function initComposerMentions() {
  const editor = $('#promptInput'), popup = $('#composerMentionList');
  const option = $('#composerMentionOption'), menu = $('#composerMentionMenu');
  const remove = menu.querySelector('button');
  let queryRange = null, composing = false, dismissed = null, contextNode = null;
  const label = () => option.querySelector('.composer-mention-title').textContent;
  function localize() {
    editor.dataset.placeholder = DemoI18n.t('Type a few lines…');
    editor.setAttribute('aria-label', DemoI18n.t('Demo input'));
    close();
  }
  localize();
  DemoI18n.onChange(localize);
  function close() {
    popup.hidden = true;
    queryRange = null;
    editor.removeAttribute('aria-activedescendant');
  }
  function selectionRange() {
    const selection = getSelection();
    if (!selection?.rangeCount) return null;
    const range = selection.getRangeAt(0);
    return editor.contains(range.commonAncestorContainer) ? range : null;
  }
  // Walk only the current paragraph, representing noneditable atoms as one character.
  function queryAtCaret() {
    const range = selectionRange();
    if (!range?.collapsed) return null;
    let block = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
    if (block.closest('.composer-mention')) return null;
    while (block.parentElement !== editor && block !== editor && !['DIV','P'].includes(block.tagName)) block = block.parentElement;
    const prefix = document.createRange();
    prefix.selectNodeContents(block);
    prefix.setEnd(range.startContainer, range.startOffset);
    const fragment = prefix.cloneContents();
    fragment.querySelectorAll('.composer-mention,br').forEach(node => node.replaceWith(node.tagName === 'BR' ? '\n' : '\ufffc'));
    const text = fragment.textContent;
    const match = text.slice(-50).match(/(?:^|\s)@(\S*)$/);
    if (!match) return null;
    const length = match[1].length + 1;
    // Queries are text; never traverse into an inline atom while locating '@'.
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.parentElement.closest('.composer-mention') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (prefix.intersectsNode(node)) nodes.push(node);
    }
    let remaining = length;
    const result = range.cloneRange();
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const end = node === range.startContainer ? range.startOffset : node.length;
      if (remaining <= end) { result.setStart(node, end - remaining); return {range: result, query: match[1]}; }
      remaining -= end;
    }
    return null;
  }
  function positionPopup() {
    if (popup.hidden || !queryRange) return;
    if (!editor.getClientRects().length) return close();
    const anchor = queryRange.getBoundingClientRect();
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
    const width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
    popup.style.maxWidth = Math.max(0, width - 32) + 'px';
    popup.style.maxHeight = Math.min(384, height - 32) + 'px';
    popup.style.left = Math.max(left + 16, Math.min(anchor.left, left + width - popup.offsetWidth - 16)) + 'px';
    // Use a caret-bottom anchor with sideOffset 24, then flip near the viewport edge.
    const above = anchor.bottom - 24 - popup.offsetHeight;
    popup.style.top = Math.max(top + 16, Math.min(above >= top + 16 ? above : anchor.bottom + 24, top + height - popup.offsetHeight - 16)) + 'px';
  }
  function update() {
    const selection = selectionRange();
    for (const node of editor.querySelectorAll('.composer-mention')) {
      node.toggleAttribute('data-selected', !!selection && !selection.collapsed && selection.intersectsNode(node));
    }
    if (composing || document.activeElement !== editor) return close();
    editor.dataset.empty = String(!editor.textContent && !editor.querySelector('.composer-mention'));
    const found = queryAtCaret();
    if (!found || !label().toLocaleLowerCase().includes(found.query.toLocaleLowerCase())) return close();
    if (dismissed && dismissed.container === found.range.startContainer && dismissed.offset === found.range.startOffset && dismissed.query === found.query) return close();
    dismissed = null;
    queryRange = found.range;
    popup.hidden = false;
    editor.setAttribute('aria-activedescendant', option.id);
    positionPopup();
  }
  function selectRange(range) {
    editor.focus({preventScroll: true});
    getSelection().removeAllRanges();
    getSelection().addRange(range);
  }
  function insert() {
    if (!queryRange) return;
    const range = queryRange.cloneRange();
    const mention = document.createElement('span');
    mention.className = 'composer-mention';
    mention.contentEditable = 'false';
    mention.dir = 'auto';
    mention.title = label();
    const content = document.createElement('span');
    content.className = 'composer-mention-content';
    content.append(DemoIcons.create('Palette', 16), document.createTextNode(label()));
    mention.append(content);
    close();
    selectRange(range);
    // Browser editing transactions preserve ordinary undo/redo in the local editor.
    document.execCommand('insertHTML', false, mention.outerHTML + ' ');
    editor.dispatchEvent(new Event('input', {bubbles: true}));
  }
  option.addEventListener('pointerdown', event => event.preventDefault());
  option.addEventListener('click', insert);
  editor.addEventListener('input', () => { dismissed = null; update(); });
  editor.addEventListener('compositionstart', () => { composing = true; close(); });
  editor.addEventListener('compositionend', () => { composing = false; update(); });
  editor.addEventListener('keydown', event => {
    if (event.isComposing || composing || event.keyCode === 229) return;
    if (!popup.hidden && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); return; }
      if (['Enter','Tab'].includes(event.key) && !event.shiftKey) { event.preventDefault(); insert(); return; }
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation();
        const found = queryAtCaret();
        dismissed = found && {container: found.range.startContainer, offset: found.range.startOffset, query: found.query};
        close(); return;
      }
    }
  });
  // Pasted content remains text; arbitrary HTML cannot create fake reference nodes.
  editor.addEventListener('paste', event => {
    event.preventDefault();
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
  });
  function closeMenu(restore = false) {
    menu.hidden = true;
    if (restore && contextNode?.isConnected) {
      const range = document.createRange(); range.setStartAfter(contextNode); range.collapse(true); selectRange(range);
    }
    contextNode = null;
  }
  editor.addEventListener('click', event => {
    const node = event.target.closest('.composer-mention');
    if (!node) return;
    const range = document.createRange(); range.selectNode(node); selectRange(range); update();
  });
  editor.addEventListener('contextmenu', event => {
    const node = event.target.closest('.composer-mention');
    if (!node) return;
    event.preventDefault(); close(); closeMenu(); contextNode = node;
    const selected = document.createRange(); selected.selectNode(node); selectRange(selected); update();
    menu.hidden = false;
    menu.style.left = Math.max(16, Math.min(event.clientX, innerWidth - menu.offsetWidth - 16)) + 'px';
    menu.style.top = Math.max(16, Math.min(event.clientY, innerHeight - menu.offsetHeight - 16)) + 'px';
    menu.focus({preventScroll: true});
  });
  remove.addEventListener('pointermove', () => remove.focus({preventScroll: true}));
  remove.addEventListener('pointerleave', () => { if (!menu.hidden) menu.focus({preventScroll: true}); });
  remove.addEventListener('click', () => {
    if (!contextNode?.isConnected) return closeMenu();
    const range = document.createRange(); range.selectNode(contextNode);
    closeMenu(); selectRange(range);
    document.execCommand('delete');
    editor.dispatchEvent(new Event('input', {bubbles: true}));
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault(); event.stopPropagation(); closeMenu(true);
    } else if (['ArrowUp','ArrowDown','Home','End'].includes(event.key)) {
      event.preventDefault(); remove.focus({preventScroll: true});
    }
  });
  document.addEventListener('selectionchange', update);
  document.addEventListener('pointerdown', event => {
    if (!popup.contains(event.target) && !editor.contains(event.target)) close();
    if (!menu.contains(event.target)) closeMenu();
  });
  document.addEventListener('focusin', event => {
    if (!editor.contains(event.target) && !popup.contains(event.target)) close();
    if (!menu.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', positionPopup);
  window.addEventListener('scroll', positionPopup, true);
  window.visualViewport?.addEventListener('resize', positionPopup);
  new ResizeObserver(positionPopup).observe(editor);
  window.addEventListener('hashchange', () => { close(); closeMenu(); });
}
