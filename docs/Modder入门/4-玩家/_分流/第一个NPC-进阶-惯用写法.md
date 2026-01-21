---
title: 第一个NPC（进阶）：更贴近实战的写法
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: intermediate
time: 8分钟
description: 当你已经有 C# 基础且熟悉 tML API 时，这里给出更贴近实战的组织方式与注意点
topic: mod-basics
order: 9703
hide: true
---

这份补充内容面向 **C≥1 且 T≥1**：默认你已能阅读本章代码，因此这里聚焦更惯用、可维护性更好的组织方式与注意点。

## 1）NPC 分类

- **城镇 NPC**：住房子、有商店、有对话
- **敌对 NPC**：攻击玩家、有 AI
- **Boss**：特殊敌对 NPC，有阶段和特殊行为

## 2）商店管理

复杂的商店可以使用条件判断来动态生成：

```csharp
if (condition)
{
    shop.item[nextSlot].SetDefaults(ItemID.Xxx);
    nextSlot++;
}
```

## 3）AI 组织

复杂的 NPC AI 应该拆分成多个方法，保持 `AI()` 方法的简洁。
