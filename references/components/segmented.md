# Segmented control

Use this for a small, fixed set of mutually exclusive views or options: preview/code, display modes or short filters. The standalone unequal-width track and compact preview/code example share one control with the file toolbar. Unlike [sidebar modes](modes.md), arrows select immediately and the indicator uses 200ms rather than 120ms.

## Read the running code

[HTML](../../showcase/index.html#segmented) · [JS](../../showcase/components/segmented.js) · [CSS](../../showcase/components/segmented.css)

`setupSegment(root, callback)` owns selection, keyboard navigation, geometry and resize observation. `initSegmentedDemo()` binds independent `#viewSegment` and `#compactSegment` tracks; the latter toggles `#segmentCompactPreview` / `#segmentCompactCode`. It refreshes both tracks after translation without resetting selection. In [workspace.js](../../showcase/components/workspace.js), `fileSegment` updates `renderFile()` and expansion calls `refresh()`. Its markup is in [the file panel](../../showcase/index.html#workspace). [feedback.js](../../showcase/components/feedback.js) also reuses it for status selection and refreshes geometry after translation.

## Design and adaptation

- Measure the selected option instead of dividing the track equally. The indicator follows both position and width, including translated labels. `position()` rounds viewport edges to device pixels and converts them back to local coordinates.
- Animate from the current visible geometry over 200ms with `cubic-bezier(.32,.72,0,1)`. Rapid changes interrupt smoothly. Resize remeasurement aligns directly; an unchanged target leaves the current animation alone.
- Keep selection, focus and content synchronized: one selected radio is in Tab order; arrows wrap, Home/End select endpoints. The callback runs on initialization and each selection and owns content updates.
- Keep one `.segment-thumb`, fixed `button[role=radio]` options with `data-value`, and exactly one initial `aria-checked="true"` / `tabindex="0"`. Initialize once after markup and translation. `select(index, focus)` changes selection; `refresh()` remeasures without animation, including host label updates that do not resize the root.
- The main track is 32px high with 14px labels; `.compact` is 24px/13px. Track padding is 1px. Keep the left transform origin, natural button widths and `flex-shrink:0` together.

Use the shared border-box reset, UI font and `--regular` weight from [style.css](../../showcase/style.css) / [fonts.css](../../showcase/fonts.css). The compact sample uses the theme's text and background roles. `DemoI18n` is needed only by the sample binding, not `setupSegment()`.

The left track only selects a sample answer; it does not switch content. The compact example shows a fixed English heading and sentence alongside their literal HTML. Both panels share a grid cell; the hidden panel remains invisible in layout so switching reserves the taller height, including wrapped code.

The two-card layout, sample content, 700px stacking breakpoint and 1150px button-padding rule are demo choices; they do not represent additional original control variants. Options are fixed and the observer has page lifetime; the host owns cleanup. Dynamic/disabled options and a tab-panel API are outside this example. Check rapid selection/reversal, keyboard endpoints, language/width changes and the compact file consumer.
