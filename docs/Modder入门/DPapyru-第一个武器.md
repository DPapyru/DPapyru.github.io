---
title: 第一个武器
author: 小天使
date: 2026-01-17
last_updated: 2026-01-17
difficulty: beginner
time: 15分钟
description: 做第一把武器同时入门C#
prev_chapter: DPapyru-快速开始构建Mod.md
next_chapter: null
topic: mod-basics
order: 2
colors:
  Red: "#f00"
---

# 第一个武器：做一把能用的剑（顺便认识一点 C#）

这一章的目标很简单：做出你 Mod 里的第一把武器，并且你敢改它的关键数值与配方。

你不需要先“学会 C# 才能写 Mod”。你只需要先学会两件事：

- 能看懂这份代码大概在干什么（像看说明书一样）
- 知道“你应该改哪几行”，改完能编译、能进游戏测试

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名（更准确地说，是你的 Mod 的“命名空间前缀/根名字”）。不知道自己的 Mod 名也没关系，先照抄，后面我们会说怎么判断。

## 你准备好了吗？

你需要完成上一章：已经能打开 tModLoader 的 Mod 项目，并且能成功编译/进入游戏。

## 第一步：先让它跑起来（你可以先复制）

建议你把文件放在类似位置（文件夹名字随你，但先跟着模板走最省事）：

- `Content/Items/FirstSword.cs`

然后把下面这份代码整段复制进去。复制完成后先编译一次，确保“能跑”。能跑之后我们再来“只手敲关键行”。

```csharp
// 这三行相当于“我今天要用哪些工具箱”
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

// namespace 相当于“收纳盒的地址”，先照抄就行
namespace YourModName.Content.Items
{
    // class 相当于“蓝图/说明书”。这份蓝图要做的是一把物品（ModItem）
    public class FirstSword : ModItem
    {
        // SetDefaults：设置这把武器的“出厂参数”
        public override void SetDefaults()
        {
            // 你后面最常改的就是这一段：像在填一张“武器属性表”
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

        // AddRecipes：告诉游戏“这东西怎么合成”
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

### 题目（30 秒）

```quiz
type: choice
id: mod-basics-first-weapon-edit-lines
question: |
  下面哪些行是“你以后想改伤害/攻速/配方材料”最常会动到的？
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

## 第二步：只手敲关键行（练手但不折磨）

现在开始“中间形态”的练习：你可以保留其它代码不动，只对下面这些行做一次“删掉 → 自己敲回去”。

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

你会发现：你不需要知道“C# 的全部规则”，也能写出一个能工作的东西。

## 第三步：教你“怎么读这份代码”（从上往下）

下面我们按“阅读顺序”讲一下：每段在干嘛、你现在需要记住什么。

### 1）`using`：我需要哪些工具箱

你可以把 `using` 理解成：**我这份文件里会用到哪些东西，所以先把对应的工具箱拿过来**。

- `using Terraria;`：泰拉瑞亚本体里的一些常用类型
- `using Terraria.ID;`：各种 ID（比如 `ItemID.Wood`、`TileID.WorkBenches`）
- `using Terraria.ModLoader;`：tModLoader 的核心（比如 `ModItem`、`Recipe`）

这三行你目前不需要背，先记住一个排错技巧：

- 如果你删掉 `using Terraria.ID;`，那么 `ItemID` / `TileID` 往往会“变红报错”

```quiz
type: choice
id: mod-basics-itemid-wood
question: |
  `ItemID.Wood` 更接近下面哪个意思？
options:
  - id: A
    text: |
      一个“木头”的固定编号（原版物品 ID）
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

### 2）`namespace`：给这份蓝图一个“地址”

`namespace YourModName.Content.Items` 你可以先当成“收纳盒地址”：

- `YourModName`：你的 Mod 的名字（占位符，之后要换成自己的）
- `Content.Items`：你自己给“物品类”起的分类名

它最大的好处是：当你项目变大时，不同文件里可以有更清晰的分类，也不容易撞名字。

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
      两个类会自动“合并”成一个
answer: A
explain: |
  在同一个 `namespace` 下同名 `class` 会冲突，C# 会直接编译失败。
```

### 3）`class FirstSword : ModItem`：这份文件在“定义一个新物品”

