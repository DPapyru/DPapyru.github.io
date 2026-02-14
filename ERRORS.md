# 常见错误与解决方案

本文档记录项目开发中遇到的常见错误及其解决方案，供未来参考。

## 其他错误模板

### 错误：[错误名称]

**症状**：

**根本原因**：

**解决方案**：

**预防措施**：

---

## 验证记录模板（流程要求）

当执行工作流验证（尤其是 L3）时，按以下格式记录：

```markdown
### 验证记录 [YYYY-MM-DD HH:mm]：[任务名称]

**级别**：L3

**命令与结果**：
- `npm run build`：通过/失败
- `npm run check-generated`：通过/失败/待补跑

**备注**：异常原因、补跑计划、关联工作树
```

---

## 如何添加新错误

当发现新错误时，按以下格式添加到本文档：

```markdown
### 错误 [编号]：[错误名称]

**症状**：简要描述错误的表现

**根本原因**：解释为什么会发生这个错误

**解决方案**：具体的修复步骤

**预防措施**：如何避免再次发生
```

---

### 验证记录 [2026-02-14 09:02]：Article Studio 预览上下对齐修复

**级别**：L3

**命令与结果**：
- `npm run build`：通过
- `npm run check-generated`：失败

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次 UI 修复无直接关系；本次按用户要求在 `main` 工作区直接修改（未使用工作树）。

### 验证记录 [2026-02-14 13:45]：教程字体统一为 JetBrainsMonoNerdFont-Bold

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/tutorial-font.test.js`：通过
- `npm test`：失败
- `npm run build`：通过
- `npm run check-generated`：待补跑

**备注**：`npm test` 失败集中在 `gallery-check` / `gallery-normalize` / `generate-shader-gallery`，根因是沙箱环境无法在 `/mnt/c/Users/Administrator/AppData/Local/Temp` 创建临时目录（`EACCES: permission denied, mkdtemp`）；本次字体变更功能测试已通过，构建链路通过。

### 验证记录 [2026-02-14 14:11]：Swiss Workbench 骨架层与模板套用（Phase 1+2）

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/workbench-shell.test.js`：通过
- `node --test site/tooling/scripts/page-common-alignment.test.js site/tooling/scripts/tutorial-font.test.js site/tooling/scripts/workbench-shell.test.js`：通过
- `npm test`：失败
- `npm run build`：通过
- `npm run check-generated`：待补跑

**备注**：本次严格未修改业务 JS（仅新增测试 `site/tooling/scripts/workbench-shell.test.js`）；`npm test` 失败仍集中在 `gallery-check` / `gallery-normalize` / `generate-shader-gallery` 的既有问题，沙箱环境下临时目录权限受限（`EACCES: permission denied, mkdtemp`）。

### 验证记录 [2026-02-14 14:58]：Workbench 顶部空隙修复（skip-link 归位）

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/workbench-shell.test.js site/tooling/scripts/tutorial-font.test.js site/tooling/scripts/page-common-alignment.test.js`：通过

**备注**：根因是 `site/assets/css/layout.css` 的 `body.workbench-page > *` 覆盖了 `.skip-link` 的 `position: absolute`，导致其占据约 50px 高度并把 header 下推；已改为 `body.workbench-page > :not(.skip-link)`，并通过本地 headless 截图复核顶部无空隙。

### 验证记录 [2026-02-14 18:35]：viewer 顶部导航未固定修复

**级别**：L3

**命令与结果**：
- `npm run build`：通过
- `npm run check-generated`：失败

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`；与本次导航定位修复无直接关系。本次修复为 `body.workbench-page` 场景下显式恢复 `.site-header` 的 `position: sticky`。

### 验证记录 [2026-02-14 18:45]：viewer 左侧树导航图标与引导线优化

**级别**：L3

