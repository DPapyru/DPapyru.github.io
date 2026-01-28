---
title: C#控制流
author: 小天使
date: 2026-01-26
last_updated: 2026-01-26
difficulty: beginner
time: 15分钟
description: 介绍C#的条件语句和循环结构
prev_chapter: CSharp变量表达式.md
next_chapter: CSharp数组与集合.md
topic: know-csharp
---

本文介绍C#的条件语句和循环结构，先给出代码:

# 代码部分

```csharp
public class MyModItem : ModItem
{
    public override void SetDefaults()
    {
        // 这里先提出来，我们来看看如果武器连击三次就触发特殊效果
        Item.damage = 20;
        Item.useTime = 20;
        Item.useAnimation = 20;
        Item.useStyle = ItemUseStyleID.Swing;
        Item.value = Item.buyPrice(0, 1, 0, 0);
        Item.rare = ItemRarityID.Blue;
    }

    public override bool? UseItem(Player player)
    {
        // 这里先看一个简单的条件判断
        if (player.ownedProjectileCounts[ModContent.ProjectileType<MySwordProjectile>()] < 3)
        {
            // 如果投射物数量少于3个，就发射一个
            Projectile.NewProjectile(player.GetSource_ItemUse(Item), player.Center, 
                player.velocity, ModContent.ProjectileType<MySwordProjectile>(), 
                Item.damage, Item.knockBack, player.whoAmI);
            return true;
        }
        
        // 否则就不发射
        return null;
    }
}
```

# 条件语句

## if/else/else if

我们先来看看这个经典的例子：

```csharp
public class MySpecialArmor : ModItem
{
    public override void SetStaticDefaults()
    {
        DisplayName.SetDefault("特殊护甲");
        Tooltip.SetDefault("血量低于30%时获得额外15%伤害加成");
    }

    public override void UpdateEquip(Player player)
    {
        // 这里就是if/else的经典用法
        if (player.statLife <= player.statLifeMax2 * 0.3f)
        {
            // 血量低于30%时，增加15%伤害
            player.GetDamage().Flat += 0.15f;
            
            // 同时给玩家加个debuff提示
            player.AddBuff(BuffID.Poisoned, 1);
        }
        else
        {
            // 血量正常时，显示一个特效
            Main.NewText("护甲已激活", Color.Green);
        }
        
        // 再来看看else if的用法
        if (player.statLife <= player.statLifeMax2 * 0.1f)
        {
            // 血量低于10%时，额外加5%伤害
            player.GetDamage().Flat += 0.05f;
        }
        else if (player.statLife <= player.statLifeMax2 * 0.2f)
        {
            // 血量低于20%时，额外加3%伤害
            player.GetDamage().Flat += 0.03f;
        }
        // 做Mod时，我们经常需要根据玩家状态来调整属性
    }
}
```

**做Mod时**，我们经常需要根据玩家的状态、物品组合、环境条件来决定不同的行为。`if/else/else if` 就是最常用的工具，它允许你的代码根据不同的情况执行不同的逻辑。

**做Mod一般需要**：检查玩家状态（血量、魔法值、装备）、检查游戏时间（白天/夜晚）、检查环境（水下、沙暴）等。

**做Mod不需要考虑**：过于复杂的嵌套条件（会导致代码难以维护），尽量使用逻辑与(`&&`)、逻辑或(`||`)来简化条件判断。

## switch/case

`switch/case` 适用于多选一的场景：

```csharp
public class MyModProjectile : ModProjectile
{
    public override void AI()
    {
        Projectile.ai[1]++;
        
        // 根据不同的AI阶段执行不同的行为
        switch ((int)Projectile.ai[0])
        {
            case 0:  // 初始化阶段
                Projectile.velocity *= 0.95f;  // 逐渐减速
                if (Projectile.velocity.Length() < 0.5f)
                {
                    Projectile.ai[0] = 1;  // 切换到追踪阶段
                }
                break;
                
            case 1:  // 追踪玩家阶段
                Player player = Main.player[Projectile.owner];
                Vector2 targetPos = player.Center;
                Vector2 direction = targetPos - Projectile.Center;
                direction.Normalize();
                Projectile.velocity = direction * 8f;  // 加速追踪
                break;
                
            case 2:  // 爆炸阶段
                Projectile.velocity = Vector2.Zero;
                Projectile.timeLeft = 30;  // 30帧后爆炸
                break;
                
            default:
                // 默认情况，通常不需要处理
                break;
        }
        
        // 做Mod时，我们经常需要根据不同的游戏状态来切换行为模式
    }
}
```

