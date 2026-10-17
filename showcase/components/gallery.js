'use strict';
function initGalleryDemo() {
  // Gallery geometry and gesture thresholds for the demo artwork.
  const galleryDialog = $('#galleryDialog'),
    galleryRail = $('#galleryRail');
  const galleryFiles = ['landscape.svg', 'landscape-dusk.svg', 'landscape-sand.svg'];
  let galleryIndex = 0,
    galleryOrigin = null,
    galleryClosing = false,
    zoom = null,
    drag = null,
    suppressClick = false,
    galleryOpened = false,
    galleryTransition = null,
    revision = 0;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const gallerySlides = galleryFiles.map((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'gallery-slide';
    DemoI18n.attr(slide, 'aria-label', () => DemoI18n.t('Image {0}, click to zoom', i + 1));
    slide.tabIndex = -1;
    const img = document.createElement('img');
    img.src = src;
    DemoI18n.attr(
      img,
      'alt',
      () => [DemoI18n.t('Green mountains'), DemoI18n.t('Dusk'), DemoI18n.t('Sand dunes')][i]
    );
    img.draggable = false;
    slide.append(img);
    galleryRail.append(slide);
    slide.onclick = (e) => {
      if (galleryClosing || suppressClick) return;
      if (i !== galleryIndex) {
        const close = $('#closeGallery').getBoundingClientRect();
        const nearClose = e.clientX >= close.left - 16 && e.clientX <= close.right + 16 &&
          e.clientY >= close.top - 16 && e.clientY <= close.bottom + 16;
        if (!zoom && !nearClose) { e.stopPropagation(); switchGallery(i); }
        return;
      }
      if (e.target === img || (e.target === slide && e.detail === 0 && !e.pointerType)) {
        e.stopPropagation();
        toggleZoom(e.target === img ? e : null);
      }
    };
    slide.onkeydown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleZoom();
      }
    };
    return slide;
  });
  const currentSlide = () => gallerySlides[galleryIndex],
    currentImage = () => currentSlide().querySelector('img');
  function measureZoom() {
    const img = currentImage();
    if (img.getAnimations?.().some((animation) => animation.playState === 'running')) return null;
    const fit = img.getBoundingClientRect(), viewport = $('#galleryViewport').getBoundingClientRect();
    if (!fit.width || !fit.height) return null;
    return {
      fitWidth: fit.width, fitHeight: fit.height,
      fitCenterX: fit.left + fit.width / 2, fitCenterY: fit.top + fit.height / 2,
      maxScale: Math.max(img.naturalWidth / fit.width, 2),
      viewportWidth: viewport.width, viewportHeight: viewport.height
    };
  }
  function paintZoom(value) {
    if (value) currentImage().style.transform = `translate(${value.tx}px, ${value.ty}px) scale(${value.scale})`;
    else currentImage().style.removeProperty('transform');
  }
  function setZoom(value) {
    zoom = value;
    paintZoom(value);
    currentSlide().classList.toggle('zoomed', !!value);
    currentSlide().setAttribute('aria-pressed', String(!!value));
  }
  function resetZoom() { setZoom(null); }
  function toggleZoom(point = null) {
    if (drag) return;
    if (zoom) resetZoom();
    else {
      const fit = measureZoom();
      if (fit) setZoom(GalleryZoom.clickZoom(fit, point));
    }
  }
  function switchGallery(i, focus = true) {
    const next = Math.max(0, Math.min(gallerySlides.length - 1, i));
    if (galleryDialog.open && next === galleryIndex) return;
    endGalleryDrag();
    resetZoom();
    galleryIndex = next;
    gallerySlides.forEach((s, j) => {
      s.classList.toggle('current', j === galleryIndex);
      s.tabIndex = j === galleryIndex ? 0 : -1;
      s.setAttribute('aria-hidden', String(j !== galleryIndex));
      if (j === galleryIndex) {
        s.setAttribute('role', 'button');
        s.setAttribute('aria-pressed', 'false');
      } else {
        s.removeAttribute('role');
        s.removeAttribute('aria-pressed');
      }
    });
    const rtl = getComputedStyle(galleryDialog).direction === 'rtl';
    galleryRail.style.transform = rtl
      ? `translateX(calc(-12.5vw + ${galleryIndex * 75}vw + ${galleryIndex * 32}px))`
      : `translateX(calc(12.5vw - ${galleryIndex * 75}vw - ${galleryIndex * 32}px))`;
    DemoI18n.text($('#galleryCount'), () => DemoI18n.t('{0} of {1}', galleryIndex + 1, gallerySlides.length));
    $('#galleryPrev').setAttribute('aria-disabled', String(galleryIndex === 0));
    $('#galleryNext').setAttribute('aria-disabled', String(galleryIndex === gallerySlides.length - 1));
    $('#galleryFilename').textContent = galleryFiles[galleryIndex];
    $('#galleryFilename').title = galleryFiles[galleryIndex];
    if (focus && !document.activeElement?.closest('button, a')) currentSlide().focus({ preventScroll: true });
  }
  function setGalleryOpen(open) {
    galleryOpened = open;
    galleryClosing = !open;
    const current = ++revision;
    galleryTransition?.skipTransition();
    galleryTransition = null;
    const root = document.documentElement;
    root.classList.remove('gallery-crossfade');
    const render = () => {
      if (revision !== current) return;
      if (open) {
        galleryRail.style.transition = 'none';
        galleryDialog.showModal();
        void galleryRail.offsetWidth;
        galleryRail.style.transition = '';
      } else {
        endGalleryDrag();
        resetZoom();
        const focused = document.activeElement;
        const outsideInput = !galleryDialog.contains(focused) &&
          focused?.matches('input:not([disabled]), textarea:not([disabled]), [contenteditable]:not([contenteditable="false"])');
        galleryDialog.close();
        if (outsideInput && focused.isConnected) focused.focus({ preventScroll: true });
        else if (galleryOrigin?.isConnected) galleryOrigin.focus({ preventScroll: true });
      }
    };
    const finish = () => {
      if (revision !== current) return;
      root.classList.remove('gallery-crossfade');
      galleryTransition = null;
      galleryClosing = false;
    };
    if (motion.matches || typeof document.startViewTransition !== 'function') {
      render();
      finish();
      return;
    }
    // Gallery items without originEl use a root crossfade.
    root.classList.add('gallery-crossfade');
    try {
      galleryTransition = document.startViewTransition(render);
      galleryTransition.ready.catch(() => {});
      galleryTransition.updateCallbackDone.catch(() => {});
      galleryTransition.finished.catch(() => {}).finally(finish);
    } catch {
      render();
      finish();
    }
  }
  function openGallery(i, origin) {
    if (galleryOpened) return;
    galleryOrigin = origin;
    switchGallery(i, false);
    setGalleryOpen(true);
  }
  function closeGallery() {
    if (!galleryOpened) return;
    setGalleryOpen(false);
  }
  motion.addEventListener('change', () => {
    if (motion.matches) galleryTransition?.skipTransition();
  });
  $$('[data-gallery]').forEach(
    (b) => (b.onclick = () => openGallery(Number(b.dataset.gallery), b))
  );
  $('#closeGallery').onclick = (e) => { e.stopPropagation(); closeGallery(); };
  $('#galleryPrev').onclick = (e) => { e.stopPropagation(); if (galleryIndex > 0) switchGallery(galleryIndex - 1); };
  $('#galleryNext').onclick = (e) => { e.stopPropagation(); if (galleryIndex < gallerySlides.length - 1) switchGallery(galleryIndex + 1); };
  $('.gallery-bottom').onclick = (e) => e.stopPropagation();
  galleryDialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeGallery();
  });
  galleryDialog.addEventListener('keydown', (e) => {
    if (galleryClosing || e.defaultPrevented) return;
    if (e.key === 'Tab') {
      const stops = [$('#closeGallery'), currentSlide(), $('#galleryPrev'), $('#galleryNext')];
      const at = stops.indexOf(document.activeElement);
      e.preventDefault();
      stops[(at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
      return;
    }
    const rtl = getComputedStyle(galleryDialog).direction === 'rtl';
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      switchGallery(
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? gallerySlides.length - 1
            : galleryIndex + (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight') ? 1 : -1)
      );
    }
  });
  galleryDialog.addEventListener('click', (e) => {
    if (suppressClick) e.stopPropagation();
  }, true);
  galleryDialog.addEventListener('click', () => {
    if (galleryClosing) return;
    if (zoom) resetZoom();
    else closeGallery();
  });
  galleryRail.addEventListener('pointerdown', (e) => {
    if (!zoom || e.button !== 0 || e.target !== currentImage() || drag) return;
    suppressClick = false;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, tx: zoom.tx, ty: zoom.ty, moved: false };
    currentImage().setPointerCapture(e.pointerId);
  });
  galleryRail.addEventListener('pointermove', (e) => {
    if (!drag || !zoom || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    drag.tx = GalleryZoom.clamp(zoom.tx + dx, zoom.maxTx);
    drag.ty = GalleryZoom.clamp(zoom.ty + dy, zoom.maxTy);
    paintZoom({ ...zoom, tx: drag.tx, ty: drag.ty });
  });
  function endGalleryDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const ended = drag;
    drag = null;
    if (ended.moved) {
      suppressClick = true;
      if (zoom) setZoom({ ...zoom, tx: ended.tx, ty: ended.ty, idealTx: ended.tx, idealTy: ended.ty });
      setTimeout(() => (suppressClick = false), 0);
    }
    if (currentImage().hasPointerCapture(ended.id)) currentImage().releasePointerCapture(ended.id);
  }
  galleryRail.addEventListener('pointerup', endGalleryDrag);
  galleryRail.addEventListener('pointercancel', endGalleryDrag);
  galleryDialog.addEventListener('wheel', (e) => {
    if (galleryClosing || drag) return;
    const viewport = $('#galleryViewport');
    const inside = !(e.target instanceof Element) || viewport.contains(e.target) || $('.gallery-header').contains(e.target);
    const unit = e.deltaMode === 0 ? 1 : 16;
    if (e.ctrlKey) {
      e.preventDefault();
      if (!inside) return;
      const fit = zoom || measureZoom();
      if (!fit) return;
      const next = GalleryZoom.nextScale(zoom?.scale ?? 1, fit.maxScale, e.deltaY, e.deltaMode);
      if (next === 1) { if (zoom) resetZoom(); return; }
      if (zoom && next === zoom.scale) return;
      setZoom(GalleryZoom.scaleAt(fit, zoom, next, e));
    } else if (inside && zoom) {
      e.preventDefault();
      const unitX = e.deltaMode === 2 ? viewport.clientWidth || unit : unit;
      const unitY = e.deltaMode === 2 ? viewport.clientHeight || unit : unit;
      const tx = GalleryZoom.clamp(zoom.tx - e.deltaX * unitX, zoom.maxTx);
      const ty = GalleryZoom.clamp(zoom.ty - e.deltaY * unitY, zoom.maxTy);
      if (tx !== zoom.tx || ty !== zoom.ty) setZoom({ ...zoom, tx, ty, idealTx: tx, idealTy: ty });
    }
  }, { passive: false });
  window.addEventListener('pagehide', () => {
    ++revision;
    galleryTransition?.skipTransition();
    galleryTransition = null;
    document.documentElement.classList.remove('gallery-crossfade');
    galleryOpened = false;
    galleryClosing = false;
    endGalleryDrag();
    resetZoom();
    galleryDialog.close();
  });
  window.addEventListener('resize', () => {
    if (zoom) resetZoom();
  });
}
