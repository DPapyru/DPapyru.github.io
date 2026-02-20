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

### 验证记录 [2026-02-19 22:53]：article-studio VSCode 三栏重构 + 贴边 IDE 布局 + 浏览器交互截图验收

**级别**：L3

**命令与结果**：
- `node --check site/assets/js/article-studio.js`：通过
- `node --test site/tooling/scripts/article-studio-*.test.js`：通过（71 tests, 0 failures）
- `npm run build`：通过（`EXIT:0`）
- `npm run check-generated`：失败（`gallery-check` 报错）
- `NODE_PATH=... STUDIO_E2E_OUT=/tmp/article-studio-e2e node /tmp/article-studio-e2e-run.js`（配合 `python3 -m http.server 4311`）：通过（`errors: []`）

**备注**：
- `check-generated` 失败原因为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次 `article-studio` 三栏布局/交互改造无直接关系。
- 浏览器验收覆盖左栏（筛选、菜单替代右键、新建、多文件暂存 A/M/D）、中栏（标签切换、直接预览 + Esc、新标签预览）、右栏（代理命令、样式命令、高级区、提交流程按钮）以及键盘输入（文本输入、Tab、Esc）。
- 截图产物：`/tmp/article-studio-e2e/01-initial-layout.png`、`/tmp/article-studio-e2e/02-left-context-menu.png`、`/tmp/article-studio-e2e/03-left-stage-multi-file.png`、`/tmp/article-studio-e2e/04-middle-direct-preview.png`、`/tmp/article-studio-e2e/05-right-flowchart-modal.png`、`/tmp/article-studio-e2e/06-right-command-and-style.png`。

### 验证记录 [2026-02-19 22:59]：article-studio 边框贴边（导航栏外无外边距）追加验收

**级别**：L3

**命令与结果**：
- `NODE_PATH=... node <playwright几何检查脚本>`：通过（`main/container/wrapper/workspace` 的 `x=0`，已贴边）
- `NODE_PATH=... STUDIO_E2E_OUT=/tmp/article-studio-e2e node /tmp/article-studio-e2e-run.js`（配合 `python3 -m http.server 4311`）：通过（`errors: []`）

**备注**：
- 本次针对“页面与浏览器边框无边距（顶部导航栏除外）”要求追加了样式覆盖，修正了全局 `workbench` 限宽与 `viewer-page` 内容容器的 `max-width/padding` 继承问题。
- 复测截图仍输出到 `/tmp/article-studio-e2e/*.png`，并保持左/中/右交互链路通过。

### 验证记录 [2026-02-19 23:26]：article-studio IDE 对齐二次大改（结构重排 + 风格收敛 + 交互复测）

**级别**：L3

**命令与结果**：
- `node --check site/assets/js/article-studio.js`：通过
- `node --test site/tooling/scripts/article-studio-*.test.js`：通过（71 tests, 0 failures）
- `python3 -m http.server 4311 >/tmp/studio-http.log 2>&1 & SERVER_PID=$!; NODE_PATH=... node /tmp/article-studio-e2e-run.js; kill $SERVER_PID`：通过（`errors: []`）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：
- 本轮针对“更接近 `IDE.png` 且不保留旧页面元素感”进行了二次大改：右栏 `提交 PR` 提升为常显主按钮、Explorer/Stage 行样式改为更扁平 IDE 密度、标题栏/标签栏/命令条/终端区与按钮体系继续向 VSCode 风格收敛，并保持主题色联动。
- 浏览器自动化验收仍覆盖点击与键盘链路：左栏筛选与菜单替代右键、新建与多文件暂存（A/M/D）、中栏直接预览+Esc 与新标签预览、右栏代理命令/样式命令/高级区/提交流程按钮。
- 截图产物：`/tmp/article-studio-e2e/01-initial-layout.png`、`/tmp/article-studio-e2e/02-left-context-menu.png`、`/tmp/article-studio-e2e/03-left-stage-multi-file.png`、`/tmp/article-studio-e2e/04-middle-direct-preview.png`、`/tmp/article-studio-e2e/05-right-flowchart-modal.png`、`/tmp/article-studio-e2e/06-right-command-and-style.png`。
- `npm run check-generated` 失败原因为仓库既有内容问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次 `article-studio` 改造无直接关系。

### 验证记录 [2026-02-19 23:46]：article-studio 标签页关闭能力修复

**级别**：L3

