export interface GalleryFit {
  fitWidth: number; fitHeight: number; fitCenterX: number; fitCenterY: number;
  viewportWidth: number; viewportHeight: number; maxScale: number;
}
export interface GalleryZoomState extends GalleryFit {
  scale: number; tx: number; ty: number; maxTx: number; maxTy: number; idealTx: number; idealTy: number;
}
export interface GalleryPoint { clientX: number; clientY: number }
export function clamp(value: number, limit: number) { return Math.min(limit, Math.max(-limit, value)); }
export function bound(size: number, viewport: number, scale: number) {
  const visible = Math.min(size * scale, viewport * .7);
  return Math.max(0, (size * scale + viewport) / 2 - visible) * Math.min(1, Math.max(0, (scale - 1.05) / .95));
}
export function scaleAt(fit: GalleryFit, previous: GalleryZoomState | null, scale: number, point: GalleryPoint | null): GalleryZoomState {
  const before = previous || { scale: 1, idealTx: 0, idealTy: 0 };
  const maxTx = bound(fit.fitWidth, fit.viewportWidth, scale), maxTy = bound(fit.fitHeight, fit.viewportHeight, scale);
  const x = point ? point.clientX - fit.fitCenterX : 0, y = point ? point.clientY - fit.fitCenterY : 0, ratio = scale / before.scale;
  const idealTx = x - (x - before.idealTx) * ratio, idealTy = y - (y - before.idealTy) * ratio;
  const tx = clamp(idealTx, maxTx), ty = clamp(idealTy, maxTy);
  return { ...fit, scale, tx, ty, maxTx, maxTy,
    idealTx: maxTx < bound(fit.fitWidth, fit.viewportWidth, before.scale) ? tx : idealTx,
    idealTy: maxTy < bound(fit.fitHeight, fit.viewportHeight, before.scale) ? ty : idealTy };
}
export function clickZoom(fit: GalleryFit, point: GalleryPoint | null): GalleryZoomState {
  const value = scaleAt(fit, null, fit.maxScale, point);
  const tx = clamp(value.tx, Math.max(0, (fit.fitWidth * fit.maxScale - fit.viewportWidth) / 2));
  const ty = clamp(value.ty, Math.max(0, (fit.fitHeight * fit.maxScale - fit.viewportHeight) / 2));
  return { ...value, tx, ty, idealTx: tx, idealTy: ty };
}
/** Page/line units are both 16 for zoom; viewport-sized units apply only to pan. */
export function nextScale(scale: number, maxScale: number, deltaY: number, deltaMode: number) {
  const factor = Math.exp(-deltaY * (deltaMode === 0 ? 1 : 16) * .01);
  const desired = Math.min(Math.max(scale * factor, 1), maxScale);
  if (scale === 1 && desired === 1) return 1;
  const next = scale === 1 ? Math.min(Math.max(desired, 1.25), maxScale) : desired;
  return factor < 1 && next <= 1.05 ? 1 : next;
}
