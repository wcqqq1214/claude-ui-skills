# Input and attachments

Use for: the composer surface and its hover/focus states, `@` Artifact references, the project row that folds as width shrinks, and attachment entrance, removal and reflow.

## React implementation

[ComposerSurface/Toolbar/Picker](../../src/components/composer/ComposerToolbar.tsx) · [MentionEditor](../../src/components/composer/MentionEditor.tsx) · [editing controller](../../src/components/composer/mentionEditing.ts) · [AttachmentList](../../src/components/composer/AttachmentList.tsx) · [styles](../../src/styles/composer.css) · [demo](../../demo/chapters/ComposerChapter.tsx)

Follow the [source integration guide](../../demo/README.md). The editor, attachments and compact toolbar can be imported separately. The demo owns sample files, the width slider, locale and disabled send action.

- `ComposerSurface`: normal div props/children and the authored hover/focus ring. `ComposerPicker` takes native button props/ref, with measured press feedback.
- `ComposerToolbar`: projectLabel, modelLabel/modelAriaLabel, optional action callbacks, describedBy, trailing content and className. This is the empty-project picker variant. It preserves the trigger across words+caret → words → icon modes, including coarse-pointer sizes and 2px unfolding hysteresis.
- `MentionEditor`: required label/placeholder/mentionListLabel/deleteLabel, optional heading, options with stable id/title/description, defaultText, resetKey, active, maxHeight and onDraftChange. Its ref exposes focus, clear and getDraft. The draft contains display text (without icon glyphs) and ordered mention metadata; it is not a portable rich-document schema.
- React owns surrounding controls and candidate/context-menu rendering. The browser owns the editable subtree, selection and undo history. Do not insert React children or rewrite innerHTML while typing. defaultText is initial-only until resetKey changes; localization and resizing never replace draft nodes. Existing atom titles keep the wording used at insertion.
- Options filter by title. Arrows clamp at the first/last result, Enter/Tab insert, Escape dismisses and selection stays in the editor. IME composition cannot accept a candidate. Plain-text paste cannot create reference nodes. The native insertHTML/delete transactions retain Backspace and undo/redo. The host chooses if/when to submit; ordinary Enter remains a newline outside an open candidate list.
- `AttachmentList`: controlled items (id/name/type), label, removeLabel, onRemove and optional onEmptyFocus. onRemove must synchronously update the items in React; it runs inside the browser snapshot update and flushes that commit so animation geometry matches. Items use unique instance-scoped transition names. Last-tile, hidden-page and unsupported-API removals update directly; interrupted updates run at most once. Unmount cancels pending work and removes held-key guards.
- active=false closes editor overlays; use a containing hidden/inert state when hiding an entire composer. Draft and attachments can stay mounted across chapter changes.

## Parameters

| Part | Value |
| --- | --- |
| Box | 12px radius; ring outer in light, inset in dark |
| Focus shadow | Alpha 3.5% → 7.5%, 200ms `--cui-ease-standard` |
| Editor height | Follows `scrollHeight`; default/demo cap `min(40svh, 384px)`; test fixture cap 130px |
| Mention popup | Opens above the caret, flips below when short of room; 16px viewport padding; max height 384px |
| Project row | Three modes: words + caret → words → icon (16px; 20px on coarse pointers) |
| Row text | 12px; 10px when the row is ≤ 400px wide. Coarse pointers: 13px, and 11px when narrow |
| Row pickers | 20px tall, 5px radius, 12px text; on coarse pointers 32px tall, 8px radius, 13px text |
| Press feedback | Fill shrinks by `clamp(.5px, height / 32, 1.5px)` per side (scale ≥ .8); releases over 450ms the authored spring curve |
| Attachment row enter | From opacity 0, translateY(-8px); 200ms `--cui-ease-out-cubic` |
| Tile enter | From opacity 0, scale(.92) translateY(4px); 180ms `--cui-ease-out-cubic` |
| Tile reflow and removal | Survivors move over 180ms; a removed tile fades and scales to .5 over 130ms `--cui-ease-in-cubic` |
| Tile geometry | 120px tiles, 6px gap, 20px remove control |

## Rules

- Hover strengthens the ring, except while the pointer is over an internal button.
- Typing `@` opens Artifact candidates. Enter or Tab inserts, arrows stop at the first and last row, and Escape dismisses. Focus stays in the editor throughout.
- An inserted reference is one atomic inline node: Backspace removes it whole and undo restores it.
- Width changes remeasure the draft, including when the chapter becomes visible again.
- The project row folds to the next mode when its content stops fitting. It unfolds only when the wider mode fits with 2px to spare and the labels are unchanged. Keep the same trigger element across modes so focus survives resizing.
- A tile is removed with its X, Delete or Backspace. Modified keys, IME composition and held-key repeats are ignored.
- On hover-capable devices the remove control appears on hover and focus; on coarse or no-hover input it stays visible.
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

Local adaptations and limits: [coverage](../../docs/coverage.md#composer).
