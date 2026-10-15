# Waiting, skeletons and accordion

Use an animated thinking mark and a text-clipped sweep for an ongoing status summary, a delayed skeleton for content that has not arrived, and an accordion to keep optional detail close without occupying permanent space.

## Read the running code

[HTML](../../showcase/index.html#feedback) · [JS](../../showcase/components/feedback.js) · [CSS](../../showcase/components/feedback.css)

`createThinkingMark()` plays the bundled [grow](../../showcase/components/status-assets/grow.webp), [entry](../../showcase/components/status-assets/think-in.webp), [loop](../../showcase/components/status-assets/think-loop.webp) and [exit](../../showcase/components/status-assets/think-out.webp) sheets. Include these assets when adapting the JS. `createStatusShimmer()` owns the status text and its hidden visual clone; `.status-shimmer` supplies the sweep. `initFeedbackDemo()` binds the Finish/Replay and timeline controls. `runSkeleton()` / `clearSkeleton()` own the skeleton-delay timer, the shared sweep clip and its ResizeObserver. Loaded content also uses `.word-fade` from [text styles](../../showcase/components/type.css).

## Design and adaptation

- Thinking mark: 48px frames in a fixed 20px slot; 33.3333ms per frame. Grow/entry/loop/exit have 10/16/110/15 frames (approximately 333/533/3667/500ms). Preserve the artwork and `steps(frameCount, jump-none)` playback; a CSS dot bounce is not equivalent. This example plays the thinking animation.
- Status shimmer uses the secondary variant: 3s cycle, 0–15% initial hold, 15–85% travel with `cubic-bezier(.714,.121,.211,.888)`, then a final hold. The 120° gradient has 37.5/50/62.5% stops; light uses `--secondary`, dark uses `--muted`, with a 30%-base/white peak. The text-background fallback spans 400% and moves from 83.333% to 16.667%. Supported Chromium uses the masked clone with a -62.5% to -12.5% band instead.
- The example uses a block flex item without line clamping. If adapting to inline or clamped text, keep the fallback or check the layout before enabling the animation. The stable clone updates without restarting its animation on translation; completion hides/empties it and stops the sweep. This is status-summary motion, not an effect applied to expanded reasoning.
- Wait 500ms before inserting a skeleton, then fade it in over 150ms. One 2s linear sweep crosses the group; a 105° gradient with 35%–65% stops is clipped to the actual child rectangles. Recompute the clip when the group resizes.
- The status and skeleton start automatically and loop until **Finish**. Finish waits for the current mark stage and exit, then stops the shimmer, disconnects the skeleton observer and shows translated content. Repeated Finish presses are ignored while closing; the same button retains focus and becomes **Replay** on completion. Replay clears the previous delay/observer and starts a fresh sequence. There is no automatic completion timer. This manual lifecycle and reserved empty mark slot are local adaptations; unavailable artwork or animation support retains a static dot while waiting.
- The timeline toggles `aria-expanded`, its grid track and opacity over 200ms; hidden detail is inert. The collapse timing belongs to this demo.

The two-row skeleton and page-lifetime status example omit cross-mount phase compensation, activity changes, mid-loop seam transitions and nested/cross-group synchronization. Check repeated Finish/Replay, resize during the sweep, translated loaded content and accordion focus reachability.
