---
title: 第一个世界生成
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 25分钟
description: 做第一个世界生成同时学习世界系统
prev_chapter: ../5-高级/DPapyru-第一个Boss.md
next_chapter: null
topic: mod-basics
order: 10
colors:
  Red: "#f00"
---

# 第一个世界生成：做一个新矿物同时学习世界系统

世界生成是什么？简单来说，**世界生成是在创建新世界时，自动在地图上生成各种东西的过程**。比如原版的铜矿、铁矿、金矿等。

{if C == 0}
> **适用人群**：首次接触 C#（C0）。
>
> **本章目标**：完成第一个世界生成，并能独立修改矿物的生成逻辑。
{else}
> **适用人群**：已具备 C# 基础（C≥1）。
>
> **建议路径**：先完成"复制 → 编译 → 进游戏验证"，再集中修改 `Main.tileOre / GenerateMyOre / WorldGen.PlaceTile` 等关键行。
{end}

---

## 验收标准

完成本章后，你应能：

- 创建可生成的矿物
- 编写世界生成逻辑
- 修改矿物的生成概率和深度
- 理解世界生成的工作原理

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

---

## 阅读前需求

- 已完成"第一个物块"章节
- 知道怎么新建 `.cs` 文件

---

## 第一步：了解代码

世界生成需要两个文件：

1. **矿物类（Tile）**：定义矿物的属性
2. **世界生成类（ModWorld）**：在世界生成时生成矿物

建议你把文件放在类似位置：

- `Content/Tiles/MyOre.cs`（矿物类）
- `Content/World/MyWorld.cs`（世界生成类）

### 1.1 创建矿物类

把下面这份代码复制到 `MyOre.cs`：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;
using Microsoft.Xna.Framework;

// 定义命名空间
namespace YourModName.Content.Tiles
{
    // 定义一个继承自 ModTile 的类
    public class MyOre : ModTile
    {
        // 设置矿物的默认属性
        public override void SetStaticDefaults()
        {
            // 设置矿物的名字
            Main.tileSolid[Type] = true;  // 是固体物块
            Main.tileMergeDirt[Type] = true;  // 可以与泥土合并
            Main.tileBlockLight[Type] = true;  // 阻挡光线
            Main.tileLighted[Type] = true;  // 发光
            Main.tileSpelunker[Type] = true;  // 可以被探矿器探测
            Main.tileOre[Type] = true;  // 是矿物
            Main.tileValue[Type] = 100;  // 矿物价值
            Main.tileShine2[Type] = true;  // 发光效果
            Main.tileShine[Type] = 1100;  // 发光颜色
            DustType = DustID.Iron;  // 粒子效果
            MinPick = 40;  // 最低镐力要求
            HitSound = SoundID.Tink;  // 挖掘声音
            MineResist = 2f;  // 挖掘阻力
            AddMapEntry(new Color(200, 200, 200), "我的矿物");  // 地图上的名字
        }

        // 设置矿物的掉落物
        public override void NumDust(int i, int j, bool fail, ref int num)
        {
            num = fail ? 1 : 3;
        }

        // 设置矿物的掉落物
        public override bool Drop(int i, int j)
        {
            // 掉落矿物物品
            Item.NewItem(null, i * 16, j * 16, 16, 16, ModContent.ItemType<Items.MyOreItem>());
            return true;
        }
    }
}
```

### 1.2 创建矿物物品

把下面这份代码复制到 `MyOreItem.cs`：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

// 定义命名空间
namespace YourModName.Content.Items
{
    // 定义一个继承自 ModItem 的类
    public class MyOreItem : ModItem
    {
        // 设置物品的默认属性
        public override void SetDefaults()
        {
            // 设置矿物物品的各项属性
            Item.width = 16;
            Item.height = 16;
            Item.maxStack = 999;
            Item.value = Item.buyPrice(silver: 5);
            Item.rare = ItemRarityID.Blue;
            Item.useStyle = ItemUseStyleID.Swing;
            Item.useTurn = true;
            Item.autoReuse = true;
            Item.useAnimation = 15;
            Item.useTime = 10;
            Item.createTile = ModContent.TileType<Tiles.MyOre>();  // 放置的物块
            Item.consumable = true;
        }

        // 添加合成配方
        public override void AddRecipes()
        {
            Recipe recipe = CreateRecipe();
            recipe.AddIngredient(ItemID.StoneBlock, 10);
            recipe.AddTile(TileID.Furnaces);
            recipe.Register();
        }
    }
}
```

### 1.3 创建世界生成类

把下面这份代码复制到 `MyWorld.cs`：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;
using Terraria.WorldBuilding;
using Terraria.GameContent.Generation;
using System.Collections.Generic;

// 定义命名空间
namespace YourModName.Content.World
{
    // 定义一个继承自 ModWorld 的类
    public class MyWorld : ModWorld
    {
        // 世界生成时调用
        public override void ModifyWorldGenTasks(List<GenPass> tasks)
        {
            // 在"放置矿石"任务之后添加我们的矿物生成任务
            int shiniesIndex = tasks.FindIndex(genpass => genpass.Name.Equals("Shinies"));
            if (shiniesIndex != -1)
            {
                tasks.Insert(shiniesIndex + 1, new PassLegacy("My Ore Generation", GenerateMyOre));
            }
        }

