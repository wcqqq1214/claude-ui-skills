'use strict';
// Wheel scale transition used by components/gallery.js.
// Page deltas use 16 for zoom; viewport-sized units belong to panning only.
const GalleryZoom = {
  nextScale(scale, maxScale, deltaY, deltaMode) {
    const factor = Math.exp(-deltaY * (deltaMode === 0 ? 1 : 16) * .01);
    const desired = Math.min(Math.max(scale * factor, 1), maxScale);
    if (scale === 1 && desired === 1) return 1;
    const next = scale === 1 ? Math.min(Math.max(desired, 1.25), maxScale) : desired;
    return factor < 1 && next <= 1.05 ? 1 : next;
  }
};
if (typeof module !== 'undefined') module.exports = GalleryZoom;
