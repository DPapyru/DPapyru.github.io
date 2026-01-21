---
title: 第一个NPC（T0 补课）：tModLoader 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 12分钟
description: 给第一次接触 tModLoader API 的读者，定位"第一个NPC"里该看懂的 API
topic: mod-basics
order: 9702
hide: true
---

这份补充内容面向 **T0（第一次接触 tModLoader API）**：用于定位本章代码中需要理解的核心 API 入口与职责。

## 1）`class FirstNPC : ModNPC`：NPC 的基类

> **[对应概念]**：`ModNPC`、NPC 模型

`ModNPC` 是 tModLoader 提供的 NPC 基类。

## 2）`NPC.townNPC = true`：城镇 NPC 标识

> **[对应概念]**：城镇 NPC

`NPC.townNPC = true` 告诉游戏这是一个城镇 NPC，可以住进房子。

## 3）`CanTownNPCSpawn()`：生成条件

> **[对应概念]**：NPC 生成逻辑

`CanTownNPCSpawn()` 判断 NPC 能否生成：

```csharp
public override bool CanTownNPCSpawn(int numTownNPCs, int money)
{
    return money >= 100000;  // 玩家有 10 金币时生成
}
```

## 4）`SetupShop()`：商店设置

> **[对应概念]**：NPC 商店

`SetupShop()` 设置 NPC 商店里卖的东西：

```csharp
shop.item[nextSlot].SetDefaults(ItemID.Wood);
nextSlot++;
```

## 5）对话系统

> **[对应概念]**：NPC 交互

- `GetChat()`：返回 NPC 的对话内容
- `SetChatButtons()`：设置对话按钮
- `OnChatButtonClicked()`：处理按钮点击

```quiz
type: choice
id: mod-basics-townnpc-spawn
question: |
  `NPC.townNPC = true;` 有什么作用？
options:
  - id: A
    text: |
      这个 NPC 会攻击玩家
  - id: B
    text: |
      这个 NPC 是城镇 NPC，可以住进房子
  - id: C
    text: |
      这个 NPC 是 Boss
answer: B
explain: |
  `townNPC = true` 标记 NPC 为城镇 NPC，赋予其住房子、商店等功能。
```