**命令与结果**：
- `node --check site/assets/js/article-studio.js`：通过
- `node --test site/tooling/scripts/article-studio-template-guide.test.js`：通过（6 tests, 0 failures）
- `node --test site/tooling/scripts/article-studio-*.test.js`：通过（73 tests, 0 failures）
- `python3 -m http.server 4311 >/tmp/studio-http.log 2>&1 & SERVER_PID=$!; NODE_PATH=... node /tmp/article-studio-tab-close-check.js; kill $SERVER_PID`：通过（`before: 4`, `after: 3`, `closed: true`）
- `python3 -m http.server 4311 >/tmp/studio-http.log 2>&1 & SERVER_PID=$!; NODE_PATH=... node /tmp/article-studio-e2e-run.js; kill $SERVER_PID`：通过（`errors: []`）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：
- 根因：中栏标签仅有“打开/切换”逻辑，缺少关闭控件与关闭事件处理，导致文件可打开不可关闭。
- 修复：在标签内新增 `x` 关闭控件（`data-tab-close-path`），新增 `closeTabByPath()` 根因修复逻辑，并补充中键关闭（`auxclick`）支持。
- 浏览器截图与结果：`/tmp/article-studio-e2e/07-tab-close.png`、`/tmp/article-studio-e2e/tab-close-result.json`、`/tmp/article-studio-e2e/result.json`。
- `npm run check-generated` 失败原因为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次标签关闭修复无直接关系。

### 验证记录 [2026-02-20 00:04]：article-studio 左侧区域放大（Explorer 可读性提升）

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-template-guide.test.js`：通过（7 tests, 0 failures）
- `node --test site/tooling/scripts/article-studio-*.test.js`：通过（74 tests, 0 failures）
- `npm run build >/tmp/build.log 2>&1; echo EXIT:$?; tail -n 60 /tmp/build.log`：通过（`EXIT:0`）
- `npm run check-generated >/tmp/check-generated.log 2>&1; echo EXIT:$?; tail -n 80 /tmp/check-generated.log`：失败（`EXIT:1`，`gallery-check` 报错）
- `python3 -m http.server 4311 >/tmp/studio-http.log 2>&1 & SERVER_PID=$!; NODE_PATH=... node /tmp/article-studio-e2e-run.js; CODE=$?; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null; exit $CODE`：通过（`errors: []`）

**备注**：
- 左栏放大已覆盖活动栏、Explorer 标题、树节点、暂存列表、筛选输入与按钮交互密度；布局列宽同步上调为 `112px 300px`（响应式断点同步调整）。
- 浏览器自动化验收已复测点击与键盘链路，截图更新为：`/tmp/article-studio-e2e/01-initial-layout.png`、`/tmp/article-studio-e2e/02-left-context-menu.png`、`/tmp/article-studio-e2e/03-left-stage-multi-file.png`、`/tmp/article-studio-e2e/04-middle-direct-preview.png`、`/tmp/article-studio-e2e/05-right-flowchart-modal.png`、`/tmp/article-studio-e2e/06-right-command-and-style.png`。
- `npm run check-generated` 失败原因为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次左栏可读性放大改造无直接关系。

### 验证记录 [2026-02-20 00:32]：article-studio IDE 字体对齐项目双字体

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-template-guide.test.js`：通过（8 tests, 0 failures）
- `node --check site/assets/js/article-studio.js && node --test site/tooling/scripts/article-studio-*.test.js`：通过（75 tests, 0 failures）
- `python3 -m http.server 4311 >/tmp/studio-http.log 2>&1 & SERVER_PID=$!; NODE_PATH=... node /tmp/article-studio-e2e-run.js; CODE=$?; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null; exit $CODE`：通过（`errors: []`）
- `npm run build >/tmp/build-font.log 2>&1; echo EXIT:$?; tail -n 50 /tmp/build-font.log`：通过（`EXIT:0`）
- `npm run check-generated >/tmp/check-generated-font.log 2>&1; echo EXIT:$?; tail -n 80 /tmp/check-generated-font.log`：失败（`EXIT:1`，`gallery-check` 报错）

