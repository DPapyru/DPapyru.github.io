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

这一章的目标是：创建一个可消耗的弹药，并且你理解"弹药"和"武器"是怎么配合工作的。

弹药是"可以被武器消耗的物品"：子弹、箭矢、火箭……都是弹药。

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

## 阅读前需求

- 已完成"第一个武器"章节
- 已完成"第一个弹幕"章节
- 知道怎么新建 `.cs` 文件并编译

## 第一步：了解代码

我们需要三个文件：
1. 一个弹药物品：负责"被消耗"
2. 一个弹药弹幕：负责"飞出去"
3. 一个使用弹药的武器：负责"发射"

### 1）创建弹药物品：`Content/Items/FirstAmmo.cs`

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

### 2）创建弹药弹幕：`Content/Projectiles/FirstAmmoProjectile.cs`

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

### 3）创建使用弹药的武器：`Content/Items/FirstAmmoGun.cs`

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

编译后进游戏，合成这把枪和弹药，然后试试发射效果。

### 题目

```quiz
type: choice
id: mod-basics-ammo-property
question: |
  弹药物品必须设置哪个属性才能被武器消耗？
options:
  - id: A
    text: |
      Item.consumable
  - id: B
    text: |
      Item.ammo
  - id: C
    text: |
      Item.shoot
answer: B
explain: |
  Item.ammo 告诉游戏"这个物品是什么类型的弹药"，武器通过这个属性来匹配弹药。
```

```quiz
type: choice
id: mod-basics-use-ammo
question: |
  武器要使用弹药，必须设置哪个属性？
options:
  - id: A
    text: |
      Item.useAmmo
  - id: B
    text: |
      Item.shoot
  - id: C
    text: |
      Item.damage
answer: A
explain: |
  Item.useAmmo 告诉游戏"这个武器使用什么类型的弹药"，比如 AmmoID.Bullet 表示使用子弹。
```

## 第二步：学习关键内容

### 弹药物品里最常改的行：

1. 在 `SetDefaults()` 里：
   - `Item.ammo`：弹药类型
   - `Item.damage`：弹药基础伤害
   - `Item.shoot`：弹药发射的弹幕

### 武器里最常改的行：

1. 在 `SetDefaults()` 里：
   - `Item.useAmmo`：使用什么类型的弹药
   - `Item.shoot`：默认发射什么弹幕

2. 在 `CanShoot()` 里：
   - 判断"能不能发射"

3. 在 `ModifyShootStats()` 里：
   - 修改"发射参数"（比如弹幕类型、伤害、速度）

练习方式：把这些行删掉，再自己敲回去。

## 第三步：教你"怎么读这份代码"（从上往下）

### 1）弹药和武器的关系

- **弹药物品**：背包里的"子弹"
- **弹药弹幕**：飞出去的"子弹"
- **武器**：发射弹药的"枪"

当你"发射"武器时：
1. 武器检查你有没有对应的弹药
2. 如果有，消耗一个弹药物品
3. 发射一个弹幕

### 2）`Item.ammo`：弹药的类型

`Item.ammo` 告诉游戏"这个物品是什么类型的弹药"：

```csharp
Item.ammo = AmmoID.Bullet; // 子弹类型
```

常见的弹药类型：
- `AmmoID.Bullet`：子弹
- `AmmoID.Arrow`：箭矢
- `AmmoID.Rocket`：火箭

武器通过 `Item.useAmmo` 来匹配弹药类型。

### 3）`Item.useAmmo`：武器的弹药类型

`Item.useAmmo` 告诉游戏"这个武器使用什么类型的弹药"：

```csharp
Item.useAmmo = AmmoID.Bullet; // 使用子弹
```

如果武器设置了 `Item.useAmmo`，发射时会自动消耗对应的弹药。

### 4）`CanShoot()`：判断"能不能发射"

`CanShoot()` 方法在武器发射前被调用，你可以在这里写"发射条件"：

```csharp
public override bool CanShoot(Player player)
{
    // 检查玩家是否有我们的弹药
    return player.HasAmmo(Item, ModContent.ItemType<FirstAmmo>());
}
```

如果返回 `true`，可以发射；如果返回 `false`，不能发射。

### 5）`ModifyShootStats()`：修改"发射参数"

`ModifyShootStats()` 方法在武器发射时被调用，你可以在这里修改"发射参数"：

```csharp
public override void ModifyShootStats(Player player, ref Vector2 position, ref Vector2 velocity, ref int type, ref int damage, ref float knockback)
{
    // 如果玩家有我们的弹药，就发射我们的弹幕
    if (player.HasAmmo(Item, ModContent.ItemType<FirstAmmo>()))
    {
        type = ModContent.ProjectileType<Projectiles.FirstAmmoProjectile>();
    }
}
```

参数说明：
- `position`：发射位置
- `velocity`：发射速度和方向
- `type`：弹幕类型
- `damage`：伤害
- `knockback`：击退

### 6）`player.HasAmmo()`：检查"有没有弹药"

`player.HasAmmo()` 方法检查玩家是否有指定的弹药：

```csharp
player.HasAmmo(Item, ModContent.ItemType<FirstAmmo>())
```

- 第一个参数：武器物品
- 第二个参数：弹药物品类型

如果返回 `true`，玩家有弹药；如果返回 `false`，玩家没有弹药。

## 常见问题（先救命，后讲道理）

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
