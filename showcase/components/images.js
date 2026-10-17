'use strict';
function initImagesDemo() {
  const imageDialog = $('#imageDialog'), originButton = $('#imageOrigin'),
    origin = originButton.querySelector('img'), target = $('#imagePreviewSurface'),
    closeButton = $('#closeImage'), root = document.documentElement;
  const name = 'demo-image-preview', active = 'image-preview-active',
    closing = 'image-preview-closing', noOrigin = 'image-preview-no-origin';
  let opened = false, revision = 0, transition = null, returnFocus = null;

  function radius(element, fallback) {
    for (let depth = 0; element && depth < 5; depth++, element = element.parentElement) {
      const style = getComputedStyle(element);
      if ((element.tagName === 'IMG' || style.overflow === 'hidden' || style.overflow === 'clip') &&
          style.borderRadius !== '0px' && style.borderRadius !== '') return style.borderRadius;
    }
    return fallback;
  }
  function position(value, space) {
    const match = /^(-?\d*\.?\d+)(px|%)$/.exec(value);
    return match ? Number(match[1]) * (match[2] === '%' ? space / 100 : 1) : null;
  }
  function contentInset(image) {
    if (image.tagName !== 'IMG' || !(image.naturalWidth > 0 && image.naturalHeight > 0)) return null;
    const style = getComputedStyle(image);
    if (style.objectFit !== 'contain' && style.objectFit !== 'scale-down') return null;
    const rect = image.getBoundingClientRect(), number = value => parseFloat(value) || 0;
    const left = number(style.borderLeftWidth) + number(style.paddingLeft),
      top = number(style.borderTopWidth) + number(style.paddingTop),
      width = rect.width - left - number(style.borderRightWidth) - number(style.paddingRight),
      height = rect.height - top - number(style.borderBottomWidth) - number(style.paddingBottom);
    if (!(width > 0 && height > 0)) return null;
    let scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    if (style.objectFit === 'scale-down') scale = Math.min(scale, 1);
    const freeX = width - image.naturalWidth * scale, freeY = height - image.naturalHeight * scale;
    if (freeX < .5 && freeY < .5) return null;
    const [x = '50%', y = '50%'] = style.objectPosition.trim().split(/\s+/),
      offsetX = position(x, freeX), offsetY = position(y, freeY);
    if (offsetX === null || offsetY === null) return null;
    const inset = {
      top: Math.max(0, top + offsetY),
      right: Math.max(0, rect.width - left - offsetX - image.naturalWidth * scale),
      bottom: Math.max(0, rect.height - top - offsetY - image.naturalHeight * scale),
      left: Math.max(0, left + offsetX)
    };
    const percent = (value, size) => `${Number((100 * value / size).toFixed(3))}%`;
    return {
      inset: [percent(inset.top, rect.height), percent(inset.right, rect.width),
        percent(inset.bottom, rect.height), percent(inset.left, rect.width)].join(' '),
      bandX: Math.min(inset.left, inset.right), bandY: Math.min(inset.top, inset.bottom)
    };
  }
  function sourceDecoration(visible = true) {
    const inset = visible ? contentInset(origin) : null;
    let value = radius(origin, '.5rem');
    if (inset) {
      const pixels = /^(\d*\.?\d+)px$/.exec(value);
      value = pixels ? `${Number(Math.max(0, Number(pixels[1]) - Math.max(inset.bandX, inset.bandY)).toFixed(3))}px` : '0px';
    }
    root.style.setProperty('--image-preview-source-inset', inset?.inset ?? '0%');
    root.style.setProperty('--image-preview-source-radius', value);
  }
  function visibleOrigin() {
    const rect = origin.getBoundingClientRect();
    return origin.isConnected && rect.width > 0 && rect.height > 0 &&
      rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  }
  function clearNames() {
    origin.style.removeProperty('view-transition-name');
    target.style.removeProperty('view-transition-name');
  }
  function render(open) {
    if (open) {
      if (!imageDialog.open) imageDialog.showModal();
    } else {
      const focused = document.activeElement;
      const outside = focused && focused !== document.body && !imageDialog.contains(focused);
      origin.style.visibility = '';
      imageDialog.close();
      if (outside) {
        if (focused.isConnected && document.activeElement !== focused) focused.focus({ preventScroll: true });
      } else if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    }
  }
  function setOpen(open) {
    if (opened === open) return;
    if (open && !imageDialog.open) returnFocus = document.activeElement;
    opened = open;
    const current = ++revision;
    transition?.skipTransition();
    transition = null;
    clearNames();
    root.classList.remove(active, closing, noOrigin);
    const animate = typeof document.startViewTransition === 'function' &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches && (open || imageDialog.open);
    if (!animate) { render(open); return; }
    const visible = visibleOrigin();
    sourceDecoration(open || visible);
    root.classList.add(active);
    root.classList.toggle(closing, !open);
    root.classList.toggle(noOrigin, !open && !visible);
    (open ? origin : target).style.setProperty('view-transition-name', name, 'important');
    const update = () => {
      if (current !== revision) return;
      render(open);
      clearNames();
      if (open) {
        target.style.setProperty('view-transition-name', name, 'important');
        root.style.setProperty('--image-preview-target-radius', radius(target, '.375rem'));
        origin.style.visibility = 'hidden';
      } else if (visible) origin.style.setProperty('view-transition-name', name, 'important');
    };
    try {
      const next = document.startViewTransition(update);
      transition = next;
      next.ready.catch(() => {});
      next.updateCallbackDone.catch(() => {});
      next.finished.catch(() => {}).finally(() => {
        if (current !== revision) return;
        clearNames();
        root.classList.remove(active, closing, noOrigin);
        transition = null;
      });
    } catch {
      update();
      clearNames();
      root.classList.remove(active, closing, noOrigin);
    }
  }
  originButton.onclick = () => setOpen(true);
  closeButton.onclick = () => setOpen(false);
  target.onclick = () => setOpen(false);
  $('#imagePreviewFrame').onclick = event => event.stopPropagation();
  imageDialog.onclick = () => setOpen(false);
  imageDialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    // The preview's toolbar has only its close action in this branch.
    if (event.key === 'Tab') {
      event.preventDefault();
      closeButton.focus({ preventScroll: true });
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  imageDialog.addEventListener('cancel', event => { event.preventDefault(); setOpen(false); });
  window.addEventListener('pagehide', () => {
    ++revision;
    transition?.skipTransition();
    transition = null;
    opened = false;
    returnFocus = null;
    imageDialog.close();
    clearNames();
    root.classList.remove(active, closing, noOrigin);
    origin.style.visibility = '';
  });
}
