---
title: CSharp高级特性 - 深入掌握C#
author: Papyru
category: Modder入门
topic: csharp-advanced
description: 了解委托、事件、LINQ 与异步等高级特性
last_updated: 2026-01-26
prev_chapter: ../Mod开发实践/第一个物品.md
next_chapter: ../Mod开发实践/环境搭建.md
---

基础语法学习完成后，可以继续了解一些常用的 C# 高级特性。它们在复杂模组项目中更常见。

## 目标与前置条件

**目标**：掌握C#中的委托、事件、LINQ和异步编程等高级特性。

**前置条件**：
- 熟悉C#基础语法
- 理解面向对象编程概念
- 有一定的模组开发经验

## 1. 委托(Delegate)

委托是C#中一种引用类型，它存储的是方法的引用，而不是方法的值。

### 委托的基本概念

```csharp
using System;

namespace MyFirstMod
{
    // 定义一个委托类型
    public delegate void MyDelegate(string message);
    
    public class DelegateExample
    {
        public delegate void MyDelegate(string message);
        
        public static void Main(string[] args)
        {
            // 创建委托实例
            MyDelegate myDelegate = new MyDelegate(ShowMessage);
            
            // 调用委托
            myDelegate("Hello, Delegate!");
            
            // 多播委托 - 可以调用多个方法
            MyDelegate multicastDelegate = ShowMessage;
            multicastDelegate += ShowMessageInChinese;
            
            multicastDelegate("Hello, Multicast Delegate!");
        }
        
        public static void ShowMessage(string message)
        {
            Terraria.NewText(message, 255, 255, 255);
        }
        
        public static void ShowMessageInChinese(string message)
        {
            Terraria.NewText($"中文: {message}", 255, 255, 0);
        }
    }
}
```

### 委托在tModLoader中的应用

做Mod时我们需要了解委托的实际应用场景：

```csharp
public class AdvancedItem : ModItem
{
    public override void SetDefaults()
    {
        Item.width = 32;
        Item.height = 32;
        Item.useTime = 15;
        Item.useAnimation = 15;
        Item.useStyle = ItemUseStyleID.Shoot;
        
        // 委托用于自定义武器行为
        CustomWeaponBehavior = CustomAttack;
    }
    
    private void CustomAttack(Player player)
    {
        // 使用委托定义攻击行为
        if (Main.rand.NextFloat() < 0.3f)
        {
            Projectile.NewProjectile(player.position, player.velocity, ProjectileID.Bullet, 10, 2f);
        }
    }
    
    private Action<Player> CustomWeaponBehavior { get; set; }
}
```

## 2. 事件(Event)

事件是基于委托的，提供了一种发布-订阅机制。

### 事件的基本概念

```csharp
using System;

namespace MyFirstMod
{
    public class EventExample
    {
        // 定义事件
        public static event EventHandler<CustomEventArgs> CustomEvent;
        
        public static void Main(string[] args)
        {
            // 订阅事件
            CustomEvent += OnCustomEvent;
            
            // 触发事件
            CustomEvent?.Invoke(null, new CustomEventArgs { Message = "事件被触发了！" });
            
            // 取消订阅
            CustomEvent -= OnCustomEvent;
        }
        
        private static void OnCustomEvent(object sender, CustomEventArgs e)
        {
            Terraria.NewText($"事件处理: {e.Message}", 255, 255, 0);
        }
    }
    
    public class CustomEventArgs : EventArgs
    {
        public string Message { get; set; }
    }
}
```

### 事件在tModLoader中的应用

```csharp
public class ModEventManager
{
    // 模组加载事件
    public static event Action<Mod> OnModLoad;
    
    // NPC生成事件
    public static event Action<NPC> OnNPCSpawn;
    
    // 玩家死亡事件
    public static event Action<Player> OnPlayerDeath;
    
    public static void TriggerModLoad(Mod mod)
    {
        OnModLoad?.Invoke(mod);
        Terraria.NewText($"模组 {mod.Name} 加载完成", 0, 255, 0);
    }
    
    public static void TriggerNPCSpawn(NPC npc)
    {
        OnNPCSpawn?.Invoke(npc);
        Terraria.NewText($"NPC {npc.type} 生成", 255, 255, 0);
    }
}

// 在Main.cs中使用
public class MyFirstMod : Mod
{
    public override void Load()
    {
        ModEventManager.OnModLoad += OnMyModLoad;
    }
    
    private void OnMyModLoad(Mod mod)
    {
        if (mod.Name == "MyFirstMod")
        {
            Terraria.NewText("我的模组加载事件被触发！", 255, 0, 0);
        }
    }
}
```

