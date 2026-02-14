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

*最后更新：2026-02-14*
