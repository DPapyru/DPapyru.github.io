---
title: 第一个Buff
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 20分钟
description: 做第一个Buff同时学习如何创建持续效果
prev_chapter: ../4-玩家/DPapyru-第一个饰品.md
next_chapter: ../3-战斗/DPapyru-第一个召唤物.md
topic: mod-basics
order: 7
colors:
  Red: "#f00"
---

# 第一个Buff：做一个持续伤害Buff同时学习Buff系统

Buff 是什么？简单来说，**Buff 是一种持续的效果**，比如中毒、燃烧、加速、回血等。Buff 会持续一段时间，在这段时间内，它会不断影响玩家或敌人。

{if C == 0}
> **适用人群**：首次接触 C#（C0）。
>
> **本章目标**：完成第一个 Buff，并能独立修改 Buff 效果与持续时间。
{else}
> **适用人群**：已具备 C# 基础（C≥1）。
>
> **建议路径**：先完成"复制 → 编译 → 进游戏验证"，再集中修改 `Update() / Item.buffTime / Main.debuff` 等关键行。
{end}

---

## 验收标准

完成本章后，你应能：

- 创建可施加给玩家的 Buff
- 创建能给予 Buff 的物品（如药水）
- 修改 Buff 的效果与持续时间
- 理解 Buff 的 Update 逻辑

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

---

## 阅读前需求

- 已完成"第一个饰品"章节
- 知道怎么新建 `.cs` 文件（放进你的 Mod 项目里）

---

## 第一步：了解代码

Buff 需要两个文件：

1. **Buff 类**：定义 Buff 的属性和行为
2. **给玩家添加 Buff 的物品**：比如一个药水，喝了之后获得 Buff

建议你把文件放在类似位置：

- `Content/Buffs/PoisonDebuff.cs`（Buff 类）
- `Content/Items/PoisonPotion.cs`（药水物品）

### 1.1 创建 Buff 类

把下面这份代码复制到 `PoisonDebuff.cs`：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ModLoader;

// 定义命名空间
namespace YourModName.Content.Buffs
{
    // 定义一个继承自 ModBuff 的类
    public class PoisonDebuff : ModBuff
    {
        // 设置 Buff 的默认属性
        public override void SetStaticDefaults()
        {
            // 设置 Buff 的名字和描述
            Main.buffName[Type] = "中毒";
            Main.buffTip[Type] = "持续受到伤害";
            // 设置 Buff 是负面效果
            Main.debuff[Type] = true;
        }

        // 当玩家有这个 Buff 时，每帧都会调用这个方法
        public override void Update(Player player, ref int buffIndex)
        {
            // 每秒造成 5 点伤害
            if (player.buffTime[buffIndex] % 60 == 0)
            {
                player.statLife -= 5;
                // 确保生命值不会低于 0
                if (player.statLife < 0)
                {
                    player.statLife = 0;
                }
                // 显示伤害数字
                CombatText.NewText(player.getRect(), new Microsoft.Xna.Framework.Color(255, 0, 0), 5, true);
            }
        }
    }
}
```

### 1.2 创建药水物品

把下面这份代码复制到 `PoisonPotion.cs`：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;
using YourModName.Content.Buffs;  // 引用我们的 Buff 类

// 定义命名空间
namespace YourModName.Content.Items
{
    // 定义一个继承自 ModItem 的类
    public class PoisonPotion : ModItem
    {
        // 设置物品的默认属性
        public override void SetDefaults()
        {
            // 设置药水的各项属性
            Item.width = 20;
            Item.height = 30;
            Item.useStyle = ItemUseStyleID.DrinkLiquid;
            Item.useAnimation = 15;
            Item.useTime = 15;
            Item.useTurn = true;
            Item.UseSound = SoundID.Item3;
            Item.maxStack = 30;
            Item.consumable = true;
            Item.rare = ItemRarityID.Blue;
            Item.value = Item.buyPrice(silver: 2);
            Item.buffType = ModContent.BuffType<PoisonDebuff>();  // 设置 Buff 类型
            Item.buffTime = 300;  // Buff 持续时间（帧），300 帧约等于 5 秒
        }

        // 添加合成配方
        public override void AddRecipes()
        {
            Recipe recipe = CreateRecipe();
            recipe.AddIngredient(ItemID.Bottle, 1);
            recipe.AddIngredient(ItemID.VilePowder, 3);
            recipe.AddTile(TileID.Bottles);
            recipe.Register();
        }
    }
}
```

复制完成后先编译一次，确保"能跑"。

### 概念关联测验

> **测验对应概念**：`ModBuff`、`Update()`、`Item.buffType`

```quiz
type: choice
id: mod-basics-first-buff-basics
question: |
  下列哪些行是修改"Buff效果/持续时间"时最常改动的？
options:
  - id: A
    text: |
      `player.statLife -= 5;`
  - id: B
    text: |
      `Item.buffTime = 300;`
  - id: C
    text: |
      `Item.buffType = ModContent.BuffType<PoisonDebuff>();`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  Buff 效果在 `Update()` 里改，持续时间在 `Item.buffTime` 里改，Buff 类型在 `Item.buffType` 里改。
```

---

## 第二步：练习（建议）

### 2.1 Buff 文件里最常改的行

在 `SetStaticDefaults()` 里：

- `Main.buffName[Type] = "中毒";`（Buff 名字）
- `Main.buffTip[Type] = "持续受到伤害";`（Buff 描述）
- `Main.debuff[Type] = true;`（是否负面效果）

在 `Update()` 里：

- `player.statLife -= 5;`（伤害数值）
- `if (player.buffTime[buffIndex] % 60 == 0)`（触发频率）

### 2.2 物品文件里最常改的行

在 `SetDefaults()` 里：

- `Item.buffType = ModContent.BuffType<PoisonDebuff>();`（Buff 类型）
- `Item.buffTime = 300;`（持续时间）

### 2.3 练习方式

把这些行删掉，再自己敲回去。

---

## 第三步：补充阅读（按需）

{if C == 0}
{[./_分流/第一个Buff-C0-CSharp读代码.md][C# 补课（C0）：看懂本章语法]}
{end}

{if T == 0}
{[./_分流/第一个Buff-T0-tML读代码.md][tModLoader 补课（T0）：看懂本章 API]}
{end}

---

## 常见问题（排错）

### 1）我编译报错，最常见是哪里？

**原因**：`YourModName` 没替换，或 `namespace` 写错了

**解决**：
- 检查 `namespace YourModName...` 里的 `YourModName` 是否换成你项目实际使用的名字
- 检查 `using YourModName.Content.Buffs;` 是否正确

### 2）我进游戏找不到这个药水/配方

**解决**：
- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 配方需要在瓶子旁边打开合成栏才会出现
- 药水需要右键使用才会给玩家添加 Buff

### 3）我喝了药水，但是没有 Buff 效果

**解决**：
- 检查 `Item.buffType = ModContent.BuffType<PoisonDebuff>();` 是否存在
- 检查 `Update()` 方法是否正确重写
- 检查伤害代码是否在 `Update()` 方法里

---

## 本章自测（可选）

用于自查是否达到"能创建 Buff"的最低标准：

- [ ] 我能指出 `SetStaticDefaults()` 中三处常改动点：名字/描述/debuff
- [ ] 我能指出 `Update()` 中两处常改动点：伤害/频率
- [ ] 我能解释 `Item.buffType` 和 `Item.buffTime` 的作用

---

## 下一步

本章完成后，你应能独立创建 Buff 并让物品正确施加它。

下一章我们会做"第一个召唤物"：你会看到召唤物是怎么跟随玩家并攻击敌人的。
