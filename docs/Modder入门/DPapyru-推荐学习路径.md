---
title: 推荐学习路径（按 C#/tML 熟练度分流）
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 8分钟
description: 给出可执行的阅读路径：从零基础到能做出第一个可用内容
topic: mod-basics
order: 1
min_c: 0
min_t: 0
---

# 推荐学习路径（按 C#/tML 熟练度分流）

目标：用最少的前置知识，走到“能看懂示例、能改参数、能验证效果”的阶段。

## 路线 A：C=0 且 T=0（完全新手）

{if C == 0 && T == 0}
1. 先读：`docs/Modder入门/DPapyru-从这里开始.md`
2. 补 C#：重点看 `最小示例（可引用）`，能读懂模板即可
3. 学 tML：重点看 `SetDefaults 最小示例` 与 `常见坑`
4. 实作：做一个最小的可验证物品（材料）
   - [第一个物品：做一个最简单的“材料”](1-入门/DPapyru-第一个物品.md)
5. 资源：遇到贴图/声音问题，再回看“资源与路径规则”
{else}
（你不在此路线的推荐区间，可直接跳到下面更匹配的路线。）
{end}

## 路线 B：C≥1 且 T=0（会 C#，不熟 tML）

{if C >= 1 && T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md#概览（可引用）][先建立生命周期模型]}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md#常见坑（可引用）][再规避常见坑]}
{end}

## 路线 C：C=0 且 T≥1（能改示例，但 C#薄弱）

{if C == 0 && T >= 1}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#概览（可引用）][先补“读懂结构”]}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#常见坑（可引用）][再补“常见坑”]}
{end}

## 路线 D：渲染方向（Shader/顶点绘制）

{if P_rendering}
{[文章使用内容索引/tModLoaderAPI/DPapyru-绘制入门-Shader与顶点绘制.md#最小示例（可引用）][渲染方向：最小理解路径]}
{end}
