'use strict';
function initGalleryDemo() {
  // Gallery geometry and gesture thresholds for the demo artwork.
  const galleryDialog = $('#galleryDialog'),
    galleryRail = $('#galleryRail');
  const galleryFiles = ['landscape.svg', 'landscape-dusk.svg', 'landscape-sand.svg'];
  let galleryIndex = 0,
    galleryOrigin = null,
    galleryClosing = false,
    galleryScale = 1,
    panX = 0,
    panY = 0,
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
        switchGallery(i);
        return;
      }
      if (e.target === img) toggleZoom();
      else if (galleryScale > 1) resetZoom();
      else closeGallery();
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
  function maxZoom() {
    const img = currentImage();
    return Math.max(img.naturalWidth / Math.max(img.offsetWidth, 1), 2);
  }
  function maxPan(size, viewport, scale) {
    const visible = Math.min(size * scale, viewport * 0.7);
    return (
      Math.max(0, (size * scale + viewport) / 2 - visible) *
      Math.min(1, Math.max(0, (scale - 1.05) / 0.95))
    );
  }
  function applyZoom() {
    const img = currentImage();
    panX = Math.min(
      maxPan(img.offsetWidth, innerWidth, galleryScale),
      Math.max(-maxPan(img.offsetWidth, innerWidth, galleryScale), panX)
    );
    panY = Math.min(
      maxPan(img.offsetHeight, innerHeight, galleryScale),
      Math.max(-maxPan(img.offsetHeight, innerHeight, galleryScale), panY)
    );
    img.style.transform = `translate(${panX}px,${panY}px) scale(${galleryScale})`;
    currentSlide().classList.toggle('zoomed', galleryScale > 1);
    currentSlide().setAttribute('aria-pressed', String(galleryScale > 1));
  }
  function resetZoom() {
    galleryScale = 1;
    panX = 0;
    panY = 0;
    applyZoom();
  }
  function toggleZoom() {
    if (galleryScale > 1) resetZoom();
    else {
      galleryScale = maxZoom();
      applyZoom();
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
    $('#galleryCount').textContent = `${galleryIndex + 1} / ${gallerySlides.length}`;
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
          focused?.matches('input:not([disabled]), textarea:not([disabled]), [contenteditable="true"]');
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
  $('#closeGallery').onclick = closeGallery;
  $('#galleryPrev').onclick = () => { if (galleryIndex > 0) switchGallery(galleryIndex - 1); };
  $('#galleryNext').onclick = () => { if (galleryIndex < gallerySlides.length - 1) switchGallery(galleryIndex + 1); };
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
    if (e.target === galleryDialog || e.target === galleryRail || e.target === $('#galleryViewport') || e.target === $('.gallery-bottom-shade')) {
      if (galleryScale > 1) resetZoom();
      else closeGallery();
    }
  });
  galleryRail.addEventListener('pointerdown', (e) => {
    if (galleryScale <= 1 || e.button !== 0 || e.target !== currentImage()) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, px: panX, py: panY, moved: false };
    currentImage().setPointerCapture(e.pointerId);
  });
  galleryRail.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) <= 4) return;
    drag.moved = true;
    currentSlide().classList.add('dragging');
    panX = drag.px + dx;
    panY = drag.py + dy;
    applyZoom();
  });
  function endGalleryDrag() {
    if (!drag) return;
    suppressClick = drag.moved;
    const id = drag.id;
    drag = null;
    currentSlide().classList.remove('dragging');
    if (currentImage().hasPointerCapture(id)) currentImage().releasePointerCapture(id);
    setTimeout(() => (suppressClick = false), 0);
  }
  galleryRail.addEventListener('pointerup', endGalleryDrag);
  galleryRail.addEventListener('pointercancel', endGalleryDrag);
  galleryDialog.addEventListener(
    'wheel',
    (e) => {
      if (galleryClosing || drag) return;
      if ($('.gallery-bottom').contains(e.target)) {
        if (e.ctrlKey) e.preventDefault();
        return;
      }
      const unitX = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerWidth : 1,
        unitY = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
      if (e.ctrlKey) {
        e.preventDefault();
        const old = galleryScale,
          next = GalleryZoom.nextScale(old, maxZoom(), e.deltaY, e.deltaMode);
        if (next === 1) {
          resetZoom();
          return;
        }
        galleryScale = next;
        const rect = currentSlide().getBoundingClientRect(),
          px = e.clientX - (rect.left + rect.width / 2),
          py = e.clientY - (rect.top + rect.height / 2),
          ratio = galleryScale / old;
        panX = px - (px - panX) * ratio;
        panY = py - (py - panY) * ratio;
        applyZoom();
      } else if (galleryScale > 1) {
        e.preventDefault();
        panX -= e.deltaX * unitX;
        panY -= e.deltaY * unitY;
        applyZoom();
      }
    },
    { passive: false }
  );
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
    if (galleryDialog.open) resetZoom();
  });
}
