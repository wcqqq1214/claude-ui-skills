# File panel and resizing

Use this for a file list alongside a preview, where readers can change files, switch view format and give content more room without losing their place.

## Read the running code

[HTML](../../showcase/index.html#workspace) · [JS](../../showcase/components/workspace.js) · [CSS](../../showcase/components/workspace.css)

`initWorkspaceDemo()` owns `renderFile()`, `commitPane()`, drag lifecycle and scoped F6 navigation. `fileSegment` uses the [segmented component](segmented.md), including its JS/CSS and the shared [icon map](../../showcase/icons.js); expansion calls `refresh()` after changing layout.

## Design and adaptation

- The list header shows the measured width beside a local drag hint; a temporary `data-resizing` attribute emphasizes it during pointer drag and is cleared on finish/cancel. Long sample names use ellipsis in both the list and preview header, with native titles retaining the full name. These presentation aids are local.
- The filename can shrink and ellipsize through `min-width:0`; right-side actions retain their natural width. File switching preserves the current Preview/Code choice.
- The file-panel example starts at 244px, bounded to 160–520px and 60% of the container. CSS constrains the rendered width while keeping the chosen width for later expansion. Keep these bounds when reproducing this example.
- Arrows request 8px steps; Shift+arrows use 32px. Home/End request the bounds; Enter/Space or double-clicking the resize handle restores 244px. Ignore Ctrl/Meta/Alt, resize keys during drag and repeated endpoint/reset keys. Shift modifies only arrow steps.
- Drag commits only after movement exceeds 3px; canceled or unchanged drags restore the stored width. Expansion hides/inerts the list and removes the separator from Tab order.
- The resize handle uses 12px hit area, centered 3px-wide pill capped at 48px high, hidden at rest; hover uses a 200ms delay and 200ms transition, drag uses secondary text color and 120ms with no delay. Keyboard focus removes the height cap, uses the accent fill and the focus shadow. Other resize-handle appearances are not demonstrated.
- F6 / Shift+F6 cycle only through the component's visible regions: file list, selected view option and content. Keep the focusable content region and selected segmented radio together.

The sample CSS mirrors the running grid declaration. The file-view control uses the bundled Eye/Code glyphs in square buttons; accessible names and native title hints translate with the page. Native title hints provide the labels in this demo. The compact indicator keeps its existing 200ms curve from the segmented guide. Sample files, the three-region focus cycle, narrow horizontal file list and pointercancel restoration are local choices. There is no file IO or rename workflow. Check resize bounds, expand/restore, translated content, long filenames and the shared compact view control.
