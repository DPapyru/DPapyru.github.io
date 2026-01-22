---
title: tModLoader：绘制入门（Shader / 顶点绘制）
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: advanced
time: 20分钟
description: 为对渲染方向感兴趣的读者提供最小概念模型：Shader、顶点、绘制阶段与常见踩坑
topic: mod-basics
order: 50
min_c: 1
min_t: 2
---

# tModLoader：绘制入门（Shader / 顶点绘制）

## 概览

{if P_rendering}
“绘制”通常不是 API 记忆题，而是**数据流题**：你把顶点/纹理/参数交给 GPU，再让渲染管线按阶段把它画出来。
{else}
如果你当前目标不是画特效，这篇可以当作“以后要用再回来看”的目录页。
{end}

## 最小示例

{if P_rendering}
最小理解路径（不追求完整代码）：

1. 选择一个绘制钩子（例如某个 draw layer / 事件）
2. 准备纹理与参数（颜色、时间、强度）
3. 选择/配置一个 `Effect`（Shader）
4. 提交顶点（或调用 SpriteBatch 风格的绘制 API）

你可以把它类比成“舞台灯光”：脚本是参数，演员是顶点，聚光灯是 shader，最终观众看到的是一帧帧的合成画面。
{else}
这部分仅在你开启“渲染方向”偏好或达到推荐门槛时会展开更详细内容。
{end}

## 常见坑

{if P_troubleshoot}
- 绘制阶段选错：你画的东西被其它层盖住，或根本没进入正确的 draw pass。
- 状态未还原：混合模式、采样器状态等被你改了但没还原，导致后续 UI/世界渲染异常。
- GC 抖动：每帧分配对象（数组/列表/颜色/向量）会造成卡顿，优先复用。
{end}

## 进阶与惯用写法

{if P_best_practice}
- 把“参数更新”和“绘制提交”分开：更新放 Update，绘制只读数据。
- 明确资源生命周期：Effect/Texture 的加载与释放不要散落到每帧逻辑里。
{end}

## API 速查

{if P_api_reference}
- `Effect`：Shader 容器（XNA/MonoGame 概念）
- `SpriteBatch`：常见 2D 绘制入口（按具体版本/环境）
{end}

