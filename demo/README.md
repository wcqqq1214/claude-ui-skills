# React demo

The migration demo imports the public TSX components from `src/index.ts`. It currently covers controls, segmented selection, typography and reading/code/tables. The original `showcase/` remains the reference for the remaining chapters; the full migration is tracked in [the migration plan](../docs/react-migration.md).

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

The production build includes local JS, CSS and the optional bundled Sans/Serif/Mono fonts, the icon font and the working-mark sheet. It does not use runtime CDNs. The existing Pages workflow deploys the original showcase when explicitly enabled.

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

`src/styles/index.css` explicitly scans the adjacent component directory; it imports Tailwind theme/utilities without Preflight. A host already using Tailwind can instead import `tokens.css`, `motion.css`, `reading.css` and `icons.css`, copy the `@theme inline` mappings, and add `@source` for the copied component directory. Keep utility class names literal. The library does not set body styles or load text fonts automatically; `fonts.css` is an optional separate import, or set `--cui-font-sans`, `--cui-font-serif` and `--cui-font-mono` to host fonts. `icons.css` includes its local glyph font; keep that asset when using `Icon`.

This is source consumption, not a published npm package or a precompiled CSS distribution. [The independent consumer](../tests/fixtures/react-consumer/main.tsx) uses only the source entry and component stylesheet, with no demo assets or scripts.

## Current API boundaries

- `Switch`: `checked/defaultChecked/onCheckedChange`, native button props and ref. Name it with `aria-label` or `aria-labelledby`. It is a button-based switch, not a hidden form field.
- `Checkbox`: native input props including `checked/defaultChecked/name/ref`, optional label children, and `onCheckedChange`. Its `className` styles the containing label. Native uncontrolled form reset is retained.
- `DiscreteSlider`: ordered `options` with unique string values, labels and an optional recommended mark; `value/defaultValue/onValueChange`. Native input props/ref target the range; `className/style` target its wrapper. `aria-valuetext` defaults to the current option's label; the native value submitted by a form is its numeric index. At least two options are needed to enable it. Options are not individually disabled.
- `SegmentedControl`: `options` with unique string values, React labels and optional disabled states; `value/defaultValue/onValueChange`, `size`, group label and container props. Arrow keys select immediately; disabled options are skipped. A missing/invalid selection has no indicator until a valid option is selected. Initialization and prop changes do not emit callbacks. It implements a radio group, not tab-panel semantics.

- `GraphemeReveal`: text, locale, animate and replayKey; grapheme segmentation keeps combined emoji/accents intact and the accessible text is announced once. `FadeIn` animates content on mount. Neither schedules sample text.
- `UserMessage` and `Prose`: children plus normal container props; Prose also takes a CSS `measure` (default 36em).
- `WorkingMark`: default 40-frame loop, active and an optional fallback; visibility/page changes pause playback and unmount cancels it. This is not the four-activity entry/exit state machine (still pending).
- `ScrollFollower`: children, label, returnLabel, active, busy, height, followContent and resetKey. Set followContent false for an initial static introduction; change resetKey to return to the top and restore following. The host appends content. Upward input pauses following; scrolling back to the bottom or pressing Return restores it.
- `CodeBlock`: exact code string, optional language and translated copyLabel/copiedLabel/copyFailedLabel. Clipboard failure is announced; stale writes and timers cannot cross lifetimes.
- `ExpandableTable`: columns/rows with stable keys, translated label/expandLabel/closeLabel, optional minWidth and active. Native dialog semantics retain focus return and scoped theme inheritance. Set active false when a chapter hides it. Cells should be presentational content; expansion renders a second table, not a synchronized editor.
- `Icon`: a typed static glyph name and authored size; the host supplies accessible text. `IconButton` accepts native button props/ref and should have a label.
- `useClipboard` and `useVisible` are available for reusable consumers; sample playback timing stays under `demo/hooks/`.

All migrated components preserve the existing demo's motion timings. Controls inherit optional `--cui-motion-scale` for demonstration; production use defaults to 1. Reduced-motion variants remain a later, explicit enhancement, matching the original coverage boundary.
