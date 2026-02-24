# 当前工作树验收脚本规范统一计划（上下文收敛版）

## 1. Summary

- 范围仅覆盖当前工作树：`.worktrees/feat-shared-architecture-reset`。
- 不扩展到新架构讨论，不引入额外工程体系。
- 目标：统一 `tmp-playwright` 验收脚本规范，支持输入/点击、整页截图、统一 `report.json`、统一失败门槛。

## 2. Public Interfaces / Types

### 2.1 脚本入口参数（统一）

所有验收脚本支持以下参数：

- `--base-url`（默认 `http://127.0.0.1:4173`）
- `--run-id`（默认时间戳）
- `--update-baseline`（显式更新基线）
- `--allowlist`（console 白名单配置路径）

### 2.2 统一报告结构（`report.schema.v2`）

顶层字段：

- `schemaVersion`
- `runId`
- `baseUrl`
- `generatedAt`
- `status`
- `pages[]`

`pages[]` 字段：

- `pageId`
- `url`
- `scenarios[]`
- `console`
- `artifacts`

`scenarios[]` 字段：

- `id`
- `status`
- `steps[]`
- `assertions[]`
- `screenshot`
- `visualDiffPercent`
- `visualThresholdPercent`
- `baselinePath`
- `actualPath`
- `diffPath`

### 2.3 统一产物目录

- 运行产物：`test-results/fullpage-acceptance/<runId>/<pageId>/...`
- 基线产物：`test-baselines/fullpage/<pageId>/<scenarioId>.png`

## 3. Implementation Plan

1. 新建计划文档（本文件）。
2. 抽通用执行内核：
   - `tmp-playwright/lib/acceptance-runner.mjs`
   - `tmp-playwright/lib/visual-diff.mjs`
   - `tmp-playwright/config/console-allowlist.json`
3. 统一改造脚本：
   - `tmp-playwright/shared-viewer-acceptance.mjs`
   - `tmp-playwright/tml-ide-unified-acceptance.mjs`
   - 其它 `tmp-playwright/tml-ide-*.mjs` 统一到同一 runner 与报告契约
4. 增加统一命令（仅修改当前工作树的 `package.json`）：
   - `acceptance:fullpage`
   - `acceptance:fullpage:update-baseline`
   - `acceptance:fullpage:viewer`
   - `acceptance:fullpage:ide`
5. 统一失败门槛：
   - 白名单外 `console error`：失败
   - 视觉 diff > `0.8%`：失败
   - 场景断言失败或脚本异常：失败

## 4. Test Cases and Scenarios

### 4.1 Viewer 场景

- 输入侧栏搜索
- 点击目录项
- 点击 TOC 项
- 每步整页截图 + URL/hash 断言 + 视觉对比

### 4.2 Folder 场景

- 点击子目录
- 返回上级
- 点击文档节点
- 每步整页截图 + 路由断言 + 视觉对比

### 4.3 IDE 场景

- 新建/切换文件并输入
- 触发 markdown/shader/anim 关键交互
- 每步整页截图 + 面板状态断言 + 视觉对比

## 5. Git Plan

### 提交 1（Plan）

- 文件：`docs/plans/2026-02-24-acceptance-normalization-plan.md`
- 提交信息：`docs: 固化验收脚本规范统一方案`

### 提交 2（实现）

- 文件：
  - `tmp-playwright/lib/*`
  - `tmp-playwright/config/*`
  - `tmp-playwright/*.mjs`
  - `package.json`
- 提交信息：`test: 统一全页交互截图验收脚本与报告格式`

## 6. Assumptions / Defaults

- 默认本地验收服务可访问 `http://127.0.0.1:4173`。
- 视觉阈值默认 `0.8%`。
- 基线仅在显式参数 `--update-baseline` 下更新。
- `ERRORS.md` 的验证记录作为后续执行阶段动作。
