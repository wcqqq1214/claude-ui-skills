# Scope and coverage

Claude UI Skills is an unofficial reference for Claude Desktop-style interfaces. The examples cover typography, motion, controls, menus, reading, panels, keyboard focus and visible feedback. They do not simulate backend execution, authentication or reconnection. Separate reduced-motion demonstrations are not provided.

This page describes the visible examples in the [React demo](../demo/index.html), their interactions and their limits. The [component guides](../references/components.md) provide further details. Coverage is limited to the examples and observations documented here.

## React migration status

All examples are available in the React demo. [The migration record](react-migration.md) documents the transition. The sections below describe the example interactions and their limits.

## Using the examples

Open the demo to explore its sample layouts, text, icons, controls and animations. Each example uses local sample content and demonstrates a limited set of interactions. Recorded checks apply to the documented examples and sessions; they do not establish identical appearance or behavior across applications, devices or versions.

## Coverage limits

| Effect | Remaining boundary |
| --- | --- |
| Decorative glow | No glow animation is demonstrated |
| Editor cursor and selection | Specialized code-editor cursor and selection effects are not demonstrated |
| Code folding | Code blocks do not offer folding |
| Timeline collapse | Coverage is limited to opening and closing the local timeline card |

Not every size, disabled state, tooltip combination, long list, nested overlay, touch interaction, screen-reader interaction or physical gesture has been checked. Reduced-motion demonstrations and backend actions are outside these examples.

## Per chapter

<a id="type"></a>

### Text reveal and local scrolling

- **Behavior:** the two-column grid has separate playback triggers. The reveal sample uses 18px text; the bubble uses 14px text with 1.6 line spacing and an emphasized sample phrase. The scrolling example has a 300px viewport. Replay clears the added paragraphs and pauses at the top; paragraphs appear at 0.4, 1.1 and 1.8s, then every 2s until 11.8s. The view begins following with the first added paragraph. These timings belong to the local example. The activity-mark card demonstrates hover and keyboard focus independently of scrolling.
- **Limits:** the activity mark repeatedly contracts and expands. Only this loop is shown; separate entrance and exit animations and continuity between separate examples are not demonstrated. The example does not cover a complete streamed conversation or page layout.

<a id="controls"></a>

### Switch, checkbox and slider

- **Behavior:** three labeled cards demonstrate a switch, checkbox and four-stop slider. The turtle control switches between one-fifth playback speed, enabled initially, and normal speed without changing the selected state. The switch and checkbox are shown at 2× size and the slider at 1.5×. The slider width is capped at 360px before magnification and shrinks to fit its container.
- **Limits:** the slider reports the selected position as "Level X of Y". Continuous sliders and every size or disabled-state combination are not demonstrated.

<a id="segmented"></a>

### Segmented control

- **Behavior:** the example shows standard and compact segmented choices with sample labels. Changing the selection can interrupt an ongoing animation.
- **Limits:** labels can vary and choices can be disabled. Linked tab panels are not demonstrated.

<a id="composer"></a>

### Input and attachments

- **Behavior:** the centered editor shows an add control, a toolbar and two sample attachment tiles. Removing a tile updates focus; removing the last tile collapses the empty row. The width control changes the editor width, with a 156/168px minimum. Tiles are 120px wide, separated by 6px, with a 20px remove control and up to four lines of sample text. A fixed artifact example accompanies the editor.
- **Limits:** the example does not provide a command menu, file chooser, file reading, upload or sending. Restored drafts, every long-filename layout and all touch gestures are not covered.

<a id="feedback"></a>

### Waiting, skeletons and accordion

- **Behavior:** selecting an activity changes the status mark, text and cycle count. Switching while running keeps the skeleton and shimmer visible; switching after completion starts a fresh example. The example runs until Finish is pressed. During closing, further Finish presses are ignored; the same focused button becomes Replay. Replay starts the selected animation again. Changing the selection during closing continues the transition. The two-row skeleton and timeline card are sized independently.
- **Limits:** the chosen activity has an animated status mark. If its artwork is unavailable, the current mark stays visible. Synchronization between multiple marks and all transition combinations are not covered. The timeline card can expand and collapse.

<a id="workspace"></a>

### File panel

- **Behavior:** the read-only panel switches between Preview and Code. Dragging the separator changes its width and updates a width readout; the handle is emphasized during resizing. Cancelling a drag restores the previous size. F6 cycles focus through three regions. Long filenames are shortened with an ellipsis and expose their full text on hover. Rows are 38px high on desktop and 31px in the narrow layout, which displays the file list horizontally.
- **Limits:** the panel does not edit, save or rename files. It does not demonstrate code editing or a conversation view.

<a id="images"></a>

### Image preview

- **Behavior:** a local landscape illustration opens in a single-image preview with a hint. Multi-image navigation is demonstrated in the gallery.

<a id="micro"></a>

### Tooltips, ghost hover and copy

- **Behavior:** the ghost sample demonstrates a hover animation and has a local label and explanation; it does not open an incognito session or add a tooltip or shortcut. Copy feedback appears in a fixed-position notice up to 360px wide and replaces the previous notice. The overflow-width slider ranges from 100 to 320px, subject to the container width; its readout shows the requested width. Sample filenames are used throughout.
- **Limits:** tooltips can move below their trigger to stay within the viewport, but surrounding containers may still clip them. Moving between grouped tooltips and keeping a tooltip open while hovering over it are not demonstrated.

<a id="reading"></a>

### Reading, code and tables

