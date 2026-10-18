# File panel and resizing

Use for: a file list beside a preview, where readers switch files and view format and give the content more room without losing their place.

## Code

[HTML](../../showcase/index.html#workspace) · [workspace.js](../../showcase/components/workspace.js) · [workspace.css](../../showcase/components/workspace.css)

- `initWorkspaceDemo()` owns `renderFile()`, `commitPane()`, the drag lifecycle and scoped F6 navigation.
- `fileSegment` uses the [segmented control](segmented.md) and the [icon map](../../showcase/icons.js); expansion calls `refresh()` after the layout changes.

## Parameters

| Part | Value |
| --- | --- |
| List width | Starts at 244px; bounded to 160–520px and 60% of the container |
| Keyboard resize | Arrows 8px, Shift+arrows 32px; Home/End to the bounds; Enter, Space or double-click resets to 244px |
| Drag threshold | 3px |
| Handle | 12px hit area; centered 3px pill capped at 48px tall, hidden at rest |
| Handle hover | Appears after a 200ms delay over 200ms |
| Handle drag | Secondary text color; 120ms, no delay |
| Handle focus | Height cap removed, accent fill, focus shadow |
| View switch | Compact segmented control with Eye/Code glyphs; 200ms indicator |

## Rules

- CSS constrains the rendered width while the chosen width is kept for the next expansion. Use this panel's bounds rather than another panel's.
- Ignore Ctrl/Meta/Alt, resize keys during a drag, and repeated endpoint or reset keys. Shift changes only the arrow step.
- A drag commits only after 3px of movement; a cancelled or unchanged drag restores the stored width, including on `pointercancel`.
- Expanding hides and inerts the list and takes the separator out of the Tab order.
- Switching files keeps the current Preview/Code choice.
- The toolbar title centers its 20px File icon and label in a flex group, without the inline baseline offset.
- F6 and Shift+F6 cycle through the visible regions: file list, selected view option, content.
- Long names ellipsize in the list and the preview header through `min-width: 0`; native titles keep the full name; actions on the right keep their natural width.

## Check

- [ ] Resize bounds by pointer and keyboard
- [ ] Expand and restore repeatedly
- [ ] F6 cycle with the list collapsed and expanded
- [ ] Translated content and long filenames
- [ ] The compact view control

Local adaptations and limits: [coverage](../../docs/coverage.md#workspace).
