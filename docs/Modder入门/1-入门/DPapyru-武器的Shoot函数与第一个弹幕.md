---
title: 武器的 Shoot 函数与第一个弹幕
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 25分钟
description: 从第一把武器出发，添加第一个自定义弹幕，并用 Shoot(...) 精确控制发射逻辑
topic: items
order: 30
prev_chapter: DPapyru-第一把武器.md
next_chapter: DPapyru-弹幕的AI.md
min_c: 0
min_t: 0
---

# 武器的 Shoot 函数与第一个弹幕

在本文中，你将完成两件事：

1. 新建一个自定义弹幕（`ModProjectile`）。
2. 让你的武器在使用时发射该弹幕，并通过 `Shoot(...)` 控制发射。

## 先决条件

- 你已经完成：[第一把武器：最小可用的近战武器](DPapyru-第一把武器.md)。

## 前置（按需补课）

{if T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem-Shoot与第一个弹幕.md#概览（可引用）][tML：Shoot 与默认发射的关系]}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModProjectile-基础字段与AI.md#概览（可引用）][tML：弹幕是什么（实体与每帧更新）]}
{end}

{if P_troubleshoot}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem-Shoot与第一个弹幕.md#常见坑（可引用）][tML：Shoot 常见坑]}
{end}

## Step 1：创建第一个弹幕类

新建文件（例如 `Projectiles/FirstBolt.cs`），写一个最小弹幕：

```csharp
using Terraria;
using Terraria.ModLoader;

namespace YourMod.Projectiles
{
    public class FirstBolt : ModProjectile
    {
        public override void SetDefaults()
        {
            Projectile.width = 10;
            Projectile.height = 10;

            Projectile.friendly = true;
            Projectile.hostile = false;
            Projectile.DamageType = DamageClass.Melee;

            Projectile.penetrate = 1;
            Projectile.timeLeft = 180;
            Projectile.tileCollide = true;
            Projectile.ignoreWater = true;
        }
    }
}
```

{if P_theory}
这里的关键是“阵营与寿命”：

- `friendly=true`：它会伤害敌人，而不是伤害玩家。
- `timeLeft`：避免弹幕永远存在（验证阶段尤其重要）。
{end}

## Step 2：让武器默认能发射这个弹幕

回到你的武器（例如 `Items/FirstSword.cs`），在 `SetDefaults()` 里加上：

```csharp
Item.shoot = ModContent.ProjectileType<Projectiles.FirstBolt>();
Item.shootSpeed = 9f;
```

注意：这里假设 `FirstBolt` 的命名空间是 `YourMod.Projectiles`；你也可以 `using YourMod.Projectiles;` 并写成 `ModContent.ProjectileType<FirstBolt>()`。

{if P_step}
检查点：

- 能编译通过（`using Terraria.ModLoader;` 存在，且 `FirstBolt` 可被解析）。
- 在游戏里使用武器时，确实出现了弹幕（哪怕弹幕还没有自定义 AI）。
{end}

## Step 3：用 Shoot(...) 精确控制发射

如果你只用 `Item.shoot`，系统会按默认逻辑发射；当你需要控制“这一次怎么发射”时，重写 `Shoot(...)`：

```csharp
using Microsoft.Xna.Framework;
using Terraria;
using Terraria.DataStructures;

public override bool Shoot(
    Player player,
    EntitySource_ItemUse_WithAmmo source,
    Vector2 position,
    Vector2 velocity,
    int type,
    int damage,
    float knockback)
{
    Projectile.NewProjectile(source, position, velocity, type, damage, knockback, player.whoAmI);
    return false;
}
```

这段代码的行为是：由你手动生成弹幕，并返回 `false` 阻止默认发射（避免双发）。

{if P_code}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem-Shoot与第一个弹幕.md#最小示例（可引用）][Shoot：完整最小模板]}
{end}

{if P_theory}
`type` 参数通常来自 `Item.shoot`（或弹药系统）。在“第一个弹幕”阶段，沿用 `type/damage/knockback` 的好处是：你修改 `SetDefaults()` 的数值仍然能稳定地影响发射结果。
{end}

## 本章要点（可引用）

- `Item.shoot/shootSpeed` 让物品“默认能发射”；`Shoot(...)` 让你“控制如何发射”。
- `Shoot` 里手动 `NewProjectile` 后，通常返回 `false` 防止默认逻辑再发一次。
- 弹幕的 `friendly/timeLeft` 是最先需要确认的两项默认值。

## 下一步（可引用）

下一章将把“会飞的弹幕”升级为“有行为的弹幕”，并用 `AI()` 控制每帧逻辑：

- [弹幕的 AI：让它按你的规则运动](DPapyru-弹幕的AI.md)
