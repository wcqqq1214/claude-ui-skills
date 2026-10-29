# File panel and resizing

Use for: a file list beside a preview, where readers switch files and view format and give the content more room without losing their place.

## Code

[FileWorkspace.tsx](../../src/components/workspace/FileWorkspace.tsx) · [usePaneResize.ts](../../src/components/workspace/usePaneResize.ts) · [workspace.css](../../src/styles/workspace.css) · [React demo](../../demo/chapters/WorkspaceChapter.tsx)

Import `FileWorkspace` from `src/index.ts` with the shared stylesheet; see [integration](../../demo/README.md#import-the-source). React owns file, view and expanded state. The private resize hook owns the measured CSS variable and pointer transaction, cancelling capture on inactivity/unmount. The compact view uses [SegmentedControl](../../src/components/segmented/SegmentedControl.tsx), and remeasures after layout changes. Files supply preview React nodes and plain source strings; demo sample content stays outside the component.

- `FileWorkspace` takes files `{ id, name, icon?, preview, code }` and a `WorkspaceLabels` object for all visible/accessibility text. Preview is a React node; code is a plain string. File selection uses value/defaultValue/onValueChange; view uses view/defaultView/onViewChange (`preview` or `code`); expansion uses expanded/defaultExpanded/onExpandedChange. Missing file IDs resolve to the first available file without emitting a mount callback. Empty lists show labels.empty. Preview content is replaced on file/view changes; keep editor state in the host if it must persist across those changes.

`defaultPaneWidth` chooses the initial width (244px by default). `onPaneWidthChange` reports committed changes, not every drag frame. Pass active=false and hide/inert inactive host content; actual navigation and persistence belong to the host.

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
- A handle's focus callback can synchronously deactivate, expand, hide, unmount or reconnect its owner. The interrupted pointerdown must not capture the pointer, resize or commit a width; a fresh gesture remains available afterward.
- Expanding hides and inerts the list and takes the separator out of the Tab order.
- Switching files keeps the current Preview/Code choice.
- The toolbar title centers its 20px File icon and label in a flex group, without the inline baseline offset.
- F6 and Shift+F6 cycle through the visible regions: file list, selected view option, content.
- Long names ellipsize in the list and the preview header through `min-width: 0`; native titles keep the full name; actions on the right keep their natural width.

## Check

[Independent consumer and browser suite](../../tests/react-workspace.browser.cjs) cover the 3/4px commit boundary, 8/32px keyboard steps, bounds and no-op width preservation, cancellation, repeated expansion, F6, independent instances, long filenames and bilingual responsive layouts. The React panel stacks at a **container** width of 620px, rather than the original page viewport breakpoint, so it also works inside a narrow host.

Local adaptations and limits: [coverage](../../docs/coverage.md#workspace).
