# Switch, checkbox and discrete slider

Use these for a binary setting, an independent choice, or a small ordered scale. They deliberately use different feedback rather than sharing one animation.

## Read the running code

[HTML](../../showcase/index.html#controls) · [JS](../../showcase/components/controls.js) · [CSS](../../showcase/components/controls.css)

`initControlsDemo()` binds `#demoSwitch` and `#effortRange`; the checkbox remains a native input. `bindEffortPopover()` owns the effort trigger, popup and four discrete values. The `.range-fill-origin` / `.range-fill-clip` / `.range-fill` layers move together.

## Design and adaptation

- Switch travel takes 120ms; the checkbox stroke enters over 200ms and exits over 120ms. Both use 20px controls. The checkbox has a 5px radius and 16px graphic, centered without visible label copy in this demo.
- The slider is 32px high with an 8px radius. Track height is control height−4px; handle width is height−8px; endpoints inset half the handle width. Preserve the layered clipping, not only a percentage fill. Position transitions take 120ms and the handle scales to 1.12 while dragging.
- Selected fills use #2a78d6 and hover #3987e5. Unselected checkbox borders use black/light or white/dark at 20%, increasing to 40% on hover-capable devices over 60ms. Keep focus layers, theme-dependent handle shadows and selected/unselected colors distinct.
- Pointer release commits the preview; cancellation clears drag feedback. Keyboard adjustments commit immediately and expose the same value as the visual layers. Escape closes the popup and returns focus.

The same three demo cards remain. Open the current level in the slider card to adjust effort; reopening preserves the local selection, while reloading resets it. The four labels are local samples, not a connected model setting. The switch/checkbox retain their 2× viewing zoom; the popup uses normal size. The turtle button (`#controlsSlow`) retains 0.2× playback (enabled by default) and original speed. Check keyboard/pointer changes, cancellation, endpoints, quick close/reopen, both speeds and themes.
