# Switch, checkbox and discrete slider

Use for: a binary setting (switch), an independent choice (checkbox) or a small ordered scale (discrete slider). Each control has its own feedback; they do not share one animation.

## React implementation

[Switch.tsx](../../src/components/controls/Switch.tsx) · [Checkbox.tsx](../../src/components/controls/Checkbox.tsx) · [DiscreteSlider.tsx](../../src/components/controls/DiscreteSlider.tsx) · [demo chapter](../../demo/chapters/ControlsChapter.tsx).

Import from `src/index.ts` and load the component stylesheet; see [setup and API boundaries](../../demo/README.md). Demo-only sample options and slow playback live in the chapter. Native range keyboard semantics and the three-layer fill are retained. The component stylesheet uses `--cui-*` namespaced versions of the original tokens; `--cui-motion-scale` replaces the demo speed variable. `onValueChange` returns the stable string option ID, while the native range value remains a numeric index.

## Parameters

| Part | Value |
| --- | --- |
| Switch | 20px control; thumb travel 120ms `--cui-ease-overshoot` |
| Checkbox | 20px control, 5px radius, 16px graphic; stroke enters over 200ms, exits over 120ms, `--cui-ease-out` |
| Checkbox border | Text color at 20%, 40% on hover (hover-capable devices), 60ms |
| Slider | 32px high, 8px radius; track = height − 4px; handle width = height − 8px; endpoints inset by half the handle |
| Slider motion | Position 120ms `--cui-ease-out`; handle scales to 1.12 while dragging, 120ms `--cui-ease-overshoot` |
| Selected fill | `#2a78d6`, hover `#3987e5` |
| Value text | `Level {position} of {total}` |

## Rules

- Control durations in `src/styles/motion.css` are multiplied by `--cui-motion-scale`. The demo sets this for slow playback; normal consumption defaults to scale 1.
- Port the slider's three clipping layers together rather than reducing them to a percentage-width fill.
- Pointer release, pointer cancel and blur all clear drag feedback. Activity disconnection also cancels the current gesture, so releasing while hidden cannot leave a pressed thumb or stale pointer when the same input reconnects; the selected value is retained.
- Native pointer callbacks may synchronously disable, disconnect or unmount the slider. After the host callback, an obsolete pointer-down handler cannot capture a detached input or restart a cancelled gesture.
- The hidden native range owns keyboard input and exposes the same state as the visual layers.
- Keep focus layers, theme-dependent handle shadows and the selected/unselected colors distinct.

## Check

- [ ] Keyboard and pointer changes, including cancellation
- [ ] Both slider endpoints
- [ ] Both playback speeds and both themes

Local adaptations and limits: [coverage](../../docs/coverage.md#controls).
