# Cards and local drop feedback

Use these for a small set of status cards and a nearby drop target whose active boundary is clear without covering the page.

## Read the running code

[HTML](../../showcase/index.html#tasks) · [JS](../../showcase/components/tasks.js) · [CSS](../../showcase/components/tasks.css)

`initTasksDemo()` binds card selection and the local drag source/target. `showDropState()` / `finishDrop()` own the overlay, interrupted animation and exit revision; `addLocalFile()` changes sample text only.

## Design and adaptation

- Card background, border and shadow transition over 150ms. Preserve single-line titles, status badges and theme-blue selection. Arrows move focus between cards; click toggles detail.
- The overlay has three pointer-transparent layers: dashed unhit boundary, 2px inset hit ring and 24px inner glow. Hit-state changes take 60ms.
- Overlay entry takes 150ms from opacity 0/scale 1.005. Glow enters over 200ms after 80ms. Exit keeps the current layer state while animating to opacity 0/scale .95 over 200ms ease-out.
- Re-entry reads the current visual state before canceling an exit, and stale completions cannot hide a newly active overlay.

The status shapes, card content and keyboard Enter/Space drop substitute are local. No running-state pulse, page-wide scrim, upload, file parsing or task execution is implemented. Check selection, focus navigation, drop/reset and interrupted overlay feedback; keyboard substitution does not prove physical drag coverage.

## Progress list

The same [tasks chapter](../../showcase/index.html#tasks) includes a progress list. Expand earlier steps to revisit them, or use Replay to watch the sample unfold. `initProgressDemo()` lives in the linked tasks JS and shares the existing chapter entry.
