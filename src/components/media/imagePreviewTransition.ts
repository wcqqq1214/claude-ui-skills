/** Native modal and shared-element geometry. React owns both image trees. */
function radius(element: HTMLElement | null, fallback: string) {
  for (let depth = 0; element && depth < 5; depth++, element = element.parentElement) {
    const style = getComputedStyle(element);
    if ((element.tagName === 'IMG' || ['hidden', 'clip'].includes(style.overflow)) && style.borderRadius && style.borderRadius !== '0px') return style.borderRadius;
  }
  return fallback;
}
function position(value: string, space: number) {
  const match = /^(-?\d*\.?\d+)(px|%)$/.exec(value);
  return match ? Number(match[1]) * (match[2] === '%' ? space / 100 : 1) : null;
}
function sourceDecoration(image: HTMLImageElement, visible: boolean) {
  let sourceRadius = radius(image, '.5rem');
  const plain = { inset: '0%', radius: sourceRadius };
  if (!visible || !(image.naturalWidth > 0 && image.naturalHeight > 0)) return plain;
  const style = getComputedStyle(image);
  if (!['contain', 'scale-down'].includes(style.objectFit)) return plain;
  const rect = image.getBoundingClientRect(), number = (value: string) => parseFloat(value) || 0;
  const left = number(style.borderLeftWidth) + number(style.paddingLeft), top = number(style.borderTopWidth) + number(style.paddingTop);
  const width = rect.width - left - number(style.borderRightWidth) - number(style.paddingRight);
  const height = rect.height - top - number(style.borderBottomWidth) - number(style.paddingBottom);
  if (!(width > 0 && height > 0)) return plain;
  let scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  if (style.objectFit === 'scale-down') scale = Math.min(scale, 1);
  const freeX = width - image.naturalWidth * scale, freeY = height - image.naturalHeight * scale;
  if (freeX < .5 && freeY < .5) return plain;
  const [x = '50%', y = '50%'] = style.objectPosition.trim().split(/\s+/);
  const offsetX = position(x, freeX), offsetY = position(y, freeY);
  if (offsetX === null || offsetY === null) return plain;
  const inset = {
    top: Math.max(0, top + offsetY), right: Math.max(0, rect.width - left - offsetX - image.naturalWidth * scale),
    bottom: Math.max(0, rect.height - top - offsetY - image.naturalHeight * scale), left: Math.max(0, left + offsetX),
  };
  const pixels = /^(\d*\.?\d+)px$/.exec(sourceRadius);
  sourceRadius = pixels ? `${Number(Math.max(0, Number(pixels[1]) - Math.max(Math.min(inset.left, inset.right), Math.min(inset.top, inset.bottom))).toFixed(3))}px` : '0px';
  const percent = (value: number, size: number) => `${Number((100 * value / size).toFixed(3))}%`;
  return { radius: sourceRadius, inset: [percent(inset.top, rect.height), percent(inset.right, rect.width), percent(inset.bottom, rect.height), percent(inset.left, rect.width)].join(' ') };
}

