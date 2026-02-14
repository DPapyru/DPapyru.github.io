# Repository Development Workflow

本文档定义本仓库的默认开发流程，以“工作树并行开发 + 统一验证”为核心。

## 0. 适用范围

- 本流程适用于所有会修改仓库文件的任务（代码、内容、样式、脚本、构建配置等）。
- 纯讨论、只读排查、文档评审可不创建工作树。
- 一旦开始写入改动，必须先进入工作树再继续开发。

## 1. 工作树划分

- 需要改动文件时，必须使用工作树进行开发。
- 单次任务完成后删除对应工作树。

推荐目录：`/mnt/f/DPapyru.github.io/.worktrees/<worktree-name>`。

推荐命名：`feat-<topic>`、`fix-<topic>`、`content-<topic>`。

常用命令：

```bash
git worktree add .worktrees/<worktree-name> -b <branch-name>
cd .worktrees/<worktree-name>
# 完成任务后回到仓库根目录执行
git worktree remove .worktrees/<worktree-name>
```

## 2. 开发原则

- 单工作树单目标：每个工作树一次只做一类任务，避免混改。
- 最小改动优先：只改与当前任务相关的文件，不顺手重构。
- 生成文件由脚本产出：不要手动改生成结果来“伪通过”。
- 固定深色主题：不新增浅色/深色切换逻辑。

## 3. 每个工作树的标准流程

1. 进入目标工作树。
2. 首次进入运行依赖安装：
   - `npm ci`
3. 实施改动。
4. 按需更新生成文件：
   - `npm run generate-structure`
   - `npm run generate-search`
   - 或 `npm run generate-index`
5. 执行验证：
   - 必跑：`npm run build`
   - 条件允许时：`npm run check-generated`
6. 记录验证结果到 `ERRORS.md`（命令、是否通过、备注、时间）。

## 4. L3 级统一验收（替代三工作树联合验收）

以下场景统一按 L3 执行：发布前迭代、构建链路改动、公共脚本改动、跨模块改动。

1. 在当前工作树执行：
   - `npm run build`
   - `npm run check-generated`
2. 若 `check-generated` 因平台或 Git 工作树元数据异常无法执行，允许先完成 `npm run build`，并在可用环境补跑 `npm run check-generated`。
3. 可复现性要求：建议在干净工作树额外补跑一次 `npm run build`（不再要求固定三个工作树名称）。
4. 验证记录统一写入 `ERRORS.md`（命令、是否通过、备注、时间）。

验收未通过不得进入提交流程。

## 5. 约束与注意事项

- 严禁修改仓库根目录 `.git` 文件（工作树指针）。
- Markdown 文章必须包含 YAML front matter，至少含 `title`。
- 不使用 Markdown 任务清单（`- [ ]` / `- [x]`）。
- JavaScript 保持现有风格（CommonJS、分号、4 空格缩进）。

## 6. 常用命令速查

```bash
npm ci
git worktree add .worktrees/<worktree-name> -b <branch-name>
npm run build
npm run check-generated
npm run generate-index
git worktree remove .worktrees/<worktree-name>
```

## 7. 提交流程建议

- 提交前确认改动与任务一致，不包含临时文件。
- PR 描述至少包含：改了什么、为什么改、如何验证。
- 在 PR 中引用 `ERRORS.md` 对应验证记录。
- 以可复现验证为准，不以“本地看起来正常”为准。
- git合并与提交的内容必须以中文为主。
