export type PinnedDragCallbacks = { onMove: (id: string, index: number) => void; onCancel: () => void; onStart: () => void };
type Drag = {
  row: HTMLLIElement; id: number; x: number; y: number; from: number; to: number;
  pointerX: number; pointerY: number; frame: number; releaseTimer?: ReturnType<typeof setTimeout>;
  ordered: HTMLLIElement[]; boxes: DOMRect[]; bounds?: DOMRect; ghost?: HTMLDivElement; step: number;
  viewportWidth: number; viewportHeight: number;
};
/** Imperative drag preview only. React/host state performs the final keyed reorder. */
export function createPinnedDrag(list: HTMLOListElement, stage: HTMLDivElement, callbacks: PinnedDragCallbacks) {
  let drag: Drag | null = null, suppressClick = false, active = true;
  const rows = () => [...list.querySelectorAll<HTMLLIElement>(':scope > li')];
  function finish(commit = false, announce = true) {
    if (!drag) return;
    const state = drag, current = list.getBoundingClientRect(), before = state.bounds;
    commit = commit && innerWidth === state.viewportWidth && innerHeight === state.viewportHeight && (!before || (['x', 'y', 'width', 'height'] as const).every(key => current[key] === before[key]));
    drag = null;
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', cancelPointer);
    cancelAnimationFrame(state.frame); clearTimeout(state.releaseTimer); state.ghost?.remove(); list.removeAttribute('data-pin-dragging');
    state.ordered.forEach(row => { row.style.transform = ''; row.style.visibility = ''; });
    if (state.row.hasPointerCapture(state.id)) state.row.releasePointerCapture(state.id);
    if (!state.ghost) return;
    suppressClick = true;
    if (commit && state.to !== state.from) callbacks.onMove(state.row.dataset.pin!, state.to);
    else if (!commit && announce) callbacks.onCancel();
  }
  function move(event: PointerEvent) {
    const state = drag;
    if (!state || event.pointerId !== state.id) return;
    if (!event.buttons || state.releaseTimer) { state.releaseTimer ??= setTimeout(() => finish(true), 200); return; }
    state.pointerX = event.clientX; state.pointerY = event.clientY;
    if (!state.ghost) {
      if (Math.abs(event.clientX - state.x) < 4 && Math.abs(event.clientY - state.y) < 4) return;
      state.ordered = rows(); state.boxes = state.ordered.map(row => row.getBoundingClientRect()); state.bounds = list.getBoundingClientRect();
      const box = state.boxes[state.from], dx = Math.min(Math.max(event.clientX - box.left, 4), box.width - 4), dy = Math.min(Math.max(event.clientY - box.top, 2), Math.min(box.height, 26) - 2);
      const clone = state.row.cloneNode(true) as HTMLElement; clone.removeAttribute('data-pin'); clone.removeAttribute('style');
      clone.querySelectorAll('[id], [aria-controls]').forEach(element => { element.removeAttribute('id'); element.removeAttribute('aria-controls'); });
      const ghost = document.createElement('div'), surface = document.createElement('div');
      ghost.className = 'cui-pinned-ghost'; ghost.inert = true; ghost.setAttribute('aria-hidden', 'true'); surface.className = 'cui-pinned-ghost-surface';
      Object.assign(surface.style, { left: `${-dx}px`, top: `${-dy}px`, width: `${box.width}px`, height: `${box.height}px`, transformOrigin: `${dx}px ${dy}px` });
      surface.append(clone); ghost.append(surface); stage.append(ghost); state.ghost = ghost;
      state.step = parseFloat(getComputedStyle(stage).getPropertyValue('--cui-pin-row-h')) + parseFloat(getComputedStyle(stage).getPropertyValue('--cui-pin-row-gap'));
      const paint = () => { if (drag !== state) return; ghost.style.transform = `translate(${state.pointerX}px, ${state.pointerY}px)`; state.frame = requestAnimationFrame(paint); };
      paint(); state.row.style.visibility = 'hidden'; list.setAttribute('data-pin-dragging', ''); state.row.setPointerCapture(event.pointerId); return;
    }
    event.preventDefault();
    let slot = state.boxes.findIndex(box => event.clientY < box.top + box.height / 2); if (slot < 0) slot = state.boxes.length;
    state.to = slot > state.from ? slot - 1 : slot;
    if (getComputedStyle(stage).direction === 'rtl' ? event.clientX < state.bounds!.left : event.clientX > state.bounds!.right) state.to = state.from;
    state.ordered.forEach((row, index) => {
      const target = index === state.from ? index : index > state.from && index <= state.to ? index - 1 : index < state.from && index >= state.to ? index + 1 : index;
      row.style.transform = `translateY(${(target - index) * state.step}px)`;
    });
  }
  function up(event: PointerEvent) {
    if (event.pointerId !== drag?.id) return;
    finish(true);
  }
  function cancelPointer(event: PointerEvent) { if (event.pointerId === drag?.id) finish(); }
  function lostCapture(event: PointerEvent) { if (event.target === drag?.row) cancelPointer(event); }
  function down(event: PointerEvent) {
    suppressClick = false;
    if (!active || drag || event.button !== 0 || !event.isPrimary || (event.target as HTMLElement).closest('.cui-pinned-more')) return;
    const row = (event.target as HTMLElement).closest<HTMLLIElement>('.cui-pinned-row'); if (!row || row.parentElement !== list) return;
    callbacks.onStart(); const ordered = rows(), index = ordered.indexOf(row);
    drag = { row, id: event.pointerId, x: event.clientX, y: event.clientY, from: index, to: index, pointerX: event.clientX, pointerY: event.clientY, frame: 0, ordered, boxes: [], step: 27, viewportWidth: innerWidth, viewportHeight: innerHeight };
    document.addEventListener('pointermove', move, { passive: false }); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', cancelPointer);
  }
  function clearClick() { suppressClick = false; }
  function click(event: MouseEvent) { if (suppressClick) { suppressClick = false; event.preventDefault(); event.stopPropagation(); } }
  function key(event: KeyboardEvent) {
    if (!event.repeat) suppressClick = false;
    if (event.key === 'Escape' && drag && !event.isComposing && !event.defaultPrevented) { event.preventDefault(); event.stopImmediatePropagation(); finish(); }
  }
  list.addEventListener('pointerdown', down); list.addEventListener('lostpointercapture', lostCapture); stage.addEventListener('click', click, true);
  document.addEventListener('pointerdown', clearClick, true); document.addEventListener('keydown', key, true);
  return { cancel: () => finish(), setActive: (next: boolean) => { active = next; if (!active) finish(); }, dispose: () => {
    finish(false, false); list.removeEventListener('pointerdown', down); list.removeEventListener('lostpointercapture', lostCapture); stage.removeEventListener('click', click, true);
    document.removeEventListener('pointerdown', clearClick, true); document.removeEventListener('keydown', key, true);
  } };
}
