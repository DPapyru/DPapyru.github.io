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

这一章的目标很简单：做出你 Mod 里的第一个 Buff，并且你敢改它的关键数值。

Buff 是什么？简单来说，**Buff 是一种持续的效果**，比如中毒、燃烧、加速、回血等。Buff 会持续一段时间，在这段时间内，它会不断影响玩家或敌人。

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名（更准确地说，是你的 Mod 的"命名空间前缀/根名字"）。不知道自己的 Mod 名也没关系，先照抄，后面我们会说怎么判断。

## 阅读前需求

- 已完成"第一个饰品"章节：知道如何修改玩家属性
- 知道怎么新建 `.cs` 文件（放进你的 Mod 项目里）

## 第一步：了解代码

Buff 需要两个文件：

1. **Buff 类**：定义 Buff 的属性和行为
2. **给玩家添加 Buff 的物品**：比如一个药水，喝了之后获得 Buff

建议你把文件放在类似位置：

- `Content/Buffs/PoisonDebuff.cs`（Buff 类）
- `Content/Items/PoisonPotion.cs`（药水物品）

### 1.1 创建 Buff 类

先把下面这份代码复制到 `PoisonDebuff.cs`：

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
            // 设置 Buff 不会随时间消失（可选）
            Main.buffNoTimeDisplay[Type] = false;
            // 设置 Buff 是负面效果
            Main.debuff[Type] = true;
            // 设置 Buff 不能被右键取消
            Main.buffNoSave[Type] = false;
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

再把下面这份代码复制到 `PoisonPotion.cs`：

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

复制完成后先编译一次，确保"能跑"。能跑之后我们再来"只手敲关键行"。

### 题目

```quiz
type: choice
id: mod-basics-first-buff-edit-lines
question: |
  下面哪些行是"你以后想改 Buff 效果/持续时间"最常会动到的？
options:
  - id: A
    text: |
      `Main.buffName[Type] = "中毒";`
  - id: B
    text: |
      `player.statLife -= 5;`
  - id: C
    text: |
      `Item.buffTime = 300;`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - B
  - C
explain: |
  Buff 效果在 `Update()` 里改，持续时间在 `Item.buffTime` 里改。
  `Main.buffName` 是 Buff 的名字，一般不用动。
  `using ...` 一般不用动，除非你删了/加了新东西导致编译报错。
```

## 第二步：学习关键内容

现在开始"中间形态"的练习：你可以保留其它代码不动，只对下面这些行做一次"删掉 → 自己敲回去"。

建议练习顺序：

1. 在 `PoisonDebuff.cs` 的 `SetStaticDefaults()` 里把这些行删掉，再自己敲回去：
   - `Main.buffName[Type] = "中毒";`
   - `Main.buffTip[Type] = "持续受到伤害";`
   - `Main.debuff[Type] = true;`
2. 在 `PoisonDebuff.cs` 的 `Update()` 里把这几行删掉，再自己敲回去：
   - `if (player.buffTime[buffIndex] % 60 == 0)`
   - `player.statLife -= 5;`
   - `CombatText.NewText(player.getRect(), new Microsoft.Xna.Framework.Color(255, 0, 0), 5, true);`
3. 在 `PoisonPotion.cs` 的 `SetDefaults()` 里把这两行删掉，再自己敲回去：
   - `Item.buffType = ModContent.BuffType<PoisonDebuff>();`
   - `Item.buffTime = 300;`

你会发现：你不需要知道"C# 的全部规则"，也能写出一个能工作的 Buff。

## 第三步：教你"怎么读这份代码"（从上往下）

下面我们按"阅读顺序"讲一下：每段在干嘛、你现在需要记住什么。

### 1）`ModBuff`：Buff 的基类

`ModBuff` 是 tModLoader 里"Buff 的基类"。

我们写的 `PoisonDebuff` 是"基于这个基类创建的一个新 Buff"。

### 2）`SetStaticDefaults()`：设置 Buff 的静态属性

这个方法用于设置 Buff 的静态属性，比如名字、描述、是否是负面效果等。

- `Main.buffName[Type]`：Buff 的名字
- `Main.buffTip[Type]`：Buff 的描述
- `Main.debuff[Type]`：是否是负面效果（true 表示负面效果）
- `Main.buffNoTimeDisplay[Type]`：是否不显示剩余时间
- `Main.buffNoSave[Type]`：是否不保存到存档

