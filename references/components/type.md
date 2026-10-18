# Text reveal and local scrolling

Use for: one of five standalone effects: grapheme reveal, body fade, a user message bubble, working dots, or scroll following while content streams in. Each works on its own; there is no combined chat sequence to replay.

## Code

[HTML](../../showcase/index.html#type) · [type.js](../../showcase/components/type.js) · [type.css](../../showcase/components/type.css) · [default loop sheet](../../showcase/components/status-assets/default-loop.webp)

- `bindTypeEffectCards()`: `#graphemeExample` (`renderTypeTitle()`), `#bodyFadeExample` (`replayBody()`), `#workingExample` (`syncWorking()`). `#bubbleExample` is static HTML/CSS.
- `initTypeDemo()`: the scroll sample (`#scrollExample`, `#typeScroll`, `#typeReading`, `#typeEnd`, `#typeBottom`) with `replayType()`, `stopTypePlayback()`, `followType()` and `updateTypeBottom()`.
- `animateTypeWorkingMark()` plays the default loop sheet for both loading presentations; bring the asset with the code.

## Parameters

| Part | Value |
| --- | --- |
| Grapheme reveal | Each span from 6px blur over 90ms `--ease-out-cubic`, delayed by index × 30ms |
| Body fade | 100ms linear, `backwards` fill; timed separately from the grapheme reveal |
| User bubble | Right-aligned; 10px radius; 12px horizontal / 8px vertical padding; max width 85%; fill `rgb(11 11 11 / 5%)` light, `rgb(255 255 255 / 5%)` dark, over the host surface; no border or shadow |
| Follow | Active while pinned and the bottom gap exceeds 2px |
| Resume | Scrolling down to within 1px of the bottom |
| Return button | Appears when unpinned and the end marker is beyond a 200px extension; 200ms transition; inert while hidden |
| Bottom fade | 8px extension, 3rem tall, host `--surface` color, 150ms; ignores pointers |
| Working mark | 40 frames of 48px in a 20px slot, 33.33ms per frame (≈ 1.333s), `steps(40, jump-none)`; hover or focus-visible crossfades to the arrow over 200ms |

## Rules

- Upward input releases following. Keep both resize observations so language and width changes remeasure.
- Returning jumps straight to the bottom, restores following and moves focus from the disappearing button to the scroll region.
- Replay cancels earlier timers and resets following.
- One-shot effects replay when their card enters view, each with its own replay button; body timers clear when the card leaves. Loading pauses offscreen and in hidden documents.
- The working mark pauses when hidden or complete, replay cancels it, and missing artwork leaves the arrow in place.

## Check

- [ ] Replay; pausing by scrolling up; manual and button return
- [ ] Language changes and narrow wrapping, without moving the outer page
- [ ] Working mark hover, focus and completion

Local adaptations and limits: [coverage](../../docs/coverage.md#type).
