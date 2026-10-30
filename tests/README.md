# Tests

## Run

From the repository root, install dependencies with `npm ci`. Browser suites require Chrome/Chromium; set `CHROME_BIN` to override discovery.

| Command | Scope |
| --- | --- |
| `npm test` | Unit checks, a fresh production build, then all browser suites |
| `npm run test:unit` | Deterministic geometry/search, documentation/source integration and test-runner lifecycle checks |
| `npm run test:react` | Browser suites whose names contain `react-` |
| `npm run test:production` | Rebuild, then verify static delivery |
| `npm run test:browser -- gallery --jobs=2 --timeout=180` | Matching browser suites, up to two concurrently, 180 seconds each |

`test:browser` does not rebuild the main demo. Run `npm run build` first when selecting the production suite directly. The Tailwind host suite builds its own temporary application.

The runner streams prefixed stdout/stderr, prints start times and reports elapsed time every 30 seconds. Vite-reported unhandled browser errors and promise rejections fail the suite even if its process exits with code 0; this includes native ResizeObserver error events that can escape Playwright `pageerror` assertions. Static production and Tailwind consumer suites additionally install [native error capture](browser-errors.cjs) before navigation, forwarding `window.error` and `unhandledrejection` to their error assertions without suppressing browser events. Suite-owned page/console and network assertions remain in place. The default per-suite timeout is 600 seconds; `--timeout=0` disables it. Timeout/interruption cleanup terminates discoverable descendant groups and closes inherited output pipes after a two-second grace period. Children already reparented before cleanup may need manual cleanup because their former owner cannot be identified safely. Windows uses `taskkill /T /F`; its cleanup behavior still needs Windows validation.

## Coverage by area

Source consumers import public components without demo styles or globals. The suites exercise controlled state, independent instances, keyboard input, themes, locales and responsive layouts where applicable. The linked files own the individual assertions.

| Area | Suite | Distinct coverage |
| --- | --- | --- |
| Controls and segmented selection | [react-components](react-components.browser.cjs) | Native checkbox reset/range input, endpoints, disabled options, immediate radio selection, interrupted indicator geometry, translated labels, zoom and narrow layouts |
| Text, scrolling, code and tables | [react-reading](react-reading.browser.cjs) | Graphemes, explicit Replay, copy/fallback inside a modal, exact text, scroll following, native table dialog and focus return |
| Activity marks, skeletons and disclosure | [react-feedback](react-feedback.browser.cjs) | Deterministic playback controller, seams/entry/exit, exact animation times, pause/resume, decode failure, pending completion cancellation, nested skeleton row changes/reflow and observer teardown, Accordion focus |
| Composer and attachments | [react-composer](react-composer.browser.cjs) | Native undo/IME/paste, semantic blank lines and mention metadata, draft callback deduplication, one synchronous height measurement per input/clear and height after formatting/undo, toolbar folding, exactly-once attachment removal, real View Transitions, touch/keyboard guards and inactive mention menus |
| Menus, search and artifact actions | [react-menus](react-menus.browser.cjs) | Preview versus committed selection, repeated submenu activation, grouping/filtering, highlight settling/cancellation, action-card geometry and deferred focus, real host callbacks |
| Tooltips, copy and notifications | [react-micro](react-micro.browser.cjs) | JSX content and parent updates, overflow and Escape, ghost hover/press, clipboard races, notice focus/order/deduplication, absolute deadlines, interrupted exit/replacement and host action refresh |
| File panels and pinned navigation | [react-workspace](react-workspace.browser.cjs) | Resize thresholds/bounds/cancellation, F6, preview isolation, mode focus versus selection, RTL, pinned drag/menu order, idle-free drag frame scheduling and queued-frame cancellation, translated restore/cancellation status and portal theme inheritance |
| Image preview | [react-images](react-images.browser.cjs) | Pan/zoom geometry, uncached image loading/cancellation, opening/closing interruption, native dialog events, retained DOM and synchronous focus cancellation |
| Gallery | [react-gallery](react-gallery.browser.cjs), [zoom unit checks](gallery-zoom.test.cjs) | Gesture math, paging, current selection/zoom, external native close, obsolete close events, immediate reopening and host selection callbacks that hide, empty, unmount, cancel or replace an opening |
| Task cards and progress | [react-tasks](react-tasks.browser.cjs) | Progress updates, replay, keyboard drop feedback and lifecycle cleanup |
| Visual geometry | [react-visual-parity](react-visual-parity.browser.cjs) | Source-only typography/colors, Accordion font overrides, reading introduction's 73px minimum at the 620/621px boundary, natural appended paragraph height, pane feedback across scoped/custom themes and pinned weights 500/460 |
| Server rendering | [react-ssr](react-ssr.browser.cjs) | Matching public-source markup without filesystem URLs, hydration retaining DOM, pending/decoded/failed sprites, pause/resume/Replay, and block React nodes in notice messages and artifact subtitles |
| Production delivery | [production](production.browser.cjs) | Plain HTTP serving of `dist/`, root/subpath and both HTML entries, all 13 chapters, local assets/image spring, saved/legacy preferences, invalid language and denied storage, navigation/history, focus return, slider dimensions and scroll preservation through translation |
| Demo presentation | [demo-presentation](demo-presentation.browser.cjs) | All chapters in English/Chinese, light/dark, desktop/320px, StrictMode off/on; optional notes without remounting, legible copy, separators, overflow, narrow navigation and persisted/system themes |
| Demo settings | [demo-settings](demo-settings.browser.cjs) | Theme icon and turtle controls, default 0.2×/normal timing, keyboard/touch, inactive controls, independent standard/compact selection, indicator alignment, chapter/hash/history and state/focus through locale/notes changes at 320/390/1280px |
| Existing Tailwind host | [tailwind-host](tailwind-host.browser.cjs) | Copies the [example](../examples/tailwind-host/README.md) and complete source, typechecks/builds, then verifies host utilities, component styles, controlled keyboard state, scoped themes and local icon/sprite assets |

