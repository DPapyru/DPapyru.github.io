---
title: C#基础教程-第三课-运算符与表达式
description: C#基础第三课，掌握算术、比较、逻辑运算符与表达式组合
author: 小天使
date: 2026-02-07
last_updated: 2026-02-07
difficulty: Beginner
time: 35分钟
order: 3
category: CSharp基础
topic: csharp-basics
min_c: 0
min_t: 0
prev_chapter: CSharp_Second.md
next_chapter: CSharp_Fourth.md
source_cs: ./CSharp_Third.cs
---

# 第三课：运算符与表达式

变量有了之后，我们要让数据“动起来”。这件事主要靠运算符与表达式完成。

## 本课目标

1. 掌握算术运算符。
2. 掌握比较运算符。
3. 掌握逻辑运算符。
4. 理解表达式的计算顺序。

## 先看完整示例

{{cs:./CSharp_Third.cs}}

## 算术运算符

常见算术运算符：`+`、`-`、`*`、`/`、`%`。

```csharp
int total = 10 + 5;
int remain = 17 % 5;
```

`%` 是取余，常用于循环计数或奇偶判断。

## 比较运算符

比较结果一定是 `bool`。

- `==`：是否相等
- `!=`：是否不等
- `>`：是否大于
- `<`：是否小于
- `>=`：是否大于等于
- `<=`：是否小于等于

## 逻辑运算符

- `&&`：并且，左右都为 `true` 才是 `true`
- `||`：或者，只要一侧为 `true` 就是 `true`
- `!`：取反

## 表达式顺序

可以先记一个简单规则：先算括号，再算乘除，最后算加减。

逻辑表达式也建议用括号增强可读性。

## 验证练习

1. 把 `damage` 改大，观察 `isHighDamage` 的变化。
2. 把 `isNight` 改成 `false`，观察 `canSpawnBoss` 的结果。
3. 新增一个表达式：`bool isEven = count % 2 == 0;`。

## 常见错误

### 错误 1：把 `=` 和 `==` 混用

`=` 是赋值，`==` 是比较。

### 错误 2：逻辑表达式太长

建议拆分为多个中间变量，提高可读性。

## 小结

运算符是编程中最常用的工具。你写的判断与计算，几乎都离不开它。

下一课继续：[C#基础教程-第四课-分支与循环](./CSharp_Fourth.md)
