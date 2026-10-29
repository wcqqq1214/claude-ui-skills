# Component guides

Choose a scenario, then read its linked TSX source and component styles. All 13 demo chapters import the public component entry. See [integration](../demo/README.md) and [visual foundations](visual.md).

| Scenario | Guide | Demo |
| --- | --- | --- |
| Standalone grapheme/body reveal, user bubble, working dots and scroll following | [Text reveal and local scrolling](components/type.md) | [Demo](../demo/index.html#type) |
| Binary choices and an ordered discrete scale | [Switch, checkbox and slider](components/controls.md) | [Demo](../demo/index.html#controls) |
| Mutually exclusive views with unequal-width slider motion | [Segmented control](components/segmented.md) | [Demo](../demo/index.html#controls) |
| Composer surface, hover/focus transitions, `@` Artifact references, a folding project row and mock attachment add/remove/reflow motion | [Input and attachments](components/composer.md) | [Demo](../demo/index.html#composer) |
| Waiting, delayed placeholders and optional detail | [Waiting and accordion](components/feedback.md) | [Demo](../demo/index.html#feedback) |
| Files, view formats and a resizable preview | [File panel](components/workspace.md) | [Demo](../demo/index.html#workspace) |
| A single thumbnail opening into a preview | [Image preview](components/images.md) | [Demo](../demo/index.html#images) |
| Short hints, adjustable filename truncation, ghost hover and standalone copy confirmation | [Tooltips, ghost hover and copy feedback](components/micro.md) | [Demo](../demo/index.html#micro) |
| Adjustable reading width and wrapping, inline icon baseline and theme-weight comparisons, synchronized proportional/tabular digits, long identifiers, inline/fenced code, copy confirmation and wide tables | [Reading, code and tables](components/reading.md) | [Demo](../demo/index.html#reading) |
| Several images with zoom and bounded pan | [Gallery](components/gallery.md) | [Demo](../demo/index.html#gallery) |
| Separate menu selection, in-chapter search highlighting and artifact thumbnail/action-menu transitions | [Menus, search and palette](components/menus.md) | [Demo](../demo/index.html#menus) |
| Top-level mode buttons with focus-only arrows, and pinned-list reordering | [Sidebar modes and pinned order](components/modes.md) | [Demo](../demo/index.html#modes) |
| Status-card selection, a local drop target and a progress list | [Cards, drop feedback and progress](components/tasks.md) | [Demo](../demo/index.html#tasks) |
| A notification queue with stacking and deduplication | [Notification stacks](components/recovery.md) | [Demo](../demo/index.html#recovery) |

## Shared runtime

[App.tsx](../demo/App.tsx) owns chapter navigation, language and theme preferences. [Chapter components](../demo/chapters) supply examples, translations and playback controls. Reusable components are exported from [src/index.ts](../src/index.ts); they own their listeners, observers, timers and animations with cleanup.

Import [the component stylesheet](../src/styles/index.css) once. It includes scoped theme tokens, Tailwind utilities and component motion rules without a page-wide reset. For a host that already imports Tailwind, use [components.css](../src/styles/components.css) instead. [Text fonts](../src/styles/fonts.css) are optional. Components accept labels and data through props; they do not depend on demo translations, IDs or layout.

[Coverage](../docs/coverage.md) records local adaptations and verification limits.
