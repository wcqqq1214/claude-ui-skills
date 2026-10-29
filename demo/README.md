# React demo

The demo imports the public TSX components from `src/index.ts`. Its 13 chapters cover controls (including segmented selection), typography, reading, feedback, hints, notifications, composer, menus, workspace, sidebar, image previews, galleries and tasks. Sample data, translations and replay controls belong to the demo. See [the migration record](../docs/react-migration.md).

## Run

Use Node.js 20.19+ (20.x), 22.12+, or a supported newer release, then from the repository root:

```sh
npm ci
npm run dev
```

Open the printed Vite address. `/demo/` is an additional entry to the same application. `?lang=en` and `?lang=zh-Hans` select the language; `#controls`, `#type` and `#reading` select chapters. Theme and language preferences persist locally. Changing chapters, language or theme preserves component state.

The [mobile preview](../docs/assets/demo-preview-mobile.jpg) shows the 320px layout.

Use the original icon button to cycle System → Light → Dark. Its display, sun or moon icon indicates the current preference. The turtle button toggles playback between 0.2× and 1× with a click, Enter or Space. Implementation notes are hidden by default; the chapter-header toggle reveals descriptions and technical parameters without resetting the specimens. Controls start at 0.2× so their motion is easy to inspect; toggle the turtle button to restore normal speed.

Existing theme/language preferences from the pre-migration demo are retained; valid current preferences take precedence. Unsupported language parameters are ignored in favor of a valid saved preference or the browser language. Reselecting the current chapter returns to the top without adding a history entry.

```sh
npm run build       # typecheck and build dist/index.html and dist/demo/index.html
npm run preview     # open the printed address
npm run test:react  # independent consumer and demo browser checks
npm test           # unit checks, fresh production build and all browser checks
```

The production build includes local JS, CSS and the optional bundled Sans/Serif/Mono fonts, the icon font and the default and activity sprite sheets. It does not use runtime CDNs. The [Pages workflow](../.github/workflows/pages.yml) installs dependencies, builds this demo and publishes `dist/`. It remains manual-only, gated on `main` and `PAGES_ENABLED=true`. Relative asset URLs support both the site root and a repository subpath. Source HTML needs Vite; serve the built `dist/` directory for standalone static use.

## Import the source

For an existing React 19 + TypeScript project, copy the complete `src/` directory to a component folder, retaining its internal structure and assets. Use matching React 19/React DOM versions and React 19 type definitions; components accept `ref` as a prop. Configure Tailwind CSS 4 in the host build (this demo uses `@tailwindcss/vite`). The host bundler must support CSS imports, relative CSS assets and static `new URL(path, import.meta.url)` assets. Sprite URLs use this standard ESM form and do not require `vite/client` type declarations. Import the stylesheet once. Paths below assume a consuming file at this repository's root:

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

Choose one stylesheet entry:

- If the host has not loaded Tailwind theme/utilities, import `src/styles/index.css` as above. It includes the component styles and Tailwind theme/utilities without Preflight.
- If the host already imports Tailwind, keep that import and add `src/styles/components.css` after it. This entry includes all component styles, `@theme inline` mappings and the component `@source` scan path. Do not also import `index.css`.

```css
/* Existing host stylesheet; adjust the component path to your copied source. */
@import 'tailwindcss';
@import './ui/styles/components.css';
```

The [standalone Tailwind host example](../examples/tailwind-host/README.md) includes a runnable application and copy instructions. It uses controlled state, scoped themes, system text fonts and local icon/sprite assets.

The host owns its page reset and body styles. Keep utility class names literal. Text fonts are optional: import `fonts.css` separately or set `--cui-font-sans`, `--cui-font-serif` and `--cui-font-mono` to host fonts. `icons.css` includes its local glyph font; keep that asset when using `Icon`.

This is source consumption, not a published npm package or a precompiled CSS distribution. [The independent consumer](../tests/fixtures/react-consumer/main.tsx) uses only the source entry and component stylesheet, with no demo assets or scripts.

## Tests and static delivery

`npm test` runs deterministic zoom/search checks, builds the demo and runs all browser suites. Browser checks use an installed Chrome/Chromium; set `CHROME_BIN` if it is outside the usual locations. `npm run test:production` rebuilds and checks the static site at both `/` and a repository subpath, including assets, all chapters, navigation and saved preferences. `npm run test:react` checks the independent source consumers and chapter interactions.

The public source entry requires no backend, routing provider or application globals. See [test commands, coverage and limits](../tests/README.md) for targeted checks.

## Component guides

Each guide owns its component props, interaction rules and examples. Use the chapter hash with either entry point and either language, for example `/demo/?lang=zh-Hans#composer`.

| Chapter | Guide |
| --- | --- |
| `#controls` | [Switch, checkbox and slider](../references/components/controls.md); [segmented control](../references/components/segmented.md) |
| `#type` | [Text reveal, working mark and scroll following](../references/components/type.md) |
| `#reading` | [Prose, code, tables and icons](../references/components/reading.md) |
| `#feedback` | [Activity marks, skeletons and accordion](../references/components/feedback.md) |
| `#micro` | [Tooltips, ghost buttons and copy feedback](../references/components/micro.md) |
| `#recovery` | [Notifications and a feedback example](../references/components/recovery.md) |
| `#composer` | [Editor, attachments and a draft example](../references/components/composer.md) |
| `#menus` | [Menus, search, artifact actions and a selection example](../references/components/menus.md) |
| `#workspace` | [File panels and resizing](../references/components/workspace.md) |
| `#modes` | [Sidebar modes and pinned order](../references/components/modes.md) |
| `#images` | [Image preview](../references/components/images.md) |
| `#gallery` | [Gallery](../references/components/gallery.md) |
| `#tasks` | [Task cards and progress](../references/components/tasks.md) |

The components preserve the documented motion timings. Controls inherit optional `--cui-motion-scale` for demonstration; production use defaults to 1. Reduced-motion variants are not included; retain the target app's existing reduced-motion handling when adapting the examples.
