# Tooltips, ghost hover and copy feedback

Use these for short explanations that appear on hover or focus, full text only when a label is clipped, and a small confirmation after a local action.

## Read the running code

[HTML](../../showcase/index.html#micro) · [JS](../../showcase/components/micro.js) · [CSS](../../showcase/components/micro.css)

`initMicroDemo()` binds ordinary and overflow tips, copying and a single notification; it returns `showToast` to the notification-stack demo. Read `isTruncated()`, `showOverflowTip()`, `showToast()` and `hideToast()`. Notifications share `.stack-toast` in [recovery.css](../../showcase/components/recovery.css).

## Design and adaptation

- The ghost button keeps its contour still while the eyes look left, right, up and center on hover: a 2.4s repeating ease-in-out cycle. Leaving resets the eyes; holding the button stops them. Keyboard focus alone does not start the hover animation.
- Ordinary and overflow tips wait 300ms, then use 120ms opacity/scale transitions with snap easing and scale .98. Closing removes `aria-describedby` and reverses the visual state. Keep the fading element rendered.
- The existing `#overflowWidth` slider adjusts `.overflow-anchor` from 100–320px, capped by its container, to demonstrate a localized sample filename. Its output is the requested width, not the final available width. The slider and filenames are local teaching aids, not a Claude setting or real files.
- Truncation checks both scroll width and a text Range, including `.1px` edge tolerance. Width, language and font-readiness changes dismiss the old tip and remeasure; untruncated text needs no duplicate explanation.
- Copy success appears only after clipboard writing succeeds. The fallback uses a temporary selected textarea, restores focus and reports failure rather than showing a false success.
- A single notification replaces its text and resets a 6s timer. Closing keeps it rendered until transitions finish, makes it inert and uses a revision to ignore outdated completions. Focus inside the closing toast returns to its trigger.

The ghost is a motion-only sample with a local label and explanation; it does not open an incognito session or add a tooltip/shortcut. Top placement, bottom-center tooltip origin, copy fallback, fixed toast position/360px width and replacement behavior are local choices. Collision placement and grouped instant/hoverable tooltip paths are not reproduced. Check keyboard focus/Escape, clipping boundaries, copy outcome and repeated notification replacement.
