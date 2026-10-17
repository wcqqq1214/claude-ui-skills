# Segmented control

Use for: a small fixed set of mutually exclusive views or options, such as preview/code, display modes or short filters. Arrows select immediately, unlike [sidebar modes](modes.md), where arrows only move focus.

## Code

[segmented.js](../../showcase/components/segmented.js) · [segmented.css](../../showcase/components/segmented.css) · consumers: [file panel](../../showcase/index.html#workspace), [reading views](../../showcase/index.html#reading), status selector in [waiting](feedback.md)

- `setupSegment(root, callback)` owns selection, keyboard navigation, geometry and resize observation. The callback runs on initialization and on each selection and owns content updates.
- `select(index, focus)` changes the selection; `refresh()` remeasures without animation.
- Consumers: `fileSegment` in [workspace.js](../../showcase/components/workspace.js) calls `renderFile()` and `refresh()` after expansion; [reading.js](../../showcase/components/reading.js) binds `#readingViews`; [feedback.js](../../showcase/components/feedback.js) refreshes after translation.

## Parameters

| Part | Value |
| --- | --- |
| Indicator | Follows the selected option's measured position and width; 200ms `--ease-snap` from the current visible geometry |
| Standard | 32px track, 14px labels |
| Compact (`.compact`) | 24px track, 13px labels |
| Radius | Track 8px (compact 6px); the thumb is 1px smaller and the buttons 2px smaller |
| Track padding | 1px |
| Pixel snapping | `position()` rounds viewport edges to device pixels, then converts back to local coordinates |

## Rules

- Measure the selected option instead of dividing the track equally, so translated labels keep their width.
- Rapid changes interrupt smoothly from the visible position. A resize aligns directly; an unchanged target leaves the running animation alone.
- Markup: one `.segment-thumb`; fixed `button[role=radio]` options with `data-value`; exactly one initial `aria-checked="true"` with `tabindex="0"`.
- Initialize once, after the markup and its translation are in place.
- Only the selected radio is in the Tab order. Arrows wrap; Home and End select the ends.
- Keep the left transform origin, natural button widths and `flex-shrink: 0` together.
- Uses the border-box reset, UI font and `--regular` weight from [style.css](../../showcase/style.css) and [fonts.css](../../showcase/fonts.css). It has no translation dependency: consumers own their labels and call `refresh()` after a label change.
- The resize observer lives for the page; the host owns cleanup.

## Check

- [ ] Rapid selection and reversal
- [ ] Keyboard ends and wrapping
- [ ] Language and width changes
- [ ] The compact file-panel consumer

Related component guides: [component index](../components.md).
