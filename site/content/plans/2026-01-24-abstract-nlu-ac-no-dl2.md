# Abstract NLU (A+C) Without DL-2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Remove DL-2（浏览器端推理/ONNX/WASM）依赖，改用构建期 LSI/LSA（A）+ 规则约束（C）来显著提升抽象问题（路线/原理/模糊诉求）的命中率与不跑偏能力。

**Architecture:** 构建期用 `generate-index.js` 生成 `site/assets/semantic/guided-index.v1.json`（Randomized SVD / LSI）。运行期把“语义增强”改成：优先用 LSI 引擎（`GuidedLookupEngine`）召回/重排；再用规则约束（意图/实体硬词、路径惩罚、文档多样性、会话屏蔽）来防止跑偏；并与 BM25 段落召回做混合打分。

**Tech Stack:** Node.js（构建期生成索引），纯前端 JS（无后端），BM25 + trigram（`site/assets/js/bm25-lookup.js`）、LSI（`site/assets/js/guided-lookup.js`）、UI 在 `search-results.html`。

---

### Task 1: 移除 DL-2 相关代码与 UI 文案

**Files:**
- Delete: `site/assets/js/semantic-reranker.js`
- Modify: `search-results.html`

**Step 1: 删除 DL-2 入口脚本**
- 删除 `search-results.html` 中对 `site/assets/js/semantic-reranker.js` 的 `<script type="module">` 引用。

**Step 2: 删除 DL-2 状态监听逻辑**
- 在 `search-results.html` 的 `initSemanticControls()` 中移除：
  - `semantic-reranker:status` 事件监听
  - `window.SemanticReranker.*` 相关分支与报错文案

**Step 3: 更新“语义增强”文案**
- 统一表述为“语义增强（轻量语义，构建期生成，无需下载模型）”，避免用户误解为会下载大模型/需要推理后端。

**Step 4: 验证页面无控制台报错**
- Run: `npm test`
- Run: `npm run build`
- Expected: 通过；打开 `search-results.html` 无报错。

---

### Task 2: 固化 A（LSI/LSA）为语义增强的核心能力

**Files:**
- Modify: `generate-index.js`
- Modify: `site/assets/js/guided-lookup.js`
- Modify: `search-results.html`

**Step 1: 确认构建期 LSI 产物稳定**
- `generate-index.js` 当前已有 `generateGuidedSemanticIndex()` 且注释为 “Randomized SVD”，输出 `site/assets/semantic/guided-index.v1.json`。
- 调整输出字段时保持向后兼容（必要时 bump 版本号，例如 `guided-index.v2.json`，但优先复用 v1）。

**Step 2: 让 `GuidedLookupEngine` 支持会话屏蔽与规则加权（为 C 做准备）**
- 在 `site/assets/js/guided-lookup.js` 的 `search(query, options)` 支持：
  - `blockedDocs`（Set/Array）：过滤 `chunk.path`
  - `docLimit` / `maxPerDoc`：文档多样性（与 BM25 一致）
  - `pathMultiplier` / `categoryMultiplier`：对某些目录（例如“网页动画模块”）降权

**Step 3: `search-results.html` 的语义增强只走 LSI**
- 确保 `search-results.html` 已加载：`site/assets/js/guided-lookup.js`
- `semantic-toggle` 开启时：`await loadGuidedSemanticEngine()`；关闭时：不加载/不使用。

**Step 4: 验证索引生成与前端加载**
- Run: `npm run build`
- Expected: 日志包含 `guided-index 已生成：./site/assets/semantic/guided-index.v1.json`

---

### Task 3: 引入 C（规则约束）增强抽象理解，减少跑偏

**Files:**
- Modify: `site/assets/js/bm25-lookup.js`
- Modify: `site/assets/js/guided-lookup.js`
- Modify: `search-results.html`

**Step 1: 抽取/复用 `classifyQuery`（意图/实体）**
- 目标：同一套意图/实体识别同时作用于：
  - BM25（已有 hard/soft terms）
  - LSI（新增 hard/soft gating 与路径惩罚）
- 最小改动策略：
  - 在 `search-results.html` 内提供一个小的 `classifyQueryLite()`，从 `Bm25LookupEngine.classifyQuery()` 读取（如果存在），并把结果传给 LSI/BM25 的 options。
  - 或把 `classifyQuery()` 提取到新文件（如 `site/assets/js/query-routing.js`，UMD/IIFE），供两端引用。

