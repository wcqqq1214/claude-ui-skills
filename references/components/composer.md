# Input and command suggestions

Use this for a local composing surface with slash suggestions, inline actions and an explanation for the highlighted command. Preserve the draft while browsing or dismissing suggestions.

## Read the running code

[HTML](../../showcase/index.html#composer) · [JS](../../showcase/components/composer.js) · [CSS](../../showcase/components/composer.css)

`initComposerDemo()` binds the input and actions; `initComposerAttachments()` owns the fixed filename tiles, add/remove controls and their View Transition lifecycle. Read `updateComposer()`, `renderCommands()`, `positionCommandDetail()`, `chooseCommand()` and `sendLocal()` together; `#commandDescription` is moved to the body for positioning.

## Design and adaptation

- Resize the textarea from its scroll height, capped at 130px in this demo. Empty trimmed input disables sending. Enter chooses a visible suggestion or accepts local text; Shift+Enter inserts a newline. IME composition bypasses this key handler.
- Arrow keys change the highlighted option while focus remains in the input through `aria-activedescendant`. Escape closes the menu and preserves the input. Selecting a command also preserves an editable draft.
- The composer uses a 12px radius, an outer ring in light mode and an inset ring in dark mode. Hover strengthens the ring except over internal buttons; focus raises shadow alpha from 3.5% to 7.5% with a 200ms transition.
- Compact command rows are 24px high with 13px text. The highlighted row's description sits 8px away, flips or clamps to available space, and hides when its row leaves the visible region. Scroll/resize observations keep it attached.

- `.composer-attachments` enters from opacity 0 / translateY(-8px) over 200ms; individual `.composer-attachment` tiles enter from opacity 0 / scale(.92) translateY(4px) over 180ms. Both use cubic-bezier(.215,.61,.355,1). Typed View Transitions move surviving tiles over 180ms and fade/scale removed tiles to .5 over 130ms with cubic-bezier(.55,.055,.675,.19). The last tile skips that removal transition; unsupported or hidden documents update directly. Interrupted removals still apply once.
- The mock attachment control adds up to three fixed filenames. Remove with X, Delete or Backspace; modified keys, IME composition and held-key repeats are ignored. Keyboard focus moves to the next removal control, then the previous one, then the input. Filenames stay unchanged across language switches; accessible action labels translate.

The attachment example animates local sample tiles. The 120px tiles, 6px gap and 20px removal control use default sizing; sample names, four-line labels, tile typography/surfaces, immediate empty-container collapse, focus targeting and addition control are local adaptations. This small demo does not reproduce every filename-tail, restored-draft, clipped-container or gesture branch. There is no file chooser, file reading, upload or attachment sending; sending the existing text sample leaves these independent mock tiles intact. Validate add/remove/re-add, interrupted removal, last-tile cleanup, wrapping, language/theme changes and keyboard return.

The command list, above-input placement, textarea cap, padding and toolbar are local bindings. They do not implement caret anchoring, complete collision handling, virtualization, model settings or real sending. Check IME-safe selection, empty results, Escape, draft retention and narrow description placement.
