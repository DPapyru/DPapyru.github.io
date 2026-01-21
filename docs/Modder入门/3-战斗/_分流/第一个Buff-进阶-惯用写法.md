---
title: 第一个Buff（进阶）：更贴近实战的写法
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: intermediate
time: 8分钟
description: 当你已经有 C# 基础且熟悉 tML API 时，这里给出更贴近实战的组织方式与注意点
topic: mod-basics
order: 9503
hide: true
---

这份补充内容面向 **C≥1 且 T≥1**：默认你已能阅读本章代码，因此这里聚焦更惯用、可维护性更好的组织方式与注意点。

## 1）Buff 的分类

- **正面 Buff**：增益效果（加速、回血等）
- **负面 Buff（Debuff）**：减益效果（中毒、燃烧等）

通过 `Main.debuff[Type] = true` 标记为负面效果。

## 2）状态管理

复杂的 Buff 可能需要多个状态变量。可以使用 `buffIndex` 来访问玩家身上的各种 Buff 相关信息。

## 3）性能考虑

Buff 的 `Update()` 每帧执行，要注意：
- 避免每帧进行复杂的计算
- 善用条件判断减少不必要的处理
