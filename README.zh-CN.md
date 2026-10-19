<h1 align="center">Claude UI Skills</h1>

<p align="center">通过场景指南与可运行的前端示例，实现 Claude 风格 UI 和动效的 Agent Skill。</p>

<p align="center">
  <a href="#演示">演示</a> ·
  <a href="references/components.md">组件指南</a> ·
  <a href="README.md">English</a>
</p>

<p align="center">
  <img src="docs/assets/demo-preview.jpg" width="960" alt="Claude UI 演示">
</p>

## React 迁移

React + TSX + Tailwind 实现已开始迁移，首批包含开关、复选框、分级滑块和分段控件，新 demo 直接导入这些组件。[运行与导入](demo/README.md) · [迁移进度](docs/react-migration.md)。其余章节暂时保留原版 showcase。

## 安装

将完整仓库克隆到尚不存在的 Codex Skill 目录，指南直接引用其中的 HTML、JS 和 CSS：

```sh
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
git clone https://github.com/wcqqq1214/claude-ui-skills.git \
  "${CODEX_HOME:-$HOME/.codex}/skills/claude-ui-skills"
```

## 使用

```text
用 $claude-ui-skills 改进这个页面的侧栏与分段控件。
```

仅覆盖 UI、前端交互、排版与动效。[范围与覆盖](docs/coverage.md)。

## 演示

包含 13 组交互示例，涵盖分段控件、面板、搜索定位高亮和四种状态动画。支持简体中文、English 和深浅主题。

离线使用请见[本地预览说明](showcase/README.md#local-preview)，无需构建或安装 Claude。

## 许可证

项目原创代码与文档采用 [MIT](LICENSE)。第三方字体、图标和 Logo 保留各自权利。

非官方项目，与 Anthropic 无关联。
