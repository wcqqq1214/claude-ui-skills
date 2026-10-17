# Visual foundations

Use for color roles, elevation, radius, separators, typography and icons. Motion curves and durations live in the [motion vocabulary](../SKILL.md#motion-vocabulary). Components own their state styles and layout.

## Code

| File | Read for |
| --- | --- |
| [style.css](../showcase/style.css) | Light/dark tokens, `--ease-*` curves, ring/shadow roles, shared controls, separator hairlines |
| [fonts.css](../showcase/fonts.css) | Font assets, Sans/Serif/Mono roles, CJK fallbacks, weight axes, icon baseline |
| [icons.js](../showcase/icons.js) | `DemoIcons.create`, the 371 static icon names, 24 secondary layers, size-to-weight conversion |
| [shell.js](../showcase/shell.js) / [shell.css](../showcase/shell.css) | The demo's theme/language controls and navigation; a local shell, not a component to port |

## Color roles

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Page | `--bg` | `#f9f9f7` | `#0b0b0b` |
| Low surface | `--surface-low` | `#fcfcfb` | `#151515` |
| Panel | `--surface` | `#fff` | `#1a1a19` |
| Raised / popover | `--surface-popover` | `#fff` | `#20201f` |
| Primary text | `--text` | `#0b0b0b` | `#f0efec` |
| Secondary text | `--secondary` | `#52514e` | `#c3c2b7` |
| Muted text | `--muted` | `#898781` | `#898781` |
| Line | `--line` | `#0b0b0b` at 10% | white at 10% |
| Hover fill | `--hover-fill` | `#0b0b0b` at 5% | white at 7.5% |
| Brand (clay) | `--clay` | `#c6613f` | `#d97757` |
| Focus and selection | `--focus` | `#2a78d6` | `#2a78d6` |

Keep the role relationships: nested regions get quieter rather than darker, and one background is never reused for every layer. Menu hover/focus fills use the hover-fill values.

## Elevation

Every raised surface starts from `--surface-ring`: a 1px `--line` ring, outer in light and inset in dark. A transparent 1px border reserves the geometry where a ring may appear.

| Role | Token | Depth after the ring (light) | Dark depth |
| --- | --- | --- | --- |
| Panel, card | `--panel-shadow` | `0 1px 2px` 6% · `0 2px 8px` 8% | second layer 24% black |
| Popover, menu | `--popover-shadow` | `0 8px 24px` 12% · `0 2px 6px` 8% | 32% · 20% black |
| Dialog | `--dialog-shadow` | `0 4px 8px` 8% · `0 12px 28px -2px` 8% | second layer 24% black |

Ordinary cards use the panel shadow, [menus](components/menus.md) the popover shadow and table dialogs the dialog shadow. Nested copy surfaces keep the ring and drop the depth.

## Radius

Values as used by the demo's components. The demo shell (sidebar, chapter stage, specimen cards) has its own radii; leave those behind.

| Radius | Role | In the demo |
| --- | --- | --- |
| 4px | Tiny marks | Skeleton lines, thumbnails inside cards, `kbd` |
| 5px | Rows inside menus and lists; checkbox | Menu items, search results, file rows, mode buttons |
| 6px | Tooltips, small icon buttons, labels inside rows | Tooltip, preview close, toast dismiss, pinned rows, status labels, search field |
| 7px | Compact tracks | Mode track, drag source, copy row |
| 8px | Buttons, tiles, cards, code blocks | Composer add/send, attachment tiles, task cards, slider, segmented track, fenced code (`.5rem`) |
| 10px | Menus, toasts, user bubble | Local and pinned menus, notification stack, palette card |
| 12px | Composer | Composer box, mention popup |
| 14px | Dialog | Expanded table dialog |
| 16px | Large images | Gallery slides |
| Pill | Switches, badges, handles | Switch, running badge, gallery navigation, resize pill |
| 50% | Round buttons | Attachment remove, image close |

A nested corner is the outer radius minus the inset: the segmented track is 8px, its thumb 7px and its buttons 6px.

## Spacing

Gap: the demo has no shared spacing scale. Each component owns its padding and gaps; observed values cluster at 4/6/8/10/12/16/20px, with 12px the most common gap. Carry spacing over with the component it belongs to.

## Separators

Decorative separator width follows resolution: 1px, then .5px at 2×, 1/3px at 3× and .25px at 4× (`--hairline`). Control outlines, focus rings, menu and document separators and table grid lines keep their own widths. See [reading](components/reading.md), [micro](components/micro.md) and [notification stacks](components/recovery.md) for the consumers. Use each chapter's fixed sizes and keep its padding/icon/height relationships; density variants are outside the demo.

## Typography

| Role | Family | Used for |
| --- | --- | --- |
| Sans | `--study-sans` | UI: 14px base, 13px compact controls, 12px secondary, 11px captions |
| Serif | `--study-serif` | Reading: prose, file content, tables |
| Mono | `--study-mono` | Code, `kbd`, numeric samples |

- The bundled Sans and Serif support weight 300–800 and optical size 16–48; Mono has weight only.
- Light uses 400/500/600 for regular/medium/bold; dark uses 360/460/540/560 for regular/medium/semibold/bold. The [reading guide](components/reading.md) runs a fixed-versus-theme weight comparison.
- Simplified Chinese falls back through PingFang SC → Microsoft YaHei → Noto Sans CJK SC; Sans puts `system-ui` before that chain. Chinese glyphs come from system fonts.
- Numbers that update in place use tabular figures.

## Icons

- Render static icons with [icons.js](../showcase/icons.js), [fonts.css](../showcase/fonts.css) and the [Anthropicons font](../showcase/fonts/anthropicons-variable.woff2) together. `DemoIcons.create('Download', 20)` returns a decorative icon element; `DemoIcons.names` lists all 371 names. The font is the single icon source; no parallel SVG set is needed. The script also fills existing `data-ui-icon` hosts when it loads after the markup.
- Sizes are 12, 16, 20, 24, 28 and 32px. Icon weight follows size, independent of theme text: regular 16px resolves to about 533.3 and 20px to about 433.3. Ligatures are off and optical size is automatic.
- The 24 two-layer icons draw their secondary layer at 40% color, with a forced-colors fallback; the layers form one icon.
- Give the containing button or control the accessible name.
- In controls, place the icon in a flex slot and center that slot explicitly in icon-only buttons; the control owns row height and hit area.
- In a line of text, apply the `-.125em` baseline offset once, on a host sized like its glyph.
- Keep the native outlines; add no per-glyph optical offsets.
- In [sidebar modes](components/modes.md), only the selected Code glyph uses weight 700; forced-colors mode uses 700 for every selected mode.
- Decorative shapes and checkbox strokes stay local SVG.

## Adapting

Map these roles into the target theme rather than copying the page shell. Check Chinese and English fallback, inline baselines, both themes and each component's real focus and hover states.
