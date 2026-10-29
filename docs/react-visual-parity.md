# React visual parity follow-up

Date: 2026-10-20. Baseline: the local pre-migration showcase. Compared implementation: the React migration.

The measurements and test counts below describe that comparison, not the current demo inventory. For current behavior and setup, see [the demo guide](../demo/README.md) and [coverage](coverage.md).

## What the comparison found

The initial migration retained component behavior but redesigned much of the demo presentation. That changed the visual result: navigation and theme controls, chapter widths, canvas centering, card rings/shadows, padding, type stages, button sizes and responsive breakpoints. Source-only tests did not establish parity with the original demo.

This follow-up restores that presentation in React. The original default Typography page, 13 chapter positions and labels are retained; the additional segmented-control examples now live under Controls. Reusable components remain in `src/`; demo framing stays under `demo/`.

Component corrections include the original 30px icon buttons, medium task/file-row weights, Serif file content, theme-aware clay and popover colors, keyboard-shortcut keycaps, accordion padding/expo easing, table heading spacing, code/table surfaces and notification action padding. No backend behavior was added.

## Computer-use evidence

Actual screenshots were captured through the built-in computer-use browser:

- Every original chapter in light and dark at 1280×720, with the same language, state and theme on both pages.
- Controls and reading at 607×740 in dark mode, using the same narrow browser tab for both versions. The narrow chapter picker was opened, a chapter selected, and title focus checked after the picker closed.
- English code/table layout after using both language menus, expanded process disclosure, and the dark single-image dialog including its scrim, image fit and close control.
- Pixel comparison used the content area `(250,20)–(1280,720)`, excluding the sidebar where chapter 14 is an intentional addition. The comparison screenshots are not included in this repository.

Final light captures had zero pixel difference in that area for images, gallery and notifications. Composer, menus, micro feedback and workspace had mean channel differences below 0.04/255. Text reveal, working marks, skeletons, numbers and progress pulses were captured at different animation times; their raw image difference is not a frame-synchronized animation comparison. Their geometry, state transitions and interruption behavior are covered separately by the browser suites.

The controls' actual browser geometry matched the baseline exactly at 1280×720:

| Element | x | y | Width | Height |
| --- | --- | --- | --- | --- |
| Grid | 453 | 165.90625 | 600 | 448.1875 |
| First card | 453 | 223.90625 | 293 | 188.09375 |
| Magnified range | 493 | 453 | 520 | 48 |

These values now have a regression assertion in the production suite. They were measured from the original page through computer use, not derived from the React CSS.

## Verification

- `npm test`: passed all 10 deterministic checks, strict typecheck/production build and all 11 browser files.
- After the final narrow segment-padding and drag-source line-height adjustments, rebuilt and reran production, reading and tasks suites; all three passed. The final default-page, focus, label and keyboard corrections were followed by another full unit/build/browser run (`node tests/run-browser.cjs --jobs=3`): all 10 deterministic checks and all 11 browser files passed.
- Production checks also exercise language-menu arrow/end/Escape behavior, focus preview without committing a language, narrow picker focus return and focus-out dismissal, chapter scroll-to-top, root/subpath assets and the baseline geometry above.
- React component review retained literal Tailwind variants, instance-owned state, listener/observer/timer cleanup, native controls and accessible names. The independent consumer fixtures continue to work without demo styles.

This records comparison against the pre-migration local demo. Original-app observations and excluded variants remain documented in [coverage](coverage.md).
