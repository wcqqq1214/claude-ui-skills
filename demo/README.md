# React demo

The migration demo imports the public TSX components from `src/index.ts`. It currently covers controls and segmented selection. The original `showcase/` remains the reference for the remaining chapters; the full migration is tracked in [the migration plan](../docs/react-migration.md).

## Run

Use Node.js 20.19+ (20.x), 22.12+, or a supported newer release, then from the repository root:

```sh
npm ci
npm run dev
```

Open `/demo/` on the printed Vite address. `?lang=en` and `?lang=zh-Hans` select the language; `#controls` and `#segmented` select chapters. Theme and language preferences persist locally. Changing chapters, language or theme preserves component state.

```sh
npm run build       # typecheck and build dist/demo/index.html
npm run preview     # open /demo/ on the printed address
npm run test:react  # independent consumer and demo browser checks
npm test           # original unit and browser checks plus React browser checks
```

The production build includes local JS, CSS and the optional bundled Sans fonts. It does not use runtime CDNs. The existing Pages workflow deploys the original showcase when explicitly enabled.

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

`src/styles/index.css` explicitly scans the adjacent component directory; it imports Tailwind theme/utilities without Preflight. A host already using Tailwind can instead import `tokens.css` and `motion.css`, copy the `@theme inline` mappings, and add `@source` for the copied component directory. Keep utility class names literal. The library does not set body styles or load fonts automatically; `fonts.css` is an optional separate import, or set `--cui-font-sans` to the host font.

This is source consumption, not a published npm package or a precompiled CSS distribution. [The independent consumer](../tests/fixtures/react-consumer/main.tsx) uses only the source entry and component stylesheet, with no demo assets or scripts.

## Current API boundaries

- `Switch`: `checked/defaultChecked/onCheckedChange`, native button props and ref. Name it with `aria-label` or `aria-labelledby`. It is a button-based switch, not a hidden form field.
- `Checkbox`: native input props including `checked/defaultChecked/name/ref`, optional label children, and `onCheckedChange`. Its `className` styles the containing label. Native uncontrolled form reset is retained.
- `DiscreteSlider`: ordered `options` with unique string values, labels and an optional recommended mark; `value/defaultValue/onValueChange`. Native input props/ref target the range; `className/style` target its wrapper. `aria-valuetext` defaults to the current option's label; the native value submitted by a form is its numeric index. At least two options are needed to enable it. Options are not individually disabled.
- `SegmentedControl`: `options` with unique string values, React labels and optional disabled states; `value/defaultValue/onValueChange`, `size`, group label and container props. Arrow keys select immediately; disabled options are skipped. A missing/invalid selection has no indicator until a valid option is selected. Initialization and prop changes do not emit callbacks. It implements a radio group, not tab-panel semantics.

All four preserve the existing demo's motion timings. Controls inherit optional `--cui-motion-scale` for demonstration; production use defaults to 1. Reduced-motion variants remain a later, explicit enhancement, matching the original coverage boundary.
