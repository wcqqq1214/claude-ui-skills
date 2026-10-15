# Claude UI

14 组 Claude 风格的本地交互示例，指南直接引用运行中的 HTML、JS 和 CSS。无需构建、安装依赖、登录或安装 Claude。

Pages 地址（部署后可用）：[简体中文](https://wcqqq1214.github.io/claude-ui-skills/?lang=zh-Hans) · [English](https://wcqqq1214.github.io/claude-ui-skills/?lang=en)

<a id="local-preview"></a>

## 本地运行

直接打开 [index.html](index.html)，或从仓库根目录执行：

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

访问 [Claude UI](http://127.0.0.1:8766/showcase/)。资源均在本地，无后台接口；复制功能需要浏览器许可。

## 使用

- 地球按钮切换简体中文 / English；首次跟随浏览器语言，之后记住手动选择。可用 `?lang=zh-Hans` 或 `?lang=en` 指定预览语言。
- 主题按钮按“跟随系统 → 浅色 → 深色”循环，并保存偏好。
- HTML 与组件 JS 使用英文原文，`i18n.js` 提供中文译文；未收录的文案保留英文。切换语言保留输入与交互状态。语言菜单支持方向键、Home/End、Enter/Space 和 Escape。
- 页面仅保留组件、操作和少量参数；各章指南直接链接到运行中的前端代码。

## 复现边界

布局、示例数据、装饰图及语言/主题入口是本地设计；示例行为与本地适配见[组件指南](../references/components.md)。

[组件指南](../references/components.md)

## Pages 部署准备

[部署配置](../.github/workflows/pages.yml)仅接受手动运行，且只允许 `main` 分支在仓库变量 `PAGES_ENABLED` 为 `true` 时执行。推送不会触发部署。

以后启用时：

1. 将仓库 Settings → Pages → Source 设为 **GitHub Actions**，确认站点访问范围。
2. 在 Settings → Secrets and variables → Actions → Variables 设置 `PAGES_ENABLED=true`。
3. 在 Actions 中手动运行 **Deploy demo to Pages**，选择 `main`。
4. 确认站点可用后，将 GitHub About 的 Website 设置为 `https://wcqqq1214.github.io/claude-ui-skills/`。

工作流只将 `showcase/` 中的 HTML、CSS、JS、SVG 和 `components/` 下的 CSS、JS、`components/status-assets/*.webp` 及 `fonts/*.woff2` 打包至站点根目录；仓库文档、Skill 和 manifest 不进入站点。组件指南与本地预览继续使用仓库内相对路径。站点可用性与访问范围取决于 GitHub 套餐及 Pages 设置。
