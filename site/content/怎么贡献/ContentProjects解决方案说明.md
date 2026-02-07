---
title: ContentProjects解决方案说明
author: DPapyru
date: 2026-02-07
last_updated: 2026-02-07
difficulty: intermediate
time: 20分钟
description: 讲清 site/ContentProjects.sln 在当前项目中的定位、配置方法与常见问题
topic: article-contribution
order: 4
prev_chapter: 在线写作IDE使用教程.md
next_chapter: 使用网页特殊动画模块.md
---

# ContentProjects解决方案说明

`site/ContentProjects.sln` 是“本地 IDE 开发入口”，主要解决两件事：

1. 在同一工作区中获得稳定的 C# 补全
2. 方便维护文档相关 C# 代码与动画脚本工程

它不是线上编辑器，也不是最终打包工程。

## 什么时候应该使用它

适合下面情况：

1. 你要写较复杂的 C# 示例并希望有 IntelliSense
2. 你要排查命名空间、类型引用、文件组织问题
3. 你在维护动画脚本或文档示例工程

不适合下面情况：

1. 只改 Markdown 文案
2. 只改分流条件与 route 配置

这两类工作优先用 `article-studio.html` 更快。

## 当前解决方案包含内容

核心关联项目：

1. `site/content/ModDocProject.csproj`
2. `site/content/anims/AnimScripts.Dev.csproj`

设计目标：

- 尽量降低“文档写作 + C# 示例维护”的环境门槛
- 保持与站点构建流程解耦，避免误触完整打包链路

## 快速配置步骤

### 第1步：打开解决方案

在 IDE 中打开：`site/ContentProjects.sln`

推荐 IDE：

1. Rider
2. Visual Studio
3. VS Code（配合 C# 扩展）

### 第2步：检查 tModLoader targets 路径

打开 `site/content/ModDocProject.csproj`，确认 `Import Project` 指向你的本地路径。

如果本地路径不同，改成你自己的绝对路径。

### 第3步：验证最小编译环境

至少保证：

1. .NET SDK 可用（建议 .NET 8）
2. IDE 可以加载项目并识别引用

## 与网页 IDE 的协作方式

推荐协作流程：

1. 在本地 IDE 完成复杂 C# 示例维护
2. 在网页 IDE 完成教程组织、分流编排和 PR 提交
3. 回到本地跑构建命令做最终验证

这样可以同时兼顾效率和正确性。

## 与构建命令的关系

贡献前建议执行：

1. `npm run build`
2. `npm run check-content`
3. `npm run check-generated`

这三步不是由 `ContentProjects.sln` 自动替代。

## 常见问题

### Q1：为什么看起来不像普通 Mod 打包工程

因为这个方案的定位是“开发与维护辅助”，目标是编辑体验稳定，不是直接产出发布包。

### Q2：路径改完还是报错

优先确认：

1. `Import Project` 是否可访问
2. IDE 是否使用正确的 .NET SDK
3. 旧缓存是否需要清理并重启 IDE

### Q3：我只写教程是否必须配置本地工程

不是。只写 Markdown 时直接用网页 IDE 即可。

## 下一步

如果你要在文章中使用动画模块，继续阅读：`使用网页特殊动画模块.md`。
