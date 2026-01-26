---
title: C#变量与表达式
author: 小天使
date: 2026-01-25
last_updated: 2026-01-25
difficulty: beginner
time: 15分钟
description: 介绍C#的变量和表达式
prev_chapter: CSharp基本语法.md
next_chapter: CSharp控制流.md
topic: know-csharp
---

这篇教程会开始入门C#的一些重要基础内容:***变量***与***表达式***

# 代码部分

```csharp
// 先给一个简单的 tModLoader 相关示例
public class ItemExample
{
    public override void SetDefaults()
    {
        // 这里直接设置物品属性
        Item.damage = 10;
        Item.useTime = 20;
    }
}
```

# 变量

## 数据类型

### 值类型

值类型是直接存储数据本身的类型，我们做Mod时最常用的是这些：

```csharp
// int - 整数，用于计数值
int playerHealth = 100;           // 玩家生命值
int itemStackCount = 30;          // 物品堆叠数量

// float - 单精度浮点数，用于小数计算
float projectileSpeed = 15.5f;    // 弹幕速度，注意要加f
float itemScale = 1.2f;           // 物品缩放比例

// double - 双精度浮点数，精度更高但占用内存
double damageCalculation = 42.75; // 伤害计算结果

// bool - 布尔值，只有true或false
bool isItemEnabled = true;        // 物品是否启用
bool canAttack = false;           // 是否可以攻击

// char - 单个字符
char itemPrefix = '✨';           // 物品前缀符号
```

在 Mod 开发中，物品数量、玩家等级等计数类数据通常用 `int`；速度、缩放比例等带小数的数值通常用 `float`。除非确实需要高精度计算，一般不必使用 `double`。

### 引用类型

引用类型存储的是对实际数据的引用，最常见的就是string：

```csharp
// string - 字符串，引用类型的特例
string itemName = "炽焰魔剑";       // 物品名称
string itemDescription = "一把燃烧的魔法剑"; // 物品描述
```

string虽然看起来像值类型，但在C#中是引用类型。不过我们平时使用时感觉和值类型差不多，这点需要了解。

### 可空类型

有时候变量可能没有值，这时候就需要可空类型：

```csharp
// int? 可空整数
int? playerLevel = null;         // 玩家等级可能为空（新角色）
int? itemCount = 25;              // 或者有具体数值

// 在Mod中的常见场景：
// 1. 可选配置项
int? optionalDamageBonus = null;  // 伤害加成可能不存在

// 2. 从配置文件读取可能失败的值
int? savedPlayerX = LoadConfig<int>("playerX"); // 可能读取失败返回null

// 使用可空类型时要检查
if (playerLevel.HasValue)
{
    // 使用playerLevel.Value
    Main.NewText($"玩家等级: {playerLevel.Value}");
}
```

可空类型在Mod开发中主要用于处理可选配置、可能失败的读取操作等场景。你需要注意在使用可空类型之前一定要检查它是否有值。

## 变量声明与初始化

### 基本语法

```csharp
// 标准声明：类型 变量名 = 初始值;
string playerName = "冒险者";
int playerMaxHealth = 200;
float movementSpeed = 5.0f;

// 声明但不初始化（默认值）
bool isModEnabled;           // 默认false
int defaultStack = 0;        // 默认0
```

### 使用 var 进行类型推断

```csharp
// 编译器自动推断变量类型
var itemName = "魔法卷轴";      // 自动推断为string
var itemCount = 15;           // 自动推断为int
var itemValue = 3.14f;        // 自动推断为float

// 但要注意，var不能用于没有初始值的情况
// var invalidDeclaration;  // 这样会报错！

// 在tModLoader中的实际应用：
public override void SetDefaults()
{
    var item = new Item();
    item.damage = 15;            // 使用var简化代码
    item.crit = 5;
    item.maxStack = 99;
    
    var playerName = "玩家";      // 从Main.player[Main.myPlayer].name获取
    var currentHealth = Main.player[Main.myPlayer].statLife;
}
```

`var` 可以减少重复的类型书写，但要确保读者能从右侧表达式直接看出类型；在教程示例或公共代码中，写出明确类型通常更易读。

### tModLoader 中的变量使用示例

