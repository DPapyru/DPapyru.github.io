---
title: "C# 语法基础"
description: "学习 C# 编程语言的基础语法，为编写泰拉瑞亚 Mod 做好准备"
author: OpenCode
topic: csharp-basics
difficulty: beginner
time: 20分钟
order: 10
last_updated: 2026-01-30
next_chapter: CSharp基础数据类型
---

## 简介

本章目标：掌握 C# 语言的基础语法，能够阅读和理解 tModLoader Mod 的基本代码结构。

在学习编写泰拉瑞亚 Mod 之前，你需要了解 C# 这门编程语言的基础知识。本教程针对有编程基础但初次接触 C# 的读者，讲解 Mod 开发中最常用的语法概念。

## 变量与数据类型

变量是存储数据的容器。在 C# 中，每个变量都有明确的数据类型。

### 常用基本类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `int` | 整数 | `int health = 100;` |
| `float` | 单精度浮点数 | `float speed = 5.5f;` |
| `bool` | 布尔值 | `bool isActive = true;` |
| `string` | 字符串 | `string name = "Sword";` |

### 变量声明与赋值

```csharp
// 声明变量
int damage;

// 赋值
damage = 10;

// 声明并初始化
float knockback = 3.5f;
```

> **注意**：`float` 类型需要在数字后加 `f` 后缀，如 `3.5f`。

## 方法（函数）

方法是执行特定任务的代码块。在 Mod 开发中，你会经常重写（override）基类的方法。

### 方法的基本结构

```csharp
// 访问修饰符 返回类型 方法名(参数列表)
public void SetDefaults()
{
    // 方法体
    Item.damage = 10;
    Item.width = 20;
}
```

### 带返回值的方法

```csharp
public int CalculateDamage()
{
    int baseDamage = 10;
    int bonus = 5;
    return baseDamage + bonus;  // 返回 15
}
```

### 带参数的方法

```csharp
public void SetStats(int damage, float speed)
{
    Item.damage = damage;
    Item.useAnimation = (int)(60 / speed);
}
```

## 类与对象

类是 C# 的蓝图，定义了对象的属性和行为。tModLoader 中的武器、物品、NPC 等都是类。

### 类的基本结构

```csharp
// 声明一个类，继承自 ModItem
public class MySword : ModItem
{
    // 字段（成员变量）
    private int specialDamage;
    
    // 方法
    public override void SetDefaults()
    {
        Item.damage = 10;
        Item.width = 40;
    }
}
```

### 访问修饰符

| 修饰符 | 说明 |
|--------|------|
| `public` | 任何地方都可访问 |
| `private` | 仅在类内部可访问 |
| `protected` | 类内部和子类可访问 |
| `override` | 重写父类的方法 |

## 命名空间

命名空间用于组织代码，避免命名冲突。所有 Mod 类都应该放在适当的命名空间中。

### 声明命名空间

```csharp
namespace MyMod.Items.Weapons
{
    public class MySword : ModItem
    {
        // 类定义
    }
}
```

### using 语句

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;
using Microsoft.Xna.Framework;

namespace MyMod.Items
{
    // 类定义
}
```

常用命名空间：
- `Terraria` - 游戏核心类
- `Terraria.ID` - ID 常量定义
- `Terraria.ModLoader` - tModLoader API
- `Microsoft.Xna.Framework` - 向量、颜色等数学类

## 控制流程

控制代码执行的顺序和条件。

### if / else if / else

```csharp
public override bool CanUseItem(Player player)
{
    if (player.statMana >= 10)
    {
        // 有足够魔力
        return true;
    }
    else if (player.statMana >= 5)
    {
        // 魔力不足但有少量
        return false;
    }
    else
    {
        // 完全没有魔力
        return false;
    }
}
```

### for 循环

```csharp
public override void AddRecipes()
{
    for (int i = 0; i < 3; i++)
    {
        // 执行 3 次
        CreateRecipe()
            .AddIngredient(ItemID.Wood, 1)
            .Register();
    }
}
```

### foreach 循环

```csharp
public override void OnHitNPC(Player player, NPC target, int damage, float knockback, bool crit)
{
    // 遍历玩家身上的所有 buff
    foreach (int buffType in player.buffType)
    {
        if (buffType > 0)
        {
            // 处理每个 buff
        }
    }
}
```

## 本章要点（可引用）

- **变量**：使用 `int`, `float`, `bool`, `string` 等类型存储数据
- **方法**：使用 `public void MethodName()` 定义行为，使用 `return` 返回值
- **类**：使用 `class` 定义蓝图，使用 `:` 继承父类，使用 `override` 重写方法
- **命名空间**：使用 `namespace` 组织代码，使用 `using` 引入其他命名空间
- **控制流**：使用 `if/else` 做条件判断，使用 `for` 和 `foreach` 做循环

## 常见坑（可引用）

### 坑 1：float 类型缺少 f 后缀

```csharp
// 错误
float speed = 5.5;  // 编译错误

// 正确
float speed = 5.5f;
```

### 坑 2：方法名大小写错误

C# 区分大小写，`SetDefaults` 和 `setDefaults` 是不同的。

```csharp
// 错误
public override void setDefaults() { }

// 正确
public override void SetDefaults() { }
```

### 坑 3：忘记 override 关键字

```csharp
// 错误 - 这会创建新方法而不是重写
public void SetDefaults() { }

// 正确
public override void SetDefaults() { }
```

## 下一步（可引用）

继续学习：

1. **创建第一个武器** - 将语法知识应用到实际 Mod 开发
2. **类与面向对象** - 深入理解继承、多态等概念
3. **tModLoader API** - 学习常用类和方法

建议：打开 Visual Studio，跟着教程编写示例代码，编译并测试效果。

### 示例代码：完整物品类

```csharp
public class ExampleSword : Terraria.ModLoader.ModItem
{
    public override void SetDefaults()
    {
        Item.damage = 10;
        Item.width = 40;
        Item.height = 40;
        Item.useTime = 20;
        Item.useAnimation = 20;
        Item.useStyle = Terraria.ID.ItemUseStyleID.Swing;
        Item.knockBack = 6;
        Item.value = Terraria.Item.buyPrice(silver: 50);
        Item.rare = Terraria.ID.ItemRarityID.Green;
        Item.UseSound = Terraria.ID.SoundID.Item1;
    }
}
```

<!-- generated from: Modder入门学习/CSharp基础/CSharp语法基础.cs -->
