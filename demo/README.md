# React demo

The demo imports the public TSX components from `src/index.ts`. Its 14 chapters cover controls, segmented selection, typography, reading, feedback, hints, notifications, composer, menus, workspace, sidebar, image previews, galleries and tasks. Sample data, translations and replay controls belong to the demo. See [the migration record](../docs/react-migration.md).

## Run

Use Node.js 20.19+ (20.x), 22.12+, or a supported newer release, then from the repository root:

```sh
npm ci
npm run dev
```

Open the printed Vite address. `/demo/` is an additional entry to the same application. `?lang=en` and `?lang=zh-Hans` select the language; `#controls`, `#segmented`, `#type` and `#reading` select chapters. Theme and language preferences persist locally. Changing chapters, language or theme preserves component state.

The [mobile preview](../docs/assets/demo-preview-mobile.jpg) shows the 320px layout.

Use the theme selector for Light, Dark or System. Theme and playback pickers share the demo menu style: arrow keys browse, Enter selects, Escape cancels and Tab moves on. Implementation notes are hidden by default; the chapter-header toggle reveals descriptions and technical parameters without resetting the specimens. Controls start at normal playback speed; choose Slow (0.2×) to inspect their original motion.

Existing theme/language preferences from the pre-migration demo are retained; valid current preferences take precedence. Unsupported language parameters are ignored in favor of a valid saved preference or the browser language. Reselecting the current chapter returns to the top without adding a history entry.

```sh
npm run build       # typecheck and build dist/index.html and dist/demo/index.html
npm run preview     # open the printed address
npm run test:react  # independent consumer and demo browser checks
npm test           # unit checks, fresh production build and all browser checks
```

The production build includes local JS, CSS and the optional bundled Sans/Serif/Mono fonts, the icon font and the default and activity sprite sheets. It does not use runtime CDNs. The [Pages workflow](../.github/workflows/pages.yml) installs dependencies, builds this demo and publishes `dist/`. It remains manual-only, gated on `main` and `PAGES_ENABLED=true`. Relative asset URLs support both the site root and a repository subpath. Source HTML needs Vite; serve the built `dist/` directory for standalone static use.

## Import the source

For an existing React + TypeScript project, copy `src/` to a component folder, retaining its internal structure. Install React/React DOM and configure Tailwind CSS 4 in the host build (this demo uses `@tailwindcss/vite`). The host bundler must support CSS imports, relative CSS assets and static `new URL(path, import.meta.url)` assets. Sprite URLs use this standard ESM form and do not require `vite/client` type declarations. Import the stylesheet once. Paths below assume a consuming file at this repository's root:

```tsx
import { useState } from 'react';
import { SegmentedControl, Switch } from './src';
import './src/styles/index.css';

export function Example() {
  const [view, setView] = useState('preview');
  return (
    <div data-cui-theme="light">
      <SegmentedControl
        aria-label="View format"
        options={[
          { value: 'preview', label: 'Preview' },
          { value: 'code', label: 'Code' },
        ]}
        value={view}
        onValueChange={setView}
      />
      <Switch aria-label="Notifications" defaultChecked />
    </div>
  );
}
```

`src/styles/index.css` explicitly scans the adjacent component directory; it imports Tailwind theme/utilities without Preflight. A host already using Tailwind should keep a single theme/utilities import and incorporate every component stylesheet import, the `@theme inline` mappings and the component `@source` declaration from this entry. Dropping a stylesheet can remove behavior even when a component still renders. Keep utility class names literal. The library does not set body styles or load text fonts automatically; `fonts.css` is an optional separate import, or set `--cui-font-sans`, `--cui-font-serif` and `--cui-font-mono` to host fonts. `icons.css` includes its local glyph font; keep that asset when using `Icon`.

This is source consumption, not a published npm package or a precompiled CSS distribution. [The independent consumer](../tests/fixtures/react-consumer/main.tsx) uses only the source entry and component stylesheet, with no demo assets or scripts.

## Tests and static delivery

`npm test` runs deterministic zoom/search checks, builds the demo and runs all browser suites. Browser checks use an installed Chrome/Chromium; set `CHROME_BIN` if it is outside the usual locations. `npm run test:production` rebuilds and checks the static site at both `/` and a repository subpath, including assets, all chapters, navigation and saved preferences. `npm run test:react` checks the independent source consumers and chapter interactions.

The public source entry does not import demo code. It requires no backend, routing provider or application globals. A production build is separate from source consumption: this repository does not publish an npm package.

## Current API boundaries

