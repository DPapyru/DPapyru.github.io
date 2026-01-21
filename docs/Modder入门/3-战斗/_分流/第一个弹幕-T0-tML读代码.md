---
title: 第一个弹幕（T0 补课）：tModLoader 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 12分钟
description: 给第一次接触 tModLoader API 的读者，定位"第一个弹幕"里该看懂的 API
topic: mod-basics
order: 9402
hide: true
---

这份补充内容面向 **T0（第一次接触 tModLoader API）**：用于定位本章代码中需要理解的核心 API 入口与职责。

## 1）`class FirstProjectile : ModProjectile`：弹幕的基类

> **[对应概念]**：`ModProjectile`、弹幕模型

`ModProjectile` 是 tModLoader 提供的弹幕基类。编写新弹幕遵循同一模式：

> 继承 `ModProjectile`，并在约定的方法中填入属性与 AI

## 2）`AI()`：弹幕的行为逻辑

> **[对应概念]**：弹幕 AI、游戏循环

`AI()` 方法每帧都会执行，是编写弹幕行为的核心：

- 改变速度：`Projectile.velocity`
- 旋转：`Projectile.rotation`
- 产生粒子效果

## 3）`SetDefaults()`：弹幕的默认属性

> **[对应概念]**：弹幕属性表

弹幕的 `SetDefaults()` 设置初始属性：

```csharp
Projectile.width = 16;  // 碰撞箱宽度
Projectile.height = 16;  // 碰撞箱高度
Projectile.friendly = true;  // 是否对玩家友好（不会打玩家）
Projectile.hostile = false;  // 是否敌对（不会打敌人）
Projectile.penetrate = 1;  // 穿透数量
Projectile.timeLeft = 600;  // 存在时间（帧）
```

## 4）`Item.shoot`：武器发射的弹幕

> **[对应概念]**：武器与弹幕的关联

武器通过 `Item.shoot` 指定发射的弹幕：

```csharp
Item.shoot = ModContent.ProjectileType<FirstProjectile>();
```

```quiz
type: choice
id: mod-basics-projectile-penetrate
question: |
  `Projectile.penetrate = 1;` 是什么意思？
options:
  - id: A
    text: |
      弹幕可以穿透 1 个敌人后消失
  - id: B
    text: |
      弹幕不能穿透敌人
  - id: C
    text: |
      弹幕可以无限穿透
answer: A
explain: |
  `penetrate` 表示穿透数量，1 表示打到一个敌人就消失。
```