**命令与结果**：
- `npm run build`：通过
- `npm run check-generated`：失败

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`；与本次树导航样式调整无直接关系。本次仅调整 `site/assets/css/minimal-docs.css` 与 `site/pages/viewer.html` 的目录图标/引导线样式。

### 验证记录 [2026-02-14 18:51]：viewer AI 对话按钮误隐藏修复

**级别**：L3

**命令与结果**：
- `npm run build`：通过
- `npm run check-generated`：失败

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`；与本次 AI 按钮修复无直接关系。本次修复将 `studio_embed` 判断收紧为“参数开启且在 iframe 中”，并在非嵌入模式下显式恢复 `#viewer-ai-root` 可见性。

### 验证记录 [2026-02-14 19:09]：viewer 移除作者模式入口与诊断面板

**级别**：L3

**命令与结果**：
- `rg -n "initializeLearningAuthor|author-mode-toggle|learning-author-diagnostics|learning-hint-author|renderLearningAuthor|collectAuthorDiagnostics|scanRequiredReferenceHeadings|scanDocLinksFromDom|scanImagesFromDom" site/pages/viewer.html`：通过（无输出）
- `git diff --check -- site/pages/viewer.html`：通过

**备注**：按用户要求未执行 `npm` 命令；本次仅清理 `site/pages/viewer.html` 中作者模式相关按钮、提示区、诊断面板及其脚本调用，保留普通阅读与学习提示链路。

### 验证记录 [2026-02-14 19:16]：新增 VS 与 Git 配色预设

**级别**：L3

**命令与结果**：
- `for f in site/pages/anim-renderer.html site/pages/article-studio.html site/pages/folder.html site/pages/shader-contribute.html site/pages/shader-gallery.html site/pages/shader-playground.html site/pages/viewer.html; do ...; done`：通过（7 个页面均为 `vs=1 git=1`）
- `rg -n "vs: true|git: true" site/assets/js/theme-init.js site/assets/js/accent-theme.js`：通过
- `rg -n "\\[data-theme=\\\"dark\\\"\\]\\[data-accent=\\\"vs\\\"\\]|\\[data-theme=\\\"dark\\\"\\]\\[data-accent=\\\"git\\\"\\]" site/assets/css/variables.css`：通过
- `git diff --check -- site/assets/css/variables.css site/assets/js/accent-theme.js site/assets/js/theme-init.js site/pages/anim-renderer.html site/pages/article-studio.html site/pages/folder.html site/pages/shader-contribute.html site/pages/shader-gallery.html site/pages/shader-playground.html site/pages/viewer.html`：通过

**备注**：按用户要求未执行 `npm` 命令；本次仅新增主题预设与下拉选项，不涉及构建链路变更。

### 验证记录 [2026-02-14 19:22]：VS 配色改为紫黑风格

**级别**：L3

**命令与结果**：
- `nl -ba site/assets/css/variables.css | sed -n '395,425p'`：通过（`vs` 预设变量已更新为紫黑配色）
- `git diff --check -- site/assets/css/variables.css`：通过

**备注**：按用户要求未执行 `npm` 命令；本次仅调整 `site/assets/css/variables.css` 中 `data-accent="vs"` 的颜色变量，不影响其它主题预设。

### 验证记录 [2026-02-14 19:27]：搜索按钮图标改为 Mono 字形

**级别**：L3

**命令与结果**：
- `rg -n "icon-search|🔍|\\f002|JetBrainsMonoNerdFontBold" site/assets/css/style.css`：通过（已改为 `\f002` 并指定 Mono 字体）
- `git diff --check -- site/assets/css/style.css`：通过
- `nl -ba site/assets/css/style.css | sed -n '3386,3406p'`：通过

**备注**：按用户要求未执行 `npm` 命令；本次仅修改搜索按钮图标样式，将 emoji 搜索符号替换为 JetBrains Mono Nerd Font 字形。

### 验证记录 [2026-02-14 21:26]：教程页中文/英文字体分离

**级别**：L3

**命令与结果**：
- `node site/tooling/scripts/tutorial-font.test.js`：通过（3 tests, 0 failures）
- `node --test site/tooling/scripts/tutorial-font.test.js`：通过（1 file, 0 failures）

