# Visual foundations

Use for color roles, elevation, radius, separators, typography and icons. Motion curves and durations live in the [motion vocabulary](../SKILL.md#motion-vocabulary). Components own their state styles and layout.

## Code

| File | Read for |
| --- | --- |
| [tokens.css](../src/styles/tokens.css) and [component styles](../src/styles/index.css) | Scoped light/dark tokens, motion curves and component surfaces |
| [fonts.css](../src/styles/fonts.css) | Optional Sans/Serif/Mono assets and fallback stacks |
| [Icon.tsx](../src/components/icons/Icon.tsx) and [glyphs.ts](../src/components/icons/glyphs.ts) | 371 typed static icon names, 24 secondary layers and size-to-weight conversion |
| [App.tsx](../demo/App.tsx) / [style.css](../demo/style.css) | Demo theme/language controls, navigation and page defaults |

## Color roles

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Page | `--cui-bg` | `#f9f9f7` | `#0b0b0b` |
| Low surface | `--cui-surface-low` | `#fcfcfb` | `#151515` |
| Panel | `--cui-surface` | `#fff` | `#1a1a19` |
| Raised / popover | `--cui-menu-bg` | `#fff` | `#20201f` |
| Primary text | `--cui-text` | `#0b0b0b` | `#f0efec` |
| Secondary text | `--cui-secondary` | `#52514e` | `#c3c2b7` |
| Muted text | `--cui-muted` | `#898781` | `#898781` |
| Line | `--cui-line` | `#0b0b0b` at 10% | white at 10% |
| Hover fill | `--cui-menu-hover` | `#0b0b0b` at 5% | white at 7.5% |
| Brand (clay) | Component-specific clay values | `#c6613f` | `#d97757` |
| Focus and selection | `--cui-accent` | `#2a78d6` | `#2a78d6` |

Keep the role relationships: nested regions get quieter rather than darker, and one background is never reused for every layer. Menu hover/focus fills use the hover-fill values.

## Elevation

Components own their ring and shadow rules. Menus use `--cui-menu-shadow`; tooltips use `--cui-tip-shadow`; image and gallery surfaces retain their own shadows. Read the corresponding stylesheet rather than applying one global elevation class to every surface. Light rings are generally outer and dark rings inset; nested surfaces often keep the ring without additional depth.

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
| 50% | Round buttons and dots | Attachment remove, gallery close, scroll-return button, progress nodes |

A nested corner is the outer radius minus the inset: the segmented track is 8px, its thumb 7px and its buttons 6px.

## Spacing

Gap: the demo has no shared spacing scale. Each component owns its padding and gaps; observed values cluster at 4/6/8/10/12/16/20px, with 12px the most common gap. Carry spacing over with the component it belongs to.

## Separators

Decorative separator width follows resolution: 1px, then .5px at 2×, 1/3px at 3× and .25px at 4× (component-specific hairline variables). Control outlines, focus rings, menu and document separators and table grid lines keep their own widths. See [reading](components/reading.md), [micro](components/micro.md) and [notification stacks](components/recovery.md) for the consumers. Use each chapter's fixed sizes and keep its padding/icon/height relationships; density variants are outside the demo.

## Typography

| Role | Family | Used for |
| --- | --- | --- |
| Sans | `--cui-font-sans` | UI: 14px base, 13px compact controls, 12px secondary, 11px captions |
| Serif | `--cui-font-serif` | Reading: prose, file content, tables |
| Mono | `--cui-font-mono` | Code, `kbd`, numeric samples |

- The bundled Sans and Serif support weight 300–800 and optical size 16–48; Mono has weight only.
- Light uses 400/500/600 for regular/medium/bold; dark uses 360/460/540/560 for regular/medium/semibold/bold. The [reading guide](components/reading.md) runs a fixed-versus-theme weight comparison.
- Simplified Chinese falls back through PingFang SC → Microsoft YaHei; Sans puts `system-ui` before that chain. Chinese glyphs come from system fonts.
- Numbers that update in place use tabular figures.
- Emphasis (`<em>`) uses the bundled italic faces: Serif italic in prose, Sans italic in UI text such as the user bubble. Mono italic ships with the fonts, but nothing in the demo uses it. The demo’s `html` sets `font-synthesis: none`, so a family without an italic face renders emphasis upright; system CJK fonts have none, which is why Chinese emphasis shows no slant.

## Icons

- Render `<Icon name="Download" size={20} />` with the shared component stylesheet. [Icon.tsx](../src/components/icons/Icon.tsx) uses the typed static map and [Anthropicons font](../src/assets/fonts/anthropicons-variable.woff2). Icons are decorative; the host control supplies its accessible name.
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
