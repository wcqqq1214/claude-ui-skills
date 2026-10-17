# Image gallery, zoom and pan

Use for: several images sharing one overlay, with neighbor previews, keyboard paging and bounded zoom/pan. For a single thumbnail opening into a preview, use [image preview](images.md).

## Code

[HTML](../../showcase/index.html#gallery) · [gallery.js](../../showcase/components/gallery.js) · [gallery.css](../../showcase/components/gallery.css) · [gallery-zoom.js](../../showcase/gallery-zoom.js)

- `initGalleryDemo()` builds the slides and binds the dialog.
- Read `switchGallery()`, `setZoom()`, `resetZoom()` and the wheel/pointer handlers with `GalleryZoom.nextScale`, `clickZoom`, `scaleAt` and `bound`.
- The header, filename and navigation styles are scoped in gallery.css.

## Parameters

| Part | Value |
| --- | --- |
| Image corners | 16px |
| Controls | 32px close, 36px paging |
| Filename | Left of the bottom bar; moves above the centered navigation below 40rem |
| Slide movement | 300ms |
| Open / close | 180ms crossfade |
| Maximum zoom | `max(natural width / fitted width, 2)`: 2 is a floor, not a cap |
| Wheel zoom | First step at least 1.25; exponential gain .01; resets at ≤ 1.05 while shrinking |
| Wheel deltas | Ctrl-wheel converts non-pixel deltas × 16; page-mode panning converts with the viewport size |
| Drag threshold | 4px separates dragging from clicking |

## Rules

- Changing slide resets zoom and pan and updates neighbors, controls, caption and focus together.
- A neighbor click selects that slide while fitted; while zoomed, it first resets the current image.
- Keep the pointer's focal point fixed while scaling.
- `GalleryZoom.bound()` limits pan from the fitted size, viewport and scale. Only a zoomed image captures the pointer.
- ArrowLeft/ArrowRight page, Escape closes, and focus returns to the opener.

## Check

- [ ] Neighbor slides, fitted and zoomed
- [ ] Keyboard zoom and reset
- [ ] Drag versus click around the 4px threshold
- [ ] Close and focus return
- [ ] Narrow layout below 40rem

Related component guides: [component index](../components.md).
