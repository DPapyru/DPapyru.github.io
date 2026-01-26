---
title: C#数组与集合
author: 小天使
date: 2026-01-26
last_updated: 2026-01-26
difficulty: beginner
time: 15分钟
description: 介绍C#的数组和集合类型
prev_chapter: CSharp控制流.md
next_chapter: CSharp面向对象基础.md
topic: know-csharp
---

这篇教程会开始学习C#中处理多个数据的重要工具:***数组***与***集合***

# 代码部分

```csharp
// 先给一个简单的 tModLoader 相关示例
public class ItemArrayExample : ModItem
{
    private int[] possibleDrops = { 15, 25, 35, 45 }; // 物品可能的掉落数量
    private List<string> itemEffects = new List<string>(); // 物品效果列表
    
    public override void SetDefaults()
    {
        item.damage = possibleDrops[0]; // 使用数组设置基础伤害
        item.useTime = 20;
        item.maxStack = 99;
    }
    
    public override void OnKillNPC(Player player, NPC target, int damage, bool crit)
    {
        // 随机掉落物品
        Random random = new Random();
        int dropCount = possibleDrops[random.Next(possibleDrops.Length)];
        
        Main.NewText($"掉落了 {dropCount} 个物品");
        
        // 添加效果到列表
        itemEffects.Add("击杀加成");
        itemEffects.Add("经验获得");
        
        // 显示所有效果
        string allEffects = string.Join(", ", itemEffects);
        Main.NewText($"当前效果: {allEffects}");
    }
}
```

# 数组

## 基本数组

数组是固定大小的同类型元素集合，在C#中用方括号[]表示：

```csharp
// 一维数组声明
int[] damageValues = { 10, 15, 20, 25 };           // 直接初始化
string[] itemNames = new string[5];                  // 固定大小，未初始化
float[] projectileSpeeds = new float[] { 10.5f, 15.0f, 20.5f }; // 动态初始化

// 访问数组元素
int baseDamage = damageValues[0];                   // 第一个元素，索引从0开始
string firstItemName = itemNames[0];

// 修改数组元素
damageValues[1] = 18;                               // 修改第二个元素为18

// 数组长度
int arrayLength = damageValues.Length;              // 数组长度
int lastIndex = damageValues.Length - 1;            // 最后一个元素的索引

// 在tModLoader中的使用
public override void SetDefaults()
{
    int[] possibleRarities = { ItemRarityID.White, ItemRarityID.Blue, ItemRarityID.Purple };
    item.rare = possibleRarities[0]; // 设置物品稀有度
}
```

数组的索引从 0 开始。Mod 开发中，数组适合存储固定的配置数据，例如伤害表、掉落数量、稀有度等。数组大小在创建后固定，不能动态改变。

### 多维数组

多维数组可以处理二维、三维等复杂数据结构：

```csharp
// 二维数组 - 模拟游戏地图
int[,] tileMap = new int[10, 10];                    // 10x10 的地图
float[,] projectileDirections = new float[,] {       // 弹幕方向数组
    { 1.0f, 0.0f },  // 右
    { -1.0f, 0.0f }, // 左
    { 0.0f, -1.0f }, // 上
    { 0.0f, 1.0f }   // 下
};

// 访问二维数组
tileMap[0, 0] = 1;                                  // 第一行第一列
tileMap[5, 5] = 2;                                  // 第六行第六列

float xDirection = projectileDirections[0, 0];      // 第一个方向
float yDirection = projectileDirections[0, 1];      // 第二个方向

// 三维数组
int[,,] soundEffects = new int[5, 5, 2];           // 三维数组

// 在tModLoader中的应用
public override void ModifyWorldGen(List<FuzeDefinition> fuzes, ref double totalWeight)
{
    // 二维数组存储不同区域的效果
    float[,] zoneEffects = new float[,] {
        { 1.5f, 2.0f, 1.0f },   // 腐化之地
        { 1.2f, 1.5f, 1.8f },   // 猩红之地
        { 1.0f, 1.0f, 1.0f }    // 普通区域
    };
    
    // 根据当前区域应用效果
    int currentZone = GetCurrentZoneIndex();
    for (int i = 0; i < 3; i++)
    {
        Main.NewText($"区域效果 {i}: {zoneEffects[currentZone, i]}");
    }
}
```

多维数组在Mod开发中用的不多，但当你需要处理表格数据、地图数据或多维数据时就会很有用。做Mod的时候，多维数组可以用来存储不同区域的属性、不同类型的配置等，但要注意多维数组的访问和修改比较复杂，一般情况下一维数组就能满足需求。

### 数组操作

