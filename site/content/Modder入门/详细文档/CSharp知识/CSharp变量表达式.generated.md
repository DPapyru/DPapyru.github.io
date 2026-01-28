---
title: "C#变量与表达式"
description: 把“变量是什么、表达式怎么写、为什么会报错”一次讲清
author: 小天使
category: Modder入门
topic: know-csharp
date: 2026-01-25
difficulty: beginner
time: 15分钟
last_updated: 2026-01-28
prev_chapter: CSharp基本语法
next_chapter: CSharp控制流
---

## 变量：名字 + 类型 + 生命周期

变量可以理解为“给一块数据起名字”，它通常由三部分构成：
- 类型（比如 `int` / `float` / `bool` / `string`）
- 名字（比如 `damage` / `speed`）
- 当前作用域内的生命周期（离开 `{ }` 就用不了）

初学最常见的问题：变量声明在某个 `{ }` 里，出了这个 `{ }` 就找不到它。

建议你养成两条习惯：
- 变量尽量“就近声明”，离使用位置越近越好
- 变量名表达含义：`baseDamage` 比 `a` 更容易读懂

你会经常在 Mod 代码里看到这种变量命名风格：
- `baseXxx`：基础值
- `bonusXxx`：加成值
- `finalXxx`：最终值

## 类型：值类型 vs 引用类型（先记住差异）

你不需要立刻掌握所有细节，但至少要记住：
- 值类型（例如 `int`/`float`/`bool`）赋值时复制“值”
- 引用类型（例如大多数 `class`）赋值时复制“引用”（指向同一对象）

`string` 看起来像引用类型，但它是不可变的：对它“修改”时，本质是生成新字符串。

下面是一段最小示例：`int/float/bool/string` 的声明与赋值。

常见坑：
- `float` 需要 `f` 后缀：`12.5f`，否则会被当成 `double`
- `int` 的除法是整数除法：`5 / 2` 的结果是 `2`

### 示例代码：值类型 / 引用类型 / string

```csharp
public static void TypeExample() {
    int count = 3;          // 值类型：复制的是“值”
    float speed = 12.5f;    // 注意 f 后缀
    bool enabled = true;

    string name = "Sword";  // string 是引用类型（但不可变）

    _ = count;
    _ = speed;
    _ = enabled;
    _ = name;
}
```

## 常用写法：var 与类型推断

`var` 不是“动态类型”，它仍然是静态类型，只是由编译器从右侧推断出来：

- `var x = 1;` -> `x` 的类型是 `int`
- `var list = new List<int>();` -> `list` 的类型是 `List<int>`

建议用法：
- 右侧很清晰：可以用 `var`（例如 `new List<int>()`）
- 右侧不清晰：明确写类型（例如 `int damage = GetDamage()`）

一句话总结：`var` 用来减少重复，不用来隐藏含义。

### 示例代码：var（类型推断）

```csharp
public static void VarExample() {
    var x = 1;
    var text = "hello";
    _ = x;
    _ = text;
}
```

## 表达式：把数据算出来

表达式就是“能算出一个值的一段写法”，例如：
- `a + b`
- `x > 0`
- `flag ? A : B`

做 Mod 时最常见的用法：把多个条件组合起来，得到一个最终数值（伤害、速度、概率等）。

下面先看一段“算术 + 逻辑 + 三元表达式”的组合示例。

常见坑：
- `&&` / `||` 是短路运算：左边决定结果时，右边不会执行
- 逻辑优先级不确定时就加括号：`(a && b) || c`

另一个常见坑：整数除法。
- `5 / 2` 等于 `2`
- 想要小数：至少一边是浮点数（例如 `5f / 2`）

### 示例代码：表达式与运算符（算术 / 逻辑 / 三元）

```csharp
public static void ExpressionExample(int baseDamage, bool crit) {
    int bonus = crit ? 10 : 0;
    int finalDamage = baseDamage + bonus;

    bool shouldShow = finalDamage > 0 && crit;
    _ = shouldShow;
}
```

## 类型转换：显式转换与 TryParse

你会经常遇到“类型不匹配”的编译错误：
- `int` 和 `float` 混算
- 从字符串读配置，需要转成数字

经验法则：
- 可控场景：用显式转换 `(int)value`
- 不可控输入：用 `TryParse`（失败时不会抛异常）

常见坑：
- 浮点转整数会截断：`(int)3.9f` 结果是 `3`
- 字符串解析要考虑失败：不要用 `int.Parse` 直接硬转（除非你能保证输入永远合法）

### 示例代码：TryParse（安全解析）

```csharp
public static bool TryParseInt(string text, out int value) {
    return int.TryParse(text, out value);
}
```

## 数学细节：整数除法与取模

做数值逻辑时经常会踩两个点：

1）整数除法：
- `5 / 2` 结果是 `2`
- 想要 2.5：用 `5f / 2` 或 `5 / 2f`

2）取模（余数）：
- `a % b` 表示 a 除以 b 的余数
- 常用在“每 N 次触发一次”的逻辑里

### 示例代码：整数除法与取模

```csharp
public static float Average(int sum, int count) {
    if (count <= 0) return 0f;
    return sum / (float)count;
}

public static bool EveryN(int tick, int n) {
    if (n <= 0) return false;
    return tick % n == 0;
}
```

### 示例代码：把表达式放进 tModLoader SetDefaults

```csharp
public class DemoItem : ModItem {
    public override void SetDefaults() {
        // 变量保存“中间结果”，表达式用于组合逻辑。
        int baseDamage = 10;
        int rarityBonus = 2;

        Item.damage = baseDamage + rarityBonus;
        Item.DamageType = DamageClass.Melee;

        Item.width = 20;
        Item.height = 20;
        Item.rare = ItemRarityID.Blue;
    }
}
```

## 下一步

下一章进入控制流：`if/else`、循环、以及“什么时候用哪个结构”。

<!-- generated from: Modder入门/详细文档/CSharp知识/CSharp变量表达式.cs -->
