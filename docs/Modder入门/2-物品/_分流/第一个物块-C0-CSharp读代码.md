---
title: 第一个物块（C0 补课）：C# 读代码
author: 小天使
date: 2026-01-20
last_updated: 2026-01-20
difficulty: beginner
time: 10分钟
description: 给从没接触过 C# 的读者，看懂"第一个物块"里出现的关键语法
topic: mod-basics
order: 9201
hide: true
---

这份补充内容面向 **C0（从没接触过 C#）**：覆盖阅读与修改本章代码所需的最小语法集合。

> **[C#概念进度]**
>
> 学完这一节，你将掌握：
> - `class`：类的定义
> - `public` 和 `private`：访问修饰符
> - 方法与 `override`：为什么要"重写"
> - 继承：`class A : B` 是什么意思

## 1）`class`：类的定义

> **[对应概念]**：`class`、面向对象

`class` 是 C# 中定义"类"的关键字。类可以理解为"蓝图"或"模板"：

```csharp
public class FirstTile : ModTile
{
    // 这里写类的内容
}
```

- `FirstTile`：类的名字（你起的）
- `ModTile`：这个类继承自 `ModTile`（它已经是游戏定义好的类）

## 2）`public` 和 `private`：访问修饰符

> **[对应概念]**：访问修饰符、封装

- `public`：公开的，其他代码可以访问这个成员
- `private`：私有的，只有这个类内部能访问

在 Mod 开发中，类和方法通常用 `public`，因为 tModLoader 需要从外部调用它们。

## 3）`override`：重写基类方法

> **[对应概念]**：方法重写、多态

`override` 表示你正在重写基类（父类）中已经存在的方法：

```csharp
public override void SetStaticDefaults()
{
    // 这里是重写的内容
}
```

基类 `ModTile` 已经有一个 `SetStaticDefaults()` 方法，我们用 `override` 来提供自己的实现。

```quiz
type: choice
id: mod-basics-override-meaning
question: |
  `override` 的作用是什么？
options:
  - id: A
    text: |
      创建一个全新的方法
  - id: B
    text: |
      修改基类已有的方法
  - id: C
    text: |
      删除基类的方法
answer: B
explain: |
  `override` 用来重写（替换）基类中已有的方法实现。
```

## 4）`：`表示继承

> **[对应概念]**：继承、面向对象

`class A : B` 意味着：

- `A` 继承自 `B`
- `A` 会拥有 `B` 的所有成员
- `A` 可以添加新的成员或重写 `B` 的方法

```csharp
public class FirstTile : ModTile
```

这表示 `FirstTile` 继承自 `ModTile`，所以 `FirstTile` 自动拥有 `ModTile` 的所有功能。
