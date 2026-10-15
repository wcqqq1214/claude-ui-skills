# Text reveal and local scrolling

Use this for progressively revealed local text where readers can pause automatic following and return to the newest content. Keep short title emphasis separate from body reading.

## Read the running code

[HTML](../../showcase/index.html#type) · [JS](../../showcase/components/type.js) · [CSS](../../showcase/components/type.css)

`initTypeDemo()` binds `#typeScroll`, `#typeReading`, `#typeEnd` and `#typeBottom`. `renderTypeTitle()` segments graphemes; `replayType()` owns sample timers. `followType()` and `updateTypeBottom()` own scroll and visibility state.

## Design and adaptation

- Title spans reveal from 6px blur over 90ms, with index ×30ms delay and `cubic-bezier(.215,.61,.355,1)`. Body chunks instead use a 100ms linear backwards fade. Do not apply title staggering to paragraphs.
- Content growth follows only while pinned and when the bottom gap exceeds 2px. Upward input releases follow; manually scrolling downward to within 1px of the bottom resumes it. Preserve both resize observations so language and width changes remeasure content.
- The return button appears only when unpinned and the end marker is outside a 200px extension. The separate fade uses an 8px extension, 3rem height, the host `--surface` color and a 150ms transition. Its layer ignores pointers. The button has a 200ms transition and is inert while hidden.
- Returning jumps immediately to the bottom, restores follow and moves keyboard focus from the disappearing button to the scroll region. Replay cancels previous sample timers and resets follow.

The 300px local viewport, fixed paragraphs/pacing, simplified touch handling and card colors are demo choices. This is not a generation pipeline or the original page/composer layout. Check replay, upward pause, manual/button return, language changes and narrow wrapping without moving the outer page.
