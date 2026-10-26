<h1 align="center">Claude UI Skills</h1>

<p align="center">用于实现 Claude 风格 UI 和动效的 Agent Skill，附可直接导入的 React + Tailwind CSS 组件与交互演示。</p>

<p align="center">
  <a href="#演示">演示</a> &nbsp;
  <a href="#react-组件">React 组件</a> &nbsp;
  <a href="references/components.md">组件指南</a> &nbsp;
  <a href="README.md">English</a>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/demo-preview-zh-dark.jpg">
    <img src="docs/assets/demo-preview-zh.jpg" width="960" alt="React 演示：开关、复选框、分档滑块和分段控件，以及全部 13 个章节的导航">
  </picture>
</p>

## React 组件

源码和 demo 均采用 **TSX + React 19 + Tailwind CSS 4**。全部 13 个 demo 章节从 [`src/index.ts`](src/index.ts) 导入同一套公开组件；示例数据、翻译和重播控制留在 `demo/` 中。

将完整的 `src/` 目录复制到已配置 Tailwind CSS 4 的 React + TypeScript 项目，保留内部路径和资源。在应用中导入一次组件样式：

```tsx
import { Switch } from './src';
import './src/styles/index.css';

export function Example() {
  return (
    <div data-cui-theme="light">
      <Switch aria-label="通知" defaultChecked />
    </div>
  );
}
```

组件提供类型化 props 和局部深浅主题，无需 demo 代码、后端或应用全局变量。样式入口不包含 Preflight，不会重置宿主页面；内置文字字体按需导入。

本仓库提供可导入的源码，尚未发布为 npm 包。Tailwind 配置、资源处理、自定义字体及 API 请见[接入说明](demo/README.md#import-the-source)，各场景用法见[组件指南](references/components.md)。[迁移记录](docs/react-migration.md)说明了实现和兼容性验证。

## 安装为 Agent Skill

将完整仓库克隆到尚不存在的 Codex Skill 目录，指南直接引用其中的 TSX 和 CSS。

```sh
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
git clone https://github.com/wcqqq1214/claude-ui-skills.git \
  "${CODEX_HOME:-$HOME/.codex}/skills/claude-ui-skills"
```

然后向 Agent 提问：

```text
用 $claude-ui-skills 改进这个页面的侧栏与分段控件。
```

Skill 覆盖 UI、前端交互、排版与动效，详见[范围与覆盖](docs/coverage.md)。

## 演示

包含 13 个交互章节：文字与排版、基础控件、输入框与附件、加载与折叠、文件面板、图片预览、提示与反馈、阅读与表格、缩放与图库、菜单与搜索、侧栏模式、卡片与拖放、通知。分段控件合并展示在基础控件中。支持简体中文、English 和深浅主题。

实现说明默认收起，可按需展开。乌龟按钮默认以 0.2× 播放开关、复选框和滑块的动效，点击可恢复原速。主题可选择浅色、深色或跟随系统。

使用 Node.js 22.12+（或 20.x 系列的 20.19+），在仓库根目录执行：

```sh
npm ci
npm run dev
```

打开 Vite 输出的地址。通过 `?lang=zh-Hans` 或 `?lang=en` 指定语言，通过 `#controls` 打开上图的基础控件章节。截图来自当前 React demo，视口为 1280 × 720。

```sh
npm run build      # 类型检查并构建静态站点到 dist/
npm run preview    # 本地预览生产构建
```

生产构建包含本地资源，无需后端或安装 Claude。静态托管时使用 `dist/`，源码 HTML 需要通过 Vite 运行。GitHub Pages 部署需设置 `PAGES_ENABLED=true`，然后手动触发工作流。入口和部署细节见[演示文档](demo/README.md#run)。

## 验证

```sh
npm test
```

依次执行单元测试、类型检查、生产构建和浏览器回归测试，覆盖独立导入、SSR hydration、StrictMode 与 Activity 保留 DOM 重连等场景。浏览器测试需要 Chrome/Chromium；安装位置不在默认目录时可设置 `CHROME_BIN`。详见[测试覆盖](tests/README.md)。

## 许可证

项目原创代码与文档采用 [MIT](LICENSE)。第三方字体、图标和 Logo 保留各自权利。

非官方项目，与 Anthropic 无关联。
