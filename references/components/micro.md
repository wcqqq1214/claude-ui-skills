# Tooltips, ghost hover and copy feedback

Use for: short explanations on hover or focus, the full text of a label only when it is clipped, a ghost icon that looks around on hover, and a small confirmation after a local action.

## React implementation

[Tooltip](../../src/components/micro/Tooltip.tsx) · [GhostButton](../../src/components/micro/GhostButton.tsx) · [CopyButton](../../src/components/micro/CopyButton.tsx) · [useClipboard](../../src/hooks/useClipboard.ts) · [NotificationStack](../../src/components/micro/NotificationStack.tsx) · [styles](../../src/styles/micro.css) · [demo](../../demo/chapters/MicroChapter.tsx)

Follow the [source integration guide](../../demo/README.md). Components import no sample copy, demo IDs or global notification provider.

- `Tooltip`: content and a render-function child. Spread its ref, event handlers and `aria-describedby` onto a focusable trigger. It defaults to an inline anchor; overflowOnly uses a block anchor. `active`, `delay` (300ms), `describedBy` and `onOverflowChange` are optional. The default trigger type is HTMLButtonElement; specify a generic element type for other native triggers.
- Equivalent JSX content and unrelated host renders preserve pending and visible hints. Initial native autofocus, callback-ref and layout-effect focus retain the original delay with or without StrictMode. Activity disconnection cancels pending hints; a fresh focus request after reconnection can start another delay.
- `overflowOnly` measures both scroll width and text Range geometry. Resize, text mutations and font completion dismiss and remeasure. Escape dismisses until a new engagement; pointer and keyboard focus are tracked independently. Closing leaves the fading element mounted while removing its accessibility description. The React version also clamps to viewport edges and flips below when space above is insufficient; it is still inline and may be clipped by an overflow ancestor.
- `GhostButton`: native button props/ref; supply an accessible label and an application action if needed. The demo is a motion preview.
- `CopyButton`: exact text, copyLabel, copiedLabel, failedLabel, optional onCopyResult and native button props/ref. The callback runs only for the latest live request, rechecked at delivery after write completion; Activity disconnection, unmount, pagehide and newer writes invalidate old callbacks. `useClipboard.copy(text, onResult)` offers the same delivery guard while `copy(text)` retains its Promise result. Success resets after 2s; failure remains visible. The clipboard hook uses the original textarea fallback when the secure Clipboard API is unavailable, restores focus/selection, and removes its temporary node.
- Copy feedback keeps its original two-second expiry through React Activity hiding. Reconnection restores only the remaining time, or clears an already expired success; cancelled callbacks never replay. A committed Activity hide or unmount invalidates pending writes and result delivery during layout cleanup, including ordinary scheduled React updates; it does not wait for passive cleanup. Page exit clears feedback and its expiry, while true-unmount cleanup remains silent.
- `NotificationStack` with `mode="single"` provides the replaceable one-at-a-time notice. The host owns fixed positioning and a fallback focus ref; see [notifications](recovery.md).

## Parameters

| Part | Value |
| --- | --- |
| Tip timing | 300ms delay, then 120ms opacity and scale from .98 with `--cui-ease-snap` |
| Truncation test | Scroll width and a text Range, with .1px edge tolerance |
| Ghost eyes | 2.4s ease-in-out loop: left, right, up, center (±1.5px) |
| Ghost press | Fill scales to .9375 over 60ms ease-out; release takes 450ms `--cui-ease-spring` |
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
