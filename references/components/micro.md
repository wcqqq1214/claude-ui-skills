# Tooltips, ghost hover and copy feedback

Use for: short explanations on hover or focus, the full text of a label only when it is clipped, a ghost icon that looks around on hover, and a small confirmation after a local action.

## Code

[HTML](../../showcase/index.html#micro) · [micro.js](../../showcase/components/micro.js) · [micro.css](../../showcase/components/micro.css)

- `initMicroDemo()` binds ordinary and overflow tips, copying and a single notification, and returns `showToast` to the [notification stack](recovery.md).
- Read `isTruncated()`, `showOverflowTip()`, `showToast()` and `hideToast()`.
- Notifications share `.stack-toast` from [recovery.css](../../showcase/components/recovery.css).

## Parameters

| Part | Value |
| --- | --- |
| Tip timing | 300ms delay, then 120ms opacity and scale from .98 with `--ease-snap` |
| Truncation test | Scroll width and a text Range, with .1px edge tolerance |
| Ghost eyes | 2.4s ease-in-out loop: left, right, up, center (±1.5px) |
| Ghost press | Fill scales to .9375 over 60ms ease-out; release takes 450ms `--ease-spring` |
| Notification | One at a time; 6s timer |

## Rules

- Closing a tip removes `aria-describedby` and reverses the visual state; keep the fading element rendered until it finishes.
- Width, language and font-loading changes dismiss the current tip and remeasure. Text that fits gets no overflow tip.
- The ghost's outline stays still; only the eyes move. Hover starts the loop on hover-capable devices, leaving resets the eyes, and pressing stops them. Keyboard focus alone leaves them still.
- Show copy success only after the clipboard write succeeds. The fallback copies through a temporary selected textarea, restores focus and reports failure.
- A new notification replaces the text and restarts the timer. A closing notification stays rendered and inert until its transitions finish, and a revision counter ignores outdated completions. Focus inside a closing notification returns to its trigger.

## Check

- [ ] Keyboard focus and Escape on tips
- [ ] Overflow tips at the clipping boundary
- [ ] Ghost hover, leave and press, repeated
- [ ] Copy success and failure
- [ ] Repeated notification replacement

Local adaptations and limits: [coverage](../../docs/coverage.md#micro).
