# Sidebar modes and pinned order

Use for: top-level mode buttons that stay in natural Tab order, where arrows move focus without selecting (unlike the [segmented control](segmented.md)), and a short pinned list reordered by drag or by menu.

## Code

[SidebarModes.tsx](../../src/components/sidebar/SidebarModes.tsx) · [PinnedList.tsx](../../src/components/sidebar/PinnedList.tsx) · [pinnedDrag.ts](../../src/components/sidebar/pinnedDrag.ts) · [sidebar.css](../../src/styles/sidebar.css) · [React demo](../../demo/chapters/SidebarChapter.tsx)

Import the components from `src/index.ts`; [source integration](../../demo/README.md#import-the-source) describes setup. The demo supplies mode icons, the running Code fixture, translated labels and controlled pinned order. The mode component measures the selected button and keeps focus independent from selection. PinnedList renders the list and portal menu; its isolated drag controller owns only the decorative copy, temporary row offsets and pointer capture. The host commits the returned ID order in React state.

## Props

- `SidebarModes` takes options `{ id, label, icon, selectedIcon?, running?, runningLabel?, disabled? }`, value/defaultValue/onValueChange and native div props. Supply aria-label. Its arrows move focus only and reverse in RTL; Enter/Space/click selects. Hidden/removed options resolve to the first enabled option. Controlled hosts should update their own value when removing an option. Two/three options use the original 180/254px content-box folding thresholds. The host can supply a bold selected Code icon and a localized running label; the component does not invent application modes or jobs.
- `PinnedList` takes controlled items `{ id, title }` and onOrderChange(ids). Keep IDs stable and synchronously update the React list order in that callback. value/defaultValue/onValueChange control conversation selection independently. Supply label, actionsLabel(item), menuLabel, moveUpLabel, moveDownLabel, movedLabel(item, position, total) and cancelledLabel; describedBy can reference host instructions. Optional initialStatus initializes the live message until the first move/cancel; remount with a new key for a full host reset.

`PinnedList` uses `initialStatus` until a move or cancellation replaces it; this initial text can follow locale prop updates. Inactivity announces an interrupted drag through `cancelledLabel`. If Activity disconnects an already started drag, the retained instance announces its cancellation on reconnection using the current labels, including when active=false was committed while hidden. A press below the drag threshold and a true unmount remain silent.

Pass active=false and hide/inert inactive host content. Pinned menus dismiss on Activity disconnection; revealing retained DOM does not restore an old menu or move outside focus. Text, navigation and persistence belong to the host.

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

- Pinned dragging creates only an inert decorative copy and temporary neighbor transforms. Order commits on release, including the original 200ms lost-button fallback; Escape, pointer cancellation, resize/scroll and inactivity discard it. The menu provides the same reorder callback for keyboard use, with focus returning to the moved row. The popup portals to document.body, carrying its light/dark theme and direction; placement follows the trigger and clamps/flips within the viewport. Avoid transformed ancestors around the drag stage because its decorative copy uses fixed positioning.

## Check

[Independent browser checks](../../tests/react-workspace.browser.cjs) cover focus versus selection, the exact two/three-item folding boundaries, RTL, pulse phase/forced colors, pinned 3/4px drag threshold, cancellation, 200ms lost-button fallback, menu moves/focus, portal theme inheritance and bilingual responsive layouts. The controller rechecks viewport and list bounds at commit, including delayed release, so a resize cannot commit before its event handler runs.

Local adaptations and limits: [coverage](../../docs/coverage.md#modes).
