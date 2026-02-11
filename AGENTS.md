# Repository Development Workflow

本文档定义本仓库的默认开发流程，以“三个工作树并行开发 + 统一验证”为核心。

## 1. 工作树划分

项目默认使用以下三个工作树：

- `add-new-test-content`：新增教程内容、示例内容、测试用素材。
- `add-new-text`：文案、说明文档、导航结构文本调整。
- `bug-repair`：脚本、样式、渲染、交互等问题修复。

<<<<<<< HEAD
推荐目录：`/mnt/f/DPapyru.github.io.worktrees/<worktree-name>`。

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
6. 记录验证结果（命令、是否通过、备注）。

## 4. 三工作树联合验收

任何一次面向提交的迭代，都需要在三个工作树分别通过至少 `npm run build`：

- `add-new-test-content`：`npm run build`
- `add-new-text`：`npm run build`
- `bug-repair`：`npm run build`

若当前平台 Git 工作树元数据异常，允许先完成构建验证，再在对应可用平台补跑 `npm run check-generated`。

## 5. 约束与注意事项

- 严禁修改仓库根目录 `.git` 文件（工作树指针）。
- Markdown 文章必须包含 YAML front matter，至少含 `title`。
- 不使用 Markdown 任务清单（`- [ ]` / `- [x]`）。
- JavaScript 保持现有风格（CommonJS、分号、4 空格缩进）。

## 6. 常用命令速查

```bash
npm ci
npm run generate-index
npm run build
npm run check-generated
```

## 7. 提交流程建议

=======
默认分工规则：若用户未直接说明由哪个工作树处理任务，必须按任务类型拆分并分工给以上三个工作树区域完成。

推荐目录：`/mnt/f/DPapyru.github.io.worktrees/<worktree-name>`。

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
6. 记录验证结果（命令、是否通过、备注）。

## 4. 三工作树联合验收

任何一次面向提交的迭代，都需要在三个工作树分别通过至少 `npm run build`：

- `add-new-test-content`：`npm run build`
- `add-new-text`：`npm run build`
- `bug-repair`：`npm run build`

若当前平台 Git 工作树元数据异常，允许先完成构建验证，再在对应可用平台补跑 `npm run check-generated`。

## 5. 约束与注意事项

- 严禁修改仓库根目录 `.git` 文件（工作树指针）。
- Markdown 文章必须包含 YAML front matter，至少含 `title`。
- 不使用 Markdown 任务清单（`- [ ]` / `- [x]`）。
- JavaScript 保持现有风格（CommonJS、分号、4 空格缩进）。

## 6. 常用命令速查

```bash
npm ci
npm run generate-index
npm run build
npm run check-generated
```

## 7. 提交流程建议

>>>>>>> main
- 提交前确认改动与任务一致，不包含临时文件。
- PR 描述至少包含：改了什么、为什么改、如何验证。
- 以可复现验证为准，不以“本地看起来正常”为准。
