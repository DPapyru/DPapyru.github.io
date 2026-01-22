---
title: tModLoader：ModItem 的 Shoot（自定义发射）与第一个弹幕
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 22分钟
description: 解释 Item.shoot/shootSpeed 与 Shoot(...) 的关系，给出可运行的“发射自定义弹幕”最小示例与常见误区
topic: items
order: 30
min_c: 0
min_t: 0
---

# tModLoader：ModItem 的 Shoot（自定义发射）与第一个弹幕

## 概览

当一个物品需要“发射弹幕”时，你通常会用到两层机制：

1. **默认发射**：设置 `Item.shoot` 与 `Item.shootSpeed`，让 tML 在使用物品时自动发射。
2. **自定义发射**：重写 `Shoot(...)`，在发射前后改动位置/速度/数量/类型，甚至完全接管发射。

这两层的关系是：`Item.shoot` 决定“默认会发射什么”，`Shoot(...)` 决定“这次具体怎么发射”。

## 最小示例

{if T == 0}
下面示例展示最常见的做法：在 `Shoot(...)` 中手动生成弹幕，并返回 `false` 阻止默认发射（避免重复）：

```csharp
using Microsoft.Xna.Framework;
using Terraria;
using Terraria.DataStructures;
using Terraria.ModLoader;

public override bool Shoot(
    Player player,
    EntitySource_ItemUse_WithAmmo source,
    Vector2 position,
    Vector2 velocity,
    int type,
    int damage,
    float knockback)
{
    int projectileType = ModContent.ProjectileType<FirstBolt>();
    Projectile.NewProjectile(source, position, velocity, projectileType, damage, knockback, player.whoAmI);
    return false;
}
```

要点：

- `source`：生成来源（用于掉落/击杀归因与一致性）
- `position/velocity`：你可以直接用，也可以修改（例如散射）
- `damage/knockback`：通常沿用参数即可，让前面的 `Item.damage` 等设置继续生效
{else if T == 1}
工程上常见做法是：在 `Shoot` 内只负责“调整这次发射”，并尽量沿用 `damage/knockback/type`，避免把伤害逻辑散落在多个位置。
{else}
进阶做法会考虑联机同步、随机种子一致性与性能（例如减少每帧随机、避免不必要的实体生成）；但在“第一个弹幕”阶段不必过早复杂化。
{end}

## 常见坑

{if P_troubleshoot}
- `Shoot` 方法签名不匹配：不同 tML 版本/模板可能有差异；以 IDE 自动生成的 `override` 为准。
- 返回值写错：`return true` 会让“默认发射”继续发生；如果你又手动 `NewProjectile`，就会双发。
- 忘了 `using Terraria.DataStructures;`：导致 `EntitySource_ItemUse_WithAmmo` 类型找不到。
- 位置/速度为 0：检查是否正确设置 `Item.shootSpeed`，以及是否在 `Shoot` 中覆盖了 `velocity`。
{end}

## 进阶与惯用写法

{if P_best_practice}
- 保持“数据在 SetDefaults、逻辑在 Shoot”的分工：默认参数写进 `SetDefaults()`，只在 `Shoot` 做本次发射的差异化调整。
- 多弹与散射建议用“基向量 + 小角度旋转”的写法，避免直接对 `velocity.X/Y` 加随机导致不可控。
{end}

## API 速查

{if P_api_reference}
- `Item.shoot`：默认弹幕类型
- `Item.shootSpeed`：默认弹幕速度
- `ModItem.Shoot(...)`：自定义发射入口（返回 `bool` 决定是否继续默认发射）
- `Projectile.NewProjectile(...)`：生成弹幕实体
- `ModContent.ProjectileType<T>()`：取自定义弹幕的类型 ID
{end}
