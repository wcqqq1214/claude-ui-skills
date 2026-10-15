# Retry presentation and notification stacks

Use these for a visible local failure/busy/success sequence and several notifications that remain manageable as messages arrive or leave. They model presentation, not network recovery.

## Read the running code

[HTML](../../showcase/index.html#recovery) · [JS](../../showcase/components/recovery.js) · [CSS](../../showcase/components/recovery.css)

`initRecoveryDemo(showToast)` binds `drawRetry()`, `addNotice()`, `removeNotice()` and `arrangeNotices()`. Its callback shows a local result using [micro.js](../../showcase/components/micro.js); include [micro.css](../../showcase/components/micro.css) for that single notification’s container positioning, width and stacking level. The `.stack-toast` skin is also used by that single-notification example.

## Design and adaptation

- Retry disables its action while busy and preserves keyboard focus when the result replaces content. The 900ms delay and selectable outcome are sample pacing; no request, reconnection or backoff is involved.
- The stack exposes three layers while retaining further entries. Limited entries are hidden and inert, so closing front entries reveals queued items. Repeated messages reuse their existing entry; action notifications persist, while ordinary ones use a 6s timer.
- Entry moves from translateY(100%)/opacity 0; exit goes to scale .85/opacity 0. Both use 200ms `cubic-bezier(.165,.84,.44,1)`. Rear content fades by opacity/visibility; exiting content retains its state until transitions complete.
- Active indices exclude exiting items; exiting indices follow DOM order. Front height is natural, rear layers use it, and ResizeObserver updates geometry. Focused entries retain their ordering; closing moves focus to a usable neighbor or trigger.

The demo's role/placement, fixed stage, action-button styling and focus policy are local choices. There is no hover expansion. Check repeated failures, reset during busy state, dedupe, action persistence and queue replenishment with more than three messages.
