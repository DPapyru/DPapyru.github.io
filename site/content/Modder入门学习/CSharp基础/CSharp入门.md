---
title: CSharp入门
description: 面向 tModLoader 新人的 C# 最小入门：语法、类型、控制流与常用写法
author: 小天使
difficulty: 简单
time: 60分钟
source_cs: ./CSharp入门.cs
---

## 本章目标

学完本章，你能：

- 看懂 C# 的基本语法结构
- 写出最常见的变量、条件、循环、方法
- 理解类/对象是什么，并能在 tModLoader 的代码里定位它们

这篇文章只讲最常用、最容易在模组开发里遇到的部分。遇到不懂的语法先能用起来，再逐步补细节。

## 前置条件

- 你能打开一个 C# 项目（或 tModLoader 的模组项目）并找到 `.cs` 文件
- 你知道“编译/运行”是什么意思

如果你暂时没有本地的 C# 开发环境，也可以先把本章当作“读懂别人代码”的入门。

## 第一个可运行例子

最小的 C# 程序长这样：

{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.HelloWorld()][示例：Hello World]}

你先记住两件事：

- `Main` 是“从这里开始执行”。
- 花括号 `{}` 用来包住一段代码。

## 变量与类型

### 最常见的类型

{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.CommonTypes()][示例：常见类型]}

- `int`：整数
- `float/double`：小数（`float` 结尾通常要写 `f`）
- `bool`：真/假
- `string`：字符串

### var：让编译器推断类型

{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.VarInference()][示例：var 推断]}

`var` 不是“动态类型”。它只是让你少写一次类型名，类型依然是编译期确定的。

### 常见运算

{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.BasicOps()][示例：四则运算与除法]}

## 条件分支

{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.IfElse()][示例：if / else if / else]}

`if (...)` 里必须是 `bool`。

## 循环

### for：固定次数

{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.ForLoop()][示例：for]}

### foreach：遍历集合

{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.ForeachLoop()][示例：foreach]}

## 方法（函数）

方法就是“可复用的一段代码”。


{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.Add(int,int)][示例：Add 方法]}

调用：

{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.CallAdd()][示例：调用 Add]}

如果不需要返回值，用 `void`：

{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.PrintName(string)][示例：void 方法]}

## 类与对象（你在 tModLoader 里最常见到的）

你可以把“类”理解为一个模板，“对象”是模板创建出来的实例。


{[./CSharp入门.cs#cs:t:Tutorial.CSharpIntro.PlayerData][示例：类定义]}

{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.UsePlayerData()][示例：创建对象]}

在 tModLoader 里，你会经常看到这种结构：

```csharp
public class MyItem : ModItem
{
    public override void SetDefaults()
    {
        // 设置物品属性
    }
}
```

先不需要完全理解 `override`、`virtual` 的细节，你只要知道：

- `MyItem` 继承了 `ModItem`
- 你在子类里重写方法，tModLoader 就会在合适的时机调用你的代码

## 常见坑

### 1) null

`null` 表示“没有对象”。很多报错都来自对 `null` 继续访问：


{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.NullPitfall()][示例：null 的坑]}

先判断再用：


上面的例子已经包含了“先判断再用”的写法。

### 2) 字符串拼接与插值

推荐用插值字符串：


{[./CSharp入门.cs#cs:m:Tutorial.CSharpIntro.CSharpIntroExamples.Interpolation()][示例：字符串插值]}

## 小结

你现在已经具备了读懂和写出“基础 C# 代码块”的能力。接下来建议你去看一段真实的 tModLoader 示例代码：

- 找到一个 `ModItem` 或 `ModProjectile` 的示例
- 只改一个数字（比如伤害、速度）并验证效果

能在游戏里验证，就是最有效的学习方式。
