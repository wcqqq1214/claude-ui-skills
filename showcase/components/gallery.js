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
    galleryAnimation = null;
  const gallerySlides = galleryFiles.map((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'gallery-slide';
    slide.setAttribute('role', 'button');
    DemoI18n.attr(slide, 'aria-label', () => DemoI18n.t('Image {0}, click to zoom', i + 1));
    slide.setAttribute('aria-pressed', 'false');
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
    resetZoom();
    galleryIndex = Math.max(0, Math.min(gallerySlides.length - 1, i));
    gallerySlides.forEach((s, j) => {
      s.classList.toggle('current', j === galleryIndex);
      s.tabIndex = j === galleryIndex ? 0 : -1;
      s.setAttribute('aria-pressed', 'false');
    });
    galleryRail.style.transform = `translateX(calc(12.5vw - ${galleryIndex * 75}vw - ${galleryIndex * 32}px))`;
    $('#galleryCount').textContent = `${galleryIndex + 1} / ${gallerySlides.length}`;
    $('#galleryPrev').disabled = galleryIndex === 0;
    $('#galleryNext').disabled = galleryIndex === gallerySlides.length - 1;
    if (focus) currentSlide().focus({ preventScroll: true });
  }
  async function openGallery(i, origin) {
    if (galleryDialog.open) return;
    galleryOrigin = origin;
    galleryClosing = false;
    galleryRail.style.transition = 'none';
    switchGallery(i, false);
    galleryDialog.showModal();
    await currentImage()
      .decode()
      .catch(() => {});
    await nextFrame();
    const from = origin.querySelector('img').getBoundingClientRect(),
      to = currentImage().getBoundingClientRect();
    galleryAnimation = currentImage().animate(
      [{ transform: imageTransform(from, to) }, { transform: 'none' }],
      { duration: 350, easing: snap }
    );
    await galleryAnimation.finished.catch(() => {});
    galleryRail.style.transition = '';
    if (galleryDialog.open && !galleryClosing) currentSlide().focus({ preventScroll: true });
  }
  async function closeGallery() {
    if (galleryClosing || !galleryDialog.open) return;
    galleryClosing = true;
    galleryAnimation?.cancel();
    const target = $(`[data-gallery="${galleryIndex}"]`) || galleryOrigin,
      img = currentImage(),
      scale = galleryScale,
      x = panX,
      y = panY;
    img.style.transform = 'none';
    const base = img.getBoundingClientRect(),
      to = target.querySelector('img').getBoundingClientRect();
    img.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    galleryAnimation = img.animate(
      [{ transform: img.style.transform }, { transform: imageTransform(to, base) }],
      { duration: 250, easing: snap, fill: 'forwards' }
    );
    await galleryAnimation.finished.catch(() => {});
    galleryDialog.close();
    galleryAnimation.cancel();
    resetZoom();
    galleryClosing = false;
    if (galleryOrigin?.isConnected) galleryOrigin.focus({ preventScroll: true });
  }
  $$('[data-gallery]').forEach(
    (b) => (b.onclick = () => openGallery(Number(b.dataset.gallery), b))
  );
  $('#closeGallery').onclick = closeGallery;
  $('#galleryPrev').onclick = () => switchGallery(galleryIndex - 1);
  $('#galleryNext').onclick = () => switchGallery(galleryIndex + 1);
  galleryDialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeGallery();
  });
  galleryDialog.addEventListener('keydown', (e) => {
    if (galleryClosing) return;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      switchGallery(
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? gallerySlides.length - 1
            : galleryIndex + (e.key === 'ArrowRight' ? 1 : -1)
      );
    }
  });
  galleryDialog.addEventListener('click', (e) => {
    if (e.target === galleryDialog || e.target === galleryRail) {
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
      if (galleryClosing) return;
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
  window.addEventListener('resize', () => {
    if (galleryDialog.open) resetZoom();
  });
}
