---
title: C#基础教程-第一课-C#语法基础
description: C#基础第一课，理解程序入口、基础语法、变量与作用域
author: 小天使
date: 2026-02-02
last_updated: 2026-02-07
difficulty: Beginner
time: 30分钟
order: 1
category: CSharp基础
topic: csharp-basics
min_c: 0
min_t: 0
prev_chapter: 新人路由导航.md
next_chapter: CSharp_Second.md
source_cs: ./CSharp_Frist.cs
---

# 第一课：先让 C# 程序跑起来

这篇文章是 C# 基础系列的起点。你会先看到一个可以运行的最小示例，再理解它为什么能运行。

如果你是第一次接触 C#，建议先把本课的代码手敲一遍，再对照讲解检查。

## 本课目标

1. 知道 C# 程序从哪里开始执行。
2. 看懂 `namespace`、`class`、`Main` 这三个核心结构。
3. 掌握变量声明和作用域的最小规则。
4. 能独立改动示例并验证结果。

## 先看完整示例

{{cs:./CSharp_Frist.cs}}

## 代码结构解释

### 1) `namespace` 是命名空间

命名空间用于给代码分组。项目变大后，命名空间可以避免类型重名。

### 2) `class` 是类型定义

`CSharp_Frist` 是一个类。你可以先理解成“装代码的容器”。后续讲面向对象时会详细展开。

### 3) `Main` 是入口方法

程序启动后，首先执行 `Main(string[] args)`。你在这个方法里写的语句，会按顺序运行。

### 4) 变量与作用域

变量必须先声明再使用。花括号 `{}` 会形成作用域，作用域外不能访问作用域内定义的局部变量。

## 你可以立刻尝试的改动

1. 把 `playerName` 改成你的名字。
2. 把 `level` 改成 `10`。
3. 在 `Console.WriteLine` 中再输出一行你自己的文本。
4. 重新运行，确认输出已变化。

## 常见问题

### 问题 1：提示找不到变量

通常是变量定义在作用域内，但你在作用域外使用了它。检查花括号位置。

### 问题 2：`Console` 报错

检查文件顶部是否有 `using System;`。

## 小结

你已经完成了 C# 的第一步：看懂程序入口、写出变量、理解作用域。

下一课继续：{{ref:./CSharp_Second.md|C#基础教程-第二课-变量与常见数据类型}}