## 3. LINQ (Language Integrated Query)

LINQ是C#中强大的查询语言，可以简化数据处理。

### LINQ基础

```csharp
using System.Linq;

namespace MyFirstMod
{
    public class LinqExample
    {
        public static void ProcessNPCs()
        {
            // 获取所有NPC
            var allNPCs = Main.npc.Where(n => n != null && n.active);
            
            // 过滤特定类型的NPC
            var enemyNPCs = Main.npc.Where(n => 
                n != null && 
                n.active && 
                n.damage > 0 && 
                n.friendly == false
            );
            
            // 按血量排序
            var sortedNPCs = Main.npc
                .Where(n => n != null && n.active)
                .OrderBy(n => n.life)
                .ToList();
            
            // 统计信息
            int totalNPCs = Main.npc.Count(n => n != null && n.active);
            int enemyCount = Main.npc.Count(n => 
                n != null && n.active && n.friendly == false
            );
            
            Terraria.NewText($"总NPC数: {totalNPCs}, 敌对NPC数: {enemyCount}", 255, 255, 0);
            
            // 使用LINQ查找最近的可攻击NPC
            var nearestEnemy = enemyNPCs
                .OrderBy(n => Vector2.Distance(Main.LocalPlayer.position, n.position))
                .FirstOrDefault();
            
            if (nearestEnemy != null)
            {
                Terraria.NewText($"最近的敌人距离: {Vector2.Distance(Main.LocalPlayer.position, nearestEnemy.position)}", 0, 255, 255);
            }
        }
    }
}
```

### LINQ在物品系统中的应用

```csharp
public class AdvancedItemProcessing
{
    // 获取玩家的所有武器
    public static List<Item> GetPlayerWeapons(Player player)
    {
        return player.inventory
            .Where(item => item != null && item.damage > 0)
            .Where(item => item.useStyle == ItemUseStyleID.Shoot || 
                          item.useStyle == ItemUseStyleID.Swing ||
                          item.useStyle == ItemUseStyleID.Hold)
            .ToList();
    }
    
    // 按稀有度排序物品
    public static List<Item> SortItemsByRarity(List<Item> items)
    {
        return items
            .OrderBy(item => item.rare)
            .ThenBy(item => item.value)
            .ToList();
    }
    
    // 筛选特定属性的物品
    public static List<Item> GetItemsWithSpecialEffects(List<Item> items)
    {
        return items.Where(item => 
            item.prefix != 0 || 
            item.accessory || 
            item.shoot > 0
        ).ToList();
    }
}
```

## 4. 异步编程(Async/Await)

异步编程可以避免游戏界面卡顿，提高性能。

### 异步基础概念

```csharp
using System.Threading.Tasks;
using Terraria;

namespace MyFirstMod
{
    public class AsyncExample
    {
        // 异步方法
        public static async Task<string> LoadTextureAsync(string path)
        {
            // 模拟异步加载纹理
            await Task.Delay(100); // 延迟100毫秒
            return "Texture loaded: " + path;
        }
        
        // 在模组中使用异步
        public async void AsyncItemEffect()
        {
            // 不阻塞主线程的情况下执行长时间操作
            string result = await LoadTextureAsync("MyTexture.png");
            Terraria.NewText(result, 255, 255, 0);
        }
        
        // 异步加载模组资源
        public static async Task<Mod> LoadModAsync(string modName)
        {
            // 异步搜索模组
            var modList = ModLoader.Mods.Where(m => m.Name.Contains(modName));
            
            await Task.Delay(50); // 模拟搜索时间
            return modList.FirstOrDefault();
        }
    }
}
```

### 异步在tModLoader中的应用

