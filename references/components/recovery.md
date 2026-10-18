# Notification stacks

Use for: notifications that stay manageable as messages arrive and leave. Presentation only.

## Code

[HTML](../../showcase/index.html#recovery) · [recovery.js](../../showcase/components/recovery.js) · [recovery.css](../../showcase/components/recovery.css)

- `initRecoveryDemo(showToast)` binds `addNotice()`, `removeNotice()` and `arrangeNotices()`.
- The callback shows a result through [micro.js](../../showcase/components/micro.js); include [micro.css](../../showcase/components/micro.css) for the single notification's container, position, width and stacking level. Both use the `.stack-toast` skin.

## Parameters

| Part | Value |
| --- | --- |
| Visible layers | Three; further entries wait hidden and inert |
| Rear layers | Each step back moves −14px and scales by −4% |
| Enter | From translateY(100%), opacity 0; 200ms `--ease-out` |
| Exit | To scale .85, opacity 0; 200ms `--ease-out` |
| Timer | Ordinary notices 6s; action notices persist |
| Dismiss control | 16px X with 4px padding in an explicit 24×24px centered box |
| Surface | 10px radius |

## Rules

- A repeated message reuses its existing entry.
- Closing a front entry reveals the next queued one.
- Active indices skip exiting items; exiting items keep DOM order.
- The front entry has its natural height and rear layers take that height; ResizeObserver keeps the geometry current.
- Rear content fades through opacity and visibility. Exiting content keeps its state until its transitions finish.
- A focused entry keeps its place in the order. Closing it moves focus to a usable neighbor, else the trigger.

## Check

- [ ] Clearing during an exit; adding after clearing
- [ ] Deduplication and action-notice persistence
- [ ] Queue refill with more than three messages

Local adaptations and limits: [coverage](../../docs/coverage.md#recovery).
