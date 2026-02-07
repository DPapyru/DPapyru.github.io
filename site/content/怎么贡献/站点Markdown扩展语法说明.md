---
title: 站点Markdown扩展语法说明
author: 小天使
date: 2026-02-07
last_updated: 2026-02-07
difficulty: beginner
time: 20分钟
description: 当前 viewer 渲染器支持的扩展语法与分流变量，含实用示例与排错建议
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

## 文档引用指令

语法：

```text
{{ref:相对路径/目标文档.md|显示标题}}
```

示例：

```text
{{ref:./基础篇.md|先看基础篇}}
```

适用：把公共段落拆到单独文档后，再在主文中复用。

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

## 条件分流语法

基础结构：

```text
{if 条件}
内容A
{else if 条件}
内容B
{else}
内容C
{end}
```

虽然支持 `else if` 和 `else`，但建议保持结构简洁，优先可读性。

### 常用变量

1. `C`：C# 档位，范围 `0/1/2`
2. `T`：tModLoader 档位，范围 `0/1/2`
3. `AUTHOR`：作者模式，`0/1`
4. `P_*`：偏好标签开关，`0/1`
5. `R_REMEDIAL`、`R_STANDARD`、`R_FAST`、`R_DEEP`：路由路径标记，`0/1`

### 常用写法

按 C/T 分流：

```text
{if C == 0 || T == 0}
这里是补课内容。
{else}
这里是标准主线。
{end}
```

按 route 路径分流：

```text
{if R_REMEDIAL == 1}
这里是补救路径内容。
{else if R_STANDARD == 1}
这里是标准路径内容。
{else if R_FAST == 1}
这里是速通路径内容。
{else if R_DEEP == 1}
这里是深挖路径内容。
{end}
```

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

### `routing_manual`

当你手动写分流断言时建议开启：

```yaml
routing_manual: true
```

同时正文建议含 3 条断言：

1. `C0/T0` 应看到什么
2. `C1/T1` 应看到什么
3. `C2/T2` 应看到什么

## 作者模式调试

在 viewer 中开启“作者模式”后，可以看到：

1. 元数据缺失提示
2. 分流断言缺失提示
3. 结构建议与条件解析诊断

这一步非常适合在提交前做快速自检。

## 常见错误

### 错误1：条件不生效

排查顺序：

1. 指令是否独占一行
2. 条件变量是否拼写正确
3. 括号与逻辑运算符是否闭合

### 错误2：引用失败

检查目标路径是否相对当前文档，且文件真实存在。

### 错误3：动画不显示

确认已执行 `npm run build`，且 `{{anim:...}}` 路径合法。

## 下一步

继续阅读：`在线写作IDE使用教程.md`。
