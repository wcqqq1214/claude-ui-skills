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
| 3 | Typography, reading, code/table, feedback, accordion, tooltips and notices | Typography + reading/code/table implemented; activity feedback, accordion, tooltips and notices pending |
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

## Next batch

Finish stage 3 with activity feedback, accordion, tooltips/copy notices and notification stacks. Preserve the existing sprite entry/loop/exit state machine and local focus semantics. Composer work then needs an explicit contenteditable/selection ownership boundary before its DOM mutations are migrated.
