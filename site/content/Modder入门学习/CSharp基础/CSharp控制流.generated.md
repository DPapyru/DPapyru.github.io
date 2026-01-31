---
title: "C# 控制流"
description: "掌握 C# 的条件判断和循环结构，控制程序执行流程"
author: OpenCode
topic: csharp-controlflow
difficulty: beginner
time: 25分钟
order: 40
last_updated: 2026-01-30
prev_chapter: CSharp变量与表达式.generated.md
next_chapter: CSharp变量更多内容.generated.md
---

## 简介

本章目标：掌握 C# 中的条件判断和循环结构，能够根据不同条件执行不同的代码逻辑。

控制流是程序的"大脑"，决定了代码在什么条件下执行、执行多少次。在 tModLoader Mod 开发中，控制流无处不在：判断玩家是否有足够魔力、循环生成多个弹幕、根据条件切换 AI 状态等。

## if 语句

if 语句是最基本的条件判断结构。

### 基本语法

```csharp
if (条件)
{
    // 条件为 true 时执行
}
```

### if-else

```csharp
int health = 30;

if (health > 50)
{
    // 健康状态良好
}
else
{
    // 需要治疗
}
```

### if-else if-else

```csharp
int mana = 75;

if (mana >= 100)
{
    // 魔力充足
}
else if (mana >= 50)
{
    // 魔力中等
}
else if (mana >= 25)
{
    // 魔力偏低
}
else
{
    // 魔力不足
}
```

### 嵌套 if

```csharp
if (player.active)
{
    if (player.statLife < player.statLifeMax)
    {
        // 玩家受伤，可以施加治疗效果
    }
}
```

### 简写形式（只有一行时）

```csharp
if (health <= 0) player.KillMe();

// 等同于
if (health <= 0)
{
    player.KillMe();
}
```

## switch 语句

switch 用于多分支选择，比多个 if-else 更清晰。

### 基本语法

```csharp
int rarity = 3;

switch (rarity)
{
    case 0:
        // 普通品质
        break;
    case 1:
    case 2:
        // 稀有品质（多个 case 共享代码）
        break;
    case 3:
        // 史诗品质
        break;
    default:
        // 默认情况
        break;
}
```

### 字符串 switch（C# 7.0+）

```csharp
string element = "fire";

switch (element)
{
    case "fire":
        // 火属性效果
        break;
    case "ice":
        // 冰属性效果
        break;
    case "lightning":
        // 雷属性效果
        break;
    default:
        // 无属性
        break;
}
```

### switch 表达式（C# 8.0+，更简洁）

```csharp
string GetRarityName(int rarity) => rarity switch
{
    0 => "普通",
    1 => "稀有",
    2 => "史诗",
    3 => "传说",
    _ => "未知"  // 默认情况
};
```

## for 循环

for 循环用于已知次数的重复执行。

### 基本语法

```csharp
for (初始化; 条件; 迭代)
{
    // 循环体
}
```

### 示例

```csharp
// 生成 5 个弹幕
for (int i = 0; i < 5; i++)
{
    Projectile.NewProjectile(...);
}

// 倒序遍历
for (int i = 10; i > 0; i--)
{
    // 从 10 到 1
}

// 步长为 2
for (int i = 0; i < 10; i += 2)
{
    // 0, 2, 4, 6, 8
}
```

### 多重循环

```csharp
// 生成网格
for (int x = 0; x < 3; x++)
{
    for (int y = 0; y < 3; y++)
    {
        // 创建 3x3 网格中的每个位置
    }
}
```

## while 和 do-while

while 循环在条件满足时持续执行。

### while 循环

```csharp
int countdown = 5;

while (countdown > 0)
{
    // 执行操作
    countdown--;
}
```

### do-while 循环

保证至少执行一次。

```csharp
int attempts = 0;
bool success = false;

do
{
    attempts++;
    success = TryCraftItem();
} while (!success && attempts < 3);
```

### 使用场景对比

```csharp
// for：已知循环次数
for (int i = 0; i < enemyCount; i++)
{
    // 处理每个敌人
}

// while：未知循环次数，条件控制
while (boss.active)
{
    // 持续更新 BOSS AI
}

// do-while：至少执行一次
do
{
    ShowTutorial();
} while (player.WantsToRepeatTutorial);
```

## foreach 循环

foreach 用于遍历集合中的每个元素。

### 基本语法

```csharp
foreach (元素类型 变量名 in 集合)
{
    // 处理每个元素
}
```

### 遍历数组

```csharp
int[] damages = { 10, 20, 30, 40, 50 };

foreach (int damage in damages)
{
    totalDamage += damage;
}
```

### 遍历玩家 Buff

```csharp
// 检查玩家身上的所有 buff
foreach (int buffType in player.buffType)
{
    if (buffType > 0)
    {
        // 处理这个 buff
    }
}
```

### 遍历物品栏

```csharp
foreach (Item item in player.inventory)
{
    if (item != null && item.active)
    {
        // 处理物品
    }
}
```

### 与 for 的区别