- `Switch`: `checked/defaultChecked/onCheckedChange`, native button props and ref. Name it with `aria-label` or `aria-labelledby`. It is a button-based switch, not a hidden form field.
- `Checkbox`: native input props including `checked/defaultChecked/name/ref`, optional label children, and `onCheckedChange`. Its `className` styles the containing label. Native uncontrolled form reset is retained.
- `DiscreteSlider`: ordered `options` with unique string values, labels and an optional recommended mark; `value/defaultValue/onValueChange`. Native input props/ref target the range; `className/style` target its wrapper. Pointer callbacks may synchronously disable or disconnect the control without starting a stale gesture. `aria-valuetext` defaults to the current option's label; the native value submitted by a form is its numeric index. At least two options are needed to enable it. Options are not individually disabled.
- `SegmentedControl`: `options` with unique string values, React labels and optional disabled states; `value/defaultValue/onValueChange`, `size`, group label and container props. Arrow keys select immediately; disabled options are skipped. A missing/invalid selection has no indicator until a valid option is selected. Initialization and prop changes do not emit callbacks. It implements a radio group, not tab-panel semantics.

- `GraphemeReveal`: text, locale, animate and replayKey; grapheme segmentation keeps combined emoji/accents intact and the accessible text is announced once. `FadeIn` animates content on mount. Neither schedules sample text.
- `UserMessage` and `Prose`: children plus normal container props; Prose also takes a CSS `measure` (default 36em).
- `WorkingMark`: default 40-frame loop, active and an optional fallback; offscreen, document visibility and active changes pause playback. Page exit cancels the old loop; pageshow creates a fresh loop when eligible. Unmount cancels it. For SSR, the decorative image starts without a source on both the server and the first client render; mounting resolves and decodes its browser asset URL. Use `StatusMark` for the four-activity entry/exit state machine.
- `ScrollFollower`: children, label, returnLabel, active, busy, height, followContent and resetKey. Set followContent false for an initial static introduction; change resetKey to return to the top and restore following. Activity effect reconnection preserves the reading position and following state unless resetKey changes, including changes made while hidden. The host appends content. Upward input pauses following; scrolling back to the bottom or pressing Return restores it. If a focus callback synchronously deactivates, hides or unmounts the component, that Return is cancelled, including same-task reconnection.
- `CodeBlock`: exact code string, optional language and translated copyLabel/copiedLabel/copyFailedLabel. Clipboard failure is announced; stale writes and timers cannot cross lifetimes.
- `ExpandableTable`: columns/rows with stable keys, translated label/expandLabel/closeLabel, optional minWidth and active. Native dialog semantics retain focus return and scoped theme inheritance. Set active false when a chapter hides it. Activity cleanup releases the native modal; its obsolete close event does not restore focus into the hidden view. Reconnection restores a retained open request. Cells should be presentational content; expansion renders a second table, not a synchronized editor.
- `Icon`: a typed static glyph name and authored size; the host supplies accessible text. `IconButton` accepts native button props/ref and should have a label.
- `useClipboard` and `useVisible` are available for reusable consumers; sample playback timing stays under `demo/hooks/`. `useClipboard.copy(text)` retains its Promise result; optional `copy(text, onResult)` rechecks request ownership at callback delivery, including disconnection, pagehide and newer writes.

All migrated components preserve the existing demo's motion timings. Controls inherit optional `--cui-motion-scale` for demonstration; production use defaults to 1. Reduced-motion variants remain a later, explicit enhancement, matching the original coverage boundary.

## Waiting and disclosure

Open `/demo/?lang=en#feedback` or `/demo/?lang=zh-Hans#feedback`.

- `StatusMark`: `activity`, `running` (default true), `active`, `replayKey`, `onActivityEnter` and `onComplete`. Set running false to finish the current stage then play its exit. Change replayKey to restart from grow, including after completion. Keep the old text until onActivityEnter reports the new artwork. A new selection during exit cancels pending completion. Hidden/offscreen playback pauses; unmount cancels it. Missing artwork retains the current mark or a static dot.
- `ShimmerText`: string children, shimmering and active. The visual clone is hidden from assistive technology, and copy changes do not restart the sweep.
- `SkeletonGroup` / `SkeletonLine`: one shared sweep clipped to measured child rows; active controls playback in addition to viewport visibility. Use a plain group container and untransformed row descendants. The host decides when the skeleton appears.
- `Accordion`: title, children, open/defaultOpen/onOpenChange, disabled, triggerClassName and ordinary wrapper props. Its panel retains content state while closed, is inert, and returns focus to the trigger when necessary. Do not put interactive elements inside title.

