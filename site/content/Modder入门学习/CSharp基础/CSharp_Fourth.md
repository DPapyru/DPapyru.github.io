---
title: C#基础教程-第四课-分支与循环
description: C#基础第四课，学会使用 if/else、switch、for、while 控制程序流程
author: 小天使
date: 2026-02-07
last_updated: 2026-02-07
difficulty: Beginner
time: 40分钟
order: 4
category: CSharp基础
topic: csharp-basics
min_c: 0
min_t: 0
prev_chapter: CSharp_Third.md
next_chapter: CSharp_Fifth.md
source_cs: ./CSharp_Fourth.cs
---

# 第四课：分支与循环

真正的程序不是“从头执行到尾”这么简单。你会经常遇到“条件不同，走不同逻辑”以及“重复执行”的需求。

## 本课目标

1. 使用 `if / else if / else` 处理条件分支。
2. 使用 `switch` 处理多分支选择。
3. 使用 `for` 与 `while` 进行循环。
4. 理解 `break` 与 `continue` 的行为。

## 先看完整示例

{{cs:./CSharp_Fourth.cs}}

## 分支语句

### `if / else if / else`

当你只需要判断几种条件时，这种写法最直接。

### `switch`

当你根据“某个值”在多个分支中选择时，`switch` 更清晰。

## 循环语句

### `for`

适合已知循环次数的场景。

### `while`

适合“满足条件就继续”的场景。

## `break` 与 `continue`

- `break`：结束当前循环。
- `continue`：跳过本次，进入下一次循环。

## 验证练习

1. 把示例里的 `level` 改成 `20`，观察分支输出。
2. 把 `difficulty` 改成 `2` 或 `3`，观察 `switch` 输出。
3. 在 `for` 循环里加入 `if (i == 2) continue;`，观察输出差异。

## 常见错误

### 错误 1：`switch` 漏写 `break`

会继续执行下一个 `case`。

### 错误 2：循环条件写错

例如 `while (count > 0)` 但计数器没有变化，容易造成死循环。

## 小结

掌握流程控制后，你已经能写出“有逻辑分支、能重复处理”的基础程序。

下一课继续：{{ref:./CSharp_Fifth.md|C#基础教程-第五课-方法与参数}}
