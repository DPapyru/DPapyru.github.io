---
title: tModLoader：弹幕 AI 常用数学与运动模式
author: 小天使
date: 2026-01-23
last_updated: 2026-01-23
difficulty: intermediate
time: 35分钟
description: 解释弹幕 AI 中常用的数学工具：向量运算、角度计算、追踪算法，以及冲刺、回旋镖、曲线运动等常见运动模式的实现
topic: items
order: 50
min_c: 0
min_t: 1
---

# tModLoader：弹幕 AI 常用数学与运动模式

## 概览

复杂的弹幕 AI 离不开数学运算。本章聚焦三件事：

1. **向量与角度**：如何用 `Vector2` 计算方向、距离、旋转。
2. **追踪算法**：如何让弹幕“认识”目标并转向。
3. **运动模式**：冲刺、回旋镖、曲线运动的实现模板。

类比一下：向量是“语言”，追踪是“逻辑”，运动模式是“句子”——学会这些，你就能写出各种花式弹幕。

## 最小示例

{if T == 0}
**向量基础**：速度与方向

```csharp
using Microsoft.Xna.Framework;
using Terraria;

public override void AI()
{
    // 让弹幕朝一个固定方向移动
    // 假设我们想要向右上方45度飞行
    Vector2 direction = new Vector2(1, 1);
    direction.Normalize();  // 归一化，保证长度为1
    Projectile.velocity = direction * 10f;  // 速度为10
}
```

**朝向目标**：计算到 NPC 的方向

```csharp
public override void AI()
{
    // 寻找最近的NPC
    NPC target = null;
    float maxDistance = 800f;  // 搜索范围

    for (int i = 0; i < Main.maxNPCs; i++)
    {
        NPC npc = Main.npc[i];
        if (npc.active && !npc.friendly)
        {
            float dist = Vector2.Distance(Projectile.Center, npc.Center);
            if (dist < maxDistance)
            {
                maxDistance = dist;
                target = npc;
            }
        }
    }

    if (target != null)
    {
        // 计算方向向量
        Vector2 direction = target.Center - Projectile.Center;
        direction.Normalize();
        // 转向目标（逐渐转向，避免突变）
        Projectile.velocity = Vector2.Lerp(Projectile.velocity, direction * 12f, 0.1f);
    }
}
```
{else if T == 1}
核心数学工具是 `Vector2` 的几个方法：

- `Vector2.Distance(a, b)`：两点距离
- `Vector2.DistanceSquared(a, b)`：距离平方（更快，不用开方）
- `vector.Normalize()`：归一化，变成单位向量
- `Vector2.Lerp(a, b, t)`：线性插值，`t` 是 0~1 之间的混合比例
- `vector.ToRotation()`：向量转弧度
- `ToRotation() + angle`：角度加减

追踪的关键是“逐渐转向”而不是“直接对准”，用 `Lerp` 实现平滑转向。
{else}
从数学角度看，弹幕运动是“在向量空间中对速度向量的每帧修正”：

- 匀速直线：`velocity = constant`
- 加速：`velocity += acceleration`
- 追踪：`velocity = Lererp(velocity, direction * speed, turnRate)`
- 曲线：`velocity = Rotate(velocity, angularVelocity)`

`ai[]` 和 `localAI[]` 用来存储状态（计时器、目标ID、转向进度等）。
{end}

## 冲刺（Dash）

### 核心思路

冲刺 = **短暂蓄力 → 快速直线移动 → 减速停止**。

### 实现模板

```csharp
public override void AI()
{
    // 用 ai[0] 做计时器
    Projectile.ai[0] += 1f;

    if (Projectile.ai[0] <= 30f)
    {
        // 蓄力阶段：减速，准备冲刺
        Projectile.velocity *= 0.9f;
        // 可选：蓄力时生成粒子效果
    }
    else if (Projectile.ai[0] <= 35f)
    {
        // 冲刺阶段：瞬间加速
        if (Projectile.ai[0] == 31f)
        {
            // 冲刺方向（可以是玩家面向、鼠标方向、或预设）
            Vector2 dashDir = Projectile.velocity.SafeNormalize(Vector2.UnitX);
            if (Main.player[Projectile.owner].direction < 0)
                dashDir = -dashDir;
            Projectile.velocity = dashDir * 20f;
        }
    }
    else
    {
        // 减速停止
        Projectile.velocity *= 0.95f;
    }
}
```

