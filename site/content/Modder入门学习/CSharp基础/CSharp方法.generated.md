---
title: "C# 方法"
description: "学习 C# 方法的定义、参数、返回值和高级特性"
author: OpenCode
topic: csharp-methods
difficulty: intermediate
time: 30分钟
order: 60
last_updated: 2026-01-30
prev_chapter: CSharp变量更多内容
---

## 简介

本章目标：掌握 C# 方法的完整用法，包括参数传递、返回值、重载等特性，能够编写结构清晰的 Mod 代码。

方法是组织和复用代码的基本单元。在 tModLoader 开发中，你会大量使用方法：重写基类方法、创建辅助方法、实现自定义逻辑等。

## 方法基础

方法是封装特定功能的代码块。

### 基本结构

```csharp
// 访问修饰符 返回类型 方法名(参数列表)
// {
//     方法体
// }

public void SayHello()
{
    Console.WriteLine("Hello, Terraria!");
}

public int Add(int a, int b)
{
    return a + b;
}
```

### 方法组成部分

```csharp
public          // 访问修饰符：谁可以调用
int             // 返回类型：返回什么数据
CalculateDamage // 方法名：功能描述
(int baseDmg,   // 参数：输入数据
 float multiplier)
{
    // 方法体：具体实现
    return (int)(baseDmg * multiplier);
}
```

### void 方法

不返回任何值的方法。

```csharp
public void HealPlayer(Player player, int amount)
{
    player.statLife += amount;
    if (player.statLife > player.statLifeMax)
    {
        player.statLife = player.statLifeMax;
    }
}
```

### 带返回值的方法

```csharp
public bool IsPlayerAlive(Player player)
{
    return player.statLife > 0;
}

public string GetRarityColor(int rarity)
{
    switch (rarity)
    {
        case 0: return "白色";
        case 1: return "蓝色";
        case 2: return "绿色";
        default: return "未知";
    }
}
```

## 参数详解

参数是方法接收输入数据的方式。

### 值参数（默认）

传递数据的副本，方法内修改不影响原变量。

```csharp
public void ModifyValue(int value)
{
    value = 100;  // 只影响副本
}

int num = 10;
ModifyValue(num);
// num 仍然是 10
```

### ref 参数

传递变量的引用，方法内修改会影响原变量。

```csharp
public void DoubleValue(ref int value)
{
    value *= 2;  // 修改原变量
}

int num = 10;
DoubleValue(ref num);
// num 变成 20
```

### out 参数

用于返回多个值，调用前不需要初始化。

```csharp
public void GetItemStats(Item item, out int damage, out float speed)
{
    damage = item.damage;
    speed = item.useAnimation;
}

// 使用
int dmg;
float spd;
GetItemStats(player.HeldItem, out dmg, out spd);
```

### 简化语法（C# 7.0+）

```csharp
// 声明同时赋值
GetItemStats(item, out int damage, out float speed);
Console.WriteLine(damage);

// 丢弃不用的返回值
GetItemStats(item, out int dmg, out _);
```

### 可选参数

```csharp
public void CreateProjectile(
    Vector2 position,
    Vector2 velocity,
    int type,
    int damage,
    float knockback = 0f,        // 默认值
    int owner = -1)              // 默认值
{
    // 方法实现
}

// 调用时可省略可选参数
CreateProjectile(pos, vel, type, damage);  // 使用默认值
CreateProjectile(pos, vel, type, damage, 5f);  // 指定 knockback
```

### 命名参数

```csharp
// 不记住参数顺序，按名称传参
CreateProjectile(
    position: player.Center,
    velocity: new Vector2(10, 0),
    type: ProjectileID.Bullet,
    damage: 50,
    knockback: 3f
);
```

## 方法重载

方法重载允许同名方法有不同参数列表。

### 重载规则

方法名相同，但参数数量或类型不同。

```csharp
public class WeaponManager
{
    // 重载 1：无参数
    public void Attack()
    {
        Attack(10, 1.0f);
    }
    
    // 重载 2：一个参数
    public void Attack(int damage)
    {
        Attack(damage, 1.0f);
    }
    
    // 重载 3：两个参数
    public void Attack(int damage, float multiplier)
    {
        int finalDamage = (int)(damage * multiplier);
        // 执行攻击
    }
}
```