```csharp
public class ExampleItem : ModItem
{
    // 在这里定义Mod相关的变量
    private int baseDamage = 10;
    private float knockback = 2.5f;
    private string tooltip = "";
    
    public override void SetDefaults()
    {
        item.damage = baseDamage;        // 伤害值
        item.knockback = knockback;      // 击退力
        item.useTime = 20;               // 使用时间
        item.useAnimation = 20;          // 使用动画时间
        item.rare = ItemRarityID.Blue;   // 稀有度
        item.value = Item.buyPrice(0, 3); // 价值
    }
    
    public override void AddRecipes()
    {
        // 配方中的变量使用
        int ingotCount = 10;             // 需要的材料数量
        string materialName = "铜锭";     // 材料名称
        
        Recipe recipe = Recipe.Create(item.type);
        recipe.AddIngredient(ModContent.ItemType<CopperIngot>(), ingotCount);
        recipe.AddTile(TileID.WorkBenches);
        recipe.Register();
    }
}
```

## 变量命名规范

### 命名规则

- **驼峰命名法**：第一个单词首字母小写，后续单词首字母大写
  - `playerHealth`、`itemStackCount`、`isItemEnabled`
  
- **帕斯卡命名法**：所有单词首字母大写（用于类名、方法名）
  - `PlayerHealth`、`ItemStackCount`、`IsItemEnabled`

### 推荐的命名风格

```csharp
// ✅ 推荐的命名（camelCase）
int playerCurrentHealth;
int itemMaximumStack;
float projectileVelocity;
bool isModEnabled;
string itemTooltip;

// ❌ 不推荐的命名
int PlayerHealth;      // 应该用playerHealth（局部变量）
int ItemCount;         // 应该用itemCount
int max;              // 不够具体
int temp1;             // 无意义的命名

// ✅ 类型明确的命名
int maxPlayerHealth;   // 玩家最大生命值
int currentPlayerHealth; // 玩家当前生命值
int maxItemStack;      // 物品最大堆叠数量
```

### tModLoader 中的命名示例

```csharp
public class MyAwesomeItem : ModItem
{
    // 私有字段（camelCase）
    private int baseDamage = 10;
    private float baseKnockback = 3f;
    private string internalName = "AwesomeItem";
    
    // 公共属性（PascalCase）
    public int ExtraDamage { get; set; }
    public float ExtraKnockback { get; set; }
    
    public override void SetDefaults()
    {
        // 局部变量（camelCase）
        int finalDamage = baseDamage + ExtraDamage;
        float finalKnockback = baseKnockback + ExtraKnockback;
        
        // 设置物品属性
        item.damage = finalDamage;
        item.knockback = finalKnockback;
        item.useTime = 25;
        item.useAnimation = 25;
        
        // 命名要体现实际用途
        string displayName = "炽焰魔剑";
        string tooltip = "附加火焰伤害的强力武器";
    }
}
```

# 表达式与运算符

## 算术运算符

### 基本算术运算符

```csharp
// + - * / % 基本运算
int damage = 20;
int critMultiplier = 2;

// 加法
int totalDamage = damage + critDamage;  // 伤害 = 基础伤害 + 暴击伤害

// 减法
int remainingHealth = maxHealth - currentHealth; // 剩余生命值

// 乘法
int finalDamage = damage * critMultiplier;       // 最终伤害（带暴击倍数）

// 除法
float projectileSpeed = 15.0f / 2;    // 弹幕速度计算

// 取余
int stackCount = item.stack % 10;     // 堆叠数量除以10的余数
```

加减乘除用于常见的数值计算，取余运算符 `%` 常用于周期性逻辑，例如按堆叠数量分段处理。

### 运算符优先级

```csharp
// 优先级：() -> */% +-
int result1 = 2 + 3 * 4;      // 14 (3*4=12, 2+12=14)
int result2 = (2 + 3) * 4;    // 20 (2+3=5, 5*4=20)

// 复杂的tModLoader计算
float finalDamage = baseDamage * (1 + critChance * critMultiplier) + flatDamageBonus;
float projectileSpeed = baseSpeed * speedMultiplier + flatSpeedBonus;
```

### tModLoader 示例