### 变体：指向鼠标冲刺

```csharp
public override void AI()
{
    Projectile.ai[0] += 1f;

    if (Projectile.ai[0] <= 20f)
    {
        // 蓄力
        Projectile.velocity *= 0.85f;
    }
    else if (Projectile.ai[0] <= 25f)
    {
        // 冲刺向鼠标位置
        Player player = Main.player[Projectile.owner];
        Vector2 targetPos = player.Center + new Vector2(
            Main.mouseX - Main.screenWidth / 2,
            Main.mouseY - Main.screenHeight / 2
        );
        Vector2 dashDir = targetPos - Projectile.Center;
        dashDir.Normalize();
        Projectile.velocity = dashDir * 25f;
    }
    else
    {
        Projectile.velocity *= 0.92f;
    }
}
```

## 追踪 NPC（Seek）

### 核心思路

追踪 = **找到目标 → 计算方向 → 逐渐转向**。

### 实现模板

```csharp
public override void AI()
{
    // 用 ai[0] 做追踪计时器，每10帧更新一次目标
    Projectile.ai[0] += 1f;

    if (Projectile.ai[0] >= 10f)
    {
        Projectile.ai[0] = 0f;
        // 寻找最近的敌对NPC
        FindNearestTarget();
    }

    // 逐渐转向目标方向
    if (Projectile.target != -1)
    {
        NPC target = Main.npc[Projectile.target];
        if (target.active && !target.friendly)
        {
            Vector2 toTarget = target.Center - Projectile.Center;
            toTarget.Normalize();

            // 转向率：越大转向越快，0.05f ~ 0.15f 较为自然
            Projectile.velocity = Vector2.Lerp(
                Projectile.velocity,
                toTarget * Projectile.velocity.Length(),
                0.08f
            );
        }
    }

    // 确保旋转跟随速度方向
    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation = Projectile.velocity.ToRotation();
}

// 寻找最近目标的方法
private void FindNearestTarget()
{
    float closestDist = 1000f;
    int closestNPC = -1;

    for (int i = 0; i < Main.maxNPCs; i++)
    {
        NPC npc = Main.npc[i];
        if (npc.active && !npc.friendly && npc.CanBeHitBy(Projectile))
        {
            float dist = Vector2.DistanceSquared(Projectile.Center, npc.Center);
            if (dist < closestDist * closestDist)
            {
                closestDist = (float)Math.Sqrt(dist);
                closestNPC = i;
            }
        }
    }

    Projectile.target = closestNPC;
}
```

### 追踪变体：带预测的追踪

```csharp
public override void AI()
{
    if (Projectile.target == -1 || !Main.npc[Projectile.target].active)
    {
        FindNearestTarget();
        return;
    }

    NPC target = Main.npc[Projectile.target];

    // 预测目标位置（假设目标保持当前速度移动）
    Vector2 predictedPos = target.Center + target.velocity * 10f;
    Vector2 toPredicted = predictedPos - Projectile.Center;
    toPredicted.Normalize();

    // 平滑转向
    Projectile.velocity = Vector2.Lerp(Projectile.velocity, toPredicted * 12f, 0.1f);

    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation = Projectile.velocity.ToRotation();
}
```

## 回旋镖（Boomerang）

### 核心思路

回旋镖 = **向外飞 → 达到最远距离 → 转向飞回 → 被玩家接住或消失**。

### 实现模板

