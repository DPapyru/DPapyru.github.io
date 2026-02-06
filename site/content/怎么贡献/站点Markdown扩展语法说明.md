---
title: 站点 Markdown 扩展语法说明
author: 小天使
date: 2026-02-06
last_updated: 2026-02-06
difficulty: beginner
time: 10分钟
description: 本站 viewer 渲染器支持的 Markdown 扩展语法：引用、条件分流、题目、动画、source_cs、颜色标记
topic: article-contribution
order: 2
---

# 站点 Markdown 扩展语法说明

为了降低维护成本，站点语法已做简化。

请直接使用极简指令，不再使用旧的 `{[...][...]}` 写法。

## 一、引用与代码（极简指令）

所有指令都必须独占一行。

### 1.1 引用 Markdown

```text
{{ref:相对路径/文件名.md|显示标题}}
```

示例：

```text
{{ref:./基础语法.md|先看这节基础语法}}
```

### 1.2 引用完整 C# 文件

```text
{{cs:./CSharp_Frist.cs}}
```

### 1.3 抽取 C# 片段

```text
{{cs:./CSharp_Frist.cs#cs:m:ExMod.CSharpLearn.CSharp_Frist.Main(string[])|主方法示例}}
{{cs:./CSharp_Frist.cs#cs:t:ExMod.CSharpLearn.CSharp_Frist|CSharp_Frist 类型}}
```

支持选择器：

- `#cs:m:` 方法
- `#cs:t:` 类型
- `#cs:p/#cs:f/#cs:c/#cs:e` 属性/字段/常量/枚举成员

### 1.4 引用动画脚本

```text
{{anim:anims/demo-basic.cs}}
```

规则：

- `{{ref:...}}` 用于文档引用（`*.md`）。
- `{{cs:...}}` 用于代码引用（`*.cs`，支持 `#cs:*` 片段选择）。
- `{{anim:...}}` 用于动画脚本（必须是 `anims/*.cs`）。

---

## 二、条件分流（仅保留 if/end）

语法（每条指令必须独占一行）：

```text
{if <条件>}
  ...内容...
{end}
```

可用变量：

- `C`：C# 等级（`0/1/2`）
- `T`：tModLoader 等级（`0/1/2`）
- `AUTHOR`：作者模式（`0/1`）
- `P_*`：学习偏好标签（`0/1`）

可用运算符：

- 比较：`> < >= <= == !=`
- 逻辑：`&& || !`
- 括号：`( ... )`

说明：

- 推荐只用 `{if ...}` 与 `{end}`，写起来最稳定。
- `else if` / `else` 目前仍可用，但不建议新增依赖。
- 推荐使用多个独立 `{if}{end}` 块组合内容。

---

## 三、题目组件（quiz）

使用 fenced code block，语言标记为 `quiz`：

````md
```quiz
type: choice
id: your-unique-id
question: |
  题面
options:
  - id: A
    text: |
      选项 A
answer: A
explain: |
  解释
```
````

`tf` 题型请写：

- `answer: true` 或 `answer: false`
- 不要写成字符串（例如 `"false"`）

---

## 四、C# 动画组件（anim）

推荐直接写：

```text
{{anim:anims/demo-basic.cs}}
```

使用前先运行 `npm run build`，确保动画产物与清单已生成。

---

## 五、Front Matter 显示 C# 源码（source_cs）

在 YAML front matter 里添加：

```yaml
source_cs: Modder入门学习/CSharp基础/CSharp_Frist.cs
```

规则：

- 路径相对 `site/content/`。
- 仅允许 `*.cs`。
- 支持写数组（展示多个源码文件）。

---

## 六、颜色标记（color / colorChange）

在 Front Matter 里可配置：

```yaml
colors:
  Tip: "#88c0d0"

colorChange:
  Rainbow:
    - "#f00"
    - "#0f0"
    - "#00f"
    - "#f00"
```

正文里可写：

```text
{color:Tip}{这是一段提示文本}
{colorChange:Rainbow}{彩色闪烁文本}
```

---

## 七、建议门槛（min_c / min_t）

可在 front matter 标注建议阅读门槛（软建议，不阻止阅读）：

```yaml
min_c: 1
min_t: 1
```

---

## 八、作者模式（author）

开启方式：

- URL：`/site/pages/viewer.html?...&author=1`
- 侧栏：`分流设置 -> 作者模式`

作者模式用于检查元数据、引用和条件分流是否写错。
