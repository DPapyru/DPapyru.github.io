---
title: tModLoader：Player 类与饰品/装备效果实现
author: 小天使
date: 2026-01-23
last_updated: 2026-01-23
difficulty: beginner
time: 28分钟
description: 解释 Player 类的核心字段与 ModPlayer 机制，说明如何通过 UpdateAccessory 为玩家添加饰品/装备效果
topic: items
order: 25
min_c: 0
min_t: 0
---

# tModLoader：Player 类与饰品/装备效果实现

## 概览

饰品（Accessory）与武器的核心区别在于：**饰品的效果不是“使用时触发”，而是“装备时持续生效”**。

实现饰品效果你需要理解三层机制：

1. **饰品本身**：在 `ModItem.UpdateAccessory()` 中标记效果已激活。
2. **ModPlayer**：在 `ModPlayer.ResetEffects()` 中重置状态，在对应钩子中应用效果。
3. **Player 类**：提供属性访问与修改入口（生命值、伤害加成、移动速度等）。

类比一下更清楚：饰品是“开关”，`UpdateAccessory` 负责“按下开关”，`ModPlayer` 负责“根据开关状态调整玩家属性”。

## 最小示例

{if T == 0}
下面是一个“最简单的饰品效果”：装备时增加 10% 伤害。

**步骤 1：创建饰品类**
```csharp
using Terraria;
using Terraria.ModLoader;

namespace YourMod.Items
{
    public class SimpleAccessory : ModItem
    {
        public override void SetDefaults()
        {
            Item.width = 28;
            Item.height = 28;
            Item.value = 1000;
            Item.rare = ItemRarityID.White;
            Item.accessory = true;  // 关键：声明这是饰品
        }

        public override void UpdateAccessory(Player player, bool hideVisual)
        {
            // 告诉 ModPlayer：这个饰品的效果已激活
            player.GetModPlayer<SimpleAccessoryPlayer>().hasEffect = true;
        }
    }
}
```

**步骤 2：创建对应的 ModPlayer**
```csharp
using Terraria.ModLoader;

namespace YourMod.Players
{
    public class SimpleAccessoryPlayer : ModPlayer
    {
        public bool hasEffect = false;

        // 每帧开始前重置状态
        public override void ResetEffects()
        {
            hasEffect = false;
        }

        // 应用效果（每帧都会调用）
        public override void ModifyHitNPCWithItem(Item item, NPC target, ref NPC.HitInfo hitInfo, ref int cooldownSlot)
        {
            if (hasEffect)
            {
                hitInfo.Damage = (int)(hitInfo.Damage * 1.1f);  // 增加 10% 伤害
            }
        }
    }
}
```

**关键点：**
- `Item.accessory = true` 让游戏把它当作饰品（可以装进饰品栏）。
- `UpdateAccessory` 在玩家**装备**饰品时被调用，用于标记效果已激活。
- `ResetEffects()` 每帧重置 `hasEffect`，确保效果只在装备时生效。
- 实际的效果逻辑写在 `ModPlayer` 的钩子里，这样多个饰品/升级版饰品的逻辑可以复用。
{else if T == 1}
核心模式是“标记-重置-应用”三步走：

```csharp
// 饰品：标记效果
public override void UpdateAccessory(Player player, bool hideVisual)
{
    player.GetModPlayer<MyPlayer>().effectActive = true;
}

// ModPlayer：重置与应用
public override void ResetEffects()
{
    effectActive = false;
}

public override void ModifySpeed(ref float speed)
{
    if (effectActive)
        speed *= 1.15f;  // 15% 移动速度
}
```

这种模式的优点是：逻辑集中在 `ModPlayer`，升级版饰品只需重新标记同一个字段。
{else}
从架构角度看，这套机制的本质是“状态分离”：

- `UpdateAccessory` 负责“读取装备状态并写入玩家状态”。
- `ModPlayer` 负责“根据玩家状态计算属性修正”。
- `Player` 类的 `GetDamage<T>()`、`GetCritChance<T>()` 等返回 `StatModifier` 引用，支持链式操作。

对于复杂效果（如套装效果、配件互斥、动态修正），建议在 `ModPlayer` 中维护独立的状态机，而不是直接在 `UpdateAccessory` 中修改玩家属性。
{end}

## 常见坑

{if P_troubleshoot}
- **效果不生效**：先确认 `Item.accessory = true` 已设置，再检查 `player.GetModPlayer<T>()` 返回的是否是同一实例。
- **效果一直存在**：忘记在 `ResetEffects()` 中重置状态字段，导致效果在卸下饰品后仍保留。
- **和原版加成冲突**：直接修改 `player.statLifeMax` 或 `player.meleeDamage` 可能被原版逻辑覆盖；优先用 `GetTotalDamage<T>().ApplyTo()` 或对应的修改钩子。
- **找不到 `GetModPlayer`**：`GetModPlayer<T>()` 是 `Player` 的扩展方法，需要 `using Terraria.ModLoader;`。
- **UpdateAccessory 被跳过**：检查是否在 `SetDefaults()` 里漏了 `Item.accessory = true`。
{end}

## 进阶与惯用写法

{if P_best_practice}
- **区分“显示”和“逻辑”**：`UpdateAccessory` 的 `hideVisual` 参数用于控制是否显示饰品外观，不要用这个参数控制逻辑开关。
- **复用 ModPlayer**：多个饰品共享同一个效果时，用同一个 `ModPlayer` 字段标记，避免逻辑重复。
- **使用 StatModifier**：对于伤害、暴击、攻速等属性，优先通过 `player.GetDamage<DamageClass.Melee>()` 获取 `StatModifier` 并修改，而不是直接改 `player.meleeDamage`。
- **套装效果**：在 `ModPlayer` 中维护一个“已装备套装计数”，在 `UpdateAccessory` 中增加计数，在 `ResetEffects` 中重置计数。
- **性能注意**：避免在 `UpdateAccessory` 中做高频计算或对象分配；把计算放到对应的 `Modify*` 钩子或 `PreUpdateMovement` 等更新钩子中。
{end}

## API 速查

{if P_api_reference}
- `Item.accessory`：声明物品为饰品
- `ModItem.UpdateAccessory(Player, bool hideVisual)`：饰品装备时调用（用于标记效果）
- `ModPlayer.ResetEffects()`：每帧重置效果状态
- `Player.GetModPlayer<T>()`：获取指定类型的 ModPlayer 实例
- `Player.GetDamage<DamageClass>()` / `GetCritChance<DamageClass>()` / `GetAttackSpeed<DamageClass>()`：获取属性修正的引用
- `StatModifier.ApplyTo(float baseValue)`：应用修正计算最终值
- `ModPlayer.PreUpdateMovement`：每帧移动前更新（如速度修改）
- `ModPlayer.ModifyHitNPCWithItem` / `ModifyHitNPCWithProj`：命中时修改伤害
{end}