## Lifecycle regression map

Retained React Activity DOM has different obligations from a true unmount. Tests retain node identity, editor undo, reading positions and selection when reset keys stay unchanged; explicit resets made while hidden apply on reconnection. Hidden views must not revive an old overlay, callback, pointer owner or focus request. Relevant cases run with StrictMode off/on, synchronized or independent `active` props, and ordinary as well as synchronous hiding. Image/gallery cases exercise native, unavailable and throwing View Transition APIs.

| Boundary | Checks and cases |
| --- | --- |
| Table exit and focus | [table-exit](table-exit-checks.cjs): actual CSS close transitions, retained DOM/height until exit finishes, release afterward, button/Escape return, newer outside focus and second-modal isolation. Distinguishes a cleanup-generated close from a real native close immediately before hiding; covers same-task hide/show, rapid reopen, repeated reconnection, deactivation and silent unmount. |
| Copy completion | [copy-delivery](copy-delivery-checks.cjs): preserve the original success deadline through short/expired hiding, restart on new success, discard pending writes after disconnection, pagehide, unmount or newer requests. |
| Notice repetition | [notification-repeat](notification-repeat-checks.cjs): paused-clock 900ms lifetimes, same-ID/DOM count and announcement changes, refreshed deadlines, fresh IDs after expiry, and held exit completion that cannot remove a same-key replacement. Pointer/geometry/focus/default-duration checks use real time. |
| Status and notices | [status-notice-lifecycle](status-notice-lifecycle-checks.cjs): outside layout effects finish animations during asynchronous hiding/unmount, actions hide their owner, replay/running changes occur while hidden or alongside reveal; stale callbacks cannot enter a new request. Notice handles also work from callback refs/layout effects, and dismissed cards finish cleanup on reconnection. |
| Already-dispatched input | [capture-lifecycle](capture-lifecycle-checks.cjs), [menu-callback](menu-callback-checks.cjs), [pinned-activity](pinned-activity-checks.cjs): hiding during capture or host callbacks cannot reopen menus, move outside focus or commit stale widths/orders. Fresh keyboard/pointer interaction still works. |
| Tooltip requests | [tooltip-request](tooltip-request-checks.cjs): autofocus, callback-ref/layout-effect requests, stable JSX content and Activity reconnection retain or cancel the correct request. |
| Page lifecycle | [page-lifecycle](page-lifecycle-checks.cjs): reading counters and WorkingMark cancel on pagehide and restart appropriately on pageshow, separately from ordinary pause/resume; held artwork covers pending fallback, return-arrow visibility, decode failure and true unmount. |
| Cross-component reentry | [migration-review](migration-review-checks.cjs): Gallery handles invoked from layout/passive effects, one opening callback after the effect probe, cancellation before connection and source-only presentation. [Workspace preview](workspace-preview-checks.cjs) and [visual parity](visual-parity-checks.cjs) retain their focused assertions. |