```csharp
public class AsyncModLoader
{
    // 异步加载模组内容
    public static async Task LoadModContentAsync()
    {
        Terraria.NewText("开始异步加载模组内容...", 255, 255, 0);
        
        // 异步加载物品
        var itemTask = Task.Run(() => LoadItemsAsync());
        
        // 异步加载NPC
        var npcTask = Task.Run(() => LoadNPCsAsync());
        
        // 等待所有任务完成
        await Task.WhenAll(itemTask, npcTask);
        
        Terraria.NewText("模组内容异步加载完成！", 0, 255, 0);
    }
    
    private static async Task LoadItemsAsync()
    {
        await Task.Delay(100); // 模拟加载时间
        // 这里可以添加实际的物品加载逻辑
    }
    
    private static async Task LoadNPCsAsync()
    {
        await Task.Delay(150); // 模拟加载时间
        // 这里可以添加实际的NPC加载逻辑
    }
}

// 在Main.cs中使用异步
public class MyFirstMod : Mod
{
    public override void Load()
    {
        // 启动异步加载
        AsyncModLoader.LoadModContentAsync();
    }
}
```

## 5. 泛型(Generics)

泛型可以创建类型安全的可重用代码。

### 泛型基础

```csharp
namespace MyFirstMod
{
    // 泛型类
    public class InventoryManager<T>
    {
        private List<T> items = new List<T>();
        
        public void AddItem(T item)
        {
            items.Add(item);
        }
        
        public T GetItem(int index)
        {
            return items[index];
        }
        
        public List<T> GetAllItems()
        {
            return items;
        }
    }
    
    // 泛型方法
    public class Utility
    {
        public static void ProcessList<T>(List<T> list, Action<T> processor)
        {
            foreach (var item in list)
            {
                processor(item);
            }
        }
    }
    
    // 使用泛型
    public class GenericExample
    {
        public static void DemonstrateGenerics()
        {
            // 创建物品库存管理器
            var itemInventory = new InventoryManager<Item>();
            
            // 创建玩家库存管理器
            var playerInventory = new InventoryManager<Player>();
            
            // 使用泛型方法处理列表
            var items = new List<Item> { new Item(), new Item() };
            Utility.ProcessList(items, item => 
            {
                // 处理每个物品
                Terraria.NewText("处理物品", 255, 255, 0);
            });
        }
    }
}
```

### 泛型在模组系统中的应用

```csharp
public class ModContentManager<T> where T : new()
{
    private List<T> contentItems = new List<T>();
    
    public void AddContent(T item)
    {
        contentItems.Add(item);
    }
    
    public T FindContent(Predicate<T> predicate)
    {
        return contentItems.Find(predicate);
    }
    
    public List<T> GetAllContent()
    {
        return contentItems;
    }
}

// 使用泛型管理模组内容
public class ModManager
{
    public ModContentManager<Item> Items { get; set; }
    public ModContentManager<NPC> NPCs { get; set; }
    
    public ModManager()
    {
        Items = new ModContentManager<Item>();
        NPCs = new ModContentManager<NPC>();
    }
}
```

## 6. 扩展方法(Extension Methods)

扩展方法可以为现有类型添加新方法。

### 扩展方法基础

```csharp
namespace MyFirstMod
{
    public static class PlayerExtensions
    {
        // 为Player类添加扩展方法
        public static bool HasItem(this Player player, int itemType)
        {
            return player.inventory.Any(item => item?.type == itemType);
        }
        
        public static void HealFull(this Player player)
        {
            player.statLife = player.statLifeMax2;
            player.statMana = player.statManaMax2;
        }
        
        public static bool IsNearby(this Player player, NPC npc, float distance)
        {
            return Vector2.Distance(player.position, npc.position) <= distance;
        }
    }
    
    public static class ItemExtensions
    {
        // 为Item类添加扩展方法
        public static bool IsWeapon(this Item item)
        {
            return item.damage > 0 && 
                   (item.useStyle == ItemUseStyleID.Swing || 
                    item.useStyle == ItemUseStyleID.Shoot);
        }
        
        public static void AddEnchantment(this Item item, int enchantmentType)
        {
            // 添加附魔逻辑
            Terraria.NewText($"添加附魔: {enchantmentType}", 0, 255, 0);
        }
    }
    
    // 使用扩展方法
    public class ExtensionExample
    {
        public static void UseExtensions()
        {
            var player = Main.LocalPlayer;
            
            // 使用扩展方法
            if (player.HasItem(ItemID.Sword))
            {
                player.HealFull();
                Terraria.NewText("玩家拥有剑且已回满血", 255, 0, 0);
            }
        }
    }
}
```

