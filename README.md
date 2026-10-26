<h1 align="center">Claude UI Skills</h1>

<p align="center">An agent skill for Claude-inspired UI and motion, with reusable React + Tailwind CSS components and an interactive demo.</p>

<p align="center">
  <a href="#demo">Demo</a> ·
  <a href="#react-components">React components</a> ·
  <a href="references/components.md">Component guides</a> ·
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/demo-preview-dark.jpg">
    <img src="docs/assets/demo-preview.jpg" width="960" alt="React demo: switch, checkbox and discrete slider, with navigation to all 14 chapters">
  </picture>
</p>

## React components

The source and demo use **TSX + React 19 + Tailwind CSS 4**. All 14 demo chapters import the same public components from [`src/index.ts`](src/index.ts); sample data, translations and replay controls stay in `demo/`.

Copy the complete `src/` directory into a React + TypeScript project with Tailwind CSS 4 configured, preserving its internal paths and assets. Import the component stylesheet once:

```tsx
import { Switch } from './src';
import './src/styles/index.css';

export function Example() {
  return (
    <div data-cui-theme="light">
      <Switch aria-label="Notifications" defaultChecked />
    </div>
  );
}
```

Components have typed props and scoped light/dark themes. They work without demo code, a backend or application globals. The stylesheet does not include Preflight or reset the host page; bundled text fonts are optional.

This repository provides source to import, not a published npm package. See [integration and API details](demo/README.md#import-the-source) for Tailwind setup, asset handling and custom fonts, or browse the [component guides](references/components.md). The [migration record](docs/react-migration.md) describes the implementation and compatibility checks.

## Install as an agent skill

Clone the complete repository into an unused Codex skill directory. The guides reference its bundled TSX and CSS.

```sh
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
git clone https://github.com/wcqqq1214/claude-ui-skills.git \
  "${CODEX_HOME:-$HOME/.codex}/skills/claude-ui-skills"
```

Then ask your agent:

```text
Use $claude-ui-skills to adapt this page's sidebar and segmented controls.
```

The skill covers UI, frontend interactions, typography and motion. See [scope and coverage](docs/coverage.md).

## Demo

Explore 14 interactive chapters: typography, controls, input and attachments, waiting and disclosure, file panels, image previews, hints, reading and tables, galleries, menus and search, sidebar modes, cards and drop targets, notifications, and segmented controls. Supports English, Simplified Chinese and light/dark themes.

With Node.js 22.12+ (or 20.19+ on the 20.x line), run from the repository root:

```sh
npm ci
npm run dev
```

Open the address printed by Vite. Use `?lang=en` or `?lang=zh-Hans` to select a language, and `#controls` to open the chapter shown above. The screenshot captures the current React demo at 1280 × 720.

```sh
npm run build      # Typecheck and build the static site into dist/
npm run preview    # Preview the production build locally
```

The production build includes local assets and requires no backend or Claude installation. Serve `dist/` for static hosting; source HTML needs Vite. GitHub Pages deployment is manual and requires `PAGES_ENABLED=true`. See [demo documentation](demo/README.md#run) for entry points and deployment details.

## Validation

```sh
npm test
```

Runs unit checks, typechecking, a production build and browser regression suites, including independent imports, SSR hydration, StrictMode and retained-DOM Activity reconnection. Browser checks need Chrome/Chromium; set `CHROME_BIN` if it is outside the usual locations. See [test coverage](tests/README.md).

## License

Project-authored code and documentation: [MIT](LICENSE). Third-party fonts, icons and logos retain their respective rights.

Unofficial; not affiliated with Anthropic.
