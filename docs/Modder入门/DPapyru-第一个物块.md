---
title: 第一个物块
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 25分钟
description: 创建可放置的物块，理解物块的基本属性和行为
prev_chapter: DPapyru-第一个弹幕.md
next_chapter: DPapyru-第一个合成表.md
topic: mod-basics
order: 4
colors:
  Red: "#f00"
---

# 第一个物块：创建可放置的物块

这一章的目标是：创建一个可放置的物块，并且你理解物块是怎么被放置、被挖掘、被交互的。

物块是泰拉瑞亚世界里最基本的"建筑材料"：泥土、石头、工作台、箱子……都是物块。

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

## 阅读前需求

- 已完成"第一个武器"章节
- 知道怎么新建 `.cs` 文件并编译

## 第一步：了解代码

创建文件：`Content/Tiles/FirstTile.cs`

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

创建物品文件：`Content/Items/FirstTileItem.cs`

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

编译后进游戏，合成这个物块物品，然后放置到地上试试。

### 题目

```quiz
type: choice
id: mod-basics-tile-solid
question: |
  `Main.tileSolid[Type] = true;` 的作用是什么？
options:
  - id: A
    text: |
      这个物块是实心的，玩家可以站在上面
  - id: B
    text: |
      这个物块是透明的，玩家可以穿过
  - id: C
    text: |
      这个物块会发光
answer: A
explain: |
  Main.tileSolid[Type] = true 表示这个物块是实心的，玩家可以站在上面，不能穿过。
```

```quiz
type: choice
id: mod-basics-create-tile
question: |
  物品要能放置物块，必须设置哪个属性？
options:
  - id: A
    text: |
      Item.consumable
  - id: B
    text: |
      Item.createTile
  - id: C
    text: |
      Item.useStyle
answer: B
explain: |
  Item.createTile 告诉游戏"这个物品放置后变成什么物块"，是物块物品最关键的属性。
```

## 第二步：学习关键内容

### 物块文件里最常改的行：

1. 在 `SetStaticDefaults()` 里：
   - `Main.tileSolid[Type]`：是否实心
   - `Main.tileBlockLight[Type]`：是否挡光
   - `Main.tileLighted[Type]`：是否可被照亮
   - `ItemDrop`：挖掘后掉落什么

2. 在 `NumDust()` 里：
   - `num`：挖掘时产生的粒子数量

### 物品文件里最常改的行：

1. 在 `SetDefaults()` 里：
   - `Item.createTile`：放置后变成什么物块
   - `Item.consumable`：是否消耗品
   - `Item.useTime` / `Item.useAnimation`：放置速度

练习方式：把这些行删掉，再自己敲回去。

## 第三步：教你"怎么读这份代码"（从上往下）

### 1）物块和物品的关系

- **物块（Tile）**：放在世界里的东西（比如地上的石头）
- **物品（Item）**：背包里的东西（比如你手里的石头块）

当你"放置"一个物块时：
1. 你消耗一个"物块物品"
2. 在世界里生成一个"物块"

当你"挖掘"一个物块时：
1. 你破坏世界里的"物块"
2. 获得一个"物块物品"（掉落物）

### 2）`ModTile`：物块的类

`ModTile` 是物块的类，它定义了物块在世界里的行为：

- 能不能站在上面
- 会不会挡光
- 挖掘时掉落什么
- 挖掘时产生多少粒子

### 3）`SetStaticDefaults()`：物块的静态属性

物块的 `SetDefaults()` 叫 `SetStaticDefaults()`，因为物块的属性是"静态的"（所有这个物块都一样）：

- `Main.tileSolid[Type]`：是否实心（true = 可以站，false = 不能站）
- `Main.tileBlockLight[Type]`：是否挡光（true = 挡光，false = 不挡光）
- `Main.tileLighted[Type]`：是否可被照亮（true = 可以，false = 不可以）
- `ItemDrop`：挖掘后掉落什么物品

### 4）`Item.createTile`：物品和物块的关联

`Item.createTile` 是物品和物块之间的关联：

- 它告诉游戏"这个物品放置后变成什么物块"
- 如果不设置这个属性，物品就不能放置

### 5）`Item.consumable`：是否消耗品

`Item.consumable` 决定物品使用后是否消失：

- `true`：使用后消失（比如放置物块、吃食物）
- `false`：使用后不消失（比如挥动武器）

对于物块物品，通常设置为 `true`，因为放置后物品就变成物块了。

### 6）`AddMapEntry()`：地图上的显示

`AddMapEntry()` 决定物块在地图上显示的颜色和名字：

```csharp
AddMapEntry(new Microsoft.Xna.Framework.Color(200, 200, 200), CreateMapEntryName());
```

- `Color(200, 200, 200)`：地图上的颜色（这里是灰色）
- `CreateMapEntryName()`：地图上显示的名字（自动从物块名字生成）

### 7）`DustType`：挖掘时的粒子

`DustType` 决定挖掘时产生什么粒子：

```csharp
DustType = DustID.Stone;
```

这里用的是原版石头的粒子，你也可以用其他 `DustID`。

## 常见问题（先救命，后讲道理）

### 1）我合成了物品，但放置不了

**原因**：最常见是 `Item.createTile` 没设置，或者设置错了。

**解决**：
- 检查 `Item.createTile = ModContent.TileType<Tiles.FirstTile>();` 是否存在
- 检查物块类名是否写对（大小写敏感）
- 检查物块文件是否在正确的命名空间里

### 2）我放置了物块，但站不上去

**原因**：`Main.tileSolid[Type]` 没设置为 `true`。

**解决**：
- 在 `SetStaticDefaults()` 里添加 `Main.tileSolid[Type] = true;`

### 3）我挖掘了物块，但没掉落东西

**原因**：`ItemDrop` 没设置，或者设置错了。

**解决**：
- 检查 `ItemDrop = ModContent.ItemType<Items.FirstTileItem>();` 是否存在
- 检查物品类名是否写对（大小写敏感）

### 4）物块在地图上不显示

**原因**：`AddMapEntry()` 没调用。

**解决**：
- 在 `SetStaticDefaults()` 里添加 `AddMapEntry(new Microsoft.Xna.Framework.Color(200, 200, 200), CreateMapEntryName());`

## 下一步会学什么？

这一章你已经学会了"创建物块"，并且理解了"物块"和"物品"的关系。

下一章我们会做"第一个合成表"：你会看到"合成表"是怎么让物品被制作出来的。
