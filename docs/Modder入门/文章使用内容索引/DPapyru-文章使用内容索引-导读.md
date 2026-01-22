---
title: 文章使用内容索引：如何阅读与引用
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 8分钟
description: 解释“文章使用内容索引”的用途、结构与引用展开写法
topic: mod-basics
order: 0
min_c: 0
min_t: 0
---

# 文章使用内容索引：如何阅读与引用

“文章使用内容索引”是一组**可复用的知识块**：既能单独阅读，也能被其它教程/路线页通过引用展开语法插入进来。

它解决的问题很具体：

- 同一段 C# / tModLoader API 解释，不要在多篇教程里反复写（维护成本高，易不一致）。
- 同一篇文章可以按学习者的 **C# 熟练度（C）**、**tModLoader API 熟悉度（T）**、以及 **偏好（P_*)** 分层展示内容。

## 阅读方式（给读者）

- 你可以把这里当作“查表”：打开某个主题文件，从目录跳到你需要的段落。
- 如果你刚入门，建议从目录里的 `## 概览（可引用）` 与 `## 最小示例（可引用）` 开始。

## 引用方式（给作者）

站点支持在 Markdown 中“整行”写引用展开指令：

```
{[文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md#最小示例（可引用）][C#：最小示例]}
```

- `#` 后面是**目标文章的标题文本**（必须是该文章里真实存在的标题）。
- 第二个 `[]` 是**本篇文章目录里显示的标题**。

## 条件分流（深度 + 偏好）

索引文档内部可以写条件块，按学习者的水平/偏好显示不同内容：

```
{if C == 0}
... 完全零基础的解释 ...
{else if C == 1}
... 有基础的解释 ...
{else}
... 更偏工程化/进阶的解释 ...
{end}
```

偏好变量以 `P_` 开头，例如 `P_step`、`P_code`、`P_api_reference`、`P_rendering` 等（更完整说明见：`docs/怎么贡献/站点Markdown扩展语法说明.md`）。

## 常用主题（入口）

- C#：从零到能看懂 Mod 代码
  - `docs/Modder入门/文章使用内容索引/CSharp/DPapyru-CSharp从零到能看懂Mod代码.md`
- tML：ModItem 生命周期与 SetDefaults
  - `docs/Modder入门/文章使用内容索引/tModLoaderAPI/DPapyru-ModItem生命周期与SetDefaults.md`
- tML：武器物品的关键字段（damage/useTime/useStyle）
  - `docs/Modder入门/文章使用内容索引/tModLoaderAPI/DPapyru-武器物品的关键字段.md`
- tML：Shoot 与自定义弹幕
  - `docs/Modder入门/文章使用内容索引/tModLoaderAPI/DPapyru-ModItem-Shoot与第一个弹幕.md`
- tML：ModProjectile 基础字段与 AI
  - `docs/Modder入门/文章使用内容索引/tModLoaderAPI/DPapyru-ModProjectile-基础字段与AI.md`
