---
title: 第一个饰品：让效果随装备生效
author: 小天使
date: 2026-01-23
last_updated: 2026-01-23
difficulty: beginner
time: 30分钟
description: 创建一个可用饰品，理解 UpdateAccessory 与 ModPlayer 的配合，实现“装备时持续生效”的效果
topic: items
order: 50
prev_chapter: DPapyru-弹幕的AI.md
min_c: 0
min_t: 0
---

# 第一个饰品：让效果随装备生效

本节目标：做一个**装备上就持续生效**的饰品，并把代码写成“可复用、可升级”的结构。

## 先决条件

- 你已经能在游戏里验证自己写的物品（重载 Mod、拿到物品、装备/卸下）。
- 如果你还没做过物品，先看：[第一个物品：做一个最简单的“材料”](DPapyru-第一个物品.md)。

## 扩展阅读

{if C == 0}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#最小示例][C#：最小示例]}
{end}

{if T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-Player类与饰品效果实现.md#概览][tML：饰品效果的核心机制]}
{[文章使用内容索引/tModLoaderAPI/DPapyru-Player类与饰品效果实现.md#最小示例][tML：最小示例]}
{end}

## 核心套路：标记 → 重置 → 应用

饰品的调用频率是“只要装备着就会不断调用”。要让“卸下就失效”稳定成立，建议固定用这个套路：

- 在 `UpdateAccessory` 里只做一件事：**标记**（我装备了）。
- 在 `ModPlayer.ResetEffects()` 里：**重置**所有标记（每帧清零）。
- 在一个合适的钩子里：根据标记**应用**效果（改 Player 字段/加 Buff/触发逻辑）。

## 实作：一个加移速的饰品

我们做一个最小饰品：装备后，移动速度 +15%。

### 1）创建饰品物品

新建文件 `Items/SwiftAmulet.cs`：

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace YourMod.Items
{
    public class SwiftAmulet : ModItem
    {
        public override void SetDefaults()
        {
            Item.width = 28;
            Item.height = 28;
            Item.value = 1000;
            Item.rare = ItemRarityID.White;
            Item.accessory = true;
        }

        public override void UpdateAccessory(Player player, bool hideVisual)
        {
            player.GetModPlayer<SwiftAmuletPlayer>().swiftAmuletEquipped = true;
        }
    }
}
```

### 2）创建对应的 ModPlayer

新建文件 `Players/SwiftAmuletPlayer.cs`：

```csharp
using Terraria;
using Terraria.ModLoader;

namespace YourMod
{
    public class SwiftAmuletPlayer : ModPlayer
    {
        public bool swiftAmuletEquipped;

        public override void ResetEffects()
        {
            swiftAmuletEquipped = false;
        }

        public override void PostUpdateRunSpeeds()
        {
            if (!swiftAmuletEquipped) return;
            Player.moveSpeed += 0.15f;
        }
    }
}
```

这里选 `PostUpdateRunSpeeds()` 是为了把“跑跳速度相关的改动”放在更合适的阶段，后续排错更直观。

## 验证：效果是否生效

1. 重新加载 Mod。
2. 打开饰品栏，把 `SwiftAmulet` 装备上。
3. 对比装备前后，移动速度是否变快。
4. 卸下饰品，是否恢复正常。

{if P_troubleshoot}
如果你感觉“没变化”：

- 确认 `Item.accessory = true`，否则它不会被当作饰品处理。
- 确认 `UpdateAccessory` 被调用（临时加 `Main.NewText(...)`，但不要每帧刷屏，最好用计数器每 30 tick 打一次）。
- 确认 `GetModPlayer<SwiftAmuletPlayer>()` 的类型与实际 `ModPlayer` 类一致。
{end}

## 进阶：装备时解锁一个“攻击触发”效果

持续加成适合做“移速/跳跃/防御”；如果你想要“装备后解锁一个被动触发”，也照样用标记。

在 `SwiftAmuletPlayer` 里追加命中钩子（示例：20% 概率点燃目标）：

```csharp
using Terraria.ID;

public override void OnHitNPCWithItem(Item item, NPC target, NPC.HitInfo hitInfo, int cooldownSlot)
{
    if (!swiftAmuletEquipped) return;
    if (!Main.rand.NextBool(5)) return;

    target.AddBuff(BuffID.OnFire, 180);
}

public override void OnHitNPCWithProj(Projectile proj, NPC target, NPC.HitInfo hitInfo, int cooldownSlot)
{
    if (!swiftAmuletEquipped) return;
    if (!Main.rand.NextBool(5)) return;

    target.AddBuff(BuffID.OnFire, 180);
}
```

## 小结

- `UpdateAccessory` 负责“标记：我装备了”。
- `ResetEffects` 负责“每帧清空标记，卸下就失效”。
- `ModPlayer` 负责“集中管理效果逻辑”，后续升级/复用更轻松。
