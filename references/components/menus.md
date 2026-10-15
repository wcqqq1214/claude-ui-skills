# Menus, local search and palette cards

Use these examples when focus needs to preview an option without committing it, when search groups disappear during filtering, when selecting a search result needs to reveal its destination, or when an action card unfolds near its trigger.

## Read the running code

[HTML](../../showcase/index.html#menus) · [JS](../../showcase/components/menus.js) · [CSS](../../showcase/components/menus.css)

`initMenusDemo()` owns the parent/submenu pair, `renderSearch()` and palette opening/closing. `highlightSearchTarget(row, title)` owns scroll settling and the destination highlight. The three `.search-destination` rows in `#menus` are its actual consumers; `.feature-anchor-*` in the CSS supplies both animations.

## Design and adaptation

- Keep focus preview separate from committed selection. Arrows browse submenu items; native Enter/Space/click commits. Escape/ArrowLeft closes one submenu level and returns to its owner; the next Escape returns to the trigger.
- Group headings appear only when the raw query is exactly empty. A whitespace-only query still renders flat results, although demo matching trims it. Empty results receive a local status message.
- Search focus follows the settings field: no input outline, a 1px inset idle/hover ring, and a focus shadow with a 1px page-background inset, 1px accent ring and 6px blur/1px spread glow (60ms). `.local-search:focus-visible` applies the focus ring to this single input. In both themes, initial settings focus uses `focus({ preventScroll: true, focusVisible: false })`; clicking that still-focused input stays neutral, while a click after blur or Tab re-entry shows the ring. This inline demo has no dialog initialization and adds no autofocus or pointer suppression. The light glow is `#cde2fb`; dark uses `#184f95` at 60%.
- Selecting a result clears the query, focuses its existing local row heading without scrolling, then centers it smoothly. Wait at least 250ms and three successive position deltas <0.5px, capped at 1500ms. User input suppresses the extra centering correction. The 1950ms ease-out SVG underline and 22% warning-yellow row wash reveal through 17.9%, hold through 53.8%, then fade; animation end or the 2050ms fallback cleans up. A new selection cancels the previous run.
- Palette opening measures the trigger offset, then separately animates shell translation, header opacity and action-area grid expansion over 200ms ease-out. Do not fade/resize the whole card as one layer.
- Move focus after two animation frames only if it is still on the opening trigger. Cancel pending focus on close so a quick close or user-directed move is not overridden.

The demo initially focuses the selected submenu item; that is a local adaptation, distinct from an observed original menu opening on Low while High stayed selected. This submenu is not the discrete Slider's preview/commit path, whose exact keyboard timing remains unverified. The three-card layout, in-flow menus that expand their own card rather than cover adjacent examples, search data/filtering, fixed local destinations and destination focus are local presentation choices. Search stays in this chapter and does not change its URL or activate another chapter; settings label matching and deferred row discovery are not reproduced. Highlight parameters describe the local demo. Palette anchor/close behavior and its first focused collapse button are local. Check nested Escape, preview versus selection, blank/space queries, repeated destination selection, language/theme changes during highlighting and rapid palette open/close.
