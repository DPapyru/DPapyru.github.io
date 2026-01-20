---
title: 第一个武器（C0 补课）：C# 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 10分钟
description: 给从没接触过 C# 的读者，看懂“第一个武器”里出现的关键语法
topic: mod-basics
order: 9001
---

这份补充内容面向 **C0（从没接触过 C#）**：覆盖阅读与修改本章代码所需的最小语法集合。

> **[C#概念进度]**
>
> 学完这一节，你将掌握：
> - `using`：引用命名空间
> - `namespace`：代码分组
> - 方法与 `override`：为什么要“重写”
> - `=`：赋值运算
> - 本章常见的数据类型：`int` / `bool` / 枚举（Enum）

## 1）`using`：引用命名空间

> **[对应概念]**：`using`、命名空间

`using` 的作用是：引入某个命名空间，使你可以直接使用其中的类型名称。

你在本章会看到类似三行：

- `using Terraria;`
- `using Terraria.ID;`
- `using Terraria.ModLoader;`

不要求记住全部名称；建议记住一条排错规则：

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

## 2）`namespace`：命名空间是“分组名”

> **[对应概念]**：`namespace`、代码组织

`namespace YourModName.Content.Items` 是一层“分组名”，用于组织代码并避免重名冲突。可以把它理解为“文件夹标签”：相同名称放在不同标签下，才不会互相覆盖。

- `YourModName`：你的 Mod 的名字（占位符，需要换成你自己的）
- `Content.Items`：你给“物品类”起的分类名（可以自定义，但建议先照模板）

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

## 3）方法 + `override`：为什么要写 `override`

> **[对应概念]**：方法、`override`

你会在本章看到类似写法：

```csharp
public override void SetDefaults()
{
    // ...
}
```

可以按如下理解：

- `SetDefaults()` 是基类定义的可重写方法，框架会在合适的时机调用它
- `override` 表示：你正在提供该方法的具体实现，用以替换/补全基类默认实现

## 4）`=`：赋值运算符

> **[对应概念]**：赋值运算符

`Item.damage = 50;` 的意思是：

> 把右边的 `50` 这个值，存进左边的 `damage` 属性里

后续调整数值时，本质上就是修改 `=` 右侧的字面量或表达式。可以把赋值理解为“在带标签的格子里写入新数值”：标签（左侧）不变，内容（右侧）可调整。

## 5）这一章常见的数据类型（只讲够用的）

> **[对应概念]**：数据类型、`int`、`bool`、枚举

你现在只需要先认识两种：

- 数字：比如 `50`、`20`、`6`（这类通常是整数 `int`）
- 布尔值：`true` / `false`（开/关）

像 `ItemRarityID.Blue`、`ItemUseStyleID.Swing` 这种看起来不是数字的值，是**枚举（Enum）**：代表游戏提前定义好的一组选项。
