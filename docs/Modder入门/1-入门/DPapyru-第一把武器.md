---
title: 第一把武器：最小可用的近战武器
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 20分钟
description: 创建一个可用的近战武器，并理解 damage、DamageType 与 useTime/useAnimation 等字段如何决定“手感”
topic: items
order: 20
prev_chapter: DPapyru-第一个物品.md
next_chapter: DPapyru-武器的Shoot函数与第一个弹幕.md
min_c: 0
min_t: 0
---

# 第一把武器：最小可用的近战武器

本节目标：做一把**能挥、能打、能调手感**的近战武器。

学习顺序按这个来：先让它能用，再让它好用。

## 先决条件

- 你已经能把一个 `ModItem` 加进项目并在游戏内验证。
- 如果还没做到，先看 [第一个物品：做一个最简单的“材料”](DPapyru-第一个物品.md)。

## 扩展阅读

{if C == 0}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#最小示例][C#：最小示例]}
{end}

{if T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-武器物品的关键字段.md#概览][tML：武器关键字段速览]}
{end}

{if P_api_reference}
{[文章使用内容索引/tModLoaderAPI/DPapyru-武器物品的关键字段.md#API 速查][tML：武器字段速查]}
{end}

## 实例：创建武器类

新建文件 `Items/FirstSword.cs`，创建一个继承自 `ModItem` 的类：

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace YourMod.Items
{
    public class FirstSword : ModItem
    {
        public override void SetDefaults()
        {
        }
    }
}
```

## 实例：设置最小默认值

把下面的代码填进 `SetDefaults()`：

```csharp
public override void SetDefaults()
{
    Item.width = 40;
    Item.height = 40;

    Item.damage = 12;
    Item.DamageType = DamageClass.Melee;
    Item.knockBack = 4f;

    Item.useStyle = ItemUseStyleID.Swing;
    Item.useTime = 20;
    Item.useAnimation = 20;

    Item.UseSound = SoundID.Item1;
    Item.autoReuse = true;
}
```

## 字段说明

可以用三层理解这组字段：

- 类型：`DamageType`
- 数值：`damage`、`knockBack`
- 手感：`useStyle`、`useTime`、`useAnimation`、`UseSound`、`autoReuse`

简单类比一下：`damage/knockBack` 决定你挥出去有多有劲，`useTime/useAnimation` 决定你挥起来有多有节奏。

{if P_best_practice}
建议先固定一个基准，再逐项调参；例如先锁定 `useTime/useAnimation`，只调 `damage/knockBack`，最后再调手感相关字段，避免“同时变化太多”导致难以判断原因。
{end}

## 实例：在游戏里验证

验证流程按这个顺序来：

1. 重新加载 Mod。需要时重新编译并加载。
2. 生成一把 `FirstSword`。
3. 检查三件事：
   - 伤害是否生效；
   - 使用节奏是否符合预期，主要看 `useTime/useAnimation`；
   - 是否能按住持续挥动，主要看 `autoReuse`。

## 调参建议

一次只改一个变量，然后再验证：

- 觉得太慢：先把 `useTime/useAnimation` 从 `20` 调到 `18`、`16`；
- 觉得击退太弱：把 `knockBack` 从 `4f` 调到 `5f`、`6f`；
- 觉得伤害太低/太高：改 `damage`，并用相同环境对比验证。

把它当成混音台会更容易坚持这个习惯：一次只动一个旋钮，否则你很难判断到底是哪一项让手感变了。

## 常见问题

{if P_troubleshoot}
- 忘了设置 `Item.DamageType`：导致加成/表现不符合预期。
- `useTime` 与 `useAnimation` 不一致：手感与动画不一致，难以调参。
- 修改后没变化：你验证的是旧实例；重新生成一个新武器再对比。
{end}

## 小结

- 先写最小可用的武器，再调手感字段。
- `DamageType` 决定加成与表现，`useTime/useAnimation` 决定节奏，`useStyle` 决定动作。
- 调参时一次只改一个变量。

## 下一步

下一章将把这把近战武器升级为“能发射弹幕”的武器，并引入 `Shoot(...)`：

- [武器的 Shoot 函数与第一个弹幕](DPapyru-武器的Shoot函数与第一个弹幕.md)
