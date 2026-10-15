# Switch, checkbox and discrete slider

Use these for a binary setting, an independent choice, or a small ordered scale. They deliberately use different feedback rather than sharing one animation.

## Read the running code

[HTML](../../showcase/index.html#controls) · [JS](../../showcase/components/controls.js) · [CSS](../../showcase/components/controls.css)

`initControlsDemo()` binds `#demoSwitch` and `#effortRange`; the checkbox remains a native input. `updateEffort()` maps the four discrete values to `--pos` and `aria-valuetext`. The `.range-fill-origin` / `.range-fill-clip` / `.range-fill` layers move together.

## Design and adaptation

- Switch travel takes 120ms; the checkbox stroke enters over 200ms and exits over 120ms. Both use 20px controls. The checkbox has a 5px radius and 16px graphic, centered without visible label copy in this demo.
- The slider is 32px high with an 8px radius. Track height is control height−4px; handle width is height−8px; endpoints inset half the handle width. Preserve the layered clipping, not only a percentage fill. Position transitions take 120ms and the handle scales to 1.12 while dragging.
- Selected fills use #2a78d6 and hover #3987e5. Unselected checkbox borders use black/light or white/dark at 20%, increasing to 40% on hover-capable devices over 60ms. Keep focus layers, theme-dependent handle shadows and selected/unselected colors distinct.
- Pointer release, cancellation and blur all clear drag feedback. The hidden native range owns keyboard input and exposes the same state as the visual layers.

The three demo cards omit visible labels and captions but retain accessible names. Slider values use `Level {position} of {total}` text with positional i18n placeholders; Chinese translations and four stops are local samples. Demo-only CSS zoom magnifies the switch/checkbox 2× and slider 1.5×; its base width is capped at 360px and shrinks with the container. The turtle button (`#controlsSlow`) changes `--controls-duration-scale` from 1 to 5 (one-fifth speed), preserving easing and state. Magnification, slow playback, the icon and card layout are viewing aids for this demo. Continuous-slider and overlay/lean variants remain outside this example. Check keyboard/pointer changes, cancellation, endpoints, both speeds and themes.
