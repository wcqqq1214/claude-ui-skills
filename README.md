<h1 align="center">Claude UI Skills</h1>

<p align="center">An agent skill for Claude-inspired UI and motion, with scenario guides and runnable frontend examples.</p>

<p align="center">
  <a href="#demo">Demo</a> ·
  <a href="references/components.md">Component guides</a> ·
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <img src="docs/assets/demo-preview.jpg" width="960" alt="Claude UI demo">
</p>

## Install

Clone the complete repository into an unused Codex skill directory. The guides reference its bundled HTML, JS and CSS:

```sh
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
git clone https://github.com/wcqqq1214/claude-ui-skills.git \
  "${CODEX_HOME:-$HOME/.codex}/skills/claude-ui-skills"
```

## Usage

```text
Use $claude-ui-skills to adapt this page's sidebar and segmented controls.
```

UI, frontend interactions, typography and motion only. [Scope and behavior](docs/scope-and-provenance.md) · [Demo](showcase/README.md).

## Demo

Explore 13 interactive example groups, including segmented controls, panels, search highlighting and four status animations. Supports English, Simplified Chinese and light/dark themes.

For offline use, see [local preview instructions](showcase/README.md#local-preview). No build or Claude installation required.

## License

Project-authored code and documentation: [MIT](LICENSE). Third-party fonts, icons and logos retain their respective rights.

Unofficial; not affiliated with Anthropic.