### 实际应用

```csharp
public void Heal(int amount)
{
    Heal(amount, false);
}

public void Heal(int amount, bool overheal)
{
    int maxHealth = overheal ? statLifeMax * 2 : statLifeMax;
    statLife = Math.Min(statLife + amount, maxHealth);
}

// 使用
Heal(50);           // 调用第一个
Heal(50, true);     // 调用第二个
```

### 注意事项

```csharp
// 错误：只有返回类型不同，不能重载
public int GetValue() { return 1; }
// public float GetValue() { return 1.0f; }  // 编译错误！

// 错误：参数名不同不算重载
public void Test(int a) { }
// public void Test(int b) { }  // 编译错误！
```

## 静态方法

静态方法属于类，不依赖于实例。

### 定义和调用

```csharp
public static class DamageCalculator
{
    // 静态方法
    public static int CalculateFinalDamage(
        int baseDamage,
        float critMultiplier,
        bool isCrit)
    {
        float multiplier = isCrit ? critMultiplier : 1.0f;
        return (int)(baseDamage * multiplier);
    }
    
    // 不需要实例，直接调用
    public static int Add(int a, int b) => a + b;
}

// 使用
int damage = DamageCalculator.CalculateFinalDamage(50, 2.0f, true);
int sum = DamageCalculator.Add(10, 20);
```

### 工具类设计

```csharp
public static class MathHelper
{
    // 限制数值在范围内
    public static int Clamp(int value, int min, int max)
    {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
    
    // 计算两点距离
    public static float Distance(Vector2 a, Vector2 b)
    {
        return (a - b).Length();
    }
    
    // 线性插值
    public static float Lerp(float a, float b, float t)
    {
        return a + (b - a) * t;
    }
}
```

### 静态 vs 实例方法

```csharp
// 静态：不依赖对象状态
public static bool IsValid(int value) => value > 0;

// 实例：需要访问对象状态
public bool CanAttack()
{
    return cooldown <= 0 && mana >= manaCost;
}
```

## 虚方法和重写

虚方法允许子类提供自定义实现，是 tModLoader 的核心机制。

### 基本概念

```csharp
// 基类定义虚方法
public class ModItem
{
    public virtual void SetDefaults()
    {
        // 默认实现
    }
}

// 子类重写
public class MySword : ModItem
{
    public override void SetDefaults()
    {
        // 自定义实现
        Item.damage = 50;
        Item.width = 40;
    }
}
```

### 常用可重写方法

```csharp
public class CustomWeapon : ModItem
{
    public override void SetDefaults()
    {
        // 设置物品属性
        Item.damage = 100;
        Item.useTime = 20;
    }

    public override bool CanUseItem(Player player)
    {
        // 判断能否使用
        return player.statMana >= 10;
    }

    public override void OnHitNPC(
        Player player, NPC target, int damage, float knockback, bool crit)
    {
        // 击中 NPC 时的逻辑
        target.AddBuff(BuffID.OnFire, 300);
    }

    public override void AddRecipes()
    {
        // 添加合成配方
        CreateRecipe()
            .AddIngredient(ItemID.IronBar, 10)
            .AddTile(TileID.Anvils)
            .Register();
    }
}
```

### base 关键字

```csharp
public override void SetDefaults()
{
    base.SetDefaults();  // 调用父类实现
    
    // 再添加自己的设置
    Item.damage = 50;
}
```

## Lambda 表达式

Lambda 表达式是匿名函数的简洁写法。

### 基本语法

```csharp
// 完整写法
Func<int, int, int> add = (int a, int b) => { return a + b; };

// 简化写法
Func<int, int, int> add2 = (a, b) => a + b;

// 无参数
Action sayHello = () => Console.WriteLine("Hello");

// 单参数（可省略括号）
Func<int, int> square = x => x * x;
```

### 在 Mod 中的应用

```csharp
// 用于回调
ItemLoader.OnItemUse += (item, player) =>
{
    if (item.type == ItemID.ManaCrystal)
    {
        player.statManaMax += 20;
    }
};

// 用于筛选
var enemies = Main.npc.Where(n => n.active && !n.friendly).ToList();

// 用于排序
var sortedItems = items.OrderBy(i => i.damage).ToList();
```

### 闭包

