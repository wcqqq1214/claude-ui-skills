export type MentionOption = { id: string; title: string; description?: string };
export type ComposerDraft = { text: string; mentions: { id: string; title: string }[] };
export type MentionPopup = { items: readonly MentionOption[]; index: number } | null;
export type MentionContext = { x: number; y: number } | null;

/** Browser-owned editing island: never reconciled as React children. */
export function createMentionEditing(editor: HTMLDivElement, template: HTMLElement, bindings: {
  options: () => readonly MentionOption[];
  popup: () => HTMLElement | null;
  menu: () => HTMLElement | null;
  setPopup: (popup: MentionPopup) => void;
  setContext: (context: MentionContext) => void;
  setEmpty: (empty: boolean) => void;
  onChange: (draft: ComposerDraft) => void;
}) {
  let queryRange: Range | null = null, composing = false, dismissed: string | null = null, active = true;
  let contextNode: HTMLElement | null = null, contextSelection: Range | null = null;
  let popup: MentionPopup = null, popupSignature = '', currentQuery = '', lastDraft = '';
  const disposers: (() => void)[] = [];
  const lineBreakTails = new WeakSet<Node>();
  let lineBreakLength: number | null = null;
  function listen(target: EventTarget, event: string, handler: EventListener, capture = false) {
    target.addEventListener(event, handler, capture); disposers.push(() => target.removeEventListener(event, handler, capture));
  }
  function selectionRange() {
    const selection = getSelection();
    if (!selection?.rangeCount) return null;
    const range = selection.getRangeAt(0);
    return editor.contains(range.commonAncestorContainer) ? range : null;
  }
  function queryAtCaret() {
    const range = selectionRange();
    if (!range?.collapsed) return null;
    let block = (range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer) as HTMLElement;
    if (block.closest('[data-cui-mention]')) return null;
    while (block.parentElement !== editor && block !== editor && !['DIV', 'P'].includes(block.tagName)) block = block.parentElement!;
    const prefix = document.createRange(); prefix.selectNodeContents(block); prefix.setEnd(range.startContainer, range.startOffset);
    const fragment = prefix.cloneContents();
    fragment.querySelectorAll('[data-cui-mention],br').forEach(node => node.replaceWith(node.tagName === 'BR' ? '\n' : '\ufffc'));
    const match = (fragment.textContent ?? '').slice(-50).match(/(?:^|\s)@(\S*)$/);
    if (!match) return null;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.parentElement?.closest('[data-cui-mention]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const nodes: Text[] = [];
    while (walker.nextNode()) if (prefix.intersectsNode(walker.currentNode)) nodes.push(walker.currentNode as Text);
    let remaining = match[1].length + 1;
    const result = range.cloneRange();
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i], end = node === range.startContainer ? range.startOffset : node.length;
      if (remaining <= end) { result.setStart(node, end - remaining); return { range: result, query: match[1] }; }
      remaining -= end;
    }
    return null;
  }
  function show(next: MentionPopup) {
    popup = next;
    const signature = JSON.stringify(next);
    if (signature !== popupSignature) { popupSignature = signature; bindings.setPopup(next); }
  }
  function close() { queryRange = null; show(null); }
  function selectRange(range: Range) {
    editor.focus({ preventScroll: true });
    const selection = getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
  }
  function readText(node: Node, tail: Node | null, omitLineBox = true): string {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      return omitLineBox && node === tail && lineBreakTails.has(node) && text.endsWith('\n') ? text.slice(0, -1) : text;
    }
    if (node instanceof HTMLElement) {
      if (node.hasAttribute('data-cui-mention')) return node.title;
      if (node.tagName === 'BR') return node === node.parentNode?.lastChild ? '' : '\n';
      if (node.childNodes.length === 1 && node.firstChild instanceof HTMLBRElement) return '';
    } else if (node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return '';
    let text = '', previousBlock = false;
    for (const child of node.childNodes) {
      const block = child instanceof HTMLElement && ['DIV', 'P'].includes(child.tagName);
      if (child.previousSibling && (previousBlock || block && !text.endsWith('\n'))) text += '\n';
      text += readText(child, tail, omitLineBox);
      previousBlock = block;
    }
    return text;
  }
  function getDraft(omitLineBox = true): ComposerDraft {
    let tail = editor.lastChild;
    while (tail?.lastChild) tail = tail.lastChild;
    return { text: readText(editor, tail, omitLineBox), mentions: [...editor.querySelectorAll<HTMLElement>('[data-cui-mention]')].map(node => ({ id: node.dataset.cuiMention!, title: node.title })) };
  }
  function publish() {
    const draft = getDraft(), signature = JSON.stringify(draft);
    if (signature !== lastDraft) { lastDraft = signature; bindings.onChange(draft); }
  }
  function update() {
    const selection = selectionRange();
    for (const node of editor.querySelectorAll<HTMLElement>('[data-cui-mention]')) {
      const index = Array.prototype.indexOf.call(node.parentNode!.childNodes, node);
      node.toggleAttribute('data-selected', !!selection && selection.startContainer === node.parentNode && selection.endContainer === node.parentNode && selection.startOffset === index && selection.endOffset === index + 1);
    }
    bindings.setEmpty(!editor.textContent && !editor.querySelector('[data-cui-mention]') && editor.querySelectorAll('br').length <= 1);
    if (!active || composing || document.activeElement !== editor) return close();
    const found = queryAtCaret();
    if (!found) { dismissed = null; return close(); }
    const query = '@' + found.query;
    const items = bindings.options().filter(item => item.title.toLocaleLowerCase().includes(found.query.toLocaleLowerCase()));
    if (!items.length || dismissed && (dismissed.length === 1 ? query === dismissed : query.startsWith(dismissed))) return close();
    dismissed = null; queryRange = found.range;
    const index = currentQuery === query ? Math.min(popup?.index ?? 0, items.length - 1) : 0;
    currentQuery = query; show({ items, index }); positionPopup();
  }
  function positionPopup() {
    const element = bindings.popup();
    if (!popup || !queryRange || !element) return;
    if (!editor.getClientRects().length) return close();
    const caret = queryRange.cloneRange(); caret.collapse(true);
    const anchor = caret.getBoundingClientRect(), viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0, width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
    element.style.maxWidth = Math.max(0, width - 32) + 'px'; element.style.maxHeight = Math.min(384, height - 32) + 'px';
    element.style.left = Math.max(left + 16, Math.min(anchor.left, left + width - element.offsetWidth - 16)) + 'px';
    const above = anchor.bottom + 4 - 24 - element.offsetHeight;
    element.style.top = Math.max(top + 16, Math.min(above >= top + 16 ? above : anchor.bottom + 28, top + height - element.offsetHeight - 16)) + 'px';
  }
  function choose(index = popup?.index ?? 0) {
    const item = popup?.items[index];
    if (!queryRange || !item) return;
    const range = queryRange.cloneRange(), mention = template.cloneNode(true) as HTMLElement;
    mention.removeAttribute('hidden'); mention.removeAttribute('aria-hidden');
    mention.dataset.cuiMention = item.id; mention.title = item.title;
    mention.querySelector('[data-cui-mention-title]')!.textContent = item.title;
    close(); selectRange(range);
    // Native editing transactions retain undo/redo and atomic Backspace behavior.
    document.execCommand('insertHTML', false, mention.outerHTML + ' ');
    update(); publish();
  }
  function closeMenu(restore = false) {
    const saved = contextSelection;
    contextNode = null; contextSelection = null; bindings.setContext(null);
    if (restore && saved && editor.contains(saved.commonAncestorContainer)) selectRange(saved);
  }
  function removeMention() {
    if (!contextNode?.isConnected) return closeMenu();
    const range = document.createRange(); range.selectNode(contextNode);
    closeMenu(); selectRange(range); document.execCommand('delete'); update(); publish();
  }
  listen(editor, 'beforeinput', raw => {
    lineBreakLength = null;
    if ((raw as InputEvent).inputType !== 'insertLineBreak') return;
    const range = selectionRange();
    if (!range) return;
    const prefix = (container: Node, offset: number) => {
      const before = document.createRange(); before.selectNodeContents(editor); before.setEnd(container, offset);
      return readText(before.cloneContents(), null, false).length;
    };
    const selected = prefix(range.endContainer, range.endOffset) - prefix(range.startContainer, range.startOffset);
    lineBreakLength = getDraft().text.length - selected + 1;
  });
  listen(editor, 'input', raw => {
    const range = selectionRange();
    if ((raw as InputEvent).inputType === 'insertLineBreak' && range?.collapsed && range.startContainer.nodeType === Node.TEXT_NODE) {
      const node = range.startContainer;
      // Chromium may append a newline after the caret to create a line box.
      // Compare with the semantic edit first: an existing authored trailing
      // newline can occupy that position without being an added placeholder.
      if (lineBreakLength !== null && getDraft(false).text.length > lineBreakLength && node.textContent?.endsWith('\n') && range.startOffset === node.textContent.length - 1) lineBreakTails.add(node);
      else lineBreakTails.delete(node);
    }
    lineBreakLength = null;
    update(); publish();
  });
  listen(editor, 'compositionstart', () => { composing = true; close(); });
  listen(editor, 'compositionend', () => { composing = false; update(); publish(); });
  listen(editor, 'keydown', raw => {
    const event = raw as KeyboardEvent;
    if (event.isComposing || composing || event.keyCode === 229 || !popup || event.metaKey || event.ctrlKey || event.altKey) return;
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault(); show({ ...popup, index: Math.max(0, Math.min(popup.items.length - 1, popup.index + (event.key === 'ArrowDown' ? 1 : -1))) });
    } else if (['Enter', 'Tab'].includes(event.key) && !event.shiftKey) { event.preventDefault(); choose(); }
    else if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); const found = queryAtCaret(); dismissed = found ? '@' + found.query : null; close();
    }
  });
  listen(editor, 'paste', raw => {
    const event = raw as ClipboardEvent; event.preventDefault();
    document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? ''); update(); publish();
  });
  listen(editor, 'pointerdown', raw => {
    const event = raw as PointerEvent;
    if (event.button === 2 && (event.target as Element).closest('[data-cui-mention]')) event.preventDefault();
  });
  listen(editor, 'click', raw => {
    const node = (raw.target as Element).closest('[data-cui-mention]');
    if (node) { const range = document.createRange(); range.selectNode(node); selectRange(range); update(); }
  });
  listen(editor, 'contextmenu', raw => {
    const event = raw as MouseEvent, node = (event.target as Element).closest<HTMLElement>('[data-cui-mention]');
    if (!node) return;
    event.preventDefault(); close(); closeMenu(); contextNode = node; contextSelection = selectionRange()?.cloneRange() ?? null;
    bindings.setContext({ x: event.clientX, y: event.clientY });
  });
  listen(document, 'selectionchange', update);
  listen(document, 'pointerdown', event => {
    const target = event.target as Node;
    if (!bindings.popup()?.contains(target) && !editor.contains(target)) close();
    if (!bindings.menu()?.contains(target)) closeMenu();
  });
  listen(document, 'focusin', event => {
    const target = event.target as Node;
    if (!editor.contains(target) && !bindings.popup()?.contains(target)) close();
    if (!bindings.menu()?.contains(target)) closeMenu();
  });
  listen(window, 'resize', positionPopup); listen(window, 'scroll', positionPopup, true);
  if (window.visualViewport) listen(window.visualViewport, 'resize', positionPopup);
  const observer = new ResizeObserver(positionPopup); observer.observe(editor);
  return {
    update, getDraft, choose, positionPopup, removeMention, closeMenu,
    highlight(index: number) { if (popup) show({ ...popup, index }); },
    setActive(value: boolean) { active = value; if (!value) { close(); closeMenu(); } },
    refresh() { close(); closeMenu(); },
    reset(text: string, notify = false) { close(); closeMenu(); editor.textContent = text; lastDraft = ''; update(); if (notify) publish(); else lastDraft = JSON.stringify(getDraft()); },
    dispose() { observer.disconnect(); disposers.forEach(dispose => dispose()); },
  };
}
