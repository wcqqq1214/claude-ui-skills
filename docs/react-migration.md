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
| 4 | Composer, attachments, contenteditable mentions, menus, search and palette | Pending |
| 5 | Workspace resize, sidebar modes/reorder, images/gallery, drop/task progress | Pending |
| 6 | Complete chapter navigation, remaining assets, guides, build/deployment migration and legacy removal | Pending |

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

## Next batch

Stage 4: Composer, attachment tiles, contenteditable mentions, menus, search and palette. Establish an explicit React/contenteditable selection ownership boundary, retain caret and IME behavior, and keep sample data/actions in the demo. Then migrate workspace/sidebar/image/gallery/drop/task chapters before replacing the legacy build and retiring the original showcase.
