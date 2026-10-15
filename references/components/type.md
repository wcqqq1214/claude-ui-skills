# Text reveal and local scrolling

Choose the standalone effect: grapheme reveal, body fade, user bubble, working dots or scroll following. The five cards share one chapter; they do not require replaying a combined chat sequence.

## Read the running code

[HTML](../../showcase/index.html#type) · [JS](../../showcase/components/type.js) · [CSS](../../showcase/components/type.css)

`bindTypeEffectCards()` owns `#graphemeExample` (`renderTypeTitle()`), `#bodyFadeExample` (`replayBody()`) and `#workingExample` (`syncWorking()`). `#bubbleExample` is static HTML/CSS. Each one-shot effect replays when its card enters view and has its own replay button; body timers clear on exit. Loading pauses offscreen or in a hidden document. `#workingPreview` is a local hover/focus demonstration, not a scroll action.

`initTypeDemo()` owns `#scrollExample`, `#typeScroll`, `#typeReading`, `#typeEnd` and `#typeBottom`. `replayType()` and `stopTypePlayback()` control the scroll sample's timers; it starts only when its chapter is active and at least 25% of its scroll region intersects the viewport, and stops on exit. `followType()` and `updateTypeBottom()` retain scroll/visibility rules.

Both loading presentations call `animateTypeWorkingMark()` with the same [default loop sheet](../../showcase/components/status-assets/default-loop.webp). Include this asset when adapting the linked JS/CSS. The two-column card grid, 25% playback threshold, standalone triggers and sample copy are local presentation choices for this demo.

## Design and adaptation

- `.type-user-row` and `.type-user-bubble` in the linked HTML/CSS show one static, right-aligned user message. The base neutral defaults resolve to a 10px radius, 12px horizontal / 8px vertical padding and an 85% maximum width at a 16px root and scale 1. The fill is `rgb(11 11 11 / 5%)` in light mode and `rgb(255 255 255 / 5%)` in dark mode, composited over the host surface, without an added border or shadow. These values describe the local example. Author-specific and density overrides are not demonstrated. The sample copy, 14px text, 1.6 line height and 24px gap are local adaptations. The separate scroll sample remains unboxed.
- Title spans reveal from 6px blur over 90ms, with index ×30ms delay and `cubic-bezier(.215,.61,.355,1)`. Body chunks instead use a 100ms linear backwards fade. Do not apply title staggering to paragraphs.
- Content growth follows only while pinned and when the bottom gap exceeds 2px. Upward input releases follow; manually scrolling downward to within 1px of the bottom resumes it. Preserve both resize observations so language and width changes remeasure content.
- The return button appears only when unpinned and the end marker is outside a 200px extension. The separate fade uses an 8px extension, 3rem height, the host `--surface` color and a 150ms transition. Its layer ignores pointers. The button has a 200ms transition and is inert while hidden.
- Returning jumps immediately to the bottom, restores follow and moves keyboard focus from the disappearing button to the scroll region. Replay cancels previous sample timers and resets follow.
- While local paragraphs are arriving, the visible return button plays 40 authored 48px frames in a 20px slot, at 33.3333ms per frame (about 1.333s), with `steps(40, jump-none)`. Hover/focus-visible reveals the arrow through a 200ms crossfade; completion restores it. Hidden/completed playback pauses, replay cancels it, and unavailable artwork keeps the arrow. The local mark repeats a contraction and expansion animation.

The 300px local viewport, fixed paragraphs/pacing, simplified touch handling and card colors are demo choices. Scroll replay clears appended paragraphs and holds the scroll position at the top for a static introduction (without blocking manual scrolling). Automatic following begins with the first paragraph. After 1.8 seconds, paragraphs arrive one at a time at 3-second intervals (last at 22.8 seconds); upward scrolling becomes available as the content overflows. This pacing is a local presentation choice, not a Claude streaming parameter. The button demonstrates only the default loop, omitting entry/exit sheets and cross-mount phase continuity. This is not a generation pipeline or the original page/composer layout. Check replay, upward pause, manual/button return, language changes and narrow wrapping without moving the outer page.
