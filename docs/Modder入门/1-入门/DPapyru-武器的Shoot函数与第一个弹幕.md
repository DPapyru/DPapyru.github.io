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

本节目标：做出第一个自定义弹幕，并让武器发射它。

你会做两件事：

1. 新建一个 `ModProjectile`。
2. 让武器发射这个弹幕，然后用 `Shoot(...)` 接管发射逻辑。

类比一下更好记：`Item.shoot` 是默认发射方案，`Shoot(...)` 是你接管这一发。

## 先决条件

- 你已经完成：[第一把武器：最小可用的近战武器](DPapyru-第一把武器.md)。

## 扩展阅读

{if T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem-Shoot与第一个弹幕.md][tML：Shoot 与默认发射的关系]}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModProjectile-基础字段与AI.md][tML：弹幕是什么]}
{end}

## 实例：创建第一个弹幕

新建文件 `Projectiles/FirstBolt.cs`，写入下面的代码：

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

## 字段说明

- `friendly = true` 表示它会伤害敌人。
- `hostile = false` 表示它不会伤害玩家。
- `timeLeft` 用来防止弹幕无限存在，验证阶段尤其重要。

## 实例：让武器默认发射弹幕

回到你的武器文件 `Items/FirstSword.cs`，在 `SetDefaults()` 里加入两行：

```csharp
Item.shoot = ModContent.ProjectileType<Projectiles.FirstBolt>();
Item.shootSpeed = 9f;
```

这里假设 `FirstBolt` 的命名空间是 `YourMod.Projectiles`。如果你更喜欢简写，也可以加 `using YourMod.Projectiles;`，然后写 `ModContent.ProjectileType<FirstBolt>()`。

## 实例：用 Shoot 接管发射

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

这段代码的行为是：由你手动生成弹幕，并返回 `false` 阻止默认发射，避免双发。

类比一下：你已经手动按了一次发射键，就要告诉系统别再帮你按一次。

## 实例：在游戏里验证

1. 重新加载 Mod。
2. 生成并使用你的武器。
3. 确认屏幕上出现了你创建的弹幕。

## 常见问题

- 看不到弹幕，先确认 `Item.shoot` 指向的是你的弹幕类型。
- 出现双发，通常是 `Shoot` 里生成弹幕后还返回了 `true`。
- 弹幕一闪而过，检查 `timeLeft` 是否过小，或是否立刻碰撞消失。

## 小结

- `Item.shoot/shootSpeed` 让武器具备默认发射能力。
- `Shoot(...)` 用来接管这一发的发射逻辑。
- 接管后通常返回 `false`，避免默认逻辑再发一次。

## 下一步

下一章将把“会飞的弹幕”升级为“有行为的弹幕”，并用 `AI()` 控制每帧逻辑：

- [弹幕的 AI：让它按你的规则运动](DPapyru-弹幕的AI.md)
