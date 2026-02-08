---
title: 学会搜索自己需要的内容
description: 提炼关键词、找可靠信息源、快速找到解决方案
author: DPapyru
category: 方向性指导
topic: search-skills
last_updated: 2026-01-30
difficulty: beginner
time: 15分钟
prev_chapter: DPapyru-掌握编程的逻辑和思想.md
next_chapter: DPapyru-如何提问.md
---

## 本章目标

学完本章，你能：

- 提炼有效的搜索关键词
- 快速找到官方文档、GitHub 代码、社区讨论
- 筛选出可信的信息源

搜索能力比记忆力更重要。你会遇到很多"不知道怎么做"的情况，这时候搜索能帮你快速找到答案。

## 最短流程（建议照着做）

1. 先把问题拆成关键词：技术栈 + 核心概念 + 具体操作。
2. 优先找官方与源码：tModLoader Wiki、GitHub 仓库、近期 Issue。
3. 最后做验证：看发布日期，复制代码到 IDE 编译，确认和你的版本一致。

## 搜索前的准备：把问题变成关键词

### 错误的搜索方式

- "怎么让物品有击退"
- "tModLoader 怎么添加 NPC"
- "我的 Mod 加载不了"

这些问题太模糊，搜索结果会包含大量无关内容。

### 正确的搜索方式

- "tModLoader Item knockback SetDefaults"
- "tModLoader create custom NPC example"
- "tModLoader mod loading error logs"

这些搜索词包含了：

- **技术栈**：tModLoader / Terraria / C#
- **核心概念**：Item / NPC / loading error
- **具体操作**：knockback / SetDefaults / create / logs

### 关键词三要素

#### 1. 技术栈

说明你在用什么：

- `tModLoader`（Mod 开发）
- `C#`（编程语言）
- `Terraria`（原版游戏）

#### 2. 核心概念

说明你在操作什么：

- `Item`（物品）
- `NPC`（敌人/生物）
- `Recipe`（合成配方）
- `Tile`（物块）

#### 3. 具体操作

说明你想做什么：

- `SetDefaults`（设置默认值）
- `AddRecipes`（添加配方）
- `NPCLoot`（NPC 掉落）
- `CreateRecipe`（创建配方）

### 示例对比

#### 需求：给物品添加击退效果

错误搜索：
```
怎么让物品有击退
```
搜索结果：大量无关的教程、论坛讨论

正确搜索：
```
tModLoader Item knockback SetDefaults
```
搜索结果：官方文档、GitHub 代码示例、Stack Overflow 讨论

## 搜索渠道与技巧

### 1. 官方文档优先（最可靠）

#### tModLoader 官方文档
```
site:github.com tModLoader Item knockback
```

#### Terraria Wiki（原版机制）
```
site:terraria.wiki.gg knockback item
```

官方文档最可靠，因为它由官方维护、更新及时。

### 2. GitHub 代码搜索（看实际实现）

#### 搜索大型 Mod 的代码
```
repo:tModLoader/tModLoader language:c# Item.SetDefaults
repo:CalamityMod/CalamityMod language:c# knockback
```

#### 搜索 Issues（找常见问题）
```
is:issue is:open tModLoader loading error
is:issue is:open label:help wanted
```

GitHub 代码搜索的优势：

- 看实际项目的实现（而不是理论）
- 找到最新的代码（不是两年前的教程）
- 看别人怎么解决类似问题

#### 推荐参考的 Mod

- **Calamity Mod**：大型 Mod，代码规范
- **Thorium Mod**：内容丰富，适合参考
- **tModLoader 示例 Mod**：官方示例，最标准

### 3. 社区讨论（获取经验）

#### Reddit
```
site:reddit.com/r/tModLoader "knockback" question
```

#### Discord
- 直接在 Discord 里搜索关键词
- 查看历史记录，别人可能问过类似问题

#### 国内的 QQ 群、论坛
- 简体中文环境下更友好
- 可以直接提问（但先搜索历史消息）

### 4. 通用搜索引擎技巧

#### 精确匹配（双引号）
```
"Item.damage" tModLoader
"SetDefaults not working"
```

#### 排除无关结果（减号）
```
tModLoader tutorial -video
tModLoader Item -stackoverflow
```

#### 限定时间范围（只看最新内容）
```
tModLoader loading error after:2024-01-01
```

#### 搜索英文原版关键词
英文原版资料更全面，尽量用英文搜索：

```
推荐："tModLoader custom NPC AI"
不推荐："tModLoader 自定义 NPC AI"
```

## 信息筛选：判断结果的可靠性

### 高可靠性的信息源

- **官方文档**：由官方维护，最权威
- **大型 Mod 的源代码**：实际项目，可运行
- **近期活跃的 GitHub Issue**：说明问题仍存在、有讨论
- **高投票的 Stack Overflow 回答**：被社区验证过

### 需要验证的信息源

- **个人博客**：可能过时、可能有错误
- **过时的教程**：注意发布日期，两年前的教程可能不适用
- **机器翻译的内容**：可能丢失关键信息
- **没有具体代码的文字描述**："你可以这样做"，但没有代码示例

### 验证方法

#### 查看发布日期
```
推荐：2024 年发布的教程（tML 1.4 版本）
不推荐：2021 年发布的教程（tML 1.3 版本，已过时）
```

#### 查看代码能否编译
把示例代码复制到 IDE，尝试编译：

- 能编译 -> 代码语法正确
- 不能编译 -> 可能过时、或缺少上下文

#### 查看版本信息
教程或文档中是否说明：

- 适用的 tModLoader 版本
- 适用的 Terraria 版本
- 是否需要额外的库或工具

## 常见搜索误区

### 误区1：只搜索中文内容

中文资料有限，英文原版更全面。

**建议**：优先搜索英文关键词，如果找不到再尝试中文。

### 误区2：不看发布时间

tModLoader 更新快，两年前的教程可能已经不适用。

**建议**：搜索结果中优先看 2023 年以后的内容。

### 误区3：只看搜索引擎首页

搜索引擎首页不一定是最相关的结果。

**建议**：

- 查看第二页、第三页
- 尝试不同的关键词组合
- 换个搜索引擎（Google、Bing、DuckDuckGo）

## 下一步

掌握搜索技能后，当你找不到答案时，就需要学会提问。好的提问能让别人更容易理解你的问题，给你更准确的答案。

[如何提问？](DPapyru-如何提问.md)