**做Mod时**，`switch/case` 非常适合处理状态机、不同的游戏阶段、根据类型选择不同的处理逻辑等。

**做Mod一般需要**：处理NPC不同的行为模式、物品不同的使用状态、怪物不同的攻击阶段等。

**做Mod不需要考虑**：在 switch 中使用复杂的条件判断（可以用 if 代替），注意每个 case 后面一定要有 `break` 语句。

# 循环语句

## for 循环

`for` 循环适合需要明确知道循环次数的场景：

```csharp
public class MyBuff : ModBuff
{
    public override void Update(Player player, ref int buffIndex)
    {
        // 每3秒给玩家恢复10点血量
        for (int i = 0; i < 5; i++)  // 循环5次
        {
            if (player.statLife < player.statLifeMax2 && 
                Main.LocalPlayer == player && 
                player.IsLocalPlayer)
            {
                player.statLife += 2;  // 每次恢复2点血
                player.HealEffect(2);  // 显示治疗特效
            }
            
            // 每次循环间隔60帧（1秒）
            if (i < 4) 
            {
                Main.NewText("治疗效果正在生效...", Color.LimeGreen);
                NPC.NewNPC(player.GetSource_Buff(this.Type), (int)player.Center.X, 
                    (int)player.Center.Y, NPCID.Guide, 
                    ai0: 0, ai1: 0, ai2: 0, ai3: 0);
            }
        }
        
        // 做Mod时，我们经常需要循环处理多个物品或实体
    }
}
```

**做Mod时**，`for` 循环经常用来处理批量操作，比如检查多个物品、创建多个实体、计算多个数值等。

**做Mod一般需要**：遍历玩家背包中的物品、检查某个范围内的NPC、创建多个投射物等。

**做Mod不需要考虑**：过大的循环次数（会导致游戏卡顿），避免在 Update 或 AI 方法中进行大量循环计算。

## foreach 循环

`foreach` 循环适合遍历集合或数组：

```csharp
public class MyGlobalNPC : GlobalNPC
{
    public override void PostAI(NPC npc)
    {
        if (npc.type == NPCID.EaterofWorldsHead)
        {
            // 查找并处理所有蠕虫身体
            foreach (NPC otherNpc in Main.npc)
            {
                if (otherNpc.active && otherNpc.type == NPCID.EaterofWorldsBody && 
                    Vector2.Distance(npc.Center, otherNpc.Center) < 100f)
                {
                    // 给所有蠕虫身体增加速度
                    otherNpc.velocity *= 1.1f;
                    
                    // 发光效果
                    otherNpc.GlowMask = 1;
                    
                    // 发出嘶嘶声
                    Main.PlaySound(SoundID.NPCDeath, otherNpc.position);
                }
            }
        }
        
        // 做Mod时，我们经常需要遍历游戏中的各种实体
    }
    
    public override void ModifyHitByItem(Player player, Item item, NPC npc, ref int damage, ref float knockback, ref bool crit)
    {
        // 检查玩家装备的所有物品
        foreach (Item equippedItem in player.inventory)
        {
            if (equippedItem.type == ModContent.ItemType<MySword>() && 
                equippedItem.stack > 0)
            {
                // 如果装备了我们的剑，增加伤害
                damage += (int)(damage * 0.5f);
                knockback *= 1.2f;
                break;  // 找到一个就停止循环
            }
        }
    }
}
```

**做Mod时**，`foreach` 是处理集合数据的利器，它能让代码更加简洁易读。

**做Mod一般需要**：遍历玩家背包、遍历游戏中的NPC、遍历玩家身上的装备等。

**做Mod不需要考虑**：在循环中修改正在遍历的集合（会抛出异常），如果需要修改集合请使用 for 循环。

## while/do-while 循环

`while` 和 `do-while` 适合条件驱动的循环：

```csharp
public class MyProjectile : ModProjectile
{
    public override void AI()
    {
        int timer = (int)Projectile.ai[0];
        
        // while 循环：先判断条件，再执行
        while (timer < 60 && Projectile.active)
        {
            // 每10帧改变一次方向
            if (timer % 10 == 0)
            {
                Player target = Main.player[Projectile.owner];
                Vector2 direction = target.Center - Projectile.Center;
                direction.Normalize();
                Projectile.velocity = direction * 3f;
            }
            
            timer++;
            Projectile.ai[0] = timer;
        }
        
        // do-while 循环：先执行一次，再判断条件
        do
        {
            // 如果速度太慢就给一个向上的推力
            if (Projectile.velocity.Y > -2f)
            {
                Projectile.velocity.Y -= 0.1f;
            }
            
            // 确保不会飞出屏幕
            if (Projectile.position.Y < 100)
            {
                Projectile.position.Y = 100;
            }
        } while (Projectile.active && timer < 120);
        
        // 做Mod时，我们经常需要在特定条件下持续执行某些操作
    }
}
```

