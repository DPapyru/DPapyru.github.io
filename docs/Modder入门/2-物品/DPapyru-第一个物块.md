---
title: 第一个物块
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 25分钟
description: 创建可放置的物块，理解物块的基本属性和行为
prev_chapter: ../3-战斗/DPapyru-第一个弹幕.md
next_chapter: ../2-物品/DPapyru-第一个弹药.md
topic: mod-basics
order: 4
colors:
  Red: "#f00"
---

# 第一个物块：创建可放置的物块

物块是泰拉瑞亚世界里最基本的"建筑材料"：泥土、石头、工作台、箱子……都是物块。

{if C == 0}
> **适用人群**：首次接触 C#（C0）。
>
> **本章目标**：完成第一个物块，并能独立修改关键属性与配方。
{else}
> **适用人群**：已具备 C# 基础（C≥1）。
>
> **建议路径**：先完成"复制 → 编译 → 进游戏验证"，再集中修改 `Main.tileSolid / Item.createTile / ItemDrop` 等关键行。
{end}

---

## 验收标准

完成本章后，你应能：

- 创建可放置的物块物品，并在游戏中成功放置
- 修改物块的关键属性（实心、挡光、掉落物等）
- 理解物块（Tile）和物品（Item）之间的关系
- 能定位常见编译/放置错误的原因

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

---

## 阅读前需求

- 已完成"第一个武器"章节
- 知道怎么新建 `.cs` 文件并编译
- 能在 tModLoader 中 Build + Reload

---

## 第一步：了解代码

物块需要两个文件：
1. **物块类（Tile）**：定义物块在世界里的行为
2. **物块物品（Item）**：放在背包里，可以放置的物品

建议你把文件放在如下位置：

- `Content/Tiles/FirstTile.cs`（物块类）
- `Content/Items/FirstTileItem.cs`（物块物品）

### 1.1 创建物块类

把下面代码复制到 `FirstTile.cs`：

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace YourModName.Content.Tiles
{
    public class FirstTile : ModTile
    {
        // SetStaticDefaults：设置物块的静态属性
        public override void SetStaticDefaults()
        {
            // 物块的名字（鼠标悬停时显示）
            Main.tileSolid[Type] = true; // 这个物块是实心的（玩家可以站在上面）
            Main.tileBlockLight[Type] = true; // 这个物块会挡光
            Main.tileLighted[Type] = true; // 这个物块可以被照亮

            // 物块的贴图（暂时用原版石头代替）
            AddMapEntry(new Microsoft.Xna.Framework.Color(200, 200, 200), CreateMapEntryName());

            // 物块的掉落物（挖掘后掉落什么）
            DustType = DustID.Stone;
            ItemDrop = ModContent.ItemType<Items.FirstTileItem>();
        }

        // NumDust：挖掘时产生的粒子数量
        public override void NumDust(int i, int j, bool fail, ref int num)
        {
            num = fail ? 1 : 3;
        }
    }
}
```

### 1.2 创建物块物品

把下面代码复制到 `FirstTileItem.cs`：

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace YourModName.Content.Items
{
    public class FirstTileItem : ModItem
    {
        public override void SetDefaults()
        {
            Item.width = 16;
            Item.height = 16;
            Item.maxStack = 999;
            Item.useTurn = true;
            Item.autoReuse = true;
            Item.useAnimation = 15;
            Item.useTime = 10;
            Item.useStyle = ItemUseStyleID.Swing;
            Item.consumable = true; // 这个物品是消耗品（放置后会消失）
            Item.createTile = ModContent.TileType<Tiles.FirstTile>(); // 放置后变成什么物块
        }

        public override void AddRecipes()
        {
            CreateRecipe()
                .AddIngredient(ItemID.Stone, 10)
                .AddTile(TileID.WorkBenches)
                .Register();
        }
    }
}
```

复制完成后先编译一次，确保"能跑"。

### 概念关联测验

> **测验对应概念**：`ModTile`、`SetStaticDefaults()`、`Item.createTile`

```quiz
type: choice
id: mod-basics-tile-basics
question: |
  下列哪些行是修改"物块属性/放置行为"时最常改动的？
options:
  - id: A
    text: |
      `Main.tileSolid[Type] = true;`
  - id: B
    text: |
      `ItemDrop = ModContent.ItemType<Items.FirstTileItem>();`
  - id: C
    text: |
      `Item.createTile = ModContent.TileType<Tiles.FirstTile>();`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  物块属性在 `SetStaticDefaults()` 里改，掉落物在 `ItemDrop` 里改，放置行为在 `Item.createTile` 里改。
  `using ...` 一般不用动，除非你删了/加了新东西导致编译报错。
```

---

## 第二步：练习（建议）

建议只对关键行进行一次"删除 → 手动输入还原"的练习；其目标不是背诵，而是确认你知道"改动点在哪里、改了会产生什么效果"。

### 2.1 物块文件里最常改的行

在 `SetStaticDefaults()` 里：

- `Main.tileSolid[Type] = true;`（是否实心）
- `Main.tileBlockLight[Type] = true;`（是否挡光）
- `Main.tileLighted[Type] = true;`（是否可被照亮）
- `ItemDrop = ModContent.ItemType<Items.FirstTileItem>();`（挖掘后掉落什么）

### 2.2 物品文件里最常改的行

在 `SetDefaults()` 里：

- `Item.createTile = ModContent.TileType<Tiles.FirstTile>();`（放置后变成什么物块）
- `Item.consumable = true;`（是否消耗品）
- `Item.useTime / Item.useAnimation`（放置速度）

### 2.3 练习方式

把这些行删掉，再自己敲回去。

---

## 第三步：补充阅读（按需）

{if C == 0}
{[./_分流/第一个物块-C0-CSharp读代码.md][C# 补课（C0）：看懂本章语法]}
{end}

{if T == 0}
{[./_分流/第一个物块-T0-tML读代码.md][tModLoader 补课（T0）：看懂本章 API]}
{end}

---

## 常见问题（排错）

### 1）我合成了物品，但放置不了

**原因**：最常见是 `Item.createTile` 没设置，或者设置错了。

**解决**：
- 检查 `Item.createTile = ModContent.TileType<Tiles.FirstTile>();` 是否存在
- 检查物块类名是否写对（大小写敏感）
- 检查物块文件是否在正确的命名空间里

### 2）我放置了物块，但站不上去

**原因**：`Main.tileSolid[Type]` 没设置为 `true`。

**解决**：在 `SetStaticDefaults()` 里添加 `Main.tileSolid[Type] = true;`

### 3）我挖掘了物块，但没掉落东西

**原因**：`ItemDrop` 没设置，或者设置错了。

**解决**：
- 检查 `ItemDrop = ModContent.ItemType<Items.FirstTileItem>();` 是否存在
- 检查物品类名是否写对（大小写敏感）

### 4）物块在地图上不显示

**原因**：`AddMapEntry()` 没调用。

**解决**：在 `SetStaticDefaults()` 里添加 `AddMapEntry(...)`

---

## 本章自测（可选）

用于自查是否达到"能创建并改动物块"的最低标准：

- [ ] 我能指出 `SetStaticDefaults()` 中三处常改动点：实心/挡光/掉落物
- [ ] 我能指出 `Item.createTile` 的作用，并能在物品里正确设置
- [ ] 我能解释"物块"和"物块物品"的区别与联系

---

## 下一步

本章完成后，你应能独立创建和修改物块，并能理解物块与物品之间的关系。

下一章我们会做"第一个弹药"：你会看到"弹药"是怎么被武器消耗的。
