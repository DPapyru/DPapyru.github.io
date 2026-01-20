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

这一章的目标很简单：做出你 Mod 里的第一个饰品，并且你敢改它的关键数值与配方。

饰品和武器最大的区别在于：**饰品是被动生效的**，你装备上它，它就会持续影响玩家的属性。

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名（更准确地说，是你的 Mod 的"命名空间前缀/根名字"）。不知道自己的 Mod 名也没关系，先照抄，后面我们会说怎么判断。

## 阅读前需求

- 已完成"第一个武器"章节：能创建基本的物品并设置属性
- 知道怎么新建 `.cs` 文件（放进你的 Mod 项目里）

## 第一步：了解代码

建议你把文件放在类似位置（文件夹名字随你，但先跟着模板走最省事）：

- `Content/Accessories/SpeedBoots.cs`

然后把下面这份代码整段复制进去。复制完成后先编译一次，确保"能跑"。能跑之后我们再来"只手敲关键行"。

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

### 题目

```quiz
type: choice
id: mod-basics-first-accessory-edit-lines
question: |
  下面哪些行是"你以后想改饰品效果/配方材料"最常会动到的？
options:
  - id: A
    text: |
      `Item.accessory = true;`
  - id: B
    text: |
      `player.moveSpeed += 0.1f;`
  - id: C
    text: |
      `recipe.AddIngredient(ItemID.Leather, 5);`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - B
  - C
explain: |
  饰品效果在 `UpdateAccessory()` 里改，配方材料在 `AddRecipes()` 里改。
  `Item.accessory = true;` 是固定的，告诉游戏这是饰品。
  `using ...` 一般不用动，除非你删了/加了新东西导致编译报错。
```

## 第二步：学习关键内容

现在开始"中间形态"的练习：你可以保留其它代码不动，只对下面这些行做一次"删掉 → 自己敲回去"。

建议练习顺序：

1. 在 `SetDefaults()` 里把这些行删掉，再自己敲回去：
   - `Item.accessory = true;`
   - `Item.value = Item.buyPrice(silver: 5);`
   - `Item.rare = ItemRarityID.Green;`
2. 在 `UpdateAccessory()` 里把这两行删掉，再自己敲回去：
   - `player.moveSpeed += 0.1f;`
   - `player.maxRunSpeed += 1f;`
3. 在 `AddRecipes()` 里把这三行删掉，再自己敲回去：
   - `Recipe recipe = CreateRecipe();`
   - `recipe.AddIngredient(ItemID.Leather, 5);`
   - `recipe.AddTile(TileID.WorkBenches);`
   - `recipe.Register();`

你会发现：你不需要知道"C# 的全部规则"，也能写出一个能工作的饰品。

## 第三步：教你"怎么读这份代码"（从上往下）

下面我们按"阅读顺序"讲一下：每段在干嘛、你现在需要记住什么。

### 1）`Item.accessory = true;`：最重要的那一行

这一行告诉游戏：**这是一个饰品**。

如果没有这一行，这个物品就只能放在背包里，不能装备到饰品栏。

```quiz
type: choice
id: mod-basics-accessory-true
question: |
  如果我把 `Item.accessory = true;` 删掉，会发生什么？
options:
  - id: A
    text: |
      这个物品会变成武器
  - id: B
    text: |
      这个物品不能装备到饰品栏，只能放在背包里
  - id: C
    text: |
      编译会报错
answer: B
explain: |
  没有 `Item.accessory = true;`，游戏就不知道这是饰品，所以不能装备。
```

### 2）`UpdateAccessory(Player player, bool hideVisual)`：饰品的核心方法

这个方法是饰品的核心：**当玩家装备这个饰品时，每一帧都会调用这个方法**。

- `Player player`：代表装备这个饰品的玩家
- `bool hideVisual`：是否隐藏饰品的外观（比如你不想看到饰品的样子）

在这个方法里，你可以修改玩家的各种属性。

### 3）`player.moveSpeed += 0.1f;`：增加移动速度

这一行的作用是：**增加玩家 10% 的移动速度**。

- `player.moveSpeed`：玩家的移动速度（1.0 是正常速度）
- `+=`：加法赋值运算符，意思是"在原来的基础上加上"
- `0.1f`：一个浮点数（带小数点的数字），`f` 表示这是一个 float 类型

所以 `player.moveSpeed += 0.1f;` 的意思是：**在玩家原来的移动速度基础上，再增加 0.1（10%）**。

```quiz
type: choice
id: mod-basics-float-number
question: |
  `0.1f` 中的 `f` 是什么意思？
options:
  - id: A
    text: |
      表示这是一个浮点数（带小数点的数字）
  - id: B
    text: |
      表示这是一个函数
  - id: C
    text: |
      表示这是一个变量名
answer: A
explain: |
  在 C# 中，`f` 后缀表示这是一个 float 类型的浮点数。
```

### 4）`player.maxRunSpeed += 1f;`：增加最大奔跑速度

这一行的作用是：**增加玩家的最大奔跑速度**。

- `player.maxRunSpeed`：玩家的最大奔跑速度
- `+= 1f`：在原来的基础上增加 1

### 5）常用的玩家属性

除了移动速度，你还可以修改很多玩家属性。下面是一些常用的：

- `player.moveSpeed`：移动速度
- `player.maxRunSpeed`：最大奔跑速度
- `player.jumpSpeed`：跳跃速度
- `player.jumpBoost`：跳跃高度加成
- `player.statLifeMax2`：最大生命值
- `player.statManaMax2`：最大魔力值
- `player.GetDamage(DamageClass.Generic)`：通用伤害加成
- `player.GetCritChance(DamageClass.Generic)`：通用暴击率加成
- `player.GetArmorPenetration(DamageClass.Generic)`：通用护甲穿透加成

**练习（推荐一定要做）**：

1. 把 `player.moveSpeed += 0.1f;` 改成 `player.moveSpeed += 0.5f;`
2. 编译进游戏试一下速度变化
3. 再改回 0.1f（你会明显感受到"我改了代码，游戏变了"）

### 6）配方：和武器一样

饰品的配方和武器一样，使用 `CreateRecipe()`、`AddIngredient()`、`AddTile()`、`Register()` 这几个方法。

**练习（推荐）**：把皮革数量从 `5` 改成 `1`，进游戏看看合成条件有没有变化。

## 常见问题（先救命，后讲道理）

### 1）我编译报错，最常见是哪里？

- `YourModName` 没替换：如果你项目默认命名空间不是这个，可能会提示找不到类型/命名空间。你可以先把 `namespace YourModName...` 里的 `YourModName` 换成你项目里其它 `.cs` 文件最上面用的那个名字。
- `Content.Accessories` 写错了：`namespace` 的后半段你可以随便取，但要确保它只是"分类名"，不要写奇怪符号。
- `using` 少了：如果 `ItemID` 或 `TileID` 变红，检查 `using Terraria.ID;` 是否存在。

### 2）我进游戏找不到这个饰品/配方

- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 配方需要在工作台旁边打开合成栏才会出现
- 饰品需要装备到饰品栏才会生效

### 3）我装备了饰品，但是没有效果

- 检查 `Item.accessory = true;` 是否存在
- 检查 `UpdateAccessory()` 方法是否正确重写
- 检查 `player.moveSpeed += 0.1f;` 是否在 `UpdateAccessory()` 方法里

## 下一步会学什么？

这一章你已经完成最关键的一步：**你能创建饰品，并且知道如何修改玩家属性**。

下一章我们会做第一个 Buff：你会看到"饰品"是怎么给玩家添加"Buff效果"的。
