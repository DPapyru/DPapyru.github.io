---
title: C#快速入门
author: 小天使
date: 2026-01-23
last_updated: 2026-01-23
difficulty: beginner
time: 15分钟
description: 快速建立 C# 语法概念，便于阅读后续教程
prev_chapter: null
next_chapter: CSharp基本语法.md
topic: know-csharp
---

本文介绍 C# 的语法基础和常见关键字，先给出一段示例代码：

> 本文侧重快速建立概念；深入内容请结合后续章节与官方文档。

# 代码部分

```csharp
public class HelloWorldClass
{
    public static void Main(string[] args)
    {
        // 这里只演示类与方法的基本结构
        // 在 tModLoader Mod 开发中通常不使用控制台输出
    }
}
```

# 关键字介绍

## 访问权限-public

我们最常用的访问权限是：public，除此之外还有以下访问权限关键字：

- public：任何程序集、任何类均可访问。常用于 API 接口、公共工具类。
- private：仅限定义它的类内部访问，默认成员访问级别。
- protected：定义类及其派生类可访问，适合继承体系。
- internal：仅限同一程序集内访问，避免外部暴露实现细节。
- protected internal：同一程序集或其他程序集的派生类可访问。
- private protected：仅限同一程序集内的派生类访问，限制更严格。

常用的是：`public` `private` `protected`

`internal` 用于限制同一程序集访问，Mod 开发中通常用不到。

## 类的定义-class

在此之前，我们需要了解什么是**一等公民**的概念。

### 一等公民

#### 谁是一等公民？

C#作为和Java对标的语言，它主要还是以**面向对象**作为主要设计思路的，所以C#里面的一等公民是:

- 类-class
- 结构体-struct
- 函数-function

补充：方法同样是 C# 中的重要组成部分，后续会结合委托等特性再说明。

#### 一等公民是什么？

能够有以下行为的即为一等公民：

- 可以被直接传递/赋值
- 作为函数的返回值

## 静态-static

### 定义与作用

`static` 关键字用于声明**静态成员**，属于类型本身而不是类型的实例。

### 主要特点

- **类级别**：静态成员属于类而非对象实例
- **内存共享**：所有实例共享同一个静态成员
- **直接访问**：无需创建类实例即可访问
- **生命周期**：在程序运行期间一直存在

# 语法介绍

## 作用域范围

作用域决定了变量和方法的可访问范围。C# 中主要有以下几种作用域：

### 类级别作用域

在类中定义的字段和方法，其作用域在整个类内部。

```csharp
public class Example
{
    private int classField;  // 类级别字段，整个类可访问

    public void Method()
    {
        classField = 10;  // 可以访问
    }
}
```

### 方法级别作用域

在方法内部定义的变量，只能在该方法内部使用。

```csharp
public void Method()
{
    int localVar = 5;  // 方法级别变量
    // localVar 只能在这个方法内使用
}
```

### 代码块作用域

在代码块（如 if、for、while 等）中定义的变量，只能在该代码块内使用。

```csharp
public void Method()
{
    if (true)
    {
        int blockVar = 10;  // 代码块级别变量
    }
    // blockVar 在这里无法访问
}
```

## 方法定义

### 基本语法

方法定义包含访问修饰符、返回类型、方法名和参数列表。

```csharp
public int Add(int a, int b)
{
    return a + b;
}
```

### 方法组成部分

- **访问修饰符**：如 `public`、`private`、`protected` 等
- **返回类型**：方法返回值的类型，`void` 表示无返回值
- **方法名**：遵循命名规范，通常使用 PascalCase
- **参数列表**：方法接收的参数，多个参数用逗号分隔

### 静态方法

使用 `static` 关键字定义的方法，属于类本身而非实例。

```csharp
public static int Multiply(int a, int b)
{
    return a * b;
}

// 调用方式
int result = ClassName.Multiply(3, 4);
```

### 实例方法

不使用 `static` 关键字的方法，需要通过类的实例调用。

```csharp
public int Subtract(int a, int b)
{
    return a - b;
}

// 调用方式
ClassName obj = new ClassName();
int result = obj.Subtract(10, 3);
```

### 方法重载

同一个类中可以定义多个同名方法，但参数列表必须不同。

```csharp
public int Add(int a, int b)
{
    return a + b;
}

public double Add(double a, double b)
{
    return a + b;
}

public int Add(int a, int b, int c)
{
    return a + b + c;
}
```

### 可选参数

可以为参数指定默认值，调用时可以省略这些参数。

```csharp
public void Greet(string name, string greeting = "你好")
{
    Console.WriteLine($"{greeting}, {name}!");
}

// 调用方式
Greet("小明");           // 输出: 你好, 小明!
Greet("小红", "欢迎");   // 输出: 欢迎, 小红!
```

### 命名参数

调用方法时可以指定参数名称，不按顺序传递参数。

```csharp
public void DisplayInfo(string name, int age, string city)
{
    Console.WriteLine($"姓名: {name}, 年龄: {age}, 城市: {city}");
}

// 调用方式
DisplayInfo(age: 25, name: "张三", city: "北京");
```

## 属性

属性是字段的扩展，提供灵活的机制来读取、写入或计算私有字段的值。

### 自动属性

最简单的属性形式，编译器自动生成私有字段。

```csharp
public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
}
```

### 带验证的属性

可以添加逻辑来验证或处理属性的值。

```csharp
private int _age;

public int Age
{
    get { return _age; }
    set
    {
        if (value < 0)
            throw new ArgumentException("年龄不能为负数");
        _age = value;
    }
}
```

### 只读属性

只有 get 访问器的属性，只能在构造函数中赋值。

```csharp
public class Circle
{
    public double Radius { get; }
    public double Area => Math.PI * Radius * Radius;

    public Circle(double radius)
    {
        Radius = radius;
    }
}
```

## 构造函数

构造函数用于初始化类的实例。

### 基本构造函数

```csharp
public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
}
```

### 构造函数重载

可以定义多个构造函数，参数列表不同。

```csharp
public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }

    public Person(string name) : this(name, 0)
    {
        // 调用另一个构造函数
    }
}
```

## 小结

本文介绍了 C# 的基础语法知识，包括：

- 访问权限关键字的使用
- 类的定义和一等公民概念
- static 关键字的作用
- 作用域范围的理解
- 方法的定义和使用
- 属性的创建
- 构造函数的编写

掌握这些基础知识后，你就可以开始编写简单的 C# 代码，为后续学习 tModLoader 开发打下基础。
