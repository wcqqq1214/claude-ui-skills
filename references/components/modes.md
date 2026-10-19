# Sidebar modes and pinned order

Use for: top-level mode buttons that stay in natural Tab order, where arrows move focus without selecting (unlike the [segmented control](segmented.md)), and a short pinned list reordered by drag or by menu.

## Code

[SidebarModes.tsx](../../src/components/sidebar/SidebarModes.tsx) · [PinnedList.tsx](../../src/components/sidebar/PinnedList.tsx) · [pinnedDrag.ts](../../src/components/sidebar/pinnedDrag.ts) · [sidebar.css](../../src/styles/sidebar.css) · [React demo](../../demo/chapters/SidebarChapter.tsx)

Import the components from `src/index.ts`; [integration](../../demo/README.md#file-panels-and-sidebar-navigation) describes their props. The demo supplies mode icons, the running Code fixture, translated labels and controlled pinned order. The mode component measures the selected button and keeps focus independent from selection. PinnedList renders the list and portal menu; its isolated drag controller owns only the decorative copy, temporary row offsets and pointer capture. The host commits the returned ID order in React state. [Original showcase](../../showcase/index.html#modes) remains a temporary reference.

## Parameters

| Part | Value |
| --- | --- |
| Track | 28px high at a 16px rem; track radius 7px, thumb 6px, buttons 5px |
| Indicator | Geometry over 120ms `--cui-ease-snap`; background over 300ms, independently |
| Label folding | Unselected labels fold when the track's content box is ≤ 254px (three items) or ≤ 180px (two items); track padding is outside these widths |
| Selected Code glyph | Weight 700 |
| Running badge | Shown on Code while another mode is selected |
| Pinned drag | Starts after 4px of movement; floating copy at 90% opacity, 6px radius, `--cui-pin-float-shadow`; moves over 150ms ease-out |

## Rules

- Click, Enter or Space selects. Arrows only move focus between visible buttons, and reverse in right-to-left layouts.
- Hiding the selected option selects the first visible one.
- ResizeObserver remeasures and aligns directly through `data-snap`; an unchanged target keeps its running animation.
- Keep the selected indicator and icon alignment steady through language and width changes.
- Pinned rows: arrows move focus between rows, and the row's menu offers Move up and Move down. Escape during a drag cancels it and restores the order; releasing commits. Keep the pinned list independent of the mode controls.

## Check

[Independent browser checks](../../tests/react-workspace.browser.cjs) cover focus versus selection, the exact two/three-item folding boundaries, RTL, pulse phase/forced colors, pinned 3/4px drag threshold, cancellation, 200ms lost-button fallback, menu moves/focus, portal theme inheritance and bilingual responsive layouts. The controller rechecks viewport and list bounds at commit, including delayed release, so a resize cannot commit before its event handler runs.

Local adaptations and limits: [coverage](../../docs/coverage.md#modes).
