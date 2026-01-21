---
title: 第一个饰品（T0 补课）：tModLoader 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 12分钟
description: 给第一次接触 tModLoader API 的读者，定位"第一个饰品"里该看懂的 API
topic: mod-basics
order: 9802
hide: true
---

这份补充内容面向 **T0（第一次接触 tModLoader API）**：用于定位本章代码中需要理解的核心 API 入口与职责。

## 1）`Item.accessory = true;`：饰品标识

> **[对应概念]**：饰品类型

`Item.accessory = true` 告诉游戏这是一个饰品。这是饰品最重要的标识。

## 2）`UpdateAccessory()`：饰品效果钩子

> **[对应概念]**：饰品效果、玩家属性修改

`UpdateAccessory()` 在玩家装备饰品时每帧执行，是编写饰品效果的核心：

```csharp
public override void UpdateAccessory(Player player, bool hideVisual)
{
    player.moveSpeed += 0.1f;  // 增加移动速度
    player.maxRunSpeed += 1f;  // 增加最大奔跑速度
}
```

参数说明：
- `player`：装备这个饰品的玩家
- `hideVisual`：是否隐藏饰品外观

## 3）常用的玩家属性

> **[对应概念]**：玩家属性表

- 速度类：`moveSpeed`、`maxRunSpeed`、`jumpSpeed`
- 战斗类：`GetDamage()`、`GetCritChance()`
- 生存类：`statLifeMax2`、`statManaMax2`

```quiz
type: choice
id: mod-basics-accessory-identifier
question: |
  什么属性标识一个物品是饰品？
options:
  - id: A
    text: |
      `Item.damage`
  - id: B
    text: |
      `Item.accessory = true`
  - id: C
    text: |
      `Item.useStyle`
answer: B
explain: |
  `Item.accessory = true` 告诉游戏这是一个饰品，使其可以装备到饰品栏。
```

## 4）配方的编写

饰品的配方和武器一样，使用 `CreateRecipe()`、`AddIngredient()`、`AddTile()`、`Register()`。
