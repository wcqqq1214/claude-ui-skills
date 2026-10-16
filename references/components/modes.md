# Sidebar mode buttons

Use this for top-level mode choices that keep every visible button in natural Tab order. It is distinct from the [segmented radio group](segmented.md): arrows move focus without selecting.

## Read the running code

[HTML](../../showcase/index.html#modes) · [JS](../../showcase/components/modes.js) · [CSS](../../showcase/components/modes.css)

`initModesDemo()` owns visible options and selection. `chooseMode()` commits `aria-current`; `positionMode()` measures the selected button. Read `.mode-track`, `.mode-thumb`, `data-snap` and both container queries together.

## Design and adaptation

- Click or Enter/Space selects; arrows only move focus between visible buttons. Hiding the selected option chooses the first visible one.
- Selection geometry moves over 120ms with snap easing. ResizeObserver remeasurement aligns directly using `data-snap`, while an unchanged target preserves the current animation. The 300ms background transition remains independent.
- Unselected labels fold using the track content box: ≤254px for three items and ≤180px for two. Track padding is outside those widths. Keep the selected indicator and icon alignment consistent through language and width changes.
- The compact controls are 28px high with a 7px radius at a 16px rem. Mode glyphs are rendered by [icons.js](../../showcase/icons.js); keep the matching font assets from [fonts.css](../../showcase/fonts.css).

The width/count controls, 13px text, focus outline and surrounding layout are demo choices, not an original mode-management feature. Check focus without selection, explicit selection, two/three options, breakpoint boundaries and rapid resize/select combinations.

## Pinned conversation order

The same [sidebar demo](../../showcase/index.html#modes) includes a fixed list. `initPinnedDemo()` handles drag preview, commit/cancel and the Move up / Move down menu. Keep the mode controls independent. The reset button restores the sample order.
