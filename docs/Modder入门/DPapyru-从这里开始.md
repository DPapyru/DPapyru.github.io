---
title: 从这里开始：Modder 入门总览
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 10分钟
description: 解释 Modder入门的阅读方式，并按 C#/tML 熟练度与偏好给出建议入口
topic: mod-basics
order: 0
min_c: 0
min_t: 0
---

# 从这里开始：Modder 入门总览

这套文档按两条主轴分层：

- **C（C# 熟练度）**：0=从未接触过，1=能读懂基础语法，2=能独立写小型工程
- **T（tModLoader API 熟悉度）**：0=第一次见，1=能跟着示例改，2=能自己查 API 组合实现

同时支持“偏好分流”（例如更偏好步骤、代码、排错清单、API 速查、渲染方向等）。

## 先读这个（通用）

{[文章使用内容索引/DPapyru-文章使用内容索引-导读.md#阅读方式（给读者）][如何阅读与查表]}

## 你可能需要的补课

{if C == 0}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#概览（可引用）][C#：先把“结构”读懂]}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#最小示例（可引用）][C#：最小示例（能看懂模板）]}
{else if C == 1}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#进阶与惯用写法（可引用）][C#：更易维护的写法]}
{else}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#常见坑（可引用）][C#：常见坑（避免浪费时间）]}
{end}

{if T == 0}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md#概览（可引用）][tML：先理解生命周期]}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md#最小示例（可引用）][tML：SetDefaults 最小示例]}
{else if T == 1}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md#常见坑（可引用）][tML：常见坑（热重载/默认值）]}
{else}
{[文章使用内容索引/tModLoaderAPI/DPapyru-Content资源与路径规则.md#进阶与惯用写法（可引用）][资源：组织与命名规范]}
{end}

## 按偏好补充（可跳过）

{if P_troubleshoot}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#常见坑（可引用）][排错清单：C# 常见坑]}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md#常见坑（可引用）][排错清单：tML 常见坑]}
{end}

{if P_api_reference}
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#API 速查（可引用）][速查：C# 关键语法]}
{[文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md#API 速查（可引用）][速查：ModItem 常用入口]}
{end}

{if P_rendering}
{[文章使用内容索引/tModLoaderAPI/DPapyru-绘制入门-Shader与顶点绘制.md#概览（可引用）][渲染方向：概览]}
{end}

## 第一篇实作（建议）

当你能读懂 `SetDefaults()` 的“出厂设置”含义后，建议直接做一次最小实作：

- [第一个物品：做一个最简单的“材料”](1-入门/DPapyru-第一个物品.md)
