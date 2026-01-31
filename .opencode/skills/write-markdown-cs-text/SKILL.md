---
name: write-markdown-cs-text
description: 创建并编写泰拉瑞亚 tModLoader Mod 制作教程文章。支持 Markdown 与 C# 转 Markdown 两种写作模式，遵循站点元数据规范及扩展语法规则。
triggers:
  - 创建教程文章
  - 编写 Markdown 文档
  - 生成文章
  - 写教程
  - 新增文章
  - 修改文章
  - 编写 C# 教程
  - 生成 C# 文档
---

# 泰拉瑞亚 Mod 制作教程写作

本 Skill 帮助用户创建、编写或修改泰拉瑞亚 `tModLoader` Mod 制作教程文章。`tModLoader` 是泰拉瑞亚的官方 Mod 加载器，使用 C# 语言进行 Mod 开发。

## 本文内容

- [泰拉瑞亚 Mod 制作教程写作](#泰拉瑞亚-mod-制作教程写作)
  - [本文内容](#本文内容)
  - [写作模式概述](#写作模式概述)
  - [项目结构](#项目结构)
  - [写作模式详解](#写作模式详解)
    - [Markdown 模式](#markdown-模式)
      - [文件位置](#文件位置)
      - [元数据字段](#元数据字段)
      - [元数据模板](#元数据模板)
      - [关键规则](#关键规则)
    - [C# 转 Markdown 模式](#c-转-markdown-模式)
      - [文件位置](#文件位置-1)
      - [C# 文件结构](#c-文件结构)
      - [元数据特性映射](#元数据特性映射)
      - [正文书写规则](#正文书写规则)
      - [示例代码展示](#示例代码展示)
      - [生成命令](#生成命令)
  - [站点扩展语法](#站点扩展语法)
    - [引用展开](#引用展开)
    - [条件分流](#条件分流)
    - [Quiz 题目组件](#quiz-题目组件)
    - [C# 动画组件](#c-动画组件)
    - [颜色标记](#颜色标记)
  - [写作风格](#写作风格)
    - [基本原则](#基本原则)
    - [行文语气](#行文语气)
    - [文章结构](#文章结构)
      - [基础模板](#基础模板)
    - [代码说明](#代码说明)
  - [常见问题](#常见问题)
    - [问题 1：\[问题描述\]](#问题-1问题描述)
      - [内容组织建议（Modder入门）](#内容组织建议modder入门)
  - [工作流程](#工作流程)
    - [创建新文章](#创建新文章)
    - [修改现有文章](#修改现有文章)
  - [常见问题与解决](#常见问题与解决)
    - [文章未显示在导航中](#文章未显示在导航中)
    - [章节跳转按钮失效](#章节跳转按钮失效)
    - [C# 生成内容错误](#c-生成内容错误)
    - [条件分流未生效](#条件分流未生效)
    - [Quiz 判题异常](#quiz-判题异常)
  - [命令参考](#命令参考)
  - [最佳实践](#最佳实践)
  - [示例参考](#示例参考)
  - [相关资源](#相关资源)

## 写作模式概述

文档支持两种写作模式：

| 模式                    | 文件扩展名 | 适用场景                      |
| ----------------------- | ---------- | ----------------------------- |
| **Markdown 模式**       | `.md`      | 概念讲解与一般教程            |
| **C# 转 Markdown 模式** | `.cs`      | 代码密集型教程，需要 IDE 支持 |

**Markdown 模式**直接编写 Markdown 文件，无需额外构建步骤。适用于大多数普通教程、概念讲解与文档说明。

**C# 转 Markdown 模式**编写 `.cs` 文件并自动生成 `.generated.md`。利用 IDE 的自动补全与重构功能，同时保持文章结构与代码结构同步。

> 注意: **C# 转 Markdown 模式** 首先得能通过dotnet的检查

## 项目结构

项目由以下主要组件构成：

```
F:\DPapyru.github.io/
├── site/content/          # 教程内容与站内页面
│   ├── 方向性指导/         # 学习方法论文章
│   ├── 怎么贡献/          # 贡献指南
│   ├── 螺线翻译tml教程/    # tModLoader 官方文档翻译
│   ├── Modder入门/        # 入门教程系列
│   └── ModDocProject/     # C# 文档项目示例
├── site/assets/           # 静态资源 (js/css/imgs)
├── site/tooling/          # 构建脚本
│   ├── generate-structure.js    # 生成站点结构
│   ├── generate-search.js       # 生成搜索索引
│   └── cs-docs/                 # C# 文档生成器
└── package.json           # 项目配置
```

## 写作模式详解

### Markdown 模式

适用于普通教程、概念讲解与文档说明。

#### 文件位置

```
site/content/<分类>/<作者>-<标题>.md
```

#### 元数据字段

| 字段           | 类型    | 必填 | 说明                                           |
| -------------- | ------- | ---- | ---------------------------------------------- |
| `title`        | string  | 是   | 文章标题                                       |
| `author`       | string  | 否   | 作者名称                                       |
| `topic`        | string  | 否   | 主题标识，如 `mod-basics`、`env`               |
| `order`        | number  | 否   | 排序权重，数值越小越靠前                       |
| `difficulty`   | string  | 否   | 难度等级：`beginner`/`intermediate`/`advanced` |
| `time`         | string  | 否   | 预计阅读时间，如 `10分钟`                      |
| `description`  | string  | 否   | 文章描述                                       |
| `date`         | string  | 否   | 创建日期，格式 `YYYY-MM-DD`                    |
| `last_updated` | string  | 否   | 最后更新日期                                   |
| `prev_chapter` | string  | 否   | 上一章节文件路径（相对路径）                   |
| `next_chapter` | string  | 否   | 下一章节文件路径（相对路径）                   |
| `min_c`        | number  | 否   | 建议 C# 等级（`0`/`1`/`2`）                    |
| `min_t`        | number  | 否   | 建议 tModLoader 等级（`0`/`1`/`2`）            |
| `tags`         | array   | 否   | 标签列表                                       |
| `colors`       | object  | 否   | 自定义颜色标记                                 |
| `hide`         | boolean | 否   | 是否隐藏文章（默认 `false`）                   |

#### 元数据模板

```yaml
---
title: 文章标题
author: 你的名字
topic: mod-basics
order: 100
difficulty: beginner
time: 10分钟
description: 文章描述
date: 2026-01-18
last_updated: 2026-01-18
prev_chapter: 
next_chapter: 
min_c: 0
min_t: 0
tags:
  - tag-1
  - tag-2
colors:
  Tip: "#88c0d0"
  Mad: "#f00"
hide: false
---
```

#### 关键规则

- 分类由文件所在目录决定，不在 YAML 中声明 `category`
- `topic` 建议使用标识符而非描述性文本
- `order` 为数值类型，未指定时排在最后
- `prev_chapter` 与 `next_chapter` 应指向同目录下真实存在的 `.md` 文件
- **系列文章必须设置**：如无特殊要求，均应配置 `order`、`prev_chapter` 和 `next_chapter` 以实现章节导航
- `hide: true` 的文章不进入导航与索引

### C# 转 Markdown 模式

适用于需要大量可编译示例代码的教程。

#### 文件位置

```
site/content/<分类>/<文件名>.cs
```

生成结果：同目录下自动生成 `<文件名>.generated.md`。

#### C# 文件结构

```csharp
using ModDocProject;

namespace YourNamespace {
    /// <summary>文章简介</summary>
    [Title("文章标题")]
    [Tooltip("文章描述")]
    [Author("你的名字")]
    [UpdateTime("2026-01-28")]
    [Topic("know-csharp")]
    public class ArticleClassName {
#if DOCS
        #region 第一节
        public const string DocMarkdown_1 = """
        第一节正文内容。
        
        支持 Markdown 格式。
        """;
        #endregion

        #region 第二节
        public const string DocMarkdown_2 = """
        第二节正文内容。
        """;
        #endregion
#endif
    }
}
```

#### 元数据特性映射

| C# 特性         | YAML 字段      | 必填 | 说明                              |
| --------------- | -------------- | ---- | --------------------------------- |
| `[Title]`       | `title`        | 是   | 文章标题                          |
| `[Tooltip]`     | `description`  | 否   | 文章描述                          |
| `[Author]`      | `author`       | 否   | 作者名称                          |
| `[UpdateTime]`  | `last_updated` | 否   | 最后更新时间                      |
| `[Category]`    | `category`     | 否   | 分类                              |
| `[Topic]`       | `topic`        | 否   | 主题标识                          |
| `[Date]`        | `date`         | 否   | 日期                              |
| `[Difficulty]`  | `difficulty`   | 否   | 难度等级                          |
| `[Time]`        | `time`         | 否   | 预计时间                          |
| `[Order]`       | `order`        | 否   | 排序权重（**系列文章必填**）      |
| `[Tags]`        | `tags`         | 否   | 标签列表                          |
| `[PrevChapter]` | `prev_chapter` | 否   | 上一章节（**系列文章必填**）。C#文章用`typeof(类名)`，非C#文章用字符串路径 |
| `[NextChapter]` | `next_chapter` | 否   | 下一章节（**系列文章必填**）。C#文章用`typeof(类名)`，非C#文章用字符串路径 |
| `[Hide]`        | `hide`         | 否   | 是否隐藏                          |

#### 正文书写规则

- 正文必须位于 `#if DOCS` ... `#endif` 预处理器块内
- 变量名必须以 `DocMarkdown` 为前缀
- `#region 标题` 自动生成 `## 标题`
- 支持 C# 11 原始字符串格式 `"""..."""`

#### 示例代码展示

在 `#if DOCS` 外部定义 `#region 示例代码：...`，生成器渲染为：
- `### 示例代码：...` 标题
- `csharp` 代码块

```csharp
// 在 #if DOCS 外部
#region 示例代码：基础用法
public void Example() {
    // 代码内容
}
#endregion
```

#### 生成命令

```bash
node site/tooling/cs-docs/generate-cs-docs.js
```

## 站点扩展语法

两种写作模式均支持以下扩展语法。

### 引用展开

引用展开（Transclusion）允许将其他文件的内容插入到当前文档中。

**完整引用**（必须独占一行）：

```
{[相对路径/文件名.md][目录中显示的标题]}
```

**节选小节**：

```
{[相对路径/文件名.md#标题文字][目录中显示的标题]}
```

**轻量引用**（不进入目录）：

```
{[相对路径/文件名.md#标题文字][!显示标题]}
```

### 条件分流

条件分流根据读者的 C# 和 tModLoader 等级显示不同内容。

**语法**：

```
{if C == 0}
C# 零基础内容
{else if C >= 1 && T == 0}
tModLoader API 说明
{else}
进阶实战写法
{end}
```

**可用变量**：

| 变量     | 类型    | 说明                                                          |
| -------- | ------- | ------------------------------------------------------------- |
| `C`      | number  | C# 等级（`0`/`1`/`2`）                                        |
| `T`      | number  | tModLoader 等级（`0`/`1`/`2`）                                |
| `P_*`    | boolean | 偏好标签，如 `P_step`、`P_code`、`P_theory`、`P_troubleshoot` |
| `AUTHOR` | boolean | 作者模式（`0`/`1`）                                           |

**与引用搭配**：

```
{if C == 0}
{[./_分流/xxx.md][C# 补课]}
{else}
{[./_分流/yyy.md][进阶建议]}
{end}
```

### Quiz 题目组件

**单选题**：

````md
```quiz
type: choice
id: example-choice
question: |
  2 + 2 等于几？
options:
  - id: A
    text: |
      3
  - id: B
    text: |
      4
answer: B
explain: |
  2 + 2 = 4。
```
````

**多选题**：`answer` 为列表

````md
```quiz
type: choice
id: example-multi
question: |
  下列哪些是 C# 关键字？
options:
  - id: A
    text: |
      `class`
  - id: B
    text: |
      `namespace`
  - id: C
    text: |
      `banana`
answer:
  - A
  - B
explain: |
  `class` 与 `namespace` 为关键字；`banana` 不是。
```
````

**判断题**：`type: tf`，`answer` 为布尔值（无引号）

````md
```quiz
type: tf
id: example-tf
question: |
  `Item.damage` 用于设置物品伤害。
answer: true
explain: |
  `SetDefaults()` 中设置的 `Item.damage` 即为武器伤害值。
```
````

### C# 动画组件

语法：

````md
```animts
anims/demo-basic.cs
```
````

**要求**：

- C# 源文件位于 `site/content/anims/`
- 构建后生成 `site/assets/anims/*.js`
- 使用前运行 `npm run build`

### 颜色标记

**定义颜色**（Front Matter）：

```yaml
colors:
  Tip: "#88c0d0"
  Mad: "#f00"
```

**使用**：

```md
{color:Tip}{使用 Tip 颜色显示}
{color:Mad}{警告颜色显示}
```

## 写作风格

### 基本原则

- **结构统一**：读者可快速定位目标、步骤与常见问题
- **内容准确**：代码示例经过验证，确保可运行
- **循序渐进**：从最小改动到完整功能逐步展开
- **实践导向**：建议"先复制运行，再理解原理"
- **表达清晰**：采用说明书式表达，服务于理解

### 行文语气

- 以清晰表达为主，减少口语化与感叹
- 比喻或类比服务于理解，避免娱乐化措辞

### 文章结构

#### 基础模板

```md
# 文章标题

本章目标：[学完后的能力]

## 准备工作

前置条件：
- 条件 1
- 条件 2

## 步骤 1：[步骤名称]

步骤说明。

### 代码示例

```csharp
// 可运行的最小示例
```

### 代码说明

- 功能描述
- 关键参数说明

## 常见问题

### 问题 1：[问题描述]

**原因**：[原因说明]

**解决**：[解决方法]
```

#### 章节文章模板

```yaml
---
title: 章节标题
author: 作者名称
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 15分钟
description: 章节目标描述
topic: mod-basics
order: 10
prev_chapter: ../上一章节.md
next_chapter: ../下一章节.md
---
```

**章节导航要求**：

系列文章（如"C# 基础教程"多章节）**必须**配置以下属性：

1. **`order`**：定义章节顺序（建议 10, 20, 30... 间隔10，方便后续插入）
2. **`prev_chapter`**：指向上一章的 `.md` 文件（相对路径）
3. **`next_chapter`**：指向下一章的 `.md` 文件（相对路径）

**示例 - 系列文章配置**：

```csharp
// 第一章（指向C#文章用typeof）
[Order(10)]
// 无前序章节
[NextChapter(typeof(CSharp基础数据类型))]
public class CSharp语法基础 { }

// 第二章
[Order(20)]
[PrevChapter(typeof(CSharp语法基础))]
[NextChapter(typeof(CSharp变量与表达式))]
public class CSharp基础数据类型 { }

// 第三章
[Order(30)]
[PrevChapter(typeof(CSharp基础数据类型))]
[NextChapter(typeof(CSharp控制流))]
public class CSharp变量与表达式 { }

// 最后一章
[Order(60)]
[PrevChapter(typeof(CSharp变量更多内容))]
// 无后续章节
public class CSharp方法 { }
```

**必需小节**：

- `## 本章要点（可引用）`
- `## 常见坑（可引用）`
- `## 下一步（可引用）`

#### 内容组织建议（Modder入门）

采用三层结构：

| 层级       | 路径                                        | 内容                                               |
| ---------- | ------------------------------------------- | -------------------------------------------------- |
| 指南层     | `site/content/Modder入门/指南/`             | 阅读方式、提问、环境、术语、约定                   |
| 内容索引层 | `site/content/Modder入门/文章使用内容索引/` | 可复用的 C# 与 tModLoader API 说明                 |
| 组装层     | `site/content/Modder入门/`                  | 路线页、章节页、导读页，通过引用展开插入索引层内容 |

## 工作流程

### 创建新文章

1. **确定写作模式**
   - 普通教程：选择 Markdown 模式
   - 代码密集型：选择 C# 转 Markdown 模式

2. **选择文件位置**
   - Markdown：`site/content/<分类>/<作者>-<标题>.md`
   - C#：`site/content/<分类>/<文件名>.cs`

3. **编写内容**
   - 添加完整 YAML Front Matter（至少包含 `title`）
   - 遵循写作风格指南
   - 使用站点扩展语法（如需要）

4. **生成与构建**

   ```bash
   # Markdown 模式
   npm run generate-structure

   # C# 模式
   node site/tooling/cs-docs/generate-cs-docs.js
   npm run generate-structure
   ```

5. **本地预览**

   ```bash
   python -m http.server 8000
   # 或
   npx http-server -p 8080
   ```

   访问 `http://localhost:8000`

6. **提交前检查清单**

   - [ ] YAML Front Matter 包含 `title`
   - [ ] 文章位于正确的分类目录
   - [ ] 链接与图片使用相对路径
   - [ ] Quiz 正常显示且可判题
   - [ ] **系列文章**：已配置 `order`、`prev_chapter`、`next_chapter`
   - [ ] 运行 `npm run build` 并提交生成文件
   - [ ] 运行 `npm run check-generated` 确保 CI 通过

#### 图片使用规范

教程文章可使用图片增强说明效果。

**图片存储位置**：

```
site/assets/imgs/<分类>/<文章名>/<图片名>.png
```

**图片引用方式**：

```md
![图片描述](../../assets/imgs/分类/文章名/图片名.png)
```

**图片规范**：

| 项目 | 要求 |
|------|------|
| 格式 | PNG（推荐）、JPG、GIF、WebP |
| 尺寸 | 宽度建议 800px 以内，避免过大 |
| 命名 | 英文小写，用连字符分隔，如 `create-mod-dialog.png` |
| 大小 | 单张图片建议不超过 500KB |
| 来源 | 优先使用官方截图、自行制作，或使用互联网可商用图片 |

**互联网图片使用**：

1. 使用 Playwright 工具下载网页截图
2. 确保图片版权允许使用（CC0、CC-BY 或官方截图）
3. 下载后保存到 `site/assets/imgs/` 目录，不要直接使用外部链接
4. 在文章中标注图片来源（如适用）

**提交要求**：

- 图片文件必须与文章一同提交
- 运行 `npm run check-generated` 前确保图片已放入正确目录

### 修改现有文章

1. 定位并编辑源文件（`.md` 或 `.cs`）
2. 若编辑 `.cs` 文件，重新运行生成命令
3. 运行 `npm run build` 更新站点结构
4. 本地预览验证修改
5. 提交所有变更（含生成文件）

## 常见问题与解决

### 文章未显示在导航中

| 检查项         | 解决方式                          |
| -------------- | --------------------------------- |
| `hide: true`   | 移除或设为 `false`                |
| `order` 值过大 | 调整为较小数值                    |
| 索引未更新     | 运行 `npm run generate-structure` |

### 章节跳转按钮失效

| 检查项       | 解决方式                        |
| ------------ | ------------------------------- |
| 文件路径错误 | 确保指向真实存在的文件          |
| 使用 `null`  | 留空或省略字段，不使用 `null`   |
| 路径格式     | 使用相对路径，如 `../上一章.md` |

### C# 生成内容错误

| 检查项         | 解决方式                        |
| -------------- | ------------------------------- |
| `[Title]` 特性 | 确保已声明                      |
| `#if DOCS` 块  | 确保正文位于块内                |
| 变量名         | 确保以 `DocMarkdown` 开头       |
| 字符串格式     | 使用 `"""..."""` 原始字符串格式 |

### 条件分流未生效

| 检查项       | 解决方式                            |
| ------------ | ----------------------------------- |
| 指令独占一行 | 确保无其他内容                      |
| 变量名拼写   | 检查 `C`、`T`、`P_code` 等          |
| 闭合标签     | 确保 `{end}` 正确闭合               |
| 调试模式     | URL 后添加 `&author=1` 查看诊断信息 |

### Quiz 判题异常

| 检查项      | 解决方式                                 |
| ----------- | ---------------------------------------- |
| `tf` 类型   | `answer` 为布尔值 `true`/`false`，无引号 |
| `id` 唯一性 | 确保全站唯一                             |
| 多选题格式  | `answer` 为列表格式                      |

## 命令参考

| 命令                                            | 说明                          |
| ----------------------------------------------- | ----------------------------- |
| `npm ci`                                        | 安装依赖                      |
| `npm run generate-structure`                    | 生成站点结构（`config.json`） |
| `npm run generate-search`                       | 生成搜索索引                  |
| `npm run generate-index`                        | 完整生成（结构+搜索）         |
| `node site/tooling/cs-docs/generate-cs-docs.js` | C# 文档生成                   |
| `npm run build`                                 | 构建（结构+动画资源）         |
| `npm run check-generated`                       | 一致性检查（模拟 CI）         |
| `python -m http.server 8000`                    | 本地预览（Python）            |
| `npx http-server -p 8080`                       | 本地预览（Node.js）           |

## 最佳实践

1. **优先使用 Markdown 模式**：除非确需 IDE 支持或可编译代码
2. **保持简洁**：短段落、小标题、示例先行
3. **善用引用展开**：避免复制粘贴，一处编写多处复用
4. **合理使用条件分流**：避免整篇文章被条件块切碎
5. **系列文章配置导航**：使用 `order`、`prev_chapter`、`next_chapter` 建立章节连接
6. **运行构建并提交**：提交生成文件
7. **本地预览验证**：重点检查 Quiz 与动画组件、章节跳转按钮
8. **保持严肃风格**：说明书式表达，服务于理解

## 示例参考

**Markdown 示例**：

- `site/content/怎么贡献/教学文章写作指南.md` - 元数据与风格示范
- `site/content/螺线翻译tml教程/1-基础/0-Basic-Prerequisites 基础-先决条件.md` - 基础教程结构

**C# 示例**：

- `site/content/ModDocProject/Items/TestItem.cs` - 最简 C# 文档示例
- `site/content/Modder入门/详细文档/CSharp知识/CSharp快速入门.cs` - 完整 C# 教程示例

**生成结果示例**：

- `site/content/ModDocProject/Items/TestItem.generated.md` - C# 生成结果

## 相关资源

- [C# 语言参考](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/)
- [tModLoader 官方 Wiki](https://github.com/tModLoader/tModLoader/wiki)
- [项目 README](https://github.com/DPapyru/DPapyru.github.io/blob/main/README.md)
