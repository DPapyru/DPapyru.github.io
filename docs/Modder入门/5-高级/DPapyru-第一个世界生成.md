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

这一章的目标很简单：在游戏中生成一个新的矿物，并且你敢改它的关键数值。

世界生成是什么？简单来说，**世界生成是在创建新世界时，自动在地图上生成各种东西的过程**。比如原版的铜矿、铁矿、金矿等。

世界生成需要两个文件：

1. **矿物类（Tile）**：定义矿物的属性
2. **世界生成类（ModWorld）**：在世界生成时生成矿物

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名（更准确地说，是你的 Mod 的"命名空间前缀/根名字"）。不知道自己的 Mod 名也没关系，先照抄，后面我们会说怎么判断。

## 阅读前需求

- 已完成"第一个物块"章节：知道如何创建物块
- 知道怎么新建 `.cs` 文件（放进你的 Mod 项目里）

## 第一步：了解代码

建议你把文件放在类似位置：

- `Content/Tiles/MyOre.cs`（矿物类）
- `Content/World/MyWorld.cs`（世界生成类）

### 1.1 创建矿物类

先把下面这份代码复制到 `MyOre.cs`：

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

再把下面这份代码复制到 `MyOreItem.cs`：

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

再把下面这份代码复制到 `MyWorld.cs`：

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

复制完成后先编译一次，确保"能跑"。能跑之后我们再来"只手敲关键行"。

### 题目

```quiz
type: choice
id: mod-basics-first-worldgen-edit-lines
question: |
  下面哪些行是"你以后想改矿物生成概率/生成深度"最常会动到的？
options:
  - id: A
    text: |
      `if (WorldGen.genRand.NextBool(10))`
  - id: B
    text: |
      `if (y < Main.rockLayer)`
  - id: C
    text: |
      `int clusterSize = WorldGen.genRand.Next(3, 8);`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  矿物生成概率在 `if (WorldGen.genRand.NextBool(10))` 里改，生成深度在 `if (y < Main.rockLayer)` 里改，矿物簇大小在 `int clusterSize = WorldGen.genRand.Next(3, 8);` 里改。
  `using ...` 一般不用动，除非你删了/加了新东西导致编译报错。
```

## 第二步：学习关键内容

现在开始"中间形态"的练习：你可以保留其它代码不动，只对下面这些行做一次"删掉 → 自己敲回去"。

建议练习顺序：

1. 在 `MyOre.cs` 的 `SetStaticDefaults()` 里把这些行删掉，再自己敲回去：
   - `Main.tileSolid[Type] = true;`
   - `Main.tileOre[Type] = true;`
   - `MinPick = 40;`
   - `AddMapEntry(new Color(200, 200, 200), "我的矿物");`
2. 在 `MyWorld.cs` 的 `GenerateMyOre()` 里把这几行删掉，再自己敲回去：
   - `if (y < Main.rockLayer)`
   - `if (WorldGen.genRand.NextBool(10))`
   - `int clusterSize = WorldGen.genRand.Next(3, 8);`
   - `WorldGen.PlaceTile(oreX + offsetX, oreY + offsetY, ModContent.TileType<Tiles.MyOre>());`

你会发现：你不需要知道"C# 的全部规则"，也能写出一个能工作的世界生成。

## 第三步：教你"怎么读这份代码"（从上往下）

下面我们按"阅读顺序"讲一下：每段在干嘛、你现在需要记住什么。

### 1）`ModTile`：物块的基类

`ModTile` 是 tModLoader 里"物块的基类"。

我们写的 `MyOre` 是"基于这个基类创建的一个新物块"。

### 2）`Main.tileOre[Type] = true;`：最重要的那一行

这一行告诉游戏：**这是一个矿物**。

如果没有这一行，这个物块就不会被当作矿物处理。

### 3）`ModWorld`：世界生成的基类

`ModWorld` 是 tModLoader 里"世界生成的基类"。

我们写的 `MyWorld` 是"基于这个基类创建的一个新世界生成类"。

### 4）`ModifyWorldGenTasks(List<GenPass> tasks)`：修改世界生成任务

这个方法的作用是：**修改世界生成任务列表**。

- `tasks`：世界生成任务列表
- `tasks.FindIndex(genpass => genpass.Name.Equals("Shinies"))`：查找"放置矿石"任务
- `tasks.Insert(shiniesIndex + 1, new PassLegacy("My Ore Generation", GenerateMyOre));`：在"放置矿石"任务之后添加我们的矿物生成任务

