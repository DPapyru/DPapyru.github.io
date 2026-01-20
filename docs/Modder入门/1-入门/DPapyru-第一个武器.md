---
title: 第一个武器
author: 小天使
date: 2026-01-17
last_updated: 2026-01-19
difficulty: beginner
time: 15分钟
description: 做第一把武器同时入门C#
prev_chapter: ../1-入门/DPapyru-快速开始构建Mod.md
next_chapter: ../3-战斗/DPapyru-第一个弹幕.md
topic: mod-basics
order: 2
colors:
  Red: "#f00"
---

# 第一个武器：做一把能用的剑同时学习C#基础

{if C == 0}
> 适用人群：首次接触 C#（C0）。
>
> 本章目标：完成第一把武器，并能独立修改关键数值与配方。
{else}
> 适用人群：已具备 C# 基础（C≥1）。
>
> 建议路径：先完成“复制 → 编译 → 进游戏验证”，再集中修改 `Item.damage / useTime / recipe.AddIngredient` 等关键行。
{end}

> **[章节进度]**
> - [上一章]：[快速开始构建Mod](./DPapyru-快速开始构建Mod.md)
> - [下一章]：[第一个弹幕](../3-战斗/DPapyru-第一个弹幕.md)
> - [全部章节]：[入门指南](../README.md)

---

本章的验收标准如下：

- 能编译并在游戏中拿到这把武器（或看到配方）
- 能修改伤害、攻速等基础属性，并观察到结果变化
- 能修改配方材料/数量，并验证配方变化

本文中会出现 `YourModName`。它是占位符，应替换为你自己的 Mod 命名空间前缀（通常与 Mod 名一致）。可以把它理解为项目的“门牌号”：写错了，代码仍在，但编译器找不到“地址”。

## 阅读前需求

- 已完成上一章：能打开 tModLoader 的 Mod 项目，并且能成功编译/进入游戏
- 知道怎么新建 `.cs` 文件（放进你的 Mod 项目里）

## 第一步：了解代码

建议将文件放在如下位置（目录名可调整，但建议先保持一致，减少排错成本）：

- `Content/Items/FirstSword.cs`

将下面代码完整复制到文件中。复制完成后先编译一次，确保可以通过。随后进行“关键行手动输入练习”，以建立对代码位置与作用的直觉。

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

// 定义命名空间
namespace YourModName.Content.Items
{
    // 定义一个继承自 ModItem 的类
    public class FirstSword : ModItem
    {
        // 设置物品的默认属性
        public override void SetDefaults()
        {
            // 设置武器的各项属性
            Item.damage = 50;
            Item.DamageType = DamageClass.Melee;
            Item.width = 40;
            Item.height = 40;
            Item.useTime = 20;
            Item.useAnimation = 20;
            Item.useStyle = ItemUseStyleID.Swing;
            Item.knockBack = 6;
            Item.value = Item.buyPrice(silver: 1);
            Item.rare = ItemRarityID.Blue;
            Item.UseSound = SoundID.Item1;
            Item.autoReuse = true;
        }

        // 添加合成配方
        public override void AddRecipes()
        {
            Recipe recipe = CreateRecipe();
            recipe.AddIngredient(ItemID.Wood, 10);
            recipe.AddTile(TileID.WorkBenches);
            recipe.Register();
        }
    }
}
```

### 概念关联测验

> **[测验对应概念]**：`namespace`、`class`、`AddRecipes()`配方逻辑

```quiz
type: choice
id: mod-basics-first-weapon-edit-lines
question: |
  下列哪些行是修改“伤害/攻速/配方材料”时最常改动的？
options:
  - id: A
    text: |
      `Item.damage = 50;`
  - id: B
    text: |
      `Item.useTime = 20;` 和 `Item.useAnimation = 20;`
  - id: C
    text: |
      `recipe.AddIngredient(ItemID.Wood, 10);`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  伤害/攻速在 `SetDefaults()` 里改，配方材料在 `AddRecipes()` 里改。
  `using ...` 一般不用动，除非你删了/加了新东西导致编译报错。
```

## 第二步：练习（建议）

建议只对关键行进行一次“删除 → 手动输入还原”的练习；其目标不是背诵，而是确认你知道“改动点在哪里、改了会产生什么效果”。

建议顺序：

1. 在 `SetDefaults()` 里把这些行删掉，再自己敲回去：
   - `Item.damage = 50;`
   - `Item.useTime = 20;`
   - `Item.useAnimation = 20;`
   - `Item.knockBack = 6;`
   - `Item.rare = ItemRarityID.Blue;`
   - `Item.autoReuse = true;`
2. 在 `AddRecipes()` 里把这三行删掉，再自己敲回去：
   - `Recipe recipe = CreateRecipe();`
   - `recipe.AddIngredient(ItemID.Wood, 10);`
   - `recipe.AddTile(TileID.WorkBenches);`
   - `recipe.Register();`

完成上述练习后，即使没有系统学习 C#，你也应能在本章范围内完成“修改 → 编译 → 验证”的闭环。

## 第三步：补充阅读（按需）

{if C == 0}
{[./_分流/第一个武器-C0-CSharp读代码.md][C# 补课（C0）：看懂本章语法]}
{end}

{if T == 0}
{[./_分流/第一个武器-T0-tML读代码.md][tModLoader 补课（T0）：看懂本章 API]}
{end}

{if C >= 1 && T >= 1}
{[./_分流/第一个武器-进阶-惯用写法.md][进阶（C≥1 且 T≥1）：更贴近实战的写法]}
{end}

## 常见问题（排错）

### 1）我编译报错，最常见是哪里？

- `YourModName` 没替换：如果你项目默认命名空间不是这个，可能会提示找不到类型/命名空间。你可以先把 `namespace YourModName...` 里的 `YourModName` 换成你项目里其它 `.cs` 文件最上面用的那个名字。
- `Content.Items` 写错了：`namespace` 的后半段你可以随便取，但要确保它只是"分类名"，不要写奇怪符号。
- `using` 少了：如果 `ItemID` 或 `TileID` 变红，检查 `using Terraria.ID;` 是否存在。

### 2）我进游戏找不到这把武器/配方

- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 配方需要在工作台旁边打开合成栏才会出现

## 下一步会学什么？

本章完成后，你应能独立修改武器参数与配方，并能定位常见编译错误的来源。

下一章将制作第一个弹幕（Projectile），并解释武器（物品）如何触发弹幕发射流程。

---

## 本章自测（可选）

用于自查是否达到“能读懂并改动本章代码”的最低标准：

- [ ] 我能指出 `SetDefaults()` 中三处常改动点：伤害/攻速/击退（或稀有度）
- [ ] 我能指出 `AddRecipes()` 中两处常改动点：材料/数量、制作站
- [ ] 我能解释 `YourModName` 的作用，并能在项目中找到正确的命名空间前缀
