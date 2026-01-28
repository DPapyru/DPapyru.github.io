---
title: "C#面向对象基础"
description: 理解“类/实例/继承”，能看懂 tModLoader 的 API 结构
author: 小天使
category: Modder入门
topic: know-csharp
date: 2026-01-25
difficulty: beginner
time: 20分钟
last_updated: 2026-01-28
prev_chapter: CSharp数组与集合
next_chapter: CSharp高级特性
---

## 面向对象：为什么教程里全是 class

tModLoader 的 API 设计非常“面向对象”：
- 你通过继承（`:`）拿到一组默认行为
- 你通过 `override` 覆盖（或补充）某些方法，注入自己的逻辑

所以你会在教程里不停见到：`class X : ModItem`、`class Y : ModSystem`。

下面先看一个最小“类 + 实例”的例子：用一个 `Counter` 记录数值，并在方法里调用它。

你可以把类理解成“蓝图”，实例理解成“按蓝图造出来的一件具体物品”。

### 示例代码：类与实例（字段/方法）

```csharp
public class Counter {
    private int _value;

    public void Increment() {
        _value++;
    }

    public int GetValue() {
        return _value;
    }
}
```

## 构造函数：对象怎么初始化

构造函数用来创建对象时初始化状态：
- 名字与类名相同
- 没有返回值

写 Mod 时，你会在很多“配置对象/数据对象”里用到它。

常见建议：
- 把“不变量”放进构造函数里初始化（例如 Name）
- 把“会变化的状态”留在字段里（例如计数值）

### 示例代码：构造函数与只读字段

```csharp
public class NamedCounter {
    public string Name { get; }
    private int _value;

    public NamedCounter(string name) {
        Name = name;
        _value = 0;
    }

    public void Increment() {
        _value++;
    }
}
```

### 示例代码：多态（用基类变量指向子类）

```csharp
public static int UseCounter() {
    Counter c = new Counter();
    c.Increment();
    c.Increment();
    return c.GetValue();
}
```

## 字段 vs 属性

- 字段（field）通常是实现细节：`private int _value;`
- 属性（property）通常是对外接口：`public int Value { get; }`

初学阶段：先把字段写成 `private`，只在需要暴露时再加属性。

常见建议：
- 字段默认 `private`
- 属性默认只读（`get;`），需要修改再考虑 `private set;`

## 继承与 override：你写的“钩子”

`override` 的意思是“我在这个位置接管/补充基类的行为”。

经验法则：
- 优先写清楚“这个 override 的目的是什么”
- 避免把所有逻辑塞进一个 override（拆成小方法）

下面给一个 `ModSystem` 的最小 `override` 示例，用来认识这种形态。

### 示例代码：继承（override 形态）

```csharp
public class DemoSystem : ModSystem {
    public override void Load() {
        // tModLoader 用大量 override 暴露“可插入点”。
    }
}
```

## 组合优先于继承：把复杂逻辑拆成组件

初学者很容易把所有逻辑都塞进一个 `ModItem/ModSystem` 里。

更推荐的做法是“组合”：
- 用普通 class 写可复用的逻辑（例如计算、配置、状态）
- 在 `ModItem/ModSystem` 里只做“连接框架与业务”的薄层

这样你的代码更容易测试、更容易复用，也更不容易变成一坨。

### 示例代码：组合（把计数逻辑放到普通类）

```csharp
public class DamageCalculator {
    public int BaseDamage { get; }

    public DamageCalculator(int baseDamage) {
        BaseDamage = baseDamage;
    }

    public int GetFinalDamage(int bonus) {
        return BaseDamage + bonus;
    }
}
```

## 下一步

下一章补齐一些会在 Mod 开发里高频出现的高级特性：泛型、LINQ、事件/委托等。

<!-- generated from: Modder入门/详细文档/CSharp知识/CSharp面向对象基础.cs -->
