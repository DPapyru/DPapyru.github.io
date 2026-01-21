---
title: 第一个弹药
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 20分钟
description: 创建可消耗的弹药，理解弹药和武器的关系
prev_chapter: ../2-物品/DPapyru-第一个物块.md
next_chapter: ../4-玩家/DPapyru-第一个NPC.md
topic: mod-basics
order: 7
colors:
  Red: "#f00"
---

# 第一个弹药：创建可消耗的弹药

弹药是"可以被武器消耗的物品"：子弹、箭矢、火箭……都是弹药。

{if C == 0}
> **适用人群**：首次接触 C#（C0）。
>
> **本章目标**：完成第一个弹药，并能独立修改弹药类型、伤害与发射逻辑。
{else}
> **适用人群**：已具备 C# 基础（C≥1）。
>
> **建议路径**：先完成"复制 → 编译 → 进游戏验证"，再集中修改 `Item.ammo / Item.useAmmo / ModifyShootStats` 等关键行。
{end}

---

## 验收标准

完成本章后，你应能：

- 创建可消耗的弹药物品
- 创建对应的弹药弹幕
- 让武器正确消耗弹药并发射自定义弹幕
- 理解弹药、武器、弹幕三者之间的关系

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

---

## 阅读前需求

- 已完成"第一个武器"章节
- 已完成"第一个弹幕"章节
- 知道怎么新建 `.cs` 文件并编译

---

## 第一步：了解代码

我们需要三个文件：

1. **弹药物品**：负责"被消耗"
2. **弹药弹幕**：负责"飞出去"
3. **使用弹药的武器**：负责"发射"

### 1.1 创建弹药物品：`Content/Items/FirstAmmo.cs`

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace YourModName.Content.Items
{
    public class FirstAmmo : ModItem
    {
        public override void SetDefaults()
        {
            Item.width = 14;
            Item.height = 14;
            Item.maxStack = 999;
            Item.consumable = true; // 这个物品是消耗品
            Item.ammo = AmmoID.Bullet; // 这个物品是子弹类型的弹药
            Item.damage = 10; // 弹药的基础伤害
            Item.DamageType = DamageClass.Ranged;
            Item.shoot = ModContent.ProjectileType<Projectiles.FirstAmmoProjectile>();
            Item.shootSpeed = 8f;
            Item.knockBack = 2f;
            Item.value = Item.buyPrice(copper: 5);
            Item.rare = ItemRarityID.White;
        }

        public override void AddRecipes()
        {
            CreateRecipe()
                .AddIngredient(ItemID.IronBar, 1)
                .AddIngredient(ItemID.Gunpowder, 1)
                .AddTile(TileID.WorkBenches)
                .Register();
        }
    }
}
```

### 1.2 创建弹药弹幕：`Content/Projectiles/FirstAmmoProjectile.cs`

```csharp
using Terraria;
using Terraria.ModLoader;

namespace YourModName.Content.Projectiles
{
    public class FirstAmmoProjectile : ModProjectile
    {
        public override void SetDefaults()
        {
            Projectile.width = 8;
            Projectile.height = 8;
            Projectile.aiStyle = 1; // 使用原版子弹的 AI
            Projectile.friendly = true;
            Projectile.hostile = false;
            Projectile.DamageType = DamageClass.Ranged;
            Projectile.penetrate = 1;
            Projectile.timeLeft = 600;
        }
    }
}
```

### 1.3 创建使用弹药的武器：`Content/Items/FirstAmmoGun.cs`

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace YourModName.Content.Items
{
    public class FirstAmmoGun : ModItem
    {
        public override void SetDefaults()
        {
            Item.damage = 30;
            Item.DamageType = DamageClass.Ranged;
            Item.width = 40;
            Item.height = 20;
            Item.useTime = 15;
            Item.useAnimation = 15;
            Item.useStyle = ItemUseStyleID.Shoot;
            Item.knockBack = 4;
            Item.value = Item.buyPrice(gold: 1);
            Item.rare = ItemRarityID.Green;
            Item.UseSound = SoundID.Item11;
            Item.autoReuse = true;

            // 关键：告诉游戏"这个武器使用什么弹药"
            Item.useAmmo = AmmoID.Bullet;

            // 关键：告诉游戏"这个武器发射什么弹幕"
            Item.shoot = ProjectileID.Bullet; // 默认发射原版子弹
            Item.shootSpeed = 8f;
        }

        // CanShoot：判断"能不能发射"
        public override bool CanShoot(Player player)
        {
            // 检查玩家是否有我们的弹药
            return player.HasAmmo(Item, ModContent.ItemType<FirstAmmo>());
        }

        // ModifyShootStats：修改"发射参数"
        public override void ModifyShootStats(Player player, ref Vector2 position, ref Vector2 velocity, ref int type, ref int damage, ref float knockback)
        {
            // 如果玩家有我们的弹药，就发射我们的弹幕
            if (player.HasAmmo(Item, ModContent.ItemType<FirstAmmo>()))
            {
                type = ModContent.ProjectileType<Projectiles.FirstAmmoProjectile>();
            }
        }

        public override void AddRecipes()
        {
            CreateRecipe()
                .AddIngredient(ItemID.IronBar, 10)
                .AddIngredient(ItemID.Wood, 5)
                .AddTile(TileID.Anvils)
                .Register();
        }
    }
}
```

