---
title: 第一个Boss（C0 补课）：C# 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 10分钟
description: 给从没接触过 C# 的读者，看懂"第一个Boss"里出现的关键语法
topic: mod-basics
order: 9901
hide: true
---

这份补充内容面向 **C0（从没接触过 C#）**：覆盖阅读与修改本章代码所需的最小语法集合。

> **[C#概念进度]**
>
> 学完这一节，你将掌握：
> - `&&` 运算符：逻辑与
> - 什么是"状态变量"
> - 条件组合

## 1）`&&` 运算符：逻辑与

> **[对应概念]**：逻辑运算符、复合条件

`&&` 表示"并且"，只有两边都为 `true` 时结果才为 `true`：

```csharp
if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)
{
    // 当生命值低于 50% 并且当前是第一阶段时
}
```

## 2）状态变量

> **[对应概念]**：变量、状态管理

状态变量用于跟踪对象的当前状态：

```csharp
public int Phase = 1;  // 当前阶段（1 或 2）
```

## 3）条件组合

复杂的条件可以组合使用：

```csharp
if (条件1 && 条件2)  // 条件1和条件2都要满足
if (条件1 || 条件2)  // 条件1或条件2满足一个即可

```quiz
type: choice
id: mod-basics-logical-and
question: |
  `条件1 && 条件2` 什么时候为 true？
options:
  - id: A
    text: |
      条件1为 true
  - id: B
    text: |
      条件2为 true
  - id: C
    text: |
      条件1和条件2都为 true
answer: C
explain: |
  `&&` 是逻辑与运算符，需要两边都为 true 结果才为 true。
```
