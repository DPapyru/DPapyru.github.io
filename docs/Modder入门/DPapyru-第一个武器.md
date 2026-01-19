---
title: 第一个武器
author: 小天使
date: 2026-01-17
last_updated: 2026-01-19
difficulty: beginner
time: 15分钟
description: 做第一把武器同时入门C#
prev_chapter: DPapyru-快速开始构建Mod.md
next_chapter: DPapyru-第一个弹幕.md
topic: mod-basics
order: 2
colors:
  Red: "#f00"
---

# 第一个武器：做一把能用的剑同时学习C#基础

这一章的目标很简单：做出你 Mod 里的第一把武器，并且你敢改它的关键数值与配方。

你不需要先"学会 C# 才能写 Mod"。你只需要先学会两件事：

- 能看懂这份代码大概在干什么
- 知道"你应该改哪几行"，改完能编译、能进游戏测试

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名（更准确地说，是你的 Mod 的"命名空间前缀/根名字"）。不知道自己的 Mod 名也没关系，先照抄，后面我们会说怎么判断。

## 阅读前需求

- 已完成上一章：能打开 tModLoader 的 Mod 项目，并且能成功编译/进入游戏
- 知道怎么新建 `.cs` 文件（放进你的 Mod 项目里）

## 第一步：了解代码

建议你把文件放在类似位置（文件夹名字随你，但先跟着模板走最省事）：

- `Content/Items/FirstSword.cs`

然后把下面这份代码整段复制进去。复制完成后先编译一次，确保"能跑"。能跑之后我们再来"只手敲关键行"。

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

### 题目

```quiz
type: choice
id: mod-basics-first-weapon-edit-lines
question: |
  下面哪些行是"你以后想改伤害/攻速/配方材料"最常会动到的？
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

## 第二步：学习关键内容

现在开始"中间形态"的练习：你可以保留其它代码不动，只对下面这些行做一次"删掉 → 自己敲回去"。

建议练习顺序：

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

你会发现：你不需要知道"C# 的全部规则"，也能写出一个能工作的东西。

## 第三步：教你"怎么读这份代码"（从上往下）

下面我们按"阅读顺序"讲一下：每段在干嘛、你现在需要记住什么。

### 1）`using`：引用命名空间

`using` 语句用于引用命名空间，让你可以使用其中的类型。

- `using Terraria;`：引用 Terraria 命名空间，包含一些常用类型
- `using Terraria.ID;`：引用 Terraria.ID 命名空间，包含各种 ID（比如 `ItemID.Wood`、`TileID.WorkBenches`）
- `using Terraria.ModLoader;`：引用 Terraria.ModLoader 命名空间，包含 tModLoader 的核心类型（比如 `ModItem`、`Recipe`）

这三行你目前不需要背，先记住一个排错技巧：

- 如果你删掉 `using Terraria.ID;`，那么 `ItemID` / `TileID` 往往会"变红报错"

```quiz
type: choice
id: mod-basics-itemid-wood
question: |
  `ItemID.Wood` 更接近下面哪个意思？
options:
  - id: A
    text: |
      一个"木头"的固定编号（原版物品 ID）
  - id: B
    text: |
      你自己新建的物品类 `Wood`
  - id: C
    text: |
      木头贴图的文件路径
answer: A
explain: |
  `Terraria.ID.ItemID` 里收录了原版所有物品的 ID，`Wood` 就是木头。
```

### 2）`namespace`：定义命名空间

`namespace YourModName.Content.Items` 用于组织代码，避免命名冲突。

- `YourModName`：你的 Mod 的名字（占位符，之后要换成自己的）
- `Content.Items`：你自己给"物品类"起的分类名

它的作用是：当你项目变大时，不同文件里可以有更清晰的分类，也不容易撞名字。

```quiz
type: choice
id: mod-basics-duplicate-class-name
question: |
  如果你在**同一个** `namespace` 里写了两个 `public class FirstSword`，最可能发生什么？
options:
  - id: A
    text: |
      编译报错：类型/类名重复
  - id: B
    text: |
      游戏会随机选择其中一个作为最终武器
  - id: C
    text: |
      两个类会自动"合并"成一个
