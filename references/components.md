# Component guides

Choose the user-facing scenario, then read that chapter's linked HTML, JS and CSS. The [visual foundations](visual.md) cover shared theme, font, icon and surface roles.

| Scenario | Guide | Demo |
| --- | --- | --- |
| Standalone grapheme/body reveal, user bubble, working dots and scroll following | [Text reveal and local scrolling](components/type.md) | [01](../showcase/index.html#type) |
| Binary choices and an ordered discrete scale | [Switch, checkbox and slider](components/controls.md) | [02](../showcase/index.html#controls) |
| Unequal-width slider motion and compact preview/code switching | [Segmented control](components/segmented.md) | [03](../showcase/index.html#segmented) |
| Composer surfaces, hover/focus transitions and mock attachment add/remove/reflow motion | [Input and attachments](components/composer.md) | [04](../showcase/index.html#composer) |
| Waiting, delayed placeholders and optional detail | [Waiting and accordion](components/feedback.md) | [05](../showcase/index.html#feedback) |
| Files, view formats and a resizable preview | [File panel](components/workspace.md) | [06](../showcase/index.html#workspace) |
| A single thumbnail opening into a preview | [Image preview](components/images.md) | [07](../showcase/index.html#images) |
| Short hints, adjustable filename truncation and standalone copy confirmation | [Tooltips and copy feedback](components/micro.md) | [08](../showcase/index.html#micro) |
| Adjustable reading width and wrapping, inline icon baseline and theme-weight comparisons, synchronized proportional/tabular digits, long identifiers, inline/fenced code, copy confirmation and wide tables | [Reading, code and tables](components/reading.md) | [09](../showcase/index.html#reading) |
| Several images with zoom and bounded pan | [Gallery](components/gallery.md) | [10](../showcase/index.html#gallery) |
| Separate menu selection, in-chapter search highlighting and artifact thumbnail/action-menu transitions | [Menus, search and palette](components/menus.md) | [11](../showcase/index.html#menus) |
| Top-level mode buttons with focus-only arrows | [Sidebar modes](components/modes.md) | [12](../showcase/index.html#modes) |
| Status-card selection and a local drop target | [Cards and drop feedback](components/tasks.md) | [13](../showcase/index.html#tasks) |
| A notification queue with stacking and deduplication | [Notification stacks](components/recovery.md) | [14](../showcase/index.html#recovery) |

## Shared runtime

[app.js](../showcase/app.js) initializes the examples once, after the translated markup and component definitions are loaded by [index.html](../showcase/index.html). Chapter scripts contain the actual event bindings and sample content. [shared.js](../showcase/shared.js) provides `$`/`$$`, snap easing and image-geometry helpers; [i18n.js](../showcase/i18n.js) and [icons.js](../showcase/icons.js) supply Chinese translations of the English-authored demo content and font icons, respectively.

Component CSS relies on [style.css](../showcase/style.css) for the border-box reset, shared buttons, surface tokens and page layout, plus [fonts.css](../showcase/fonts.css) for font roles. Read the chapter's additional cross-component dependencies before adapting it. 

The linked component guides describe the demonstrated behavior and local adaptations.
