# Reading measure and wide tables

Use this for prose containing headings, long identifiers, inline icons and tables that may exceed their local container.

## Read the running code

[HTML](../../showcase/index.html#reading) · [JS](../../showcase/components/reading.js) · [CSS](../../showcase/components/reading.css)

`initReadingDemo()` binds body-size selection and the expanded table. `measureTable()` observes both viewport and table, showing the expansion control only when `scrollWidth > clientWidth + 3`. Read `.measure-prose`, `.table-viewport` and `.table-dialog` together with [font roles](../visual.md).

## Design and adaptation

- Prose measure is body size ×36 and line height ×1.6; the sample sizes are 14/15/16px at a 16px root. This is a length relationship, not a guaranteed character count.
- Headings balance; prose uses pretty wrapping, which cannot guarantee every orphan disappears. Long identifiers may break when needed. Inline font icons apply the baseline offset once; numeric content uses tabular figures.
- Tables use body ×.9375 type, 1.5 line height and .5em/.875em cell padding. Headers use 1.3 line height, bottom alignment, balanced wrapping, a 5% fill and 10% inset edge. Grid lines remain 1px.
- Horizontal edge shadows combine two 3rem panel masks and two 1.5rem neutral-20% gradients with local/local/scroll/scroll attachment. Keep the light/dark panel colors aligned.
- The expanded native dialog clones translated table content and reuses its prose sizing. Desktop width follows content within the min(720px,100vw−3rem) lower bound and 100vw−3rem upper bound. Entry/exit uses 200ms ease-out and scale .98; scrims are 40%/50% black.

The 720px sample table, outer frame, native-dialog lifecycle and ≤620px dialog sizing are local adaptations. Nested dialogs and mobile-keyboard viewports are not covered. Check body sizes, both languages, long words, local overflow, expand/close and focus return.