[Independent feedback consumer](../tests/fixtures/react-feedback/main.tsx) and [tests](../tests/react-feedback.browser.cjs) cover authored seams, cancellation, pause/resume, failure, remount, shared clip geometry and disclosure focus.

## Hints and notifications

Open `/demo/?lang=en#micro` and `/demo/?lang=en#recovery` (also available with `lang=zh-Hans`).

```tsx
import { useRef } from 'react';
import { NotificationStack, Tooltip } from './src';
import type { NotificationStackHandle } from './src';

export function SaveFeedback() {
  const notices = useRef<NotificationStackHandle>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <Tooltip content="Save these notes">
      {binding => <button {...binding} type="button" onClick={() => {
        notices.current?.notify({ key: 'saved', message: 'Notes saved' });
      }}>Save</button>}
    </Tooltip>
    <button ref={trigger} type="button" onClick={() => notices.current?.clear()}>Clear notices</button>
    <NotificationStack ref={notices} dismissLabel="Dismiss" fallbackFocus={trigger} />
  </>;
}
```

- `Tooltip` uses a render-function child so the host keeps native trigger semantics. Spread all binding props. Equivalent JSX content and unrelated parent renders preserve a pending request's original delay and an already visible hint. Initial autoFocus, callback-ref and layout-effect focus requests survive initialization and StrictMode effect replay. Inactivity and Activity disconnection cancel pending work; a reconnected trigger may issue a fresh focus request. Use overflowOnly for ellipsized text, onOverflowChange for a host hint, describedBy to retain an additional description, and active=false when hiding a chapter. It clamps to viewport edges but does not portal outside clipping ancestors.
- `GhostButton` accepts native button props/ref and requires an accessible name. Its eyes animate only on hover-capable devices, stop while pressed, and stay still on keyboard focus.
- `CopyButton` takes text and translated copyLabel/copiedLabel/failedLabel, plus optional onCopyResult. It reuses useClipboard, including latest-write-wins, 2s success reset and the temporary textarea fallback when the secure API is unavailable. Results are revalidated at delivery: hiding Activity, unmounting, pagehide or a newer copy can suppress a result even after its write has completed. A committed Activity hide or unmount invalidates the request before asynchronous delivery resumes, including ordinary scheduled React updates. Reconnection preserves completed feedback's original expiry but never replays a cancelled callback.
- `NotificationStack` exposes notify/dismiss/clear through its ref. Notices take message, optional deduplication key, action (label/onClick), and duration. Ordinary defaults are 6s; actions persist; null duration persists. Repeated keys increment a count; renderMessage customizes/localizes the text. Single mode replaces one entry and can interrupt its exit. An action's automatic dismissal applies only to its original notice version; a synchronous refresh or replacement keeps its own content and deadline. Public dismiss(id) still closes the current version. defaultNotices is initial-only. Supply dismissLabel and optionally label, empty, fallbackFocus, active and wrapper styles. The host owns placement. Hidden stacks keep deadlines but cannot announce or restore focus; unmount cancels timers.

[Independent consumer](../tests/fixtures/react-micro/main.tsx) and [browser checks](../tests/react-micro.browser.cjs) cover source-only use, tooltip delay/overflow/Escape, ghost press, clipboard lifecycle/fallback, notification queue/focus/deadlines/deduplication/reopening, and bilingual light/dark responsive layouts.

## Composer, references and attachments

Open `/demo/?lang=en#composer` or `/demo/?lang=zh-Hans#composer`.

```tsx
import { useRef, useState } from 'react';
import { AttachmentList, ComposerSurface, ComposerToolbar, MentionEditor } from './src';
import type { MentionEditorHandle } from './src';

export function DraftExample() {
  const editor = useRef<MentionEditorHandle>(null);
  const [files, setFiles] = useState([{ id: 'notes', name: 'design-notes.md' }]);
  return <>
    <ComposerSurface>
      <AttachmentList items={files} label="Attachments"
        removeLabel={file => `Remove ${file.name}`}
        onRemove={id => setFiles(current => current.filter(file => file.id !== id))}
        onEmptyFocus={() => editor.current?.focus()} />
      <MentionEditor ref={editor} label="Draft" placeholder="Type a few lines…"
        mentionListLabel="References" mentionHeading="Artifacts" deleteLabel="Delete"
        options={[{ id: 'landscape', title: 'Landscape illustration', description: 'Design' }]}
        onDraftChange={draft => console.log(draft.text, draft.mentions)} />
    </ComposerSurface>
    <ComposerToolbar projectLabel="Project" modelLabel="Sonnet 4.6" />
  </>;
}
```

