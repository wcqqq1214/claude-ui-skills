# Image preview from a thumbnail

Use this for one image that opens from a visible thumbnail and returns to the same location, preserving spatial context.

## Read the running code

[HTML](../../showcase/index.html#images) · [JS](../../showcase/components/images.js) · [CSS](../../showcase/components/images.css)

`initImagesDemo()` binds the thumbnail and native dialog. `openImage()` / `closeImage()` own phase, revision and active animation. `nextFrame()`, `imageTransform()` and `snap` live in [shared.js](../../showcase/shared.js); the shared `.image-close` style is in [style.css](../../showcase/style.css).

## Design and adaptation

- Measure source and destination geometry, then enter over 350ms with snap easing. Hide the thumbnail only while the preview occupies its place.
- Exit over 250ms. Before canceling an unfinished entry, read the visible transform so closing can start from the current appearance.
- Return to source geometry only when the thumbnail is connected, nonempty and visible on both viewport axes. Otherwise fade out from the current transform.
- Revision checks invalidate obsolete async completions. Keep the dialog open through exit, restore thumbnail visibility and return focus with `preventScroll`.

This uses WAAPI and a native dialog, not a claim of frame equivalence to browser View Transitions. The sample SVG, fitted geometry and close affordance are local. Check normal close, Escape, rapid open/close and focus return; use the separate [gallery](gallery.md) for multi-image navigation and zoom.
