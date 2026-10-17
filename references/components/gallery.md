# Image gallery, zoom and pan

Use this when several images share an overlay with neighboring previews, keyboard navigation and bounded zoom/pan. For a single thumbnail transition alone, use [image preview](images.md).

## Read the running code

[HTML](../../showcase/index.html#gallery) · [JS](../../showcase/components/gallery.js) · [CSS](../../showcase/components/gallery.css)

`initGalleryDemo()` builds slides and binds the dialog. Read `switchGallery()`, `setZoom()`, `resetZoom()` and the wheel/pointer handlers with [gallery-zoom.js](../../showcase/gallery-zoom.js) (`nextScale`, `clickZoom`, `scaleAt`). The gallery header, filename and navigation are scoped in its CSS.

## Design and adaptation

- The preview has 16px image corners, a 32px close action and 36px paging actions. The filename sits at the left of the bottom bar, moving above its centered navigation below 40rem.
- Changing the current slide resets zoom/pan and updates neighbors, controls, caption and focus together. Slide movement takes 300ms; opening and closing use a 180ms crossfade. Neighbor clicks select while fitted; while zoomed they first reset the current image.
- Maximum zoom is `max(original width / fitted width, 2)`: 2 is a floor, not a cap. Initial wheel zoom is at least 1.25, with exponential gain .01; reset at ≤1.05 only while shrinking.
- Ctrl-wheel zoom converts non-pixel deltas with factor 16. Ordinary PAGE-mode panning uses viewport dimensions instead. Preserve this distinction and keep the pointer's focal point stable while scaling.
- `GalleryZoom.bound()` bounds pan using fitted size, viewport and scale. Only zoomed images capture the pointer; a 4px movement threshold separates dragging from clicking. ArrowLeft/ArrowRight navigation and Escape remain available.

Three local SVGs with their filenames, native-dialog focus handling and local zoom/pan state are demo choices. Numerical checks do not establish physical Ctrl-wheel or long-gallery behavior in Claude. Check neighboring slides, keyboard zoom/reset, drag-versus-click, close and focus return.