```csharp
public override void AI()
{
    // ai[0]：状态计时器
    // ai[1]：最远飞行距离
    Projectile.ai[0] += 1f;

    float maxDist = Projectile.ai[1];
    if (maxDist == 0)
        maxDist = 400f;  // 默认最远距离

    float currentDist = Vector2.Distance(Projectile.Center, Projectile.owner.Center);

    if (Projectile.ai[0] <= 30f)
    {
        // 飞出阶段：保持方向
        if (Projectile.ai[0] == 1f)
        {
            // 记录初始方向
            Projectile.direction = Main.player[Projectile.owner].direction;
        }
    }
    else if (currentDist < maxDist)
    {
        // 仍在最远距离外：继续向外
    }
    else
    {
        // 折返阶段：转向玩家
        Vector2 toPlayer = Main.player[Projectile.owner].Center - Projectile.Center;
        toPlayer.Normalize();

        // 回程加速
        float returnSpeed = 8f + Projectile.ai[0] * 0.3f;
        Projectile.velocity = Vector2.Lerp(Projectile.velocity, toPlayer * returnSpeed, 0.15f);
    }

    // 旋转效果：飞出去时朝运动方向，返回时朝玩家
    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation += 0.3f;

    // 接住检测：距离玩家足够近且正在返回
    if (currentDist < 40f && Projectile.ai[0] > 30f)
    {
        Projectile.Kill();
    }
}
```

### 简化版回旋镖（用状态机）

```csharp
public override void AI()
{
    // 状态：0=飞出, 1=折返
    if (Projectile.ai[0] == 0f)
    {
        // 飞出阶段
        Projectile.ai[1] += 1f;
        if (Projectile.ai[1] > 30f || Vector2.Distance(Projectile.Center, Projectile.owner.Center) > 350f)
        {
            Projectile.ai[0] = 1f;  // 切换到折返
        }
    }
    else if (Projectile.ai[0] == 1f)
    {
        // 折返阶段
        Player owner = Main.player[Projectile.owner];
        Vector2 toOwner = owner.Center - Projectile.Center;
        toOwner.Normalize();

        // 逐渐加速返回
        Projectile.velocity = Vector2.Lerp(Projectile.velocity, toOwner * 15f, 0.1f);

        // 被接住
        if (Vector2.Distance(Projectile.Center, owner.Center) < 30f)
        {
            Projectile.Kill();
        }
    }

    // 持续旋转
    Projectile.rotation += 0.4f;
}
```

## 曲线运动（Curve）

### 核心思路

曲线 = **每帧旋转速度向量**（添加角速度）。

### 实现模板

```csharp
public override void AI()
{
    // 用 ai[0] 做旋转计时器
    Projectile.ai[0] += 1f;

    // 弧形运动：每帧旋转 velocity
    float turnRate = 0.08f;  // 弧度/帧，正值左转，负值右转
    Projectile.velocity = Projectile.velocity.RotatedBy(turnRate);

    // 保持速度大小（可选，如果不需要减速/加速）
    Projectile.velocity = Projectile.velocity.SafeNormalize(Vector2.UnitX) * 10f;

    // 旋转跟随速度
    if (Projectile.velocity.LengthSquared() > 0.001f)
        Projectile.rotation = Projectile.velocity.ToRotation();
}
```

### 螺旋运动

```csharp
public override void AI()
{
    Projectile.ai[0] += 1f;

    // 螺旋 = 半径逐渐增大 + 持续旋转
    float currentRadius = Projectile.ai[1];
    if (currentRadius == 0)
    {
        currentRadius = 50f;
        Projectile.ai[1] = currentRadius;
    }

    // 半径逐渐增大
    Projectile.ai[1] += 0.5f;

    // 玩家中心为螺旋中心
    Player owner = Main.player[Projectile.owner];
    float angle = Projectile.ai[0] * 0.1f;  // 旋转角度

    Vector2 offset = new Vector2(
        (float)Math.Cos(angle) * Projectile.ai[1],
        (float)Math.Sin(angle) * Projectile.ai[1]
    );

    Vector2 targetPos = owner.Center + offset;
    Vector2 toTarget = targetPos - Projectile.Center;

    // 移动向螺旋轨道
    Projectile.velocity = Vector2.Lerp(Projectile.velocity, toTarget * 0.5f, 0.2f);

    Projectile.rotation = Projectile.velocity.ToRotation();
}
```

### 正弦波运动（蛇形）

