# Image gallery, zoom and pan

Use this when several images share an overlay with neighboring previews, keyboard navigation and bounded zoom/pan. For a single thumbnail transition alone, use [image preview](images.md).

## Read the running code

[HTML](../../showcase/index.html#gallery) · [JS](../../showcase/components/gallery.js) · [CSS](../../showcase/components/gallery.css)

`initGalleryDemo()` builds slides and binds the dialog. Read `switchGallery()`, `applyZoom()`, `resetZoom()` and the wheel/pointer handlers with [gallery-zoom.js](../../showcase/gallery-zoom.js) (`GalleryZoom.nextScale`). Geometry helpers come from [shared.js](../../showcase/shared.js); `.image-close` is shared in [style.css](../../showcase/style.css).

## Design and adaptation

- Changing the current slide resets zoom/pan and updates neighbors, controls, caption and focus together. Slide movement takes 300ms. Neighbor clicks select rather than zoom.
- Maximum zoom is `max(original width / fitted width, 2)`: 2 is a floor, not a cap. Initial wheel zoom is at least 1.25, with exponential gain .01; reset at ≤1.05 only while shrinking.
- Ctrl-wheel zoom converts non-pixel deltas with factor 16. Ordinary PAGE-mode panning uses viewport dimensions instead. Preserve this distinction and keep the pointer's focal point stable while scaling.
- `maxPan()` bounds pan using fitted size, viewport and scale. Only zoomed images capture the pointer; a 4px movement threshold separates dragging from clicking. ArrowLeft/ArrowRight navigation and Escape remain available.

Three local SVGs, native-dialog geometry and local focus/resize handling are demo choices. Numerical checks do not establish physical Ctrl-wheel or long-gallery behavior in Claude. Check neighboring slides, keyboard zoom/reset, drag-versus-click, close and focus return.
