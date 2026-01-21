---
title: 第一个饰品（C0 补课）：C# 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 10分钟
description: 给从没接触过 C# 的读者，看懂"第一个饰品"里出现的关键语法
topic: mod-basics
order: 9801
hide: true
---

这份补充内容面向 **C0（从没接触过 C#）**：覆盖阅读与修改本章代码所需的最小语法集合。

> **[C#概念进度]**
>
> 学完这一节，你将掌握：
> - `+=` 运算符：加法赋值
> - 什么是"属性"（Property）
> - 访问对象成员：`.`

## 1）`+=` 运算符：加法赋值

> **[对应概念]**：赋值运算符

`+=` 是"加后赋值"的简写：

```csharp
// 这两行是等价的：
player.moveSpeed = player.moveSpeed + 0.1f;
player.moveSpeed += 0.1f;
```

## 2）对象成员访问：`.`

> **[对应概念]**：成员访问、对象

`.` 用于访问对象的成员（属性或方法）：

```csharp
player.moveSpeed  // 访问 player 对象的 moveSpeed 属性
player.maxRunSpeed  // 访问 maxRunSpeed 属性
```

## 3）Player 对象

> **[对应概念]**：玩家对象、属性

`player` 参数代表当前玩家，可以通过它修改玩家的各种属性：

- `player.moveSpeed`：移动速度
- `player.maxRunSpeed`：最大奔跑速度
- `player.statLifeMax2`：最大生命值

```quiz
type: choice
id: mod-basics-plus-equals
question: |
  `player.moveSpeed += 0.1f;` 是什么意思？
options:
  - id: A
    text: |
      将玩家的移动速度设置为 0.1
  - id: B
    text: |
      将玩家的移动速度增加 0.1
  - id: C
    text: |
      将玩家的移动速度减少 0.1
answer: B
explain: |
  `+=` 是加法赋值运算符，相当于 `player.moveSpeed = player.moveSpeed + 0.1f`。
```
