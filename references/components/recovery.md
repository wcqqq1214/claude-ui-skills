# Notification stacks

Use for: notifications that stay manageable as messages arrive and leave. Presentation only.

## React implementation

[NotificationStack](../../src/components/micro/NotificationStack.tsx) · [styles](../../src/styles/micro.css) · [demo](../../demo/chapters/NotificationsChapter.tsx) · [source integration](../../demo/README.md)

`NotificationStack` owns its items, deadlines, animation exit cleanup and focus order. A ref exposes `notify({ message, key?, action?, duration? })`, `dismiss(id)` and `clear()`. `notify` returns the instance-local ID. Messages/action labels are React nodes; an action supplies an onClick callback. No global provider is needed.

- Ordinary notices default to 6000ms. Action notices default to persistence; duration overrides either behavior, and null always persists. Each item keeps an absolute deadline, so unrelated additions never extend it.
- Replacing a single notice or refreshing a matching key invalidates its previous deadline, even if that timer's callback is already queued. The replacement's duration, including null, takes effect immediately.
- A key deduplicates non-exiting entries and increments the count. The default display appends `(×count)`; `renderMessage(message, count)` supports translated or custom text. Repetitions after the second suppress repeated live announcements.
- `mode="single"` replaces and refreshes the existing entry, including while exiting. Its obsolete exit completion is cancelled. Stack mode keeps exiting entries separate when the same key arrives again.
- `defaultNotices` initializes a stack once. `dismissLabel` is required; `label`, `empty`, wrapper class/style and fallbackFocus are optional. Use one stable component instance per local stack.
- `active=false` makes the stack inert and disables live announcements/focus restoration. Deadlines continue to run while hidden. Unmount clears its timers and ignores pending exits.
- The host owns placement and business effects. Pass presentational message content; use action for interactive controls. For dynamic localization, render messages with renderMessage or context-aware React nodes so existing notices update too.

## Parameters

| Part | Value |
| --- | --- |
| Visible layers | Three; further entries wait hidden and inert |
| Rear layers | Each step back moves −14px and scales by −4% |
| Enter | From translateY(100%), opacity 0; 200ms `--cui-ease-out` |
| Exit | To scale .85, opacity 0; 200ms `--cui-ease-out` |
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
