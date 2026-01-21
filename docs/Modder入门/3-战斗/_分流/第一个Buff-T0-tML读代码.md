---
title: 第一个Buff（T0 补课）：tModLoader 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 12分钟
description: 给第一次接触 tModLoader API 的读者，定位"第一个Buff"里该看懂的 API
topic: mod-basics
order: 9502
hide: true
---

这份补充内容面向 **T0（第一次接触 tModLoader API）**：用于定位本章代码中需要理解的核心 API 入口与职责。

## 1）`class PoisonDebuff : ModBuff`：Buff 的基类

> **[对应概念]**：`ModBuff`、Buff 模型

`ModBuff` 是 tModLoader 提供的 Buff 基类。编写新 Buff 遵循同一模式：

> 继承 `ModBuff`，并在约定的方法中填入属性与效果

## 2）`SetStaticDefaults()`：Buff 的静态属性

> **[对应概念]**：Buff 属性表

`SetStaticDefaults()` 设置 Buff 的静态属性：

```csharp
Main.buffName[Type] = "中毒";  // Buff 名字
Main.buffTip[Type] = "持续受到伤害";  // Buff 描述
Main.debuff[Type] = true;  // 是否负面效果
```

## 3）`Update()`：Buff 的效果逻辑

> **[对应概念]**：Buff 效果钩子

`Update()` 每帧都会执行，是编写 Buff 效果的核心：

```csharp
public override void Update(Player player, ref int buffIndex)
{
    // 每秒造成 5 点伤害
    if (player.buffTime[buffIndex] % 60 == 0)
    {
        player.statLife -= 5;
    }
}
```

## 4）`Item.buffType` 和 `Item.buffTime`：物品给予的 Buff

> **[对应概念]**：物品与 Buff 的关联

物品通过 `buffType` 指定给予的 Buff，通过 `buffTime` 指定持续时间：

```csharp
Item.buffType = ModContent.BuffType<PoisonDebuff>();  // Buff 类型
Item.buffTime = 300;  // 持续时间（300 帧 ≈ 5 秒）
```

```quiz
type: choice
id: mod-basics-debuff-attribute
question: |
  `Main.debuff[Type] = true;` 是什么意思？
options:
  - id: A
    text: |
      这个 Buff 是正面效果
  - id: B
    text: |
      这个 Buff 是负面效果（debuff）
  - id: C
    text: |
      这个 Buff 不会消失
answer: B
explain: |
  `debuff` 表示负面效果，会在 Buff 图标上显示为暗色。
```
