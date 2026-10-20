# Reading, code and tables

Use for: prose with headings, inline and fenced code, long identifiers, inline icons, numbers that update in place, and tables that may be wider than their container.

## React implementation

[Prose](../../src/components/typography/Text.tsx) · [CodeBlock](../../src/components/reading/CodeBlock.tsx) · [ExpandableTable](../../src/components/reading/ExpandableTable.tsx) · [Icon](../../src/components/icons/Icon.tsx) · [demo chapter](../../demo/chapters/ReadingChapter.tsx).

The library receives code, table data and translated labels through props. CodeBlock keeps whitespace and ignores late copy completions after unmount. ExpandableTable uses a native dialog with React-rendered data, unique labeling and focus return; pass `active={false}` when hiding the owning view. Its optional `heading` and `dialogTitle` let the visible headings differ from the table region's accessible `label`; both default to `label`. Font comparisons and the single number-sample interval belong to the demo. Optional font assets are in `src/assets/fonts`, and component CSS uses `--cui-*` tokens. See [setup and API boundaries](../../demo/README.md).

## Parameters

| Part | Value |
| --- | --- |
| Prose | Serif; demo body 15px, line height 1.6, measure ≤ 36em (the `measure` prop) |
| Emphasis | `<em>` in the Serif italic face; Chinese text stays upright (no CJK italic, synthesis off) |
| Wrapping | Headings `balance`, paragraphs `pretty`; long identifiers may break |
| Inline icon | `-.125em` baseline offset on the inline host: a 16px icon sits 2px lower in 15px text |
| Inline code | .9em, line height 1, .4em radius, .0625em/.25em padding; text `#8e2626` light, `#ec7e7e` dark; fill at 5% and .5px border at 10% of `rgb(11 11 11)` (light) or white (dark); `pre-wrap`, `break-word` |
| Fenced code | `--cui-surface-popover` at 50%; .5px `--cui-line` border; radius .5rem; 14px padding; .875rem/1.625 Mono; language label .6875rem/1.0625rem secondary |
| Copy feedback | Copy → Check after the clipboard write succeeds; resets after 2000ms |
| Numbers | `tabular-nums` by default; the comparison sample switches only `font-variant-numeric` |
| Tables | Body ×.9375, line height 1.5, cell padding .5em/.875em; grid lines 1px |
| Table headers | Line height 1.3, bottom aligned, balanced wrapping, 5% fill, 10% inset edge |
| Edge shadows | Two 3rem panel-color masks over two 1.5rem neutral-20% gradients; attachment local/local/scroll/scroll |
| Table dialog | Width from `min(720px, 100vw − 3rem)` up to `100vw − 3rem`; enter and exit 200ms `--cui-ease-out` with scale .98; scrim 40% black light, 50% dark |

## Rules

- Apply the inline-code rule (`.cui-prose code:not(pre code)`) only to inline code. Fenced code and components with their own colors keep their styles. Keep the fill translucent rather than baking in a surface color.
- Fenced code keeps lines unwrapped inside their horizontal overflow container. The sticky copy action appears on hover, on focus within, and always on coarse or non-hover input.
- Copy the displayed text without trimming. The button's label stays "Copy to clipboard"; a `role=status` region announces the result. Each newer success restarts the reset; stale results are ignored; leaving the page clears pending feedback.
- Copy success retains its original two-second expiry through Activity hiding, including time spent hidden. Reconnection resumes the remaining feedback or clears an expired result.
- Offset only the inline icon host, once; the glyph inside uses flex layout without a second shift.
- Tabular figures need font support and do not stop width changes when the digit count changes; keep the format fixed.
- The edge-shadow masks use the table's panel color in each theme; keep them matched when theming.
- Switching to the code/table view remeasures table overflow.
- The expanded dialog renders the same translated table data and reuses its prose sizing; Escape closes it and returns focus.
- Activity cleanup releases the native modal without moving focus into the hidden view. Reconnection restores its retained open state; an obsolete close event must not empty that restored dialog or steal focus. A real native close before cleanup clears that intent even if its event is still queued, so redisplaying Activity keeps the table dismissed.
- Offscreen or hidden number samples pause their interval; page visibility pauses and resumes it.

## Check

- [ ] Both languages; width-control endpoints; narrow containers; long words
- [ ] Inline versus fenced code in both themes
- [ ] Copy success, repeat and failure
- [ ] Local overflow, expand, close and focus return
- [ ] Equal rendered widths for the tabular sample; offscreen pause and resume

Local adaptations and limits: [coverage](../../docs/coverage.md#reading).
