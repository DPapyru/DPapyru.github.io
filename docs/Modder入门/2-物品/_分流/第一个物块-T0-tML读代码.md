---
title: 第一个物块（T0 补课）：tModLoader 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 12分钟
description: 给第一次接触 tModLoader API 的读者，定位"第一个物块"里该看懂的 API
topic: mod-basics
order: 9202
hide: true
---

这份补充内容面向 **T0（第一次接触 tModLoader API）**：用于定位本章代码中需要理解的核心 API 入口与职责。

## 1）`class FirstTile : ModTile`：物块的基类

> **[对应概念]**：`ModTile`、物块模型

`ModTile` 是 tModLoader 提供的物块基类。编写新物块遵循同一模式：

> 继承 `ModTile`，并在约定的方法入口中填入属性

因此 `class FirstTile : ModTile` 的核心含义是：

- 这份代码会被 tML 当成"一个物块"来加载
- 你可以在指定的方法里填物块属性

## 2）`SetStaticDefaults()`：设置物块属性的入口

> **[对应概念]**：tML 生命周期入口

`SetStaticDefaults()` 内的属性设置是物块的"静态属性"（所有这个物块都一样）：

```csharp
Main.tileSolid[Type] = true;  // 是否实心
Main.tileBlockLight[Type] = true;  // 是否挡光
Main.tileOre[Type] = true;  // 是否是矿物
```

## 3）`Item.createTile`：物品和物块的关联

> **[对应概念]**：物品、物块关联

`Item.createTile` 告诉游戏"这个物品放置后变成什么物块"：

```csharp
Item.createTile = ModContent.TileType<Tiles.FirstTile>();
```

如果不设置这个属性，物品就不能放置物块。

```quiz
type: choice
id: mod-basics-tile-createtile
question: |
  `Item.createTile` 的作用是什么？
options:
  - id: A
    text: |
      设置物块的属性
  - id: B
    text: |
      告诉游戏物品放置后变成什么物块
  - id: C
    text: |
      设置物品的伤害
answer: B
explain: |
  `Item.createTile` 是物品和物块之间的桥梁，告诉游戏放置这个物品应该生成什么物块。
```

## 4）`Item.consumable`：是否消耗品

> **[对应概念]**：物品消耗

`Item.consumable` 决定物品使用后是否消失：

- `true`：使用后消失（比如放置物块）
- `false`：使用后不消失（比如武器）

对于物块物品，通常设置为 `true`，因为放置后物品就变成物块了。
