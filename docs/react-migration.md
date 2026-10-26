# React + TSX + Tailwind migration

## Starting point

The migration reorganizes the local HTML/CSS/JavaScript showcase into reusable React components.

Reference: [Caho1/open-claude-ui](https://github.com/Caho1/open-claude-ui), particularly its independent TSX components, typed props, static Tailwind variants and public exports. Our current showcase remains the source of visual values and interaction behavior. This migration does not copy its component implementations or add its unrelated desktop/backend features.

## End state

- Reusable React components in `src/`, with TypeScript props and Tailwind styling.
- `demo/` imports those exact components and owns chapter navigation, sample data, translation and playback controls.
- Namespaced theme variables and optional assets, without dependence on demo globals or page-wide CSS resets.
- Keep precise geometry, native-input semantics and interruptible motion from the existing showcase.
- Update scenario guides and the Skill as each scenario moves to TSX.
- Complete all existing chapters, verify behavior, then retire the legacy implementation and update the static deployment build. Do not maintain two permanent implementations.

## Delivery stages

| Stage | Scope | State |
| --- | --- | --- |
| 1 | React/TS/Vite/Tailwind, scoped tokens, optional Sans assets, theme/language shell | Implemented |
| 2 | Switch, Checkbox, DiscreteSlider, SegmentedControl; demo imports; independent consumer | Implemented; verification recorded below |
| 3 | Typography, reading, code/table, feedback, accordion, tooltips and notices | Implemented; verification recorded below |
| 4 | Composer, attachments, contenteditable mentions, menus, search and palette | Implemented; verification recorded below |
| 5 | Workspace resize, sidebar modes/reorder, images/gallery, drop/task progress | Implemented; verification recorded below |
| 6 | Complete chapter navigation, remaining assets, guides, build/deployment migration and legacy removal | Complete; final verification below |

## Decisions established by the first batch

- One repository and one build; no monorepo or package publication requirement.
- Public source entry is `src/index.ts`. An external consumer needs React and a Tailwind 4 build; no published package is implied.
- Tailwind owns normal layout and states. Native range pseudo-elements, the three clipping layers and SVG stroke reveal remain in small dedicated CSS rules.
- WAAPI owns the measured segment indicator. React owns selection and labels. ResizeObserver and animations have component lifetimes, including StrictMode cleanup.
- Segment items use stable IDs, natural widths, radio semantics, one tab stop and keyboard selection. Multiple instances do not share animation IDs or state.
- Themes use `data-cui-theme`; component text comes from props. Locale translation and demo speed controls never enter the public components.
- No demo-only CSS, globals, fonts or page IDs are needed by the independent consumer fixture.
- The first React chapters coexist with the original showcase as a migration reference. The existing Pages workflow remains manual and targets the original showcase.

## Verification

Commands: `npm run build`, `npm run test:react`, `npm test`.

The React browser suite covers source-only consumption, no callback on StrictMode mount, standard/compact geometry, disabled/empty cases, independent instances, controlled prop updates, keyboard wrapping and disabled-option skipping, rapid selection, translated labels, 75% zoom, hide/show, unmount/remount, native checkbox reset, range endpoints/release/cancel, theme values, state preservation and 1280/390/320px layouts in light/dark and English/Chinese.

First-batch verification on 2026-10-19:

- `npm run build`: passed, including strict TypeScript checking and production asset generation.
- `npm run test:unit`: 42 tests passed.
- Original browser suite: all 9 original browser files passed during the full run. The new React suite initially exposed a history-navigation bug; after correcting it and the missing favicon, `npm run test:react` passed separately.
- New React consumer suite: passed, including all widths/themes/languages listed above.
- Production preview at `/demo/?lang=zh-Hans#controls`: checked with the built-in browser; light-theme switch and slider interactions worked. Development preview also covered dark theme, checkbox, segment keyboard selection and English translation.
- Screenshots from this verification are not included in the repository.

Manual UI verification uses the actual Vite demo. Automated geometry checks and local screenshots establish the migration's behavior, not pixel/frame parity with Claude itself. Existing original-app coverage limits still apply.

## Typography and reading batch

- Added GraphemeReveal, FadeIn, UserMessage, Prose, default-loop WorkingMark, ScrollFollower, CodeBlock and ExpandableTable, plus the typed static Icon/IconButton and visibility/clipboard hooks.
- Added `#type` and `#reading` React chapters, original bilingual demo copy, Serif/Mono/icon assets, number/baseline/weight comparisons, and demo-owned streaming/replay timers.
- Added a second source-only consumer and `react-reading.browser.cjs`. It checks emoji/combining graphemes, exact clipboard text, copy races/reset/failure/unmount, table expansion and focus return, scoped theme inheritance, scroll pause/resume and non-stealing append behavior, hidden counter/stream lifecycle, icon baseline, and English/Chinese light/dark layouts at 1280/390/320px.
- The new reading suite passed after correcting the test's native Home-scroll settling and hidden-element lookup. The first React suite passed against the expanded demo. Final `npm run build` and `npm run test:react` passed (both React browser suites). Production preview confirmed Chinese code/table layout and native dialog expansion.

## Activity feedback and disclosure batch

- Added `StatusMark` with all four activity sprite sets and the original grow/entry/loop/exit sequencing. Selection follows decoded artwork, handoff requires a seam strictly more than 50ms ahead, and completion waits for the current stage and exit. Pausing removes wall-clock timers and resumes from the animation clock; unmount and StrictMode probe cleanup suppress stale callbacks.
- Added `ShimmerText`, measured `SkeletonGroup`/`SkeletonLine`, and controlled/uncontrolled `Accordion`. React owns labels and accessibility; the isolated controller owns only the decorative sprite. The demo owns the 500ms loading delay and loaded content.
- Added `#feedback` in English/Chinese, and a source-only feedback fixture. Tests preserve original handoff cases with a deterministic clock, then exercise real WAAPI playback, focus retention, mounted disclosure state, scoped dark theme, clip resize and 1280/390/320px layouts.
- Final `npm run build` and all three suites in `npm run test:react` passed, including the StrictMode completion guard and decode failure. Production preview confirmed activity changes, completion and the expanded Chinese timeline.

## Hints and notification batch

- Added native-trigger `Tooltip` with delayed focus/hover, Escape, text-range overflow measurement, resize/font/text updates, viewport clamp and top/bottom placement. Added the original ghost SVG with hover-only eye movement and press/release fill motion, plus `CopyButton` and the original clipboard fallback with focus/selection restoration.
- Added local `NotificationStack` with a ref API, ordinary/action deadlines, deduplication, three visible layers, measured shared height, focused-item order retention, exit cleanup and safe neighbor/trigger focus return. Single mode uses the same implementation and revives a closing entry without stale removal. React owns all content; sample text, language and fixed placement remain in demo.
- Added bilingual `#micro` and `#recovery` chapters and a source-only consumer/browser suite. Moved the demo-only reset into the CSS base layer so it no longer overrides component Tailwind font, color and spacing utilities. Tests identified and corrected ghost :active specificity, notification focus at the first reveal frame, and tooltip rearming after scroll. Responsive cases reload between combinations because hash navigation intentionally retains chapter state.

- Final `npm run build`, `npm run test:react` (all four suites) and `git diff --check` passed. Production preview confirmed Chinese tooltip display, notification stacking/deduplication and component styles. Stage 3 is complete; later stages remain pending.

## Composer batch

- Added `ComposerSurface`, measured `ComposerPicker`/`ComposerToolbar`, controlled `AttachmentList` and native `MentionEditor`. React owns chrome/overlays; an isolated, cleaned-up editing controller owns the contenteditable DOM and browser editing transactions. Draft callbacks exclude decorative glyphs and retain ordered mention IDs/titles. The host owns sample data, submission and persistence.
- Added the original four-part composer demo: attachment tiles, multiline input with Artifact references, action row and project/model toolbar. Localization and chapter visibility retain the existing draft and attachments. The toolbar preserves its trigger through both folding boundaries and 2px unfolding hysteresis, with mouse/touch densities.
- Added an independent two-composer fixture. Browser tests cover clamped candidate keyboard selection, Enter/Tab insertion, atomic Backspace/undo, context delete/restore, IME, plain-text paste, serialization, hidden draft preservation, mounting, attachment keyboard/modifier/repeat handling, focus and independent instances. Native View Transition instrumentation confirms the authored exit keyframes; fallback and deferred callbacks after unmount are exercised separately.
- Final `npm run build`, `npm run test:react` (all five suites) and `git diff --check` passed. Composer checks include English/Chinese at 1280/390/320px in light/dark and mouse/touch contexts. Production preview confirmed Chinese candidate placement, insertion and continued editing.

## Menus, search and palette batch

- Added `SubmenuSelect`, `GroupedSearch`, `ArtifactActionsCard` and `useSearchHighlight`, with public typed exports and an English/Chinese `#menus` chapter. Components are independent of demo IDs, globals and resets. Host state owns selection, search destinations and action effects.
- Preserved focus preview versus committed selection, nested Escape/ArrowLeft, disabled-option skipping, whitespace-only flat search results, destination focus and settled scrolling. The measured palette retains 200ms opening and 120ms return from the current animated position; pending focus is cancelled on close, pagehide and unmount. Decorative selection checks are hidden from accessible names.
- Added a source-only consumer and browser suite for independent instances, controlled props, scoped themes, native keyboard behavior, search cancellation and repeated selection, ready/failed artwork and interrupted return. The original deterministic search tests now also execute the migrated TypeScript controller, including minimum settling, continuous movement cap, user input and disconnection cleanup.
- Production preview confirmed Chinese focus preview/commit, trigger focus return, the artwork action card and search heading focus. Final `npm run build`, `npm run test:react` (all six suites), `npm run test:unit` (47 tests) and `git diff --check` passed.

## Workspace and sidebar batch

- Added `FileWorkspace` with independent file/view/expanded state, host-provided preview nodes and source strings, measured pane resizing and scoped F6 navigation. The resize hook keeps chosen width through temporary clamping and cancelled drags. Container queries preserve the original stacked layout within narrow hosts. Added bilingual `#workspace` with the original samples.
- Added `SidebarModes` with focus-only arrow keys, exact content-box folding thresholds, natural Tab order, optional running labels and globally phased pulse. Removed options fall back locally without resurrecting a stale selection. Added controlled `PinnedList` with React-keyed order, roving focus, a scoped-theme portal menu and an isolated 4px drag preview. The host receives IDs only on commit. Resize, scroll, inactive state, pagehide, lost capture and unmount clear pending drag work; the commit path also rechecks viewport geometry before accepting an order.
- Added a source-only consumer/browser suite covering measured resize boundaries, expansion and F6, mode selection/folding/RTL, pulse/forced colors, drag preview/release/cancellation, lost-button delay, menu moves/focus, portal theme and English/Chinese light/dark layouts at 1280/390/320px. Fixed the demo's navigation numbering for chapters 10 and above and split the original HTML translation into JSX text messages.
- Production preview confirmed Chinese file/view preservation through expand/restore, menu-based reorder with focus return, and native pointer reorder. Final `npm run build`, `npm run test:react` (all seven suites), `npm run test:unit` (47 tests) and `git diff --check` passed.

## Image preview batch

- Added `ImagePreview` with typed labels, separate thumbnail/preview URLs, optional thumbnail sizing and an imperative open/close handle. The demo imports it for bilingual `#images`. React owns both image trees and accessibility; the native controller owns modal focus and measured shared-element transitions.
- Preserved 350ms opening/250ms closing, measured thumbnail press scale, 9px-to-6px corner and shadow changes, contain/scale-down letterbox cropping, invisible-source fade and fine/coarse close controls. Each instance owns a unique transition name and temporary stylesheet, without global html classes or suppression of host transition names. Inactivity, pagehide and unmount invalidate callbacks and remove temporary state.
- Added an independent source-only consumer and browser suite for dismissal paths, transition keyframes, letterbox geometry, keyboard focus, rapid open/close, simultaneous previews, focus in another modal, deferred callbacks after unmount and unsupported-API fallback. Demo checks cover English/Chinese, light/dark, 1280/390/320px and fine/coarse pointers. Updated component guide, index and migration introductions.
- Production preview confirmed the Chinese image layout, native opening, Escape focus return and keyboard reopening. Final `npm run build`, `npm run test:react` (all eight suites) and `git diff --check` passed.

## Gallery batch

- Added typed `Gallery`, `GalleryItem`/labels and an imperative open/close handle. React owns stable-ID slides, selected/zoomed ARIA, caption and controls; the isolated native controller owns wheel/pointer geometry and dialog/crossfade lifetimes. The bilingual `#gallery` chapter imports the same public component and local artwork.
- Preserved 75vw slides with 32px gaps, 300ms paging/opacity, 180ms crossfade, 4px drag threshold, pointer-centered click zoom, retained ideal pan through expanding bounds, line/page zoom conversion and viewport-sized page panning. Inactive/removed instances release capture, cancel timers and invalidate deferred transitions. Resource updates preserve selected IDs when possible; label changes retain zoom. A keyboard action clears a completed drag's click guard immediately so it cannot swallow paging while the timer is still pending.
- Added a source-only consumer/browser suite for real native transitions, focal math, bounds, mismatched pointers, keyboard zoom while dragging, measurement guards, neighbors, close buffer, keyboard/RTL focus, item changes, two simultaneous galleries, rapid reversal, empty state, teardown and API fallback. Extended existing deterministic zoom tests to run the migrated math too.
- Production preview confirmed Chinese caption/count, keyboard zoom, native pointer pan, reset on paging and Escape focus return. Final `npm run build`, `npm run test:react` (all nine suites), `npm run test:unit` (53 tests) and `git diff --check` passed.

## Tasks, progress and drop batch

- Added typed `ProgressList`, `TaskCards` and `DropTarget`, with a bilingual `#tasks` chapter importing the public entry. Progress updates/count/replay timers and local drag payloads belong to the demo. Consumers supply labels and state, without demo IDs, globals or resets.
- Preserved completed-step folding beyond the two most recent, inert collapsed content, 220ms text/rail entry, 180ms current-node entry, globally phased 3s clay pulse, state announcements and preserved expansion. The progress-specific text mask checks layout eligibility once per activation, falls back for clamped/unsupported layouts, and replaces translated masks while preserving running start time or paused current time. Unchanged rows keep their animation state.
- Added controlled/uncontrolled task selection and focus-only RTL-aware arrow navigation. Drop feedback retains the three overlay layers and 150ms entry/200ms exit; re-entry samples the current visual position before cancelling exit, and teardown invalidates callbacks. The local demo has keyboard and drag/drop equivalents and rejects unrelated drags.
- Added an independent consumer/browser suite covering geometry, progression, animation phases/fallbacks, controlled props, independent instances, drop interruption/teardown, replay cancellation and responsive localized demos. Production preview confirmed expanded earlier steps, selected-card details and keyboard drop feedback. The built-in browser's native drag gesture did not change the page; actual HTML drag/drop was verified separately by the Chrome browser suite. Final `npm run build`, `npm run test:react` (all ten suites) and `git diff --check` passed.

## Final integration

- The root and `/demo/` HTML entries build the same React application and share generated assets. `base: './'` keeps both entries usable under a repository subpath. Development opens the root entry.
- Pages installs dependencies and builds `dist/`. Deployment requires workflow-dispatch on `main` with `PAGES_ENABLED=true`.
- Retired `showcase/` and its 18 implementation-bound test files. The deterministic search and zoom tests now run only the migrated TypeScript. [Test coverage mapping](../tests/README.md) identifies the React successors, including a new plain-static-server production suite.
- Updated the Skill, both READMEs, component/visual guides and integration instructions to use TSX, namespaced styles and the React demo. Source consumption explicitly requires React and a Tailwind 4 build; no package publication is implied.
- Final CSS review found a missing `--cui-ease-spring` definition used by image press/release styles. Restored the original curve and added a computed-style browser assertion for the 450ms spring, so an invalid transition cannot silently pass again.

Final validation:

- `npm test`: passed, including 10 deterministic tests, strict type checking, a fresh production build and all 11 browser files (10 component suites plus static production delivery).
- `npm run test:production`: passed independently before the complete run.
- Documentation file-link audit: no missing local targets. `git diff --check`: passed. No active source/build/guide imports depend on `showcase/`; its name remains only in historical provenance.
- Native in-app preview at the final root entry confirmed Chinese controls and switch state changes.

Completion audit:

| Requirement | Final evidence |
| --- | --- |
| Typed reusable React/Tailwind implementation | Public `src/index.ts`, 34 TSX component files, namespaced styles, strict typecheck |
| Demo consumes the same components | All 14 `demo/chapters` use the source components; independent fixtures import the public entry without demo code |
| Existing interaction coverage retained | Component browser suites plus deterministic zoom/search tests; test mapping records retirement of old implementation-bound tests |
| One maintained implementation | Original showcase removed; source, guides and demo use React |
| Static build and integration documentation | Two shared-app HTML entries, root/subpath production tests, updated source-consumption guide and manual Pages build |

All six delivery stages are complete. Source consumption requires React and Tailwind 4.


## Visual parity follow-up

The initial completion established the React delivery and interactions, but did not establish visual parity of the demo shell. The subsequent [computer-use comparison](react-visual-parity.md) restores the original framing and fixes measured component differences. It includes all 13 original chapters in both themes, narrow layouts, English code/table content and overlay states. The standalone segmented-control chapter was subsequently merged into Controls; the current demo has 13 chapters and retains `#segmented` as a Controls alias.

## Skill and behavior consistency follow-up

The follow-up compares the migration with the same local `dev` baseline, including trigger/state/exit/focus behavior and the Skill's complete local reference chain.

- All 24 Markdown documents and 218 local links/anchors resolve. The component index covers every one of the 14 demo routes exactly once. [Persistent checks](../tests/migration-links.test.cjs) also verify linked TSX callers, local asset/CSS dependencies and the absence of retired runtime dependencies.
- The source entry now typechecks without `vite/client` or ambient image declarations, with strict library checking. Sprite assets use static ESM URLs. [The regression](../tests/source-imports.test.cjs) first reproduced 14 missing-WebP-type errors; a separate temporary consumer also built and ran the copied source, fonts, Tailwind styles and all 14 sprite assets.
- Restored transient single-notice dismissal on chapter exit while retaining the persistent notification stack, preserved the skeleton's original 500ms deadline when Finish is pressed, cancelled the old scroll working-mark animation on Replay, and restored both preview/committed values in submenu feedback.
- Corrected the composer height documentation to the actual default/demo cap, `min(40svh, 384px)`; 130px belongs to the independent test fixture.

Final verification: `npm test` passed all 14 unit/integration checks, strict typecheck, production build and all 11 browser files. The tracked-file link audit and `git diff --check` also passed.

These checks establish the documented local-demo behavior and source integration contract. They do not extend the original-app, physical-gesture or reduced-motion coverage boundaries.

## Activity and stale callback follow-up

The retained-DOM review found seven lifecycle gaps beyond the ordinary hidden-chapter paths. The fixes preserve the editing DOM, native undo and semantic blank lines, the current gallery item, and the reader's paused position or following mode across Activity effect reconnection. Explicit reset keys still apply when changed while hidden. Interrupted composition and detached imperative handles keep their existing cleanup boundaries.

Expanded tables release the native modal during Activity cleanup and restore the retained open intent on reconnection. Old close events cannot erase the restored table or move focus into a hidden view. Image previews distinguish a pending opening from a presented native dialog, and recheck request ownership after synchronous focus changes during both opening and resource refresh. Obsolete updates cannot hide the thumbnail, recreate transition names or overwrite a newer request.

Notification deadlines belong to the exact notice that registered them. A queued timer from a single-notice replacement or a same-key refresh cannot dismiss the new persistent or extended entry. Deterministic timer-boundary tests also verify that the new entry's own deadline still works.

Permanent browser regressions first reproduced the reported failures, then passed after the fixes. They use real React Activity under StrictMode, retain the same DOM nodes, check exact state/callback results and exercise native, unavailable and throwing View Transition APIs. The corresponding component guides and integration boundaries describe these reconnection semantics.

Final verification passed 15 unit/integration checks, strict type checking, a fresh production build and all 12 browser suites, including SSR hydration and static delivery. A separate consumer copied only `src/` and six source-only fixtures into a temporary project, typechecked without Vite ambient declarations, built with Tailwind and ran under a production subpath. Its Activity, focus, external-close and asset checks passed in all three transition modes, including all 14 sprite resources and no page/network errors. The 24-document audit found no broken or untracked targets among 218 local links; POSIX/Windows anchor checks and `git diff --check` also passed.

## Table exit and visual parity follow-up

The five fixes compare the React implementation with the pre-migration showcase baseline. Native table close preserves the browser's synchronous focus return and any newer host focus; its queued event no longer forces the expand trigger. Expanded table content remains mounted through the actual CSS exit, preserving the original dialog height. New openings invalidate old exits, including same-task close/reopen and retained-DOM Activity reconnection. Normal button/Escape close, deactivation and silent unmount remain covered with StrictMode disabled and enabled.

The demo's reading introduction again reserves 73px above the 620px viewport boundary, while streamed paragraphs keep their original natural height. Workspace resize feedback uses the scoped clay token in light, dark and custom themes. Pinned conversation titles use the theme's medium weight (500/460). The new regressions first failed on the reported focus, content-retention, height, color and weight differences before their corresponding fixes.

A separate production consumer copied only `src/`, built 18 source-only fixtures under `/consumer/` and executed 13 lifecycle helpers plus nine consumer-page checks. Strict public types, five preserved SSR nodes, clipboard and block notification/Artifact hydration, all 14 sprite resources, six text fonts and the icon font passed without page or network errors. Its temporary project was removed after verification.

Final `npm test` passed all 15 unit/integration checks, strict type checking, the production build and all 13 browser suites, including routing/history and the new StrictMode regressions. The final source/Skill link checks passed on POSIX and Windows paths; the focused review found no unresolved P2-or-higher defect or additional behavior regression in this change.


## Demo presentation refinement

The later demo-only polish intentionally simplifies the showcase framing and bilingual copy. Implementation notes are optional, controls initially use the source's normal playback speed, and theme selection explicitly offers Light, Dark and System. Demo chrome uses 12/14/20px text, lighter single borders and fewer decorative surfaces; typography specimens retain their original teaching samples. The public `src/` tree, API, palette and component motion remain unchanged. The presentation matrix supplements the existing independent-consumer, lifecycle, SSR and production-delivery regressions.

Validation passed 16 unit/integration checks, type checking and the production build. All 14 browser suites passed, with production rerun after replacing the media chapters' obsolete visible-copy-length assertions with visible-action and decoded-thumbnail checks. The new presentation suite covers all chapters with StrictMode off/on, English/Chinese, light/dark and desktop/320px layouts. Four desktop screenshots and one mobile screenshot were captured from the running demo. Source integration and Skill-link checks remain green.
