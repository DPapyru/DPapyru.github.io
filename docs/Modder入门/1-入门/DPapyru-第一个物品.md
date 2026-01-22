---
title: 第一个物品：做一个最简单的“材料”
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 15分钟
description: 从零开始添加一个最简单的 ModItem，并理解 SetDefaults 的“出厂设置”含义
topic: items
order: 10
next_chapter: DPapyru-第一把武器.md
min_c: 0
min_t: 0
---

# 第一个物品：做一个最简单的“材料”

目标：添加一个**能正常出现、可堆叠、可在背包里显示**的物品，并通过它建立两件事：

1. `ModItem` 是“物品蓝图”，`SetDefaults()` 是“出厂设置”。
2. 你改的是“默认值”，所以验证时要学会“重新生成一个新物品”。

## 前置（按需补课）

{if C == 0}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#最小示例（可引用）][C#：先能读懂模板]}
{end}

{if T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md#最小示例（可引用）][tML：SetDefaults 最小示例]}
{end}

## Step 1：创建一个物品类

在 Mod 项目的源代码里新建一个 C# 文件（例如 `Items/FirstMaterial.cs`），写一个最小的 `ModItem`：

```csharp
using Terraria;
using Terraria.ModLoader;

namespace YourMod.Items
{
    public class FirstMaterial : ModItem
    {
        public override void SetDefaults()
        {
            Item.width = 20;
            Item.height = 20;
            Item.maxStack = 999;
            Item.value = 0;
            Item.rare = 0;
        }
    }
}
```

注意：把 `YourMod` 替换为你项目实际使用的命名空间；如果你不确定命名空间规则，也可以先去掉 `namespace ... { ... }` 这一层，保证代码能编译后再整理结构。

{if P_step}
逐行解释（只解释“你现在必须知道的部分”）：

- `public class FirstMaterial : ModItem`：声明“这是一个物品”。
- `public override void SetDefaults()`：把这个物品的默认属性填好；你可以把它当作“出厂设置单”。
- `Item.* = ...`：给当前物品对象的字段赋值。
{end}

{if P_api_reference}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#API 速查（可引用）][C#：语法速查]}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md#API 速查（可引用）][tML：ModItem 入口速查]}
{end}

## Step 2：让物品“可验证”

不同 tModLoader 版本/模板里，把物品拿到手的方法不完全一致，但验证思路一致：

1. 重新加载 Mod（或重新编译并加载）。
2. 在游戏内用“生成物品/拿物品”的方式得到一个 `FirstMaterial`。
3. 确认：物品能出现、堆叠上限为 999、在背包里显示正常。

把这个过程想成“验收出厂设置”：你拿到的是一个“新出厂的实例”，才能看到 `SetDefaults()` 改动的效果。

## 本章要点（可引用）

- `ModItem` 是物品的“蓝图”；`SetDefaults()` 是把默认值填好。
- 默认值通常在物品实例创建时读取；修改后要用“新生成的物品实例”验证。
- 第一个物品优先做成“材料”：属性少、验证快、出错面更窄。

## 常见坑（可引用）

{if P_troubleshoot}
- 热重载后看不到变化：你看的可能是旧实例；重新生成一个新物品再对比。
- 类名/命名空间冲突：同名类会让加载行为变得不可预测，确保类名唯一。
- `using` 缺失导致类型找不到：先补齐 `Terraria` / `Terraria.ModLoader` 的引用，再看其它错误。
{end}

## 下一步（可引用）

下一步建议把“材料”升级成“可用的物品”：

- 如果你想做武器：新增 `Item.damage`、`Item.useTime` 等属性，并理解 `useTime`/`useAnimation` 的关系。
- 如果你想做消耗品：给它一个使用效果，并确认消耗逻辑与堆叠逻辑一致。

推荐继续阅读：

- [第一把武器：最小可用的近战武器](DPapyru-第一把武器.md)
