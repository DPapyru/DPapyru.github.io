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

*最后更新：2026-02-14*