## 高级特性的实际应用

下面给出这些高级特性在真实 Mod 开发中的组合示例：

```csharp
public class AdvancedModSystem : ModSystem
{
    private Dictionary<string, Action> eventHandlers = new Dictionary<string, Action>();
    private List<ModItem> customItems = new List<ModItem>();
    
    // 使用委托和事件系统
    public static event Action<string> OnCustomEvent;
    
    public override void Load()
    {
        // 注册异步事件处理
        RegisterAsyncHandlers();
        
        // 使用LINQ过滤模组内容
        FilterModContent();
    }
    
    private void RegisterAsyncHandlers()
    {
        // 异步注册事件处理器
        Task.Run(() =>
        {
            // 模拟异步操作
            Thread.Sleep(100);
            
            // 使用委托
            eventHandlers["damage"] = () => 
            {
                Terraria.NewText("伤害事件触发", 255, 0, 0);
            };
        });
    }
    
    private void FilterModContent()
    {
        // 使用LINQ处理模组内容
        var damageItems = ModLoader.Mods
            .SelectMany(m => m.GetContent<ModItem>())
            .Where(item => item.damage > 10)
            .ToList();
            
        Terraria.NewText($"发现 {damageItems.Count} 个高伤害物品", 0, 255, 255);
    }
    
    public override void PostUpdate()
    {
        // 使用扩展方法
        if (Main.LocalPlayer.HasItem(ItemID.MagicMirror))
        {
            Main.LocalPlayer.HealFull();
        }
    }
}
```

## 性能优化建议

做Mod时我们需要了解性能优化的重要性：

### 避免在Update中使用LINQ

```csharp
// 不好的做法 - 每帧都执行LINQ查询
public void BadUpdate()
{
    var enemies = Main.npc.Where(n => n.active && !n.friendly).ToList();
    // 这会每帧创建新列表，影响性能
}

// 好的做法 - 缓存结果或只在需要时计算
public void GoodUpdate()
{
    // 只在敌人数量变化时重新计算
    if (Main.npc.Length != cachedEnemyCount)
    {
        cachedEnemies = Main.npc.Where(n => n.active && !n.friendly).ToArray();
        cachedEnemyCount = Main.npc.Length;
    }
    
    // 使用缓存的数组
    foreach (var enemy in cachedEnemies)
    {
        // 处理敌人
    }
}
```

### 合理使用异步

```csharp
// 在可能阻塞主线程的地方使用异步
public async void LoadLargeTexture()
{
    await Task.Run(() => 
    {
        // 在后台线程加载大纹理
        Thread.Sleep(1000); // 模拟加载时间
    });
    
    // 回到主线程更新UI
    Terraria.NewText("纹理加载完成", 0, 255, 0);
}
```

## 小结与下一步

到这里我们学习了 C# 的几个重要高级特性。它们在简单 Mod 中未必常见，但在大型模组项目中很有价值。

**记住几个要点**：
- 委托和事件提供了一种灵活的事件处理机制
- LINQ可以大大简化数据查询和处理
- 异步编程可以避免游戏卡顿
- 泛型提供了类型安全的代码重用
- 扩展方法可以为现有类型添加新功能

**适用场景**：
- 委托：自定义事件处理系统
- 事件：模组间通信和状态通知
- LINQ：复杂的数据过滤和统计
- 异步：资源加载和长时间操作
- 泛型：通用的数据结构和工具类
- 扩展方法：为tML API添加便捷方法

这些高级特性会让你的Mod开发能力提升一个档次，特别是在处理复杂逻辑时。记住要合理使用，避免过度复杂化代码。

下一步我们可以在这些特性的基础上，继续学习更高级的模组开发技术。
