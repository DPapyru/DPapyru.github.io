# Repository Guidelines

## Project Structure & Module Organization

- `site/content/`：教程内容与站内页面。Markdown 位于 `site/content/**/**/*.md`；`site/content/config.json` 由目录结构 + YAML 元数据自动生成。
- `site/assets/`：静态资源（`site/assets/js/`、`site/assets/css/`、`site/assets/imgs/`）。`site/assets/search-index.json` 为搜索索引（自动生成）。
- `site/`：站点页面（`site/index.html`、`site/search-results.html`、`site/404.html` 等）。根目录的 `index.html` 仅做跳转到 `/site/`。
- 构建脚本：`site/tooling/generate-structure.js`（生成 `site/content/config.json`）、`site/tooling/generate-search.js`（生成 `site/assets/search-index.json`）；`site/tooling/generate-index.js` 为历史脚本，尽量优先按 `package.json` 的 scripts 使用。

## Build, Test, and Development Commands

- `npm ci`：安装依赖（需要 Node `>=18`）。
- `npm run generate-structure`：重新生成 `site/content/config.json`。
- `npm run generate-search`：重新生成 `site/assets/search-index.json`。
- `npm run generate-index`：等价于先 `generate-structure` 再 `generate-search`。
- `npm run build`：当前只生成结构与动画资源（不会更新搜索索引）。
- `npm run check-generated`：CI 行为一致（会运行构建并检查生成文件是否已提交）。
- 本地预览（任意静态服务器均可）：
  - `python -m http.server 8000`
  - `npx http-server -p 8080`

## Coding Style & Naming Conventions

- JavaScript：保持 `site/tooling/*` 与 `site/assets/js/*` 现有风格（CommonJS、分号、4 空格缩进），避免“顺手重排版”导致 diff 过大。
- Markdown：必须包含 YAML front matter（`---`），至少提供 `title`；其它字段建议与站点约定一致（如 `author`、`category`、`topic`、`order`、`tags`、`last_updated`、`prev_chapter`、`next_chapter`）。
- 命名：建议使用 `site/content/<分类>/<作者>-<标题>.md`（作者名优先用英文/ASCII），并保持 UTF-8 与相对链接可用。
- 内容：鼓励人类作者撰写；避免直接发布大量 AI 生成内容。

## 内容细则（额外约定）

- 不要使用 Markdown 任务清单（例如 `- [ ] ...` / `- [x] ...`）。如需列举，请改为普通列表或编号步骤。
- C# 编写的文章（`*.cs` -> `*.generated.md`）需要保持可编译：避免残留重复定义、未闭合的 `#if/#endregion`、以及字符串字面量中的未转义引号。
- 编辑或新增代码块时，避免引入不可见/特殊 Unicode 字符（如零宽空格、智能引号、表情符号、箭头符号）；优先使用 ASCII 标点。

## 主题（固定深色）

- 站点为“深色主题固定”，不要再添加深色/浅色切换 UI 或逻辑；页面使用 `<html data-theme="dark">`，并由 `assets/js/theme-init.js` 强制设置。
- 样式优先使用 CSS 变量（`assets/css/variables.css`、`assets/css/theme-base.css`）；避免在 HTML 内联样式/页面内 `<style>` 中写死 `#fff`、`#333` 等浅色值。
- 如需新增页面级样式，请用 `var(--bg-color)`、`var(--bg-secondary)`、`var(--text-color)`、`var(--text-secondary)` 等变量，确保在深色模式下对比度正常。

## 内容贡献（Markdown）

- 新文章建议放在 `site/content/<分类>/` 下，并在首部写元数据。例如：
  ```yaml
  ---
  title: 标题
  author: 你的名字
  category: 怎么贡献
  topic: mod-basics
  ---
  ```
- `prev_chapter` / `next_chapter` 用于章节跳转，通常填写同目录下的 `*.md` 文件名。
- 如需新增分类/Topic：优先复用既有值；确需新增时，请同时更新 `site/tooling/generate-structure.js` 的默认配置并重新运行对应生成命令。

## Testing Guidelines

- 当前没有单元测试。请使用 `npm run check-generated` 做一致性校验，并在浏览器做基础冒烟测试（导航、渲染、搜索）。

## Workspace Safety（重要）

- 禁止修改仓库根目录的 `.git` 文件（worktree 指针文件）。该文件用于 Git 工作树定位，误改会导致 `git` 与脚本行为异常。
- 如遇到跨平台（Windows/WSL）导致的 `git` 不可用问题：不要通过改 `.git` 解决；请改在对应平台的 Git 环境中运行 `npm run check-generated` / `git diff`，或仅运行 `npm run build` 做内容生成校验。

## CI 与部署

- GitHub Actions 会在 PR 中执行构建，并检查生成文件是否已提交；请不要手动编辑 `docs/config.json`、`assets/search-index.json`、`sitemap.xml` 作为“最终结果”，而应修改源内容后再重新生成。
- 如需本地复现 CI 的关键检查：运行 `npm run check-generated`，确保构建后 `git diff` 为空。

## 资源与链接

- 图片等资源优先放在 `assets/imgs/`，并在本地预览时确认链接在 `docs/viewer.html` 中可正常打开。
- 链接建议使用相对路径（同目录章节互链时直接写文件名，例如 `TopicSystem使用指南.md`），避免硬编码站点域名。

## Commit & Pull Request Guidelines

- 该仓库提交信息通常较短、自由（多为中文）。建议用动词开头，聚焦单一改动点。
- PR 需说明：改了什么、为什么改，并关联相关 Issue/讨论；涉及 UI/UX 的改动请附截图。
- 推送前务必运行 `npm run build` 并提交生成文件；PR 中若构建后 `git status` 非空，CI 会直接失败。

## 教程文章风格指南

- 入门教程风格参考菜鸟教程：短段落、小标题、示例先行、解释紧随其后。
- 结构优先：先给目标与前置条件，再给最小可运行示例，然后给验证步骤、常见问题、小结与下一步。
- `docs/Modder入门/**` 的文章必须提供 `description` 元数据，用作侧边栏的文章简介（默认显示）。
- 不要在正文或标题里写“可引用”这类提示字样。
- 减少括号说明文字：能用一句话讲清就不要塞进括号里，必要说明用单独一句。
- 保持严肃语气；允许少量类比帮助新人建立直觉，但类比只服务于理解，不要写成段子。
