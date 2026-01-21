---
title: 第一个饰品
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 15分钟
description: 做第一个饰品同时学习如何修改玩家属性
prev_chapter: ../4-玩家/DPapyru-第一个NPC.md
next_chapter: ../3-战斗/DPapyru-第一个Buff.md
topic: mod-basics
order: 6
colors:
  Red: "#f00"
---

# 第一个饰品：做一个加速饰品同时学习玩家属性修改

饰品和武器最大的区别在于：**饰品是被动生效的**，你装备上它，它就会持续影响玩家的属性。

{if C == 0}
> **适用人群**：首次接触 C#（C0）。
>
> **本章目标**：完成第一个饰品，并能独立修改饰品效果与配方。
{else}
> **适用人群**：已具备 C# 基础（C≥1）。
>
> **建议路径**：先完成"复制 → 编译 → 进游戏验证"，再集中修改 `Item.accessory / UpdateAccessory() / recipe.AddIngredient` 等关键行。
{end}

---

## 验收标准

完成本章后，你应能：

- 创建可装备的饰品
- 在饰品中修改玩家属性
- 为饰品添加合成配方
- 理解饰品的工作原理

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

---

## 阅读前需求

- 已完成"第一个武器"章节
- 知道怎么新建 `.cs` 文件（放进你的 Mod 项目里）

---

## 第一步：了解代码

建议你把文件放在类似位置（文件夹名字随你，但先跟着模板走最省事）：

- `Content/Accessories/SpeedBoots.cs`

把下面这份代码整段复制进去：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

// 定义命名空间
namespace YourModName.Content.Accessories
{
    // 定义一个继承自 ModItem 的类
    public class SpeedBoots : ModItem
    {
        // 设置物品的默认属性
        public override void SetDefaults()
        {
            // 设置饰品的各项属性
            Item.width = 28;
            Item.height = 28;
            Item.accessory = true;  // 这一行最重要：告诉游戏这是一个饰品
            Item.value = Item.buyPrice(silver: 5);
            Item.rare = ItemRarityID.Green;
        }

        // 添加合成配方
        public override void AddRecipes()
        {
            Recipe recipe = CreateRecipe();
            recipe.AddIngredient(ItemID.Leather, 5);
            recipe.AddIngredient(ItemID.Silk, 3);
            recipe.AddTile(TileID.WorkBenches);
            recipe.Register();
        }

        // 当玩家装备这个饰品时，修改玩家属性
        public override void UpdateAccessory(Player player, bool hideVisual)
        {
            // 增加玩家的移动速度
            player.moveSpeed += 0.1f;  // 增加 10% 的移动速度
            player.maxRunSpeed += 1f;  // 增加最大奔跑速度
        }
    }
}
```

复制完成后先编译一次，确保"能跑"。

### 概念关联测验

> **测验对应概念**：`Item.accessory`、`UpdateAccessory()`、`CreateRecipe()`

```quiz
type: choice
id: mod-basics-first-accessory-basics
question: |
  下列哪些行是修改"饰品效果/配方"时最常改动的？
options:
  - id: A
    text: |
      `player.moveSpeed += 0.1f;`
  - id: B
    text: |
      `recipe.AddIngredient(ItemID.Leather, 5);`
  - id: C
    text: |
      `Item.accessory = true;`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
explain: |
  饰品效果在 `UpdateAccessory()` 里改，配方材料在 `AddRecipes()` 里改。
  `Item.accessory = true;` 是固定的，告诉游戏这是饰品，一般不用动。
```

---

## 第二步：练习（建议）

### 2.1 饰品文件里最常改的行

在 `SetDefaults()` 里：

- `Item.accessory = true;`（告诉游戏这是饰品）
- `Item.value = Item.buyPrice(silver: 5);`（售价）
- `Item.rare = ItemRarityID.Green;`（稀有度）

在 `UpdateAccessory()` 里：

- `player.moveSpeed += 0.1f;`（移动速度）
- `player.maxRunSpeed += 1f;`（最大奔跑速度）

在 `AddRecipes()` 里：

- `recipe.AddIngredient(...)`（合成材料）
- `recipe.AddTile(...)`（制作站）

### 2.2 练习方式

把这些行删掉，再自己敲回去。

---

## 第三步：补充阅读（按需）

{if C == 0}
{[./_分流/第一个饰品-C0-CSharp读代码.md][C# 补课（C0）：看懂本章语法]}
{end}

{if T == 0}
{[./_分流/第一个饰品-T0-tML读代码.md][tModLoader 补课（T0）：看懂本章 API]}
{end}

---

## 常见问题（排错）

### 1）我编译报错，最常见是哪里？

**原因**：`YourModName` 没替换，或 `namespace` 写错了

**解决**：
- 检查 `namespace YourModName...` 里的 `YourModName` 是否换成你项目实际使用的名字
- 检查 `using Terraria.ID;` 是否正确（如果 `ItemID` 变红）

### 2）我进游戏找不到这个饰品/配方

**解决**：
- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 配方需要在工作台旁边打开合成栏才会出现
- 饰品需要装备到饰品栏才会生效

### 3）我装备了饰品，但是没有效果

**解决**：
- 检查 `Item.accessory = true;` 是否存在
- 检查 `UpdateAccessory()` 方法是否正确重写
- 检查 `player.moveSpeed += 0.1f;` 是否在 `UpdateAccessory()` 方法里

---

## 本章自测（可选）

用于自查是否达到"能创建饰品"的最低标准：

- [ ] 我能指出 `SetDefaults()` 中两处常改动点：价值/稀有度
- [ ] 我能指出 `UpdateAccessory()` 中两处常改动点：速度相关
- [ ] 我能解释 `Item.accessory = true;` 的作用

---

## 下一步

本章完成后，你应能独立创建饰品并修改玩家属性。

下一章我们会做"第一个 Buff"：你会看到饰品是怎么给玩家添加"Buff 效果"的。
