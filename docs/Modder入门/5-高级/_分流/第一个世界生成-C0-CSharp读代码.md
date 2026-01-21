---
title: 第一个世界生成（C0 补课）：C# 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 10分钟
description: 给从没接触过 C# 的读者，看懂"第一个世界生成"里出现的关键语法
topic: mod-basics
order: 10001
hide: true
---

这份补充内容面向 **C0（从没接触过 C#）**：覆盖阅读与修改本章代码所需的最小语法集合。

> **[C#概念进度]**
>
> 学完这一节，你将掌握：
> - 嵌套循环：`for` 循环的循环
> - 随机数：`genRand.NextBool()` / `genRand.Next()`
> - 什么是"网格遍历"

## 1）嵌套循环

> **[对应概念]**：嵌套循环、网格遍历

嵌套循环是循环里面套循环，用于遍历二维结构（如地图）：

```csharp
for (int i = 0; i < Main.maxTilesX / 16; i++)  // 遍历 X 轴
{
    for (int j = 0; j < Main.maxTilesY / 16; j++)  // 遍历 Y 轴
    {
        // 对每个区块进行处理
    }
}
```

## 2）随机数生成

> **[对应概念]**：随机数、概率

tModLoader 使用 `WorldGen.genRand` 生成随机数：

```csharp
WorldGen.genRand.NextBool(10);  // 10% 概率返回 true
WorldGen.genRand.Next(3, 8);  // 返回 3-7 之间的随机整数
```

```quiz
type: choice
id: mod-basics-nested-loop
question: |
  嵌套循环通常用于什么场景？
options:
  - id: A
    text: |
      只处理一个对象
  - id: B
    text: |
      处理一维列表
  - id: C
    text: |
      处理二维网格或地图
answer: C
explain: |
  嵌套循环常用于遍历二维结构，比如游戏地图的每个区块。
```
