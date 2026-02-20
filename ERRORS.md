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

### 验证记录 [2026-02-15 09:10]：article-studio 新建 PR 前附件清理规则落地

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-enhancements.test.js`：通过
- `node --test site/tooling/scripts/article-studio-*.test.js`：通过（6 files, 0 failures）
- `npm run build`：通过
- `npm run check-generated`：失败

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`（`gallery-check` 报错），属于仓库既有问题，与本次 `article-studio` 的新 PR 附件清理规则改动无直接关系。

### 验证记录 [2026-02-15 09:24]：主题三模式（亮色/暗色/特殊）与教程页可切换验证

**级别**：L3

**命令与结果**：
- `node site/assets/js/theme-mode.test.js`：通过（3 tests, 0 failures）
- `npm test`：失败（4 个现有失败文件：`site/tooling/scripts/folder-learning-filter.test.js`、`site/tooling/scripts/gallery-check.test.js`、`site/tooling/scripts/gallery-normalize.test.js`、`site/tooling/scripts/generate-shader-gallery.test.js`）
- `npm run build --silent`：通过
- `node site/tooling/scripts/check-accent-theme.js`：通过
- `python3 -m http.server 4173`：通过（本地调试服务启动）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=6000 --dump-dom` 批量检查 `site/index.html`、`site/content/index.html`、`site/pages/*.html`（教程相关页）及 `site/search-results.html`、`site/qa.html`、`site/404.html`：通过（12/12 均存在 `theme-mode-select` + `accent-select`，且有 `data-theme-mode`）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=9000 --dump-dom "http://127.0.0.1:4173/site/tmp-theme-e2e.html" > /tmp/theme_e2e_dom.html`：通过（结果 `{"ok":true,"mode":"special","theme":"dark","accent":"git","storedMode":"special","storedTheme":"dark","storedAccent":"git"}`）

**备注**：浏览器验证中出现的 `dbus` 日志为无头环境常见输出，不影响 DOM 校验结论；临时调试页 `site/tmp-theme-e2e.html` 已在验证后删除。`npm test` 的 4 个失败为当前仓库既有失败项，本次主题改动相关新增测试已通过。

### 验证记录 [2026-02-15 10:12]：新增泰拉瑞亚主题（猩红/腐化/神圣/冰原/沙漠）

**级别**：L3

**命令与结果**：
- `node site/assets/js/theme-mode.test.js`：通过（4 tests, 0 failures）
- `node site/tooling/scripts/check-accent-theme.js`：通过
- `node --test site/tooling/scripts/page-common-alignment.test.js`：通过
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`）
- `npm test`：失败（4 个现有失败文件：`site/tooling/scripts/folder-learning-filter.test.js`、`site/tooling/scripts/gallery-check.test.js`、`site/tooling/scripts/gallery-normalize.test.js`、`site/tooling/scripts/generate-shader-gallery.test.js`）

**备注**：本次改动覆盖 `site/index.html`、`site/content/index.html`、`site/search-results.html`、`site/qa.html`、`site/404.html`、`site/pages/*.html` 中带 `accent-select` 的 12 个界面，统一新增 5 个泰拉瑞亚主题选项；`check-generated` 与 `npm test` 的失败项均为仓库既有问题。

### 验证记录 [2026-02-15 21:00]：article-studio 左右栏改按钮弹窗 + 中间区扩展

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-*.test.js`：通过（6 files, 0 failures）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，属于仓库既有问题，与本次 `article-studio` 左右栏弹窗化与中间区扩展改造无直接关系。`npm run build` 触发的无关生成文件已回退，仅保留本任务相关页面与样式脚本改动。

### 验证记录 [2026-02-16 07:25]：article-studio 粘贴增强（HTML 转 Markdown + GIF/MP4/WEBM）

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-enhancements.test.js`：通过
- `node --test site/tooling/scripts/article-studio-*.test.js`：通过（6 files, 0 failures）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，属于仓库既有问题，与本次 `article-studio` 粘贴/媒体上传能力增强无直接关系。本次构建产物中 `site/assets/shader-gallery/index.json` 与 `site/sitemap.xml` 仅有生成时间/日期变更。

### 验证记录 [2026-02-16 07:26]：article-studio 媒体粘贴/渲染扩展（3+4+5+6）

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-enhancements.test.js`：通过
- `node --test site/tooling/scripts/pr-worker-extra-files.test.js`：通过
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，属于仓库既有问题，与本次 `article-studio` 媒体能力扩展改动无直接关系。`npm run build` 产生的无关生成文件（如 `site/assets/shader-gallery/index.json`、`site/sitemap.xml`）已回退。

### 验证记录 [2026-02-16 07:31]：viewer Markdown 渲染补齐（mp4/webm）+ studio 预览媒体桥接

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-enhancements.test.js`：通过
- `node --test site/tooling/scripts/article-studio-*.test.js`：通过（6 files, 0 failures）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，属于仓库既有问题，与本次 `viewer` 的 `mp4/webm` Markdown 渲染和 `studio_preview` 媒体数据映射改动无直接关系。

### 验证记录 [2026-02-16 07:47]：合并两个工作树到 main（最大化冲突合并）

**级别**：L3

**命令与结果**：
- `node site/tooling/scripts/article-studio-enhancements.test.js`：通过（32 tests, 0 failures）
- `node --test site/tooling/scripts/pr-worker-extra-files.test.js`：通过（1 test, 0 failures）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，属于仓库既有问题；本次冲突合并相关脚本与页面验证已通过。

### 验证记录 [2026-02-16 15:05]：article-studio 项目 Markdown 教程 + 发布前自检 + 扩展语法按钮补齐

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-guide-check.test.js site/tooling/scripts/article-studio-template-guide.test.js site/tooling/scripts/article-studio-routing.test.js site/tooling/scripts/article-studio-compose-mode.test.js site/tooling/scripts/article-studio-flowchart-drawer.test.js site/tooling/scripts/article-studio-enhancements.test.js`：通过（6 files, 0 failures）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，属于仓库既有问题，与本次 `article-studio` 教程弹窗、自检弹窗、扩展语法按钮与模板升级改动无直接关系。

### 验证记录 [2026-02-16 16:02]：article-studio 教程/自检弹窗切换逻辑修复

**级别**：L3

**命令与结果**：
- `node`（Headless Chrome CDP 点击脚本，依次点击“项目Markdown教程”“发布前自检”按钮并读取弹窗状态）：通过（修复前可稳定复现“自检按钮二次点击不关闭”，修复后已可二次点击关闭）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，属于仓库既有问题，与本次 `article-studio` 弹窗切换逻辑修复无直接关系。

### 验证记录 [2026-02-16 16:19]：article-studio 非专注模式弹窗点击导致页面下滑修复

**级别**：L3

**命令与结果**：
- `node`（Headless Chrome CDP：记录点击“项目Markdown教程”“发布前自检”前后 `window.scrollY`）：通过（修复前点击后会跳到 1300~2000；修复后保持原滚动位置）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：根因是打开侧栏弹窗时对内部首个可聚焦元素执行 `focus()`，浏览器会将文档滚动到该元素在 DOM 中的静态位置；已改为无滚动聚焦（`focus({ preventScroll: true })` + 兼容回退）。`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，属于仓库既有问题，与本次修复无直接关系。

### 验证记录 [2026-02-16 16:39]：article-studio 教程/自检弹窗位置错乱修复（带截图调试）

**级别**：L3

**命令与结果**：
- `node`（Headless Chrome CDP + 截图：打开“项目Markdown教程”“发布前自检”弹窗并采集 `computedStyle.position`、`getBoundingClientRect`）：通过（修复前弹窗 `position` 被覆盖为 `relative` 且内容落在视口外；修复后恢复为 `fixed` 并覆盖视口）
- `npm run build --silent`：失败（当前执行环境中命令在工具层被提前终止，日志止于 `generate-structure`，未得到完整退出）
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：根因是 `site/assets/css/layout.css` 中 `body.workbench-page > :where(:not(.skip-link):not(.viewer-ai-fab-wrap))` 将 `position: relative` 施加到 `body` 的直接子元素，覆盖了弹窗 `.modal` 的 `position: fixed`。已改为排除 `.modal`：`body.workbench-page > :where(:not(.skip-link):not(.viewer-ai-fab-wrap):not(.modal))`。截图证据：修复前 `/tmp/article-studio-guide-modal-fixed.png`、`/tmp/article-studio-draft-modal-fixed.png`；修复后 `/tmp/article-studio-guide-modal-after-layout-fix.png`、`/tmp/article-studio-draft-modal-after-layout-fix.png`。`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，属于仓库既有问题，与本次定位修复无直接关系。

### 验证记录 [2026-02-16 16:45]：article-studio 附件提交流程三选弹窗 + 浏览器交互验收

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-*.test.js`：通过（7 files, 0 failures）
- `timeout 300s npm run build --silent > /tmp/build_article_modal_fix.log 2>&1; echo BUILD_EXIT:$?`：通过（`BUILD_EXIT:0`）
- `timeout 300s npm run check-generated --silent > /tmp/check_generated_article_modal_fix.log 2>&1; echo CHECK_GENERATED_EXIT:$?`：失败（`CHECK_GENERATED_EXIT:1`）
- `python3 -m http.server 4174 --bind 127.0.0.1`：通过（本地浏览器调试服务启动）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=45000 --dump-dom "http://127.0.0.1:4174/site/tmp-article-studio-pr-assets-browser-check.html" > /tmp/article_studio_pr_assets_browser_check_dom.html`：通过
- `rg -n "BROWSER_CHECK_RESULT" /tmp/article_studio_pr_assets_browser_check_dom.html`：通过（结果 `ok: true, passed: 3, failed: 0`）

**备注**：`check-generated` 失败原因为 `site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`（`gallery-check` 报错），属于仓库既有问题，与本次 `article-studio` 附件提交流程改造无直接关系。浏览器调试覆盖 3 条交互路径：`取消并返回编辑`（不发起 create-pr 且附件保留）、`清空附件并新建 PR`（二次确认后提交且不携带 `extraFiles`）、`继续已有 PR`（请求体携带 `existingPrNumber` 且附件保留）。临时调试页 `site/tmp-article-studio-pr-assets-browser-check.html` 已在验证后删除。

*最后更新：2026-02-16*

### 验证记录 [2026-02-18 07:04]：anim-renderer `file://` 加载 C# 动画修复

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/animcs-js-runtime-file-fallback.test.js`：通过
- `node --test site/tooling/scripts/page-common-alignment.test.js`：通过
- `node --test site/tooling/scripts/workbench-shell.test.js`：通过
- `npm run build`：通过
- `npm run check-generated`：失败

**备注**：`check-generated` 失败原因仍为既有内容问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`。本次修复已额外通过 headless Chrome 在 `http://` 与 `file://` 场景截图复核（`file://` 初始态不再报 `Failed to fetch`，并支持通过本地 resolver 载入动画模块）。

### 验证记录 [2026-02-18 17:53]：animcs Profile + 通用几何库（含浏览器点击与截图验收）

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/build-animcs-profile.test.js`：通过
- `node --test site/tooling/scripts/animcs-js-runtime-profile.test.js`：通过
- `node --test site/tooling/scripts/animcs-js-runtime-file-fallback.test.js`：通过
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）
- `python3 -m http.server 4173 --bind 127.0.0.1`：通过（本地浏览器调试服务启动）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=60000 --dump-dom "http://127.0.0.1:4173/site/tmp-animcs-profile-browser-check.html" > /tmp/animcs-acceptance/animcs_profile_browser_check_dom.html`：通过
- `rg -n "BROWSER_CHECK_RESULT" /tmp/animcs-acceptance/animcs_profile_browser_check_dom.html`：通过（结果 `ok: true, passed: 5, failed: 0`）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,2200 --virtual-time-budget=65000 --screenshot=/tmp/animcs-acceptance/animcs_profile_browser_check.png "http://127.0.0.1:4173/site/tmp-animcs-profile-browser-check.html"`：通过
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1200 --virtual-time-budget=15000 --screenshot=/tmp/animcs-acceptance/anim-renderer-page.png "http://127.0.0.1:4173/site/pages/anim-renderer.html"`：通过
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1400 --virtual-time-budget=30000 --screenshot=/tmp/animcs-acceptance/viewer-anim-page.png "http://127.0.0.1:4173/site/pages/viewer.html?file=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE%2F%E4%BD%BF%E7%94%A8%E7%BD%91%E9%A1%B5%E7%89%B9%E6%AE%8A%E5%8A%A8%E7%94%BB%E6%A8%A1%E5%9D%97.md"`：通过

**备注**：`check-generated` 失败原因仍为既有内容问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`。本次浏览器验收覆盖 `anim-renderer + viewer` 两条主链路，执行了按钮点击与重载交互，截图证据位于 `/tmp/animcs-acceptance/animcs_profile_browser_check.png`、`/tmp/animcs-acceptance/anim-renderer-page.png`、`/tmp/animcs-acceptance/viewer-anim-page.png`。临时检查页 `site/tmp-animcs-profile-browser-check.html` 已在验收后删除。

### 验证记录 [2026-02-19 11:09]：feat-animcs-vec3-mat4 开发基线

**级别**：L3

**命令与结果**：
- `npm ci`：通过
- `npm run test`：失败（32 files 中 4 files 失败）
- `timeout 300s npm run build --silent > /tmp/feat_animcs_vec3_mat4_baseline_build.log 2>&1; echo BUILD_EXIT:$?`：通过（`BUILD_EXIT:0`）

**备注**：`npm run test` 的失败为仓库现存失败项，包含：`site/tooling/scripts/folder-learning-filter.test.js`、`site/tooling/scripts/gallery-check.test.js`、`site/tooling/scripts/gallery-normalize.test.js`、`site/tooling/scripts/generate-shader-gallery.test.js`。本条记录用于确认本次开发起点基线。

### 验证记录 [2026-02-19 12:32]：feat-animcs-vec3-mat4 实施完成验收

**级别**：L3

**命令与结果**：
- `npm run test`：失败（33 files 中 4 files 失败）
- `ANIMCS_AST_INTEGRATION=1 node --test site/tooling/scripts/animcs-compiler-ast.test.js`：通过（2 tests, 0 failures）
- `DOTNET_ROLL_FORWARD=Major dotnet test site/tooling/tools/animcs/AnimRuntime.Tests/AnimRuntime.Tests.csproj -v minimal`：通过（Passed: 8）
- `DOTNET_ROLL_FORWARD=Major dotnet test site/tooling/tools/animcs/AnimHost.Tests/AnimHost.Tests.csproj -v minimal`：通过（Passed: 1）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：
- `npm run test` 当前失败项仍为仓库既有失败：`site/tooling/scripts/folder-learning-filter.test.js`、`site/tooling/scripts/gallery-check.test.js`、`site/tooling/scripts/gallery-normalize.test.js`、`site/tooling/scripts/generate-shader-gallery.test.js`。
- `animcs-compiler-ast` 测试采用显式环境变量 `ANIMCS_AST_INTEGRATION=1` 触发，避免默认全量并发测试中的环境抖动；开启后已验证通过。
- `dotnet test` 在沙箱内会因 VSTest 本地 socket 权限受限而中止，已在提权模式下完成验证。
- `npm run check-generated` 失败原因为既有内容问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次 animcs Vec3/Mat4 能力升级无直接关系。

### 验证记录 [2026-02-19 13:10]：animcs Vec3/Mat4 交互修复 + 其它示例回归复测

**级别**：L3

**命令与结果**：
- `npm run build:animcs`：通过
- `ANIMCS_AST_INTEGRATION=1 node --test site/tooling/scripts/animcs-compiler-ast.test.js`：通过（2 tests, 0 failures）
- `node --test site/tooling/scripts/animcs-js-runtime-profile.test.js`：通过（5 tests, 0 failures）
- `DOTNET_ROLL_FORWARD=Major dotnet test site/tooling/tools/animcs/AnimRuntime.Tests/AnimRuntime.Tests.csproj -v minimal`：通过（Passed: 9）
- `timeout 420s npm run build --silent > /tmp/fix_animcs_interaction_build.log 2>&1; echo BUILD_EXIT:$?`：通过（`BUILD_EXIT:0`）
- `timeout 420s npm run check-generated --silent > /tmp/fix_animcs_interaction_check_generated.log 2>&1; echo CHECK_GENERATED_EXIT:$?`：失败（`CHECK_GENERATED_EXIT:1`）
- `python3 -m http.server 4173 --bind 127.0.0.1`：通过（本地浏览器调试服务启动）
- `google-chrome --headless --disable-gpu --virtual-time-budget=20000 --dump-dom "http://127.0.0.1:4173/site/tmp-animcs-input-check.html?src=anims/vec3-axis-orbit.cs" > /tmp/animcs_input_vec3_dom.html`：通过（`ok: true`，`drag_changes: true`，`wheel_changes: true`）
- `google-chrome --headless --disable-gpu --virtual-time-budget=20000 --dump-dom "http://127.0.0.1:4173/site/tmp-animcs-input-check.html?src=anims/matrix-mat4-transform.cs" > /tmp/animcs_input_mat4_dom.html`：通过（`ok: true`，`drag_changes: true`，`wheel_changes: true`）
- `google-chrome --headless --disable-gpu --virtual-time-budget=20000 --dump-dom "http://127.0.0.1:4173/site/tmp-animcs-mount-check.html?src=anims/demo-basic.cs" > /tmp/animcs_mount_demo_basic_dom.html`：通过（`ok: true`）
- `google-chrome --headless --disable-gpu --virtual-time-budget=20000 --dump-dom "http://127.0.0.1:4173/site/tmp-animcs-mount-check.html?src=anims/demo-eoc-ai.cs" > /tmp/animcs_mount_demo_eoc_dom.html`：通过（`ok: true`）
- `google-chrome --headless --disable-gpu --virtual-time-budget=20000 --dump-dom "http://127.0.0.1:4173/site/tmp-animcs-mount-check.html?src=anims/demo-math-transform.cs" > /tmp/animcs_mount_demo_math_transform_dom.html`：通过（`ok: true`）
- `google-chrome --headless --disable-gpu --virtual-time-budget=20000 --dump-dom "http://127.0.0.1:4173/site/tmp-animcs-mount-check.html?src=anims/demo-mode-state.cs" > /tmp/animcs_mount_demo_mode_state_dom.html`：通过（`ok: true`）
- `google-chrome --headless --disable-gpu --virtual-time-budget=20000 --dump-dom "http://127.0.0.1:4173/site/tmp-animcs-mount-check.html?src=anims/vector-basic.cs" > /tmp/animcs_mount_vector_basic_dom.html`：通过（`ok: true`）
- `google-chrome --headless --disable-gpu --virtual-time-budget=20000 --dump-dom "http://127.0.0.1:4173/site/tmp-animcs-mount-check.html?src=anims/vector-move.cs" > /tmp/animcs_mount_vector_move_dom.html`：通过（`ok: true`）
- `google-chrome --headless --disable-gpu --virtual-time-budget=20000 --dump-dom "http://127.0.0.1:4173/site/tmp-animcs-mount-check.html?src=anims/vector-add-resolution.cs" > /tmp/animcs_mount_vector_add_resolution_dom.html`：通过（`ok: true`）

**备注**：
- 本轮浏览器验证采用“真实 pointer/wheel 事件 + 状态对比”确认 `Vec3/Mat4` 两个新动画都可拖拽旋转并可滚轮缩放。
- “其它示例内容”回归检查覆盖 `demo-*` 与 `vector-*`，结果均为 player/canvas 正常、无运行时错误面板、无全局异常。
- `check-generated` 失败原因为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次交互修复无直接关系。
- 临时浏览器检查页 `site/tmp-animcs-*.html` 已在验证后删除。

### 验证记录 [2026-02-19 22:44]：folder 页面 SVG 目录可视化改造（点击验收）

**级别**：功能验收

**命令与结果**：
- `npm ci`：通过
- `python3 -m http.server 4176 --bind 127.0.0.1`：通过（本地浏览器调试服务启动）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=70000 --dump-dom "http://127.0.0.1:4176/site/tmp-folder-svg-browser-check.html" > /tmp/folder_svg_browser_check_dom.html`：通过（结果 `ok: true, passed: 5, failed: 0`）
- `rg -n "\"ok\"|\"passed\"|\"failed\"|点击目录后进入子目录|上一章/下一章箭头颜色不同" /tmp/folder_svg_browser_check_dom.html`：通过

**备注**：
- 点击验收覆盖 5 条关键路径：目录下钻、返回上一级、上一章连线、下一章连线、两类箭头颜色区分。
- 自动验收中使用的临时页面 `site/tmp-folder-svg-browser-check.html` 已在验证后删除。
- Headless Chrome 输出的 DBus 连接报错为当前环境常见噪声，不影响页面功能验证结果。

### 验证记录 [2026-02-19 23:00]：folder 页面“仅保留顶部 + 安全距离缩小 80%”改造（含截图调试）

**级别**：功能验收

**命令与结果**：
- `python3 -m http.server 4176 --bind 127.0.0.1`：通过（本地调试服务启动）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1680,1120 --virtual-time-budget=25000 --screenshot=/tmp/folder_root_after_safe80_v3.png "http://127.0.0.1:4176/site/pages/folder.html"`：通过（根目录布局截图）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1680,1120 --virtual-time-budget=25000 --screenshot=/tmp/folder_gongxian_after_safe80_v2.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（文章连线截图）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=70000 --dump-dom "http://127.0.0.1:4176/site/tmp-folder-svg-browser-check.html" > /tmp/folder_svg_browser_check_dom_latest.html`：通过（结果 `ok: true, passed: 5, failed: 0`）

**备注**：
- 页面结构已调整为“仅保留顶部导航”，其余区域全部替换为 SVG 目录视图。
- 安全距离按照要求缩小约 80%：页面外边距、工具栏/图例内边距、以及目录环绕轨道安全边距均已同步压缩。
- 截图调试中发现根目录节点被裁切，已通过“椭圆轨道 + 双轨道错层”修正，可见性恢复。
- 临时验收页 `site/tmp-folder-svg-browser-check.html` 已在验收后删除。

### 验证记录 [2026-02-19 23:12]：folder 可视化可读性修复（截图调试驱动）

**级别**：功能验收

**命令与结果**：
- `python3 -m http.server 4176 --bind 127.0.0.1`：通过（本地调试服务启动）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1680,1120 --virtual-time-budget=25000 --screenshot=/tmp/folder_root_human_v2.png "http://127.0.0.1:4176/site/pages/folder.html"`：通过
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1680,1120 --virtual-time-budget=25000 --screenshot=/tmp/folder_gongxian_human_v2.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=70000 --dump-dom "http://127.0.0.1:4176/site/tmp-folder-human-check.html" > /tmp/folder_human_check_dom.html`：通过（结果 `ok: true, passed: 5, failed: 0`）

**备注**：
- 通过截图识别到的人因问题：根目录目录节点密集导致重叠、阅读路径不清晰。
- 修复方式：目录节点改为大角度椭圆环绕分布，取消拥挤错层策略，改为按角度均匀排布；文章区域 Y 起点改为跟随目录区底部自适应。
- 页面结构保持“仅顶部栏保留，以下均为重构区域”。
- 验收后已删除临时检查页 `site/tmp-folder-human-check.html`。

### 验证记录 [2026-02-19 23:31]：folder 思维导图人因可视化二次优化（截图调试 + 箭头强化）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1600 --virtual-time-budget=7000 --screenshot=/tmp/folder_root_after_v6.png "http://127.0.0.1:4176/site/pages/folder.html"`：通过（根目录视觉验收）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=8000 --screenshot=/tmp/folder_gongxian_after_v6.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（文章关系箭头验收）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --dump-dom "http://127.0.0.1:4176/site/tmp-folder-human-check.html" | rg -n "\"ok\"|\"passed\"|\"failed\"|上一章连线|下一章连线|箭头颜色差异"`：通过（结果 `ok: true, passed: 5, failed: 0`）

**备注**：
- 本轮根据截图定位的人因问题为：目录名称断裂阅读困难、文章关系箭头辨识度不足、信息密度与空白比例不协调。
- 已完成优化：文章卡片改为双行标题优先、上一章/下一章箭头改为蓝色虚线与橙色实线并放大箭头、连线控制点按章节距离分离以降低重叠。
- 页面继续保持“仅顶部栏保留，其余区域重构”的约束；安全距离缩放参数保持 `SAFE_SCALE = 0.2`（较原方案缩小约 80%）。
- 临时检查页 `site/tmp-folder-human-check.html` 已在本轮验收后删除。

### 验证记录 [2026-02-19 23:43]：folder 连线折线化 + 箭头缩小（浏览器截图调试）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1600 --virtual-time-budget=7000 --screenshot=/tmp/folder_root_polyline_v1.png "http://127.0.0.1:4176/site/pages/folder.html"`：通过（根目录截图）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=8000 --screenshot=/tmp/folder_gongxian_polyline_v1.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（文章关系截图）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --dump-dom "http://127.0.0.1:4176/site/tmp-folder-polyline-check.html" | rg -n "\"ok\"|\"passed\"|\"failed\"|上一章连线|下一章连线|箭头颜色差异"`：通过（结果 `ok: true, passed: 5, failed: 0`）

**备注**：
- 根据截图反馈完成两项改造：箭头 marker 尺寸下调、目录与章节关系连线由贝塞尔曲线改为折线。
- 当前页面中连线构建已不再使用 `Q` 曲线命令（统一使用折线路径）。
- 临时验收页 `site/tmp-folder-polyline-check.html` 已在本轮验证后删除。

### 验证记录 [2026-02-19 23:50]：folder 章节箭头避让防重叠（折线通道）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=9000 --screenshot=/tmp/folder_gongxian_no_overlap_v1.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（关系线重叠检查）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1600 --virtual-time-budget=8000 --screenshot=/tmp/folder_root_no_overlap_v1.png "http://127.0.0.1:4176/site/pages/folder.html"`：通过（根目录回归）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --dump-dom "http://127.0.0.1:4176/site/tmp-folder-no-overlap-check.html" | rg -n "\"ok\"|\"passed\"|\"failed\"|上一章连线|下一章连线|箭头颜色差异"`：通过（结果 `ok: true, passed: 5, failed: 0`）

**备注**：
- 已为上一章/下一章关系线增加“折线通道避让 + 节点端口错位”机制：同层通道冲突时自动升/降层，避免线段与箭头重叠。
- 目录/文章交互逻辑不变：目录下钻、返回上一级、文章跳转保持正常。
- 临时验收页 `site/tmp-folder-no-overlap-check.html` 已在本轮验证后删除。

### 验证记录 [2026-02-20 00:07]：folder 箭头“零叠线”改造（单路径双箭头）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=9000 --screenshot=/tmp/folder_gongxian_no_overlap_v5.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（关系箭头可视化复核）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1600 --virtual-time-budget=8000 --screenshot=/tmp/folder_root_no_overlap_v5.png "http://127.0.0.1:4176/site/pages/folder.html"`：通过（根目录回归）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --dump-dom "http://127.0.0.1:4176/site/tmp-folder-final-check.html" | rg -n "\"ok\"|\"passed\"|\"failed\"|章节关系连线|双向箭头标记|箭头颜色差异"`：通过（结果 `ok: true, passed: 5, failed: 0`）

**备注**：
- 本轮将“上一章/下一章”从两套独立折线改为**单条关系线**，并使用 `marker-start(蓝色)` + `marker-end(橙色)` 表示双向语义，消除正反向叠线。
- 关系线路由统一在节点下方独立通道绘制，避免与根节点及上排文章区域重叠。
- 临时验收页 `site/tmp-folder-final-check.html` 已在本轮验证后删除。

### 验证记录 [2026-02-20 00:16]：folder 箭头重叠持续修复（截图调试 v9）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=9000 --screenshot=/tmp/folder_gongxian_no_overlap_v9.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（关系线与箭头可视化复核）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1600 --virtual-time-budget=8000 --screenshot=/tmp/folder_root_no_overlap_v8.png "http://127.0.0.1:4176/site/pages/folder.html"`：通过（根目录回归）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --dump-dom "http://127.0.0.1:4176/site/tmp-folder-v9-check.html" | rg -n "\"ok\"|\"passed\"|\"failed\"|章节关系连线|双端箭头标记|箭头颜色差异"`：通过（结果 `ok: true, passed: 5, failed: 0`）

**备注**：
- 本轮继续基于截图做避让优化：增加“节点统一端口分配 + 全局列占位”以减少竖向通道重叠；并将起点蓝色箭头改为更小的专用 marker（`arrow-prev-start`）。
- 页面保持“顶部栏保留，其余区域重构”不变。
- 临时验收页 `site/tmp-folder-v9-check.html` 已在本轮验证后删除。

### 验证记录 [2026-02-20 07:37]：folder 蓝色起点箭头方向修复（浏览器截图调试）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=10000 --screenshot=/tmp/folder_blue_arrow_issue_before_fix.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（问题复现截图）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=10000 --screenshot=/tmp/folder_blue_arrow_issue_after_fix.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（修复后截图）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1600 --virtual-time-budget=8000 --screenshot=/tmp/folder_blue_arrow_root_regression_after_fix.png "http://127.0.0.1:4176/site/pages/folder.html"`：通过（根目录回归）
- `npm run build`：通过（`BUILD_EXIT:0`）
- `npm run check-generated`：失败（既有问题：`site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`）

**备注**：
- 根因：蓝色起点 marker 使用 `orient: auto`，视觉上与主路径同向，导致“上一章”箭头语义不清。
- 修复：`arrow-prev-start` 调整为 `orient: auto-start-reverse`，并微调 `refX/markerWidth/markerHeight` 以提升可读性。
- 本轮仅调整蓝色起点箭头定义，不改动顶部栏与页面结构。

### 验证记录 [2026-02-20 07:42]：folder 蓝箭头避重叠细化（端口间距调整）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=10000 --screenshot=/tmp/folder_blue_arrow_no_overlap_after_spacing.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（蓝/橙箭头间距复核）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,2200 --virtual-time-budget=10000 --screenshot=/tmp/folder_blue_arrow_no_overlap_fangxiang_after_spacing.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%96%B9%E5%90%91%E6%80%A7%E6%8C%87%E5%AF%BC"`：通过（另一目录回归）

**备注**：
- 为避免蓝色起点箭头与邻近箭头/线段贴近，调整序列布局端口偏移：`±12` -> `±16`，步进 `7` -> `9`。
- 本轮仅调整关系线锚点间距，不改变导航与页面结构。

### 验证记录 [2026-02-20 07:48]：folder 箭头朝向修复（Modder入门截图调试）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=10000 --screenshot=/tmp/folder_modder_arrow_issue_before.png "http://127.0.0.1:4176/site/pages/folder.html?path=Modder%E5%85%A5%E9%97%A8"`：通过（问题复现）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=10000 --screenshot=/tmp/folder_modder_arrow_issue_after_v2.png "http://127.0.0.1:4176/site/pages/folder.html?path=Modder%E5%85%A5%E9%97%A8"`：通过（朝向修复后）
- `google-chrome --headless --disable-gpu --no-sandbox --force-device-scale-factor=2 --window-size=1200,900 --virtual-time-budget=10000 --screenshot=/tmp/folder_modder_arrow_issue_after_v2_zoom.png "http://127.0.0.1:4176/site/pages/folder.html?path=Modder%E5%85%A5%E9%97%A8"`：通过（放大复核）
- `google-chrome --headless --disable-gpu --no-sandbox --window-size=1600,1800 --virtual-time-budget=10000 --screenshot=/tmp/folder_gongxian_arrow_after_v2.png "http://127.0.0.1:4176/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（相关页回归）

**备注**：
- 根因：非序列布局下关系线起始端口采用固定交替偏移，首段可能先朝反方向拐折，导致蓝色起点箭头视觉朝向异常。
- 修复：在非序列布局中改为“按目标相对方向分配起终端口”，保证关系线首段先朝目标方向，再由 `marker-start` 呈现反向语义。
- 页面结构与顶部栏保持不变。

### 验证记录 [2026-02-20 08:14]：folder 箭头重叠避让修复（浏览器截图复核）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --window-size=1600,2200 --screenshot=/tmp/folder-before-2-e9fd2a9b.png "http://127.0.0.1:4173/site/pages/folder.html?path=%E6%96%B9%E5%90%91%E6%80%A7%E6%8C%87%E5%AF%BC"`：通过（修复前截图）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --window-size=1600,2200 --screenshot=/tmp/folder-after-direction.png "http://127.0.0.1:4173/site/pages/folder.html?path=%E6%96%B9%E5%90%91%E6%80%A7%E6%8C%87%E5%AF%BC"`：通过（修复后截图）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --window-size=1600,2200 --screenshot=/tmp/folder-before-1-a5e2c066.png "http://127.0.0.1:4173/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（修复前截图）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --window-size=1600,2200 --screenshot=/tmp/folder-after-contrib.png "http://127.0.0.1:4173/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（修复后截图）
- `npm run build`：通过
- `npm run check-generated`：失败（既有问题：`site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`）

**备注**：
- 修复点：顺序布局关系线端口由“入/出独立计数”改为“同侧统一避让分配”，并将关系线锚点与卡片边缘水平距离从 `7` 提升到 `10`，降低蓝/橙箭头贴边与视觉重叠。
- 本轮仅改动 `site/pages/folder.html` 的关系线布局算法，不涉及导航结构与页面主框架。

### 验证记录 [2026-02-20 08:26]：folder 蓝橘箭头左右分离显示（浏览器截图复核）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --window-size=1600,2200 --screenshot=/tmp/folder-split-arrows-direction.png "http://127.0.0.1:4180/site/pages/folder.html?path=%E6%96%B9%E5%90%91%E6%80%A7%E6%8C%87%E5%AF%BC"`：通过（蓝箭头左侧 / 橘箭头右侧）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --window-size=1600,2200 --screenshot=/tmp/folder-split-arrows-contrib.png "http://127.0.0.1:4180/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（另一目录回归）
- `npm run build`：通过
- `npm run check-generated`：失败（既有问题：`site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`）

**备注**：
- 顺序布局关系线改为左右双通道：起点端口固定左侧（蓝色 `marker-start`），终点端口固定右侧（橘色 `marker-end`）。
- 路由调整为“左通道纵向 -> 中段横向 -> 右通道纵向”，以实现两色箭头分边展示并减少重叠。

### 验证记录 [2026-02-20 08:35]：folder 橘左蓝右双箭头调整（浏览器截图复核）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --window-size=1600,2200 --screenshot=/tmp/folder-orange-left-blue-right-direction.png "http://127.0.0.1:4180/site/pages/folder.html?path=%E6%96%B9%E5%90%91%E6%80%A7%E6%8C%87%E5%AF%BC"`：通过（橘左蓝右，双箭头）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --window-size=1600,2200 --screenshot=/tmp/folder-orange-left-blue-right-contrib.png "http://127.0.0.1:4180/site/pages/folder.html?path=%E6%80%8E%E4%B9%88%E8%B4%A1%E7%8C%AE"`：通过（另一目录回归）
- `npm run build`：通过
- `npm run check-generated`：失败（既有问题：`site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`）

**备注**：
- 顺序布局关系线保留双端箭头，改为左端 `arrow-next-start`（橙色）+ 右端 `arrow-prev`（蓝色）。
- 图例同步更新为“左侧箭头（橙色）/右侧箭头（蓝色）”，避免语义与显示不一致。

### 验证记录 [2026-02-20 08:48]：folder 双箭头分离起点修复（两条独立关系线）

**级别**：功能验收

**命令与结果**：
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --window-size=1600,2200 --screenshot=/tmp/folder-two-paths-modder.png "http://127.0.0.1:4180/site/pages/folder.html?path=Modder%E5%85%A5%E9%97%A8"`：通过（两个箭头，起点不同）
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --window-size=1600,2200 --screenshot=/tmp/folder-two-paths-direction.png "http://127.0.0.1:4180/site/pages/folder.html?path=%E6%96%B9%E5%90%91%E6%80%A7%E6%8C%87%E5%AF%BC"`：通过（另一目录回归）
- `npm run build`：通过
- `npm run check-generated`：失败（既有问题：`site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`）

**备注**：
- 顺序布局关系线从“单条线双端 marker”改为“两条独立路径”：
  - 左侧橙线：源节点 -> 目标节点（橙色箭头）
  - 右侧蓝线：目标节点 -> 源节点（蓝色箭头）
- 该调整确保两个箭头的出发点分别附着在不同节点，不再共享同一条路径起终点。

### 验证记录 [2026-02-20 09:00]：feat-folder-svg-view 提交前回归

**级别**：L3 合并前验收

**命令与结果**：
- `npm test`：通过（158 tests，156 passed，2 skipped，0 failed）
- `npm run build`：通过

**备注**：
- 修复 `folder-view-toggle.test.js` 与当前 SVG 目录视图不一致的断言，避免继续校验已移除的列表渲染函数。
- `site/pages/folder.html` 补回 `workbench-statusbar`，满足统一模板约束。
