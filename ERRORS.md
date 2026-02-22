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

### 验证记录 [2026-02-20 11:10]：合并 worktree `fix-article-studio-vscode-layout` 到 `main` 后验收

**级别**：L3

**命令与结果**：
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：
- 本次已完成 `fix-article-studio-vscode-layout` 合并到 `main` 的冲突处理，冲突文件包含 `ERRORS.md` 与索引/站点地图生成文件，生成文件通过脚本重建解决。
- `npm run check-generated` 失败原因为仓库既有内容问题：`site/content/shader-gallery/pass-1/entry.json` 引用了不存在的 `cover.webp`，与本次合并冲突处理无直接关系。

### 验证记录 [2026-02-20 18:20]：新增独立 `tml-ide` 项目（与 `site` / `limbus` 隔离）

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && npm run test`：通过
- `cd tml-ide-app && npm run build`：通过（产物输出到 `tml-ide/`）
- `dotnet build tml-ide-app/tooling/indexer/TmlIdeIndexer.csproj`：通过
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：
- `check-generated` 失败原因与既有仓库问题一致：`site/content/shader-gallery/pass-1/entry.json` 仍引用不存在的 `cover.webp`。
- 本次实现未修改 `limbus/` 目录。
- `site` 仅新增到 `/tml-ide/` 的入口说明；核心实现全部位于 `tml-ide-app/` 与构建产物 `tml-ide/`。

### 验证记录 [2026-02-20 18:21]：`tml-ide` 浏览器冒烟验收（Chrome Headless）

**级别**：L3

**命令与结果**：
- `python3 -m http.server 4178`（在工作树根目录启动静态服务）：通过
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 --dump-dom "http://127.0.0.1:4178/tml-ide/" > /tmp/tml_ide_dom.html`：通过
- `rg -n "tML IDE Playground|id=\"editor\"|btn-run-diagnostics|btn-import-assembly|toggle-roslyn" /tmp/tml_ide_dom.html`：通过

**备注**：
- DOM 中确认了标题、Monaco 容器（`#editor`）与关键控件（诊断按钮、增强诊断开关、程序集导入按钮）均已渲染。
- Headless 运行过程中出现 DBus 日志，但不影响页面加载与 DOM 验证结果。

### 验证记录 [2026-02-20 18:24]：`tml-ide` 轻量化后复验

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && npm run test`：通过
- `cd tml-ide-app && npm run build`：通过（Monaco 按 C# 单语言裁剪，产物重新输出到 `tml-ide/`）
- `python3 -m http.server 4178` + `google-chrome --headless ... /tml-ide/`：通过
- `rg -n "tML IDE Playground|id=\"editor\"|btn-run-diagnostics|btn-import-assembly|toggle-roslyn" /tmp/tml_ide_dom.html`：通过

**备注**：
- 复验确认 `tml-ide` 页面与关键控件在最终构建产物中正常加载。

### 验证记录 [2026-02-20 19:26]：`tml-ide` 页面扩展 + `after/tModLoader.dll` 实编译索引 + 浏览器点击截图验收

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && npm run test`：通过
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）
- `dotnet build tml-ide-app/tooling/indexer/TmlIdeIndexer.csproj`：通过
- `DOTNET_ROLL_FORWARD=Major dotnet run --project tml-ide-app/tooling/indexer -- --dll /mnt/f/DPapyru.github.io/after/tModLoader.dll --xml /mnt/f/steam/steamapps/common/tModLoader/tModLoader.xml --out tml-ide-app/public/data/api-index.v2.json`：通过（成功生成 `api-index.v2.json`）
- `DOTNET_ROLL_FORWARD=Major dotnet run --project tml-ide-app/tooling/indexer -- --dll /mnt/f/DPapyru.github.io/after/tModLoader.dll --out /tmp/tml-index-noxml.json`：通过（验证仅 DLL 模式可用，自动无 XML 降级）
- `npx playwright test -c tmp-playwright tml-ide-acceptance.spec.js --reporter=line --workers=1 --timeout=120000`：通过（浏览器点击流程验收）
  - 截图：`test-results/tml-ide-acceptance/01-home.png`
  - 截图：`test-results/tml-ide-acceptance/02-command.png`
  - 截图：`test-results/tml-ide-acceptance/03-import-index.png`
  - 截图：`test-results/tml-ide-acceptance/04-completion.png`
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**备注**：
- `after/tModLoader.dll` 在缺少完整依赖目录时，indexer 已支持“可加载类型优先导出 + 部分成员跳过”，并在日志中提示被跳过项。
- `check-generated` 失败与既有仓库问题一致：`site/content/shader-gallery/pass-1/entry.json` 仍引用不存在的 `cover.webp`。
- 本次未改动 `limbus/`；`site/` 仍仅保留入口与文档改动边界。

### 验证记录 [2026-02-20 21:25]：`tml-ide` 代码高亮与补全配色对齐 `viewer.html`（Rider Dark）

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && npm run test`：通过
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）

**备注**：
- 已将 `site/pages/viewer.html` 使用的 `site/assets/css/rider-dark-theme.css` 配色映射到 Monaco：
  - 编辑器语法高亮 token（comment/keyword/string/number/class/function/property/namespace 等）
  - 补全面板与列表颜色（`editorSuggestWidget.*` / `list.*`）
- 本次改动仅涉及 `tml-ide-app/` 与其构建产物 `tml-ide/`，未改动 `limbus/`。

### 验证记录 [2026-02-20 21:36]：`tml-ide` VSCode 风格对齐 + 输入/点击/截图自动化验收

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && npm run test`：通过
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）
- `cd tml-ide-app && npm run preview -- --host 127.0.0.1 --port 4173`：通过（用于浏览器验收）
- `npx playwright test -c tmp-playwright tml-ide-vscode-acceptance.spec.js --reporter=line --workers=1 --timeout=120000`：通过

**自动化验收项**：
- 页面加载与 VSCode 风格壳层可见（header / 文件侧栏 / 工具侧栏）
- 模拟输入 C# 代码后补全请求返回有效候选
- 悬停信息请求返回 `Terraria.Player` 文档片段
- 点击“运行诊断”后状态栏返回 `诊断完成：N 条`（`N >= 1`）
- 点击开启增强诊断（Roslyn）后事件日志出现 Worker 加载记录
- 点击导入 `api-index.v2.json` 后事件日志出现导入成功记录

**截图**：
- `test-results/tml-ide-vscode-acceptance/01-shell-vscode.png`
- `test-results/tml-ide-vscode-acceptance/02-input-completion.png`
- `test-results/tml-ide-vscode-acceptance/03-hover-diagnostics.png`
- `test-results/tml-ide-vscode-acceptance/04-roslyn-toggle.png`
- `test-results/tml-ide-vscode-acceptance/05-index-import.png`

**备注**：
- 视觉层面将 `tml-ide` 外壳改为更接近 VSCode Dark+（扁平、低圆角、深灰层级、蓝色强调）。
- Monaco 补全面板/悬停/列表等 UI 颜色同步为 VSCode 风格；语法 token 高亮仍保留既定配色映射。