        // 生成我们的矿物
        private void GenerateMyOre(GenerationProgress progress, GameConfiguration configuration)
        {
            // 设置进度信息
            progress.Message = "生成我的矿物...";

            // 遍历所有区块
            for (int i = 0; i < Main.maxTilesX / 16; i++)
            {
                for (int j = 0; j < Main.maxTilesY / 16; j++)
                {
                    // 计算区块的中心位置
                    int x = i * 16 + 8;
                    int y = j * 16 + 8;

                    // 只在地下生成
                    if (y < Main.rockLayer)
                    {
                        continue;
                    }

                    // 随机生成矿物
                    if (WorldGen.genRand.NextBool(10))  // 10% 的概率
                    {
                        // 在区块内随机选择一个位置
                        int oreX = WorldGen.genRand.Next(i * 16, (i + 1) * 16);
                        int oreY = WorldGen.genRand.Next(j * 16, (j + 1) * 16);

                        // 检查位置是否合适
                        if (Main.tile[oreX, oreY].active() && Main.tile[oreX, oreY].type == TileID.Stone)
                        {
                            // 生成矿物簇
                            int clusterSize = WorldGen.genRand.Next(3, 8);  // 3-7 个矿物
                            for (int k = 0; k < clusterSize; k++)
                            {
                                // 在矿物簇周围随机选择一个位置
                                int offsetX = WorldGen.genRand.Next(-2, 3);
                                int offsetY = WorldGen.genRand.Next(-2, 3);

                                // 检查位置是否合适
                                if (Main.tile[oreX + offsetX, oreY + offsetY].active() &&
                                    Main.tile[oreX + offsetX, oreY + offsetY].type == TileID.Stone)
                                {
                                    // 放置矿物
                                    WorldGen.PlaceTile(oreX + offsetX, oreY + offsetY, ModContent.TileType<Tiles.MyOre>());
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

复制完成后先编译一次，确保"能跑"。

### 概念关联测验

> **测验对应概念**：`Main.tileOre`、`ModifyWorldGenTasks()`、`WorldGen.PlaceTile()`

```quiz
type: choice
id: mod-basics-first-worldgen-basics
question: |
  下列哪些行是修改"矿物生成逻辑"时最常改动的？
options:
  - id: A
    text: |
      `Main.tileOre[Type] = true;`
  - id: B
    text: |
      `if (WorldGen.genRand.NextBool(10))`
  - id: C
    text: |
      `WorldGen.PlaceTile(oreX + offsetX, oreY + offsetY, ModContent.TileType<Tiles.MyOre>());`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  矿物标识在 `Main.tileOre` 里改，生成概率在 `if (WorldGen.genRand.NextBool(10))` 里改，放置位置在 `WorldGen.PlaceTile()` 里改。
```

---

## 第二步：练习（建议）

### 2.1 矿物文件里最常改的行

在 `SetStaticDefaults()` 里：

- `Main.tileOre[Type] = true;`（标识为矿物）
- `MinPick = 40;`（最低镐力）
- `AddMapEntry(...)`（地图显示）

### 2.2 世界生成文件里最常改的行

在 `GenerateMyOre()` 里：

- `if (y < Main.rockLayer)`（生成深度）
- `if (WorldGen.genRand.NextBool(10))`（生成概率）
- `int clusterSize = WorldGen.genRand.Next(3, 8);`（矿物簇大小）

### 2.3 练习方式

把这些行删掉，再自己敲回去。

---

## 第三步：补充阅读（按需）

{if C == 0}
{[./_分流/第一个世界生成-C0-CSharp读代码.md][C# 补课（C0）：看懂本章语法]}
{end}

{if T == 0}
{[./_分流/第一个世界生成-T0-tML读代码.md][tModLoader 补课（T0）：看懂本章 API]}
{end}

---

## 常见问题（排错）

### 1）我编译报错，最常见是哪里？

**原因**：`YourModName` 没替换，或 `namespace` 写错了

**解决**：
- 检查 `namespace YourModName...` 里的 `YourModName` 是否换成你项目实际使用的名字
- 检查 `using YourModName.Content.Tiles;` 是否正确

### 2）我创建了新世界，但是没有找到矿物

**解决**：
- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 矿物只在地下生成，需要挖到地下才能找到
- 矿物生成概率是 10%，可能需要多挖几个地方

### 3）我找到了矿物，但是不能挖掘

**解决**：
- 检查 `MinPick = 40;` 是否存在
- 检查你的镐力是否足够（需要 40 以上）
- 检查 `Main.tileSolid[Type] = true;` 是否存在

---

## 本章自测（可选）

用于自查是否达到"能创建世界生成"的最低标准：

- [ ] 我能指出 `SetStaticDefaults()` 中三处常改动点：Ore/MinPick/AddMapEntry
- [ ] 我能指出 `GenerateMyOre()` 中三处常改动点：深度/概率/簇大小
- [ ] 我能解释世界生成的工作原理

---

## 总结

本章你已经完成最关键的一步：**你能创建世界生成，并且知道如何生成新矿物**。

现在你已经掌握了 Mod 开发的基础知识，可以开始创建更复杂的内容了！
