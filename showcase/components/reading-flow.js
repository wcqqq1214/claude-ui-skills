'use strict';
function initReadingFlowDemo() {
  const card = $('#readingFlow'), stage = $('#readingFlowStage');
  const viewport = $('#readingFlowViewport'), notes = $('#readingNotes');
  const toggle = $('#readingNotesToggle'), close = $('#readingNotesClose');
  const handle = $('#readingNotesResize');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let desired = false, animation = null, width = 260, drag = null;

  // Keep the same passage at the same relative point when its lines reflow.
  function anchor() {
    const top = viewport.getBoundingClientRect().top;
    const node = [...viewport.querySelectorAll('h4, p')]
      .find(item => item.getBoundingClientRect().bottom > top);
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return { node, fraction: (top - rect.top) / rect.height };
  }
  function restore(saved) {
    if (!saved) return;
    const rect = saved.node.getBoundingClientRect();
    viewport.scrollTop += rect.top - viewport.getBoundingClientRect().top + saved.fraction * rect.height;
  }
  function layout(change) {
    const saved = anchor();
    change();
    restore(saved);
  }
  function syncWidth() {
    if (!stage.clientWidth) return;
    const max = Math.max(200, Math.min(320, stage.clientWidth - 280));
    const actual = Math.max(200, Math.min(max, width));
    stage.style.setProperty('--notes-width', actual + 'px');
    handle.setAttribute('aria-valuemax', String(max));
    handle.setAttribute('aria-valuenow', String(actual));
  }
  function finishDrag(commit) {
    if (!drag) return;
    const previous = drag;
    drag = null;
    if (!commit) layout(() => { width = previous.width; syncWidth(); });
    stage.removeAttribute('data-dragging');
    if (handle.hasPointerCapture(previous.id)) handle.releasePointerCapture(previous.id);
  }
  function settle() {
    animation?.cancel();
    animation = null;
    layout(() => {
      notes.hidden = !desired;
      handle.hidden = !desired;
      stage.toggleAttribute('data-open', desired);
      syncWidth();
    });
  }
  function setOpen(open, instant = false) {
    finishDrag(false);
    const from = notes.hidden ? 0 : Number(getComputedStyle(notes).opacity);
    animation?.cancel();
    animation = null;
    desired = open;
    toggle.setAttribute('aria-expanded', String(open));
    DemoI18n.text(toggle, () => DemoI18n.t(desired ? 'Close notes' : 'Open notes'));
    if (!open && (notes.contains(document.activeElement) || document.activeElement === handle))
      toggle.focus({preventScroll: true});
    notes.inert = !open;
    handle.inert = !open;
    handle.tabIndex = open ? 0 : -1;
    if (open) layout(() => {
      notes.hidden = false;
      handle.hidden = false;
      stage.setAttribute('data-open', '');
      syncWidth();
    });
    if (open) close.focus({preventScroll: true});
    if (instant || motion.matches || notes.hidden) { settle(); return; }
    const current = notes.animate([{opacity: from}, {opacity: open ? 1 : 0}], {
      duration: open ? 160 : 200, easing: 'ease-out'
    });
    animation = current;
    current.onfinish = () => { if (animation === current) settle(); };
  }
  toggle.addEventListener('click', () => setOpen(!desired));
  close.addEventListener('click', () => setOpen(false));
  card.addEventListener('keydown', event => {
    if (event.key === 'Escape' && desired && !event.isComposing) {
      event.preventDefault();
      setOpen(false);
    }
  });
  handle.addEventListener('blur', () => {
    if (!desired || handle.getClientRects().length) return;
    // Layout can clear focus before ResizeObserver runs. Do not override a
    // subsequent deliberate focus move to another visible control.
    queueMicrotask(() => {
      if (desired && $('#workspace').hasAttribute('data-active') &&
          document.activeElement === document.body) close.focus({preventScroll: true});
    });
  });
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || drag || !desired) return;
    event.preventDefault();
    handle.focus({preventScroll: true});
    drag = {id: event.pointerId, x: event.clientX, width, actual: notes.getBoundingClientRect().width};
    handle.setPointerCapture(event.pointerId);
    stage.setAttribute('data-dragging', '');
  });
  handle.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = drag.x - event.clientX;
    if (Math.abs(delta) <= 3) return;
    layout(() => {
      width = Math.max(200, Math.min(Number(handle.getAttribute('aria-valuemax')), drag.actual + delta));
      syncWidth();
    });
  });
  handle.addEventListener('pointerup', event => { if (drag?.id === event.pointerId) finishDrag(true); });
  for (const name of ['pointercancel', 'lostpointercapture'])
    handle.addEventListener(name, event => { if (drag?.id === event.pointerId) finishDrag(false); });
  handle.addEventListener('keydown', event => {
    if (drag || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    const step = event.shiftKey ? 32 : 8;
    const current = Number(handle.getAttribute('aria-valuenow'));
    const max = Number(handle.getAttribute('aria-valuemax'));
    const values = {ArrowLeft: current + step, ArrowRight: current - step, Home: 200, End: max, Enter: 260};
    if (!(event.key in values)) return;
    event.preventDefault();
    layout(() => { width = Math.max(200, Math.min(max, values[event.key])); syncWidth(); });
  });
  $('#readingFlowReset').addEventListener('click', () => {
    setOpen(false, true);
    width = 260;
    syncWidth();
    viewport.scrollTop = 0;
    notes.scrollTop = 0;
  });
  new ResizeObserver(() => {
    if (stage.clientWidth <= 700) {
      finishDrag(false);
      if (desired && document.activeElement === handle) close.focus({preventScroll: true});
    }
    syncWidth();
  }).observe(stage);
  motion.addEventListener('change', settle);
  new MutationObserver(() => {
    if (!$('#workspace').hasAttribute('data-active')) { finishDrag(false); settle(); }
  }).observe($('#workspace'), {attributes: true, attributeFilter: ['data-active']});
  window.addEventListener('pagehide', () => { finishDrag(false); settle(); });
  syncWidth();
}
