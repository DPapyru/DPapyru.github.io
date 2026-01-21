---
title: tModLoader：ModItem 生命周期与 SetDefaults
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 20分钟
description: 解释 ModItem 常见生命周期方法的作用与调用时机，重点是 SetDefaults 的意义与常见误区
topic: mod-basics
order: 10
min_c: 0
min_t: 0
---

# tModLoader：ModItem 生命周期与 SetDefaults

## 概览（可引用）

对初学者来说，`ModItem` 的学习关键不在“记住所有方法”，而在于理解：**tModLoader 会在特定阶段调用你的方法**，你只需要把“该阶段应该写的内容”放进去。

最常用的入口之一是：

- `SetDefaults()`：设置物品的默认属性（伤害、使用时间、大小、稀有度等）

## 最小示例（可引用）

{if T == 0}
先抓“它在哪里被调用”：

```csharp
public override void SetDefaults()
{
    Item.damage = 10;
    Item.useTime = 20;
    Item.useAnimation = 20;
}
```

你可以把 `SetDefaults()` 理解成“出厂设置”：物品被创建/初始化时，系统会读取这些默认值。
{else if T == 1}
`SetDefaults()` 本质上是把 `Item` 的字段填满；你需要知道哪些字段是互相依赖的（例如 `useTime`/`useAnimation`）。
{else}
`SetDefaults()` 适合放静态默认值；对动态变化（根据玩家状态、世界状态变动）更常用 `UpdateInventory` / `HoldItem` / `ModifyWeaponDamage` 等链路（按需求选择）。
{end}

## 常见坑（可引用）

{if P_troubleshoot}
- 修改 `SetDefaults()` 后“热重载没变化”：默认值通常在对象生成时读取；你需要重新生成物品实例。
- 只改 `useTime` 不改 `useAnimation`：经常导致手感/动画不一致，甚至表现怪异。
- 把“动态逻辑”写进 `SetDefaults()`：结果往往是“看似能跑，但到处都是例外”。
{end}

## 进阶与惯用写法（可引用）

{if P_best_practice}
- 区分“默认值”和“运行时修正”：默认值放 `SetDefaults()`，修正放对应生命周期链路。
- 优先用 tML 提供的辅助方法设置常见类型（如果版本提供），减少遗漏字段。
{end}

## API 速查（可引用）

{if P_api_reference}
- `SetDefaults()`：默认字段初始化
- `AddRecipes()`：配方注册
- `SetStaticDefaults()`：静态显示类内容（名称、研究数量等，按版本）
{end}