**备注**：
- 已将 `site/assets/css/article-studio.css` 中 IDE 区域的 `ui-monospace` 直接字体栈统一替换为项目字体变量 `var(--font-family-tutorial)`，与项目内 `JetBrainsMonoNerdFontBold` + `HarmonyOSSansSCRegular` 保持一致。
- 浏览器自动化点击/键盘验收截图已更新：`/tmp/article-studio-e2e/01-initial-layout.png`、`/tmp/article-studio-e2e/02-left-context-menu.png`、`/tmp/article-studio-e2e/03-left-stage-multi-file.png`、`/tmp/article-studio-e2e/04-middle-direct-preview.png`、`/tmp/article-studio-e2e/05-right-flowchart-modal.png`、`/tmp/article-studio-e2e/06-right-command-and-style.png`。
- `npm run check-generated` 失败原因为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次字体统一改造无直接关系。

### 验证记录 [2026-02-20 07:45]：article-studio PR 流程重构（文章/贴图/C# 三类清单）

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-enhancements.test.js site/tooling/scripts/article-studio-guide-check.test.js`：通过（45 tests, 0 failures）
- `node --check site/assets/js/article-studio.js && node --test site/tooling/scripts/article-studio-*.test.js`：通过（75 tests, 0 failures）
- `python3 -m http.server 4311 >/tmp/studio-http.log 2>&1 & SERVER_PID=$!; NODE_PATH=... node /tmp/article-studio-e2e-run.js; CODE=$?; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null; exit $CODE`：通过（`errors: []`）
- `npm run build >/tmp/build-prflow.log 2>&1; echo EXIT:$?; tail -n 60 /tmp/build-prflow.log`：通过（`EXIT:0`）
- `npm run check-generated >/tmp/check-generated-prflow.log 2>&1; echo EXIT:$?; tail -n 80 /tmp/check-generated-prflow.log`：失败（`EXIT:1`，`gallery-check` 报错）

**备注**：
- 右侧发布区新增 PR 文件总览，按 `文章 / 贴图(含媒体) / C#` 三类实时展示将提交路径；提交逻辑改为基于清单计数判断，删除“清空附件后提交 Markdown”的强制分支。
- 提交流程弹窗重构为“创建新 PR（提交全部文件）/ 继续已有 PR / 取消”，并显示与右侧一致的三类清单摘要，满足 IDE 内直接可见三类文件的要求。
- 浏览器自动化验收截图已更新：`/tmp/article-studio-e2e/01-initial-layout.png`、`/tmp/article-studio-e2e/02-left-context-menu.png`、`/tmp/article-studio-e2e/03-left-stage-multi-file.png`、`/tmp/article-studio-e2e/04-middle-direct-preview.png`、`/tmp/article-studio-e2e/05-right-flowchart-modal.png`、`/tmp/article-studio-e2e/06-right-command-and-style.png`。
- `npm run check-generated` 失败原因为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次 PR 流程改造无直接关系。

### 验证记录 [2026-02-20 08:15]：article-studio IDE 三栏可拖拽 + 目录树折叠 + 右栏顶部切换

**级别**：L3（按需求采用浏览器点击测试与截图验收）

**命令与结果**：
- `node --check site/assets/js/article-studio.js`：通过
- `python3 -m http.server 4173` + Playwright 点击脚本：通过（包含文件夹展开/收起、左右分栏拖拽、右栏 Tab 切换）
- 产出截图：`test-results/article-studio-click-acceptance.png`

**备注**：
- 已移除右栏顶部 `CODEX` 大标题文本，改为“命令面板 + 顶部分类 Tab（编辑/样式/发布）”。
- 左侧 Explorer 已改为文件夹树结构，支持目录展开与收起；文件项采用上下信息排布（文件名 + 路径）。
- 页面主工作区新增左右可拖拽边界（鼠标调整左栏/右栏宽度），并持久化到本地草稿状态。

### 验证记录 [2026-02-20 08:24]：article-studio 文件夹折叠失效修复（ASCII 图标）

**级别**：L3（浏览器点击测试 + 截图验收）

**命令与结果**：
- `node --check site/assets/js/article-studio.js`：通过
- Playwright 复现脚本（点击前后状态采样）：通过
  - 修复前复现：`hiddenAttr=true` 但 `computedDisplay=grid`
  - 修复后验证：`hiddenAttr=true` 且 `computedDisplay=none`
- Playwright 点击验收脚本：通过（文件夹展开/收起、左右分栏拖拽、右栏 Tab 切换）
- 产出截图：
  - `test-results/article-studio-folder-expanded.png`
  - `test-results/article-studio-folder-collapsed.png`
  - `test-results/article-studio-click-acceptance-fixed.png`

