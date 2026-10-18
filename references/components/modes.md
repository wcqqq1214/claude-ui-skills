# Sidebar modes and pinned order

Use for: top-level mode buttons that stay in natural Tab order, where arrows move focus without selecting (unlike the [segmented control](segmented.md)), and a short pinned list reordered by drag or by menu.

## Code

[HTML](../../showcase/index.html#modes) · [modes.js](../../showcase/components/modes.js) · [modes.css](../../showcase/components/modes.css)

- `initModesDemo()` owns the visible options and selection: `chooseMode()` commits `aria-current`, `positionMode()` measures the selected button.
- Read `.mode-track`, `.mode-thumb`, `data-snap` and both container queries together.
- `initPinnedDemo()` owns the pinned list: drag preview, commit and cancel, and the Move up / Move down menu.
- Mode glyphs come from [icons.js](../../showcase/icons.js) with the font assets in [fonts.css](../../showcase/fonts.css).

## Parameters

| Part | Value |
| --- | --- |
| Track | 28px high at a 16px rem; track radius 7px, thumb 6px, buttons 5px |
| Indicator | Geometry over 120ms `--ease-snap`; background over 300ms, independently |
| Label folding | Unselected labels fold when the track's content box is ≤ 254px (three items) or ≤ 180px (two items); track padding is outside these widths |
| Selected Code glyph | Weight 700 |
| Running badge | Shown on Code while another mode is selected |
| Pinned drag | Starts after 4px of movement; floating copy at 90% opacity, 6px radius, `--pin-float-shadow`; moves over 150ms ease-out |

## Rules

- Click, Enter or Space selects. Arrows only move focus between visible buttons, and reverse in right-to-left layouts.
- Hiding the selected option selects the first visible one.
- ResizeObserver remeasures and aligns directly through `data-snap`; an unchanged target keeps its running animation.
- Keep the selected indicator and icon alignment steady through language and width changes.
- Pinned rows: arrows move focus between rows, and the row's menu offers Move up and Move down. Escape during a drag cancels it and restores the order; releasing commits. Keep the pinned list independent of the mode controls.

## Check

- [ ] Focus moves without selecting; explicit selection
- [ ] Two and three options, at the 254px and 180px boundaries
- [ ] Rapid resize combined with selection; right-to-left
- [ ] Pinned drag commit, Escape cancel, menu moves and focus return

Local adaptations and limits: [coverage](../../docs/coverage.md#modes).
