# Visual foundations

Use this for theme roles, typography, static icons and shared surface hierarchy. Read the running frontend files directly; individual components own their state styles and layout.

## Running code

| File | Read for |
| --- | --- |
| [style.css](../showcase/style.css) | Light/dark tokens, panel/ring/shadow roles, shared controls, separator hairlines and page layout |
| [fonts.css](../showcase/fonts.css) | Font assets, Sans/Serif/Mono roles, CJK fallbacks, weight axes and icon baseline |
| [icons.js](../showcase/icons.js) | `DemoIcons.create`, all 371 static icon names, 24 secondary layers and size/stroke-to-weight conversion |
| [shell.js](../showcase/shell.js) / [shell.css](../showcase/shell.css) | Demo theme/language controls and navigation; local shell, not a reusable original component |

## Theme and surfaces

| Role | Light | Dark |
| --- | --- | --- |
| Page / panel | #f9f9f7 / #fff | #0b0b0b / #1a1a19 |
| Primary / secondary / muted text | #0b0b0b / #52514e / #898781 | #f0efec / #c3c2b7 / #898781 |
| Border | #0b0b0b at 10% | White at 10% |
| Brand text | #c6613f | #d97757 |
| Focus | #2a78d6 | #2a78d6 |

Preserve role relationships rather than using one background everywhere. Ordinary cards use the panel/small shadow, [menus](components/menus.md) the popover shadow and table dialogs the large shadow. The dark raised surface is #20201f. Light panels have an outer 1px ring; dark panels an inset ring. A transparent 1px border reserves geometry. Nested copy surfaces use the ring without elevation; menu hover/focus fill is 5% light and 7.5% dark.

Decorative separator width changes with resolution (1px, .5px, 1/3px, .25px). Control outlines, focus rings, menu/document separators and table grid lines retain their own widths. See [reading](components/reading.md), [micro](components/micro.md) and [notification stacks](components/recovery.md) for the actual consumers. Density variants are not a demo API; use each chapter's fixed sizes and preserve its padding/icon/height relationships.

## Fonts and icons

The bundled Sans/Serif text fonts support weight 300–800 and optical size 16–48; Mono has weight only. No GRAD axis is established. UI uses Sans, reading uses Serif, and code uses Mono. Dark regular/medium/semibold/bold axes are 360/460/540/560. These values do not guarantee equal perceived weight across different fonts. The [reading guide](components/reading.md) links the running fixed-versus-theme weight comparison.

Simplified Chinese response fallback is PingFang SC → Microsoft YaHei → Noto Sans CJK SC. Sans also places system-ui before its CJK chain. Chinese glyphs come from system fallback, not an additional bundled Chinese font. The demo does not implement Claude's chat-font settings.

Use [icons.js](../showcase/icons.js) with [fonts.css](../showcase/fonts.css) and its matching [Anthropicons font](../showcase/fonts/anthropicons-variable.woff2). `DemoIcons.names` lists all 371 static names, including icons not placed in the demo; `DemoIcons.create('Download', 20)` returns a decorative icon element. Sizes are 12, 16, 20, 24, 28 and 32. Give the containing button or control its accessible name. The script also fills existing `data-ui-icon` hosts when loaded after the markup.

The renderer disables ligatures, uses automatic optical size and keeps icon weight independent of theme text. Regular 16px icons resolve to about 533.3 weight and regular 20px to about 433.3. The 24 icons with secondary layers combine their mapped glyphs at 40% secondary color, with a forced-colors fallback; these layers form one icon. Apply the inline baseline offset once. In [sidebar modes](components/modes.md), only selected Code uses 700 in normal display; forced-colors uses 700 for every selected mode. Decorative shapes and checkbox strokes remain local.

Map these roles into the target theme instead of copying the page shell. Check Chinese/English fallback, inline baselines, both themes and actual component focus/hover states. Use the font and mapping as one source; a parallel static SVG collection is not required. This covers the shipped 371-name static set, not every legacy alias, custom SVG, logo or animated/RTL icon behavior. Font placement, shell layout and surface assignments remain local adaptations.
