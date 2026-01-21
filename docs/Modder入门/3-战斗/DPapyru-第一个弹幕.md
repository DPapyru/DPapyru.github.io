---
title: 第一个弹幕
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 20分钟
description: 让武器发射弹幕，理解物品和弹幕的关系
prev_chapter: ../1-入门/DPapyru-第一个武器.md
next_chapter: ../2-物品/DPapyru-第一个物块.md
topic: mod-basics
order: 3
colors:
  Red: "#f00"
---

# 第一个弹幕：让武器发射弹幕

你之前做的武器是"近战剑"，挥动就能打人。但如果你想做个"发射器"（比如枪、魔法书），就需要弹幕了。

{if C == 0}
> **适用人群**：首次接触 C#（C0）。
>
> **本章目标**：完成第一个弹幕，并能独立修改弹幕属性与 AI 行为。
{else}
> **适用人群**：已具备 C# 基础（C≥1）。
>
> **建议路径**：先完成"复制 → 编译 → 进游戏验证"，再集中修改 `Projectile.width / AI() / Item.shoot` 等关键行。
{end}

---

## 验收标准

完成本章后，你应能：

- 创建可发射的弹幕
- 让武器正确发射自定义弹幕
- 修改弹幕的基本属性（大小、穿透、时间等）
- 编写简单的自定义 AI

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

---

## 阅读前需求

- 已完成"第一个武器"章节
- 知道怎么新建 `.cs` 文件并编译

---

## 第一步：了解代码

我们需要两个文件：

1. **武器（物品）**：负责"发射"
2. **弹幕**：负责"飞出去"

### 1.1 创建弹幕文件：`Content/Projectiles/FirstProjectile.cs`

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

### 1.2 创建武器文件：`Content/Items/FirstGun.cs`

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

复制完成后先编译一次，确保"能跑"。

### 概念关联测验

> **测验对应概念**：`AI()`、`Item.shoot`、`Projectile.penetrate`

```quiz
type: choice
id: mod-basics-projectile-basics
question: |
  下列哪些行是修改"弹幕行为/发射逻辑"时最常改动的？
options:
  - id: A
    text: |
      `Projectile.velocity *= 1.02f;`
  - id: B
    text: |
      `Item.shoot = ModContent.ProjectileType<FirstProjectile>();`
  - id: C
    text: |
      `Projectile.penetrate = 1;`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  AI 行为在 `AI()` 里改，发射逻辑在 `Item.shoot` 里改，穿透属性在 `Projectile.penetrate` 里改。
```

---

## 第二步：练习（建议）

### 2.1 弹幕文件里最常改的行

在 `SetDefaults()` 里：

- `Projectile.width / Projectile.height`（弹幕大小）
- `Projectile.penetrate`（穿透数量）
- `Projectile.timeLeft`（存在时间）

在 `AI()` 里：

- `Projectile.velocity`（速度和方向）
- `Projectile.rotation`（旋转角度）

### 2.2 武器文件里最常改的行

在 `SetDefaults()` 里：

- `Item.shoot`（发射什么弹幕）
- `Item.shootSpeed`（弹幕初速度）
- `Item.useStyle`（使用方式：挥动/射击/投掷等）

### 2.3 练习方式

把这些行删掉，再自己敲回去。

---

## 第三步：补充阅读（按需）

{if C == 0}
{[./_分流/第一个弹幕-C0-CSharp读代码.md][C# 补课（C0）：看懂本章语法]}
{end}

{if T == 0}
{[./_分流/第一个弹幕-T0-tML读代码.md][tModLoader 补课（T0）：看懂本章 API]}
{end}

---

## 常见问题（排错）

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

---

## 本章自测（可选）

用于自查是否达到"能创建弹幕"的最低标准：

- [ ] 我能指出 `SetDefaults()` 中三处常改动点：大小/穿透/时间
- [ ] 我能指出 `AI()` 中两处常改动点：速度/旋转
- [ ] 我能解释 `Item.shoot` 的作用，并能在武器里正确设置

---

## 下一步

本章完成后，你应能独立创建弹幕并让武器正确发射它。

下一章我们会做"第一个物块"：你会看到物块是怎么被放置、被挖掘的。
