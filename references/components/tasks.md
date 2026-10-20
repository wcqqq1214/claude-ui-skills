# Cards, drop feedback and progress

Use for: a small set of status cards; a nearby drop target whose active boundary is clear without covering the page; and a progress list that reveals steps as work advances.

## Code

[ProgressList.tsx](../../src/components/tasks/ProgressList.tsx) · [ProgressShimmer.tsx](../../src/components/tasks/ProgressShimmer.tsx) · [TaskCards.tsx](../../src/components/tasks/TaskCards.tsx) · [DropTarget.tsx](../../src/components/tasks/DropTarget.tsx) · [tasks.css](../../src/styles/tasks.css) · [React demo](../../demo/chapters/TasksChapter.tsx)

Import the three components from `src/index.ts` and the shared [style entry](../../src/styles/index.css); see [integration](../../demo/README.md).

- `ProgressList` receives stable-ID items with `label`, optional `activeLabel` and `state` (`pending`, `in_progress`, `completed`). Labels include state announcements, the list name and earlier-step copy. Folding supports `expanded`/`defaultExpanded`/`onExpandedChange`. The host owns progress updates, heading, count and replay timers. `active={false}` pauses animation; viewport/document visibility also pauses playback.
- `TaskCards` receives titles, status labels, status kind (`done`, `stopped`, `failed`) and detail nodes. Selection supports `value`/`defaultValue`/`onValueChange`, with `null` meaning no detail. Arrows move focus without selecting; native click/Enter/Space toggles the detail.
- `DropTarget` is visual feedback around host-provided children and native div events. Pass `state="off"` for an active drag outside the target, `"on"` while over it and `"idle"` to animate out. The host owns payload validation and the drop action. `active={false}` immediately cancels feedback; unmount invalidates animation callbacks. The demo accepts only its own local source and offers an Enter/Space equivalent; it does not upload files.

## Parameters

| Part | Value |
| --- | --- |
| Card transition | Background, border and shadow over 150ms `--cui-ease-standard` |
| Drop overlay | Three pointer-transparent layers: dashed unhit boundary, 2px inset hit ring, 24px inner glow (accent at 20%) |
| Hit change | 60ms |
| Overlay enter | From opacity 0, scale 1.005; 150ms `--cui-ease-out-cubic` |
| Glow enter | 200ms `--cui-ease-out-cubic` after 80ms |
| Overlay exit | Current layer state → opacity 0, scale .95; 200ms ease-out |
| Progress folding | Completed steps beyond the two most recent fold behind an "earlier steps" toggle |
| Progress entry | New step text and rail 220ms `--cui-ease-out`; current-step node 180ms `--cui-ease-out` |
| Current step | Label shimmers with `cubic-bezier(.714,.121,.211,.888)` |

## Rules

- Cards keep single-line titles, status badges and blue selection. Arrows move focus between cards; click toggles the detail.
- Re-entering the target reads the current visual state before cancelling an exit; a stale completion never hides a newly active overlay.
- Progress rows are reconciled in place: an unchanged row keeps its entrance and shimmer state.
- The fold toggle sets `aria-expanded`; folded rows are inert.
- Each row announces its state (done, in progress, not started) to assistive technology.
- An explicit demo Replay starts its sample timeline even when only the button is in view. Leaving the chapter, hiding the document or subsequently moving the list out of view cancels pending sample changes.

## Check

The [independent consumer suite](../../tests/react-tasks.browser.cjs) covers folding and inert rows, appended step entry, current/final nodes, stable shimmer clones and phase-preserving translation (including paused playback), RTL/forced colors, compositing/observer/line-clamp fallbacks, controlled selection, drop exit interruption and teardown. The demo checks timer restart/cancellation, keyboard and browser drag/drop, external payload rejection and English/Chinese light/dark layouts at 1280/390/320px.

Local adaptations and limits: [coverage](../../docs/coverage.md#tasks).
