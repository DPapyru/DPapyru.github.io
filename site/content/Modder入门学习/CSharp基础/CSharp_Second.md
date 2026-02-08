---
title: C#基础教程-第二课-变量与常见数据类型
description: C#基础第二课，系统掌握变量声明、赋值与常见基础类型
author: 小天使
date: 2026-02-07
last_updated: 2026-02-07
difficulty: Beginner
time: 35分钟
order: 2
category: CSharp基础
topic: csharp-basics
min_c: 0
min_t: 0
prev_chapter: CSharp_Frist.md
next_chapter: CSharp_Third.md
source_cs: ./CSharp_Second.cs
---

# 第二课：变量与常见数据类型

上一课你已经知道程序怎么启动。本课开始正式处理“数据”。

## 本课目标

1. 区分“声明变量”和“给变量赋值”。
2. 掌握 `int`、`float`、`double`、`decimal`、`bool`、`char`、`string`。
3. 理解 `var` 的用途和边界。
4. 能根据场景选择类型。

## 先看完整示例

{{cs:./CSharp_Second.cs}}

## 变量是什么

变量可以理解为“带名字的存储位置”。你先给它一个名字和类型，再往里面放值。

基本写法：

```csharp
int hp = 100;
string playerName = "Guide";
```

## 常见基础类型

### `int`

用于整数，比如血量、数量、等级。

### `float` 和 `double`

用于小数。`double` 精度更高，默认浮点字面量是 `double`。`float` 字面量要加 `f`。

### `decimal`

用于对精度要求高的数据，常用于金额计算。

### `bool`

只表示 `true` 或 `false`。

### `char`

表示单个字符，用单引号。

### `string`

表示文本，用双引号。

## `var` 什么时候用

`var` 不是“无类型”，它只是让编译器根据右侧表达式推断类型。

```csharp
var count = 3;      // 实际是 int
var name = "Ami";  // 实际是 string
```

建议：右侧类型很明确时用 `var`，否则优先写出显式类型。

## 验证练习

1. 把示例里的 `level` 改成 `15`。
2. 新增 `bool isBossAlive = true;`。
3. 输出该变量并观察结果。
4. 把 `var ratio = 1.5;` 改成 `float ratio = 1.5f;`，体会写法差异。

## 常见错误

### 错误 1：`Cannot implicitly convert type`

通常是类型不匹配，比如把字符串直接赋给整数。

### 错误 2：`float` 写法错误

`float` 字面量忘记加 `f`。

## 小结

本课完成后，你已经具备了“声明变量 + 正确选类型”的基本能力。

下一课继续：[C#基础教程-第三课-运算符与表达式](./CSharp_Third.md)