```csharp
public override void SetDefaults()
{
    // 基础属性
    item.damage = 15;
    item.crit = 10;           // 暴击率10%
    item.knockback = 4f;
    
    // 计算最终伤害（基础伤害 + 暴击加成）
    int baseDamage = item.damage;
    float critChance = item.crit / 100f;      // 转换为0-1的小数
    float critMultiplier = 2f;                // 暴击倍数2倍
    int flatDamageBonus = 5;                  // 固定伤害加成
    
    float avgDamage = baseDamage * (1 + critChance * critMultiplier) + flatDamageBonus;
    
    // 击退力计算
    float baseKnockback = item.knockback;
    float knockbackMultiplier = 1.5f;         // 击退倍数
    float finalKnockback = baseKnockback * knockbackMultiplier;
    
    // 弹幕速度计算
    float projectileSpeed = 16f;
    float speedMultiplier = 1.2f;
    float finalSpeed = projectileSpeed * speedMultiplier;
    
    Main.NewText($"平均伤害: {avgDamage:F1}, 击退: {finalKnockback:F1}f, 速度: {finalSpeed:F1}");
}
```

## 关系运算符

### 比较运算符

```csharp
// == 等于
bool isCritical = damage > 50;             // 伤害是否超过50
bool is稀有物品 = item.rare >= ItemRarityID.Orange;  // 稀有度是否达到橙色

// != 不等于
bool isNotDefaultItem = item.type != ItemID.None;   // 是否不是默认物品

// < > <= >= 大小比较
bool canCraft = playerLevel >= 10;         // 等级是否达到10级
bool hasEnoughResources = materialCount >= requiredAmount; // 资源是否足够
```

### 在条件判断中的使用

```csharp
public override bool CanUseItem(Player player)
{
    // 玩家生命值超过50%才能使用
    bool hasEnoughHealth = player.statLife > player.statLifeMax / 2;
    
    // 检查是否有足够的魔力
    bool hasEnoughMana = player.statMana >= 20;
    
    // 只能在地面或平台上使用
    bool isOnGround = player.velocity.Y == 0f;
    
    return hasEnoughHealth && hasEnoughMana && isOnGround;
}

public override void UpdateInventory(Player player)
{
    // 根据玩家状态调整属性
    if (player.statLife < player.statLifeMax / 3)
    {
        // 生命值低于1/3时获得加成
        item.damage += 5;
    }
    
    if (player.ZoneCorrupt)
    {
        // 在腐化之地获得额外效果
        item.knockback *= 1.5f;
    }
}
```

## 逻辑运算符

### 基本逻辑运算

```csharp
// && 逻辑与（两边都为true时结果才为true）
bool canAttack = playerCanAttack && hasValidTarget;

// || 逻辑或（两边任意一个为true时结果就为true）
bool canUseItem = isDaytime || hasLightSource;

// ! 逻辑非（取反）
bool isNotMoving = player.velocity.X == 0f && player.velocity.Y == 0f;
bool canCraft = !isNight;                   // 不是夜晚时才能合成
```

逻辑运算符常用于条件判断。Mod 开发中经常需要同时检查多个条件，或判断任意条件是否满足。

### 短路求值特性

```csharp
// && 短路：如果左边为false，右边不会执行
bool isValid = playerHealth > 0 && playerHasItem;  // 如果playerHealth<=0，不会检查playerHasItem

// || 短路：如果左边为true，右边不会执行
bool canAct = isAlive || canRevive;        // 如果isAlive为true，不会检查canRevive

// 实际应用
public override void OnHitNPC(Player player, NPC target, int damage, float knockback, bool crit)
{
    // 短路求值避免空引用
    if (target != null && target.lifeMax > 0)
    {
        target.AddBuff(BuffID.OnFire, 180);  // 给目标上燃烧debuff
    }
    
    // 如果玩家有魔法装备且魔力足够
    if (player.HasItem(ItemID.MagicPower) && player.statMana >= 10)
    {
        player.statMana -= 10;  // 消耗魔力
        player.velocity.Y -= 2f; // 轻微跳跃
    }
}
```

### 复杂条件组合

```csharp
public override bool CanChooseThisItem(InventoryPlayer inventory)
{
    // 多个条件的组合
    bool hasRequiredLevel = playerLevel >= requiredLevel;
    bool hasRequiredItems = CheckRequiredItems();
    bool hasUnlocked = IsItemUnlocked();
    bool canAfford = player.HasEnoughCoins(item.value);
    
    // 必须满足所有条件
    bool canChoose = hasRequiredLevel && hasRequiredItems && hasUnlocked && canAfford;
    
    return canChoose;
}

public override void UpdateInventory(Player player)
{
    // 在特定区域触发效果
    if ((player.ZoneCorrupt || player.ZoneCrimson) && player.statLife < player.statLifeMax / 2)
    {
        // 在腐化之地或猩红之地且生命值低于50%时获得加成
        player.moveSpeed += 0.1f;
    }
    
    // 夜晚时某些效果增强
    if (player.IsUnderground && !Main.dayTime)
    {
        item.damage += 3;
    }
}
```

