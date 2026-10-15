# Switch, checkbox and discrete slider

Use these for a binary setting, an independent choice, or a small ordered scale. They deliberately use different feedback rather than sharing one animation.

## Read the running code

[HTML](../../showcase/index.html#controls) · [JS](../../showcase/components/controls.js) · [CSS](../../showcase/components/controls.css)

`initControlsDemo()` binds `#demoSwitch` and `#effortRange`; the checkbox remains a native input. `updateEffort()` maps the four discrete values to `--pos`, text and `aria-valuetext`. The `.range-fill-origin` / `.range-fill-clip` / `.range-fill` layers move together.

## Design and adaptation

- Switch travel takes 120ms; the checkbox stroke enters over 200ms and exits over 120ms. Both use 20px controls. The checkbox has a 5px radius and 16px graphic, aligned to the first line of multiline copy.
- The slider is 32px high with an 8px radius. Track height is control height−4px; handle width is height−8px; endpoints inset half the handle width. Preserve the layered clipping, not only a percentage fill. Position transitions take 120ms and the handle scales to 1.12 while dragging.
- Selected fills use #2a78d6 and hover #3987e5. Unselected checkbox borders use black/light or white/dark at 20%, increasing to 40% on hover-capable devices over 60ms. Keep focus layers, theme-dependent handle shadows and selected/unselected colors distinct.
- Pointer release, cancellation and blur all clear drag feedback. The hidden native range owns keyboard input and exposes the same state as the visual layers.

The sample labels, native range positioning and surrounding layout are local choices. This discrete example does not establish continuous-slider or overlay/lean variants. Check click/Space, arrow changes, endpoint geometry, pointer cancellation and both themes.
