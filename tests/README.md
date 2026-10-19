# Verification after the React migration

Run `npm test`: deterministic TypeScript geometry/search checks, a fresh production build, then every browser suite. Chrome/Chromium must be installed; `CHROME_BIN` can override discovery. `npm run test:react` runs source-consumer and chapter checks; `npm run test:production` rebuilds and verifies static delivery.

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

React suites also exercise independently imported components without the demo stylesheet or globals, lifecycle cleanup and multiple instances. The production suite serves `dist/` with a plain HTTP file server, tests root/repository-subpath entries and both HTML entry points, traverses all 14 chapters, verifies image spring CSS and local asset delivery, and checks saved preferences, denied storage and history.

These checks prove local component behavior, not complete pixel/frame parity with Claude. Original-app observation limits remain in [coverage](../docs/coverage.md).