Search-specific tests also request highlights from child callback refs and layout effects while the hook lives in a parent. The destination follows the same Activity visibility; hidden destinations are discarded, and external/portal destinations follow the host's `active` contract. Focus callbacks can cancel, replace or deactivate requests. [Deterministic search tests](search-highlight.test.cjs) cover the 250ms/three-frame minimum, 1500ms cap, input suppression and cleanup.

Further suite-owned cases cover slider release while hidden and synchronous pointer-handler deactivation/unmount; attachment snapshot updates delivered while hidden; skeleton Finish preserving its original 500ms deadline; and short-window scroll Replay with less than 25% of the region visible. Replaying clears old arrivals/working animations and respects chapter/document visibility. Production translation preserves vertical and nested horizontal positions, restores overflow-anchor even after batched locale reversals, and retains history length.

## Harness and documentation checks

Ordinary development suites share [dev-browser](dev-browser.cjs); suites still own pages, contexts, clocks and browser-error assertions. Feedback's controller loader, SSR, static production and the temporary Tailwind consumer retain distinct setup paths.

- [Development lifetime](dev-browser.test.cjs) checks partial startup and assertion/cleanup failures, releasing both resources while preserving the first error.
- [Special-suite cleanup](special-browser-cleanup.test.cjs) checks feedback, SSR and static production startup/assertion failures, including simultaneous cleanup failures. Every acquired resource gets a cleanup attempt and the first failure is preserved.
- [Tailwind host checks](tailwind-host.test.cjs) compare the example's runtime/build dependencies and Node engine with the tested host, excluding the repository's Playwright test dependency. They also cover partial startup and independent browser/server/directory cleanup, including multiple simultaneous failures.
- [Runner](run-browser.test.cjs) checks live output, heartbeats, argument validation, launch failures, interruption, stubborn descendants and inherited pipes after parent exit. Descendant-process cases currently run on POSIX.
- [Native browser errors](browser-errors.browser.cjs) checks real ResizeObserver events without an error object, startup exceptions and promise rejections on static pages across navigation. Child suites must fail through the normal runner when an error is captured; clean pages must pass.
- [Documentation links](migration-links.test.cjs) checks local Markdown/HTML targets and anchors, including README screenshot `srcset` candidates, every demo route's guide/implementation mapping, and copied-source imports/CSS/assets. Local `docs/dev` notes are skipped before directory traversal. POSIX and Windows paths are exercised; external URLs are excluded.
- [Public imports](source-imports.test.cjs) typechecks the public entry without Vite ambient types.

The repository typecheck also rejects unused local declarations and parameters in source, demo and TypeScript fixtures.

## Verification limits

These checks establish local behavior, not complete pixel/frame parity with Claude; see [coverage](../docs/coverage.md) and the [historical migration record](../docs/react-migration.md). Physical trackpad gestures are not established by synthetic input. Each browser suite's widths/themes/locales are explicit in its source, rather than a claim that every case runs through the full matrix.

The automated Tailwind consumer suite reuses installed dependencies and does not test downloading them from npm. [Skill and consumer validation](../docs/skill-validation.md) separately records a fresh project installation, a guided demo exercise and one skill task performed by an agent without prior conversation context. The installation allowed the normal npm cache; the skill was explicitly invoked. These checks do not establish automatic skill discovery or general performance across tasks, models or dependency versions.
