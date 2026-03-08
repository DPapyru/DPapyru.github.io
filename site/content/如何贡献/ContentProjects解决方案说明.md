---
title: ContentProjects解决方案说明
author: DPapyru
date: 2026-02-07
last_updated: 2026-03-08
difficulty: intermediate
time: 12分钟
description: 本地 IDE 进阶页：说明 `site/ContentProjects.sln` 的定位，以及它为什么不属于新贡献者默认主线。
topic: article-contribution
order: 22
---

# ContentProjects解决方案说明

这是一篇进阶参考页，不是新贡献者默认入口。

如果你只是：

1. 写或修改 Markdown 教程
2. 给文章补一个 `anim.ts` 动画
3. 用网页 IDE 完成预览和提交

那么暂时不需要打开这篇，也不需要先配置本地工程。

## 它的定位是什么

`site/ContentProjects.sln` 是“本地 IDE 开发入口”，解决的是更重一点的编辑需求：

1. 稳定的本地 C# IntelliSense
2. 复杂示例代码维护
3. 本地项目级导航、重构和引用排查

它不是线上编辑器，也不是默认的文章写作入口。

## 什么时候你才应该看它

适合下面情况：

1. 你要维护较复杂的 C# 示例
2. 你要跨多个文件追踪命名空间、类型引用
3. 你发现网页 IDE 已经不够支撑这次修改规模

不适合下面情况：

1. 只改 Markdown 文案
2. 只给文章补一个普通 `anim.ts` 动画
3. 只想快速提交一篇教程

这三类工作，优先继续用 `/tml-ide/` 更省心。

## 当前解决方案里有什么

当前最关键的关联项目通常是：

1. `site/content/ModDocProject.csproj`
2. `site/content/anims/AnimScripts.Dev.anim.tsproj`

你可以把它理解成“内容维护辅助工程”，而不是“站点发布工程”。

## 最小配置步骤

### 第 1 步：打开解决方案

在本地 IDE 中打开：`site/ContentProjects.sln`

常见选择：

1. Rider
2. Visual Studio
3. VS Code（配合 C# 扩展）

### 第 2 步：检查本地路径

如果工程里引用了你本地环境相关的路径，请先核对这些路径是否正确。

最常见的排查方向：

1. `Import Project` 指向是否存在
2. .NET SDK 是否可用
3. IDE 是否正确识别项目引用

### 第 3 步：再回网页 IDE 组织内容

推荐协作方式不是“全程只用本地 IDE”，而是：

1. 本地 IDE 维护复杂代码
2. 网页 IDE 组织文章和预览
3. 提交前再统一做构建验证

## 和默认贡献主线的关系

现在的默认顺序应该是：

1. 先读 `教学文章写作指南.md`
2. 需要动画时再读 `使用网页特殊动画模块.md`
3. 只有当网页 IDE 不够用了，再回来看本页

这样可以把新贡献者的学习宽度压到最小，不会一开始就被本地工程配置拦住。

## 提交前验证

无论你主要用网页 IDE 还是本地 IDE，最终校验都还是回到仓库脚本：

```bash
npm run build
npm run check-generated
```

如果你只是为了写一篇教程而打开本页，请记住一句话：本页是进阶工具说明，不是贡献起跑线。