**Step 2: C 的核心规则（必须落实）**
- **实体硬词门槛**：当识别出实体（item/weapon/projectile/npc/csharp）时，结果必须命中至少一个实体硬词（或同义词），否则大幅降权/剔除。
- **抽象意图引导**：
  - intent=intro：提升 `Modder入门`、路线/前言类；压制“怎么贡献/写作指南/网页动画模块”等元内容。
  - intent=troubleshoot：提升“异常/报错/消失/不生效”类；保留少量“提问/日志”辅助，但不抢榜。
  - intent=howto：提升“可照做步骤/最小示例”，压制无关元内容。
- **文档多样性**：topK 结果不允许单文档霸榜（docLimit/maxPerDoc）。

**Step 3: 抽象问题（1/2/3）专门增强**
- 1) 路线类：优先“路线/前言/入门索引”，对“学习路线/从零开始/先学什么/需要基础吗”做同义归一。
- 2) 原理类：对“原理/机制/为什么/区别/流程/生命周期”加入一组高权重概念词，并优先命中“概念了解/原理/机制”目录。
- 3) 模糊实现诉求：识别“高级/复杂/优化/进阶/更好看/刀光/挥舞”等词，要求同时命中实体硬词（武器/弹幕/NPC…），否则降权。

---

### Task 4: A+C 混合检索（BM25 + LSI）在前端落地

**Files:**
- Modify: `search-results.html`

**Step 1: 统一候选生成策略**
- 始终用 BM25 段落召回得到 `candidatesBm25`（limit ~ 24）。
- 语义增强开启时：
  - 用 LSI 在全库（或 BM25 候选集）上评分，得到 `candidatesLsi`。
  - 采用混合打分：`score = w * normalize(lsi) + (1-w) * normalize(bm25)`。
  - `w` 随意图动态调整：
    - intro/原理类：`w` 更大（偏语义）
    - howto/代码类：`w` 更小（偏词法/实体）

**Step 2: 对话模板输出保持“引用式”**
- 仍只展示来自文章段落的引用卡片，不生成无出处结论。
- 模板只负责“引导/澄清/阅读顺序”，不要在模板内编造知识点。

---

### Task 5: 测试与回归（避免“又跑偏”）

**Files:**
- Add: `test/guided-lookup.test.js`（建议把 `GuidedLookupEngine` 改成 UMD 以便 Node require；或将关键评分函数抽到可测试模块）
- Modify (optional): `site/assets/js/guided-lookup.js`

**Step 1: 添加最小可测单元**
- 为“意图识别 + 硬实体门槛 + 路径惩罚”写纯函数并导出（Node 环境可直接测）。

**Step 2: 写回归用例（覆盖 1/2/3）**
- 路线：`我怎么入门Mod啊？` 应优先命中 `Modder入门` 类段落。
- 原理：`物品系统的原理是什么？` 应优先命中“原理/概念了解”而不是“网页动画模块”。
- 模糊实现：`高级挥舞武器怎么做？` 应命中武器/挥舞/刀光相关段落，不能把“网页动画模块”排到前列。

**Step 3: 运行测试**
- Run: `npm test`
- Expected: PASS

---

### Task 6: 生成文件一致性检查

**Files:**
- Regenerated: `site/assets/semantic/guided-index.v1.json`（以及可能的 `site/content/config.json` / `site/assets/search-index.json` / `sitemap.xml`）

**Step 1: 重新生成**
- Run: `npm run build`

**Step 2: 检查生成文件**
- 如果当前环境 git 可用：Run `npm run check-generated`，Expected: 无 diff
- 如果当前 worktree git 不可用：至少确认 `npm run build` 成功，并在 PR/推送前在可用的 git 环境中执行 `npm run check-generated`

---

## Execution Options

Plan complete and saved to `site/content/plans/2026-01-24-abstract-nlu-ac-no-dl2.md`.

Two execution options:
- 1) **Subagent-Driven (this session)**：我按 Task 顺序逐个实现并每步验证（需要用 `superpowers:subagent-driven-development`）
- 2) **Parallel Session (separate)**：新开会话用 `superpowers:executing-plans` 按任务执行

你选哪一种？（以及：语义增强开关要不要保留，还是默认一直开启？）

