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

Review regressions cover JSX tooltip content with parent state callbacks, exact draft blank lines from native editing, real clipboard fallback inside a modal dialog, live system/scoped theme changes in the pinned-menu portal, and uncached preview images with cancellation before loading completes.

Migration-parity checks also cover transient notice dismissal on chapter exit while persistent notices survive, Finish retaining the skeleton's original 500ms deadline, Replay cancelling the old scroll working-mark animation, and submenu feedback retaining both preview and selected values.

`migration-links.test.cjs` checks local Markdown/HTML links and anchors, matches the component-guide index to every demo route, and verifies that component imports, CSS sources and asset URLs stay inside the copied `src/` tree. `source-imports.test.cjs` typechecks the public entry without Vite's ambient types. External URLs are kept out of deterministic tests.

These checks prove local component behavior, not complete pixel/frame parity with Claude. Original-app observation limits remain in [coverage](../docs/coverage.md).