**备注**：按用户要求未执行 `npm` 命令；本次在 `site/assets/fonts` 引入 `HarmonyOS_Sans_SC_Regular.ttf`，并将 `--font-family-tutorial` 调整为 `JetBrainsMonoNerdFontBold`（英文/特殊字符优先）+ `HarmonyOSSansSCRegular`（中文回退）。

### 验证记录 [2026-02-14 21:56]：教程页顶部栏统一为“标题 + 搜索 + 通用跳转”

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/page-common-alignment.test.js`：通过
- `npm run build`：通过
- `npm run check-generated`：失败

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`；与本次顶部栏统一改造无直接关系。本次改造覆盖含站点标题“泰拉瑞亚Mod制作教程”的顶部栏页面，统一为左侧站点标题、中间搜索栏、右侧通用跳转链接。

### 验证记录 [2026-02-14 22:05]：浏览器逐页一致性调试（顶部栏）

**级别**：L3

**命令与结果**：
- `python3 -m http.server 4173 --bind 127.0.0.1`：通过（本地调试服务启动）
- `google-chrome --headless --disable-gpu --no-sandbox --dump-dom` 批量校验 10 页：通过（10/10）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1440,900 --screenshot=...` 批量截图：通过（10/10）

**备注**：截图输出目录为 `/tmp/header-check`；调试期间 `http.server` 出现的 `BrokenPipe/ConnectionReset` 为 headless 浏览器主动断开连接导致，不影响页面加载与顶部栏一致性判断。

### 验证记录 [2026-02-14 22:22]：顶部栏内容完全一致化 + Mono 搜索图标（浏览器复核）

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/page-common-alignment.test.js`：通过
- `npm run build`：通过
- `npm run check-generated`：失败
- `python3 -m http.server 4173 --bind 127.0.0.1`：通过（本地调试服务启动）
- `google-chrome --headless --disable-gpu --no-sandbox --dump-dom` 批量校验 10 页：通过（10/10，全页头部哈希一致）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1440,900 --screenshot=...` 批量截图：通过（10/10）

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`；与本次顶部栏一致化无直接关系。本次同时修复 `site/assets/js/search.js` 对 `folder.html` 导航栏注入动态搜索框的问题，避免该页顶部内容多于其它页面。

### 验证记录 [2026-02-14 22:54]：folder 页面仅保留顶部栏搜索并移除网格视图

**级别**：L3

**命令与结果**：
- `node site/tooling/scripts/folder-view-toggle.test.js`：通过（3 tests, 0 failures）
- `node --test site/tooling/scripts/folder-view-toggle.test.js`：通过
- `node --test site/tooling/scripts/page-common-alignment.test.js`：通过
- `python3 -m http.server 4173 --bind 127.0.0.1`：通过（本地调试服务启动）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=5000 --dump-dom "http://127.0.0.1:4173/site/pages/folder.html" > /tmp/folder_dom.html`：通过
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=5000 --dump-dom "http://127.0.0.1:4173/site/index.html" > /tmp/index_dom.html`：通过
- `rg -n "id=\"doc-search\"|id=\"search-btn\"|id=\"search-results\"|id=\"grid-view-btn\"|id=\"list-view-btn\"|class=\"header-search\"" /tmp/folder_dom.html`：通过（仅匹配顶部栏 `header-search`）
- `node -e "...header_equal..."`：通过（`folder_header_found=true`，`index_header_found=true`，`header_equal=true`）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1440,2200 --screenshot=/tmp/folder-page.png "http://127.0.0.1:4173/site/pages/folder.html"`：通过
- `npm run build`：通过
- `npm run check-generated`：失败

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，为已有环境问题，与本次 `folder.html` 的页面内搜索/网格视图移除改动无直接关系。浏览器调试截图产物：`/tmp/folder-page.png`。

*最后更新：2026-02-14*
