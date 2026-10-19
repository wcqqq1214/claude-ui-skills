# React demo

The migration demo imports the public TSX components from `src/index.ts`. It currently covers controls, segmented selection, typography, reading/code/tables, activity feedback, skeletons, disclosure, tooltips, copy feedback and notifications. The original `showcase/` remains the reference for the remaining chapters; the full migration is tracked in [the migration plan](../docs/react-migration.md).

## Run

Use Node.js 20.19+ (20.x), 22.12+, or a supported newer release, then from the repository root:

```sh
npm ci
npm run dev
```

Open `/demo/` on the printed Vite address. `?lang=en` and `?lang=zh-Hans` select the language; `#controls`, `#segmented`, `#type` and `#reading` select chapters. Theme and language preferences persist locally. Changing chapters, language or theme preserves component state.

```sh
npm run build       # typecheck and build dist/demo/index.html
npm run preview     # open /demo/ on the printed address
npm run test:react  # independent consumer and demo browser checks
npm test           # original unit and browser checks plus React browser checks
```

The production build includes local JS, CSS and the optional bundled Sans/Serif/Mono fonts, the icon font and the default and activity sprite sheets. It does not use runtime CDNs. The existing Pages workflow deploys the original showcase when explicitly enabled.

## Import the source

For an existing React + TypeScript project, copy `src/` to a component folder, retaining its internal structure. Install React/React DOM and configure Tailwind CSS 4 in the host build (this demo uses `@tailwindcss/vite`). Import the stylesheet once. Paths below assume a consuming file at this repository's root:

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

`src/styles/index.css` explicitly scans the adjacent component directory; it imports Tailwind theme/utilities without Preflight. A host already using Tailwind can instead import `tokens.css`, `motion.css`, `reading.css`, `feedback.css`, `micro.css` and `icons.css`, copy the `@theme inline` mappings, and add `@source` for the copied component directory. Keep utility class names literal. The library does not set body styles or load text fonts automatically; `fonts.css` is an optional separate import, or set `--cui-font-sans`, `--cui-font-serif` and `--cui-font-mono` to host fonts. `icons.css` includes its local glyph font; keep that asset when using `Icon`.

This is source consumption, not a published npm package or a precompiled CSS distribution. [The independent consumer](../tests/fixtures/react-consumer/main.tsx) uses only the source entry and component stylesheet, with no demo assets or scripts.

## Current API boundaries

- `Switch`: `checked/defaultChecked/onCheckedChange`, native button props and ref. Name it with `aria-label` or `aria-labelledby`. It is a button-based switch, not a hidden form field.
- `Checkbox`: native input props including `checked/defaultChecked/name/ref`, optional label children, and `onCheckedChange`. Its `className` styles the containing label. Native uncontrolled form reset is retained.
- `DiscreteSlider`: ordered `options` with unique string values, labels and an optional recommended mark; `value/defaultValue/onValueChange`. Native input props/ref target the range; `className/style` target its wrapper. `aria-valuetext` defaults to the current option's label; the native value submitted by a form is its numeric index. At least two options are needed to enable it. Options are not individually disabled.
- `SegmentedControl`: `options` with unique string values, React labels and optional disabled states; `value/defaultValue/onValueChange`, `size`, group label and container props. Arrow keys select immediately; disabled options are skipped. A missing/invalid selection has no indicator until a valid option is selected. Initialization and prop changes do not emit callbacks. It implements a radio group, not tab-panel semantics.

- `GraphemeReveal`: text, locale, animate and replayKey; grapheme segmentation keeps combined emoji/accents intact and the accessible text is announced once. `FadeIn` animates content on mount. Neither schedules sample text.
- `UserMessage` and `Prose`: children plus normal container props; Prose also takes a CSS `measure` (default 36em).
- `WorkingMark`: default 40-frame loop, active and an optional fallback; visibility/page changes pause playback and unmount cancels it. Use `StatusMark` for the four-activity entry/exit state machine.
- `ScrollFollower`: children, label, returnLabel, active, busy, height, followContent and resetKey. Set followContent false for an initial static introduction; change resetKey to return to the top and restore following. The host appends content. Upward input pauses following; scrolling back to the bottom or pressing Return restores it.
- `CodeBlock`: exact code string, optional language and translated copyLabel/copiedLabel/copyFailedLabel. Clipboard failure is announced; stale writes and timers cannot cross lifetimes.
- `ExpandableTable`: columns/rows with stable keys, translated label/expandLabel/closeLabel, optional minWidth and active. Native dialog semantics retain focus return and scoped theme inheritance. Set active false when a chapter hides it. Cells should be presentational content; expansion renders a second table, not a synchronized editor.
- `Icon`: a typed static glyph name and authored size; the host supplies accessible text. `IconButton` accepts native button props/ref and should have a label.
- `useClipboard` and `useVisible` are available for reusable consumers; sample playback timing stays under `demo/hooks/`.

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

- `Tooltip` uses a render-function child so the host keeps native trigger semantics. Spread all binding props. Use overflowOnly for ellipsized text, onOverflowChange for a host hint, describedBy to retain an additional description, and active=false when hiding a chapter. It clamps to viewport edges but does not portal outside clipping ancestors.
- `GhostButton` accepts native button props/ref and requires an accessible name. Its eyes animate only on hover-capable devices, stop while pressed, and stay still on keyboard focus.
- `CopyButton` takes text and translated copyLabel/copiedLabel/failedLabel, plus optional onCopyResult. It reuses useClipboard, including latest-write-wins, 2s success reset and the temporary textarea fallback when the secure API is unavailable.
- `NotificationStack` exposes notify/dismiss/clear through its ref. Notices take message, optional deduplication key, action (label/onClick), and duration. Ordinary defaults are 6s; actions persist; null duration persists. Repeated keys increment a count; renderMessage customizes/localizes the text. Single mode replaces one entry and can interrupt its exit. defaultNotices is initial-only. Supply dismissLabel and optionally label, empty, fallbackFocus, active and wrapper styles. The host owns placement. Hidden stacks keep deadlines but cannot announce or restore focus; unmount cancels timers.

[Independent consumer](../tests/fixtures/react-micro/main.tsx) and [browser checks](../tests/react-micro.browser.cjs) cover source-only use, tooltip delay/overflow/Escape, ghost press, clipboard lifecycle/fallback, notification queue/focus/deadlines/deduplication/reopening, and bilingual light/dark responsive layouts.