```csharp
// for：需要索引时
for (int i = 0; i < items.Length; i++)
{
    // 知道当前是第几个：i
    items[i].slot = i;
}

// foreach：只需要值时（更简洁）
foreach (Item item in items)
{
    // 直接处理 item
}
```

## break 和 continue

break 和 continue 用于控制循环流程。

### break - 跳出循环

```csharp
// 找到第一个可用的物品槽
int availableSlot = -1;
for (int i = 0; i < 50; i++)
{
    if (player.inventory[i] == null)
    {
        availableSlot = i;
        break;  // 找到了，退出循环
    }
}
```

### continue - 跳过当前迭代

```csharp
// 给所有活着的敌人造成伤害
foreach (NPC npc in Main.npc)
{
    if (!npc.active || npc.friendly)
    {
        continue;  // 跳过友方和死亡的 NPC
    }
    
    // 造成伤害
    npc.StrikeNPC(damage);
}
```

### return - 退出方法

```csharp
public bool CanUseItem(Player player)
{
    if (player.statMana < manaCost)
    {
        return false;  // 魔力不足，直接返回
    }
    
    // 其他检查...
    return true;
}
```

## 条件运算符

条件运算符（三元运算符）是 if-else 的简写形式。

### 基本语法

```csharp
条件 ? 值1 : 值2
// 如果条件为 true，返回值1；否则返回值2
```

### 示例

```csharp
int health = 30;
string status = health > 50 ? "健康" : "危险";

// 等同于：
string status;
if (health > 50)
    status = "健康";
else
    status = "危险";
```

### 嵌套条件

```csharp
string rarityName = rarity switch
{
    0 => "普通",
    1 => "稀有",
    2 => "史诗",
    _ => "传说"
};

// 或使用三元（较复杂，不推荐嵌套太多层）
string rarityName2 = rarity == 0 ? "普通" :
                    rarity == 1 ? "稀有" :
                    rarity == 2 ? "史诗" : "传说";
```

### 空合并和空条件

```csharp
// 空合并 ??
string name = itemName ?? "未知物品";  // 如果 itemName 为 null，使用默认值

// 空条件 ?.（C# 6.0+）
int? count = player?.inventory?.Length;  // 安全访问，避免 NullReferenceException
```

## 本章要点（可引用）

- **if**：条件判断的基础，支持 else 和 else if
- **switch**：多分支选择，比多个 if-else 更清晰
- **for**：已知次数的循环，格式 `(初始化; 条件; 迭代)`
- **while**：条件满足时循环，可能一次都不执行
- **do-while**：至少执行一次的循环
- **foreach**：遍历集合元素，语法简洁
- **break**：跳出当前循环
- **continue**：跳过当前迭代，继续下一次
- **?:**：条件运算符，if-else 的简写形式

## 常见坑（可引用）

### 坑 1：死循环

```csharp
// 错误：忘记更新条件变量
int i = 0;
while (i < 10)
{
    // 执行操作
    // 忘记 i++，无限循环！
}
```

### 坑 2：foreach 修改集合

```csharp
// 错误：不能在 foreach 中修改集合
foreach (var item in items)
{
    item = new Item();  // 编译错误！
}

// 正确：使用 for 循环
for (int i = 0; i < items.Length; i++)
{
    items[i] = new Item();
}
```

### 坑 3：switch 忘记 break

```csharp
// 错误：case 没有 break，会"穿透"到下一个 case
switch (value)
{
    case 1:
        DoSomething();
        // 忘记 break！
    case 2:
        DoOtherThing();  // value=1 时也会执行到这里
        break;
}
```

### 坑 4：条件判断的优先级

```csharp
// 错误理解
if (a > b && c > d || e > f)  // 容易混淆

// 正确：用括号明确意图
if ((a > b && c > d) || e > f)
```

## 下一步（可引用）

继续学习：

1. **C# 变量更多内容** - 深入了解 const、static、作用域
2. **C# 方法** - 学习如何封装和组织代码
3. **C# 类与对象** - 面向对象编程基础

实践建议：编写一个完整的物品系统，包含：
- 根据玩家属性计算伤害（if-else）
- 批量生成弹幕（for 循环）
- 搜索物品栏（foreach + break）
- 状态机切换（switch）

### 示例代码：控制流应用

```csharp
public class ControlFlowExample : Terraria.ModLoader.ModItem
{
    public override bool CanUseItem(Player player)
    {
        // 多种条件组合
        if (player.statMana >= 10 && !player.HasBuff(BuffID.Cursed))
        {
            return true;
        }
        return false;
    }
    
    public override void OnHitNPC(Player player, NPC target, int damage, float knockback, bool crit)
    {
        // switch 判断目标类型
        switch (target.type)
        {
            case NPCID.Zombie:
            case NPCID.Skeleton:
                // 对亡灵造成额外伤害
                target.AddBuff(BuffID.OnFire, 300);
                break;
            case NPCID.BlueSlime:
                // 对史莱姆特殊效果
                knockback *= 2;
                break;
        }
    }
}
```

<!-- generated from: Modder入门学习/CSharp基础/CSharp控制流.cs -->
