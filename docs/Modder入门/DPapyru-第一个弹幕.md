---
title: 第一个弹幕
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 20分钟
description: 让武器发射弹幕，理解物品和弹幕的关系
prev_chapter: DPapyru-第一个武器.md
next_chapter: DPapyru-第一个物块.md
topic: mod-basics
order: 3
colors:
  Red: "#f00"
---

# 第一个弹幕：让武器发射弹幕

这一章的目标是：让你的武器发射弹幕，并且你理解"物品"和"弹幕"是怎么配合工作的。

你之前做的武器是"近战剑"，挥动就能打人。但如果你想做个"发射器"（比如枪、魔法书），就需要弹幕了。

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

## 阅读前需求

- 已完成"第一个武器"章节
- 知道怎么新建 `.cs` 文件并编译

## 第一步：了解代码

我们需要两个文件：
1. 一个武器（物品）：负责"发射"
2. 一个弹幕：负责"飞出去"

### 1）创建弹幕文件：`Content/Projectiles/FirstProjectile.cs`

```csharp
using Terraria;
using Terraria.ModLoader;

namespace YourModName.Content.Projectiles
{
    public class FirstProjectile : ModProjectile
    {
        // AI：弹幕的行为逻辑，每帧都会运行
        public override void AI()
        {
            // 让弹幕一直朝它当前的方向飞
            Projectile.velocity *= 1.02f; // 每帧加速 2%
            
            // 旋转弹幕
            Projectile.rotation += 0.1f;
        }

        // SetDefaults：设置弹幕的默认属性
        public override void SetDefaults()
        {
            Projectile.width = 16;
            Projectile.height = 16;
            Projectile.aiStyle = -1; // -1 表示不使用原版 AI，使用自定义 AI
            Projectile.friendly = true; // 不会打玩家
            Projectile.hostile = false; // 不会打敌人
            Projectile.DamageType = DamageClass.Ranged; // 伤害类型
            Projectile.penetrate = 1; // 能穿透多少个敌人（1 = 打到一个就消失）
            Projectile.timeLeft = 600; // 存在多少帧（60帧 = 1秒，所以这是10秒）
        }
    }
}
```

### 2）创建武器文件：`Content/Items/FirstGun.cs`

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace YourModName.Content.Items
{
    public class FirstGun : ModItem
    {
        public override void SetDefaults()
        {
            Item.damage = 25;
            Item.DamageType = DamageClass.Ranged;
            Item.width = 40;
            Item.height = 20;
            Item.useTime = 20;
            Item.useAnimation = 20;
            Item.useStyle = ItemUseStyleID.Shoot;
            Item.knockBack = 4;
            Item.value = Item.buyPrice(silver: 50);
            Item.rare = ItemRarityID.Green;
            Item.UseSound = SoundID.Item11;
            Item.autoReuse = true;
            
            // 关键：告诉游戏"这个武器发射什么弹幕"
            Item.shoot = ModContent.ProjectileType<FirstProjectile>();
            Item.shootSpeed = 8f; // 弹幕飞出去的速度
        }

        public override void AddRecipes()
        {
            CreateRecipe()
                .AddIngredient(ItemID.Wood, 10)
                .AddIngredient(ItemID.IronBar, 5)
                .AddTile(TileID.WorkBenches)
                .Register();
        }
    }
}
```

编译后进游戏，合成这把枪，试试发射效果。

### 题目

```quiz
type: choice
id: mod-basics-projectile-ai
question: |
  `AI()` 方法有什么特点？
options:
  - id: A
    text: |
      只在弹幕创建时运行一次
  - id: B
    text: |
      每帧都会运行一次
  - id: C
    text: |
      只在弹幕消失时运行
answer: B
explain: |
  AI() 方法每帧都会运行，所以你可以在这里写"每帧要做的事情"，比如移动、旋转、产生粒子效果等。
```

```quiz
type: choice
id: mod-basics-shoot-property
question: |
  武器要发射弹幕，必须设置哪个属性？
options:
  - id: A
    text: |
      Item.useStyle
  - id: B
    text: |
      Item.shoot
  - id: C
    text: |
      Item.damage
answer: B
explain: |
  Item.shoot 告诉游戏"这个武器发射什么弹幕"，可以是原版弹幕（ProjectileID.xxx）也可以是 Mod 弹幕（ModContent.ProjectileType<xxx>()）。