- **Behavior:** body text uses 15px type and 1.6 line spacing in a column up to 36em wide. The 12–36em width control reflows the title, paragraphs and identifiers. Code and table examples sit side by side, then stack at widths of 760px or less. Rulers and labels accompany baseline, number and weight comparisons. The English weight samples stay fixed. The number sample advances by seven hundredths every 50ms and wraps after 00:59.99. The 720px sample table sits in a frame and can open in a dialog whose layout adjusts at 620px or less. Copy provides a tooltip and reports failure. The fenced-code sample has no syntax colors. An emphasized phrase appears in the English sample; the Chinese translation has no emphasized phrase.
- **Limits:** headings and paragraphs adjust their line breaks as the available width changes; some short final lines may remain. Inline and fenced code have separate presentations. Copy feedback changes from Copy to Check, then returns to Copy; keyboard activation and dark-theme feedback were recorded. Number samples keep digits aligned. Equal weight values can look different across typefaces; Chinese fallback glyphs and icon alignment may look different. Nested dialogs and layouts with an on-screen keyboard are not covered.

<a id="gallery"></a>

### Gallery

- **Behavior:** three local landscape illustrations and their filenames appear in the gallery. Opening and closing the dialog moves and returns focus. Paging, zoom and pan operate on these sample images.
- **Limits:** physical trackpad gestures and long image collections remain outside the recorded coverage. The example does not import files or demonstrate images loading as the gallery is scrolled.

<a id="menus"></a>

### Menus, search and palette

- **Behavior:** the three-card layout demonstrates menus, search and an artifact action card. A submenu initially focuses the selected item; menus expand within their card. Search filters sample data by substring and moves focus to fixed destinations in the same chapter. It does not change the URL or activate another chapter. The search field shows a keyboard-focus outline and does not take focus automatically. The action card stays within its card and is capped to fit narrow layouts. Clicking outside dismisses it and returns focus. Open and Copy link report simulated actions; Pin/Unpin changes only the example state.
- **Recorded observation and limits:** in a recorded Claude Desktop 2.42304.0 session, Search → Artifacts showed a thumbnail. Option+Enter opened a card with Open, Copy link and Pin, with focus on Open; Escape or ArrowLeft returned to the thumbnail. The recording showed the thumbnail moving, the title appearing and the action area expanding. On closing, the thumbnail reappeared before moving back. These observations apply to that session. Loading and failure placeholders, changing the selection and placement near screen edges are not demonstrated. The example does not change model settings or provide a complete command system.

<a id="modes"></a>

### Sidebar modes and pinned order

- **Behavior:** width and item-count controls demonstrate sidebar layouts with 13px text and visible focus outlines. A fixed running example is shown. Reset restores the sample pinned order.
- **Notes:** with the example padding, sidebar presentation changes at outer widths of 256px and 182px. Button symbols identify their example actions.

<a id="tasks"></a>

### Cards, drop feedback and progress

- **Behavior:** sample cards show status shapes and example content. Enter or Space triggers the drop-feedback demonstration. The progress list uses sample data and offers playback and Replay.
- **Limits:** physical dragging is not established by the keyboard demonstration. The example does not show a running-state pulse, page-wide dimming, upload, file parsing or task execution. Only the animated drop exit is covered.

<a id="recovery"></a>

### Notification stacks

- **Behavior:** a persistent action notice is shown initially. Stack three adds three notices; Clear notices removes the stack. Notices display action buttons, follow the example focus policy and adjust to size changes.
- **Limits:** notices do not expand on hover. Network failure and reconnection are not simulated.

## Shared visual presentation

- Text uses bundled sans-serif, serif and monospace fonts; static font icons accompany controls. Chinese glyphs use system fallback fonts. [Visual foundations](../references/visual.md) describes the visual roles.
- The same weight value can look different across typefaces. Chat-font settings are not demonstrated.
- Icon coverage is limited to the included static examples. Animated icons and every right-to-left layout are not demonstrated. A centered icon can still look visually uneven.
- Decorative stars, status shapes, checkbox strokes, landscape illustrations and sample content belong to the local examples. The demo includes language and theme controls and layouts for narrow screens.

## Recorded validation

The following are records of earlier checks, not a new validation run. They apply to the documented interactions and sessions.

**Local demo:** the recorded 2026-10-14 check covered desktop light/dark themes and a 390px layout without whole-page horizontal overflow. Paths included replay, controls and segmented selection, waiting and accordion feedback, panel resize and return, image and gallery opening, closing, paging and zoom, tooltips and copy, menu exit, cards and notification merging. Escape closed the table dialog and returned focus. The check used the keyboard drop demonstration; a full physical-drag or trackpad check was not repeated. Separate checks covered a segmented control displayed at 75% size, small separator movements, interrupted image closing and reopening, skeleton resizing and replay, table overflow and replenishing a nine-notification stack.

**React migration:** recorded checks covered the example chapters, saved preferences, unavailable browser storage and navigation history. Preview checks included the main entry page and switching to Chinese. [Test coverage mapping](../tests/README.md) records the tested interactions. Physical trackpad behavior and the excluded variants above remain outside this evidence.

**Original app:** the recorded file-preview session showed Preview/Code switching and keyboard resizing. Keyboard resizing in a different file viewer was not confirmed. A nested menu opened with focus on Low while High stayed selected; this observation does not establish how a slider commits a value. Chat-copy success, code-editing effects and complete physical-gesture behavior were not established.

## License

Project-authored code and documentation use the [MIT License](../LICENSE). Third-party assets retain their respective rights.
