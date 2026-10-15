# Claude UI design reference

Stable reading space, contextual actions and visible state changes connect the [demo](../showcase/index.html). These are design interpretations, not an official specification. The [component guides](../references/components.md) describe the demonstrated behavior and local adaptations.

## Visual foundations

Use surface roles to distinguish page, panel and overlay, keeping nested regions quieter. Treat reading measure, wrapping and overflow as related layout choices. [Visual foundations](../references/visual.md) owns typography, colors and border rules; fixed sizes and page layout are local choices, not a full density system.

## Motion and reading continuity

Match motion to the state change it explains while preserving the reader's position. Durations, curves and keyboard models belong to each component; a shared token does not make transitions interchangeable. Sample pacing does not describe generation or network behavior.

## Contextual actions and feedback

Preserve drafts and distinguish focus preview from committed selection. Keep visible state, focus, timing and geometry coordinated, with feedback close to its target. Adapt these relationships without importing sample data or page positioning.

## Code views are distinct

The [file panel](../references/components/workspace.md) demonstrates read-only Preview and Code tabs. It does not provide code editing or a chat-code view.

## Spatial continuity

Preserve geometry, interruption handling and focus return together when moving between thumbnails and overlays. Local demonstrations and numerical checks do not establish original-app frame parity or physical-gesture coverage.