复制完成后先编译一次，确保"能跑"。

### 概念关联测验

> **测验对应概念**：`Item.ammo`、`Item.useAmmo`、`HasAmmo()`

```quiz
type: choice
id: mod-basics-ammo-basics
question: |
  下列哪些行是修改"弹药类型/发射逻辑"时最常改动的？
options:
  - id: A
    text: |
      `Item.ammo = AmmoID.Bullet;`
  - id: B
    text: |
      `Item.useAmmo = AmmoID.Bullet;`
  - id: C
    text: |
      `type = ModContent.ProjectileType<Projectiles.FirstAmmoProjectile>();`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  弹药类型在 `Item.ammo` 里改，武器弹药类型在 `Item.useAmmo` 里改，弹幕类型在 `ModifyShootStats()` 里改。
```

---

## 第二步：练习（建议）

### 2.1 弹药物品里最常改的行

在 `SetDefaults()` 里：

- `Item.ammo`（弹药类型）
- `Item.damage`（弹药基础伤害）
- `Item.shoot`（弹药发射的弹幕）

### 2.2 武器里最常改的行

在 `SetDefaults()` 里：

- `Item.useAmmo`（使用什么类型的弹药）
- `Item.shoot`（默认发射什么弹幕）

在 `ModifyShootStats()` 里：

- 修改发射参数（比如弹幕类型、伤害、速度）

### 2.3 练习方式

把这些行删掉，再自己敲回去。

---

## 第三步：补充阅读（按需）

{if C == 0}
{[./_分流/第一个弹药-C0-CSharp读代码.md][C# 补课（C0）：看懂本章语法]}
{end}

{if T == 0}
{[./_分流/第一个弹药-T0-tML读代码.md][tModLoader 补课（T0）：看懂本章 API]}
{end}

---

## 常见问题（排错）

### 1）我发射了武器，但没消耗弹药

**原因**：最常见是 `Item.useAmmo` 没设置，或者弹药的 `Item.ammo` 类型不匹配。

**解决**：
- 检查武器的 `Item.useAmmo` 是否设置
- 检查弹药的 `Item.ammo` 类型是否匹配

### 2）我发射了武器，但弹幕不对

**原因**：`ModifyShootStats()` 没写，或者写错了。

**解决**：
- 检查 `ModifyShootStats()` 是否存在
- 检查 `type = ModContent.ProjectileType<Projectiles.FirstAmmoProjectile>();` 是否正确

### 3）我发射了武器，但没伤害

**原因**：弹药的 `Item.damage` 没设置，或者武器的 `Item.damage` 太小。

**解决**：
- 检查弹药的 `Item.damage` 是否设置
- 检查武器的 `Item.damage` 是否设置

### 4）我发射了武器，但弹幕飞得不对

**原因**：`Item.shootSpeed` 没设置，或者设置错了。

**解决**：
- 检查 `Item.shootSpeed` 是否设置
- 检查 `Item.shootSpeed` 的数值是否合适

---

## 本章自测（可选）

用于自查是否达到"能创建弹药"的最低标准：

- [ ] 我能指出弹药物品中三处常改动点：类型/伤害/弹幕
- [ ] 我能指出武器中两处常改动点：useAmmo/ModifyShootStats
- [ ] 我能解释弹药、武器、弹幕三者之间的关系

---

## 下一步

本章完成后，你应能独立创建弹药并让武器正确消耗它。

下一章我们会做"第一个 NPC"：你会看到 NPC 是怎么拥有商店和对话的。
