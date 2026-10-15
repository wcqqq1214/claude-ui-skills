# Text reveal and local scrolling

Use this for a user message followed by progressively revealed local text where readers can pause automatic following and return to the newest content. Keep short title emphasis separate from body reading.

## Read the running code

[HTML](../../showcase/index.html#type) · [JS](../../showcase/components/type.js) · [CSS](../../showcase/components/type.css)

`initTypeDemo()` binds `#typeScroll`, `#typeReading`, `#typeEnd` and `#typeBottom`. `renderTypeTitle()` segments graphemes; `replayType()` owns sample timers; `stopTypePlayback()` cancels them and the working-mark animation. Chapter activation (`#type[data-active]`), set by [shell.js](../../showcase/shell.js), starts playback on entry and stops it on exit. `followType()` and `updateTypeBottom()` own scroll and visibility state.

The button also uses the bundled [default loop sheet](../../showcase/components/status-assets/default-loop.webp). `updateTypeBottom()` drives `.type-working-strip` directly; include this asset when adapting the linked JS and CSS.

## Design and adaptation

- `.type-user-row` and `.type-user-bubble` in the linked HTML/CSS show one static, right-aligned user message. The base neutral defaults resolve to a 10px radius, 12px horizontal / 8px vertical padding and an 85% maximum width at a 16px root and scale 1. The fill is `rgb(11 11 11 / 5%)` in light mode and `rgb(255 255 255 / 5%)` in dark mode, composited over the host surface, without an added border or shadow. These values describe the local example. Author-specific and density overrides are not demonstrated. The sample copy, 14px text, 1.6 line height and 24px gap are local adaptations. The existing assistant body remains unboxed.
- Title spans reveal from 6px blur over 90ms, with index ×30ms delay and `cubic-bezier(.215,.61,.355,1)`. Body chunks instead use a 100ms linear backwards fade. Do not apply title staggering to paragraphs.
- Content growth follows only while pinned and when the bottom gap exceeds 2px. Upward input releases follow; manually scrolling downward to within 1px of the bottom resumes it. Preserve both resize observations so language and width changes remeasure content.
- The return button appears only when unpinned and the end marker is outside a 200px extension. The separate fade uses an 8px extension, 3rem height, the host `--surface` color and a 150ms transition. Its layer ignores pointers. The button has a 200ms transition and is inert while hidden.
- Returning jumps immediately to the bottom, restores follow and moves keyboard focus from the disappearing button to the scroll region. Replay cancels previous sample timers and resets follow.
- While local paragraphs are arriving, the visible return button plays 40 authored 48px frames in a 20px slot, at 33.3333ms per frame (about 1.333s), with `steps(40, jump-none)`. Hover/focus-visible reveals the arrow through a 200ms crossfade; completion restores it. Hidden/completed playback pauses, replay cancels it, and unavailable artwork keeps the arrow. The local mark repeats a contraction and expansion animation.

The 300px local viewport, fixed paragraphs/pacing, simplified touch handling and card colors are demo choices. Replay clears the assistant text and holds the scroll position at the top during the title/body introduction (without blocking manual scrolling). Automatic following begins with the first paragraph. After 1.8 seconds, paragraphs arrive one at a time at 3-second intervals (last at 22.8 seconds); upward scrolling becomes available as the content overflows. This pacing is a local presentation choice, not a Claude streaming parameter. The button demonstrates only the default loop, omitting entry/exit sheets and cross-mount phase continuity. This is not a generation pipeline or the original page/composer layout. Check replay, upward pause, manual/button return, language changes and narrow wrapping without moving the outer page.
