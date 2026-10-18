# Claude UI

13 groups of local, interactive Claude-inspired examples. The guides link directly to the running HTML, JS and CSS. No build, dependency installation, sign-in or Claude installation is required.

Pages URLs (after deployment): [English](https://wcqqq1214.github.io/claude-ui-skills/?lang=en) · [Simplified Chinese](https://wcqqq1214.github.io/claude-ui-skills/?lang=zh-Hans)

<a id="local-preview"></a>

## Run locally

Open [index.html](index.html) directly, or run this command from the repository root:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Visit [Claude UI](http://127.0.0.1:8766/showcase/). All assets are local, with no backend endpoints; clipboard copying requires browser permission.

## Usage

- The globe button switches between English and Simplified Chinese. The first visit follows the browser language; subsequent visits remember the manual selection. Use `?lang=en` or `?lang=zh-Hans` to specify the preview language.
- The theme button cycles through system, light and dark, and saves the preference.
- HTML and component JS contain the English source text; `i18n.js` supplies Chinese translations. Unmapped text stays in English. Language switching preserves input and interaction state. The language menu supports arrow keys, Home/End, Enter/Space and Escape.
- The page shows one chapter at a time: components, controls and a few parameters. Each chapter has its own hash (for example `#reading`), so links, reload and back/forward keep the chapter; narrow screens choose chapters from the bar at the top. Desktop cards expand with their content instead of adding a second vertical scroll area; longer chapters scroll with the page. Component-owned viewports, such as streaming text, code and tables, retain their local scrolling. Each chapter guide links directly to the running frontend code.

## Tests

From the repository root:

```sh
npm install        # playwright-core only; no browser download
npm test           # unit tests, then every browser test in sequence
npm run test:browser -- gallery --jobs=3   # a subset, three files at a time
```

Browser tests drive an installed Chrome. The runner looks in the usual install locations; set `CHROME_BIN` to use another Chrome or Chromium. Headless Chromium cannot switch back from emulated touch to a fine pointer, so `composer-chin` prints a `SKIP` line for that one step there.

## Adaptation boundaries

The layout, sample data, decorative artwork and language/theme controls are local designs. See [scope and coverage](../docs/coverage.md) for adaptations and verification limits.

[Component guides](../references/components.md)

## Pages deployment preparation

The [deployment workflow](../.github/workflows/pages.yml) runs only when manually dispatched on `main` with the repository variable `PAGES_ENABLED` set to `true`. Pushing does not trigger deployment.

To deploy:

1. Set repository Settings → Pages → Source to **GitHub Actions** and confirm the site's visibility.
2. Under Settings → Secrets and variables → Actions → Variables, set `PAGES_ENABLED=true`.
3. In Actions, manually run **Deploy demo to Pages** on `main`.
4. After confirming the site works, set the GitHub About Website to `https://wcqqq1214.github.io/claude-ui-skills/`.

The workflow stages only HTML, CSS, JS and SVG from `showcase/`, CSS and JS from `components/`, `components/status-assets/*.webp`, `components/status-assets/progress-clay.png` and `fonts/*.woff2` at the site root. Repository documentation and the Skill are excluded from the site. Component guides and local preview continue to use relative repository paths. Site availability and visibility depend on the GitHub plan and Pages settings.