**做Mod时**，`while` 和 `do-while` 适合需要持续执行直到满足特定条件的场景。

**做Mod一般需要**：处理状态机、持续检查某个条件、实现需要多次尝试的逻辑等。

**做Mod不需要考虑**：无限循环（会导致游戏卡死），一定要确保循环有退出条件。

# 控制跳转

## break 和 continue

`break` 和 `continue` 可以改变循环的执行流程：

```csharp
public class MyGlobalItem : GlobalItem
{
    public override void OnCreate(Item item, ItemCreationContext context)
    {
        // 遍历玩家的所有物品，找到我们的特殊物品
        for (int i = 0; i < Main.player.Length; i++)
        {
            Player player = Main.player[i];
            
            // 检查玩家背包中的每个格子
            for (int j = 0; j < Inventory.MaxInventory; j++)
            {
                Item inventoryItem = player.inventory[j];
                
                // 如果不是我们的物品就跳过
                if (inventoryItem.type != ModContent.ItemType<MySpecialItem>())
                {
                    continue;  // 跳过本次循环，继续下一次
                }
                
                // 找到我们的物品后，执行特殊处理
                if (inventoryItem.stack >= 10)
                {
                    // 如果数量大于等于10，就给予奖励
                    player.AddBuff(BuffID.Lucky, 300);  // 5秒幸运
                    player.QuickSpawnItem(player.GetSource_ItemUse(inventoryItem), 
                        ItemID.GoldCoin, 50);  // 给50金币
                    
                    inventoryItem.stack = 1;  // 只保留一个
                    
                    break;  // 跳出内层循环，继续外层循环
                }
                
                // 给予小提示
                if (j == 10)  // 检查到第10个物品时
                {
                    Main.NewText("请收集足够的特殊物品来获得奖励。", Color.Yellow);
                }
            }
            
            // 如果已经处理过所有玩家，就退出
            if (i >= 4) 
            {
                break;
            }
        }
        
        // 做Mod时，我们经常需要提前退出循环或跳过某些迭代
    }
}
```

**做Mod时**，`break` 和 `continue` 可以让循环逻辑更加清晰，避免不必要的嵌套。

**做Mod一般需要**：找到目标后提前结束循环、跳过不符合条件的项、多层循环时需要退出内层循环等。

**做Mod不需要考虑**：在 break 之后继续执行循环代码（break 会直接退出循环），注意区分 break 和 continue 的使用场景。

# 小结

到这里我们已经覆盖了 C# 的主要控制流结构，下面做一个小结：

## 核心知识点

1. **条件语句**
   - `if/else/else if`：最常用的条件判断，适合需要多个分支的场景
   - `switch/case`：适合多选一的场景，代码更加清晰
   - 做Mod时经常用来根据玩家状态、游戏状态来执行不同的逻辑

2. **循环语句**
   - `for`：适合知道循环次数的场景，经常用来处理批量操作
   - `foreach`：遍历集合的首选，代码简洁易读
   - `while/do-while`：条件驱动的循环，适合持续执行直到满足条件
   - 做Mod时经常用来遍历游戏实体、批量处理数据等

3. **控制跳转**
   - `break`：立即退出循环
   - `continue`：跳过本次循环，继续下一次
   - 做Mod时经常用来优化循环逻辑，避免不必要的计算

## 实用技巧

- 做Mod时，控制流代码要简洁明了，避免过深的嵌套
- 优先使用 foreach 遍历集合，代码更清晰
- 注意循环的退出条件，避免无限循环
- 合理使用 break 和 continue 来优化循环逻辑

## 注意事项

- 做Mod一般不需要考虑过复杂的控制流逻辑
- 避免在 Update 或 AI 方法中进行大量循环计算
- 注意集合遍历时的安全性，避免在 foreach 中修改集合
- 控制跳转要适度使用，过度使用会让代码难以理解

本文到这里。下一章介绍数组与集合，它们是 Mod 开发中常用的数据结构。