```

## 第二步：学习关键内容

### 弹幕文件里最常改的行：

1. 在 `SetDefaults()` 里：
   - `Projectile.width` / `Projectile.height`：弹幕大小
   - `Projectile.penetrate`：穿透数量
   - `Projectile.timeLeft`：存在时间

2. 在 `AI()` 里：
   - `Projectile.velocity`：速度和方向
   - `Projectile.rotation`：旋转角度

### 武器文件里最常改的行：

1. 在 `SetDefaults()` 里：
   - `Item.shoot`：发射什么弹幕
   - `Item.shootSpeed`：弹幕初速度
   - `Item.useStyle`：使用方式（挥动/射击/投掷等）

练习方式：把这些行删掉，再自己敲回去。

## 第三步：教你"怎么读这份代码"（从上往下）

### 1）弹幕和武器的关系

- **武器（物品）**：负责"发射"这个动作
- **弹幕**：负责"飞出去"之后的事情

### 2）`ModContent.ProjectileType<FirstProjectile>()`：找到你的弹幕

这行代码的意思是：

> "找到我 Mod 里叫 `FirstProjectile` 的弹幕类，把它的类型赋给 `Item.shoot`"

### 3）`AI()`：弹幕的行为逻辑

`AI()` 方法每帧都会运行，所以你可以在这里写"每帧要做的事情"：

- 改变速度：`Projectile.velocity *= 1.02f;`
- 改变方向：`Projectile.velocity = Projectile.velocity.RotatedBy(0.1f);`
- 旋转弹幕：`Projectile.rotation += 0.1f;`
- 产生粒子：`Dust.NewDust(...)`

### 4）`SetDefaults()`：弹幕的默认属性

弹幕的 `SetDefaults()` 和武器的 `SetDefaults()` 很像，都是设置"初始属性"：

- `Projectile.width` / `Projectile.height`：碰撞箱大小
- `Projectile.friendly`：会不会打玩家（true = 不会，false = 会）
- `Projectile.hostile`：会不会打敌人（true = 会，false = 不会）
- `Projectile.penetrate`：能穿透多少个敌人
- `Projectile.timeLeft`：存在多少帧后自动消失
- `Projectile.aiStyle`：使用原版 AI 还是自定义 AI（-1 = 自定义）

### 5）`Item.shootSpeed`：弹幕初速度

`Item.shootSpeed` 决定弹幕"飞出去"时的初始速度。

- 数值越大，弹幕飞得越快
- 数值越小，弹幕飞得越慢

**练习**：把 `Item.shootSpeed` 从 `8f` 改成 `20f`，进游戏试试手感。

## 常见问题（先救命，后讲道理）

### 1）我发射了武器，但弹幕没出来

**原因**：最常见是 `Item.shoot` 没设置，或者设置错了。

**解决**：
- 检查 `Item.shoot = ModContent.ProjectileType<FirstProjectile>();` 是否存在
- 检查弹幕类名是否写对（大小写敏感）
- 检查弹幕文件是否在正确的命名空间里

### 2）弹幕飞出去就消失了

**原因**：可能是 `Projectile.timeLeft` 太小，或者 `Projectile.penetrate` 太小。

**解决**：
- 把 `Projectile.timeLeft` 改大（比如 `600`）
- 把 `Projectile.penetrate` 改大（比如 `3`）

### 3）弹幕打不到敌人

**原因**：可能是 `Projectile.friendly` 或 `Projectile.hostile` 设置错了。

**解决**：
- 如果你想让弹幕打敌人，设置 `Projectile.friendly = true;` 和 `Projectile.hostile = false;`
- 如果你想让弹幕打玩家，设置 `Projectile.friendly = false;` 和 `Projectile.hostile = true;`

### 4）弹幕不旋转/不加速

**原因**：`AI()` 方法没写，或者写错了。

**解决**：
- 确认 `AI()` 方法存在
- 确认 `AI()` 里的代码正确（比如 `Projectile.velocity *= 1.02f;`）

## 下一步会学什么？

这一章你已经学会了"让武器发射弹幕"，并且理解了"物品"和"弹幕"的关系。

下一章我们会做"第一个物块"：你会看到"物块"是怎么被放置、被挖掘、被交互的。
