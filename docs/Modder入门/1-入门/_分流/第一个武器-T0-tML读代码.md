---
title: 第一个武器（T0 补课）：tModLoader 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 12分钟
description: 给第一次接触 tModLoader API 的读者，定位“第一个武器”里该看懂的 API
topic: mod-basics
order: 9002
---

这份补充内容面向 **T0（第一次接触 tModLoader API）**：用于定位本章代码中需要理解的核心 API 入口与职责。

## 1）`class FirstSword : ModItem`：为什么要继承 `ModItem`

> **[对应概念]**：基类、继承、tML 的物品模型

`ModItem` 是 tModLoader 提供的物品基类。编写新物品通常遵循同一模式：

> 继承 `ModItem`，并在约定的方法入口中填入属性与配方逻辑

因此 `class FirstSword : ModItem` 的核心含义是：

- 这份代码会被 tML 当成“一个物品”来加载
- 你可以在指定的方法里填属性、写配方

## 2）`SetDefaults()`：设置物品属性的入口

> **[对应概念]**：tML 生命周期入口

`SetDefaults()` 内的 `Item.xxx = ...;` 可以视为该物品的“属性表”。

大多数基础数值与手感调参都在这里完成。

## 3）`Item.xxx = ...;`：常用属性与“改哪里”

> **[对应概念]**：tML 的 `Item` 属性表

`Item` 代表“这件物品本身”。下面是本章最常用的一批属性：

- `Item.damage`：伤害
- `Item.DamageType`：伤害类型（近战/远程/魔法……）
- `Item.useTime` / `Item.useAnimation`：挥动速度（初学者先让它俩一样）
- `Item.useStyle`：使用动作（比如挥砍）
- `Item.knockBack`：击退
- `Item.rare`：稀有度（颜色）
- `Item.value`：卖店价格
- `Item.UseSound`：挥动音效
- `Item.autoReuse`：按住鼠标是否连挥

**练习（建议）**：

1. 把 `Item.damage = 50;` 改成 `Item.damage = 12;`
2. 编译 → 进游戏试一下手感
3. 再改回 50，用于确认修改已在游戏内生效

## 4）配方：`CreateRecipe()` → `AddIngredient` → `AddTile` → `Register`

> **[对应概念]**：tML 配方 API

`AddRecipes()` 是注册合成配方的入口。通常按以下四步组织：

- `Recipe recipe = CreateRecipe();`：创建一个配方对象
- `recipe.AddIngredient(ItemID.Wood, 10);`：添加材料：10 个木头
- `recipe.AddTile(TileID.WorkBenches);`：添加制作站：工作台
- `recipe.Register();`：注册到游戏里（不注册就等于没写）

**练习（推荐）**：把木头数量从 `10` 改成 `1`，进游戏看看合成条件有没有变化。
