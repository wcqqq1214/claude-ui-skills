import { clamp, clickZoom, nextScale, scaleAt } from './galleryZoom';
import type { GalleryFit, GalleryPoint, GalleryZoomState } from './galleryZoom';
export interface GalleryState { id: string | null; open: boolean; zoomed: boolean }
interface GalleryElements {
  dialog: HTMLDialogElement; rail: HTMLDivElement; viewport: HTMLDivElement; header: HTMLDivElement;
  close: HTMLButtonElement; previous: HTMLButtonElement; next: HTMLButtonElement; bottom: HTMLDivElement;
  slides: Map<string, HTMLDivElement>; triggers: Map<string, HTMLButtonElement>;
  initialId: string | null;
  items(): readonly { id: string }[];
  change(state: GalleryState, synchronous: boolean): void;
  selection(id: string): void;
  opened(open: boolean): void;
}
interface Drag { id: number; image: HTMLImageElement; x: number; y: number; tx: number; ty: number; moved: boolean }

/** Owns native gestures and transient geometry; React owns slides and ARIA. */
export function createGalleryInteraction(elements: GalleryElements) {
  const { dialog, rail, viewport, header, close, previous, next, bottom, slides, triggers } = elements;
  let id = elements.initialId, opened = false, closing = false, disposed = false, revision = 0, ownCloseEvents = 0;
  let zoom: GalleryZoomState | null = null, drag: Drag | null = null, painted: HTMLImageElement | null = null;
  let suppressClick = false, suppressTimer: ReturnType<typeof setTimeout> | undefined;
  let transition: ViewTransition | null = null, sheet: HTMLStyleElement | null = null, origin: HTMLElement | null = null;
  const currentSlide = () => id === null ? undefined : slides.get(id);
  const currentImage = () => currentSlide()?.querySelector('img');
  const index = () => elements.items().findIndex(item => item.id === id);
  const emit = (sync = true) => { if (!disposed) elements.change({ id, open: opened, zoomed: !!zoom }, sync); };
  function paint(value: GalleryZoomState | null) {
    if (!value) { painted?.style.removeProperty('transform'); painted = null; return; }
    const image = currentImage();
    if (image) { painted = image; image.style.transform = `translate(${value.tx}px, ${value.ty}px) scale(${value.scale})`; }
  }
  function setZoom(value: GalleryZoomState | null, sync = true) {
    const changed = !!zoom !== !!value;
    zoom = value; paint(value);
    if (changed) emit(sync);
  }
  function measure(): GalleryFit | null {
    const image = currentImage();
    if (!image || image.getAnimations().some(animation => animation.playState === 'running')) return null;
    const fit = image.getBoundingClientRect(), bounds = viewport.getBoundingClientRect();
    if (!fit.width || !fit.height) return null;
    return { fitWidth: fit.width, fitHeight: fit.height, fitCenterX: fit.left + fit.width / 2, fitCenterY: fit.top + fit.height / 2,
      maxScale: Math.max(image.naturalWidth / fit.width, 2), viewportWidth: bounds.width, viewportHeight: bounds.height };
  }
  function toggleZoom(point: GalleryPoint | null = null) {
    if (!opened || closing) return;
    if (zoom) setZoom(null);
    else { const fit = measure(); if (fit) setZoom(clickZoom(fit, point)); }
  }
  function endDrag(event?: PointerEvent) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const ended = drag; drag = null;
    if (ended.moved) {
      suppressClick = true;
      if (zoom) setZoom({ ...zoom, tx: ended.tx, ty: ended.ty, idealTx: ended.tx, idealTy: ended.ty });
      clearTimeout(suppressTimer); suppressTimer = setTimeout(() => { suppressClick = false; suppressTimer = undefined; }, 0);
    }
    if (ended.image.hasPointerCapture(ended.id)) ended.image.releasePointerCapture(ended.id);
  }
  function clearDrag() {
    const ended = drag; drag = null;
    if (ended?.image.hasPointerCapture(ended.id)) ended.image.releasePointerCapture(ended.id);
    clearTimeout(suppressTimer); suppressTimer = undefined; suppressClick = false;
  }
  function select(at: number, focus = true, notify = true, sync = true) {
    const items = elements.items(), item = items[Math.max(0, Math.min(items.length - 1, at))];
    if (!item || (dialog.open && item.id === id)) return;
    clearDrag(); setZoom(null, sync);
    const changed = id !== item.id; id = item.id; emit(sync);
    if (notify && changed) elements.selection(item.id);
    if (focus && !document.activeElement?.closest('button, a')) currentSlide()?.focus({ preventScroll: true });
  }
  function clearTransition() { transition?.skipTransition(); transition = null; sheet?.remove(); sheet = null; }
  function closeDialog() {
    // Native close events are queued; an event from this request must not reset
    // a later opening whose View Transition has not shown the dialog yet.
    if (dialog.open) { ownCloseEvents++; dialog.close(); }
  }
  function setOpen(value: boolean) {
    if (disposed || opened === value) return;
    opened = value; closing = !value;
    const current = ++revision; clearTransition(); emit(); elements.opened(value);
    if (disposed || revision !== current) return;
    const render = () => {
      if (disposed || revision !== current) return;
      if (value) {
        rail.style.transition = 'none';
        if (!dialog.open) dialog.showModal();
        void rail.offsetWidth; rail.style.removeProperty('transition');
      } else {
        clearDrag(); setZoom(null);
        const focused = document.activeElement;
        const outside = focused instanceof HTMLElement && focused !== document.body && !dialog.contains(focused);
        closeDialog();
        const destination = outside ? focused : origin;
        if (destination?.isConnected) destination.focus({ preventScroll: true });
      }
    };
    const ownSheet = document.createElement('style');
    ownSheet.dataset.cuiGalleryTransition = '';
    ownSheet.textContent = '::view-transition-group(root) { animation-duration: 180ms !important; }';
    const finish = () => {
      ownSheet.remove();
      if (revision !== current) return;
      transition = null; sheet = null; closing = false;
    };
    if (typeof document.startViewTransition !== 'function') { render(); finish(); return; }
    sheet = ownSheet; document.head.append(ownSheet);
    try {
      const running = document.startViewTransition(render); transition = running;
      void running.ready.catch(() => {}); void running.updateCallbackDone.catch(() => {});
      void running.finished.catch(() => {}).finally(finish);
    } catch { render(); finish(); }
  }
  function open(value?: string, trigger?: HTMLElement) {
    if (disposed || opened || !elements.items().length) return;
    const at = elements.items().findIndex(item => item.id === (value ?? id));
    origin = trigger ?? triggers.get(value ?? id ?? '') ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    select(Math.max(0, at), false); setOpen(true);
  }
  function reset(sync = false, notify = true) {
    ++revision; clearTransition(); clearDrag();
    const wasOpen = opened; opened = false; closing = false; origin = null;
    zoom = null; paint(null); closeDialog(); rail.style.removeProperty('transition'); emit(sync);
    if (wasOpen && notify) elements.opened(false);
  }
  const onCancel = (event: Event) => { event.preventDefault(); setOpen(false); };
  const onClosed = () => {
    if (ownCloseEvents) { ownCloseEvents--; return; }
    if (!dialog.open && opened) reset(true);
  };
  const onClose = (event: MouseEvent) => { event.stopPropagation(); setOpen(false); };
  const onPrevious = (event: MouseEvent) => { event.stopPropagation(); if (!closing && index() > 0) select(index() - 1); };
  const onNext = (event: MouseEvent) => { event.stopPropagation(); if (!closing && index() < elements.items().length - 1) select(index() + 1); };
  const stop = (event: MouseEvent) => event.stopPropagation();
  const onCaptureClick = (event: MouseEvent) => { if (suppressClick) event.stopPropagation(); };
  const onBackdrop = () => { if (!opened || closing || suppressClick) return; if (zoom) setZoom(null); else setOpen(false); };
  function onSlideClick(event: MouseEvent) {
    if (!opened || closing || suppressClick) return;
    const slide = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cui-gallery-slide]') : null;
    if (!slide) return;
    const at = elements.items().findIndex(item => item.id === slide.dataset.cuiGallerySlide);
    if (at < 0) return;
    if (at !== index()) {
      const bounds = close.getBoundingClientRect(), nearClose = event.clientX >= bounds.left - 16 && event.clientX <= bounds.right + 16 && event.clientY >= bounds.top - 16 && event.clientY <= bounds.bottom + 16;
      if (!zoom && !nearClose) { event.stopPropagation(); select(at); }
    } else if (event.target === currentImage() || (event.target === slide && event.detail === 0 && !('pointerType' in event && event.pointerType))) {
      event.stopPropagation(); if (!drag) toggleZoom(event.target === currentImage() ? event : null);
    }
  }
  function onKey(event: KeyboardEvent) {
    if (!opened || closing || event.defaultPrevented) return;
    // A new keyboard action is independent of the completed pointer gesture,
    // even if the browser has not yet serviced its zero-delay click guard timer.
    if (!drag) { clearTimeout(suppressTimer); suppressTimer = undefined; suppressClick = false; }
    if ((event.key === ' ' || event.key === 'Enter') && event.target === currentSlide()) { event.preventDefault(); toggleZoom(); return; }
    if (event.key === 'Tab') {
      const stops: HTMLElement[] = [close, currentSlide(), previous, next].filter((element): element is HTMLButtonElement | HTMLDivElement => !!element);
      const at = stops.indexOf(document.activeElement as HTMLElement); event.preventDefault();
      stops[(at + (event.shiftKey ? -1 : 1) + stops.length) % stops.length]?.focus(); return;
    }
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); const rtl = getComputedStyle(dialog).direction === 'rtl';
      select(event.key === 'Home' ? 0 : event.key === 'End' ? elements.items().length - 1 : index() + (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight') ? 1 : -1));
    }
  }
  function onPointerDown(event: PointerEvent) {
    const image = currentImage();
    if (!opened || closing || !zoom || event.button !== 0 || event.target !== image || !image || drag) return;
    clearTimeout(suppressTimer); suppressTimer = undefined; suppressClick = false;
    drag = { id: event.pointerId, image, x: event.clientX, y: event.clientY, tx: zoom.tx, ty: zoom.ty, moved: false };
    image.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: PointerEvent) {
    if (!drag || !zoom || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true; suppressClick = true;
    drag.tx = clamp(zoom.tx + dx, zoom.maxTx); drag.ty = clamp(zoom.ty + dy, zoom.maxTy);
    paint({ ...zoom, tx: drag.tx, ty: drag.ty });
  }
  function onWheel(event: WheelEvent) {
    if (!opened || closing || drag) return;
    const inside = !(event.target instanceof Element) || viewport.contains(event.target) || header.contains(event.target), unit = event.deltaMode === 0 ? 1 : 16;
    if (event.ctrlKey) {
      event.preventDefault(); if (!inside) return;
      const fit = zoom || measure(); if (!fit) return;
      const scale = nextScale(zoom?.scale ?? 1, fit.maxScale, event.deltaY, event.deltaMode);
      if (scale === 1) { if (zoom) setZoom(null); return; }
      if (zoom && scale === zoom.scale) return;
      setZoom(scaleAt(fit, zoom, scale, event));
    } else if (inside && zoom) {
      event.preventDefault();
      const unitX = event.deltaMode === 2 ? viewport.clientWidth || unit : unit, unitY = event.deltaMode === 2 ? viewport.clientHeight || unit : unit;
      const tx = clamp(zoom.tx - event.deltaX * unitX, zoom.maxTx), ty = clamp(zoom.ty - event.deltaY * unitY, zoom.maxTy);
      if (tx !== zoom.tx || ty !== zoom.ty) setZoom({ ...zoom, tx, ty, idealTx: tx, idealTy: ty });
    }
  }
  const pagehide = () => reset(true);
  const resize = () => { clearDrag(); setZoom(null); };
  const blur = () => endDrag();
  dialog.addEventListener('cancel', onCancel); dialog.addEventListener('close', onClosed);
  close.addEventListener('click', onClose); previous.addEventListener('click', onPrevious); next.addEventListener('click', onNext); bottom.addEventListener('click', stop);
  dialog.addEventListener('click', onCaptureClick, true); dialog.addEventListener('click', onBackdrop); rail.addEventListener('click', onSlideClick); dialog.addEventListener('keydown', onKey);
  rail.addEventListener('pointerdown', onPointerDown); rail.addEventListener('pointermove', onPointerMove); rail.addEventListener('pointerup', endDrag); rail.addEventListener('pointercancel', endDrag); rail.addEventListener('lostpointercapture', endDrag);
  dialog.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('pagehide', pagehide); window.addEventListener('resize', resize); window.addEventListener('blur', blur);
  return {
    open, close: () => setOpen(false), reset,
    reconcile() {
      clearDrag(); setZoom(null, false);
      if (!elements.items().length) { id = null; reset(); }
      else if (index() < 0) select(0, false, false, false);
    },
    dispose() {
      disposed = true; reset(false, false);
      dialog.removeEventListener('cancel', onCancel); dialog.removeEventListener('close', onClosed);
      close.removeEventListener('click', onClose); previous.removeEventListener('click', onPrevious); next.removeEventListener('click', onNext); bottom.removeEventListener('click', stop);
      dialog.removeEventListener('click', onCaptureClick, true); dialog.removeEventListener('click', onBackdrop); rail.removeEventListener('click', onSlideClick); dialog.removeEventListener('keydown', onKey);
      rail.removeEventListener('pointerdown', onPointerDown); rail.removeEventListener('pointermove', onPointerMove); rail.removeEventListener('pointerup', endDrag); rail.removeEventListener('pointercancel', endDrag); rail.removeEventListener('lostpointercapture', endDrag);
      dialog.removeEventListener('wheel', onWheel); window.removeEventListener('pagehide', pagehide); window.removeEventListener('resize', resize); window.removeEventListener('blur', blur);
    },
  };
}
