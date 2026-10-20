# Menus, local search and palette cards

Use for: a submenu where focus previews an option without committing it; search whose groups disappear while filtering; revealing a selected result's destination; and an artifact thumbnail that turns into an action menu.

## Code

[SubmenuSelect.tsx](../../src/components/menus/SubmenuSelect.tsx) · [GroupedSearch.tsx](../../src/components/menus/GroupedSearch.tsx) · [ArtifactActionsCard.tsx](../../src/components/menus/ArtifactActionsCard.tsx) · [useSearchHighlight.ts](../../src/hooks/useSearchHighlight.ts) · [menus.css](../../src/styles/menus.css) · [React demo](../../demo/chapters/MenusChapter.tsx)

Import from `src/index.ts` with the shared stylesheet; see [integration](../../demo/README.md#menus-search-and-artifact-actions). The components own listeners, pending focus, animations and highlight cancellation. The demo owns translations, sample settings, selected effort, simulated actions and layout.

- `SubmenuSelect`: controlled/uncontrolled selection; focus preview callback/render content; disabled options; nested keyboard dismissal.
- `GroupedSearch`: typed item IDs/labels/groups, controlled/uncontrolled query and a selection callback. The host chooses the destination.
- `useSearchHighlight`: focuses the supplied heading, then delegates to [searchHighlight.ts](../../src/components/menus/searchHighlight.ts) for scroll settling and the destination animations; cancels on replacement, inactivity, pagehide and unmount.
- `ArtifactActionsCard`: thumbnail, translated action list and deferred focus. `subtitle` accepts presentational React nodes, including blocks; both thumbnail and opened-card containers preserve valid HTML for SSR hydration. Host callbacks implement actions. No navigation or clipboard effect is implied.

## Parameters

| Part | Value |
| --- | --- |
| Search field | No outline; 1px inset ring at idle and hover |
| Search focus | 1px page-color inset, 1px accent ring and a 6px blur / 1px spread glow over 60ms; glow `#cde2fb` light, `#184f95` at 60% dark |
| Scroll settle | At least 250ms and three successive position changes under .5px; capped at 1500ms |
| Destination highlight | 1950ms ease-out: SVG underline plus a 22% warning-yellow row wash that reveals to 17.9%, holds to 53.8%, then fades; cleanup on animation end or a 2050ms fallback |
| Palette card open | 200ms `--cui-ease-out`: shell translation, title opacity and action-area grid expansion animate separately |
| Palette card close | 120ms `--cui-ease-out` translation back into the thumbnail (`cui-palette-thumb-return`) |
| Palette card | 280px wide, 16:10 thumbnail |

## Rules

- Submenus keep focus preview apart from selection. Arrows move focus; Enter, Space or click commits.
- Activating the submenu owner by click or ArrowRight always focuses the selected enabled option, or the first enabled option if none is selected, including when the submenu is already open.
- Escape or ArrowLeft closes one submenu level and returns focus to its owner; the next Escape returns to the trigger.
- Group headings appear only when the raw query is exactly empty; a whitespace-only query renders flat results. Empty results get a status message.
- The search ring follows keyboard focus. Programmatic initial focus uses `focus({ preventScroll: true, focusVisible: false })`. Clicking the still-focused field stays neutral; clicking after blur, or Tab re-entry, shows the ring.
- Selecting a result clears the query, focuses the destination heading without scrolling, then centers it smoothly once scrolling settles. User input cancels the extra centering, and a new selection cancels the previous highlight.
- The row's Actions button or Alt/Option+Enter opens the card from the thumbnail already on screen; measure the thumbnail offset first.
- Focus the first action after two frames, unless the user has moved focus meanwhile; closing cancels the pending focus.
- In the card, arrows move focus and Enter, Space, click or digits 1–9 choose the corresponding enabled action. Escape, ArrowLeft or Alt/Option+Enter close it from the trigger or the menu, including before the deferred focus lands.
- Closing returns into the ready thumbnail from the current rectangles, including an interrupted opening; the image must be loaded. Reopening cancels the return, and leaving the page clears it without playback.

## Check

The [independent consumer suite](../../tests/react-menus.browser.cjs) covers nested Escape, focus versus selection, disabled skipping, controlled updates, grouping/filtering, repeated destinations, language/theme changes, rapid palette return, lifecycle cleanup and responsive layouts. [Deterministic highlight tests](../../tests/search-highlight.test.cjs) cover both implementations, including the 250/1500ms bounds, user-input suppression and cleanup.

Local adaptations and limits: [coverage](../../docs/coverage.md#menus).