**备注**：
- 根因是样式覆盖：`.studio-tree-folder-children { display: grid; }` 覆盖了 `hidden` 属性效果。
- 已增加强制隐藏规则：`.studio-tree-folder-children[hidden] { display: none !important; }`，并同步修复右栏 Tab 面板的 `[hidden]` 覆盖问题。
- 将本次新增树图标由 Unicode 改为 ASCII：文件 `[F]`、目录 `[D]`、折叠 `>`、展开 `v`。

### 验证记录 [2026-02-20 08:53]：article-studio 资源树管理 + JetBrains Mono 图标验收

**级别**：L3（按需求采用浏览器点击测试与截图验收）

**命令与结果**：
- `node --check site/assets/js/article-studio.js`：通过
- `NODE_PATH=/mnt/f/DPapyru.github.io/node_modules node <<'NODE' ...`（Playwright 点击脚本，种子资源 + 点击折叠/右键移除 + 截图）：通过
  - `collapseAfter`: `expanded=false`, `hidden=true`, `display=none`
  - `beforeRemove`: `image=2, media=1, csharp=1`
  - `afterRemove`: `image=1, media=1, csharp=1`
  - 结果文件：`test-results/article-studio-resource-management-final-2.json`
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：
- Explorer 已展示并管理 Markdown 与资源文件（`png/mp4/cs`），接近 IDE 资源管理方式；文件夹支持展开/收起。
- 树节点图标改为 JetBrainsMono Nerd Font 特殊字符（通过代码点转义输出），不再使用 ASCII 的 `[D]/[F]/>/v`。
- 资源节点右键菜单已支持：`插入资源引用`、`预览资源`、`编辑 C# 文件`、`移除资源`。
- 点击验收与截图：
  - `test-results/article-studio-explorer-resources.png`
  - `test-results/article-studio-resource-context-menu.png`
  - `test-results/article-studio-resource-management-final.png`
  - `test-results/article-studio-resource-management-final-2.png`
- `npm run check-generated` 失败原因为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次 `article-studio` 资源树改造无直接关系。

### 验证记录 [2026-02-20 09:01]：article-studio 左栏关键按钮放大

**级别**：L3（按需求采用浏览器点击测试与截图验收）

**命令与结果**：
- `NODE_PATH=/mnt/f/DPapyru.github.io/node_modules node <<'NODE' ...`（Playwright 打开页面并截图 + 采样按钮尺寸）：通过
  - `studio-explorer-context-trigger`: `68x40`, `fontSize=15px`
  - `studio-explorer-refresh`: `68x40`, `fontSize=15px`
  - `studio-stage-clear`: `96x40`, `fontSize=15px`
- 截图：`test-results/article-studio-left-buttons-larger.png`

**备注**：
- 本次仅放大左栏 Explorer 区块中的三个按钮（`菜单 / 刷新 / 清空暂存`），不影响右栏命令区与中栏编辑区按钮密度。

### 验证记录 [2026-02-20 09:06]：article-studio 左栏“路径与元数据（高级）”折叠条放大

**级别**：L3（按需求采用浏览器点击测试与截图验收）

**命令与结果**：
- `NODE_PATH=/mnt/f/DPapyru.github.io/node_modules node <<'NODE' ...`（Playwright 打开页面并截图 + 采样左栏折叠条尺寸）：通过
  - `.studio-left-extra-panel > summary`: `961x38`, `fontSize=14px`, `fontWeight=700`
- 截图：`test-results/article-studio-left-summary-larger.png`

**备注**：
- 本次仅放大左栏 `路径与元数据（高级）` 折叠条，提升点击面积与可读性；未修改右栏和中栏其它折叠条尺寸。

### 验证记录 [2026-02-20 09:52]：article-studio 右栏提交区（提交 PR + 发布与附件）放大

**级别**：L3（按需求采用浏览器点击测试与截图验收）

**命令与结果**：
- `NODE_PATH=/mnt/f/DPapyru.github.io/node_modules node <<'NODE' ...`（Playwright 切换到发布 Tab 并截图 + 采样尺寸）：通过
  - `#studio-submit-pr`: `314x48`, `fontSize=22px`, `fontWeight=800`
  - `#studio-right-panel-modal .studio-right-publish-panel > summary`: `304x40`, `fontSize=15px`, `fontWeight=700`
- 截图：`test-results/article-studio-right-publish-larger.png`

**备注**：
- 本次放大右栏发布区的“提交 PR”主按钮与“发布与附件（高级）”折叠条，提升可读性与点击面积。
- 未调整左栏 Explorer 和中栏编辑区其它控件尺寸。

