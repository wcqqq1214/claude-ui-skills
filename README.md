<h1 align="center">Claude UI Skills</h1>

<p align="center">An agent skill for Claude-inspired UI and motion, with reusable React + Tailwind CSS components and an interactive demo.</p>

<p align="center">
  <a href="https://wcqqq1214.github.io/claude-ui-skills/">Live demo</a> &nbsp;
  <a href="#react-components">React components</a> &nbsp;
  <a href="references/components.md">Component guides</a> &nbsp;
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/demo-preview-dark.jpg">
    <img src="docs/assets/demo-preview.jpg" width="960" alt="React demo: switch, checkbox, discrete slider and segmented controls, with navigation to all 13 chapters">
  </picture>
</p>

## React components

The source and demo use **TSX + React 19 + Tailwind CSS 4**. All 13 demo chapters import the same public components from [`src/index.ts`](src/index.ts); sample data, translations and replay controls stay in `demo/`.

Copy the complete `src/` directory into a React 19 + TypeScript project with matching React DOM and Tailwind CSS 4 configured, preserving its internal paths and assets. Use React 19 type definitions in TypeScript projects. Import the component stylesheet once:

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

Components have typed props and scoped light/dark themes, and work without demo code, a backend or application globals. The stylesheet does not include Preflight or reset the host page; bundled text fonts are optional. If your application already imports Tailwind, use `src/styles/components.css` instead of `src/styles/index.css`; see the [existing-host example](examples/tailwind-host/README.md).

This repository provides source to import, not a published npm package. See [integration and API details](demo/README.md#import-the-source) for Tailwind setup, assets and custom fonts, the [component guides](references/components.md) for usage, and the [migration record](docs/react-migration.md) for implementation and compatibility checks.

## Install as an agent skill

Clone the complete repository into an unused skill directory for your agent (Codex or Claude Code). Keep `SKILL.md` at the skill folder's root and retain the supporting directories: the guides link directly to bundled source, styles, assets and documentation. Reading and using the skill's guidance does not require `npm ci`; dependencies are needed to run the demo, build or tests.

```sh
# Codex
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
git clone https://github.com/wcqqq1214/claude-ui-skills.git \
  "${CODEX_HOME:-$HOME/.codex}/skills/claude-ui-skills"

# Claude Code
mkdir -p ~/.claude/skills
git clone https://github.com/wcqqq1214/claude-ui-skills.git \
  ~/.claude/skills/claude-ui-skills
```

In your next turn, invoke the installed skill explicitly (in Codex; in Claude Code, ask it to use the `claude-ui-skills` skill):

```text
Use $claude-ui-skills to adapt this page's sidebar and segmented controls.
```

The skill covers UI, frontend interactions, typography and motion; see [scope and coverage](docs/coverage.md).

## Demo

Explore 13 interactive chapters, from typography and controls to galleries, menus, sidebars and notifications, in English or Simplified Chinese with light/dark themes. To run it locally with Node.js 22.12+ (or 20.19+ on the 20.x line):

```sh
npm ci
npm run dev
```

The live demo is deployed manually by the Pages workflow; in a fork, set `PAGES_ENABLED=true`, choose GitHub Actions under Settings → Pages, then run the workflow. See the [demo documentation](demo/README.md#run) for entry points, URL parameters and deployment details.

## Validation

```sh
npm test
```

Runs unit checks, typechecking, a production build and browser regression suites. Browser checks need Chrome/Chromium; set `CHROME_BIN` if it is outside the usual locations. See [test coverage](tests/README.md).

## License

Project-authored code and documentation: [MIT](LICENSE). Third-party fonts, icons and logos retain their respective rights.

Unofficial; not affiliated with Anthropic.
