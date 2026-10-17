# Menus, local search and palette cards

Use for: a submenu where focus previews an option without committing it; search whose groups disappear while filtering; revealing a selected result's destination; and an artifact thumbnail that turns into an action menu.

## Code

[HTML](../../showcase/index.html#menus) · [menus.js](../../showcase/components/menus.js) · [menus.css](../../showcase/components/menus.css)

- `initMenusDemo()`: the parent/submenu pair and `renderSearch()`.
- `highlightSearchTarget(row, title)`: scroll settling and the destination highlight; the three `.search-destination` rows consume it and `.feature-anchor-*` supplies both animations.
- `bindArtifactActions()`: the artifact row, `#paletteThumb`, `#paletteCard`, keyboard selection and action feedback.

## Parameters

| Part | Value |
| --- | --- |
| Search field | No outline; 1px inset ring at idle and hover |
| Search focus | 1px page-color inset, 1px accent ring and a 6px blur / 1px spread glow over 60ms; glow `#cde2fb` light, `#184f95` at 60% dark |
| Scroll settle | At least 250ms and three successive position changes under .5px; capped at 1500ms |
| Destination highlight | 1950ms ease-out: SVG underline plus a 22% warning-yellow row wash that reveals to 17.9%, holds to 53.8%, then fades; cleanup on animation end or a 2050ms fallback |
| Palette card open | 200ms `--ease-out`: shell translation, title opacity and action-area grid expansion animate separately |
| Palette card close | 120ms `--ease-out` translation back into the thumbnail (`palette-thumb-return`) |
| Palette card | 280px wide, 16:10 thumbnail |

## Rules

- Submenus keep focus preview apart from selection. Arrows move focus; Enter, Space or click commits.
- Escape or ArrowLeft closes one submenu level and returns focus to its owner; the next Escape returns to the trigger.
- Group headings appear only when the raw query is exactly empty; a whitespace-only query renders flat results. Empty results get a status message.
- The search ring follows keyboard focus. Programmatic initial focus uses `focus({ preventScroll: true, focusVisible: false })`. Clicking the still-focused field stays neutral; clicking after blur, or Tab re-entry, shows the ring.
- Selecting a result clears the query, focuses the destination heading without scrolling, then centers it smoothly once scrolling settles. User input cancels the extra centering, and a new selection cancels the previous highlight.
- The row's Actions button or Alt/Option+Enter opens the card from the thumbnail already on screen; measure the thumbnail offset first.
- Focus the first action after two frames, unless the user has moved focus meanwhile; closing cancels the pending focus.
- In the card, arrows move focus and Enter, Space, click or digits 1–3 choose. Escape, ArrowLeft or Alt/Option+Enter close it from the trigger or the menu, including before the deferred focus lands.
- Closing returns into the ready thumbnail from the current rectangles, including an interrupted opening; the image must be loaded. Reopening cancels the return, and leaving the page clears it without playback.

## Check

- [ ] Nested Escape; preview versus selection
- [ ] Empty, blank and space-only queries
- [ ] Selecting the same destination repeatedly
- [ ] Language and theme changes during a highlight
- [ ] Rapid palette open/close

Related component guides: [component index](../components.md).