answer: A
explain: |
  在同一个 `namespace` 下同名 `class` 会冲突，C# 会直接编译失败。
```

### 3）`class FirstSword : ModItem`：定义一个新物品类

`class` 用于定义一个类。类的名字是 `FirstSword`，也就是这把武器的"代码名字"。

后面的 `: ModItem` 表示这个类继承自 `ModItem`。

- `ModItem` 是 tModLoader 里"物品的基类"
- 我们写的 `FirstSword` 是"基于这个基类创建的一个新物品"

继承的意思是：`FirstSword` 拥有 `ModItem` 的所有功能，我们可以通过重写方法来修改或扩展这些功能。

### 4）方法：定义一段可执行的代码

代码里有两个"方法"：

- `SetDefaults()`：设置这把武器的属性（伤害、攻速、稀有度……）
- `AddRecipes()`：设置合成配方

方法前面有 `public override void`：

- `public`：这个方法可以从外部访问
- `override`：这个方法重写了基类中的方法
- `void`：这个方法不返回值

### 5）`Item.xxx = ...;`：设置物品属性

`Item` 代表这个物品本身。`Item.damage` 就是它的伤害，`Item.useTime` 就是它挥动需要的时间……

你可以先把最常用的几行记下来：

- `Item.damage`：伤害
- `Item.useTime` / `Item.useAnimation`：挥动速度（初学者先让它俩一样就好）
- `Item.knockBack`：击退
- `Item.rare`：稀有度（颜色）
- `Item.value`：卖店价格
- `Item.autoReuse`：按住鼠标是否自动连续挥动

**练习（推荐一定要做）**：

1. 把 `Item.damage = 50;` 改成 `Item.damage = 12;`
2. 编译进游戏试一下手感
3. 再改回 50（你会明显感受到"我改了代码，游戏变了"）

### 6）`=`：赋值运算符

`Item.damage = 50;` 这句话的意思是：

> 把 50 这个值赋给 `damage` 属性

所以你以后改数值，本质上就是在改 `=` 右边。

### 7）这一章用到的数据类型（只讲够用的）

你现在只需要认识两种：

- 数字：比如 `50`、`20`、`6`（整数）
- 布尔值：`true` / `false`（只有两种值）

像 `ItemRarityID.Blue`、`ItemUseStyleID.Swing` 这种，看起来不是数字，但它们是枚举类型，代表游戏里提前定义好的选项。

### 8）配方：`CreateRecipe()` + `AddIngredient` + `AddTile` + `Register`

`AddRecipes()` 里每行都很直观：

- `Recipe recipe = CreateRecipe();`：创建一个配方对象
- `recipe.AddIngredient(ItemID.Wood, 10);`：添加材料：10 个木头
- `recipe.AddTile(TileID.WorkBenches);`：添加制作站：工作台
- `recipe.Register();`：注册这个配方到游戏里（不注册就等于没写）

**练习（推荐）**：把木头数量从 `10` 改成 `1`，进游戏看看合成条件有没有变化。

## 常见问题（先救命，后讲道理）

### 1）我编译报错，最常见是哪里？

- `YourModName` 没替换：如果你项目默认命名空间不是这个，可能会提示找不到类型/命名空间。你可以先把 `namespace YourModName...` 里的 `YourModName` 换成你项目里其它 `.cs` 文件最上面用的那个名字。
- `Content.Items` 写错了：`namespace` 的后半段你可以随便取，但要确保它只是"分类名"，不要写奇怪符号。
- `using` 少了：如果 `ItemID` 或 `TileID` 变红，检查 `using Terraria.ID;` 是否存在。

### 2）我进游戏找不到这把武器/配方

- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 配方需要在工作台旁边打开合成栏才会出现

## 下一步会学什么？

这一章你已经完成最关键的一步：**你能改武器参数与配方，并且知道从哪里下手排错**。

下一章我们会做第一个弹幕：你会看到"武器（物品）"是怎么把"弹幕（Projectile）"打出去的。
