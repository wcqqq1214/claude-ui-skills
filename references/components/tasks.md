# Cards, drop feedback and progress

Use for: a small set of status cards; a nearby drop target whose active boundary is clear without covering the page; and a progress list that reveals steps as work advances.

## Code

[HTML](../../showcase/index.html#tasks) · [tasks.js](../../showcase/components/tasks.js) · [tasks.css](../../showcase/components/tasks.css)

- `initTasksDemo()` binds card selection and the drag source/target.
- `showDropState()` / `finishDrop()` own the overlay, interrupted animation and exit revision; `addLocalFile()` changes sample text only.
- `initProgressDemo()` renders the progress list; `createProgressShimmer()` draws the shimmer on the step in progress.

## Parameters

| Part | Value |
| --- | --- |
| Card transition | Background, border and shadow over 150ms `--ease-standard` |
| Drop overlay | Three pointer-transparent layers: dashed unhit boundary, 2px inset hit ring, 24px inner glow (accent at 20%) |
| Hit change | 60ms |
| Overlay enter | From opacity 0, scale 1.005; 150ms `--ease-out-cubic` |
| Glow enter | 200ms `--ease-out-cubic` after 80ms |
| Overlay exit | Current layer state → opacity 0, scale .95; 200ms ease-out |
| Progress folding | Completed steps beyond the two most recent fold behind an "earlier steps" toggle |
| Progress entry | New step text and rail 220ms `--ease-out`; current-step node 180ms `--ease-out` |
| Current step | Label shimmers with `--ease-shimmer` |

## Rules

- Cards keep single-line titles, status badges and blue selection. Arrows move focus between cards; click toggles the detail.
- Re-entering the target reads the current visual state before cancelling an exit; a stale completion never hides a newly active overlay.
- Progress rows are reconciled in place: an unchanged row keeps its entrance and shimmer state.
- The fold toggle sets `aria-expanded`; folded rows are inert.
- Each row announces its state (done, in progress, not started) to assistive technology.

## Check

- [ ] Card selection and focus navigation
- [ ] Drop, reset and interrupted overlay feedback
- [ ] Progress replay, folding and expanding earlier steps
- [ ] Language changes during progress playback

Local adaptations and limits: [coverage](../../docs/coverage.md#tasks).