你可以把 `class` 当成“蓝图”。蓝图的名字是 `FirstSword`，也就是这把武器的“代码名字”。

后面的 `: ModItem` 先不要被吓到，你现在只要这样理解：

- `ModItem` 是 tModLoader 里“物品的通用模板”
- 我们写的 `FirstSword` 是“基于这个模板做出来的一把新物品”

严格说这叫“继承”，但现在先别钻定义：你只需要知道——**我们能用 `ModItem` 提供的能力（比如 `Item`、`SetDefaults`、`AddRecipes`）来写自己的物品**。

### 4）方法（函数）：一段“要做的事情”

代码里有两个“方法”（你可以理解成“步骤/流程”）：

- `SetDefaults()`：设置这把武器的属性（伤害、攻速、稀有度……）
- `AddRecipes()`：设置合成配方

方法前面有 `public override void`，你先只记两句话：

- `void`：这段代码“做事情”，但不会“返回一个结果给你”
- `override`：我在告诉 tModLoader：这个步骤我需要“自己写一份”，用我的规则来替换默认规则

### 5）`Item.xxx = ...;`：像在填“属性表”（你最常改的地方）

把 `Item` 想象成“这把武器本身”。`Item.damage` 就是它的伤害，`Item.useTime` 就是它挥动需要的时间……

你可以先把最常用的几行记成一句话：

- `Item.damage`：伤害
- `Item.useTime` / `Item.useAnimation`：挥动速度（初学者先让它俩一样就好）
- `Item.knockBack`：击退
- `Item.rare`：稀有度（颜色）
- `Item.value`：卖店价格
- `Item.autoReuse`：按住鼠标是否自动连续挥动

**练习（推荐一定要做）**：

1. 把 `Item.damage = 50;` 改成 `Item.damage = 12;`
2. 编译进游戏试一下手感
3. 再改回 50（你会明显感受到“我改了代码，游戏变了”）

### 6）`=`：把右边“装进”左边

`Item.damage = 50;` 这句话你可以翻译成：

> 把“50”这个数，装到“damage”这个格子里

所以你以后改数值，本质上就是在改 `=` 右边。

### 7）这一章用到的数据类型（只讲够用的）

你现在只需要认识两种：

- 数字：比如 `50`、`20`、`6`（你可以先当它们都是“整数”）
- 布尔值：`true` / `false`（只有“是/否”两种）

像 `ItemRarityID.Blue`、`ItemUseStyleID.Swing` 这种，看起来不是数字，但你可以先把它当成：**游戏里提前写好的“选项列表”**。

### 8）配方：`CreateRecipe()` + `AddIngredient` + `AddTile` + `Register`

`AddRecipes()` 里每行都很像“中文”：

- `Recipe recipe = CreateRecipe();`：开始写一个配方
- `recipe.AddIngredient(ItemID.Wood, 10);`：需要 10 个木头
- `recipe.AddTile(TileID.WorkBenches);`：需要在工作台旁边制作
- `recipe.Register();`：把这个配方登记到游戏里（不登记就等于没写）

**练习（推荐）**：把木头数量从 `10` 改成 `1`，进游戏看看合成条件有没有变化。

## 常见问题（先救命，后讲道理）

### 1）我编译报错，最常见是哪里？

- `YourModName` 没替换：如果你项目默认命名空间不是这个，可能会提示找不到类型/命名空间。你可以先把 `namespace YourModName...` 里的 `YourModName` 换成你项目里其它 `.cs` 文件最上面用的那个名字。
- `Content.Items` 写错了：`namespace` 的后半段你可以随便取，但要确保它只是“分类名”，不要写奇怪符号。
- `using` 少了：如果 `ItemID` 或 `TileID` 变红，检查 `using Terraria.ID;` 是否存在。

### 2）我进游戏找不到这把武器/配方

- 确认 Mod 已启用，且你确实重新“编译并加载”了 Mod
- 配方需要在工作台旁边打开合成栏才会出现

## 下一步会学什么？

这一章你已经完成最关键的一步：**你能改武器参数与配方，并且知道从哪里下手排错**。

下一章开始我们会逐步把“看着像魔法的词”（比如 `override`、`class`、`DamageClass`）变成你真正理解并能举例的概念。
