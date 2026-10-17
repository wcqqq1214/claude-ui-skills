# Notification stacks

Use this for notifications that remain manageable as messages arrive or leave. It models presentation only.

## Read the running code

[HTML](../../showcase/index.html#recovery) · [JS](../../showcase/components/recovery.js) · [CSS](../../showcase/components/recovery.css)

`initRecoveryDemo(showToast)` binds `addNotice()`, `removeNotice()` and `arrangeNotices()`. Its callback shows a local result using [micro.js](../../showcase/components/micro.js); include [micro.css](../../showcase/components/micro.css) for that single notification’s container positioning, width and stacking level. The `.stack-toast` skin is also used by that single-notification example.

## Design and adaptation

- The stack exposes three layers while retaining further entries. Limited entries are hidden and inert, so closing front entries reveals queued items. Repeated messages reuse their existing entry; action notifications persist, while ordinary ones use a 6s timer.
- Entry moves from translateY(100%)/opacity 0; exit goes to scale .85/opacity 0. Both use 200ms `cubic-bezier(.165,.84,.44,1)`. Rear content fades by opacity/visibility; exiting content retains its state until transitions complete.
- Dismiss controls use a 16px X with 4px padding in an explicit 24×24px centered box, without inheriting a text line box.
- Active indices exclude exiting items; exiting indices follow DOM order. Front height is natural, rear layers use it, and ResizeObserver updates geometry. Focused entries retain their ordering; closing moves focus to a usable neighbor or trigger.

A persistent action notice seeds the preview; “Stack three” adds three ordinary timed notices through the same `addNotice()` path. “Clear notices” sends all active entries through `removeNotice()`, cancelling their timers and preserving exit transitions and observer cleanup. The preview layout, batch controls, action-button styling and focus policy are local. There is no hover expansion. Check clearing during exit, adding after clearing, dedupe, action persistence and queue replenishment with more than three messages.
