# Existing Tailwind host

This small React 19 + Tailwind CSS 4 app demonstrates controlled state, scoped themes, a local icon and a paused sprite. It uses system text fonts and imports no demo code. The host owns Tailwind's Preflight reset; component theme mappings, scan paths and styles come from one entry.

From this repository's root, choose a new, empty destination outside the repository:

```sh
mkdir ../claude-ui-host-example
cp -R examples/tailwind-host/. ../claude-ui-host-example/
cp -R src ../claude-ui-host-example/ui
cd ../claude-ui-host-example
npm install
npm run dev
```

`ui/` is the complete copied source directory. Keep its internal paths and assets. Run `npm run build` and `npm run preview` for static delivery. This is a source-copy example, not an npm package installation.

In an existing Tailwind application, retain the host's current React entry, Tailwind configuration, state and stylesheet. Add only the `components.css` import after the existing Tailwind import, adjust its path, and import the components you need. Do not additionally import `ui/styles/index.css`, which is the alternative entry for hosts that have not loaded Tailwind theme/utilities. Text fonts remain optional; the icon and sprite shown here use bundled local assets.

The repository's `tailwind-host.browser.cjs` test copies this example and the source into a temporary project, reuses the already-installed dependencies, typechecks and builds it, and checks both themes and controlled interactions in the built page. It does not exercise downloading dependencies from npm.
