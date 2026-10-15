// English-authored demo copy with Chinese translations. No network requests or automatic translation.
'use strict';
const DemoI18n = (() => {
  const chinese = {
  "Reading width": "阅读宽度",
  "{0} em · Maximum {1} px": "{0} em · 最大 {1} px",
  "Stable digits · Simulated time": "数字稳定 · 模拟时间",
  "Replay number sample": "重播数字示例",
  "Mock attachments": "模拟附件",
  "Add mock attachment": "添加模拟附件",
  "Remove {0}": "移除 {0}",
  "Growing text · Scroll up to pause": "文字增长 · 上翻暂停跟随",
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
  "Action feedback": "操作反馈",
  "Click the current image to zoom; drag to pan, Ctrl + scroll to zoom.": "点击当前图放大；拖动平移，Ctrl + 滚轮缩放。",
  "Use arrow keys to browse adjacent cards.": "方向键可浏览相邻卡片。",
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
  "Focus & selection": "焦点与选择",
  "Sidebar modes": "侧栏模式",
  "Cards & drop targets": "卡片与拖放",
  "Recovery & notices": "恢复与通知",
  "Replay text motion": "重播文字动效",
  "Start with an idea.": "从一个想法开始。",
  "Space makes content easier to read. Headings appear gently; body text stays steady. Motion simply signals new content.": "留白让内容更容易阅读。标题轻轻显现，正文保持稳定；动效只负责提示新内容的到来。",
  "A quieter interface brings content into focus.": "界面越安静，内容越清晰。",
  "title reveal": "标题渐显",
  "body fade": "正文淡入",
  "Notify when complete": "完成时提醒",
  "Keep a separate space for this exploration": "为这次探索保留独立空间",
  "The checkbox aligns with the first line of its label.": "多行说明跟随文字，方框保持与首行对齐。",
  "This changes only the state of this demo.": "这里只改变展示页里的状态。",
  "Thinking effort": "思考深度",
  "High": "深入",
  "Low": "轻量",
  "Medium": "均衡",
  "Recommended": "推荐",
  "Max": "充分",
  "Leave more room to work through complex questions.": "为复杂问题留出更多推敲空间。",
  "thumb spring": "旋钮回弹",
  "check in / out": "勾线进 / 出",
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
  "open suggestions": "打开建议",
  "close, keep text": "关闭并保留文字",
  "Waiting state": "等待状态",
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
  "Drag the divider to resize": "拖动分隔条调整宽度",
  "Or focus it and use the arrow keys": "聚焦后也可使用方向键",
  "Resize file list": "调整文件列表宽度",
  "File view": "文件视图",
  "arrow key step": "方向键步长",
  "switch regions": "区域切换",
  "Attachment thumbnail · Click to view": "附件缩略图 · 点击查看",
  "SVG · Local example": "SVG · 本地示例",
  "Enlarge landscape example": "放大山景示例图片",
  "Teal mountains and a clay-colored sun under a beige sky": "米色天空下的蓝绿色山峦与陶土色太阳",
  "A little space among the mountains": "山间的一小段留白",
  "Origin geometry → Preview → Return": "来源几何 → 预览 → 回到原位",
  "in / out": "进入 / 退出",
  "Bézier curve": "贝塞尔曲线",
  "Hover, or focus with Tab": "悬停，或按 Tab 聚焦",
  "View design notes": "查看设计笔记",
  "A small hint for an action": "给动作一句轻量的说明",
  "The hint waits 300ms, then fades and scales in.": "提示等待 300ms，再淡入并轻微放大。",
  "Text container width": "文字容器宽度",
  "A set of notes on interface details": "一份关于界面细节的设计笔记",
  "Show the hint only when truncated": "截断时才显示提示",
  "Copy": "复制",
  "Copy to clipboard": "复制到剪贴板",
  "Copied": "已复制",
  "CSS code": "CSS 代码",
  "Show notice": "显示通知",
  "hint transition": "提示过渡",
  "notice without action": "无操作通知",
  "Body size": "正文字号",
  "Small · 14 px": "小 · 14 px",
  "Default · 15 px": "标准 · 15 px",
  "Large · 16 px": "大 · 16 px",
  "Max width 540 px · Line height 24 px": "最大行宽 540 px · 行高 24 px",
  "Good reading starts with room for content.": "好的阅读，从容纳内容开始。",
  "Text needs space and boundaries. Headings balance line lengths; paragraphs wrap naturally. Long identifiers can break when needed, while numbers keep a fixed width.": "文本需要空间，也需要边界。标题平衡行长，段落使用自然换行；较长的标识符可以在必要时断开，数字则保持等宽。",
  "Inline icons align 0.125em below the baseline.": "行内图标向下对齐 0.125em。",
  "Inline references such as": "例如",
  "stay within the paragraph.": "这样的行内引用可以融入段落。",
  "Wide table · Scroll horizontally": "宽表格 · 横向滚动",
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
  "max body width": "正文最大行宽",
  "line height": "行高",
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
  "Selected: High. Demo: arrows browse; Enter/Space or click selects.": "已选：High。本地示例：方向键浏览，Enter/Space 或点击选择。",
  "Find a component": "查找组件",
  "Try “controls” or “reading”": "输入“控件”或“阅读”",
  "Expand quick card ↗": "展开快捷卡片 ↗",
  "Expand from the trigger": "从触发位置展开",
  "Keep the spatial connection as more content appears.": "保留位置联系，逐步展示更多内容。",
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
  "Drag into the box below": "拖动到下面的框内",
  "Drop here to see the target boundary": "放到这里，观察目标边界",
  "Reset drop demo": "重置拖放示例",
  "Retry outcome": "重试结果",
  "Fail again": "再次失败",
  "Success": "成功",
  "Reset": "重置",
  "Add notice": "添加通知",
  "Repeat notice": "重复通知",
  "Notice with action": "带操作通知",
  "Notices stack here": "通知会叠放在这里",
  "rear offset / scale": "后层位移 / 缩放",
  "default duration": "默认停留",
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
  "Quickly check a simple idea.": "快速确认一个简单的想法。",
  "Balance speed and deliberation.": "在速度与推敲之间取一个平衡。",
  "Give closer comparisons more attention.": "把注意力放在更细致的比较上。",
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
  "# Leave room for content\n\nFold a complex process into an expandable layer.\nKeep common actions within reach,\nand reveal details when needed.\n\n- Keep the reading position\n- Make state changes visible\n- Return to the original workspace after closing": "# 为内容留下空间\n\n把复杂过程收进一层可展开的结构。\n让常用操作触手可及，\n让细节在需要时出现。\n\n- 保持阅读位置\n- 让状态变化可以被看见\n- 关闭后回到原来的工作处",
  "<h3>Leave room for content</h3><p>Fold a complex process into an expandable layer. Keep common actions within reach, and reveal details when needed.</p><ul><li>Keep the reading position</li><li>Make state changes visible</li><li>Return to the original workspace after closing</li></ul>": "<h3>为内容留下空间</h3><p>把复杂过程收进一层可展开的结构。让常用操作触手可及，让细节在需要时出现。</p><ul><li>保持阅读位置</li><li>让状态变化可以被看见</li><li>关闭后回到原来的工作处</li></ul>",
  "<h3>Five measures of time</h3>": "<h3>时间的五个刻度</h3>",
  "Source code": "源代码",
  "Restore file panel": "恢复文件面板",
  "✓ Copied": "✓ 已复制",
  "Copy failed": "复制未成功",
  "The browser did not allow copying. You can select the text manually.": "浏览器未允许复制，可手动选择这段文字。",
  "This notice closes after 6 seconds.": "这条通知将在 6 秒后关闭。",
  "Max width {0} px · Line height {1} px": "最大行宽 {0} px · 行高 {1} px",
  "Truncated · Hover or focus to read in full": "已截断 · 悬停或聚焦显示全文",
  "Not truncated · No hint needed": "未截断 · 不显示提示",
  "Focus preview: {0} · Selected: {1}": "聚焦预览：{0} · 已选：{1}",
  "Selected: {0}. Demo: arrows browse; Enter/Space or click selects.": "已选：{0}。本地示例：方向键浏览，Enter/Space 或点击选择。",
  "Visual foundations": "视觉基础",
  "Motion feedback": "动态反馈",
  "No matching components": "没有匹配的组件",
  "Selected {0} · Arrows move focus only": "已选 {0} · 方向键只移动焦点",
  "Show 3 items": "切换为 3 项",
  "Done: reading rhythm and visual hierarchy organized.": "已完成：整理阅读节奏与视觉层级。",
  "Stopped: this is a local state example.": "已停止：这是一张本地状态示例。",
  "Incomplete: this is a local state example.": "未完成：这是一张本地状态示例。",
  "Added: design-notes.md (local page text only)": "已放入：设计笔记.md（仅本页文字）",
  "✓ Content restored. Local example loaded.": "✓ 内容已恢复。本地示例加载完成。",
  "This content cannot be shown right now. Try again.": "暂时无法显示这段内容。可以再试一次。",
  "Retry": "重试",
  "Retrying…": "重试中…",
  "Attempt {0} was unsuccessful. You can try again.": "第 {0} 次尝试仍未成功，可以重试。",
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