```csharp
public override void AI()
{
    Projectile.ai[0] += 1f;

    // 基础方向
    Vector2 baseDir = new Vector2(1, 0);
    if (Main.player[Projectile.owner].direction < 0)
        baseDir = new Vector2(-1, 0);

    // 垂直于基础方向的正弦偏移
    float perpendicularAngle = baseDir.ToRotation() + MathHelper.PiOver2;
    float waveAmplitude = 30f + Projectile.ai[0] * 0.1f;  // 振幅随时间增大
    float waveFrequency = 0.05f;
    float waveOffset = (float)Math.Sin(Projectile.ai[0] * waveFrequency) * waveAmplitude;

    Vector2 waveDir = perpendicularAngle.ToRotationVector2() * waveOffset;

    // 应用速度
    Vector2 targetVel = baseDir * 8f + waveDir;
    Projectile.velocity = Vector2.Lerp(Projectile.velocity, targetVel, 0.1f);

    Projectile.rotation = Projectile.velocity.ToRotation();
}
```

## 组合运动：追踪 + 曲线

```csharp
public override void AI()
{
    Projectile.ai[0] += 1f;

    // 寻找目标
    if (Projectile.ai[0] % 10 == 0)
    {
        FindNearestTarget();
    }

    Vector2 targetVel = Projectile.velocity;

    if (Projectile.target != -1)
    {
        NPC target = Main.npc[Projectile.target];
        if (target.active)
        {
            Vector2 toTarget = target.Center - Projectile.Center;
            toTarget.Normalize();
            toTarget *= 10f;  // 目标速度

            // 追踪：70% 追踪 + 30% 保持当前动量
            targetVel = Vector2.Lerp(targetVel, toTarget, 0.7f);
        }
    }

    // 添加曲线旋转
    targetVel = targetVel.RotatedBy(0.03f);

    Projectile.velocity = Vector2.Lerp(Projectile.velocity, targetVel, 0.1f);
    Projectile.rotation = Projectile.velocity.ToRotation();
}
```

## 常见坑

{if P_troubleshoot}
- **追踪太慢/太快**：调整 `Lerp` 的第三个参数，`0.02f` 适合重型追踪，`0.2f` 适合快速转向。
- **向量归一化后变 0**：`SafeNormalize(defaultValue)` 避免除零错误。
- **距离用开方**：大量追踪计算时用 `DistanceSquared` 代替 `Distance`，性能更好。
- **回旋镖接不住**：检测距离和状态，确保折返阶段才会被接住。
- **曲线半径失控**：对 `ai[]` 做上限限制，或乘以衰减系数。
- **螺旋飞出屏幕**：给螺旋半径加上限，或在接近屏幕边缘时转向。
{end}

## 进阶与惯用写法

{if P_best_practice}
- **状态机优于随机数**：用 `ai[]` 明确记录当前阶段（蓄力/冲刺/返回），避免逻辑混乱。
- **预计算目标位置**：追踪时预测目标移动路径，可以让弹幕“预判”而非“尾随”。
- **分离“速度计算”与“位置更新”**：先算出想要的 `velocity`，再让 tML 处理位置更新。
- **用 `SafeNormalize` 防止除零**：任何归一化操作都优先用 `SafeNormalize`。
- **性能优化**：用 `DistanceSquared` 代替 `Distance`，用 `Math.PI` 预计算常量。
- **旋转向量而非角度**：直接对 `Vector2` 用 `RotatedBy` 比“先转弧度再算向量”更高效。
{end}

## API 速查

{if P_api_reference}
- `Vector2.Distance(a, b)` / `DistanceSquared(a, b)`：两点距离
- `vector.Normalize()` / `SafeNormalize(default)`：归一化
- `Vector2.Lerp(a, b, t)`：线性插值
- `vector.RotatedBy(angle)`：旋转向量
- `vector.ToRotation()` / `angle.ToRotationVector2()`：角度与向量互转
- `Vector2.Dot(a, b)`：点积（判断方向夹角）
- `NPC.Center` / `Projectile.Center`：中心位置
- `Main.maxNPCs` / `Main.npc[]`：NPC 数组遍历
- `Projectile.owner`：发射者玩家索引
- `Projectile.target`：目标 NPC 索引
- `Projectile.ai[]` / `Projectile.localAI[]`：状态存储
{end}