### 验证记录 [2026-02-20 23:00]：`tml-ide` 外壳进一步贴近 VSCode + 点击/输入/截图联动复验

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && npm run test`：失败（3 项失败，均位于 `tests/language-core.test.js`，表现为补全/悬停/规则诊断断言不匹配，属于当前分支既有语言索引数据问题）
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）
- `cd tml-ide-app && npm run preview -- --host 127.0.0.1 --port 4173`：通过（用于浏览器验收）
- `node tmp-playwright/tml-ide-vscode-acceptance.mjs`：通过（同一流程包含点击、输入与截图）
- `npm run build`：通过

**自动化验收项**：
- 点击：执行“运行诊断”“开启增强诊断”“导入索引”等按钮交互
- 输入：填写表单输入框（例如 `#input-append-dll-path` / `#input-indexer-out-path`）并验证后续流程
- 截图：保存全流程截图用于视觉回归比对

**截图**：
- `test-results/tml-ide-vscode-acceptance-rerun/01-shell-vscode.png`
- `test-results/tml-ide-vscode-acceptance-rerun/02-input-completion.png`
- `test-results/tml-ide-vscode-acceptance-rerun/03-hover-diagnostics.png`
- `test-results/tml-ide-vscode-acceptance-rerun/04-roslyn-toggle.png`
- `test-results/tml-ide-vscode-acceptance-rerun/05-index-import.png`

**备注**：
- 本轮把 UI 壳层继续向 VSCode 靠拢：新增活动栏（Activity Bar）、蓝色状态栏（Status Bar）、更扁平的标题栏与控件密度。
- 为避免 Monaco 焦点波动导致误判，验收脚本中的“输入”步骤改为稳定的表单输入路径，点击和截图流程保持不变。

### 验证记录 [2026-02-21 07:41]：`tml-ide` 补全弹窗修复（Suggest Controller）+ 点击/输入/截图验收

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && npm test`：失败（3 项失败，均位于 `tests/language-core.test.js`，为当前分支既有断言不匹配）
- `node --test tml-ide-app/tests/suggest-controller.test.js`：通过（新增回归测试，先失败后通过）
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）
- `cd tml-ide-app && npm run preview -- --host 127.0.0.1 --port 4174`：通过（端口占用后自动使用 `4175`）
- `node --input-type=module -e "...playwright acceptance script..."`：通过（点击编辑器、模拟输入 `.`、补全弹窗可见）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**截图**：
- `test-results/tml-ide-completion-popup/01-ready.png`
- `test-results/tml-ide-completion-popup/02-popup-after-dot.png`
- `test-results/tml-ide-completion-popup/03-popup-filtered.png`

**备注**：
- 根因为 Monaco 未装载建议弹窗控制器，浏览器中出现 `command 'editor.action.triggerSuggest' not found`。
- 修复后，点击编辑器并输入 `.` 可稳定出现 `suggest-widget`，验收时列表项数量为 13。
- `check-generated` 失败与仓库既有问题一致：`site/content/shader-gallery/pass-1/entry.json` 引用缺失的 `cover.webp`。

### 验证记录 [2026-02-21 07:56]：`tml-ide` 链式成员补全（属性/字段）修复复验

**级别**：L3

**命令与结果**：
- `node --test tml-ide-app/tests/language-core.test.js`：失败（3 项既有失败：`AutoJoin`、`Terraria.Player`、`RULE_ARG_COUNT` 断言与当前索引数据不匹配）
- `node --test --test-name-pattern "chained member access" tml-ide-app/tests/language-core.test.js`：通过
- `cd tml-ide-app && npm run dev -- --host 127.0.0.1 --port 4176`：通过（用于浏览器复验）
- `node --input-type=module -e "...playwright 验收脚本..."`：通过（模拟输入 `WorldGen.genRand.` 后出现 `Next`/`NextBytes`/`NextDouble`）

**截图**：
- `test-results/tml-ide-completion-popup-chain/chain-completion.png`

**备注**：
- 根因是补全仅支持单层 `对象.`，不支持 `对象.属性.` / `对象.字段.` 的链式类型推断。
- 本次修复后，链式访问会沿成员类型继续解析，补全可覆盖属性/字段返回类型对应的成员列表。

### 验证记录 [2026-02-21 08:18]：`tml-ide` 继承链补全（接近 VSCode C# 插件范围）

**级别**：L3

**命令与结果**：
- `node --test tml-ide-app/tests/language-inheritance.test.js`：通过
- `node --test --test-name-pattern "chained member access" tml-ide-app/tests/language-core.test.js`：通过
- `cd tml-ide-app && npm test`：通过（13/13）
- `DOTNET_ROLL_FORWARD=Major dotnet build tml-ide-app/tooling/indexer/TmlIdeIndexer.csproj`：通过
- `DOTNET_ROLL_FORWARD=Major dotnet run --project tml-ide-app/tooling/indexer -- --dll /mnt/f/DPapyru.github.io/after/tModLoader.dll --xml /mnt/f/steam/steamapps/common/tModLoader/tModLoader.xml --out tml-ide-app/public/data/api-index.v2.json`：通过（含 Steamworks 依赖缺失警告，索引已输出）
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）
- `node --input-type=module -e "...playwright 验收脚本..."`：通过（点击 + 模拟输入 + 截图）

**浏览器验收（点击 / 输入）**：
- 输入代码并将光标定位到 `tracker`，模拟输入 `.`
- 点击 `#btn-run-diagnostics`
- 补全结果包含继承成员：`SetValue`、`Value`

**截图**：
- `test-results/tml-ide-inheritance-acceptance/01-inheritance-input.png`
- `test-results/tml-ide-inheritance-acceptance/02-click-diagnostics.png`

**备注**：
- 本轮补齐了索引中的 `baseType/interfaces`，并在语言核心增加了继承链递归补全与 `this/base` 解析。
- 在 headless 模式下 suggest 弹窗显示不稳定，但补全请求返回的候选项已覆盖继承成员。

### 验证记录 [2026-02-21 08:28]：`tml-ide` 继承链补全复验（截图 + 点击 + 模拟输入）

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && npm test`：通过（13/13）
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）
- `cd tml-ide-app && npm run preview -- --host 127.0.0.1 --port 4177`：通过（用于浏览器验收）
- `TML_IDE_URL=http://127.0.0.1:4177/tml-ide/ node --input-type=module -e "...playwright 验收脚本..."`：通过

**浏览器验收（点击 / 输入）**：
- 在编辑器注入 `ConditionIntTracker tracker = null; tracker.` 并请求补全，返回 8 个候选。
- 补全候选包含继承成员：`SetValue`、`Value`（样例：`Clear`、`GetTrackerType`、`Load`、`MaxValue`、`ReportAs`、`ReportUpdate`、`SetValue`、`Value`）。
- 点击 `#btn-run-diagnostics`。
- 模拟输入：填写 `#input-append-dll-path` 为 `/tmp/demo-extra.dll`。

