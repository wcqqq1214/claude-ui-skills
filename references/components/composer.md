# Input and attachments

Use for: the composer surface and its hover/focus states, `@` Artifact references, the project row that folds as width shrinks, and attachment entrance, removal and reflow.

## Code

[HTML](../../showcase/index.html#composer) · [composer.js](../../showcase/components/composer.js) · [composer-mentions.js](../../showcase/components/composer-mentions.js) · [composer.css](../../showcase/components/composer.css)

- `initComposerDemo()`: `resizeInput()` on input and width changes.
- `initComposerMentions()`: `@` candidates, selection, popup placement and atomic references.
- `initComposerChin()`: the project/model row and its folding modes.
- `initComposerAttachments()`: tiles, add/remove controls and the View Transition lifecycle (`addSample()`, `remove()`).
- Read together with `.composer-box`, `.composer-attachments` and `.composer-attachment`.

## Parameters

| Part | Value |
| --- | --- |
| Box | 12px radius; ring outer in light, inset in dark |
| Focus shadow | Alpha 3.5% → 7.5%, 200ms `--ease-standard` |
| Editor height | Follows `scrollHeight`; demo cap 130px |
| Mention popup | Opens above the caret, flips below when short of room; 16px viewport padding; max height 384px |
| Project row | Three modes: words + caret → words → icon (16px; 20px on coarse pointers) |
| Press feedback | Fill shrinks by `clamp(.5px, height / 32, 1.5px)` per side (scale ≥ .8); releases over 450ms `--ease-spring` |
| Attachment row enter | From opacity 0, translateY(-8px); 200ms `--ease-out-cubic` |
| Tile enter | From opacity 0, scale(.92) translateY(4px); 180ms `--ease-out-cubic` |
| Tile reflow and removal | Survivors move over 180ms; a removed tile fades and scales to .5 over 130ms `--ease-in-cubic` |
| Tile geometry | 120px tiles, 6px gap, 20px remove control |

## Rules

- Hover strengthens the ring, except while the pointer is over an internal button.
- Typing `@` opens Artifact candidates. Enter or Tab inserts, arrows stop at the first and last row, and Escape dismisses. Focus stays in the editor throughout.
- An inserted reference is one atomic inline node: Backspace removes it whole and undo restores it.
- Width changes remeasure the draft, including when the chapter becomes visible again.
- The project row folds to the next mode when its content stops fitting. It unfolds only when the wider mode fits with 2px to spare and the labels are unchanged. Keep the same trigger element across modes so focus survives resizing.
- A tile is removed with its X, Delete or Backspace. Modified keys, IME composition and held-key repeats are ignored.
- After a removal, focus moves to the next remove control, else the previous one, else the editor.
- The last tile skips the removal transition. Browsers without View Transitions, and hidden documents, update directly. An interrupted removal still applies once.
- Filenames stay as written across language switches; action labels translate.

## Check

- [ ] Hover versus focus on the box
- [ ] Multiline growth to the cap; draft kept across chapter and language changes
- [ ] `@` insert with Enter and Tab, Escape, Backspace and undo over a reference
- [ ] Project row at each mode boundary, narrowing and widening
- [ ] Add, remove, re-add; interrupted removal; last-tile cleanup
- [ ] Narrow wrapping, both themes, both languages, keyboard focus return

Related component guides: [component index](../components.md).
