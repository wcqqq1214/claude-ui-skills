# Image gallery, zoom and pan

Use for: several images sharing one overlay, with neighbor previews, keyboard paging and bounded zoom/pan. For a single thumbnail opening into a preview, use [image preview](images.md).

## Code

[Gallery.tsx](../../src/components/media/Gallery.tsx) · [native gestures](../../src/components/media/galleryInteraction.ts) · [zoom geometry](../../src/components/media/galleryZoom.ts) · [gallery.css](../../src/styles/gallery.css) · [React demo](../../demo/chapters/GalleryChapter.tsx)

Import `Gallery` from `src/index.ts` and the shared [style entry](../../src/styles/index.css); see [integration](../../demo/README.md). Each item has a stable `id`, `src`, optional `thumbnailSrc`, `alt` and `filename`. The host supplies all labels, including functions for the thumbnail, zoom action and count. `defaultValue` chooses the initial item; `onValueChange` reports selection changes. A ref exposes `open(id?)` and `close()`. `onOpenChange` reports opening/dismissal, without firing on mount. Use `active={false}` when hiding the host chapter.

React renders the thumbnails, slides, caption, count and ARIA state. The isolated controller owns modal focus, the 180ms native crossfade, wheel input and captured-pointer geometry. The pure TypeScript module implements scale, focal-point retention and bounds. Label updates preserve zoom; resource changes reset geometry while keeping the selected ID if it still exists. Removing the selected item chooses the first remaining one; emptying items closes the dialog. No demo IDs, translated globals or page-wide reset is required.

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
- `bound()` limits pan from the fitted size, viewport and scale. Only a zoomed image captures the pointer.
- ArrowLeft/ArrowRight page, Escape closes, and focus returns to the opener.

## Check

The [independent consumer suite](../../tests/react-gallery.browser.cjs) checks focal zoom, ideal pan, wheel units, pointer ownership, 3/4px drag boundaries, animation/zero-size measurement guards, neighbor reset/selection, close-button buffer, keyboard paging/focus, RTL, host item updates, multiple galleries, transition interruption and cleanup/fallback. Demo checks cover English/Chinese light/dark layouts at 1280/390/320px. [Deterministic geometry tests](../../tests/gallery-zoom.test.cjs) exercise the migrated TypeScript geometry.

React Activity checks retain the dialog DOM while effects disconnect and reconnect. When the host calls `open()` again on reconnection, it retains the current selected ID and old native close events do not cancel that opening; cleanup remains silent and subsequent external native closes still report dismissal.

After a pointer drag, the next keyboard action clears the post-drag click guard even if its zero-delay timer has not run yet. Pointer clicks remain suppressed until that timer; the guard cannot swallow a later keyboard paging action. Pagehide, inactivity and unmount invalidate delayed transition callbacks, release capture and remove temporary transition styles.

Local adaptations and limits: [coverage](../../docs/coverage.md#gallery).
