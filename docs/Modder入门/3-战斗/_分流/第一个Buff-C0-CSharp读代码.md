---
title: 第一个Buff（C0 补课）：C# 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 10分钟
description: 给从没接触过 C# 的读者，看懂"第一个Buff"里出现的关键语法
topic: mod-basics
order: 9501
hide: true
---

这份补充内容面向 **C0（从没接触过 C#）**：覆盖阅读与修改本章代码所需的最小语法集合。

> **[C#概念进度]**
>
> 学完这一节，你将掌握：
> - `%` 运算符：取模（求余数）
> - `ref` 关键字：引用传递
> - 什么是"Buff 时间"

## 1）`%` 运算符：取模

> **[对应概念]**：取模运算、周期执行

`%` 是取模运算符，返回除法的余数：

```csharp
player.buffTime[buffIndex] % 60 == 0  // 每 60 帧执行一次
```

因为每 60 帧（1 秒），`buffTime` 除以 60 的余数才会等于 0。

## 2）`ref` 关键字：引用传递

> **[对应概念]**：引用传递、ref 参数

`ref` 表示参数按引用传递，方法内修改会影响外部变量：

```csharp
public override void Update(Player player, ref int buffIndex)
{
    // buffIndex 是引用传递，可以修改
}
```

```quiz
type: choice
id: mod-basics-modulo-usage
question: |
  `player.buffTime[buffIndex] % 60 == 0` 的作用是什么？
options:
  - id: A
    text: |
      每 60 帧执行一次（每秒一次）
  - id: B
    text: |
      每 60 秒执行一次
  - id: C
    text: |
      只在第 60 帧执行
answer: A
explain: |
  取模 60 等于 0 表示时间点是 60 的倍数，即每秒一次。
```

## 3）`buffTime[buffIndex]`：Buff 剩余时间

> **[对应概念]**：Buff 系统、时间管理

`buffTime[buffIndex]` 存储 Buff 的剩余时间（单位：帧）。每帧会递减，减到 0 时 Buff 消失。
