# Segmented control

Use for: a small fixed set of mutually exclusive views or options, such as preview/code, display modes or short filters. Arrows select immediately, unlike [sidebar modes](modes.md), where arrows only move focus.

## React implementation

[SegmentedControl.tsx](../../src/components/segmented/SegmentedControl.tsx) · [demo chapter](../../demo/chapters/SegmentedChapter.tsx) · [setup and API](../../demo/README.md).

The TSX implementation keeps measured natural widths, pixel snapping, interruption from visible geometry and immediate-selection radio semantics. Use stable option IDs with `value/onValueChange` or `defaultValue`. Observers and animation handles are cleaned up on unmount; instances are independent. Label/size changes remeasure. Disabled options are skipped by keyboard navigation. Initialization does not call `onValueChange`. Component sizes are controlled by `size` and host styles.

## Parameters

| Part | Value |
| --- | --- |
| Indicator | Follows the selected option's measured position and width; 200ms `--cui-ease-snap` from the current visible geometry |
| Standard | 32px track, 14px labels |
| Compact (`size="compact"`) | 24px track, 13px labels |
| Radius | Track 8px (compact 6px); the thumb is 1px smaller and the buttons 2px smaller |
| Track padding | 1px |
| Pixel snapping | The measurement effect rounds viewport edges to device pixels, then converts back to local coordinates |

## Rules

- Measure the selected option instead of dividing the track equally, so translated labels keep their width.
- Rapid changes interrupt smoothly from the visible position. A resize aligns directly; an unchanged target leaves the running animation alone.
- The component renders one measured indicator and `button[role=radio]` options. Supply stable, unique option values.
- Only the selected radio is in the Tab order. Arrows wrap; Home and End select the ends.
- Keep the left transform origin, natural button widths and `flex-shrink: 0` together.
- Load the shared component stylesheet. Consumers supply translated labels; label changes remeasure automatically.
- The component cleans up its observer and animation on unmount.

## Check

- [ ] Rapid selection and reversal
- [ ] Keyboard ends and wrapping
- [ ] Language and width changes
- [ ] The compact file-panel consumer

Local adaptations and limits: [coverage](../../docs/coverage.md#segmented).