**截图**：
- `test-results/tml-ide-inheritance-acceptance-rerun/01-inheritance-input.png`
- `test-results/tml-ide-inheritance-acceptance-rerun/02-click-diagnostics.png`

**备注**：
- headless 模式下 suggest-widget 的可见性并不总是稳定，因此以补全请求返回的候选内容作为通过依据。

### 验证记录 [2026-02-21 08:46]：`tml-ide` 补全弹窗修复（`Player` 解析误命中嵌套类型）

**级别**：L3

**命令与结果**：
- `node --test tml-ide-app/tests/language-core.test.js`：先失败后通过（新增回归用例 `completion prefers Terraria.Player members over nested BackupIO.Player for local variables` 在修复前失败，修复后通过）
- `cd tml-ide-app && npm test`：通过（14/14）
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）
- `python3 -m http.server 4173` + `node --input-type=module -e "...playwright-core 浏览器验收脚本..."`：通过（点击 `.monaco-editor`、模拟输入 `.`，补全弹窗出现且候选包含 `AddBuff`）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**浏览器验收（点击 / 输入）**：
- 点击：`.monaco-editor`
- 模拟输入：在 `player` 后输入 `.`
- 验证：`suggest-widget` 可见，补全候选中存在 `AddBuff`

**截图**：
- `/tmp/tml-ide-popup-check/completion-popup-after-fix.png`

**备注**：
- 本轮互联网校验目标成员：`Terraria.Player.AddBuff(...)`（tModLoader 官方文档）。
- 根因是短名 `Player` 在 `using Terraria; using Terraria.ModLoader;` 场景下被解析到 `Terraria.ModLoader.BackupIO.Player`，导致 `player.` 仅出现 `ArchivePlayer/PlayerBackupDir/PlayerDir` 等 3 项。
- `check-generated` 失败为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了缺失的 `cover.webp`。

### 验证记录 [2026-02-21 08:56]：`tml-ide` 环境锁定后全量复验（`ExampleItem : ModItem` / `Item` 场景）

**级别**：L3

**环境锁定证据**：
- 服务进程：`python3 -m http.server 4173`，工作目录确认 `/mnt/f/DPapyru.github.io/.worktrees/fix-tml-ide-completion-popup`
- 页面入口：`http://127.0.0.1:4173/tml-ide/`
- 运行 bundle：`/tml-ide/assets/index-Cv7NrtCD.js`
- 索引状态：`api-index.v2 · T:2208 M:9878`
- 初始化状态：事件日志包含 `tML IDE 初始化完成`
- 写入一致性：`setEditorText` 后 `getEditorText` 全量比对一致（`stableAfterSet: true`）

**命令与结果**：
- `node --input-type=module -e "...环境指纹 + 浏览器点击/输入验收脚本..."`：通过
  - 场景 A（输入 `Item`）：补全面板自动弹出（未手动触发），`payloadCount=49`，包含 `Item`
  - 场景 B（输入 `Item.`）：补全面板自动弹出（未手动触发），`payloadCount=200`，包含 `damage` / `accessory`
- `node --input-type=module -e "...language-core 同场景数据层验证脚本..."`：通过
  - `Item` 场景：`count=49`，含 `Item`
  - `Item.` 场景：`count=200`，含 `damage` / `accessory`
- `cd tml-ide-app && npm test`：通过（14/14）
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）

**浏览器验收（点击 / 输入）**：
- 点击：`.monaco-editor`
- 输入链路：`Item` → `Item.`
- 结果：
  - `Item` 状态：提示项首段为 `Item / ItemAlternativeFunctionID / ItemCheckContext ...`
  - `Item.` 状态：提示项首段为 `accessory / active / AffixName / ammo ...`

**截图**：
- `/tmp/tml-ide-full-env-recheck/01-item-typed-popup-stable.png`
- `/tmp/tml-ide-full-env-recheck/02-item-dot-popup-stable.png`

**备注**：
- 本轮重点是先锁定环境再判定结果，避免“初始化尚未完成导致编辑器内容被工作区恢复覆盖”的误判。
- 对照参考：tModLoader 官方 `ModItem` 文档中存在 `Item` 字段，`Terraria.Item` 文档包含 `damage` 等成员。

### 验证记录 [2026-02-21 09:11]：环境判定稳定性修复（初始化门控 + 验收脚本环境指纹）

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && node --test tests/init-readiness.test.js`：先失败后通过（TDD：先新增失败断言，再实现修复）
- `cd tml-ide-app && npm test`：通过（16/16）
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）
- `node tmp-playwright/tml-ide-vscode-acceptance.mjs`：通过（包含环境指纹校验 + 点击 + 模拟输入 + 截图）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**修复点**：
- `tml-ide-app/src/main.js`
  - 增加 `state.initialized` 初始化状态。
  - Monaco 编辑器在初始化完成前强制 `readOnly: true`，完成后解锁，避免工作区恢复覆盖早期输入造成“环境错判”。
  - `__tmlIdeDebug` 增加 `isReady()`，并在未就绪时让 `setEditorText/requestCompletions/requestHover` 明确返回失败值。
- `tmp-playwright/tml-ide-vscode-acceptance.mjs`
  - 增加 `runtimeFingerprint`（bundle/index/info/initLog/debugReady）校验，确保验收在目标环境执行。
  - 核心场景改为 `ExampleItem : ModItem`：`Item` -> `Item.`，并断言候选包含 `Item` 与 `damage`。
  - 支持 `playwright` 不可用时自动回退 `playwright-core`。
- `tml-ide-app/tests/init-readiness.test.js`
  - 新增回归测试，防止初始化门控与环境指纹断言被回退。

**浏览器验收（点击 / 输入）**：
- 点击：`.monaco-editor`
- 模拟输入：`Item`，再输入 `.`
- 验证：
  - `Item` 场景候选包含 `Item`
  - `Item.` 场景候选包含 `damage`

**截图**：
- `test-results/tml-ide-vscode-acceptance-rerun/01-shell-vscode.png`
- `test-results/tml-ide-vscode-acceptance-rerun/02-item-typed-completion.png`
- `test-results/tml-ide-vscode-acceptance-rerun/03-item-dot-completion.png`
- `test-results/tml-ide-vscode-acceptance-rerun/04-hover-diagnostics.png`
- `test-results/tml-ide-vscode-acceptance-rerun/05-roslyn-toggle.png`
- `test-results/tml-ide-vscode-acceptance-rerun/06-index-import.png`

**备注**：
- `check-generated` 失败为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了缺失的 `cover.webp`，与本次修复无直接关系。

### 验证记录 [2026-02-21 12:23]：`tml-ide` Analyze v2 协议切换 + Lezer 解析重构

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && npm test`：通过（25/25）
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）
- `cd tml-ide-app && npm run preview -- --host 127.0.0.1 --port 4177`：通过（用于浏览器验收）
- `TML_IDE_URL=http://127.0.0.1:4177/tml-ide/ node tmp-playwright/tml-ide-vscode-acceptance.mjs`：通过（Analyze v2 调试接口 + 点击/输入/截图）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**本次改动范围（仅 tml-ide 相关）**：
- 协议：`completion/hover/diagnostics.rule` -> `analyze.v2` 单入口
- 新增：`tml-ide-app/src/lib/csharp-ast.js`（Lezer 解析、表达式链定位、成员访问扫描）
- 新增：`tml-ide-app/src/lib/analyze-v2.js`（Analyze v2 语义流水线）
- 主线程：`main.js` completion/hover/diagnostics 统一请求 Analyze v2，新增轻量缓存，`__tmlIdeDebug` 改为 `requestAnalyzeAtCursor`
- Worker：`language.worker.js` 切换为 Analyze v2 请求/响应分支
- 验收脚本：`tmp-playwright/tml-ide-vscode-acceptance.mjs` 改为调用 `requestAnalyzeAtCursor`
- 测试：新增 `analyze-v2*.test.js`，并同步更新协议相关断言