```csharp
public class ArrayOperationsExample : ModItem
{
    private int[] playerStats = { 100, 50, 25 };     // 生命值, 魔力, 耐力
    private string[] itemEffects = { "伤害+5", "速度+10", "暴击率+10%" };
    
    public override void SetDefaults()
    {
        // 遍历数组
        Main.NewText("玩家初始属性:");
        for (int i = 0; i < playerStats.Length; i++)
        {
            Main.NewText($"  {playerStats[i]}");
        }
        
        // foreach 遍历
        Main.NewText("物品效果:");
        foreach (string effect in itemEffects)
        {
            Main.NewText($"  - {effect}");
        }
        
        // 数组排序
        int[] damages = { 25, 15, 35, 10, 30 };
        Array.Sort(damages);
        Main.NewText("排序后的伤害值: " + string.Join(", ", damages));
        
        // 数组复制
        int[] copiedDamages = new int[damages.Length];
        Array.Copy(damages, copiedDamages, damages.Length);
        
        // 查找元素
        int targetDamage = 25;
        int index = Array.IndexOf(damages, targetDamage);
        if (index != -1)
        {
            Main.NewText($"找到伤害值 {targetDamage} 在索引 {index} 的位置");
        }
    }
    
    // 检查数组是否包含某个值
    public override bool CanUseItem(Player player)
    {
        int[] usableItems = { ItemID.MagicPower, ItemID.Megaphone, ItemID.ClimbingClaws };
        bool canUse = Array.IndexOf(usableItems, item.type) != -1;
        return canUse;
    }
}
```

数组操作在实际开发中很常用。Mod 开发中，你可能会遍历数组批量设置属性，或排序查找最大值/最小值。数组大小固定，如果需要动态增减元素，使用 `List<T>` 更合适。

# 集合

## `List<T>`

`List<T>`是动态大小的集合，比数组更灵活：

```csharp
// 创建和初始化
List<string> inventory = new List<string>();        // 空列表
List<int> playerInventory = new List<int> { 10, 15, 20 }; // 初始数据
List<float> speeds = new List<float> { 10.5f, 15.0f, 20.5f };

// 添加元素
inventory.Add("魔法卷轴");                           // 添加到末尾
inventory.Add("生命药水");
inventory.Add("魔法药水");

// 插入元素
inventory.Insert(1, "护身符");                      // 在索引1位置插入

// 访问元素
string firstItem = inventory[0];                    // 通过索引访问
int secondItemId = playerInventory[1];

// 移除元素
inventory.Remove("生命药水");                         // 移除具体元素
inventory.RemoveAt(0);                             // 移除索引位置的元素
inventory.Clear();                                  // 清空整个列表

// 获取列表大小
int itemCount = inventory.Count;                     // 元素数量

// 在tModLoader中的使用
public override void ModifyNPCLoot(NPCLoot npcLoot)
{
    List<int> possibleDrops = new List<int>();
    possibleDrops.Add(ItemID.CopperCoin);
    possibleDrops.Add(ItemID.SilverCoin);
    possibleDrops.Add(ItemID.GoldCoin);
    possibleDrops.Add(ItemID.PlatinumCoin);
    
    foreach (int itemId in possibleDrops)
    {
        npcLoot.Add(ItemDropRule.Common(itemId, 10)); // 10% 掉落概率
    }
}
```

`List<T>`在实际开发中比数组用得更多，因为它的灵活性更高。做Mod的时候，你可以用`List<T>`来动态管理物品栏、掉落列表、NPC的行为序列等。`List<T>`的大小可以随时改变，这在很多情况下都非常有用。

## 常用操作

```csharp
public class ListOperationsExample : ModItem
{
    private List<string> itemTooltip = new List<string>();
    private List<int> playerBuffs = new List<int>();
    private List<float> damageMultipliers = new List<float> { 1.0f, 1.2f, 1.5f };
    
    public override void SetDefaults()
    {
        // 遍历列表
        Main.NewText("伤害倍数列表:");
        foreach (float multiplier in damageMultipliers)
        {
            Main.NewText($"  {multiplier}x");
        }
        
        // 检查是否包含
        bool hasMultiplier = damageMultipliers.Contains(1.5f);
        Main.NewText($"是否包含1.5x倍数: {hasMultiplier}");
        
        // 查找索引
        int multiIndex = damageMultipliers.IndexOf(1.2f);
        Main.NewText($"1.2x的索引: {multiIndex}");
        
        // 添加新倍数
        damageMultipliers.Add(2.0f);
        
        // 排序
        damageMultipliers.Sort();
        
        // 删除特定元素
        if (damageMultipliers.Remove(1.0f))
        {
            Main.NewText("移除了1.0x倍数");
        }
        
        Main.NewText("最终倍数列表: " + string.Join(", ", damageMultipliers));
        
        // 使用List管理物品提示
        itemTooltip.Add("基础武器");
        itemTooltip.Add("附加火焰伤害");
        itemTooltip.Add("使用魔法消耗");
        
        // 反向遍历
        Main.NewText("反向显示物品提示:");
        for (int i = itemTooltip.Count - 1; i >= 0; i--)
        {
            Main.NewText($"  {itemTooltip[i]}");
        }
    }
    
    // 使用List管理玩家buff
    public override void UpdateInventory(Player player)
    {
        // 获取当前玩家的所有buff
        for (int i = 0; i < Player.MaxBuffs; i++)
        {
            if (player.buffType[i] > 0 && player.buffTime[i] > 0)
            {
                playerBuffs.Add(player.buffType[i]);
            }
        }
        
        if (playerBuffs.Count > 0)
        {
            Main.NewText($"玩家有 {playerBuffs.Count} 个buff");
        }
    }
}
```

