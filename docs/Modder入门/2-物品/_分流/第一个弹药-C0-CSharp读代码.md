---
title: 第一个弹药（C0 补课）：C# 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 10分钟
description: 给从没接触过 C# 的读者，看懂"第一个弹药"里出现的关键语法
topic: mod-basics
order: 9301
hide: true
---

这份补充内容面向 **C0（从没接触过 C#）**：覆盖阅读与修改本章代码所需的最小语法集合。

> **[C#概念进度]**
>
> 学完这一节，你将掌握：
> - `bool` 类型：真/假
> - `if` 语句：条件判断
> - 什么是"返回类型"

## 1）`bool` 类型：真或假

> **[对应概念]**：布尔类型、逻辑值

`bool` 类型只有两个可能的值：`true`（真）或 `false`（假）。

```csharp
public override bool CanShoot(Player player)
{
    // 返回 true 表示"可以发射"，返回 false 表示"不能发射"
    return player.HasAmmo(Item, ModContent.ItemType<FirstAmmo>());
}
```

## 2）`if` 语句：条件判断

> **[对应概念]**：条件语句、程序逻辑

`if` 语句用于根据条件执行不同的代码：

```csharp
if (player.HasAmmo(Item, ModContent.ItemType<FirstAmmo>()))
{
    // 条件为 true 时执行的代码
    type = ModContent.ProjectileType<Projectiles.FirstAmmoProjectile>();
}
```

```quiz
type: choice
id: mod-basics-if-statement
question: |
  `if` 语句的作用是什么？
options:
  - id: A
    text: |
      重复执行某段代码
  - id: B
    text: |
      根据条件决定是否执行某段代码
  - id: C
    text: |
      定义一个函数
answer: B
explain: |
  `if` 语句用于条件判断，当条件为 true 时执行大括号内的代码。
```

## 3）返回类型：`bool`、`void`

> **[对应概念]**：方法返回类型

方法的返回类型表示方法执行后返回什么：

- `void`：不返回任何值
- `bool`：返回一个布尔值（true 或 false）

```csharp
// 没有返回值
public override void AddRecipes() { }

// 返回布尔值
public override bool CanShoot(Player player) { return true; }
```
