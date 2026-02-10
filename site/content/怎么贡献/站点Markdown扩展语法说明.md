---
title: 站点Markdown扩展语法说明
author: 小天使
date: 2026-02-07
last_updated: 2026-02-10
difficulty: beginner
time: 20分钟
description: 当前 viewer 渲染器支持的扩展语法，含实用示例与排错建议
topic: article-contribution
order: 2
prev_chapter: 教学文章写作指南.md
next_chapter: 在线写作IDE使用教程.md
---

# 站点Markdown扩展语法说明

本文是“当前项目版本”的语法说明，重点覆盖贡献者最常用的扩展。

## 使用前请先记住

1. 指令行必须独占一行
2. 尽量使用相对路径
3. 先在 viewer 预览，再决定提交

## 文档链接（标准 Markdown）

语法：

```text
[显示标题](相对路径/目标文档.md)
```

示例：

```text
[先看基础篇](./基础篇.md)
```

适用：在文章间建立标准可维护的跳转链接。

## C# 引用指令

### 引用整份 C# 文件

```text
{{cs:./Demo.cs}}
```

### 引用 C# 片段

```text
{{cs:./Demo.cs#cs:t:命名空间.类型名|类型示例}}
{{cs:./Demo.cs#cs:m:命名空间.类型名.方法名(参数类型)|方法示例}}
```

常见选择器：

- `#cs:t:` 类型
- `#cs:m:` 方法
- `#cs:p:` 属性
- `#cs:f:` 字段
- `#cs:c:` 常量
- `#cs:e:` 枚举成员

## 动画引用指令

语法：

```text
{{anim:anims/demo-basic.cs}}
```

要求：

1. 路径以 `anims/` 开头
2. 扩展名为 `.cs`
3. 在使用前执行 `npm run build`

## Quiz 题目语法

### 选择题

````md
```quiz
type: choice
id: demo-choice
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
  正确答案是 4。
```
````

### 判断题

````md
```quiz
type: tf
id: demo-tf
question: |
  Item.damage 可以设置武器伤害。
answer: true
explain: |
  在 SetDefaults 中设置 Item.damage。
```
````

注意：`tf` 的 `answer` 必须是布尔值，不要写字符串。

## 常用 Front Matter 字段

### `source_cs`

用于在文章底部展示 C# 源码。

```yaml
source_cs: Modder入门学习/CSharp基础/CSharp_Frist.cs
```

也可写数组：

```yaml
source_cs:
  - path/first.cs
  - path/second.cs
```

### `min_c` 与 `min_t`

用于建议阅读门槛，不会阻止阅读。

```yaml
min_c: 1
min_t: 1
```

### `colors`

用于定义正文可调用的单色变量，配合 `{color:变量名}{文本}` 使用。

```yaml
colors:
  Mad: "#ff4d4f"
  Good: "#22c55e"
```

### `colorChange`

用于定义正文可调用的颜色动画，配合 `{colorChange:动画名}{文本}` 使用。

```yaml
colorChange:
  rainbow:
    - "#ff0000"
    - "#00ff00"
    - "#0000ff"
```

## 文字颜色扩展语法

### 单色文本

```text
{color:Mad}{这是一段单色文字}
```

说明：

1. `Mad` 需要在 front matter 的 `colors` 中定义
2. 变量名建议只用英文、数字、`_`、`-`

### 颜色动画文本

```text
{colorChange:rainbow}{这是一段颜色动画文字}
```

说明：

1. `rainbow` 需要在 front matter 的 `colorChange` 中定义
2. 动画颜色序列至少写 1 个颜色，推荐 3 个以上

### 完整可运行示例

````md
---
title: 颜色示例
author: 你的名字
topic: article-contribution
description: 演示 colors 与 colorChange 的写法
order: 100
difficulty: beginner
time: 5分钟
colors:
  Mad: "#ff4d4f"
colorChange:
  rainbow:
    - "#ff0000"
    - "#00ff00"
    - "#0000ff"
---

普通文本。

{color:Mad}{这是单色强调文本}

{colorChange:rainbow}{这是颜色动画文本}
````

### 内置可直接使用的颜色名

不写 `colors` 也可直接用这些内置名：`primary`、`secondary`、`accent`、`success`、`warning`、`error`、`info`、`link`、`red`、`green`、`blue`、`yellow`、`purple`、`orange`、`cyan`、`pink`。

```text
{color:primary}{使用主题主色}
{color:warning}{使用警告色}
```

提示：在 `site/pages/article-studio.html` 左侧 Metadata 面板中填写 `colors` 和 `colorChange` 后，会自动写入 front matter。

## 作者模式调试

在 viewer 中开启“作者模式”后，可以看到：

1. 元数据缺失提示
2. 结构建议
3. 链接与引用诊断

这一步非常适合在提交前做快速自检。

## 常见错误

### 错误1：引用失败

检查目标路径是否相对当前文档，且文件真实存在。

### 错误2：动画不显示

确认已执行 `npm run build`，且 `{{anim:...}}` 路径合法。

## 下一步

继续阅读：`在线写作IDE使用教程.md`。