## 赋值运算符

### 基本赋值运算符

```csharp
// = 基本赋值
int damage = 10;
float speed = 5.0f;
string name = "测试物品";

// += 加法赋值
damage += 5;          // damage = damage + 5
speed += 2.0f;        // speed = speed + 2.0f
name += " (加强版)";  // name = name + " (加强版)"

// -= 减法赋值
damage -= 3;          // damage = damage - 3
speed -= 1.0f;        // speed = speed - 1.0f

// *= 乘法赋值
damage *= 2;          // damage = damage * 2
speed *= 1.5f;        // speed = speed * 1.5f

// /= 除法赋值
damage /= 2;          // damage = damage / 2
speed /= 1.5f;        // speed = speed / 1.5f

// %= 取余赋值
int stacks = 15;
stacks %= 10;         // stacks = stacks % 10 (结果为5)
```

复合赋值运算符可以让代码更简洁，Mod 开发中经常用于累加或累减数值，例如增加伤害、减少使用时间等。

### 复合赋值运算符的使用场景

```csharp
public override void UpdateInventory(Player player)
{
    // 属性叠加
    float bonusDamage = 0f;
    float bonusSpeed = 0f;
    
    // 多个buff的叠加计算
    foreach (var buff in player.buffs)
    {
        if (buff.type == BuffID.Powersurge)
        {
            bonusDamage += 5f;  // 魔力增强buff增加伤害
        }
        if (buff.type == BuffID.Hunter)
        {
            bonusSpeed += 0.15f; // 猎人buff增加速度
        }
    }
    
    // 使用复合赋值简化代码
    item.damage += (int)bonusDamage;  // item.damage = item.damage + (int)bonusDamage;
    item.useTime -= (int)(bonusSpeed * 10);  // 使用时间减少
    item.useAnimation -= (int)(bonusSpeed * 10);
}

public override void OnHitNPC(Player player, NPC target, int damage, float knockback, bool crit)
{
    // 连击效果
    int comboCount = GetComboCount();
    item.damage += comboCount * 2;      // 每次连击增加2点伤害
    
    // 暴击相关
    if (crit)
    {
        knockback *= 1.5f;              // 暴击时击退力增加50%
        item.knockback = knockback;
    }
    
    // 目标生命值相关效果
    if (target.life < target.lifeMax / 4)
    {
        item.damage += 5;               // 对低血量目标额外伤害
    }
}
```

## 类型转换

### 隐式转换

低精度类型可以自动转换为高精度类型：

```csharp
// int -> float (整数转浮点)
int intValue = 42;
float floatValue = intValue;           // 自动转换，42.0f

// int -> double
double doubleValue = intValue;         // 自动转换，42.0

// float -> double
float f = 3.14f;
double d = f;                           // 自动转换，3.14

// 在tModLoader中的使用
int itemDamage = 15;
float projectileSpeed = 10.5f;
double damageCalculation = itemDamage * projectileSpeed; // 自动处理类型转换
```

隐式转换在部分场景下很方便，Mod 开发中也常见 `int` 转 `float` 的情况，例如配置为整数但计算需要小数。

### 显式转换

高精度类型转换为低精度类型需要强制转换：

```csharp
// float -> int (精度丢失)
float floatVal = 42.7f;
int intVal = (int)floatVal;             // 强制转换，结果42（小数部分丢失）

// double -> float
double doubleVal = 123.456;
float floatVal2 = (float)doubleVal;     // 强制转换，精度可能降低

// 在tModLoader中的应用
float damage = 15.7f;
int finalDamage = (int)damage;          // 转换为整数伤害，16（四舍五入到最近的整数）

// 需要注意的是，直接强制转换会截断小数部分
float speed = 5.9f;
int speedInt = (int)speed;              // 结果5，不是6！
```

### Convert 类与 Parse 方法

Convert 类提供各种类型之间的转换：

