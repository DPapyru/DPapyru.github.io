---
title: C#语法基础知识
author: 小天使
date: 2026-01-23
last_updated: 2026-01-23
difficulty: beginner
time: 15分钟
description: 介绍C#的语法的基础内容
prev_chapter: null
next_chapter: 下一章
topic: know-csharp
---

本文介绍C#的语法基础和一些关键字介绍，先给出代码：

# 代码部分

```csharp
public class HelloWorldClass
{
    public static void main(string[] args)
    {
        // 这里应该放个Hello World,但是我不会放的！
        // 这里是tModLoader教程,所以我没必要使用控制台输出
    }
}
```

# 关键字介绍

## 访问权限-public

我们最常用的访问权限就是:public，除此之外还有以下访问权限关键字：

- public：任何程序集、任何类均可访问。常用于 API 接口、公共工具类。
- private：仅限定义它的类内部访问，默认成员访问级别。
- protected：定义类及其派生类可访问，适合继承体系。
- internal：仅限同一程序集内访问，避免外部暴露实现细节。
- protected internal：同一程序集或其他程序集的派生类可访问。
- private protected：仅限同一程序集内的派生类访问，限制更严格。

我们最常用的是: `public` `private` `protected`

`internal` 一般是为了给不想给外界访问，只能自己的程序集里面访问才使用，做Mod一般不需要考虑这个。

## 类的定义-class

在此之前，我们需要了解什么是**一等公民**的概念。

### 一等公民

C#作为和Java对标的语言，它主要还是以**面向对象**作为主要设计思路的，所以C#里面的一等公民是:

- 类-class
- 结构体-struct
- 函数-function

嗯对，我们C#的函数也是一等公民，这个和C#的一些特性有关

## 静态-static

# 语法介绍

## 作用域范围

## 方法定义