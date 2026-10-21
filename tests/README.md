# Verification after the React migration

Run `npm test`: deterministic geometry/search checks, documentation/source integration checks, a fresh production build, then every browser suite. Chrome/Chromium must be installed; `CHROME_BIN` can override discovery. `npm run test:react` runs source-consumer and chapter checks; `npm run test:production` rebuilds and verifies static delivery.

The original tests loaded page-global scripts or queried the retired showcase DOM. Their behavioral coverage is carried by these suites:

| Retired coverage | Current coverage |
| --- | --- |
| Theme, locale, chapters and history | `production.browser.cjs`, `react-components.browser.cjs` and localized chapter checks |
| Text replay, copy races, number clocks and icon alignment | `react-reading.browser.cjs` |
| Attachment add/remove and composer folding | `react-composer.browser.cjs` |
| Activity mark seam/entry/exit state machine | `react-feedback.browser.cjs` (deterministic controller checks and rendered lifecycle) |
| Artifact action-card return | `react-menus.browser.cjs` |
| Ghost press/hover and copy notices | `react-micro.browser.cjs` |
| Workspace resize, sidebar running indicator and pinned reordering | `react-workspace.browser.cjs` |
| Image preview geometry and interruption | `react-images.browser.cjs` |
| Gallery gestures and zoom math | `react-gallery.browser.cjs`, `gallery-zoom.test.cjs` |
| Task progress and drop feedback | `react-tasks.browser.cjs` |
| Search settling, interruption and cancellation | `search-highlight.test.cjs`, `react-menus.browser.cjs` |

React suites also exercise independently imported components without the demo stylesheet or globals, lifecycle cleanup and multiple instances. The production suite serves `dist/` with a plain HTTP file server, tests root/repository-subpath entries and both HTML entry points, traverses all 14 chapters, verifies image spring CSS and local asset delivery, and checks saved preferences, denied storage and history. It also verifies the restored language menu and narrow chapter picker, focus return, and the controls geometry measured from the original demo through computer use.

`react-ssr.browser.cjs` renders the public source with Vite SSR, then hydrates it in Chrome under StrictMode. It checks matching initial markup without filesystem URLs, real sprite decoding, pause/resume, Replay, unmount cleanup and decode-failure fallback.

Review regressions cover JSX tooltip content with parent state callbacks, exact draft blank lines from native editing, real clipboard fallback inside a modal dialog, live system/scoped theme changes in the pinned-menu portal, and uncached preview images with cancellation before loading completes.

Migration-parity checks also cover transient notice dismissal on chapter exit while persistent notices survive, Finish retaining the skeleton's original 500ms deadline, Replay cancelling the old scroll working-mark animation, and submenu feedback retaining both preview and selected values.

Further parity regressions cover queued Gallery close events during reopening, composer height after native formatting/undo/redo, legacy preference migration and invalid-language fallback, static title translation with explicit Replay, localized restored-order status, chapter reselection returning to the top, and drag-cancellation feedback when leaving a chapter. The corresponding suites also retain external dialog-close handling, draft callback deduplication, history length, inactive drag guards and silent unmount cleanup.

Gallery checks also use React Activity under StrictMode to retain the same dialog DOM through hidden→visible effect reconnection. They verify immediate reopening, reopening after the old close event was delivered while hidden, exact open-change callbacks and subsequent external native closing, with native, unavailable and throwing View Transition APIs.

Activity regressions also retain the same editor, scroll region and table/image dialogs. They check draft text, mentions, native undo and semantic blank lines; unchanged reset keys preserve reading positions and current gallery items, while explicit resets made when hidden still apply. Table cleanup releases the modal and focus while hidden, and an obsolete close event cannot clear the restored table. Image checks cover queued close events and synchronous focus cancellation without leaving hidden thumbnails or transition names. Notification checks deliver an obsolete deadline after replacing or refreshing its notice, verifying that persistent or extended replacements keep their own deadlines.

Notification repetition checks use a paused clock: the 900ms sample lifetime cannot depend on how quickly Playwright performs three clicks. With StrictMode enabled and disabled, they verify same-ID/DOM count increments before expiry, renewed deadlines and live announcements, then fresh IDs/counts after expiry begins or removal finishes. A held exit animation keeps the old DOM present while a new same-key notice arrives, so completing the old exit must preserve the replacement. Pointer, geometry, focus and default-duration checks still run on real time.

