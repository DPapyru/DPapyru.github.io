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
