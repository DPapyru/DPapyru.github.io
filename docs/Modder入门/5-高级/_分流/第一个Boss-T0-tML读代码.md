---
title: 第一个Boss（T0 补课）：tModLoader 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 12分钟
description: 给第一次接触 tModLoader API 的读者，定位"第一个Boss"里该看懂的 API
topic: mod-basics
order: 9902
hide: true
---

这份补充内容面向 **T0（第一次接触 tModLoader API）**：用于定位本章代码中需要理解的核心 API 入口与职责。

## 1）`NPC.boss = true;`：Boss 标识

> **[对应概念]**：Boss 类型

`NPC.boss = true` 告诉游戏这是一个 Boss。这是 Boss 最重要的标识。

## 2）Boss 的 AI 结构

> **[对应概念]**：Boss AI、阶段转换

Boss 的 `AI()` 通常包含：
- 阶段检测和转换逻辑
- 不同阶段的不同行为
- 计时器用于控制行为节奏

```csharp
// 根据生命值切换阶段
if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)
{
    Phase = 2;  // 切换到第二阶段
    NPC.damage = 50;  // 增加伤害
}
```

## 3）`OnKill()`：Boss 死亡掉落

> **[对应概念]**：Boss 战利品

`OnKill()` 在 Boss 死亡时调用，用于生成掉落物：

```csharp
public override void OnKill()
{
    Item.NewItem(NPC.GetSource_Loot(), NPC.getRect(), ItemID.GoldCoin, 10);
}
```

## 4）召唤 Boss

> **[对应概念]**：Boss 召唤

使用 `NPC.SpawnOnPlayer()` 在玩家位置召唤 Boss：

```csharp
NPC.SpawnOnPlayer(player.whoAmI, ModContent.NPCType<SimpleBoss>());
```

```quiz
type: choice
id: mod-basics-boss-phase-transition
question: |
  Boss 阶段转换通常基于什么条件？
options:
  - id: A
    text: |
      时间
  - id: B
    text: |
      生命值百分比
  - id: C
    text: |
      玩家位置
answer: B
explain: |
  Boss 阶段转换通常基于生命值百分比，比如 50% 血量时切换到第二阶段。
```