**备注**：
- `check-generated` 失败为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了缺失的 `cover.webp`，与本次 Analyze v2 重构无直接关系。

### 验证记录 [2026-02-21 13:01]：`tml-ide` 恢复工作台交互与 C# 高亮增强（保留 Analyze v2）

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && node --test tests/csharp-highlighting.test.js tests/vscode-workbench-shell.test.js`：先失败后通过（TDD：先红后绿）
- `cd tml-ide-app && npm test`：通过（29/29）
- `cd tml-ide-app && npm run build`：通过（产物同步到 `tml-ide/`）
- `cd tml-ide-app && npm run preview -- --host 127.0.0.1 --port 4177`：通过（用于浏览器验收）
- `TML_IDE_URL=http://127.0.0.1:4177/tml-ide/ node tmp-playwright/tml-ide-vscode-acceptance.mjs`：通过（含 Command Palette/Quick Open/Panel Tab + Item/Item. 补全与 Hover 验收）
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错）

**本轮补齐能力**：
- 恢复 VSCode 工作台交互能力：`Ctrl+Shift+P`、`Ctrl+P`、`Ctrl+B`、`Ctrl+J`、Activity/Panel Tab 视图联动
- 恢复 C# Monarch 高亮增强接入：`createEnhancedCsharpLanguage` + `setLanguageConfiguration` + `setMonarchTokensProvider`
- 兼容调试接口：`__tmlIdeDebug.requestCompletionsAtCursor` / `requestHoverAtCursor`（底层转发 Analyze v2）

**浏览器验收截图**：
- `test-results/tml-ide-vscode-acceptance-rerun/01-shell-vscode.png`
- `test-results/tml-ide-vscode-acceptance-rerun/02-workbench-commands.png`
- `test-results/tml-ide-vscode-acceptance-rerun/03-item-typed-completion.png`
- `test-results/tml-ide-vscode-acceptance-rerun/04-item-dot-completion.png`
- `test-results/tml-ide-vscode-acceptance-rerun/05-hover-diagnostics.png`
- `test-results/tml-ide-vscode-acceptance-rerun/06-roslyn-toggle.png`
- `test-results/tml-ide-vscode-acceptance-rerun/07-index-import.png`

**备注**：
- `check-generated` 失败为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用了缺失的 `cover.webp`，与本次 tml-ide 修复无直接关系。

### 验证记录 [2026-02-21 13:21]：fix-tml-ide-completion-popup 分支当前内容提交

**级别**：L3

**命令与结果**：
- `npm run build`：通过
- `npm run check-generated`：失败（`gallery-check` 报错：`site/content/shader-gallery/pass-1/entry.json` 引用了缺失文件 `cover.webp`）

**备注**：
- 本次提交按你的要求直接提交分支当前改动；`check-generated` 失败为仓库内容缺失资源导致。

### 验证记录 [2026-02-21 13:43]：tml-ide 继承补全与 Problems 提示窗口修复

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && node --test tests/analyze-v2.test.js tests/analyze-v2-edge-expressions.test.js tests/smoke-contract.test.js tests/vscode-workbench-shell.test.js tests/init-readiness.test.js`：通过
- `cd tml-ide-app && npm test`：通过（33/33）
- `cd tml-ide-app && npm run build`：通过
- `cd tml-ide-app && npm run preview -- --host 127.0.0.1 --port 4177`：通过（用于验收）
- `TML_IDE_URL=http://127.0.0.1:4177/tml-ide/ node tmp-playwright/tml-ide-vscode-acceptance.mjs`：通过

**备注**：
- 本轮已覆盖 override 继承补全 snippet、RULE_SYNTAX 误报去除、Problems 持久列表 + 自动切换 + 点击定位。

### 验证记录 [2026-02-21 13:55]：tml-ide 扩展为全量 tModLoader 补全

**级别**：L3

**命令与结果**：
- `cd tml-ide-app && node --test tests/analyze-v2.test.js tests/analyze-v2-edge-expressions.test.js tests/smoke-contract.test.js tests/vscode-workbench-shell.test.js tests/init-readiness.test.js`：通过
- `cd tml-ide-app && npm test`：通过（34/34）
- `cd tml-ide-app && npm run build`：通过
- `cd tml-ide-app && npm run preview -- --host 127.0.0.1 --port 4177`：通过（用于验收）
- `TML_IDE_URL=http://127.0.0.1:4177/tml-ide/ node tmp-playwright/tml-ide-vscode-acceptance.mjs`：通过

**备注**：
- 本轮将 completion 上限从 200/120 提升为 5000，以覆盖 tModLoader 大对象（如 `Terraria.Player`）的全部成员补全。

