# Menus, local search and palette cards

Use for: a submenu where focus previews an option without committing it; search whose groups disappear while filtering; revealing a selected result's destination; and an artifact thumbnail that turns into an action menu.

## Code

[SubmenuSelect.tsx](../../src/components/menus/SubmenuSelect.tsx) · [GroupedSearch.tsx](../../src/components/menus/GroupedSearch.tsx) · [ArtifactActionsCard.tsx](../../src/components/menus/ArtifactActionsCard.tsx) · [useSearchHighlight.ts](../../src/hooks/useSearchHighlight.ts) · [menus.css](../../src/styles/menus.css) · [React demo](../../demo/chapters/MenusChapter.tsx)

Import from `src/index.ts` with the shared stylesheet; see [integration](../../demo/README.md#import-the-source). The components own listeners, pending focus, animations and highlight cancellation. The demo owns translations, sample settings, selected effort, simulated actions and layout.

- `SubmenuSelect`: options with stable value/label/disabled, value/defaultValue/onValueChange, optional onPreviewChange/renderPreview, active and className. It keeps its in-flow menu layout; it does not portal or implement collision placement.
- `GroupedSearch`: label, placeholder, emptyMessage, locale and items `{ id, label, group? }`; query/defaultQuery/onQueryChange and onSelect. Filtering trims the query and uses locale-aware lowercase comparison. Keep each group's items adjacent. Selection requests an empty query before onSelect. Optional autoFocus uses preventScroll and suppresses the initial focus-visible ring where supported.
- `useSearchHighlight(active)`: returns highlight(row, title) and cancel(). Give the destination title `tabIndex={-1}`. The host owns destination lookup and chapter activation; lifecycle and focus rules are below.
- `ArtifactActionsCard`: title, subtitle, image, actionsLabel, actions `{ id, label, onSelect, disabled? }`, active and className. The image is decorative; title names the artifact. Subtitle accepts presentational React nodes, including blocks, in both thumbnail and opened card with valid SSR markup. The host provides action effects; the demo's Open/Copy link messages are simulations. The card stays within its local theme/container.

Pass translated text through props. Set active=false when hiding menu/action views, and hide or make inactive host content inert.

## Example

Paths assume a consuming file at the repository root.

```tsx
import { SubmenuSelect } from './src';

export function EffortChoice() {
  return <SubmenuSelect label="Model settings" submenuLabel="Thinking effort"
    options={[{ value: 'low', label: 'Low' }, { value: 'high', label: 'High' }]}
    defaultValue="high" onValueChange={value => console.log(value)}
    renderPreview={(preview, selected) => <span>Preview: {preview} · Selected: {selected}</span>} />;
}
```

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
- Inactivity and Activity disconnection dismiss Submenu and Artifact menus without restoring focus. Revealing retained DOM must not restore an old menu, steal outside focus or replay old entry/return animations. A selection callback can synchronously deactivate, disconnect, unmount or reopen its menu; the old selection cannot restore focus or close a newer interaction. Normal selections still return focus to their trigger.
- Group headings appear only when the raw query is exactly empty; a whitespace-only query renders flat results. Empty results get a status message.
- The search ring follows keyboard focus. Programmatic initial focus uses `focus({ preventScroll: true, focusVisible: false })`. Clicking the still-focused field stays neutral; clicking after blur, or Tab re-entry, shows the ring.
- Selecting a result clears the query, focuses the destination heading without scrolling, then centers it smoothly once scrolling settles. User input cancels the extra centering, and a new selection cancels the previous highlight.
- A parent may own `useSearchHighlight` while a destination child requests its highlight from a callback ref or `useLayoutEffect`, including on first mount and when Activity reconnects retained DOM, with or without StrictMode. For reconnection, the destination DOM follows the same Activity's visibility; calls targeting its hidden retained DOM are discarded rather than replayed on reveal. Saved methods cannot start focus, scrolling or animation while the hook is inactive or after true unmount.
- External or portal destinations follow the host's `active` contract: pass active=false when hiding or disabling the host, and request a highlight only when the destination should be shown.
- A heading's focus handler may synchronously cancel, deactivate, disconnect or replace the highlight request. The old request must stop before scheduling scrolling or animation, and cancellation must retain ownership of the newest request's cleanup.
- The row's Actions button or Alt/Option+Enter opens the card from the thumbnail already on screen; measure the thumbnail offset first.
- Focus the first action after two frames, unless the user has moved focus meanwhile; closing cancels the pending focus.
- In the card, arrows move focus and Enter, Space, click or digits 1–9 choose the corresponding enabled action. Escape, ArrowLeft or Alt/Option+Enter close it from the trigger or the menu, including before the deferred focus lands.
- Closing returns into the ready thumbnail from the current rectangles, including an interrupted opening; the image must be loaded. Reopening cancels the return, and leaving the page clears it without playback.

## Check

The [independent consumer suite](../../tests/react-menus.browser.cjs) covers nested Escape, focus versus selection, disabled skipping, controlled updates, grouping/filtering, repeated destinations, language/theme changes, rapid palette return, lifecycle cleanup and responsive layouts. Highlight cases cover child callback refs and layout effects on initial mount and Activity retained-DOM reconnection, with StrictMode enabled and disabled, alongside synchronous focus reentry and inactive-method protection. [Deterministic highlight tests](../../tests/search-highlight.test.cjs) cover both implementations, including the 250/1500ms bounds, user-input suppression and cleanup.

Local adaptations and limits: [coverage](../../docs/coverage.md#menus).
