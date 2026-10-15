# Waiting, skeletons and accordion

Use quiet dots for ongoing activity, a delayed skeleton for content that has not arrived, and an accordion to keep optional detail close without occupying permanent space.

## Read the running code

[HTML](../../showcase/index.html#feedback) · [JS](../../showcase/components/feedback.js) · [CSS](../../showcase/components/feedback.css)

`initFeedbackDemo()` binds the reload and timeline controls. `runSkeleton()` / `clearSkeleton()` own timers, the shared sweep clip and its ResizeObserver. Loaded content also uses `.word-fade` from [text styles](../../showcase/components/type.css).

## Design and adaptation

- Quiet dots loop over 1900ms with 0/150/300ms offsets and initial opacity 0. Preserve the inline-flex container's top `.26em` alignment with the status text.
- Wait 500ms before inserting a skeleton, then fade it in over 150ms. One 2s linear sweep crosses the group; a 105° gradient with 35%–65% stops is clipped to the actual child rectangles. Recompute the clip when the group resizes.
- Replay cancels timers and disconnects the previous observer before replacing content. The demo resolves after 2300ms and clones translated content; that timeout is sample pacing.
- The timeline toggles `aria-expanded`, its grid track and opacity over 200ms; hidden detail is inert. The collapse timing belongs to this demo.

The two-row skeleton and page-lifetime status examples omit cross-mount elapsed compensation and nested/cross-group synchronization. Check rapid reload, resize during the sweep, translated loaded content and accordion focus reachability.
