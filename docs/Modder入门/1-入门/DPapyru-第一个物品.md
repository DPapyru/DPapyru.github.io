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

本节要做的事很简单：添加一个**能出现、能堆叠、能在背包里显示**的物品。

你需要记住两句话就够用：

- `ModItem` 是物品的蓝图。
- `SetDefaults()` 是出厂参数表，你改的是默认值。

类比一下更好记：你现在不是在改手里那一件成品，而是在改生产线的默认配置。验证改动时要用新生成的物品实例。

## 先决条件

- 你已经有一个能正常编译并加载的 Mod 项目。

## 扩展阅读

{if C == 0}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md][C#：最小示例]}
{end}

{if T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md][tML：SetDefaults 最小示例]}
{end}

## 实例：创建第一个物品

新建文件 `Items/FirstMaterial.cs`，写入下面的代码：

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

把 `YourMod` 换成你自己的命名空间。如果你暂时不想处理命名空间，也可以先去掉 `namespace ...` 这一层，保证能编译通过后再整理。

## 代码说明

- `FirstMaterial : ModItem` 表示这是一个物品类型。
- `SetDefaults()` 负责填写默认属性。
- `Item.width/height` 决定物品贴图碰撞盒大小。
- `Item.maxStack` 决定堆叠上限。

## 实例：在游戏里验证

验证流程按这个顺序来：

1. 重新加载 Mod。
2. 生成一个新的 `FirstMaterial`。
3. 检查三件事：能出现、能堆叠、背包显示正常。

如果你修改了 `SetDefaults()`，务必重新生成一个新物品实例再看效果。

## 常见问题

- 热重载后没变化，多半是你还在看旧实例，重新生成一个新物品。
- 类名重复或命名空间冲突，会让加载行为变得不可预测，先保证类名唯一。
- 报类型找不到，先检查 `using Terraria;` 与 `using Terraria.ModLoader;` 是否存在。

## 小结

- 先做最小可用的物品，再逐步加字段。
- 改默认值后，用新生成的实例验证。

## 下一步

下一步建议把“材料”升级成“可用的物品”：

- 如果你想做武器：新增 `Item.damage`、`Item.useTime` 等属性，并理解 `useTime`/`useAnimation` 的关系。
- 如果你想做消耗品：给它一个使用效果，并确认消耗逻辑与堆叠逻辑一致。

推荐继续阅读：

- [第一把武器：最小可用的近战武器](DPapyru-第一把武器.md)
