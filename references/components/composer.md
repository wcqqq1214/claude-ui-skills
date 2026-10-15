# Input and command suggestions

Use this for a local composing surface with slash suggestions, inline actions and an explanation for the highlighted command. Preserve the draft while browsing or dismissing suggestions.

## Read the running code

[HTML](../../showcase/index.html#composer) · [JS](../../showcase/components/composer.js) · [CSS](../../showcase/components/composer.css)

`initComposerDemo()` binds the input and actions. Read `updateComposer()`, `renderCommands()`, `positionCommandDetail()`, `chooseCommand()` and `sendLocal()` together; `#commandDescription` is moved to the body for positioning.

## Design and adaptation

- Resize the textarea from its scroll height, capped at 130px in this demo. Empty trimmed input disables sending. Enter chooses a visible suggestion or accepts local text; Shift+Enter inserts a newline. IME composition bypasses this key handler.
- Arrow keys change the highlighted option while focus remains in the input through `aria-activedescendant`. Escape closes the menu and preserves the input. Selecting a command also preserves an editable draft.
- The composer uses a 12px radius, an outer ring in light mode and an inset ring in dark mode. Hover strengthens the ring except over internal buttons; focus raises shadow alpha from 3.5% to 7.5% with a 200ms transition.
- Compact command rows are 24px high with 13px text. The highlighted row's description sits 8px away, flips or clamps to available space, and hides when its row leaves the visible region. Scroll/resize observations keep it attached.

The command list, above-input placement, textarea cap, padding and toolbar are local bindings. They do not implement caret anchoring, complete collision handling, virtualization, model settings or real sending. Check IME-safe selection, empty results, Escape, draft retention and narrow description placement.