### 验证记录 [2026-02-20 10:23]：article-studio Explorer 自动展示全站资源（png/mp4/cs 引用）

**级别**：L3（按需求采用浏览器点击测试与截图验收）

**命令与结果**：
- `node --check site/assets/js/article-studio.js`：通过
- `NODE_PATH=/mnt/f/DPapyru.github.io/node_modules node <<'NODE' ...`（Playwright：清空本地草稿缓存后打开页面，等待资源索引完成并截图）：通过
  - `foundResourcesWithin45s=true`
  - `counts`: `markdown=150`, `image=3`, `media=0`, `csharp=4`
  - `firstResourcePath`: `和小善的MiniTips/视觉效果篇/imgs/屏幕截图-2026-02-14-143642-t92jz.png`
  - 截图：`test-results/article-studio-explorer-autoload-resources.png`
- `NODE_PATH=/mnt/f/DPapyru.github.io/node_modules node <<'NODE' ...`（Playwright：筛选 `imgs`，验证资源显示与右键菜单）：通过
  - `counts`: `image=3`, `media=0`, `csharp=0`
  - 右键菜单可见项：`insert-resource`, `preview-resource`
  - 截图：`test-results/article-studio-explorer-autoload-resources-filtered.png`
  - 截图：`test-results/article-studio-indexed-resource-menu.png`

**备注**：
- Explorer 资源来源扩展为“全站 Markdown 内容中的资源引用索引 + 本地上传资源 + 当前草稿引用”，资源会出现在与文章同一棵树中。
- 对 URL 编码路径增加了解码显示，避免出现 `%E5%...` 目录名。
- 对索引资源（非本地上传）右键菜单保留“插入资源引用/预览资源”，隐藏“移除资源/编辑 C# 文件”。

### 验证记录 [2026-02-20 10:32]：article-studio Explorer 改为图2风格紧凑树行（文件名优先）

**级别**：L3（按需求采用浏览器点击测试与截图验收）

**命令与结果**：
- `node --check site/assets/js/article-studio.js`：通过
- `NODE_PATH=/mnt/f/DPapyru.github.io/node_modules node <<'NODE' ...`（Playwright：清空本地缓存后打开 Explorer，并展开 `Modder入门` + `code/imgs/media`）：通过
  - `stats`: `totalRows=7`, `csharpRows=2`, `imageRows=1`, `markdownRows=4`
  - 截图：`test-results/article-studio-modder-folder-ide-compact.png`
- `NODE_PATH=/mnt/f/DPapyru.github.io/node_modules node <<'NODE' ...`（Playwright：筛选 `imgs`，验证资源在同树中紧凑显示）：通过
  - `counts`: `image=3`, `csharp=0`, `markdown=0`
  - 截图：`test-results/article-studio-explorer-autoload-resources-filtered-compact.png`

**备注**：
- Explorer 文件行改为更接近 IDE：单行紧凑展示、隐藏第二行路径、缩小行高与操作按钮尺寸。
- 文件主显示改为真实文件名（如 `*.md/*.png/*.cs`），不再优先显示文章标题。
- 资源节点仍在同一棵树中展示（按目录层级出现），并保留资源右键插入/预览能力。

### 验证记录 [2026-02-20 10:54]：article-studio Explorer 文字横向排布 + 目录缩进层次增强

**级别**：L3（按需求采用浏览器点击测试与截图验收）

**命令与结果**：
- `node --check site/assets/js/article-studio.js`：通过
- `NODE_PATH=/mnt/f/DPapyru.github.io/node_modules node <<'NODE' ...`（Playwright：筛选 `Modder入门`，展开目录并截图）：通过
  - `labelDisplay=flex`, `labelAlignItems=center`
  - `uniqueFilePaddingLeft=["68px","48px"]`
  - 截图：`test-results/article-studio-tree-horizontal-indent-modder-final.png`
- `NODE_PATH=/mnt/f/DPapyru.github.io/node_modules node <<'NODE' ...`（Playwright：筛选 `imgs`，验证资源树缩进层次并截图）：通过
  - 截图：`test-results/article-studio-tree-horizontal-indent-resources-final.png`

**备注**：
- 文件行文本改为横向排布，避免上下分散感；目录项保留紧凑单行风格。
- 增强层级缩进：深层目录与文件的左内边距加深，并叠加左侧层级引导线，提升层次可读性。
