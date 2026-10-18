# Switch, checkbox and discrete slider

Use for: a binary setting (switch), an independent choice (checkbox) or a small ordered scale (discrete slider). Each control has its own feedback; they do not share one animation.

## Code

[HTML](../../showcase/index.html#controls) · [controls.js](../../showcase/components/controls.js) · [controls.css](../../showcase/components/controls.css)

- `initControlsDemo()` binds `#demoSwitch` and `#effortRange`; the checkbox is a native input.
- `updateEffort()` maps the four stops to `--pos` and `aria-valuetext`.
- `.range-fill-origin`, `.range-fill-clip` and `.range-fill` move together.

## Parameters

| Part | Value |
| --- | --- |
| Switch | 20px control; thumb travel 120ms `--ease-overshoot` |
| Checkbox | 20px control, 5px radius, 16px graphic; stroke enters over 200ms, exits over 120ms, `--ease-out` |
| Checkbox border | Text color at 20%, 40% on hover (hover-capable devices), 60ms |
| Slider | 32px high, 8px radius; track = height − 4px; handle width = height − 8px; endpoints inset by half the handle |
| Slider motion | Position 120ms `--ease-out`; handle scales to 1.12 while dragging, 120ms `--ease-overshoot` |
| Selected fill | `#2a78d6`, hover `#3987e5` |
| Value text | `Level {position} of {total}` |

## Rules

- Durations in controls.css are multiplied by `--controls-duration-scale`, the demo's slow-motion switch. Port them at scale 1.
- Port the slider's three clipping layers together rather than reducing them to a percentage-width fill.
- Pointer release, pointer cancel and blur all clear drag feedback.
- The hidden native range owns keyboard input and exposes the same state as the visual layers.
- Keep focus layers, theme-dependent handle shadows and the selected/unselected colors distinct.

## Check

- [ ] Keyboard and pointer changes, including cancellation
- [ ] Both slider endpoints
- [ ] Both playback speeds and both themes

Local adaptations and limits: [coverage](../../docs/coverage.md#controls).