```quiz
type: choice
id: mod-worldgen-modify-tasks
question: |
  `tasks.Insert(shiniesIndex + 1, new PassLegacy("My Ore Generation", GenerateMyOre));` 的作用是什么？
options:
  - id: A
    text: |
      在"放置矿石"任务之后添加我们的矿物生成任务
  - id: B
    text: |
      删除"放置矿石"任务
  - id: C
    text: |
      修改"放置矿石"任务的参数
answer: A
explain: |
  这一行在"放置矿石"任务之后添加我们的矿物生成任务，确保我们的矿物在原版矿物之后生成。
```

### 5）`if (y < Main.rockLayer)`：生成深度限制

这一行的作用是：**只在地下生成矿物**。

- `y`：Y 坐标（深度）
- `Main.rockLayer`：岩石层深度（地下开始的位置）
- `<`：小于运算符

所以 `if (y < Main.rockLayer)` 的意思是：**如果 Y 坐标小于岩石层深度（即在地表），跳过**。

```quiz
type: choice
id: mod-worldgen-depth-limit
question: |
  `if (y < Main.rockLayer)` 的作用是什么？
options:
  - id: A
    text: |
      只在地下生成矿物
  - id: B
    text: |
      只在地表生成矿物
  - id: C
    text: |
      在整个世界生成矿物
answer: A
explain: |
  这一行限制了矿物的生成深度，只在地下（岩石层以下）生成矿物。
```

### 6）`if (WorldGen.genRand.NextBool(10))`：生成概率

这一行的作用是：**10% 的概率生成矿物**。

- `WorldGen.genRand.NextBool(10)`：随机生成一个布尔值，10% 的概率为 true
- `10`：概率（1/10）

所以 `if (WorldGen.genRand.NextBool(10))` 的意思是：**10% 的概率生成矿物**。

```quiz
type: choice
id: mod-worldgen-probability
question: |
  `if (WorldGen.genRand.NextBool(10))` 的作用是什么？
options:
  - id: A
    text: |
      10% 的概率生成矿物
  - id: B
    text: |
      10% 的概率不生成矿物
  - id: C
    text: |
      生成 10 个矿物
answer: A
explain: |
  `WorldGen.genRand.NextBool(10)` 随机生成一个布尔值，10% 的概率为 true，即 10% 的概率生成矿物。
```

### 7）`int clusterSize = WorldGen.genRand.Next(3, 8);`：矿物簇大小

这一行的作用是：**随机生成 3-7 个矿物**。

- `WorldGen.genRand.Next(3, 8)`：随机生成一个 3-7 之间的整数
- `3`：最小值
- `8`：最大值（不包含）

所以 `int clusterSize = WorldGen.genRand.Next(3, 8);` 的意思是：**随机生成 3-7 个矿物**。

### 8）`WorldGen.PlaceTile(...)`：放置物块

这一行的作用是：**在指定位置放置物块**。

- `oreX + offsetX`：X 坐标
- `oreY + offsetY`：Y 坐标
- `ModContent.TileType<Tiles.MyOre>()`：物块类型

## 常见问题（先救命，后讲道理）

### 1）我编译报错，最常见是哪里？

- `YourModName` 没替换：如果你项目默认命名空间不是这个，可能会提示找不到类型/命名空间。你可以先把 `namespace YourModName...` 里的 `YourModName` 换成你项目里其它 `.cs` 文件最上面用的那个名字。
- `Content.Tiles` 写错了：`namespace` 的后半段你可以随便取，但要确保它只是"分类名"，不要写奇怪符号。
- `using YourModName.Content.Tiles;` 没加：如果 `MyOre` 变红，检查 `using YourModName.Content.Tiles;` 是否存在。

### 2）我创建了新世界，但是没有找到矿物

- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 矿物只在地下生成，需要挖到地下才能找到
- 矿物生成概率是 10%，可能需要多挖几个地方

### 3）我找到了矿物，但是不能挖掘

- 检查 `MinPick = 40;` 是否存在
- 检查你的镐力是否足够（需要 40 以上）
- 检查 `Main.tileSolid[Type] = true;` 是否存在

## 总结

这一章你已经完成最关键的一步：**你能创建世界生成，并且知道如何生成新矿物**。

现在你已经掌握了 Mod 开发的基础知识，可以开始创建更复杂的内容了！
