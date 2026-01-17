---
title: 如何贡献文章（详细指南）
author: 小天使
date: 2025-11-27
topic: article-contribution
order: 999
difficulty: beginner
time: 10分钟
description: 如何在本仓库新增/修改教程文章，并通过构建与 CI 检查
last_updated: 2026-01-16
prev_chapter: null
next_chapter: null
---



# 如何贡献文章（详细指南）

这篇文章会带你从“新建/修改 Markdown”到“本地构建 + 通过 CI 检查”完整走一遍，适用于给本教程站点贡献内容的所有人。

## 你要做的事情（最短路径）

1. 在 `docs/` 下新增或修改 `*.md`（必须带 YAML Front Matter）
2. 运行构建：`npm run build`（会自动更新 `docs/config.json`、`assets/search-index.json`、`sitemap.xml`）
3. 运行一致性检查：`npm run check-generated`（确保生成文件已提交）
4. 提交并发起 PR

## 仓库结构速览

- `docs/`：文章与站内页面（文章在 `docs/**/**/*.md`）
- `assets/`：静态资源（图片建议放 `assets/imgs/`）
- 根目录：`sitemap.xml`、以及搜索索引 `assets/search-index.json`
- 构建脚本：`generate-index.js`

注意：`docs/config.json`、`assets/search-index.json`、`sitemap.xml` 都是自动生成的，请不要手改它们作为最终结果；应修改 Markdown 后重新运行构建。

## 新建文章：文件位置与命名

推荐结构：

- 放在：`docs/<分类>/`
- 文件名：`作者-标题.md`（建议作者名用英文/ASCII，避免路径兼容问题）

例如：

- `docs/Modder入门/DPapyru-提问的艺术.md`
- `docs/怎么贡献/YourName-如何写一篇教程.md`

如果你想写“系列章节”，可以用 `order` 控制排序，并用 `prev_chapter` / `next_chapter` 做章节跳转。

## 必须写的 YAML Front Matter

每篇文章开头必须有：

```yaml
---
title: 文章标题（必填）
---
```

推荐模板（VS Code snippet 输入 `yaml` 可快速生成）：

```yaml
---
title: 文章标题
author: 你的名字
topic: article-contribution
order: 100
difficulty: beginner
time: 10分钟
description: 一句话概括文章内容
last_updated: 2026-01-16
prev_chapter: null
next_chapter: null
---
```

### 字段说明（按常用程度）

- `title`：文章标题（必填）
- `author`：作者名（推荐）
- 分类规则：文章所属“分类”由文件所在目录决定（例如 `docs/Modder入门/`、`docs/怎么贡献/`），请不要在 YAML 里写 `category`
- `topic`：主题（推荐；用于把同一分类下的文章再分组）
  - 建议写 Topic key，例如 `article-contribution`、`mod-basics`、`env`…
  - 也允许写别名（例如“文章贡献”），但为了稳定建议写 key
- `order`：同一分类/主题内的排序（数字越小越靠前）
- `difficulty`：难度（推荐：`beginner` / `intermediate` / `advanced`）
- `time`：预计阅读/学习时间（例如 `5分钟`、`30分钟`）
- `description`：列表页展示的简介（强烈推荐写）
- `last_updated`：最后更新日期（推荐；格式如 `YYYY-MM-DD`）
- `prev_chapter` / `next_chapter`：章节跳转（填同目录下真实存在的 `*.md` 文件名；没有就写 `null`）

## 可选：颜色标注（单色）

站点为固定深色主题，不再区分浅色/深色两套颜色，所以以前的 `colorLD`（Light/Dark）已废弃；统一使用 `colors`（单色）。

### 1) 在元数据里定义颜色变量

```yaml
colors:
  Mad: "#f00"
  Tip: "#88c0d0"
```

### 2) 在正文里使用

```md
{color:Mad}{这句话会变成红色}
{color:Tip}{这是提示色}
```

注意：

- 变量名建议使用英文/ASCII（例如 `Mad`、`Tip`），否则可能无法正常匹配/渲染。
- 历史兼容：旧文章如果还写 `colorLD`，构建与渲染会尽量兼容，但新文章请只用 `colors`。

## 可选：颜色动画

如果你确实需要动画（不建议滥用），可以在元数据中配置 `colorChange`：

```yaml
colorChange:
  Rainbow:
    - "#f00"
    - "#0f0"
    - "#00f"
    - "#f00"
```

正文：

```md
{colorChange:Rainbow}{彩色闪烁文字}
```

## 链接与图片（推荐写法）

- 同目录章节互链：直接写文件名，例如 `[下一章](下一章.md)`
- 图片建议放 `assets/imgs/`，在 Markdown 里用相对路径（从 `docs/` 出发）：`![说明](../assets/imgs/xxx.png)`

尽量避免硬编码站点域名链接（方便本地预览与未来迁移）。

## 构建、校验与本地预览

首次安装依赖：

```bash
npm ci
```

生成索引/搜索/站点地图（提交前必做）：

```bash
npm run build
```

模拟 CI 的关键检查（推荐，能提前发现“生成文件没提交”的问题）：

```bash
npm run check-generated
```

本地预览（任选一个静态服务器）：

```bash
python -m http.server 8000
```

然后打开页面，确认：

- 导航正常
- 文章渲染正常（代码块、链接、图片）
- 搜索能搜到新内容

## 常见问题（踩坑清单）

- 构建后出现大量 diff：正常，生成文件会更新；请确认已把生成文件一起提交。
- 文章没出现在列表：检查 Front Matter 是否缺少 `title`，或 `*.md` 是否放在 `docs/` 下。
- `topic` 写了但分组不对：优先使用 Topic key（如 `article-contribution`），避免写错别名/拼写。
- 章节跳转 404：`prev_chapter` / `next_chapter` 必须指向真实存在的文件名，否则请写 `null`。

## PR 建议

- 描述清楚：改了什么、为什么改、涉及哪些页面/文章
- 如果改了 UI/样式：附截图
- 提交前跑一遍 `npm run build` + `npm run check-generated`