`List<T>` 的操作比数组更丰富。Mod 开发中，`List<T>` 常用于动态管理玩家状态、物品效果、Buff 列表等。它需要动态调整大小，性能通常略低于数组，但大多数情况下影响不明显。

## 数组与集合的对比

| 特性         | 数组                   | `List<T>`                    |
| ------------ | ---------------------- | ---------------------------- |
| **大小**     | 固定，创建后不能改变   | 动态，可以随时增减           |
| **内存**     | 连续内存，性能更好     | 动态分配，性能稍差           |
| **操作**     | 基本操作，排序、复制等 | 丰富操作，添加、删除、查找等 |
| **用途**     | 固定数据，已知数量     | 动态数据，数量不确定         |
| **访问速度** | O(1)                   | O(1)                         |

```csharp
// 数组与集合的选择示例
public class ArrayVsListExample : ModItem
{
    // 数组使用场景：固定的配置数据
    private int[] itemDamageTable = { 10, 15, 20, 25, 30 }; // 固定的伤害配置
    private string[] zoneNames = { "森林", "沙漠", "雪地", "地狱" }; // 固定的区域名称
    
    // List<T>使用场景：动态的管理数据
    private List<int> droppedItems = new List<int>(); // 动态的掉落物品
    private List<Player> nearbyPlayers = new List<Player>(); // 动态的附近玩家
    
    public override void OnHitNPC(Player player, NPC target, int damage, bool crit)
    {
        // 使用数组：选择固定的掉落配置
        int[] dropTable = { ItemID.CopperCoin, ItemID.SilverCoin, ItemID.GoldCoin };
        int selectedDrop = dropTable[new Random().Next(dropTable.Length)];
        
        // 使用List：动态管理掉落物品
        droppedItems.Add(selectedDrop);
        droppedItems.Add(selectedDrop);
        
        // 移除重复的掉落（List的优势）
        for (int i = droppedItems.Count - 1; i > 0; i--)
        {
            if (droppedItems[i] == droppedItems[i - 1])
            {
                droppedItems.RemoveAt(i);
            }
        }
        
        Main.NewText($"掉落物品总数: {droppedItems.Count}");
    }
    
    public override void UpdateInventory(Player player)
    {
        // 使用List动态管理附近玩家
        nearbyPlayers.Clear();
        foreach (Player otherPlayer in Main.player)
        {
            if (otherPlayer != null && otherPlayer.active && otherPlayer != player)
            {
                float distance = Vector2.Distance(player.position, otherPlayer.position);
                if (distance < 200f) // 200像素内
                {
                    nearbyPlayers.Add(otherPlayer);
                }
            }
        }
        
        if (nearbyPlayers.Count > 0)
        {
            Main.NewText($"附近有 {nearbyPlayers.Count} 个玩家");
        }
    }
}
```

数组适合存储固定不变的数据，例如配置表、伤害值、稀有度等；`List<T>` 适合存储需要动态变化的数据，例如物品栏、掉落列表、附近单位等。在 Mod 开发中，两者都很常用。

## 小结

本文涵盖了C#数组与集合的核心知识点：

### 数组相关
- **基本数组**：固定大小的同类型元素集合，索引从0开始
- **多维数组**：二维、三维等复杂数据结构，适合表格和地图数据
- **数组操作**：遍历、排序、复制、查找等基本操作，性能较好但功能有限

### `List<T>`集合相关
- **动态大小**：可以随时增减元素，比数组更灵活
- **丰富操作**：添加、删除、插入、查找、排序等丰富的集合操作
- **遍历方式**：for循环和foreach循环都可以使用，foreach更简洁
- **容量管理**：内部自动管理容量，但也可以手动设置以提升性能

### 选择建议
- **数组**：用于固定数据，已知数量，追求性能
- **`List<T>`**：用于动态数据，数量不确定，需要丰富操作

数组与集合是 C# 常用的数据结构。Mod 开发中，数组适合固定配置数据，`List<T>` 适合动态列表。本文到这里，下一章介绍面向对象基础。