interface PreviewElements {
  origin: HTMLImageElement;
  target: HTMLDivElement;
  dialog: HTMLDialogElement;
  name: string;
  onChange(open: boolean): void;
}
export function createImagePreview({ origin, target, dialog, name, onChange }: PreviewElements) {
  let opened = false, disposed = false, revision = 0, transition: ViewTransition | null = null;
  let sheet: HTMLStyleElement | null = null, returnFocus: Element | null = null;
  const originalVisibility = origin.style.visibility;
  // Restore only the names this controller temporarily replaces.
  const names = [origin, target].map(element => ({ element, value: element.style.getPropertyValue('view-transition-name'), priority: element.style.getPropertyPriority('view-transition-name') }));
  function clearNames() {
    for (const { element, value, priority } of names) {
      if (element.style.getPropertyValue('view-transition-name') !== name) continue;
      if (value) element.style.setProperty('view-transition-name', value, priority);
      else element.style.removeProperty('view-transition-name');
    }
  }
  function clearTransition() {
    transition?.skipTransition(); transition = null;
    clearNames(); sheet?.remove(); sheet = null;
  }
  function render(open: boolean, restoreFocus = true) {
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      const focused = document.activeElement;
      const outside = focused instanceof HTMLElement && focused !== document.body && !dialog.contains(focused);
      origin.style.visibility = originalVisibility;
      dialog.close();
      if (restoreFocus) {
        const destination = outside ? focused : returnFocus;
        if (destination instanceof HTMLElement && destination.isConnected) destination.focus({ preventScroll: true });
      }
      returnFocus = null;
    }
  }
  function setOpen(open: boolean) {
    if (disposed || opened === open) return;
    if (open && !dialog.open) returnFocus = document.activeElement;
    opened = open;
    const current = ++revision;
    clearTransition();
    onChange(open);
    if (disposed || current !== revision) return;
    if (typeof document.startViewTransition !== 'function' || (!open && !dialog.open)) { render(open); return; }
    const rect = origin.getBoundingClientRect();
    const visible = origin.isConnected && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
    const decoration = sourceDecoration(origin, open || visible), duration = open ? 350 : 250;
    // Each instance/transition owns its stylesheet: no persistent html classes,
    // global CSS variables, or disabling the host's named transition elements.
    const ownSheet = document.createElement('style');
    ownSheet.dataset.cuiImageTransition = name;
    ownSheet.textContent = `
      ::view-transition-group(${name}) { animation-duration: ${duration}ms; animation-timing-function: cubic-bezier(.32,.72,0,1); ${!open && !visible ? 'animation-name: cui-image-preview-fade-out;' : ''} }
      ::view-transition-image-pair(${name}) {
        --cui-image-source-inset: ${decoration.inset}; --cui-image-source-radius: ${decoration.radius}; --cui-image-target-radius: ${radius(target, '.375rem')};
        isolation: auto; overflow: clip; animation: ${duration}ms cubic-bezier(.32,.72,0,1) both cui-image-preview-decoration-${open ? 'in' : 'out'};
      }
      ::view-transition-old(${name}), ::view-transition-new(${name}) { mix-blend-mode: normal; object-fit: cover; width: 100%; height: 100%; animation: none; }
      ::view-transition-${open ? 'old' : 'new'}(${name}) { display: none; }
      ::view-transition-group(root) { animation-duration: ${duration}ms !important; }
    `;
    sheet = ownSheet; document.head.append(ownSheet);
    (open ? origin : target).style.setProperty('view-transition-name', name, 'important');
    const update = () => {
      if (current !== revision || disposed) return;
      render(open); clearNames();
      if (open) {
        target.style.setProperty('view-transition-name', name, 'important');
        // Target is now laid out, so inherited/overridden corner values are measurable.
        ownSheet.textContent += `::view-transition-image-pair(${name}) { --cui-image-target-radius: ${radius(target, '.375rem')}; }`;
        origin.style.visibility = 'hidden';
      } else if (visible) origin.style.setProperty('view-transition-name', name, 'important');
    };
    try {
      const next = document.startViewTransition(update); transition = next;
      void next.ready.catch(() => {}); void next.updateCallbackDone.catch(() => {});
      void next.finished.catch(() => {}).finally(() => {
        ownSheet.remove();
        if (current !== revision) return;
        clearNames(); sheet = null; transition = null;
      });
    } catch {
      update(); clearNames(); ownSheet.remove(); sheet = null;
    }
  }
  function reset(notify = true) {
    ++revision; clearTransition();
    const wasOpen = opened; opened = false;
    render(false, false);
    if (notify && wasOpen) onChange(false);
  }
  const pagehide = () => reset();
  const closed = () => { if (!dialog.open && opened) setOpen(false); };
  window.addEventListener('pagehide', pagehide); dialog.addEventListener('close', closed);
  return {
    setOpen, reset,
    dispose() {
      disposed = true; reset(false);
      window.removeEventListener('pagehide', pagehide); dialog.removeEventListener('close', closed);
    },
  };
}
