---
title: Markdown新语法功能验证
author: DPapyru
topic: article-contribution
description: 在文章内验证 [文本](目标) 协议链接语法（cs/anims/fx）的实际触发效果。
order: 130
difficulty: beginner
time: 15分钟
source_cs:
  - ./code/MarkdownSyntaxDemo.cs
---

# Markdown 新语法功能验证

本文用于验证 `[文本](目标)` 协议链接新语法在 Viewer 和在线 IDE 中的实际效果。

## 验证目标

1. `cs:` 独占一行时可展开 C# 源码或片段。
2. `anims:` 独占一行时可触发动画嵌入。
3. `fx:` 独占一行时可触发 Shader 嵌入。
4. `cs:m:` 在方法签名包含括号时可正常解析。

## C# 引用验证

[源文件](cs:./code/MarkdownSyntaxDemo.cs)
[类型示例](cs:./code/MarkdownSyntaxDemo.cs#cs:t:ModDocProject.ModsSource.如何贡献.MarkdownSyntaxDemo)
[方法示例-原始括号](cs:./code/MarkdownSyntaxDemo.cs#cs:m:ModDocProject.ModsSource.如何贡献.MarkdownSyntaxDemo.ComputeDamage(int,string))
[方法示例-URL编码括号](cs:./code/MarkdownSyntaxDemo.cs#cs:m:ModDocProject.ModsSource.如何贡献.MarkdownSyntaxDemo.ComputeDamage%28int,string%29)
[属性示例](cs:./code/MarkdownSyntaxDemo.cs#cs:p:ModDocProject.ModsSource.如何贡献.MarkdownSyntaxDemo.DisplayName)
[字段示例](cs:./code/MarkdownSyntaxDemo.cs#cs:f:ModDocProject.ModsSource.如何贡献.MarkdownSyntaxDemo.TickCounter)
[常量示例](cs:./code/MarkdownSyntaxDemo.cs#cs:c:ModDocProject.ModsSource.如何贡献.MarkdownSyntaxDemo.BaseDamage)
[枚举成员示例](cs:./code/MarkdownSyntaxDemo.cs#cs:e:ModDocProject.ModsSource.如何贡献.MarkdownSyntaxDemo.DemoState.Running)

## 动画引用验证

[动画示例](anims:anims/demo-basic.anim.ts)

```animcs
anims/demo-basic.anim.ts
```

## Shader 引用验证

[Shader示例](fx:./shaders/demo.fx)

## 结论

协议链接必须独占一行才会触发嵌入渲染；行内写法仅作为普通链接显示。
