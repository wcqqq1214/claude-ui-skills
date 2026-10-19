---
name: claude-ui-skills
description: Build or refine Claude-inspired UI, frontend interactions, and motion using scenario guides and runnable frontend code. Use for Claude-style chat presentation, controls, menus, panels, typography and animation in an existing frontend.
---

# Claude UI Skills

Adapt Claude Desktop–style UI, typography and motion into an existing frontend. Reusable TSX components in `src/` are the implementation reference; all 14 chapters in `demo/` import them. Scenario guides link the component source and styles. See [integration](demo/README.md).

## Workflow

1. **Choose.** Find the scenario in the [component index](references/components.md) and read only that guide plus the files it links. Resolve paths from this skill's directory, not the target app's.
2. **Ground the style.** Apply the quick reference and motion vocabulary below. Open [visual foundations](references/visual.md) when the change touches color, type, icons, radius, elevation or separators.
3. **Adapt.** Keep the target stack and its component ownership. In React projects, import or copy the linked TSX components and documented styles; [integration instructions](demo/README.md) describe the Tailwind setup. Preserve geometry, timing, selection, focus and visibility. Leave sample text, page layout and demo controls behind. Map `--cui-*` variables onto the target theme. Components own their listeners, observers, timers and animations and clean them up; retain that ownership when adapting to another framework.
4. **Verify.** Done when the changed interaction's trigger, state change, exit and focus return work in light and dark, in English and Chinese, and in a narrow container, and any numeric threshold has been tested at its controlling boundary. When shared icon styles change, check icons in controls, inline text and overlays for alignment, clipping, row height and hit area. Run the target project's checks and use a browser when one is available.
5. **Report** the demo files and functions used, the local adaptations, the checks run and the checks left undone (visual, physical gestures). Present the result as an adaptation of the demo, without claiming pixel, runtime or performance parity with Claude.

## Style quick reference

- **Warm neutrals, layered quietly.** Page `#f9f9f7` (dark `#0b0b0b`), panels `#fff` (dark `#1a1a19`, raised `#20201f`). Separate layers with small luminance steps and a 1px ring of text color at 10%: outer in light, inset in dark.
- **Text** `#0b0b0b` · `#52514e` · `#898781` (dark `#f0efec` · `#c3c2b7` · `#898781`). Hover and press fills are text color at 5% (dark 7.5%).
- **Two accents, separate jobs.** Clay `#c6613f` (dark `#d97757`) marks the brand and the send action; blue `#2a78d6` marks selection and focus.
- **Three type roles.** Sans for UI (14px base, 13px compact, 12px secondary, 11px captions), Serif for reading, Mono for code. Dark mode lightens regular/medium/bold from 400/500/600 to 360/460/560.
- **Radius by role.** 4px tiny marks · 5–6px rows, tooltips, small icon buttons · 8px buttons, tiles, cards, code blocks · 10px menus, toasts, the user bubble · 12px the composer · 14–16px dialogs and large images · pill for switches, badges and handles. A nested corner is the outer radius minus the inset.
- **Elevation in three steps.** Panel, popover and dialog shadows each combine the ring with soft depth; nested surfaces keep the ring alone.
- **Hairlines.** Decorative separators thin to .5/.33/.25px on dense screens; control outlines, focus rings and table grids stay 1px.
- **Motion is short and quiet.** Most transitions run 60–200ms. Geometry snaps, surfaces ease out, and only press release and the switch/slider handle overshoot. Motion explains a state change and keeps the reader's place.
- **Feedback stays close.** Feedback appears next to its target, focus previews an option without committing it, and drafts survive language, theme and layout changes.

## Motion vocabulary

Shared curves are defined in [tokens.css](src/styles/tokens.css); component-specific curves and durations remain in the linked CSS or controllers. Names below identify the curve vocabulary; in-cubic, out-expo and shimmer are authored locally. Durations below are the demo's actual usage. Use the curve and duration each guide gives: two transitions that share a token are not interchangeable.

| Token | Curve | Duration | Use for |
| --- | --- | --- | --- |
| `--cui-ease-standard` | `cubic-bezier(.4,0,.2,1)` | 60ms; 150–300ms | Hover and focus color on controls; card surfaces, composer focus shadow, resize handle, gallery slide |
| `--cui-ease-snap` | `cubic-bezier(.32,.72,0,1)` | 120ms; 200–350ms | Geometry snapping to a target: mode indicator, tooltips, navigation hover (120ms); segmented indicator (200ms); image preview open/close (350/250ms) |
| `--cui-ease-out` | `cubic-bezier(.165,.84,.44,1)` | 60–220ms | Fill layers on hover (60ms); slider position and checkbox stroke (120ms); surfaces entering or leaving: toasts, dialogs, palette card, text fades (150–220ms) |
| `--cui-ease-out-cubic` | `cubic-bezier(.215,.61,.355,1)` | 90–200ms | Arrivals: grapheme reveal, attachment tiles (180ms), drop overlay and glow |
| in-cubic (local) | `cubic-bezier(.55,.055,.675,.19)` | 130ms | Departures: removed attachment tiles |
| out-expo (local) | `cubic-bezier(.19,1,.22,1)` | 200ms | Disclosure: accordion chevron and collapse |
| `--cui-ease-overshoot` | `cubic-bezier(.34,1.3,.64,1)` | 120ms | Switch thumb travel, slider handle press scale |
| `--cui-ease-spring` | `linear(…)`, ~9% overshoot | 450ms | Pressed fills releasing |
| shimmer (local) | `cubic-bezier(.714,.121,.211,.888)` | 3s cycle | Status-text shimmer sweep |

Sprite marks (status marks, working dots) step through frames with `steps(n, jump-none)` at 33.33ms per frame. The skeleton sweep runs 2s linear and body text fades in over 100ms linear. WAAPI cannot read CSS variables, so JS keeps string copies of a curve with a comment naming its token.

## Scope

- Change presentation only: markup, styles, motion, focus and visible state. Leave data flow, backend calls, auth, tool execution, reconnection and feature flags as they are.
- Implement effects that have a guide here. [Coverage](docs/coverage.md) lists the effects deliberately left out and each chapter's local adaptations.
- The demo has no reduced-motion variants; keep whatever reduced-motion handling the target app already has.
- Work from the bundled demo; collect new reference material from Claude only when the user asks.

## Demo

Run `npm ci` and `npm run dev` from the skill root; see [demo instructions](demo/README.md#run). For static preview, run `npm run build` and serve `dist/`. All 14 chapters run locally without sending data or executing tools.
