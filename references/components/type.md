# Text reveal and local scrolling

Use for: one of five standalone effects: grapheme reveal, body fade, a user message bubble, working dots, or scroll following while content streams in. Each works on its own; there is no combined chat sequence to replay.

## React implementation

[Text primitives](../../src/components/typography/Text.tsx) · [WorkingMark](../../src/components/typography/WorkingMark.tsx) · [ScrollFollower](../../src/components/typography/ScrollFollower.tsx) · [demo chapter](../../demo/chapters/TypographyChapter.tsx).

Import through `src/index.ts` and the component stylesheet. The demo owns sample text, arrival timers, replay and viewport activation. `ScrollFollower` accepts host children and a reset key; it owns pinning, resize/end-marker observations and focus return. `WorkingMark` owns only the default sheet loop and pauses offscreen. Source CSS uses namespaced `--cui-*` tokens. See [integration and API boundaries](../../demo/README.md).

## Parameters

| Part | Value |
| --- | --- |
| Grapheme reveal | Each span from 6px blur over 90ms `--cui-ease-out-cubic`, delayed by index × 30ms |
| Body fade | 100ms linear, `backwards` fill; timed separately from the grapheme reveal |
| User bubble | Right-aligned; 10px radius; 12px horizontal / 8px vertical padding; max width 85%; fill `rgb(11 11 11 / 5%)` light, `rgb(255 255 255 / 5%)` dark, over the host surface; no border or shadow; emphasis in the Sans italic face |
| Follow | Active while pinned and the bottom gap exceeds 2px |
| Resume | Scrolling down to within 1px of the bottom |
| Return button | Appears when unpinned and the end marker is beyond a 200px extension; 200ms transition; inert while hidden |
| Bottom fade | 8px extension, 3rem tall, host `--cui-surface` color, 150ms; ignores pointers |
| Working mark | 40 frames of 48px in a 20px slot, 33.33ms per frame (≈ 1.333s), `steps(40, jump-none)`; hover or focus-visible crossfades to the arrow over 200ms |

## Rules

- Upward input releases following. Keep both resize observations so language and width changes remeasure.
- Activity effect reconnection preserves the paused reading position or current following mode. Only a changed resetKey requests a reset; changes made while hidden apply on reconnection.
- Returning jumps straight to the bottom, restores following and moves focus from the disappearing button to the scroll region.
- Replay cancels earlier timers and resets following.
- One-shot effects replay when their card enters view, each with its own replay button; body timers clear when the card leaves. Loading pauses offscreen and in hidden documents.
- The working mark pauses when hidden or complete, replay cancels it, and missing artwork leaves the arrow in place.

## Check

- [ ] Replay; pausing by scrolling up; manual and button return
- [ ] Language changes and narrow wrapping, without moving the outer page
- [ ] Working mark hover, focus and completion

Local adaptations and limits: [coverage](../../docs/coverage.md#type).