```quiz
type: choice
id: mod-buffs-debuff-true
question: |
  `Main.debuff[Type] = true;` 的作用是什么？
options:
  - id: A
    text: |
      表示这个 Buff 是正面效果
  - id: B
    text: |
      表示这个 Buff 是负面效果
  - id: C
    text: |
      表示这个 Buff 不会消失
answer: B
explain: |
  `Main.debuff[Type] = true;` 表示这是一个负面效果（比如中毒、燃烧）。
```

### 3）`Update(Player player, ref int buffIndex)`：Buff 的核心方法

这个方法是 Buff 的核心：**当玩家有这个 Buff 时，每一帧都会调用这个方法**。

- `Player player`：代表有这个 Buff 的玩家
- `ref int buffIndex`：Buff 的索引（用于获取 Buff 的剩余时间）

在这个方法里，你可以修改玩家的各种属性，或者造成伤害。

### 4）`player.buffTime[buffIndex] % 60 == 0`：每秒执行一次

这一行的作用是：**每秒执行一次伤害**。

- `player.buffTime[buffIndex]`：Buff 的剩余时间（帧）
- `% 60`：取模运算，意思是"除以 60 的余数"
- `== 0`：等于 0

所以 `player.buffTime[buffIndex] % 60 == 0` 的意思是：**当 Buff 的剩余时间是 60 的倍数时（即每秒）**。

```quiz
type: choice
id: mod-buffs-modulo-operator
question: |
  `player.buffTime[buffIndex] % 60 == 0` 的作用是什么？
options:
  - id: A
    text: |
      每 60 帧执行一次（即每秒执行一次）
  - id: B
    text: |
      每 60 秒执行一次
  - id: C
    text: |
      当 Buff 时间等于 60 时执行
answer: A
explain: |
  `%` 是取模运算，`% 60 == 0` 表示"除以 60 的余数等于 0"，即每 60 帧（每秒）执行一次。
```

### 5）`player.statLife -= 5;`：造成伤害

这一行的作用是：**减少玩家 5 点生命值**。

- `player.statLife`：玩家的当前生命值
- `-=`：减法赋值运算符，意思是"在原来的基础上减去"
- `5`：减少的数量

所以 `player.statLife -= 5;` 的意思是：**在玩家原来的生命值基础上，再减少 5**。

### 6）`CombatText.NewText(...)`：显示伤害数字

这一行的作用是：**在玩家头顶显示伤害数字**。

- `player.getRect()`：玩家的位置和大小
- `new Microsoft.Xna.Framework.Color(255, 0, 0)`：红色
- `5`：显示的数字
- `true`：是否显示为伤害（false 表示治疗）

### 7）`Item.buffType = ModContent.BuffType<PoisonDebuff>();`：设置 Buff 类型

这一行的作用是：**告诉游戏这个物品会给玩家添加哪个 Buff**。

- `ModContent.BuffType<PoisonDebuff>()`：获取 `PoisonDebuff` 这个 Buff 的类型

### 8）`Item.buffTime = 300;`：设置 Buff 持续时间

这一行的作用是：**设置 Buff 的持续时间**。

- `300`：持续时间（帧），60 帧约等于 1 秒，所以 300 帧约等于 5 秒

**练习（推荐一定要做）**：

1. 把 `Item.buffTime = 300;` 改成 `Item.buffTime = 600;`
2. 编译进游戏试一下持续时间变化
3. 再改回 300（你会明显感受到"我改了代码，游戏变了"）

## 常见问题（先救命，后讲道理）

### 1）我编译报错，最常见是哪里？

- `YourModName` 没替换：如果你项目默认命名空间不是这个，可能会提示找不到类型/命名空间。你可以先把 `namespace YourModName...` 里的 `YourModName` 换成你项目里其它 `.cs` 文件最上面用的那个名字。
- `Content.Buffs` 写错了：`namespace` 的后半段你可以随便取，但要确保它只是"分类名"，不要写奇怪符号。
- `using YourModName.Content.Buffs;` 没加：如果 `PoisonDebuff` 变红，检查 `using YourModName.Content.Buffs;` 是否存在。

### 2）我进游戏找不到这个药水/配方

- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 配方需要在瓶子旁边打开合成栏才会出现
- 药水需要右键使用才会给玩家添加 Buff

### 3）我喝了药水，但是没有 Buff 效果

- 检查 `Item.buffType = ModContent.BuffType<PoisonDebuff>();` 是否存在
- 检查 `Update()` 方法是否正确重写
- 检查 `player.statLife -= 5;` 是否在 `Update()` 方法里

## 下一步会学什么？

这一章你已经完成最关键的一步：**你能创建 Buff，并且知道如何让物品给玩家添加 Buff**。

下一章我们会做第一个召唤物：你会看到"召唤物"是怎么跟随玩家并攻击敌人的。
