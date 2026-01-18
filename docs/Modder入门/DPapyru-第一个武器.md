---
title: 第一个武器
author: 小天使
date: 2026-01-17
last_updated: 2026-01-17
difficulty: beginner
time: 15分钟
description: 边做第一把武器边补 C# 基础
prev_chapter: DPapyru-快速开始构建Mod.md
next_chapter: null
topic: mod-basics
order: 2
colors:
  Mad: "#f00"
---

# 第一个武器：先做出来，再顺手补 C#

你上一章已经能 `Build + Reload` 了，这一章我们不整花活：**先把第一把武器做出来**。

本节的验收点（都能在游戏里看到）：

- 验收点 1：你能合成这把武器（配方出现在合成列表里）
- 验收点 2：你改了属性，重新合成后手感/数值真的变了

接下来按步骤来：每做完一步，只补这一小步用到的 C#。

---

# 1) 先认一下模板长什么样

你可能是用 tModLoader 的模板生成的物品，也可能是像上一章那样自己新建 `.cs` 文件。
不管哪种，核心都一样：**一个继承 `ModItem` 的类 + 两个常用方法（`SetDefaults` / `AddRecipes`）**。

下面是一份“典型模板”，把 `YourModName` 换成你自己的 Mod 命名空间就行：

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace YourModName.Items
{
    public class FirstSword : ModItem
    {
        public override void SetDefaults()
        {
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

你现在先别追求“全都懂”，只要知道两件事：

- `SetDefaults()`：这把武器的“手感/数值”基本都在这改
- `AddRecipes()`：这把武器“怎么合成”在这写

## C# 小知识：`using` 和 `namespace`（够用版）

- `using ...;`：告诉编译器“我要用这些库里的东西”（比如 `ItemID`、`Recipe` 这些类型/常量）
- `namespace ... { }`：给你的代码分个组，方便管理；它不一定必须跟文件夹完全一致，但**跟着项目习惯走**最省心

````quiz
type: choice
id: first-weapon-step1-q1
question: |
  下面哪个 `using` 让你能写 `ItemID.Wood`、`ItemID.CopperBar` 这类常量？
options:
  - id: A
    text: |
      `using Terraria;`
  - id: B
    text: |
      `using Terraria.ID;`
  - id: C
    text: |
      `using Terraria.ModLoader;`
answer:
  - B
explain: |
  `ItemID`、`TileID` 都在 `Terraria.ID` 里。
````

---

# 2) 把“类”和“继承”这件事搞清楚

先盯着这一行：

```csharp
public class FirstSword : ModItem
```

你可以把它当成一句大白话：

- `FirstSword`：你要做的“物品类型”（你写的是“模板/蓝图”）
- `: ModItem`：这句的意思是“它是一个 ModItem”（继承）。tModLoader 看到这种类，就知道你在定义一个物品

## C# 小知识：类名、继承、约定

- `class`：定义一个类（类型）
- `:`：表示继承（`FirstSword` 在 `ModItem` 的基础上增加/覆盖一些行为）
- 文件名不强制必须和类名一致，但**强烈建议一致**：比如 `FirstSword.cs` 里写 `class FirstSword`
  - 你以后要在项目里搜索/定位，真的会省很多时间

````quiz
type: tf
id: first-weapon-step2-q1
question: |
  判断：C# 里“文件名必须和类名完全一致”，否则无法编译。
answer: false
explain: |
  不要求一致，但保持一致是非常推荐的项目习惯（尤其是新手阶段）。
````

---

# 3) 先把“手感/数值”改出来（SetDefaults）

你现在先做一个最简单的验证：把伤害改大一点，重新合成一把，看它是不是更痛了。

你最常改的就是这些：

- `Item.damage`：基础伤害
- `Item.useTime` / `Item.useAnimation`：挥动频率/动作时长（手感相关）
- `Item.knockBack`：击退
- `Item.rare` / `Item.value`：稀有度/价值

{color:Mad}{提示：你改完 `SetDefaults()` 后，手里那把旧武器经常不会“自动变身”。最稳的验证方式是：重新合成一把新的。}

## C# 小知识：赋值（`=`）和数字类型

像 `Item.damage = 50;` 这种就是最经典的“赋值”：把右边的值塞进左边的字段里。

- `damage`、`useTime` 这类一般是整数（`int`）
- `knockBack` 往往是小数，所以你会看到 `4.5f`（`f` 表示这是 `float`）

````quiz
type: choice
id: first-weapon-step3-q1
question: |
  你想让武器“更痛”，最直接应该先改哪一行？
options:
  - id: A
    text: |
      `Item.damage = ...;`
  - id: B
    text: |
      `Item.width = ...;`
  - id: C
    text: |
      `Item.value = ...;`
answer:
  - A
explain: |
  其它参数也会影响体验，但“基础伤害”最直接就是 `Item.damage`。
````

---

# 4) 再让它“能合成”（AddRecipes）

把配方写进 `AddRecipes()`，你就能在合成列表里看到它。
它一般发生在“加载模组/注册内容”的阶段，不会在你每次挥刀时都执行。

模板里这几行的意思非常直白：

- `CreateRecipe()`：创建一个“这把物品自己的配方”
- `AddIngredient(...)`：加材料
- `AddTile(...)`：指定在哪个工作站制作
- `Register()`：注册进游戏（这句没了就等于没写）

## C# 小知识：变量、对象、调用方法

```csharp
Recipe recipe = CreateRecipe();
```

- `Recipe`：类型（你可以理解成“配方对象”）
- `recipe`：变量名（你给这个对象起的名字）
- `=`：把右边创建出来的对象塞到左边变量里

你也会看到另一种写法（链式调用），只是“写法不同，效果一样”：

```csharp
CreateRecipe()
    .AddIngredient(ItemID.Wood, 10)
    .AddTile(TileID.WorkBenches)
    .Register();
```

````quiz
type: choice
id: first-weapon-step4-q1
question: |
  下面哪一步是“让配方真正生效”的关键？
options:
  - id: A
    text: |
      `CreateRecipe()`
  - id: B
    text: |
      `AddIngredient(...)`
  - id: C
    text: |
      `Register()`
answer:
  - C
explain: |
  没有 `Register()` 就相当于“写了配方，但没有把它注册进游戏”。
````

---

# 5) 实战：改成“铜阔剑”风格（保持 Swing 手感）

目标：保持 `Swing` 的挥动方式，把伤害、击退、稀有度、价值、配方改得更像原版早期的铜剑，并把配方放到铁砧上。

建议你分两次验证：

1. 先只改 `SetDefaults()`，重新合成一把，确认数值/手感变化
2. 再改 `AddRecipes()`，确认合成材料和工作站变化

```csharp
public override void SetDefaults()
{
    Item.damage = 7;
    Item.DamageType = DamageClass.Melee;
    Item.width = 40;
    Item.height = 40;

    Item.useTime = 20;
    Item.useAnimation = 20;
    Item.useStyle = ItemUseStyleID.Swing;

    Item.knockBack = 4.5f;
    Item.value = Item.buyPrice(copper: 90);
    Item.rare = ItemRarityID.White;
    Item.UseSound = SoundID.Item1;
    Item.autoReuse = true;
}

public override void AddRecipes()
{
    Recipe recipe = CreateRecipe();
    recipe.AddIngredient(ItemID.CopperBar, 7);
    recipe.AddTile(TileID.Anvils);
    recipe.Register();
}
```

## C# 小知识：`4.5f` 和 `buyPrice(copper: 90)`

- `4.5f`：`f` 表示这是 `float`（小数），很多 API 字段就是要 `float`
- `Item.buyPrice(copper: 90)`：这是 C# 的“命名参数”，意思是“把 90 传给 copper 这个参数”
  - 好处：读起来更像人话，也不容易把顺序写错

````quiz
type: choice
id: first-weapon-step5-q1
question: |
  `Item.knockBack = 4.5f;` 里的 `f` 主要是为了：
options:
  - id: A
    text: |
      让数字变得更大
  - id: B
    text: |
      告诉编译器这是 `float`（小数类型）
  - id: C
    text: |
      让击退产生火焰效果
answer:
  - B
explain: |
  `4.5` 默认会被当成 `double`，加 `f` 明确告诉编译器这是 `float`。
````

---

# 6) 常见坑（真的很常见）

- 改了 `SetDefaults()` 但没变化：重新合成一把新的再验收
- 配方不出现：检查是不是漏了 `Register()`，以及工作站/材料 ID 写对没
- 类名拼错/改名改一半：`FirstSword` 这类名字尽量一次写对，少给自己挖坑

---

# 小结：你现在应该会什么？

- 会改 `SetDefaults()`：能把“手感/数值”改到你想要的样子
- 会写 `AddRecipes()`：能把合成材料和工作站改正确并验收
- C# 不用一口吃成胖子：这一章你至少掌握了 `using`、`namespace`、类/继承、赋值、变量与方法调用这些“够用基础”
