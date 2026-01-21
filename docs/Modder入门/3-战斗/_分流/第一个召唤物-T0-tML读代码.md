---
title: 第一个召唤物（T0 补课）：tModLoader 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 12分钟
description: 给第一次接触 tModLoader API 的读者，定位"第一个召唤物"里该看懂的 API
topic: mod-basics
order: 9602
hide: true
---

这份补充内容面向 **T0（第一次接触 tModLoader API）**：用于定位本章代码中需要理解的核心 API 入口与职责。

## 1）`Projectile.minion = true;`：召唤物标识

> **[对应概念]**：召唤物类型

`Projectile.minion = true` 告诉游戏这是一个召唤物。这是召唤物最重要的标识。

## 2）召唤物的生命周期

召唤物通过以下流程工作：
1. 玩家获得 Buff
2. Buff 的 `Update()` 检查是否已有召唤物
3. 如果没有，生成新的召唤物

```csharp
// Buff 的 Update 中
if (player.ownedProjectileCounts[ModContent.ProjectileType<FlyingMinion>()] == 0)
{
    Projectile.NewProjectile(...);
}
```

## 3）`AI()`：召唤物的行为

> **[对应概念]**：召唤物 AI

召唤物的 `AI()` 通常包含：
- 跟随玩家逻辑
- 寻找敌人逻辑
- 攻击逻辑

```quiz
type: choice
id: mod-basics-minion-owner
question: |
  `player.HasBuff(ModContent.BuffType<FlyingMinionBuff>())` 的作用是什么？
options:
  - id: A
    text: |
      检查玩家是否有某个 Buff
  - id: B
    text: |
      给玩家添加 Buff
  - id: C
    text: |
      删除玩家的 Buff
answer: A
explain: |
  `HasBuff()` 用来检查玩家是否拥有某个 Buff，用于判断召唤物是否应该存在。
```

## 4）`StrikeNPC()`：造成伤害

`targetNPC.StrikeNPC(damage, knockback, direction)` 用来对 NPC 造成伤害。
