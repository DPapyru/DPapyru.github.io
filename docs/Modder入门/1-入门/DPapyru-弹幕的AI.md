---
title: 弹幕的 AI：让它按你的规则运动
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 28分钟
description: 在 ModProjectile.AI() 中实现最小且可验证的行为逻辑：旋转、重力、加速与简单状态机
topic: items
order: 40
prev_chapter: DPapyru-武器的Shoot函数与第一个弹幕.md
min_c: 0
min_t: 0
---

# 弹幕的 AI：让它按你的规则运动

本节目标：给 `FirstBolt` 写一个最小的 `AI()`，让它出现明确可见的行为变化。

`AI()` 可以理解成弹幕的心跳回调，每一帧都会被调用一次。验证阶段先做少量、稳定、肉眼可见的变化。

## 先决条件

- 你已经让武器能发射自定义弹幕：[武器的 Shoot 函数与第一个弹幕](DPapyru-武器的Shoot函数与第一个弹幕.md)。

## 扩展阅读

{if T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModProjectile-基础字段与AI.md#最小示例][tML：弹幕最小模板]}
{end}

## 目标：可验证的行为清单

为了让排错成本最低，本章的 AI 只做三件事：

1. 让弹幕朝飞行方向旋转，便于肉眼确认方向。
2. 增加轻微重力，便于确认每帧更新确实生效。
3. 用一个计时器把“前 20 tick”与“之后”区分开，引入最小状态机。

## 实例：实现最小 AI

在 `Projectiles/FirstBolt.cs` 添加 `AI()`：

```csharp
using Microsoft.Xna.Framework;

public override void AI()
{
    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation = Projectile.velocity.ToRotation();

    Projectile.velocity.Y += 0.15f;
}
```

{if P_theory}
`AI()` 会被频繁调用。这里用两个稳定且易观察的变化来确认：你写的逻辑确实在生效，并且不会被其它系统覆盖。
{end}

{if P_troubleshoot}
如果你看不到变化：

- 确认 `AI()` 方法写在你的 `ModProjectile` 类里。
- 确认弹幕不是 1 tick 就消失，检查 `timeLeft`、命中次数、是否立刻碰到地面或墙。
- 确认你发射的是自定义弹幕，而不是原版弹幕。
{end}

## 实例：加入计时器与分段逻辑

在 `AI()` 里加入计时器逻辑：

```csharp
public override void AI()
{
    Projectile.ai[0] += 1f;

    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation = Projectile.velocity.ToRotation();

    if (Projectile.ai[0] <= 20f)
        Projectile.velocity *= 1.02f;
    else
        Projectile.velocity.Y += 0.15f;
}
```

行为解释：

- 前 20 tick：轻微加速，让变化更容易观察。
- 之后：受重力影响，让轨迹出现明确的弧线。

把 `Projectile.ai[0]` 当作绑在弹幕身上的秒表。先用它计时与分段，后续再考虑更复杂的状态。

{if P_best_practice}
建议约定 `ai[0]` 的意义并保持单一职责，这里只用作计时器。当弹幕行为变复杂时，清晰的约定比花哨的写法更能减少维护成本。
{end}

{if P_performance}
避免在 `AI()` 里做高频分配与重运算，例如每帧创建大量对象、生成过多 Dust 粒子。先保证行为正确，再逐步加表现层。
{end}

## 实例：在游戏里验证

验证时只看三件事：

1. 弹幕会旋转，方向跟随速度。
2. 轨迹会下坠，说明重力逻辑生效。
3. 前 20 tick 的变化与之后不同，说明计时器与分段生效。

## 小结

- `AI()` 是每帧更新入口：先写“可预测、可验证”的行为，再叠加复杂逻辑。
- 用 `Projectile.ai[]` 保存状态很常见；先从“计时器”这种最小状态机开始。
- 让变化肉眼可见有助于快速验证与排错，旋转、重力、加速都是好工具。

## 下一步

你已经具备了“从物品到弹幕再到 AI”这一条完整链路。接下来建议按偏好选择扩展方向：

{if P_best_practice}
- 把数值提取成常量或配置项，让调参更可控。
{end}

{if P_visual}
- 增加简单表现层，例如粒子、光照、拖尾，但保持“表现层不影响行为层”的结构。
{end}

{if P_api_reference}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModProjectile-基础字段与AI.md#API 速查][弹幕：字段速查]}
{end}
