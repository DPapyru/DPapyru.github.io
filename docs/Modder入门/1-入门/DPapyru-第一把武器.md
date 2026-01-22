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

在本文中，你将创建一把**能正常使用、能造成伤害、手感可调**的近战武器。重点不是把字段背下来，而是建立一条可重复的工作流：

1. 用最小字段让它“能用”；
2. 用少量关键字段让它“好用”；
3. 用“可验证”的方式调参并确认效果。

## 先决条件

- 你已经能把一个 `ModItem` 加进项目并在游戏内验证（如果没有，请先看：[第一个物品：做一个最简单的“材料”](DPapyru-第一个物品.md)）。

## 前置（按需补课）

{if C == 0}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#最小示例（可引用）][C#：先能读懂模板]}
{end}

{if T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-武器物品的关键字段.md#概览（可引用）][tML：武器关键字段速览]}
{end}

{if P_api_reference}
{[文章使用内容索引/tModLoaderAPI/DPapyru-武器物品的关键字段.md#API 速查（可引用）][tML：武器字段速查]}
{end}

## Step 1：创建武器类

新建文件（例如 `Items/FirstSword.cs`），并创建一个继承自 `ModItem` 的类：

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

{if P_step}
检查点：

- 能编译通过（命名空间/类名无冲突）。
- 类名与文件名一致（不是硬性要求，但更利于维护与检索）。
{end}

## Step 2：设置最小默认值（让它能用）

把下面的配置填进 `SetDefaults()`：

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

{if P_theory}
你可以把这组字段分成三层：

- “这是什么”：`DamageType`
- “能造成什么”：`damage/knockBack`
- “怎么用起来”：`useStyle/useTime/useAnimation/UseSound/autoReuse`
{end}

{if P_best_practice}
建议先固定一个基准，再逐项调参；例如先锁定 `useTime/useAnimation`，只调 `damage/knockBack`，最后再调手感相关字段，避免“同时变化太多”导致难以判断原因。
{end}

## Step 3：验证与调参（让它好用）

验证思路与“第一个物品”一致，但你需要额外观察“手感”：

1. 重新加载 Mod（或重新编译并加载）。
2. 生成一把 `FirstSword`。
3. 关注三件事：
   - 伤害是否生效；
   - 使用节奏是否符合预期（`useTime/useAnimation`）；
   - 是否能按住持续挥动（`autoReuse`）。

{if P_step}
调参建议（一次只改一个变量）：

- 觉得太慢：先把 `useTime/useAnimation` 从 `20` 调到 `18`、`16`；
- 觉得击退太弱：把 `knockBack` 从 `4f` 调到 `5f`、`6f`；
- 觉得伤害太低/太高：改 `damage`，并用相同环境对比验证。
{end}

## 本章要点（可引用）

- 先做“能用”的最小武器，再逐步调整“手感字段”。
- `DamageType` 决定加成与表现；`useTime/useAnimation` 决定节奏；`useStyle` 决定动作。
- 每次调参只改一个变量，并用可重复的方式验证。

## 常见坑（可引用）

{if P_troubleshoot}
- 忘了设置 `Item.DamageType`：导致加成/表现不符合预期。
- `useTime` 与 `useAnimation` 不一致：手感与动画不一致，难以调参。
- 修改后没变化：你验证的是旧实例；重新生成一个新武器再对比。
{end}

## 下一步（可引用）

下一章将把这把近战武器升级为“能发射弹幕”的武器，并引入 `Shoot(...)`：

- [武器的 Shoot 函数与第一个弹幕](DPapyru-武器的Shoot函数与第一个弹幕.md)
