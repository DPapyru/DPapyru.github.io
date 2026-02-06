---
title: ContentProjects.sln 使用说明
author: DPapyru
category: 怎么贡献
topic: article-contribution
description: 说明 ContentProjects.sln 的用途、包含项目与常见配置方式。
---

## 目的

`site/ContentProjects.sln` 是给贡献者和维护者用的 IDE 工作区，主要目标是：

- 方便在同一个解决方案里打开动画渲染脚本与文档示例工程。
- 提供稳定的 C# IntelliSense（尤其是 tModLoader API）。
- 不影响站点构建流程，也不要求你真的打包 Mod。

## 解决方案包含的项目

- `site/content/anims/AnimScripts.Dev.csproj`
  - 动画脚本渲染相关工程。
- `site/content/ModDocProject.csproj`
  - 文档示例工程，用于在 IDE 中获得稳定的 C# 补全与检查体验。

## ModDocProject.csproj 设计要点

这个工程是“用于编辑与补全”的工程，不是为了打包发布：

- `BuildMod` 已设置为 `false`，避免触发 tML 的实际打包流程。
- 默认编译 `site/content/**/*.cs`，但排除 `anims/` 与所有 `obj/`、`bin/` 目录，避免误编译动画脚本与构建产物。
- 使用 SDK 风格项目文件，Rider/VS/VS Code 的解析更稳定。

## 使用步骤

1. 在 IDE 中打开 `site/ContentProjects.sln`。
2. 如你本地 tModLoader 路径不同，修改 `site/content/ModDocProject.csproj` 中的：
   ```xml
   <Import Project="F:\steam\steamapps\common\tModLoader\tMLMod.targets" />
   ```
3. 需要编写文档类时，可参考 `site/content/ModDocProject/Items/TestItem.cs` 的结构与注释写法。

## 常见问题

**Q: 为什么编译不会生成 Mod？**  
A: 这是有意设计的（`BuildMod=false`），用于 IDE 补全与文档解析，避免打包失败。

**Q: 我想真正在 tModLoader 里构建怎么办？**  
A: 需要把工程放进 tML 的 `ModSources` 目录，并显式开启 `BuildMod`，此方案不在本工程范围内。

## 相关路径

- tML ModSources（你本地）：`F:\文档\My Games\Terraria\tModLoader\ModSources`
- tML targets（你本地）：`F:\steam\steamapps\common\tModLoader\tMLMod.targets`