```csharp
// Convert.ToInt32() 系列
string numStr = "123";
int num1 = Convert.ToInt32(numStr);     // 字符串转整数

double doubleNum = 45.67;
int num2 = Convert.ToInt32(doubleNum);  // 转换为整数（四舍五入）

// int.Parse() 与 int.TryParse()
string text1 = "42";
int parsed1 = int.Parse(text1);          // 解析成功，返回42

string text2 = "not a number";
try 
{
    int parsed2 = int.Parse(text2);      // 解析失败，抛出异常
}
catch (FormatException)
{
    Main.NewText("无法解析数字: " + text2);
}

// 更安全的 TryParse
string text3 = "99";
if (int.TryParse(text3, out int result))
{
    // 解析成功，result = 99
    Main.NewText($"解析成功: {result}");
}
else
{
    Main.NewText("解析失败");
}
```

在 Mod 开发中经常需要从配置文件读取数值，使用 `TryParse` 比 `Parse` 更安全，不会因为解析失败而直接抛出异常。读取外部配置时建议做错误处理与默认值兜底。

### 在Mod中的实际场景

```csharp
public class ConfigurableItem : ModItem
{
    private int bonusDamage;
    private float speedMultiplier;
    
    // 从配置文件读取
    public override void SetStaticDefaults()
    {
        // 读取配置文件
        var config = ModContent.GetInstance<ModConfig>();
        string damageStr = config.GetValue("BonusDamage", "10");
        string speedStr = config.GetValue("SpeedMultiplier", "1.5");
        
        // 使用TryParse安全地转换
        if (int.TryParse(damageStr, out bonusDamage))
        {
            // 配置读取成功
        }
        else
        {
            bonusDamage = 10; // 默认值
        }
        
        if (float.TryParse(speedStr, out speedMultiplier))
        {
            // 配置读取成功
        }
        else
        {
            speedMultiplier = 1.5f; // 默认值
        }
    }
    
    // 从玩家自定义数据读取
    public override void UpdateInventory(Player player)
    {
        // 保存自定义数据时使用Convert类
        if (Main.mouseItem.type == item.type)
        {
            string customData = player.GetModPlayer<CustomPlayerData>().CustomData;
            if (int.TryParse(customData, out int customValue))
            {
                // 使用解析的值
                item.damage += customValue;
            }
        }
    }
}
```

### 字符串插值（简短回顾）

字符串插值使用 `$` 前缀，可以方便地在字符串中嵌入变量：

```csharp
// 基本字符串插值
string itemName = "炽焰魔剑";
int damage = 25;
string tooltip = $"武器: {itemName}, 伤害: {damage}";

// 复杂插值
float speed = 5.0f;
double critChance = 15.5;
string description = $"属性: 伤害{damage} ({critChance}%暴击率), 速度{speed}f";

// 格式化插值
string formatted = $"伤害: {damage:D3} (三位数补零)";   // "伤害: 025"
string formatted2 = $"暴击率: {critChance:P1}";        // "暴击率: 15.5%"
```

字符串插值在调试和显示物品信息时很方便，Mod 开发中常用于在提示文本中展示动态计算的数值。

## 小结

本文涵盖了C#变量与表达式的核心知识点：

### 变量相关
- **值类型与引用类型**：int、float、bool等值类型，string引用类型的特殊性
- **可空类型**：处理可能为null的变量场景，在Mod配置中很实用
- **变量声明与初始化**：标准语法和var类型推断的使用
- **命名规范**：camelCase和PascalCase的正确使用，在tModLoader开发中的最佳实践

### 表达式与运算符
- **算术运算符**：加减乘除取余，运算符优先级理解
- **关系运算符**：比较大小，在条件判断中的具体应用
- **逻辑运算符**：与或非运算，短路求值特性的利用
- **赋值运算符**：复合赋值的简化使用场景

### 类型转换
- **隐式转换**：低精度到高精度的自动转换
- **显式转换**：强制转换的注意事项
- **安全转换**：Convert类和TryParse方法的实际应用
- **字符串处理**：字符串插值在调试和显示中的使用

掌握这些基础知识后，你就具备了tModLoader Mod开发所需的基础语法能力。变量和表达式是每天都要用到的核心概念，熟练掌握它们会让你在编写Mod时事半功倍。你需要了解的是，做Mod的时候一定要注意类型安全和错误处理，这样你的Mod才能更稳定地运行。