The browser owns the editable DOM and undo stack. MentionEditor is intentionally uncontrolled: defaultText initializes it, resetKey explicitly resets it, and the ref exposes focus/clear/getDraft. Activity effect reconnection retains the same editing DOM, undo history and semantic blank lines; it does not reapply defaultText or emit an unchanged draft. Draft text excludes decorative icon glyphs; ordered mention metadata carries stable IDs and insertion-time titles. This is an editing callback, not a rich-document persistence format. The host owns submission and any draft storage. Enter inserts a newline unless a candidate is active; IME composition, native atomic deletion, undo and plain-text paste remain in the editing island. Localizing labels closes overlays while preserving draft nodes.

The editor and demo use maxHeight `min(40svh, 384px)` by default; the independent test fixture overrides it to 130px. Width/visibility changes remeasure it. active=false keeps candidate and mention context menus closed without making text read-only; hide/inert the host when appropriate. Right-clicking an inactive mention cannot open a custom menu or move focus into it. Candidate/context-menu positions remain in the component's theme subtree; avoid transformed ancestors that establish a containing block for fixed positioning.

AttachmentList is controlled: provide unique IDs and a synchronous React state update in onRemove. Its View Transition transaction flushes that update, animates surviving tiles and removes the target once even when interrupted. onEmptyFocus handles the last removal. Native Delete/Backspace/Enter, IME/modifier/repeat guards and touch-visible remove controls are included. File input, upload and sending remain host responsibilities.

ComposerToolbar implements the original empty-project variant. projectLabel/modelLabel/modelAriaLabel and optional callbacks/description/trailing content customize it. It folds by measured space, keeps the same trigger node and unfolds with 2px spare width. ComposerPicker is also exported with native button props/ref and the measured press layer.

[Independent consumer](../tests/fixtures/react-composer/main.tsx) and [browser suite](../tests/react-composer.browser.cjs) verify native undo and IME, safe paste, focus, hidden draft preservation, multiple instances, exact folding boundaries, real attachment transitions, fallback/unmount handling, and bilingual mouse/touch layouts.

## Menus, search and artifact actions

Open `/demo/?lang=en#menus` or `/demo/?lang=zh-Hans#menus`.

```tsx
import { SubmenuSelect } from './src';

export function EffortChoice() {
  return <SubmenuSelect label="Model settings" submenuLabel="Thinking effort"
    options={[{ value: 'low', label: 'Low' }, { value: 'high', label: 'High' }]}
    defaultValue="high" onValueChange={value => console.log(value)}
    renderPreview={(preview, selected) => <span>Preview: {preview} · Selected: {selected}</span>} />;
}
```

- `SubmenuSelect` accepts stable value/label/disabled options, value/defaultValue/onValueChange, optional onPreviewChange/renderPreview, active and className. Arrows preview enabled options; Enter/Space/click commits. Escape/Left closes one level and restores its owner. The component preserves its small in-flow menu layout; it does not portal or implement collision placement.
- `GroupedSearch` accepts label, placeholder, emptyMessage, locale and items `{ id, label, group? }`, plus query/defaultQuery/onQueryChange and onSelect. Filtering trims the query and uses locale-aware lowercase comparison; only an exactly empty query shows headings. Keep each group's items adjacent. Selection requests an empty query before calling onSelect. Optional autoFocus uses preventScroll and suppresses the initial focus-visible ring where supported.
- `useSearchHighlight(active)` returns highlight(row, title) and cancel(). Give the destination title `tabIndex={-1}`. The hook may live in a parent while a child requests a highlight from a callback ref or `useLayoutEffect`, on first mount or Activity retained-DOM reconnection, with or without StrictMode. For Activity reconnection, the destination DOM follows the same Activity's visibility; requests to its hidden retained destination are discarded rather than replayed on reveal. A new selection cancels the old highlight, focuses the heading and centers its scroll containers; it waits at least 250ms and three stable frames, with a 1500ms cap, before the 1.95s underline/wash. Focus callbacks may synchronously cancel, deactivate, disconnect or replace the request; only the live request continues and remains cancellable. User input suppresses additional centering. Inactivity, pagehide and unmount cancel pending work; saved methods cannot start focus, scrolling or animation while the hook is inactive or after true unmount. The host owns destination lookup and chapter activation. For external or portal destinations, set active=false when hiding or disabling the host, and request highlights only when the destination should be shown.
- `ArtifactActionsCard` takes title, subtitle, image, actionsLabel and actions `{ id, label, onSelect, disabled? }`, plus active/className. The image is decorative; title provides the artifact's text. `subtitle` supports presentational React nodes, including blocks, in both the thumbnail and action card, with valid SSR markup. The host provides real action effects. Alt/Option+Enter toggles, arrows/Home/End move focus, and digits 1–9 address the first nine actions. Closing cancels deferred focus and returns from the current card rectangle only when thumbnail artwork is ready. The card stays within its local theme/container, capped at 280px.

