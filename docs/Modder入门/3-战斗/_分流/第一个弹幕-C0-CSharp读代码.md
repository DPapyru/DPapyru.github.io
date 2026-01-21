---
title: 第一个弹幕（C0 补课）：C# 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 10分钟
description: 给从没接触过 C# 的读者，看懂"第一个弹幕"里出现的关键语法
topic: mod-basics
order: 9401
hide: true
---

这份补充内容面向 **C0（从没接触过 C#）**：覆盖阅读与修改本章代码所需的最小语法集合。

> **[C#概念进度]**
>
> 学完这一节，你将掌握：
> - `float` 类型：带小数的数字
> - `*=` 运算符：乘法赋值
> - 什么是"每帧执行"

## 1）`float` 类型：带小数的数字

> **[对应概念]**：浮点数类型

`float` 是用于存储带小数点的数字的类型：

```csharp
Projectile.velocity *= 1.02f;  // 1.02f 是一个 float
```

注意 float 数字通常要加 `f` 后缀。

## 2）`*=` 运算符：乘法赋值

> **[对应概念]**：赋值运算符

`*=` 是"乘以后赋值"的简写：

```csharp
// 这两行是等价的：
Projectile.velocity = Projectile.velocity * 1.02f;
Projectile.velocity *= 1.02f;
```

## 3）`AI()`：每帧执行的逻辑

> **[对应概念]**：游戏循环、帧

`AI()` 方法是"每帧都会执行"的函数。游戏以大约每秒 60 帧运行，`AI()` 里的代码每秒会被执行 60 次。

```csharp
public override void AI()
{
    // 这段代码每秒执行 60 次
    Projectile.velocity *= 1.02f;
}
```

```quiz
type: choice
id: mod-basics-ai-execution
question: |
  `AI()` 方法有什么特点？
options:
  - id: A
    text: |
      只在游戏启动时执行一次
  - id: B
    text: |
      每帧都会执行一次
  - id: C
    text: |
      只在弹幕消失时执行
answer: B
explain: |
  `AI()` 方法是每帧执行的，这是实现动态行为的关键。
```
