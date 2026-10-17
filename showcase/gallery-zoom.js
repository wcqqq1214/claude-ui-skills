'use strict';
// Zoom geometry and scale transitions used by components/gallery.js.
// Page deltas use 16 for zoom; viewport-sized units belong to panning only.
const GalleryZoom = {
  clamp(value, limit) { return Math.min(limit, Math.max(-limit, value)); },
  bound(size, viewport, scale) {
    const visible = Math.min(size * scale, viewport * .7);
    return Math.max(0, (size * scale + viewport) / 2 - visible) *
      Math.min(1, Math.max(0, (scale - 1.05) / .95));
  },
  scaleAt(fit, previous, scale, point) {
    const before = previous || { scale: 1, idealTx: 0, idealTy: 0 };
    const maxTx = GalleryZoom.bound(fit.fitWidth, fit.viewportWidth, scale);
    const maxTy = GalleryZoom.bound(fit.fitHeight, fit.viewportHeight, scale);
    const x = point ? point.clientX - fit.fitCenterX : 0;
    const y = point ? point.clientY - fit.fitCenterY : 0;
    const ratio = scale / before.scale;
    const idealTx = x - (x - before.idealTx) * ratio;
    const idealTy = y - (y - before.idealTy) * ratio;
    const tx = GalleryZoom.clamp(idealTx, maxTx), ty = GalleryZoom.clamp(idealTy, maxTy);
    return {
      ...fit, scale, tx, ty, maxTx, maxTy,
      idealTx: maxTx < GalleryZoom.bound(fit.fitWidth, fit.viewportWidth, before.scale) ? tx : idealTx,
      idealTy: maxTy < GalleryZoom.bound(fit.fitHeight, fit.viewportHeight, before.scale) ? ty : idealTy
    };
  },
  clickZoom(fit, point) {
    const value = GalleryZoom.scaleAt(fit, null, fit.maxScale, point);
    const tx = GalleryZoom.clamp(value.tx, Math.max(0, (fit.fitWidth * fit.maxScale - fit.viewportWidth) / 2));
    const ty = GalleryZoom.clamp(value.ty, Math.max(0, (fit.fitHeight * fit.maxScale - fit.viewportHeight) / 2));
    return { ...value, tx, ty, idealTx: tx, idealTy: ty };
  },
  nextScale(scale, maxScale, deltaY, deltaMode) {
    const factor = Math.exp(-deltaY * (deltaMode === 0 ? 1 : 16) * .01);
    const desired = Math.min(Math.max(scale * factor, 1), maxScale);
    if (scale === 1 && desired === 1) return 1;
    const next = scale === 1 ? Math.min(Math.max(desired, 1.25), maxScale) : desired;
    return factor < 1 && next <= 1.05 ? 1 : next;
  }
};
if (typeof module !== 'undefined') module.exports = GalleryZoom;
