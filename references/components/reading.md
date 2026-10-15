# Reading measure and wide tables

Use this for prose containing headings, inline and fenced code, long identifiers, inline icons and tables that may exceed their local container.

## Read the running code

[HTML](../../showcase/index.html#reading) · [JS](../../showcase/components/reading.js) · [CSS](../../showcase/components/reading.css)

`initReadingDemo()` binds body-size selection, the expanded table and `bindReadingCodeCopy()` for the fenced sample. `measureTable()` observes both viewport and table, showing the expansion control only when `scrollWidth > clientWidth + 3`. Read `.measure-prose`, `.reading-code-block`, `.table-viewport` and `.table-dialog` together with [font roles](../visual.md).

## Design and adaptation

- Prose measure is body size ×36 and line height ×1.6; the sample sizes are 14/15/16px at a 16px root. This is a length relationship, not a guaranteed character count.
- Headings balance; prose uses pretty wrapping, which cannot guarantee every orphan disappears. Long identifiers may break when needed. Inline font icons apply the baseline offset once; numeric content uses tabular figures.
- Inline code uses `.measure-prose code:not(pre code)` in the linked CSS: light/dark text `#8e2626`/`#ec7e7e`, neutral `rgb(11 11 11)`/white at 5% for fill and 10% for the 0.5px border (`--line`). Type is .9em with line height 1, .4em rounding and .0625em/.25em padding; `pre-wrap` and `break-word` allow long code to wrap. These values describe the demo's inline-code presentation. Preserve the translucent fill rather than baking in a surface color, and do not apply this rule to fenced code or consumers with their own color overrides.
- Fenced code uses `.reading-code-block`: surface-3 (`--surface-popover`) at 50%, a 0.5px `--line` border, radius `var(--msg-block-radius,.5rem)`, 14px padding and .875rem/1.625 code type. Its explicit CSS language keeps lines unwrapped inside `.reading-code-viewport`; the language label uses the default .6875rem/1.0625rem secondary text (host density can override this). Hover, focus-within and coarse/non-hover input reveal the sticky copy action. These values describe the demo's fenced-code presentation. The sample deliberately has no syntax color scheme.
- `bindReadingCodeCopy()` copies the displayed text without trimming and changes Copy to Check only after clipboard success, with a translated `role=status` announcement. Each latest successful request restarts the 2000ms reset; stale results are ignored and page exit clears pending feedback. The stable button label remains “Copy to clipboard”. Dark-mode Copy/Check and keyboard activation were visually verified; the reset timing describes the local demo. The native tooltip, failure announcement and page lifecycle cleanup are local adaptations, not claims about Claude's tooltip or failure presentation.
- Tables use body ×.9375 type, 1.5 line height and .5em/.875em cell padding. Headers use 1.3 line height, bottom alignment, balanced wrapping, a 5% fill and 10% inset edge. Grid lines remain 1px.
- Horizontal edge shadows combine two 3rem panel masks and two 1.5rem neutral-20% gradients with local/local/scroll/scroll attachment. Keep the light/dark panel colors aligned.
- The expanded native dialog clones translated table content and reuses its prose sizing. Desktop width follows content within the min(720px,100vw−3rem) lower bound and 100vw−3rem upper bound. Entry/exit uses 200ms ease-out and scale .98; scrims are 40%/50% black.

The 720px sample table, outer frame, native-dialog lifecycle and ≤620px dialog sizing are local adaptations. Nested dialogs and mobile-keyboard viewports are not covered. Check copy/repeat/failure feedback, body sizes, both languages, long words, local overflow, expand/close and focus return.
