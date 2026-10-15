// English-authored demo copy with Chinese translations. No network requests or automatic translation.
'use strict';
const DemoI18n = (() => {
  const chinese = {
  "Command palette": "命令面板",
  "Demo action: {0}": "模拟操作：{0}",
  "Unpin": "取消置顶",
  "Pin": "置顶",
  "Copy link": "复制链接",
  "Open": "打开",
  "Open / return": "展开 / 返回",
  "Click ⋯ to expand · Esc to return": "点击 ⋯ 展开 · Esc 返回",
  "Artifact · Today": "作品 · 今天",
  "Landscape illustration": "风景插画",
  "Artifact actions": "作品操作菜单",
  "Select a result to highlight it here": "选择结果，在这里查看定位高亮",
  "highlight": "高亮",
  "Get notified when a response is ready.": "回答完成时收到提醒。",
  "Choose the interface language.": "选择界面语言。",
  "Choose a light or dark interface.": "选择浅色或深色界面。",
  "Notifications": "通知",
  "Appearance": "外观",
  "Arrows preview · Enter selects · Esc returns": "方向键预览 · Enter 选择 · Esc 返回",
  "Search & highlight": "搜索定位",
  "Menu selection": "菜单选择",
  "Grapheme reveal": "逐字浮现",
  "Replay grapheme reveal": "重播逐字浮现",
  "Body fade": "正文淡入",
  "Replay body fade": "重播正文淡入",
  "Working dots": "三点加载",
  "Preview loading feedback": "预览加载反馈",
  "Scroll following": "滚动跟随",
  "Replay scroll following": "重播滚动跟随",
  "blur": "模糊",
  "stagger": "错开间隔",
  "radius": "圆角",
  "maximum width": "最大宽度",
  "loop": "循环",
  "Hover or focus for the arrow": "悬停或聚焦显示箭头",
  "Scroll up to pause \u00b7 Return to follow": "上翻暂停跟随 · 回到底部恢复",
  "Icon baseline comparison": "图标基线对照",
  "Default baseline": "默认基线",
  "Offset −0.125em": "偏移 −0.125em",
  "File details": "文件详情",
  "Reading examples": "阅读示例",
  "Code & copy feedback": "代码与复制反馈",
  "Scroll edge shadows": "滚动边缘阴影",
  "Scroll horizontally · 3rem masks / 1.5rem shadows · CSS local / scroll": "横向滚动观察 · 3rem 遮罩 / 1.5rem 阴影 · CSS local / scroll",
  "Expand · 200ms · scale 0.98 → 1": "展开 · 200ms · scale 0.98 → 1",
  "text-wrap: balance for headings · pretty for paragraphs": "text-wrap：标题 balance · 正文 pretty",
  "Inline code · 0.5px border · 0.9em type · 0.4em radius": "行内代码 · 0.5px 边线 · 0.9em 字号 · 0.4em 圆角",
  "Align icons with text": "让图标与文字对齐",
  "vertical-align: −0.125em · 16px icon → 2px down": "vertical-align: −0.125em · 16px 图标下移 2px",
  "tabular-nums · Simulated counter · Edge markers show width": "tabular-nums · 模拟计数 · 两侧标线显示字宽",
  "Variable weight · Light 500 / 600 → Dark 460 / 560": "可变字重 · 浅色 500 / 600 → 深色 460 / 560",
  "Hover or focus to copy · Check on success · Reset after 2000ms": "悬停或聚焦显示复制 · 成功后打勾 · 2000ms 后复原",
  "Typography details": "排版细节",
  "Code & tables": "代码与表格",
  "A few quiet details make a page easier to read. Leave room between ideas, and let each sentence find its own rhythm.": "一些细微的安排，让阅读变得轻松。在想法之间留下空隙，让每一句话都有自己的节奏。",
  "Demo width cap · 36em / 540px": "演示宽度上限 · 36em / 540px",
  "Demo width cap · {0}em / {1}px": "演示宽度上限 · {0}em / {1}px",
  "Resize to see wrapping": "缩窄观察换行",
  "{0} em · Maximum {1} px": "{0} em · 最大 {1} px",
  "Digits change, width stays steady": "数字变化，字宽保持稳定",
  "Proportional digits": "比例数字",
  "Tabular digits": "等宽数字",
  "Font weight comparison": "字重对照",
  "Lighter weights in dark mode": "深色模式下，字重适当减轻",
  "Fixed weights": "固定字重",
  "Theme weights": "主题字重",
  "Thoughtful interface details": "细致的界面设计",
  "Clear hierarchy": "清晰的层次",
  "Mock attachments": "模拟附件",
  "Add mock attachment": "添加模拟附件",
  "Add attachment": "添加附件",
  "Commands": "命令",
  "Remove {0}": "移除 {0}",
  "User message": "用户消息",
  "Streaming text example": "流式文字示例",
  "Scroll to bottom": "回到底部",
  "As content unfolds, your reading position should stay predictable. At the bottom, new paragraphs naturally enter view.": "内容逐渐展开，阅读的位置不必被打断。停留在底部时，新段落自然进入视野。",
  "Scroll up to revisit an earlier sentence. New text keeps arriving without pulling you away from what you are reading.": "向上翻阅，可以回看前面的句子。后面的文字仍会继续出现，但不会把你拉回去。",
  "A little space between paragraphs gives each idea a clear boundary and gives your eyes a brief pause.": "每一段都留出一点空间，让不同的想法有清晰的边界，也让眼睛有短暂的停顿。",
  "When you are ready to continue, choose the arrow below. Returning to the bottom lets the view follow new content again.": "准备好继续时，点击下方的箭头。回到底部之后，视图会再次跟随新增的内容。",
  "These fixed paragraphs appear locally to demonstrate how scrolling and reading work together.": "这些文字只在本地逐段显示，用来观察滚动与阅读之间的衔接。",
  "The content ends here. You can still browse freely or replay this example.": "内容到这里结束。你仍然可以自由翻阅，或者重新播放这段文字。",
  "While you read, the interface only needs to offer a clear direction. Earlier content stays in place while new paragraphs arrive without competing for attention.": "阅读过程中，界面只需要提供清楚的方向。旧内容留在原位，新的段落接在后面，不必争夺注意力。",
  "In a narrower space, paragraphs wrap naturally. This scrolling area keeps its own boundary, so the surrounding showcase does not move as the text grows.": "当空间变窄时，段落会自然换行。滚动区域保持自己的边界，外面的展示页面不随文字增长移动。",
  "card transition": "卡片过渡",
  "drop in / out": "拖放进 / 出",
  "COMPONENT INDEX": "组件索引",
  "Typography": "文字呈现",
  "Controls": "基础控件",
  "Segmented control": "分段切换",
  "Input & commands": "输入与命令",
  "Waiting & disclosure": "等待与折叠",
  "File panel": "文件面板",
  "Image preview": "图片预览",
  "Hints & feedback": "提示与反馈",
  "Reading & tables": "阅读与表格",
  "Gallery & zoom": "缩放与图库",
  "Menus & search": "菜单与搜索",
  "Sidebar modes": "侧栏模式",
  "Cards & drop targets": "卡片与拖放",
  "Notifications": "通知",
  "Start with an idea, then watch each letter come into focus, one after another.": "从一个想法开始，看文字一个接一个地出现，从模糊变得清晰，让每一句话都自然展开。",
  "Space makes content easier to read. Headings appear gently; body text stays steady. Motion simply signals new content.": "留白让内容更容易阅读。标题轻轻显现，正文保持稳定；动效只负责提示新内容的到来。",
  "A quieter interface brings content into focus.": "界面越安静，内容越清晰。",
  "body fade": "正文淡入",
  "Switch": "开关",
  "Checkbox": "复选框",
  "Slow motion": "慢速播放",
  "The thumb slides sideways with a gentle rebound.": "滑钮平移，末尾轻微回弹。",
  "120ms · 16px travel · CSS transform": "120ms · 16px 位移 · CSS transform",
  "The check reveals gradually and retracts faster.": "勾线逐步显现，取消时更快收回。",
  "200ms in · 120ms out · SVG clip-path": "200ms 显现 · 120ms 收回 · SVG clip-path",
  "Discrete slider": "分档滑块",
  "The fill follows the thumb, which grows while pressed.": "填色跟随滑块移动，按住时轻微放大。",
  "120ms · 1.12× press scale · 4 stops": "120ms · 1.12× 按压缩放 · 4 档",
  "Slow · 0.2×": "慢速 · 0.2×",
  "Thinking effort": "思考深度",
  "Effort": "思考强度",
  "Level 3 of 4": "第 3 档，共 4 档",
  "Level {0} of {1}": "第 {0} 档，共 {1} 档",
  "High": "深入",
  "Low": "轻量",
  "Medium": "均衡",
  "Recommended": "推荐",
  "Max": "充分",
  "Example view": "示例视图",
  "Preview": "预览",
  "View code": "查看代码",
  "Details": "详细说明",
  "position & width": "位置与宽度",
  "move & select": "切换并选择",
  "Command suggestions": "命令建议",
  "Where would you like to start?": "你想从哪里开始？",
  "Demo input": "演示输入框",
  "Open command suggestions": "打开命令建议",
  "Type / for suggestions": "输入 / 查看建议",
  "Send demo content": "发送演示内容",
  "Status animation": "状态动画",
  "Thinking": "思考",
  "Reading": "阅读",
  "Writing": "书写",
  "Coding": "代码",
  "Reading content": "正在阅读内容",
  "Writing content": "正在书写内容",
  "Working with code": "正在处理代码",
  "Finish": "完成",
  "Replay": "重播",
  "Organizing content": "正在整理内容",
  "A clear set of design notes": "一份清晰的设计笔记",
  "Reading rhythm, state changes and spatial continuity": "阅读节奏、状态变化与空间连续性",
  "dot cycle": "圆点循环",
  "skeleton delay": "骨架等待",
  "3 design observations collected": "已整理 3 项设计观察",
  "Expand to see the process": "展开查看过程",
  "Observe the interface": "观察界面",
  "First, establish what the user sees.": "先确认用户看到了什么。",
  "Check the implementation": "核对实现",
  "Connect parameters to specific components.": "把参数与具体组件联系起来。",
  "Record the limits": "记录边界",
  "Separate observations from static parameters.": "将实测结果和静态参数分开。",
  "expand; collapse adapted locally": "展开；收起为本地适配",
  "Design notes": "设计笔记",
  "Expand file panel": "展开文件面板",
  "Resize file list": "调整文件列表宽度",
  "Resize, switch, restore": "拖动、切换与还原",
  "Files": "文件",
  "Drag the divider →": "拖动分隔线 →",
  "Arrows: 8px · Shift: 32px · Enter: reset": "方向键：8px · Shift：32px · Enter：还原",
  "Filename yields; view controls stay visible": "文件名让位，视图切换保持可用",
  "Restore keeps the chosen width": "还原时保留选定宽度",
  "Code": "代码",
  "# Space follows the content\n\nAs the panel narrows, filenames shorten while view controls stay visible.\n\n- Switch files without leaving Preview or Code\n- Expand the preview, then restore the chosen width": "# 空间随内容调整\n\n面板缩窄时，文件名缩短，而视图切换保持可用。\n\n- 切换文件，保留预览或代码视图\n- 展开预览，再还原选定的分栏宽度",
  "<h3>Space follows the content</h3><p>As the panel narrows, filenames shorten while view controls stay visible.</p><ul><li>Switch files without leaving Preview or Code</li><li>Expand the preview, then restore the chosen width</li></ul>": "<h3>空间随内容调整</h3><p>面板缩窄时，文件名缩短，而视图切换保持可用。</p><ul><li>切换文件，保留预览或代码视图</li><li>展开预览，再还原选定的分栏宽度</li></ul>",
  "<h3>Bounded, flexible columns</h3>": "<h3>有边界的弹性分栏</h3>",
  "Minimum": "最小",
  "Initial": "初始",
  "Maximum": "最大",
  "File view": "文件视图",
  "arrow key step": "方向键步长",
  "switch regions": "区域切换",
  "Enlarge landscape example": "放大山景示例图片",
  "Teal mountains and a clay-colored sun under a beige sky": "米色天空下的蓝绿色山峦与陶土色太阳",
  "in / out": "进入 / 退出",
  "Bézier curve": "贝塞尔曲线",
  "View design notes": "查看设计笔记",
  "Text container width": "文字容器宽度",
  "interface-interaction-guidelines.md": "界面交互与视觉设计参考说明.md",
  "Show the hint only when truncated": "截断时才显示提示",
  "Copy": "复制",
  "Copy to clipboard": "复制到剪贴板",
  "Copied": "已复制",
  "CSS code": "CSS 代码",
  "Show notice": "显示通知",
  "hint transition": "提示过渡",
  "notice without action": "无操作通知",
  "Good reading starts with room for content.": "好的阅读，从容纳内容开始。",
  "Inline references such as": "例如",
  "stay within the paragraph.": "这样的行内引用可以融入段落。",
  "Expand table ↗": "展开表格 ↗",
  "Motion parameters table": "动效参数表格",
  "Context": "场景",
  "Duration": "时长",
  "Curve / mechanism": "曲线 / 机制",
  "Design intent": "设计意图",
  "Grapheme heading": "字素标题",
  "Resolve a brief blur into clarity": "短暂模糊后清晰呈现",
  "Mode thumb": "模式滑块",
  "Respond quickly to selection": "快速反馈选择",
  "Image entry": "图片进入",
  "Connect thumbnail and full image": "连接缩略图与大图",
  "Open gallery image 1": "打开图库第 1 张",
  "Green mountains": "青山",
  "Open gallery image 2": "打开图库第 2 张",
  "Dusk": "暮色",
  "Open gallery image 3": "打开图库第 3 张",
  "Sand dunes": "沙丘",
  "change image": "换图",
  "click zoom target": "点击缩放目标",
  "Model settings": "模型设置",
  "Focus preview: High": "聚焦预览：High",
  "Selected: High": "已选：High",
  "Find a setting": "查找设置",
  "Try “appearance” or “notifications”": "输入“外观”或“通知”",
  "Collapse": "收起",
  "submenu → parent → trigger": "子菜单 → 父菜单 → 触发器",
  "card move / expand": "卡片位移 / 展开",
  "Container width": "容器宽度",
  "Show 2 items": "切换为 2 项",
  "Selected Chat · Arrows move focus only": "已选 Chat · 方向键只移动焦点",
  "3 / 2 item folding": "3 / 2 项折叠",
  "Task cards": "任务卡片",
  "Organize design notes": "整理设计笔记",
  "Check motion parameters": "核对动效参数",
  "Inspect interface details": "检查界面细节",
  "Design notes, press Enter to simulate a drop": "设计笔记，按 Enter 模拟放入",
  "▤ design-notes.md": "▤ 设计笔记.md",
  "Drop here to see the target boundary": "放到这里，观察目标边界",
  "Reset drop demo": "重置拖放示例",
  "Notification stack": "通知叠放",
  "Clear notices": "清空通知",
  "Stack three": "叠放三条",
  "No notices. Add a stack to replay.": "暂无通知，点击叠放再次查看。",
  "New notices move to the front; repeated messages merge.": "新通知移到前层，相同消息合并显示。",
  "200ms · −14px / −4% per layer · standard notices dismiss after 6s": "200ms · 每层 −14px / −4% · 普通通知 6s 后消失",
  "Repeat notice": "重复通知",
  "Notice with action": "带操作通知",
  "UI examples · Unofficial": "界面示例 · 非官方",
  "Enlarged image preview": "放大图片预览",
  "Close image preview": "关闭图片预览",
  "Enlarged view of teal mountains and a clay-colored sun under a beige sky": "米色天空下的蓝绿色山峦与陶土色太阳，放大预览",
  "Close notice": "关闭通知",
  "Expanded motion parameters table": "展开动效参数表格",
  "Motion parameters": "动效参数",
  "Close expanded table": "关闭展开表格",
  "Expanded table content": "展开表格内容",
  "Example gallery": "示例图库",
  "Close gallery": "关闭图库",
  "Previous image": "上一张",
  "Next image": "下一张",
  "← → Browse · Enter Zoom · Drag Pan · Esc Close": "← → 换图 · Enter 放大 · 拖动平移 · Esc 关闭",
  "Space makes content ": "留白让内容",
  "easier to read. ": "更容易阅读。",
  "Headings appear gently; ": "标题轻轻显现，",
  "body text stays steady. ": "正文保持稳定；",
  "Motion simply signals ": "动效只负责提示",
  "new content.": "新内容的到来。",
  "<div class=\"segment-preview\"><span class=\"eyebrow\">A SMALL OBSERVATION</span><h3>Leave room for content.</h3><p>Labels of different widths can still flow naturally.<br>Try clicking, or use the left and right arrows.</p></div>": "<div class=\"segment-preview\"><span class=\"eyebrow\">A SMALL OBSERVATION</span><h3>为内容留下空间。</h3><p>不等宽的选项，也可以自然地衔接。<br>试试点击，或者使用左右方向键。</p></div>",
  "<pre><code>duration: 200ms\neasing: cubic-bezier(.32,.72,0,1)\n\ntranslateX(selected position)\nscaleX(old width / new width)</code></pre>": "<pre><code>duration: 200ms\neasing: cubic-bezier(.32,.72,0,1)\n\ntranslateX(所选项位置)\nscaleX(原宽度 / 新宽度)</code></pre>",
  "<ul><li>Measure each option’s actual position and width</li><li>Keep 1px above and below the thumb</li><li>Arrow keys move both focus and selection</li></ul>": "<ul><li>测量每个选项的实际位置与宽度</li><li>滑块上下保留 1px 空间</li><li>方向键同时移动焦点与选中值</li></ul>",
  "Prototype": "原型探索",
  "Use a small example to check layout and interaction directly.": "用一个轻量示例，直观检查布局与交互是否合理。",
  "Design research": "设计研究",
  "Collect observations, evidence and unknowns for a question.": "整理一个问题的观察、依据与尚未确认的部分。",
  "Organize notes": "整理笔记",
  "Give scattered observations an easy-to-read structure.": "把零散的观察放进便于阅读的结构。",
  "Review details": "检查细节",
  "Check spacing, state feedback and keyboard paths.": "逐项核对间距、状态反馈与键盘路径。",
  "No matching suggestions": "没有匹配的建议",
  "Enter to send · Shift Enter for a new line": "Enter 发送 · Shift Enter 换行",
  "Selected “{0}”. Keep typing to continue.": "已选择“{0}”，可以继续输入。",
  "Received on this page: ": "已在本页接收：",
  "Example content is ready": "示例内容已就绪",
  "Source code": "源代码",
  "Restore file panel": "恢复文件面板",
  "✓ Copied": "✓ 已复制",
  "Copy failed": "复制未成功",
  "The browser did not allow copying. You can select the text manually.": "浏览器未允许复制，可手动选择这段文字。",
  "This notice closes after 6 seconds.": "这条通知将在 6 秒后关闭。",
  "Truncated · Hover or focus to read in full": "已截断 · 悬停或聚焦显示全文",
  "Not truncated · No hint needed": "未截断 · 不显示提示",
  "Focus preview: {0} · Selected: {1}": "聚焦预览：{0} · 已选：{1}",
  "Selected: {0}": "已选：{0}",
  "Interface": "界面",
  "Updates": "更新",
  "No matching settings": "没有匹配的设置",
  "Selected {0} · Arrows move focus only": "已选 {0} · 方向键只移动焦点",
  "Show 3 items": "切换为 3 项",
  "Done: reading rhythm and visual hierarchy organized.": "已完成：整理阅读节奏与视觉层级。",
  "Stopped: this is a local state example.": "已停止：这是一张本地状态示例。",
  "Incomplete: this is a local state example.": "未完成：这是一张本地状态示例。",
  "Added: design-notes.md (local page text only)": "已放入：设计笔记.md（仅本页文字）",
  "Design notes saved (×{0})": "设计笔记已保存（×{0}）",
  "Design notes are ready": "设计笔记已准备好",
  "Design notes saved": "设计笔记已保存",
  "View": "查看",
  "Local notes: reading rhythm, spatial continuity and state feedback.": "本地笔记：阅读节奏、空间连续性与状态反馈。",
  "Dismiss this notice": "关闭此通知",
  "Image {0}, click to zoom": "第 {0} 张图片，点击缩放",
  "Loading content": "内容加载中",
  "Language": "语言",
  "Theme": "主题",
  "System": "跟随系统",
  "Light": "浅色",
  "Dark": "深色",
  "Theme: {0}; switch to {1}": "主题：{0}；点击切换{1}"
};
  const supported = value => value === 'en' || value === 'zh-Hans';
  const requested = new URL(location.href).searchParams.get('lang');
  let saved;
  try { saved = localStorage.getItem('claude-ui-studies.language'); } catch {}
  const preferred = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  let locale = supported(requested) ? requested : supported(saved) ? saved
    : preferred.startsWith('zh') ? 'zh-Hans' : 'en';
  document.documentElement.lang = locale;
  function t(source, ...values) {
    const text = locale === 'zh-Hans' && Object.hasOwn(chinese, source) ? chinese[source] : source;
    return text.replace(/\{(\d+)\}/g, (match, index) => index < values.length ? String(values[index]) : match);
  }

  // Only explicitly registered, authored copy is updated. Values entered by the
  // visitor are never inspected or translated. Weak metadata also supports clones.
  const bindings = new WeakMap();
  const active = new Set();
  const listeners = new Set();
  function apply(node, channel, render) {
    const value = render();
    if (channel.startsWith('@')) {
      const name = channel.slice(1);
      if (node.getAttribute(name) !== value) node.setAttribute(name, value);
    } else if (node[channel] !== value) node[channel] = value;
  }
  function bind(node, channel, render) {
    if (!bindings.has(node)) bindings.set(node, new Map());
    bindings.get(node).set(channel, render);
    active.add(node);
    apply(node, channel, render);
  }
  const text = (node, render) => bind(node, 'textContent', render);
  // HTML renderers accept authored templates only, never interpolated user input.
  const html = (node, render) => bind(node, 'innerHTML', render);
  const attr = (node, name, render) => bind(node, '@' + name, render);
  function visit(node, callback) {
    callback(node);
    for (const child of node.childNodes) visit(child, callback);
  }
  function clone(source) {
    const copy = source.cloneNode(true);
    function copyBindings(from, to) {
      for (const [channel, render] of bindings.get(from) || []) bind(to, channel, render);
      [...from.childNodes].forEach((child, index) => copyBindings(child, to.childNodes[index]));
    }
    copyBindings(source, copy);
    return copy;
  }
  function translateDocument() {
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('script, style, code, [translate="no"]')) continue;
      const original = node.data, source = original.trim();
      if (Object.hasOwn(chinese, source)) bind(node, 'data', () => original.replace(source, () => t(source)));
    }
    for (const element of document.querySelectorAll('[title], [aria-label], [aria-valuetext], [placeholder], [alt]')) {
      if (element.closest('[translate="no"]')) continue;
      for (const name of ['title', 'aria-label', 'aria-valuetext', 'placeholder', 'alt']) {
        const source = element.getAttribute(name);
        if (source !== null && Object.hasOwn(chinese, source)) attr(element, name, () => t(source));
      }
    }
    // Lifecycle cleanup only: removed nodes stop updating; reattached registered
    // nodes resume. This observer does not discover or translate arbitrary text.
    new MutationObserver(records => {
      for (const record of records) {
        for (const removed of record.removedNodes) visit(removed, node => {
          if (!node.isConnected) active.delete(node);
        });
        for (const added of record.addedNodes) visit(added, node => {
          if (!node.isConnected || !bindings.has(node)) return;
          active.add(node);
          for (const [channel, render] of bindings.get(node)) apply(node, channel, render);
        });
      }
    }).observe(document.documentElement, {childList: true, subtree: true});
    window.addEventListener('popstate', () => {
      const requested = new URL(location.href).searchParams.get('lang');
      if (supported(requested)) select(requested);
    });
  }
  let scrollRevision = 0, savedAnchor;
  function select(next) {
    if (!supported(next)) return;
    try { localStorage.setItem('claude-ui-studies.language', next); } catch {}
    if (next === locale) return;
    const positions = [...document.querySelectorAll('*')]
      .filter(node => node.scrollTop || node.scrollLeft)
      .map(node => [node, node.scrollLeft, node.scrollTop]);
    const root = document.documentElement;
    if (savedAnchor === undefined) savedAnchor = root.style.overflowAnchor;
    const revision = ++scrollRevision;
    root.style.overflowAnchor = 'none';
    locale = next;
    document.documentElement.lang = locale;
    for (const node of active) {
      if (!node.isConnected) { active.delete(node); continue; }
      for (const [channel, render] of bindings.get(node)) apply(node, channel, render);
    }
    for (const listener of listeners) listener();
    // Replace the URL without navigation or history entries. file:// previews
    // may deny history changes; translation and remembered choice still work.
    const url = new URL(location.href);
    url.searchParams.set('lang', next);
    try { history.replaceState(history.state, '', url.href); } catch {}
    const restoreScroll = () => {
      for (const [node, left, top] of positions) node.scrollTo({left, top, behavior: 'instant'});
    };
    restoreScroll();
    // Layout observers may resize examples after text updates. Hold anchoring
    // through that frame so the browser does not move the reading position.
    requestAnimationFrame(() => {
      if (revision !== scrollRevision) return;
      restoreScroll();
      requestAnimationFrame(() => {
        if (revision !== scrollRevision) return;
        root.style.overflowAnchor = savedAnchor;
        savedAnchor = undefined;
      });
    });
  }
  const onChange = listener => { listeners.add(listener); return () => listeners.delete(listener); };
  return {get locale() { return locale; }, t, text, html, attr, clone, onChange, select, translateDocument};
})();
