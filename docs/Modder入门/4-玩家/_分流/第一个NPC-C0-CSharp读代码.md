---
title: 第一个NPC（C0 补课）：C# 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 10分钟
description: 给从没接触过 C# 的读者，看懂"第一个NPC"里出现的关键语法
topic: mod-basics
order: 9701
hide: true
---

这份补充内容面向 **C0（从没接触过 C#）**：覆盖阅读与修改本章代码所需的最小语法集合。

> **[C#概念进度]**
>
> 学完这一节，你将掌握：
> - `switch` 语句：多分支选择
> - `return`：返回值
> - 什么是"字符串"

## 1）`switch` 语句：多分支选择

> **[对应概念]**：分支结构、选择语句

`switch` 用于根据一个变量的值执行不同的代码：

```csharp
switch (WorldGen.genRand.Next(4))
{
    case 0:
        return "小明";
    case 1:
        return "小红";
    case 2:
        return "小刚";
    default:
        return "小丽";
}
```

## 2）`return`：返回值和提前退出

> **[对应概念]**：方法返回值

`return` 有两个作用：
- 返回一个值（如果有返回类型）
- 提前退出方法

```csharp
public override string TownNPCName()
{
    return "小明";  // 返回字符串
}
```

## 3）字符串（`string`）

> **[对应概念]**：字符串类型、文本

字符串是文本的表示方式，用双引号括起来：

```csharp
return "你好！我是测试 NPC。";  // 这是一个字符串
```

```quiz
type: choice
id: mod-basics-switch-default
question: |
  `switch` 语句中的 `default` 分支什么时候执行？
options:
  - id: A
    text: |
      永远不执行
  - id: B
    text: |
      当没有 case 匹配时执行
  - id: C
    text: |
      总是执行
answer: B
explain: |
  `default` 是默认分支，当没有任何 case 匹配时会执行。
```
