---
title: tModLoader：ModProjectile 基础字段与 AI（行为逻辑）
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 26分钟
description: 解释 Projectile 的常用字段与 AI() 的调用时机，给出一个可控的“第一个自定义 AI”最小模板
topic: items
order: 40
min_c: 0
min_t: 0
---

# tModLoader：ModProjectile 基础字段与 AI（行为逻辑）

## 概览（可引用）

弹幕（Projectile）是一种“每帧更新的实体”。你通常需要做两件事：

1. 在 `SetDefaults()` 里定义它的**物理与碰撞属性**（大小、友好/敌对、伤害类别、寿命等）。
2. 在 `AI()` 里定义它的**每帧行为**（旋转、加速、重力、寻敌、粒子等）。

`AI()` 的语义可以理解为“每个 tick 的更新函数”：它会被频繁调用，所以尽量保持逻辑清晰、可控、可验证。

## 最小示例（可引用）

{if T == 0}
下面是一个“能飞、能打、可调”的最小 `ModProjectile`：

```csharp
using Microsoft.Xna.Framework;
using Terraria;
using Terraria.ModLoader;

public class FirstBolt : ModProjectile
{
    public override void SetDefaults()
    {
        Projectile.width = 10;
        Projectile.height = 10;

        Projectile.friendly = true;
        Projectile.hostile = false;
        Projectile.DamageType = DamageClass.Melee;

        Projectile.penetrate = 1;
        Projectile.timeLeft = 180;
        Projectile.tileCollide = true;
        Projectile.ignoreWater = true;
    }

    public override void AI()
    {
        if (Projectile.velocity.LengthSquared() > 0.001f)
            Projectile.rotation = Projectile.velocity.ToRotation();
    }
}
```

这段 `AI()` 的作用很单一：让弹幕朝着飞行方向旋转，方便你“肉眼确认它在按预期移动”。
{else if T == 1}
建议把 `AI()` 拆成“状态推进 + 表现层”：先做运动/碰撞，再做旋转/粒子；这样更容易定位问题。
{else}
进阶写法需要考虑联机同步（只在必要时写网络敏感的状态）、以及性能（避免每帧分配对象、避免过多 Dust/粒子生成）。
{end}

## 常见坑（可引用）

{if P_troubleshoot}
- 弹幕不动：检查生成时是否传入了 `velocity`，以及是否把速度归零了。
- 弹幕没伤害：确认 `Projectile.friendly = true`，并且 `DamageType` 与武器逻辑匹配。
- “旋转角度不对”：`ToRotation()` 返回弧度；不要再做多余的角度换算。
- 寿命太短/太长：调 `timeLeft` 并结合 `shootSpeed` 验证飞行距离。
{end}

## 进阶与惯用写法（可引用）

{if P_best_practice}
- 用 `Projectile.ai[]` 保存“可被网络同步的状态”，用 `Projectile.localAI[]` 保存“本地表现状态”（例如粒子计时器）。
- 先写“可预测”的 AI（线性/重力/固定加速度），再引入随机或寻敌；否则难以验证与排错。
{end}

## API 速查（可引用）

{if P_api_reference}
- `Projectile.friendly/hostile`：阵营与伤害归属
- `Projectile.DamageType`：伤害类别
- `Projectile.timeLeft`：剩余寿命（tick）
- `Projectile.penetrate`：可命中次数（`-1` 常表示无限，按版本/行为确认）
- `Projectile.ai[]` / `Projectile.localAI[]`：状态数组
- `ModProjectile.AI()`：每帧行为
{end}
