# Waiting, skeletons and accordion

Use for: an animated activity mark with a shimmering status line while work is under way, a delayed skeleton for content that has not arrived, and an accordion that keeps optional detail close without taking permanent space.

## Code

[HTML](../../showcase/index.html#feedback) · [feedback.js](../../showcase/components/feedback.js) · [feedback.css](../../showcase/components/feedback.css) · [status sheets](../../showcase/components/status-assets/)

- `STATUS_MARKS` and `createStatusMark()`: sprite playback for think, read, write and code. Bring `grow.webp` plus each variant's `*-in.webp`, `*-loop.webp` and `*-out.webp`.
- `createStatusShimmer()`: the status text and its hidden visual clone; `.status-shimmer` draws the sweep.
- `runSkeleton()` / `clearSkeleton()`: the delay timer, the shared sweep clip and its ResizeObserver.
- `initFeedbackDemo()`: the variant selector (reusing [segmented](segmented.md)), Finish/Replay and the timeline. Language changes call `refresh()`.
- Loaded content uses `.word-fade` from [type.css](../../showcase/components/type.css). Load segmented.js/css before this chapter.

## Parameters

| Part | Value |
| --- | --- |
| Mark frames | 48px frames in a fixed 20px slot; 33.33ms per frame; `steps(frameCount, jump-none)` |
| Grow | 10 frames, shared by all variants |
| In / loop / out frames | think 16/110/15 · read 21/60/19 · write 31/60/14 · code 16/75/9 (loops ≈ 3.67/2/2/2.5s) |
| Loop seams | think frame 54; code frames 18/37/56; read and write hand off at the loop end |
| Shimmer cycle | 3s: hold 0–15%, travel 15–85% with `--ease-shimmer`, hold to the end |
| Shimmer gradient | 120°, stops 37.5/50/62.5%; light uses `--secondary`, dark `--muted`, with a 30%-base/white peak |
| Shimmer fallback | Text background 400% wide, moving 83.333% → 16.667%; Chromium uses the masked clone with a −62.5% → −12.5% band |
| Skeleton | Inserted after 500ms, fades in over 150ms; one 2s linear sweep, 105° gradient with 35–65% stops, clipped to the child rectangles |
| Accordion | Grid track, opacity and chevron over 200ms `--ease-out-expo` |

## Rules

- Play the sprite artwork with stepped timing; a CSS dot bounce is a different effect.
- A new selection updates the selector at once while the old mark finishes its handoff: old loop → old out → new in → new loop.
- `scheduleSeam()` hands off at the first seam strictly beyond `currentTime + 50ms`, otherwise at the loop end. An entry completes before its loop starts.
- Activity changes never replay grow. Re-selecting the current variant keeps its phase. Rapid changes keep only the latest target, including during an exit.
- If the target artwork is missing, keep the current mark (or the static dot).
- The shimmer runs on a block flex item without line clamping. For inline or clamped text, keep the text-background fallback or port the layout check.
- Translating the status text updates the clone without restarting the sweep. Completion hides and empties the clone and stops the sweep.
- The shimmer belongs on the one-line status summary, not on expanded reasoning.
- Recompute the skeleton clip whenever the group resizes.
- Ending a wait: cancel any scheduled handoff, let the current stage and exit finish, then stop the shimmer, disconnect the skeleton observer and reveal the content.
- The accordion toggles `aria-expanded`; collapsed detail is inert.

## Check

- [ ] Rapid variant changes, including during an exit
- [ ] Ending and restarting a wait repeatedly
- [ ] Resizing during the skeleton sweep
- [ ] Translated status text and loaded content
- [ ] Accordion focus reachability, open and closed

Local adaptations and limits: [coverage](../../docs/coverage.md#feedback).