Table tests distinguish cleanup's queued close from an external native close immediately before Activity hides in the same task. After the real close event is delivered while hidden, redisplaying the retained DOM keeps the dialog dismissed and outside focus intact. An immediate hide→show before event delivery is covered too, with both independent and synchronized `active` props.

Further retained-DOM checks preserve StatusMark stages, exact animation times and completion delivery without implicit Replay. They also cover an explicit Replay while hidden, interrupted completion microtasks and StrictMode. Gallery/ImagePreview checks reconnect without a new opening request and verify closed ARIA state, retained selection, cleared zoom, silent cleanup and synchronous or microtask reopening with all three View Transition modes.

CopyButton and CodeBlock checks preserve the original success deadline through short or expired Activity hiding, replace deadlines on new success and invalidate pending writes on disconnection, pagehide and unmount. Submenu checks repeat click/ArrowRight activation while already open and verify selected/first-enabled focus without committing a preview. Production checks retain vertical and nested horizontal scroll positions through translation, restore the original overflow-anchor setting even for batched language changes returning to the same locale, and preserve history length.

Further migration regressions exercise native attachment View Transition updates delivered while Activity is hidden, exactly-once deletion, surviving DOM/focus and true unmount cancellation. Notification tests reconnect dismissed cards after their exit, deliver notifications from callback refs and host layout effects, and retain absolute expiry deadlines. Slider tests release a real pointer while hidden, then verify the same input has no pressed state or stale pointer owner. Short-window Replay tests start with the list offscreen, scroll into view, and cancel on chapter/document hiding. Nested skeleton children add, remove, replace, resize and reposition rows without rerendering their parent, including text reflow and observer teardown. Held artwork requests verify WorkingMark's pending fallback, a visible return-button arrow, decode/reconnect, failure and true unmount; SSR checks hydrate matching pending markup before the resource completes.

Gallery selection regressions synchronously hide, empty, unmount, cancel or replace an opening from `onValueChange`, using native, unavailable and throwing View Transition APIs. The scroll Replay regression uses a short window with a visible button and less than 25% of its region visible, then checks clearing, return to the top, timed arrivals and visibility cancellation. Notification message/renderMessage and Artifact subtitle SSR cases use block React nodes, collect recoverable hydration errors and retain the server-rendered nodes; palette checks also cover the opened subtitle and ordinary text geometry.

Host-callback regressions refresh notices synchronously from actions in stack/single mode and preserve replacement content, actions and deadlines. Search focus handlers cancel, deactivate or replace requests without reviving old highlights or losing cleanup ownership. Slider tests use real pointer-down callbacks that synchronously unmount, disable or reconnect the control. Inactive MentionEditor checks retain native editing while preventing mention context menus and focus theft, then restore normal context deletion and undo on reactivation.

Menu lifecycle regressions open Submenu and Artifact menus before Activity disconnects their retained DOM, including a synchronized inactive prop and same-task hide/show. Reconnection preserves outside focus and keeps the menus dismissed without old entry/return animations; fresh selection still works. Return-button and pane-resize regressions use focus capture and bubble callbacks that synchronously deactivate, hide, reconnect or unmount the owner, with pane expansion covered too. They verify no stale scrolling, following, pointer capture or width callback, then recover normal Return, mouse and keyboard behavior. All these cases run with StrictMode enabled and disabled.

Search lifecycle regressions place the hook in a parent and request highlights from child callback refs and `useLayoutEffect` on first mount and Activity retained-DOM reconnection, with StrictMode enabled and disabled. The destination follows the same Activity's visibility. Checks retain that DOM, verify focus and highlight delivery, discard calls targeting the hidden retained destination without replay on reveal, and preserve synchronous focus cancellation/replacement plus inactive and true-unmount saved-method protection. External or portal destinations retain the documented host `active` contract.

`migration-links.test.cjs` checks local Markdown/HTML links and anchors, matches the component-guide index to every demo route, and verifies that component imports, CSS sources and asset URLs stay inside the copied `src/` tree. It exercises both POSIX and Windows relative paths with Node's `path.posix` and `path.win32`, including dynamic chapter and Markdown anchors. `source-imports.test.cjs` typechecks the public entry without Vite's ambient types. External URLs are kept out of deterministic tests.

These checks prove local component behavior, not complete pixel/frame parity with Claude. Original-app observation limits remain in [coverage](../docs/coverage.md).
