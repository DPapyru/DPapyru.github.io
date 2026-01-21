---
title: 第一个召唤物（C0 补课）：C# 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 10分钟
description: 给从没接触过 C# 的读者，看懂"第一个召唤物"里出现的关键语法
topic: mod-basics
order: 9601
hide: true
---

这份补充内容面向 **C0（从没接触过 C#）**：覆盖阅读与修改本章代码所需的最小语法集合。

> **[C#概念进度]**
>
> 学完这一节，你将掌握：
> - `for` 循环：重复执行
> - 什么是"最近邻搜索"
> - `Vector2`：二维向量

## 1）`for` 循环：重复执行

> **[对应概念]**：循环结构

`for` 循环用于重复执行一段代码：

```csharp
for (int i = 0; i < Main.maxNPCs; i++)
{
    // 这段代码会执行 maxNPCs 次
}
```

## 2）`Vector2.Distance()`：计算距离

> **[对应概念]**：几何计算

`Vector2.Distance()` 计算两点之间的距离：

```csharp
float distance = Vector2.Distance(Projectile.Center, targetNPC.Center);
```

用于判断敌人是否在攻击范围内。

## 3）`Vector2.Normalize()`：归一化向量

> **[对应概念]**：向量运算、方向

`Normalize()` 将向量长度变为 1，保留方向：

```csharp
Vector2 direction = targetPos - Projectile.Center;
direction.Normalize();  // 方向向量，长度为 1
Projectile.velocity = direction * 8f;  // 乘以速度
```

```quiz
type: choice
id: mod-basics-vector-normalize
question: |
  `direction.Normalize();` 的作用是什么？
options:
  - id: A
    text: |
      将向量长度变为 1，只保留方向
  - id: B
    text: |
      将向量长度变为原来的两倍
  - id: C
    text: |
      删除向量
answer: A
explain: |
  归一化后的向量长度为 1，只表示方向，可以用来控制速度。
```
