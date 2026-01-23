---
title: 弹幕的 AI：让它按你的规则运动
author: 小天使
date: 2026-01-21
last_updated: 2026-01-23
difficulty: beginner
time: 35分钟
description: 在 ModProjectile.AI() 中实现最小且可验证的行为逻辑，并学习重力、追踪、回旋镖、曲线运动等常见运动模式
topic: items
order: 40
prev_chapter: DPapyru-武器的Shoot函数与第一个弹幕.md
next_chapter: DPapyru-第一个饰品.md
min_c: 0
min_t: 0
---

# 弹幕的 AI：让它按你的规则运动

本节目标：给你的 `FirstBolt` 写一个**最小可验证**的 `AI()`，确认逻辑确实在跑；然后再用同一套思路写出几种常见运动模式。

`AI()` 可以理解成弹幕的“每帧更新回调”。新手最容易踩的坑不是“不会写”，而是“写了但没生效”。所以我们先把验证做扎实。

## 先决条件

- 你已经让武器能发射自定义弹幕：[武器的 Shoot 函数与第一个弹幕](DPapyru-武器的Shoot函数与第一个弹幕.md)。

## 扩展阅读

{if C == 0}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#最小示例][C#：最小示例]}
{end}

{if T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModProjectile-基础字段与AI.md#最小示例][tML：弹幕最小模板]}
{[文章使用内容索引/数学/DPapyru-弹幕AI数学与运动模式.md#概览][数学：向量与追踪基础]}
{end}

## 第一步：写一个“肉眼可见”的最小 AI

在 `Projectiles/FirstBolt.cs` 里添加 `AI()`：

```csharp
using Microsoft.Xna.Framework;

public override void AI()
{
    // 速度不为 0 才旋转，避免 NaN
    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation = Projectile.velocity.ToRotation();

    // 简单重力：让轨迹下坠（肉眼可见，便于验证）
    Projectile.velocity.Y += 0.15f;
}
```

## 第二步：加入计时器（分段逻辑）

计时器最常用的存放位置就是 `Projectile.ai[0]`：

```csharp
public override void AI()
{
    Projectile.ai[0] += 1f;

    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation = Projectile.velocity.ToRotation();

    // 前 20 tick：轻微加速
    if (Projectile.ai[0] < 20f)
        Projectile.velocity *= 1.02f;
    else
        Projectile.velocity.Y += 0.15f;
}
```

验证时只看三件事：

1. 弹幕会旋转，方向跟随速度。
2. 轨迹会下坠，说明重力逻辑生效。
3. 前 20 tick 和之后的行为不同，说明计时器与分段生效。

{if P_troubleshoot}
如果你看不到变化：

- 确认你写的是 `ModProjectile` 的 `AI()`，不是写到了别的类里。
- 确认你发射的是你的自定义弹幕（不是原版弹幕）。
- 如果你设置过 `aiStyle`/`AIType`，先确保它不会覆盖你的速度逻辑（初学建议保持自定义 AI）。
{end}

---

# 常见运动模式（思路 + 最小可用代码）

下面四个模式都遵循同一条规则：先写“能验证的最小行为”，再叠加表现层（Dust/光照/拖尾）。

## 冲刺（Dash）

```animts
anims/projectile-patterns/2-dash.ts
```

冲刺常用结构：**蓄力（减速）→ 冲刺（瞬间设定高速度）→ 收尾（减速/结束）**。  
做这种“分阶段”行为时，`ai[0]` 计时器 + `if/else` 分段基本够用。

## 追踪 NPC（Seek）

```animts
anims/projectile-patterns/3-seek.ts
```

追踪的关键点不是“每帧直接指向目标”，而是“**平滑转向**”，这样轨迹更自然。

最小实现：每隔一段时间选一次目标（降低开销），然后用 `Lerp` 慢慢把速度拉向目标方向。

```csharp
using Microsoft.Xna.Framework;
using Terraria;

public override void AI()
{
    Projectile.ai[0] += 1f;

    // 每 10 tick 更新一次目标
    if (Projectile.ai[0] % 10f == 0f)
        Projectile.ai[1] = FindTargetIndex(600f) + 1; // 0 表示无目标

    int targetIndex = (int)Projectile.ai[1] - 1;
    if (targetIndex >= 0)
    {
        NPC target = Main.npc[targetIndex];
        if (target.active && !target.friendly && !target.dontTakeDamage)
        {
            Vector2 desired = Projectile.DirectionTo(target.Center) * 12f;
            Projectile.velocity = Vector2.Lerp(Projectile.velocity, desired, 0.08f);
        }
    }

    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation = Projectile.velocity.ToRotation();
}

private int FindTargetIndex(float maxDistance)
{
    int result = -1;
    float best = maxDistance * maxDistance;

    for (int i = 0; i < Main.maxNPCs; i++)
    {
        NPC npc = Main.npc[i];
        if (!npc.active || npc.friendly || npc.dontTakeDamage) continue;

        float d2 = Vector2.DistanceSquared(Projectile.Center, npc.Center);
        if (d2 < best)
        {
            best = d2;
            result = i;
        }
    }

    return result;
}
```

{if P_best_practice}
`ai[]` 的意义建议写成“约定”：比如这个例子里 `ai[0]` 只当计时器、`ai[1]` 只当目标索引（+1），后面扩展状态机时就不容易把自己绕晕。
{end}

## 回旋镖（Boomerang）

```animts
anims/projectile-patterns/4-boomerang.ts
```

回旋镖通常是一个两状态状态机：**飞出** 与 **折返**。最小实现思路：

- 飞出阶段：保持初速度，直到“飞够远”或“飞够久”。
- 折返阶段：把速度平滑拉向玩家方向；接近玩家时 `Kill()`。

```csharp
using Microsoft.Xna.Framework;
using Terraria;

public override void AI()
{
    const float maxDistance = 360f;
    const float returnSpeed = 16f;
    const float steer = 0.18f;

    Player owner = Main.player[Projectile.owner];

    // ai[0]: 0=飞出, 1=折返
    if (Projectile.ai[0] == 0f)
    {
        Projectile.ai[1] += 1f; // 飞行计时
        if (Projectile.ai[1] > 35f || Vector2.Distance(Projectile.Center, owner.Center) > maxDistance)
            Projectile.ai[0] = 1f;
    }
    else
    {
        Vector2 desired = Projectile.DirectionTo(owner.Center) * returnSpeed;
        Projectile.velocity = Vector2.Lerp(Projectile.velocity, desired, steer);

        if (Vector2.Distance(Projectile.Center, owner.Center) < 30f)
            Projectile.Kill();
    }

    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation = Projectile.velocity.ToRotation();
}
```

## 曲线运动（Curve）

```animts
anims/projectile-patterns/5-curve.ts
```

曲线运动的核心就是：**每帧旋转速度向量**（加“角速度”）。

```csharp
using Microsoft.Xna.Framework;

public override void AI()
{
    float turnRate = 0.06f;
    float speed = 10f;

    Projectile.velocity = Projectile.velocity.RotatedBy(turnRate);
    Projectile.velocity = Projectile.velocity.SafeNormalize(Vector2.UnitX) * speed;

    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation = Projectile.velocity.ToRotation();
}
```

---

## 小结

- 先写“可预测、可验证”的最小 AI（旋转/重力/计时器），再堆复杂逻辑。
- `Projectile.ai[]` 用来存计时器/状态很常见；先把“每个槽位的意义”约定清楚。
- 追踪与回旋镖这类行为，本质都是“目标速度”+“平滑靠近”（`Lerp`）。
