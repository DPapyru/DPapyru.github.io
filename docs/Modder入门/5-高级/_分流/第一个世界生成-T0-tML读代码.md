---
title: 第一个世界生成（T0 补课）：tModLoader 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 12分钟
description: 给第一次接触 tModLoader API 的读者，定位"第一个世界生成"里该看懂的 API
topic: mod-basics
order: 10002
hide: true
---

这份补充内容面向 **T0（第一次接触 tModLoader API）**：用于定位本章代码中需要理解的核心 API 入口与职责。

## 1）`ModWorld`：世界生成的基类

> **[对应概念]**：`ModWorld`、世界生成

`ModWorld` 是 tModLoader 提供的世界生成基类。

## 2）`ModifyWorldGenTasks()`：插入生成任务

> **[对应概念]**：世界生成任务

`ModifyWorldGenTasks()` 允许你在世界生成过程中插入自己的任务：

```csharp
public override void ModifyWorldGenTasks(List<GenPass> tasks)
{
    int shiniesIndex = tasks.FindIndex(genpass => genpass.Name.Equals("Shinies"));
    if (shiniesIndex != -1)
    {
        tasks.Insert(shiniesIndex + 1, new PassLegacy("My Ore Generation", GenerateMyOre));
    }
}
```

## 3）`Main.rockLayer`：岩石层深度

> **[对应概念]**：世界深度、地形

`Main.rockLayer` 表示岩石层（地下开始）的 Y 坐标，用于判断是否在地下。

```csharp
if (y < Main.rockLayer)  // 如果在地表以上
{
    continue;  // 跳过，不生成
}
```

## 4）`WorldGen.PlaceTile()`：放置物块

> **[对应概念]**：物块放置

`WorldGen.PlaceTile()` 用于在指定位置放置物块：

```csharp
WorldGen.PlaceTile(oreX + offsetX, oreY + offsetY, ModContent.TileType<Tiles.MyOre>());
```

```quiz
type: choice
id: mod-basics-worldgen-insert
question: |
  `tasks.Insert(shiniesIndex + 1, ...)` 的作用是什么？
options:
  - id: A
    text: |
      删除原版矿石生成任务
  - id: B
    text: |
      在原版矿石生成任务之后插入新任务
  - id: C
    text: |
      在原版矿石生成任务之前插入新任务
answer: B
explain: |
  `shiniesIndex + 1` 表示在找到的任务索引之后插入，确保我们的矿物在原版之后生成。
```
