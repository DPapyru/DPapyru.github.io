---
title: 第一个Boss（进阶）：更贴近实战的写法
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: intermediate
time: 8分钟
description: 当你已经有 C# 基础且熟悉 tML API 时，这里给出更贴近实战的组织方式与注意点
topic: mod-basics
order: 9903
hide: true
---

这份补充内容面向 **C≥1 且 T≥1**：默认你已能阅读本章代码，因此这里聚焦更惯用、可维护性更好的组织方式与注意点。

## 1）多阶段设计

复杂的 Boss 通常有多个阶段。可以使用枚举或常量来管理阶段：

```csharp
private enum BossPhase { Idle, Attack, Special }
private BossPhase currentPhase = BossPhase.Idle;
```

## 2）AI 方法拆分

复杂的 AI 应该拆分成多个方法：

```csharp
private void UpdatePhase1() { /* ... */ }
private void UpdatePhase2() { /* ... */ }
private void UpdateAttackPattern() { /* ... */ }
```

## 3）性能考虑

Boss 战可能涉及大量计算，要注意：
- 避免每帧进行昂贵的搜索
- 使用计时器控制行为频率
- 考虑使用状态机管理复杂的 AI
