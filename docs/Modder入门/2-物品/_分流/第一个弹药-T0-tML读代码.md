---
title: 第一个弹药（T0 补课）：tModLoader 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 12分钟
description: 给第一次接触 tModLoader API 的读者，定位"第一个弹药"里该看懂的 API
topic: mod-basics
order: 9302
hide: true
---

这份补充内容面向 **T0（第一次接触 tModLoader API）**：用于定位本章代码中需要理解的核心 API 入口与职责。

## 1）`Item.ammo`：弹药的类型标识

> **[对应概念]**：弹药类型、物品属性

`Item.ammo` 告诉游戏"这个物品是什么类型的弹药"：

```csharp
Item.ammo = AmmoID.Bullet;  // 子弹类型
```

常见的弹药类型：
- `AmmoID.Bullet`：子弹
- `AmmoID.Arrow`：箭矢
- `AmmoID.Rocket`：火箭

## 2）`Item.useAmmo`：武器的弹药需求

> **[对应概念]**：武器弹药匹配

`Item.useAmmo` 告诉游戏"这个武器使用什么类型的弹药"：

```csharp
Item.useAmmo = AmmoID.Bullet;  // 使用子弹
```

武器通过这个属性来匹配弹药。

## 3）`CanShoot()`：发射条件判断

> **[对应概念]**：发射钩子、条件逻辑

`CanShoot()` 在武器发射前被调用，返回 `true` 可以发射，返回 `false` 不能发射：

```csharp
public override bool CanShoot(Player player)
{
    return player.HasAmmo(Item, ModContent.ItemType<FirstAmmo>());
}
```

## 4）`ModifyShootStats()`：修改发射参数

> **[对应概念]**：发射参数修改

`ModifyShootStats()` 在发射时被调用，可以修改弹幕类型、伤害、速度等：

```csharp
public override void ModifyShootStats(Player player, ref Vector2 position, ref Vector2 velocity, ref int type, ref int damage, ref float knockback)
{
    if (player.HasAmmo(Item, ModContent.ItemType<FirstAmmo>()))
    {
        type = ModContent.ProjectileType<Projectiles.FirstAmmoProjectile>();
    }
}
```

```quiz
type: choice
id: mod-basics-modifyshootstats
question: |
  `ModifyShootStats()` 的作用是什么？
options:
  - id: A
    text: |
      判断能不能发射
  - id: B
    text: |
      修改发射时的参数（弹幕类型、伤害等）
  - id: C
    text: |
      添加合成配方
answer: B
explain: |
  `ModifyShootStats()` 用来在发射时修改参数，比如用自定义弹幕替换原版弹幕。
```
