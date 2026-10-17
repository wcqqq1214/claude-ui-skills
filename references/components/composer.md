# Input and attachments

Use this for Claude-inspired input surfaces, hover/focus transitions, Artifact inline references, and attachment entrance, removal and reflow. The editable sample demonstrates appearance and growth, not a chat workflow.

## Read the running code

[HTML](../../showcase/index.html#composer) · [JS](../../showcase/components/composer.js) · [References](../../showcase/components/composer-mentions.js) · [CSS](../../showcase/components/composer.css)

`initComposerDemo()` binds `resizeInput()` to input and width changes; `initComposerAttachments()` owns the fixed filename tiles, add/remove controls and their View Transition lifecycle. Read `.composer-box`, `.composer-attachments`, `.composer-attachment`, `addSample()` and `remove()` together.

## Design and adaptation

- Resize the editor from its scroll height, capped at 130px in this demo. The contenteditable sample keeps multiline editing and adds `@` Artifact candidates, Enter/Tab selection, Escape dismissal and atomic inline references. It has no sending workflow. Width changes remeasure the draft, including when returning to the chapter.
- The composer uses a 12px radius, an outer ring in light mode and an inset ring in dark mode. Hover strengthens the ring except over internal buttons; focus raises shadow alpha from 3.5% to 7.5% with a 200ms transition.

- `.composer-attachments` enters from opacity 0 / translateY(-8px) over 200ms; individual `.composer-attachment` tiles enter from opacity 0 / scale(.92) translateY(4px) over 180ms. Both use cubic-bezier(.215,.61,.355,1). Typed View Transitions move surviving tiles over 180ms and fade/scale removed tiles to .5 over 130ms with cubic-bezier(.55,.055,.675,.19). The last tile skips that removal transition; unsupported or hidden documents update directly. Interrupted removals still apply once.
- The demo starts with two fixed mock attachments, using the same `addSample()` path as the labeled Add attachment control; the control adds up to three fixed filenames. Remove with X, Delete or Backspace; modified keys, IME composition and held-key repeats are ignored. Keyboard focus moves to the next removal control, then the previous one, then the input. Filenames stay unchanged across language switches; accessible action labels translate.

The attachment example animates local sample tiles. The 120px tiles, 6px gap and 20px removal control use default sizing; sample names, four-line labels, tile typography/surfaces, immediate empty-container collapse, focus targeting and addition control are local adaptations. This small demo does not reproduce every filename-tail, restored-draft, clipped-container or gesture branch. There is no file chooser, file reading, upload or sending. Validate add/remove/re-add, interrupted removal, last-tile cleanup, wrapping, language/theme changes and keyboard return.

The labeled attachment control, two initial sample tiles, parameter caption and centered, unframed desktop presentation are local choices, not Claude startup behavior. The editor cap, padding and toolbar are local bindings. Check hover versus focus, multiline growth, draft retention across chapter/language changes and narrow wrapping.