Lambda 可以捕获外部变量。

```csharp
int multiplier = 2;

Func<int, int> multiply = x => x * multiplier;

int result = multiply(5);  // 10
multiplier = 3;
result = multiply(5);      // 15，使用了新的 multiplier
```

## 递归方法

递归是方法调用自身的技巧。

### 基础示例

```csharp
// 阶乘：n! = n * (n-1)!
public static int Factorial(int n)
{
    if (n <= 1) return 1;  // 终止条件
    return n * Factorial(n - 1);  // 递归调用
}

// 使用
int result = Factorial(5);  // 120
```

### 斐波那契数列

```csharp
public static int Fibonacci(int n)
{
    if (n <= 1) return n;
    return Fibonacci(n - 1) + Fibonacci(n - 2);
}
```

### 实际应用：遍历目录

```csharp
public static int CountItemsRecursive(Item[] items, int startIndex)
{
    if (startIndex >= items.Length) return 0;
    
    int count = items[startIndex] != null ? 1 : 0;
    return count + CountItemsRecursive(items, startIndex + 1);
}
```

### 注意事项

```csharp
// 必须设置终止条件，否则无限递归
public static int BadRecursion(int n)
{
    return BadRecursion(n + 1);  // 永远停不下来！
}

// 递归深度过大可能导致栈溢出
// 对于大量数据，考虑使用循环代替
```

## 本章要点（可引用）

- **方法结构**：访问修饰符 + 返回类型 + 方法名 + 参数列表
- **void**：不返回值，用于执行操作
- **return**：返回值并退出方法
- **参数**：值参数（副本）、ref（引用）、out（输出）、可选参数
- **重载**：同名不同参数，提高灵活性
- **静态方法**：属于类，通过类名调用，不依赖实例状态
- **虚方法/重写**：virtual/override，实现多态
- **Lambda**：`(参数) => 表达式`，简洁的匿名函数
- **递归**：方法调用自身，需设置终止条件

## 常见坑（可引用）

### 坑 1：忘记 return

```csharp
public int Calculate(int a, int b)
{
    int result = a + b;
    // 忘记 return result！
}  // 编译错误：不是所有路径都返回值
```

### 坑 2：ref/out 调用时忘记关键字

```csharp
public void Modify(ref int value) { value *= 2; }

int num = 10;
Modify(num);     // 错误！忘记 ref
Modify(ref num); // 正确
```

### 坑 3：重载歧义

```csharp
public void Test(int value) { }
public void Test(float value) { }

Test(5);     // 调用 int 版本
Test(5.0f);  // 调用 float 版本
Test(5.0);   // 错误！double 无法确定调用哪个
```

### 坑 4：递归没有终止条件

```csharp
public int BadSum(int n)
{
    return n + BadSum(n - 1);  // 没有终止条件！
}
// 调用 BadSum(5) 导致栈溢出
```

## 下一步（可引用）

继续学习：

1. **C# 类与对象** - 面向对象编程基础
2. **C# 继承与多态** - 代码复用和扩展
3. **C# 接口** - 定义契约和行为规范

实践建议：重构之前的代码：
- 提取重复代码为方法
- 使用方法重载简化 API
- 创建工具类（静态方法）
- 实现几个自定义物品，重写不同方法

### 示例代码：完整方法应用

```csharp
public class MethodExample : Terraria.ModLoader.ModItem
{
    public override void SetDefaults()
    {
        Item.damage = CalculateBaseDamage(10);
        Item.useTime = GetUseTime(true);
    }
    
    private int CalculateBaseDamage(int level)
    {
        return 50 + level * 5;
    }
    
    private int GetUseTime(bool isFast)
    {
        return isFast ? 15 : 25;
    }
    
    public override bool CanUseItem(Player player)
    {
        return HasEnoughMana(player, 10) && IsNotOnCooldown();
    }
    
    private bool HasEnoughMana(Player player, int cost)
    {
        return player.statMana >= cost;
    }
    
    private bool IsNotOnCooldown()
    {
        return true; // 简化示例
    }
    
    public static void ApplyDamage(NPC target, int damage, float knockback)
    {
        target.StrikeNPC(damage, knockback, 0);
    }
}
```

<!-- generated from: Modder入门学习/CSharp基础/CSharp方法.cs -->