Set active=false when hiding menu/action chapters; it closes overlays and cancels pending highlights without moving focus. Submenu and Artifact menus also dismiss on Activity disconnection; revealing their retained DOM does not restore an old menu, focus request or return animation. Selection callbacks may synchronously deactivate, disconnect or unmount their menu, transfer focus, or open a new menu; the old selection cannot restore focus or close that newer interaction. Normal selections still close and return focus to their trigger. The host should hide or make inactive content inert. All text is passed through props. The demo's Open/Copy link messages are local simulations.

[Independent consumer](../tests/fixtures/react-menus/main.tsx) · [browser suite](../tests/react-menus.browser.cjs) · [deterministic settling checks](../tests/search-highlight.test.cjs).

## File panels and sidebar navigation

Open `/demo/?lang=en#workspace` and `/demo/?lang=en#modes` (also available with `lang=zh-Hans`).

- `FileWorkspace` takes files `{ id, name, icon?, preview, code }` and a `WorkspaceLabels` object for all visible/accessibility text. Preview is a React node; code is a plain string. File selection uses value/defaultValue/onValueChange; view uses view/defaultView/onViewChange (`preview` or `code`); expansion uses expanded/defaultExpanded/onExpandedChange. Missing file IDs resolve to the first available file without emitting a mount callback. Empty lists show labels.empty. Preview content is replaced on file/view changes; keep editor state in the host if it must persist across those changes.
- Pane width starts at defaultPaneWidth (244px). CSS clamps the rendered list to 160–520px and 60% of the host, retaining chosen width through temporary constraints. onPaneWidthChange reports committed changes, not every drag frame. Movement must exceed 3px to commit; cancellation restores the stored value. Arrows use 8px, Shift uses 32px, Home/End reach bounds, Enter/Space/double-click reset. The 620px stacking breakpoint measures the component container. F6 cycles the visible list, selected view and content; expanded lists are inert.
- `SidebarModes` takes options `{ id, label, icon, selectedIcon?, running?, runningLabel?, disabled? }`, value/defaultValue/onValueChange and native div props. Supply aria-label. Its arrows move focus only and reverse in RTL; Enter/Space/click selects. Hidden/removed options resolve to the first enabled option. Controlled hosts should update their own value when removing an option. Two/three options use the original 180/254px content-box folding thresholds. The host can supply a bold selected Code icon and a localized running label; the component does not invent application modes or jobs.
- `PinnedList` takes controlled items `{ id, title }` and onOrderChange(ids). Keep IDs stable and synchronously update the React list order in that callback. value/defaultValue/onValueChange control conversation selection independently. Supply label, actionsLabel(item), menuLabel, moveUpLabel, moveDownLabel, movedLabel(item, position, total) and cancelledLabel; describedBy can reference host instructions. Optional initialStatus initializes the live message until the first move/cancel; remount with a new key for a full host reset.
- Pinned dragging creates only an inert decorative copy and temporary neighbor transforms. Order commits on release, including the original 200ms lost-button fallback; Escape, pointer cancellation, resize/scroll and inactivity discard it. The menu provides the same reorder callback for keyboard use, with focus returning to the moved row. The popup portals to document.body, carrying its light/dark theme and direction; placement follows the trigger and clamps/flips within the viewport. Avoid transformed ancestors around the drag stage because its decorative copy uses fixed positioning.

`PinnedList` uses `initialStatus` until a move or cancellation replaces it; this initial text can follow locale prop updates. Inactivity announces an interrupted drag through `cancelledLabel`. If Activity disconnects an already started drag, the retained instance announces its cancellation on reconnection using the current labels, including when active=false was committed while hidden. A press below the drag threshold and a true unmount remain silent.

For both chapters, active=false cancels transient interaction work; the host should hide/inert inactive content. Pinned menus also dismiss on Activity disconnection; revealing their retained DOM does not restore an old menu or move outside focus. A resize handle's focus callback may synchronously deactivate, expand, hide or unmount its owner; that pointerdown cannot resume dragging or commit a width after cancellation, including same-task reconnection. Text, data, actual navigation and persistence belong to the host. [Independent consumer](../tests/fixtures/react-workspace/main.tsx) · [browser suite](../tests/react-workspace.browser.cjs).
