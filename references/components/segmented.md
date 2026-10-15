# Segmented control

Use this for a small, fixed set of mutually exclusive views or options: preview/code, display modes or short filters. The reading views, status selector and compact file toolbar share one control; no standalone demo chapter is needed. Unlike [sidebar modes](modes.md), arrows select immediately and the indicator uses 200ms rather than 120ms.

## Read the running code

[File-panel HTML](../../showcase/index.html#workspace) · [Reading HTML](../../showcase/index.html#reading) · [JS](../../showcase/components/segmented.js) · [CSS](../../showcase/components/segmented.css)

`setupSegment(root, callback)` owns selection, keyboard navigation, geometry and resize observation. In [workspace.js](../../showcase/components/workspace.js), `fileSegment` updates `renderFile()` and expansion calls `refresh()`. [reading.js](../../showcase/components/reading.js) binds the standard `#readingViews` control to `#readingLayoutPanel` / `#readingCodePanel`. [feedback.js](../../showcase/components/feedback.js) also reuses it for status selection and refreshes geometry after translation.

## Design and adaptation

- Measure the selected option instead of dividing the track equally. The indicator follows both position and width, including translated labels. `position()` rounds viewport edges to device pixels and converts them back to local coordinates.
- Animate from the current visible geometry over 200ms with `cubic-bezier(.32,.72,0,1)`. Rapid changes interrupt smoothly. Resize remeasurement aligns directly; an unchanged target leaves the current animation alone.
- Keep selection, focus and content synchronized: one selected radio is in Tab order; arrows wrap, Home/End select endpoints. The callback runs on initialization and each selection and owns content updates.
- Keep one `.segment-thumb`, fixed `button[role=radio]` options with `data-value`, and exactly one initial `aria-checked="true"` / `tabindex="0"`. Initialize once after markup and translation. `select(index, focus)` changes selection; `refresh()` remeasures without animation, including host label updates that do not resize the root.
- The standard track is 32px high with 14px labels; `.compact` is 24px/13px. Track padding is 1px. Keep the left transform origin, natural button widths and `flex-shrink:0` together.

Use the shared border-box reset, UI font and `--regular` weight from [style.css](../../showcase/style.css) / [fonts.css](../../showcase/fonts.css). `setupSegment()` has no `DemoI18n` dependency; consumers own translated labels and call `refresh()` after label changes when needed.

Consumer layouts, sample content and the 1150px button-padding rule are local choices; they do not represent additional original control variants. Options are fixed and the observer has page lifetime; the host owns cleanup. Dynamic/disabled options and a tab-panel API are outside this example. Check rapid selection/reversal, keyboard endpoints, language/width changes and the compact file consumer.
