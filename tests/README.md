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

Table tests distinguish cleanup's queued close from an external native close immediately before Activity hides in the same task. After the real close event is delivered while hidden, redisplaying the retained DOM keeps the dialog dismissed and outside focus intact. An immediate hide→show before event delivery is covered too, with both independent and synchronized `active` props.

`migration-links.test.cjs` checks local Markdown/HTML links and anchors, matches the component-guide index to every demo route, and verifies that component imports, CSS sources and asset URLs stay inside the copied `src/` tree. It exercises both POSIX and Windows relative paths with Node's `path.posix` and `path.win32`, including dynamic chapter and Markdown anchors. `source-imports.test.cjs` typechecks the public entry without Vite's ambient types. External URLs are kept out of deterministic tests.

These checks prove local component behavior, not complete pixel/frame parity with Claude. Original-app observation limits remain in [coverage](../docs/coverage.md).