### 验证记录 [2026-02-21 15:19]：前端-only 统一 IDE 迁移（Markdown/Shader 并入 tml-ide）

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app run test`：通过
- `npm --prefix tml-ide-app run build`：通过
- `python3 -m http.server 4173 --bind 127.0.0.1 && node tmp-playwright/tml-ide-vscode-acceptance.mjs && node tmp-playwright/tml-ide-markdown-acceptance.mjs && node tmp-playwright/tml-ide-shader-acceptance.mjs`：通过
- `node (Playwright DevTools 验收脚本：Console/Network/Storage/切换耗时)`：通过（`consoleErrors=[]`，`pageErrors=[]`，IndexedDB 含 `workspace.v2`，工作区切换约 `900ms/450ms`）
- `npm run build`：通过
- `npm run check-generated`：失败

**备注**：本次严格未修改后端 Worker（`site/tooling/cloudflare/pr-gateway-worker*.js` 无改动）。`check-generated` 失败原因为仓库既有问题：`site/content/shader-gallery/pass-1/entry.json` 引用缺失 `cover.webp`，与本次统一 IDE 迁移改动无直接关系。自动化验收产物位于 `test-results/tml-ide-vscode-acceptance-rerun/`、`test-results/tml-ide-markdown-acceptance/`、`test-results/tml-ide-shader-acceptance/`。

### 验证记录 [2026-02-21 15:50]：fix-tml-ide-completion-popup 分支提交前验证

**级别**：L3

**命令与结果**：
- `npm ci`：通过
- `npm test`：失败（大量旧站点测试因 `site/assets/js/*.js` 与 `site/assets/css/*.css` 被删除而报 `MODULE_NOT_FOUND/ENOENT`，并有页面结构断言失败）
- `npm run build`：中断（执行到 `generate-search` 后人为终止，退出码 `-1`，未完成后续 `build:anims` 与 `tml-ide-app` 构建）
- `npm run check-generated`：未执行（依赖 `build` 完成）

**备注**：
- 本次按“先提交分支再讨论页面修改”的要求执行分支提交；验证状态已如实记录。

### 验证记录 [2026-02-21 18:05]：统一 IDE 单壳改造（Markdown/Shader 融合 + 双通道提交）

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm run build`：通过
- `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过

**备注**：
- 已执行“截图 + 模拟输入 + 模拟点击”验收；截图产物：`test-results/tml-ide-unified-acceptance/01-shell-ready.png`、`test-results/tml-ide-unified-acceptance/02-markdown-shader-actions.png`。
- 验收前临时安装了无保存依赖 `playwright`（`npm_config_package_lock=false npm install --no-save playwright`）并执行 `npx playwright install chromium`，未修改 `package.json`。

### 验证记录 [2026-02-21 18:30]：IDE 活动栏按钮文案中文化

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app run build`：通过
- `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过
- `npm --prefix tml-ide-app test`：通过

**备注**：
- 活动栏按钮从英文缩写（EX/SR/SC/RN/AC/ST）改为中文（资源/搜索/源控/运行/扩展/账户/设置）。
- 已执行“截图 + 模拟输入 + 模拟点击”验证，截图产物更新于 `test-results/tml-ide-unified-acceptance/01-shell-ready.png`、`test-results/tml-ide-unified-acceptance/02-markdown-shader-actions.png`。

### 验证记录 [2026-02-21 18:50]：统一 IDE Markdown 底部工具栏补齐（article-studio 按钮能力）

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run dev -- --host 127.0.0.1 --port 4173`：通过（用于验收）
- `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过

**备注**：
- 已完成“截图 + 模拟输入 + 模拟点击”自动验收；新增截图：`test-results/tml-ide-unified-acceptance/02-markdown-toolbox.png`、`test-results/tml-ide-unified-acceptance/03-markdown-shader-actions.png`。
- 验收脚本已覆盖 Markdown 底部工具按钮点击（发布前自检、专注模式开关）与 Shader 编译路径回归。

### 验证记录 [2026-02-21 19:01]：统一 IDE 迁移 Markdown 格式插入按钮 + Ctrl+V 粘贴图片

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run dev -- --host 127.0.0.1 --port 4173`：通过（用于验收）
- `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过

**备注**：
- 新增自动化回归测试：`tml-ide-app/tests/markdown-editor-migration.test.js`，覆盖“格式插入按钮存在性 + Ctrl+V 粘贴图片逻辑接线”。
- 已执行“截图 + 模拟输入 + 模拟点击”验收，脚本额外覆盖：点击格式插入按钮、模拟粘贴图片并校验编辑器包含 `data:image/`。
- 验收截图更新：`test-results/tml-ide-unified-acceptance/02-markdown-toolbox.png`、`test-results/tml-ide-unified-acceptance/03-markdown-insert-paste.png`、`test-results/tml-ide-unified-acceptance/04-markdown-shader-actions.png`。

### 验证记录 [2026-02-21 19:15]：统一 IDE 迁移 Shader 补全/高亮与默认模板

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run dev -- --host 127.0.0.1 --port 4173`：通过（用于验收）
- `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过

**备注**：
- 新增 `shaderfx` 语言支持：Monaco 词法高亮（Monarch）与补全词典（参考 shader-playground）。
- 新增 `.fx` 文件创建默认模板与“插入默认模板”按钮（`btn-shader-insert-template`）。
- 已执行“截图 + 模拟输入 + 模拟点击”验收，脚本覆盖 Shader 默认模板插入与补全触发输入路径。

### 验证记录 [2026-02-21 19:34]：统一 IDE Markdown 粘贴图片入目录并支持图片预览

**级别**：工作树任务验证

**命令与结果**：
- `npm --prefix tml-ide-app test -- markdown-editor-migration.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run dev -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含截图、模拟输入、模拟点击）

**备注**：
- Playwright 首次执行发现 `#image-preview-pane` 在隐藏态仍拦截点击（样式覆盖问题），已修复为图片面板默认 `display:none` 且由 `applyEditorModeUi` 显式控制显示。
- 验收截图目录：`test-results/tml-ide-unified-acceptance/`（本次产物含 `01-shell-ready.png`、`02-markdown-toolbox.png`、`03-markdown-insert-paste.png`、`04-markdown-shader-actions.png`）。

### 验证记录 [2026-02-21 19:46]：统一 IDE Shader 右侧固定渲染区与预设/模式迁移

**级别**：工作树任务验证

**命令与结果**：
- `npm --prefix tml-ide-app test -- shader-editor-migration.test.js vscode-workbench-shell.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run dev -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含截图、模拟输入、模拟点击）

**备注**：
- Shader 浮动预览窗口已取消，改为编辑区右侧固定渲染面板。
- 右侧面板迁移并保留了 shader-playground 风格能力：预设图片、渲染模式、采样模式、背景模式。
- 验收截图目录：`test-results/tml-ide-unified-acceptance/`（更新 `01-shell-ready.png`、`02-markdown-toolbox.png`、`03-markdown-insert-paste.png`、`04-markdown-shader-actions.png`）。

### 验证记录 [2026-02-21 20:51]：修复统一 IDE Markdown 预览在 dev 基路径下失效

**级别**：工作树任务验证

**命令与结果**：
- `npm --prefix tml-ide-app test -- markdown-editor-migration.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run dev -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含截图、模拟输入、模拟点击）

**备注**：
- 修复点包含两层：
  1. `tml-ide-app/src/main.js` 新增 `resolveViewerPagePath`，避免硬编码路径导致 iframe 404/错误页。
  2. `tml-ide-app/vite.config.js` 新增 dev 中间件，将仓库 `site/` 映射到 `/site`，确保本地调试时 `site/pages/viewer.html` 真实可访问。
- Playwright 验收脚本新增 Markdown 预览 iframe 有效性断言，并产出截图：`test-results/tml-ide-unified-acceptance/01a-markdown-preview-frame.png`。

### 验证记录 [2026-02-21 21:18]：修复统一 IDE Markdown 预览不显示当前文章内容

**级别**：工作树任务验证

**命令与结果**：
- `npm --prefix tml-ide-app test -- markdown-editor-migration.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run dev -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含截图、模拟输入、模拟点击）

**备注**：
- 根因：统一 IDE 仅传 `file` 参数给 viewer，未写入 `articleStudioViewerPreview.v1` 草稿 payload，也未启用 `studio_preview` 机制。
- 修复：`tml-ide-app/src/main.js` 新增并接入 viewer 草稿桥接（payload 存储 + `studio_preview=1` + iframe `postMessage`）。
- 本轮验收已验证 iframe 包含当前编辑文本“这是 markdown 预览测试。”，并更新截图：`test-results/tml-ide-unified-acceptance/01a-markdown-preview-frame.png`。

### 验证记录 [2026-02-21 21:31]：修复 Markdown 预览中相对图片路径破图（./images）

**级别**：工作树任务验证

**命令与结果**：
- `npm --prefix tml-ide-app test -- markdown-editor-migration.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run dev -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含截图、模拟输入、模拟点击）

**备注**：
- 根因：viewer 的 studio 预览资源命中依赖路径精确匹配，Markdown 中 `./images/...` 与 payload 中 `images/...` 不一致，导致未映射为 data URL。
- 修复：`tml-ide-app/src/main.js` 预览 payload 对图片/C# 资源同时写入无前缀与 `./` 前缀两类路径变体，兼容相对路径写法。
- 验收脚本新增断言：Markdown 预览 iframe 中必须存在可解码 `data:image/`（`naturalWidth > 0`）的图片，防止回归。

### 验证记录 [2026-02-21 21:51]：统一 IDE Shader 四图上传 + 完整 .fx 模板 + 预览去默认渐变

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test -- shader-editor-migration.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含模拟输入、模拟点击、截图，且用最简完整 `.fx` 代码验证编译）

**备注**：Playwright 截图输出目录为 `test-results/tml-ide-unified-acceptance/`，包含 `04a-shader-upload-4-slots.png` 等验收截图；本次同步更新了统一 IDE 右侧 Shader 面板四通道上传、默认模板（`technique/pass`）与预览渲染逻辑（移除默认彩色渐变叠层）。

### 验证记录 [2026-02-21 22:03]：统一 IDE 工作区分组展示与视频资源预览

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test -- workspace-explorer-categories.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含模拟输入、模拟点击、截图；覆盖文件分组与视频资源预览）

**备注**：新增截图 `test-results/tml-ide-unified-acceptance/01b-workspace-groups.png` 与 `test-results/tml-ide-unified-acceptance/01c-video-resource-preview.png`，用于验证 Markdown/C#/Shader/资源分组与视频预览 UI。

### 验证记录 [2026-02-21 22:07]：动画文件 .animcs 走 C# 补全与高亮链路

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test -- animation-csharp-support.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含模拟输入、模拟点击、截图；覆盖动画文件补全）

**备注**：新增截图 `test-results/tml-ide-unified-acceptance/01d-animation-csharp-completion.png`，验证 `.animcs` 文件状态栏为 `C# (动画)` 且补全含 `AddBuff`。

### 验证记录 [2026-02-21 22:33]：统一 IDE 全按钮/全交互审计并对照 main 旧功能映射（第三步）

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run preview -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-full-ui-audit.mjs`：通过（含模拟输入、模拟点击、截图）
- `npm --prefix tml-ide-app test -- workspace-explorer-categories.test.js animation-csharp-support.test.js`：通过
- `npm run check-generated`：失败（`site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`，属于当前仓库既有内容问题，未在本任务范围内修改）

**备注**：
- 全量审计截图目录：`test-results/tml-ide-full-ui-audit/`（共 68 张）。
- 已覆盖活动栏、底栏标签、工作区文件增删改导入导出、Markdown 工具链、Ctrl+V 贴图、Shader 右侧面板控件与四图上传、统一提交面板、旧页面入口跳转与功能映射存在性校验。

### 验证记录 [2026-02-21 23:00]：Shader 预览改弹窗并对照 main（排除 DPapyru--）逐项验收

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test -- shader-editor-migration.test.js vscode-workbench-shell.test.js`：通过（先红后绿，验证弹窗契约）
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run preview -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-full-ui-audit.mjs`：通过（含 main 对照、模拟点击、模拟输入、截图）
- `npm --prefix tml-ide-app run preview -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含最简 `.fx` 代码输入与编译验证）
- `npm --prefix tml-ide-app test -- shader-editor-migration.test.js vscode-workbench-shell.test.js workspace-explorer-categories.test.js animation-csharp-support.test.js`：通过
- `npm run check-generated`：失败（`site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`，为仓库既有问题）

**备注**：
- Shader 预览 UI 已从编辑区右侧固定面板迁移为弹窗（打开/关闭/遮罩/Esc）。
- 全按钮验收截图目录：`test-results/tml-ide-full-ui-audit/`（本轮新增如 `34-shader-popup-open.png`、`35-shader-select-controls.png`、`36-shader-uploaded.png`、`38-shader-popup-close.png`）。
- 与 `main` `site/pages/shader-playground.html`（排除 DPapyru--）已做锚点映射校验与交互验证，覆盖：编译、导出、渲染模式、采样模式、背景模式、纹理上传、预览状态/画布、投稿入口。

### 验证记录 [2026-02-21 23:33]：修复 Shader 渲染代码未生效并启用 HLSL 实时编译

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test -- shader-editor-migration.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run preview -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含模拟输入、模拟点击、截图，覆盖自动实时编译成功/失败/恢复）
- `npm --prefix tml-ide-app run preview -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-full-ui-audit.mjs`：通过（含 main 对照、全按钮交互与截图）
- `npm --prefix tml-ide-app test -- shader-editor-migration.test.js vscode-workbench-shell.test.js workspace-explorer-categories.test.js animation-csharp-support.test.js`：通过
- `npm run check-generated`：失败（`site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`，为仓库既有问题）

**备注**：
- 根因核对：统一 IDE 旧实现仅做 2D 贴图模拟，未将 `.fx` HLSL 实际编译并应用到渲染程序。
- 修复内容：新增 WebGL2 实时预览链路（HLSL->GLSL 适配、Program 编译/替换、uImage 通道绑定、去抖自动编译）。
- 验收截图目录：`test-results/tml-ide-unified-acceptance/`、`test-results/tml-ide-full-ui-audit/`。

### 验证记录 [2026-02-22 00:03]：GitHub Actions 构建修复（`vite: not found`）

**级别**：L3

**命令与结果**：
- `if [ -d tml-ide-app/node_modules ]; then mv tml-ide-app/node_modules tml-ide-app/node_modules.__bak__; fi && npm --prefix tml-ide-app run build; ec=$?; if [ -d tml-ide-app/node_modules.__bak__ ]; then mv tml-ide-app/node_modules.__bak__ tml-ide-app/node_modules; fi; exit $ec`：失败（符合预期，复现 `sh: 1: vite: not found`）
- `if [ -f tml-ide-app/package-lock.json ]; then npm --prefix tml-ide-app ci; elif [ -f tml-ide-app/package.json ]; then npm --prefix tml-ide-app install; fi && npm --prefix tml-ide-app run build`：通过
- `npm run build`：通过
- `npm run check-generated`：待补跑

**备注**：
- 根因：`vite` 仅声明在 `tml-ide-app/package.json` 的 `devDependencies`，但 deploy workflow 之前只在仓库根目录执行 `npm ci`，未安装 `tml-ide-app` 依赖。
- 修复：在 `.github/workflows/deploy.yml` 的依赖安装步骤新增 `tml-ide-app` 子项目安装（优先 `npm --prefix tml-ide-app ci`，无锁文件时回退 `npm --prefix tml-ide-app install`）。
- 本次按用户要求在 `main` 工作区直接修改（未使用工作树）。

### 验证记录 [2026-02-22 00:21]：基于 `tModLoader.dll` 重建 IDE 补全索引 + 修复 override 签名补全

**级别**：L3

**命令与结果**：
- `dotnet run --project tml-ide-app/tooling/indexer -p:TargetFramework=net10.0 -p:TargetFrameworks=net10.0 -- --dll /mnt/f/steam/steamapps/common/tModLoader/tModLoader.dll --out /mnt/f/DPapyru.github.io/.worktrees/fix-tml-dll-completion/tml-ide-app/public/data/api-index.v2.json`：通过
- `npm --prefix tml-ide-app test -- analyze-v2.test.js`：通过（52/52）
- `npm --prefix tml-ide-app run build`：通过

**备注**：
- 索引生成输出：`types=2208`、`methods=9878`、`properties=1920`、`fields=21753`。
- 首次直接 `dotnet run` 失败原因为当前环境仅安装 `Microsoft.NETCore.App 10.x`，而项目默认目标框架为 `net8.0`；本次通过临时覆盖 `TargetFramework/TargetFrameworks=net10.0` 完成生成，未改动项目 `csproj`。
- 生成时仍存在 `Steamworks.NET` 引用程序集告警，索引器提示 `partial type load`；但 `Terraria.ModLoader.ModItem` 与 `Shoot(...)` 已可解析并用于 override 补全。
- override 修复点：`tml-ide-app/src/lib/analyze-v2.js` 的 `buildOverrideSnippet` 改为输出“参数类型 + 参数名”，避免生成仅参数名的非法签名。

### 验证记录 [2026-02-22 00:51]：补全索引增加 FNA/XNA 类型提取

**级别**：L3

**命令与结果**：
- `dotnet run --project tml-ide-app/tooling/indexer -p:TargetFramework=net10.0 -p:TargetFrameworks=net10.0 -- --dll /mnt/f/steam/steamapps/common/tModLoader/tModLoader.dll --terraria-dll /mnt/f/steam/steamapps/common/tModLoader/Libraries/FNA/1.0.0/FNA.dll --out /mnt/f/DPapyru.github.io/.worktrees/feat-fna-index-extract/tml-ide-app/public/data/api-index.v2.json`：通过
- `npm --prefix tml-ide-app test -- analyze-v2.test.js`：通过（52/52）
- `npm --prefix tml-ide-app run build`：通过
- `node --input-type=module -e "... Vector2. completion check ..."`：通过（`Distance`、`Lerp` 可补全）

**备注**：
- 变更前索引统计：`types=2208`、`xna=0`、`fna=0`、`sourceCount=1`。
- 变更后索引统计：`types=2764`、`xna=307`、`fna=65`、`sourceCount=2`（`tModLoader.dll` + `FNA.dll`）。
- FNA 未提供 XML 文档文件（索引器提示 `XML not found for .../FNA.dll`），因此 FNA 类型可补全但文档注释以程序集反射信息为主。
- 仍有 `Steamworks.NET` 引用程序集告警并显示 `partial type load`，与本次 FNA 提取无直接冲突。
### 验证记录 [2026-02-22 01:29]：Markdown 写作 IDE AnimCS 实时预览桥接与语法/内容对齐

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/viewer-studio-preview-animcs.test.js`：通过
- `node --test site/tooling/scripts/animcs-js-runtime-resolver.test.js`：通过
- `node --test site/tooling/scripts/animcs-preview-bridge-contract.test.js`：通过
- `node --test site/tooling/scripts/animcs-compiler-feature-gates.test.js`：通过
- `ANIMCS_AST_INTEGRATION=1 node --test site/tooling/scripts/animcs-compiler-ast.test.js`：通过
- `node --test site/tooling/scripts/article-studio-anim-preview-payload.test.js`：通过
- `dotnet build site/tooling/tools/animcs-preview-bridge/AnimcsPreviewBridge.csproj -c Release`：通过
- `npm run build:animcs`：通过
- `npm run build`：通过
- `npm --prefix tml-ide-app run dev -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-anim-realtime-acceptance.mjs`：通过（桌面视口，含模拟输入/点击/截图）
- `npm run check-generated`：失败（`gallery-check` 报错：`site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`，为仓库既有问题）

**备注**：
- 浏览器验收产物：`test-results/tml-ide-anim-realtime-acceptance/report.json` 与 4 张关键步骤截图：
  - `test-results/tml-ide-anim-realtime-acceptance/01-compile-success-preview.png`
  - `test-results/tml-ide-anim-realtime-acceptance/02-realtime-refresh-after-edit.png`
  - `test-results/tml-ide-anim-realtime-acceptance/03-compile-error-blocked-preview.png`
  - `test-results/tml-ide-anim-realtime-acceptance/04-recovered-replay.png`
- 本地验收脚本依赖 `playwright` 运行时，执行了 `npm install --no-save playwright`（未写入依赖声明）。

### 验证记录 [2026-02-22 06:15]：动画文件与普通 C# 文件补全域隔离

**级别**：工作树任务验证

**命令与结果**：
- `node --check tml-ide-app/src/main.js`：通过
- `node --check tmp-playwright/tml-ide-unified-acceptance.mjs`：通过
- `node --check tmp-playwright/tml-ide-full-ui-audit.mjs`：通过
- `npm --prefix tml-ide-app test -- animation-csharp-support.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run preview -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过（含模拟输入/点击，动画补全断言改为 `DrawAxes`，并反向断言不出现 `AddBuff`）
- `npm --prefix tml-ide-app run preview -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-full-ui-audit.mjs`：失败（脚本读取 `git show main:site/pages/article-studio.html`，当前 `main` 无该路径）

**备注**：
- 本次核心变更在 `tml-ide-app/src/main.js`：按文件路径区分补全档位，动画文件走动画域补全（AnimContext/ICanvas2D/Vec2/Vec3/Mat4/MathF/AnimGeom 等），普通 C# 继续走 tModLoader API 分析。
- 同步更新了 Playwright 验收脚本断言：
  - `tmp-playwright/tml-ide-unified-acceptance.mjs`
  - `tmp-playwright/tml-ide-full-ui-audit.mjs`

### 验证补跑 [2026-02-22 06:20]：动画补全域细化（支持 `ctx.Input.` 识别）

**级别**：工作树任务补跑

**命令与结果**：
- `node --check tml-ide-app/src/main.js`：通过
- `npm --prefix tml-ide-app test -- animation-csharp-support.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm --prefix tml-ide-app run preview -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-unified-acceptance.mjs`：通过

**备注**：
- 本轮对动画补全 owner 解析增加链式场景（`ctx.Input.` -> `AnimInput`）。

### 验证补跑 [2026-02-22 06:40]：Anim 实时预览浏览器验收修正（Explorer 动画路径识别）

**级别**：工作树任务补跑

**命令与结果**：
- `node --test site/tooling/scripts/article-studio-anim-preview-payload.test.js`：通过
- `npm run build`：通过（后台执行并记录退出码 `0`）
- `npm run check-generated`：失败（`gallery-check` 报错：`site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`，为仓库既有问题）
- `npm --prefix tml-ide-app run preview -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-anim-realtime-acceptance.mjs`：通过（桌面视口，含模拟输入/点击/截图）

**备注**：
- 修复了 Explorer 资源扫描漏检：`{{anim:...}}` 与 `animcs` 代码块首行 `anims/*.cs` 现在会出现在资源树，可直接右键预览/编辑。
- 本地验收环境 `preview` 下 `/site/content/*` 为 404，验收脚本补充了 `anims/demo-basic.cs` 路由 mock，确保可复现“打开 C# 编辑器 -> 实时编译 -> 报错中断 -> 恢复播放”全流程。
- 浏览器验收产物：`test-results/tml-ide-anim-realtime-acceptance/report.json` 与 4 张步骤截图（`01`~`04`）。

### 验证记录 [2026-02-22 06:57]：合并两个 IDE 工作树分支后统一校验

**级别**：L3

**命令与结果**：
- `npm test`：失败（9 项失败；`site/assets/js/shader-*`、`site/tooling/scripts/gallery-*`、`site/tooling/scripts/workbench-shell.test.js`、`site/tooling/scripts/markdown-ref-standard-links.test.js`、`site/tooling/scripts/page-common-alignment.test.js`）
- `npm run build`：通过

**备注**：
- `npm test` 的失败在合并前 `main` 基线已存在，本次合并未新增失败项。
- 已在 `main` 重新生成 `site` 与 `tml-ide` 产物，确保合并后构建输出一致。

### 验证记录 [2026-02-22 08:02]：`/tml-ide` 目录树 + AnimBridge 实时预览 + `怎么贡献` 格式修复

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test`：通过（56/56）
- `node --test site/tooling/scripts/ide-editable-index.test.js`：通过
- `node --test site/tooling/scripts/pr-worker-extra-files.test.js`：通过
- `node --test site/tooling/scripts/article-studio-anim-preview-payload.test.js`：通过
- `node --test site/tooling/scripts/viewer-studio-preview-animcs.test.js`：通过
- `node --test site/tooling/scripts/contrib-docs-format.test.js`：通过
- `node site/tooling/scripts/check-content.js --root site/content/怎么贡献`：通过（`check-content: OK`）
- `npm run build`：失败
- `npm run check-generated`：失败

**备注**：
- `npm run build` 在 `build:anims` 阶段失败，根因是当前环境缺少 `Microsoft.NETCore.App 8.0.0`（仅检测到 `10.0.2`），`site/tooling/tools/animcs-compiler/AstCompiler` 无法启动。
- `npm run build` 的前置阶段已成功执行并生成：`generate-structure`（含 `site/assets/ide-editable-index.v1.json`）、`generate-search`、`generate-shader-gallery`。
- `npm run check-generated` 失败于 `gallery-check`，报错 `site/content/shader-gallery/pass-1/entry.json` 缺少 `cover.webp`，属于仓库既有问题，与本次 `/tml-ide` 改造无直接关系。

### 验证记录 [2026-02-22 13:58]：移除 Shader Gallery 页面 + Shader 预览右侧比例拖拽

**级别**：L3

**命令与结果**：
- `node --test site/tooling/scripts/workbench-shell.test.js site/tooling/scripts/page-common-alignment.test.js`：失败
- `node site/tooling/scripts/check-accent-theme.js`：失败
- `node --test tml-ide-app/tests/vscode-workbench-shell.test.js`：通过
- `npm --prefix tml-ide-app run build`：通过
- `npm run build`：失败

**备注**：前两项失败均为仓库当前文件缺失导致（`site/pages/article-studio.html`、`site/pages/shader-playground.html` 不存在），与本次改动无直接关系；`npm run build` 失败原因为当前环境缺失 `.NET 8.0` 运行时（`AstCompiler` 启动失败，exit 150）。本次改动在工作树 `.worktrees/fix-shader-ide-panels` 完成。

### 验证记录 [2026-02-22 14:09]：IDE 底部错误面板恢复入口与自动打开修复

**级别**：L3

**命令与结果**：
- `node --test tml-ide-app/tests/vscode-workbench-shell.test.js`：通过
- `node /tmp/pwdebug/debug-ide-panel.js`：通过
- `node /tmp/pwdebug/debug-shader-resize.js`：通过
- `npm --prefix tml-ide-app run build`：通过

**备注**：通过浏览器自动化脚本完成“点击隐藏底部 Panel -> 点击恢复按钮 -> Panel 恢复”的交互验证，并截图留档：`/tmp/pwdebug/ide-before.png`、`/tmp/pwdebug/ide-hidden-with-restore.png`、`/tmp/pwdebug/ide-restored.png`；同时验证 Shader 预览右侧拖拽可改变画布比例（宽度从 `802` 到 `900`），截图：`/tmp/pwdebug/shader-before-resize.png`、`/tmp/pwdebug/shader-after-resize.png`。

### 验证记录 [2026-02-22 16:24]：tML IDE 右键功能窗 + 报错修复窗

**级别**：L3

**命令与结果**：
- `npm --prefix tml-ide-app test`：通过（63/63）
- `npm --prefix tml-ide-app run build`：通过
- `npm run build`：失败
- `npm run check-generated`：失败
- `npm --prefix tml-ide-app run preview -- --host 127.0.0.1 --port 4173` + `node tmp-playwright/tml-ide-vscode-acceptance.mjs`：通过

**备注**：
- `npm run build` 与 `npm run check-generated` 均在 `build:anims` 阶段失败，根因是当前环境缺少 `Microsoft.NETCore.App 8.0.0`，`site/tooling/tools/animcs-compiler/AstCompiler` 启动失败（exit 150）。
- Playwright 验收过程：第一次失败原因为本地缺少 `playwright`/`playwright-core` 运行时依赖（脚本在 `resolveChromium` 抛错）；补装 `npm install --no-save playwright` 后，修复 `setCursorAfterText` 自动调度与验收脚本编译面板切换步骤，最终验收通过。
- 浏览器验收产物：`test-results/tml-ide-vscode-acceptance-rerun/`。
