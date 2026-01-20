---
title: 第一个NPC
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 30分钟
description: 创建可交互的NPC，理解NPC的基本属性和行为
prev_chapter: ../2-物品/DPapyru-第一个弹药.md
next_chapter: ../5-高级/DPapyru-第一个Boss.md
topic: mod-basics
order: 8
colors:
  Red: "#f00"
---

# 第一个NPC：创建可交互的NPC

这一章的目标是：创建一个可交互的NPC，并且你理解NPC是怎么被生成、被移动、被交互的。

NPC是泰拉瑞亚世界里"活的东西"：村民、商人、护士……都是NPC。

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

## 阅读前需求

- 已完成"第一个武器"章节
- 知道怎么新建 `.cs` 文件并编译

## 第一步：了解代码

创建文件：`Content/NPCs/FirstNPC.cs`

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace YourModName.Content.NPCs
{
    public class FirstNPC : ModNPC
    {
        // SetDefaults：设置NPC的默认属性
        public override void SetDefaults()
        {
            NPC.width = 18;
            NPC.height = 40;
            NPC.townNPC = true; // 这个NPC是城镇NPC（可以住进房子）
            NPC.friendly = true; // 这个NPC是友好的（不会攻击玩家）
            
            // NPC的名字
            NPC.displayName = "测试NPC";
            
            // NPC的生命值
            NPC.lifeMax = 250;
            NPC.defense = 15;
            
            // NPC的移动速度
            NPC.moveSpeed = 0.5f;
            
            // NPC的碰撞箱
            NPC.knockBackResist = 0.5f;
        }

        // SetStaticDefaults：设置NPC的静态属性
        public override void SetStaticDefaults()
        {
            // NPC的名字（在地图上显示）
            Main.npcFrameCount[Type] = 25; // NPC有多少帧动画
            
            // NPC的贴图（暂时用原版商人代替）
            NPCID.Sets.ExtraFramesCount[Type] = 9;
            NPCID.Sets.AttackFrameCount[Type] = 4;
            NPCID.Sets.DangerDetectRange[Type] = 700;
            NPCID.Sets.AttackType[Type] = 0;
            NPCID.Sets.AttackTime[Type] = 90;
            NPCID.Sets.AttackAverageChance[Type] = 30;
            NPCID.Sets.HatOffsetY[Type] = 4;
        }

        // AI：NPC的行为逻辑，每帧都会运行
        public override void AI()
        {
            // 让NPC在白天和晚上有不同的行为
            if (!Main.dayTime)
            {
                // 晚上，NPC移动速度变快
                NPC.velocity.X *= 1.1f;
            }
        }

        // CanTownNPCSpawn：判断"能不能生成"
        public override bool CanTownNPCSpawn(int numTownNPCs, int money)
        {
            // 当玩家有至少10个金币时，这个NPC可以生成
            return money >= 100000;
        }

        // TownNPCName：NPC的名字列表
        public override string TownNPCName()
        {
            switch (WorldGen.genRand.Next(4))
            {
                case 0:
                    return "小明";
                case 1:
                    return "小红";
                case 2:
                    return "小刚";
                default:
                    return "小丽";
            }
        }

        // FindFrame：找到NPC的当前帧
        public override void FindFrame(int frameHeight)
        {
            // 简单的帧动画逻辑
            NPC.frameCounter++;
            if (NPC.frameCounter >= 12)
            {
                NPC.frameCounter = 0;
                NPC.frame.Y += frameHeight;
                if (NPC.frame.Y >= Main.npcFrameCount[Type] * frameHeight)
                {
                    NPC.frame.Y = 0;
                }
            }
        }

        // SetupShop：设置NPC的商店
        public override void SetupShop(Chest shop, ref int nextSlot)
        {
            // 在商店里卖一些东西
            shop.item[nextSlot].SetDefaults(ItemID.Wood);
            nextSlot++;
            
            shop.item[nextSlot].SetDefaults(ItemID.Stone);
            nextSlot++;
            
            shop.item[nextSlot].SetDefaults(ItemID.IronBar);
            nextSlot++;
        }

        // GetChat：NPC的对话
        public override string GetChat()
        {
            switch (Main.rand.Next(3))
            {
                case 0:
                    return "你好！我是测试NPC。";
                case 1:
                    return "今天天气不错！";
                default:
                    return "你需要什么帮助吗？";
            }
        }

        // SetChatButtons：设置NPC的对话按钮
        public override void SetChatButtons(ref string button, ref string button2)
        {
            button = "商店";
            button2 = "任务";
        }

        // OnChatButtonClicked：点击对话按钮时触发
        public override void OnChatButtonClicked(bool firstButton, ref bool shop)
        {
            if (firstButton)
            {
                // 点击"商店"按钮，打开商店
                shop = true;
            }
            else
            {
                // 点击"任务"按钮，显示任务信息
                Main.NewText("任务：收集10个木头");
            }
        }
    }
}
```

编译后进游戏，赚够10个金币，然后等待这个NPC生成。

### 题目

```quiz
type: choice
id: mod-basics-npc-town
question: |
  `NPC.townNPC = true;` 的作用是什么？
options:
  - id: A
    text: |
      这个NPC是"城镇NPC"，可以住进房子
  - id: B
    text: |
      这个NPC是"敌对NPC"，会攻击玩家
  - id: C
    text: |
      这个NPC是"Boss"，会掉落稀有物品
answer: A
explain: |
  NPC.townNPC = true 表示这个NPC是城镇NPC，可以住进房子，并且有商店、对话等功能。
```

```quiz
type: choice
id: mod-basics-npc-ai
question: |
  `AI()` 方法有什么特点？
options:
  - id: A
    text: |
      只在NPC生成时运行一次
  - id: B
    text: |
      每帧都会运行一次
  - id: C
    text: |
      只在NPC死亡时运行
answer: B
explain: |
  AI() 方法每帧都会运行，所以你可以在这里写"每帧要做的事情"，比如移动、攻击、产生粒子效果等。
```

## 第二步：学习关键内容

### NPC文件里最常改的行：

1. 在 `SetDefaults()` 里：
   - `NPC.width` / `NPC.height`：NPC大小
   - `NPC.lifeMax`：最大生命值
   - `NPC.defense`：防御力
   - `NPC.moveSpeed`：移动速度

2. 在 `AI()` 里：
   - `NPC.velocity`：速度和方向
   - `NPC.position`：位置

3. 在 `SetupShop()` 里：
   - 添加商店物品

练习方式：把这些行删掉，再自己敲回去。

## 第三步：教你"怎么读这份代码"（从上往下）

### 1）`ModNPC`：NPC的类

`ModNPC` 是NPC的类，它定义了NPC的行为：

- 能不能住进房子
- 会不会攻击玩家
- 有什么商店
- 说什么话

### 2）`SetDefaults()`：NPC的默认属性

NPC的 `SetDefaults()` 设置NPC的"初始属性"：

- `NPC.width` / `NPC.height`：碰撞箱大小
- `NPC.townNPC`：是否是城镇NPC（true = 是，false = 不是）
- `NPC.friendly`：是否友好（true = 不攻击玩家，false = 攻击玩家）
- `NPC.lifeMax`：最大生命值
- `NPC.defense`：防御力
- `NPC.moveSpeed`：移动速度
- `NPC.knockBackResist`：击退抗性（0 = 完全抵抗，1 = 完全承受）

### 3）`SetStaticDefaults()`：NPC的静态属性

NPC的 `SetStaticDefaults()` 设置NPC的"静态属性"（所有这个NPC都一样）：

- `Main.npcFrameCount[Type]`：NPC有多少帧动画
- `NPCID.Sets.ExtraFramesCount[Type]`：额外帧数
- `NPCID.Sets.AttackFrameCount[Type]`：攻击帧数
- `NPCID.Sets.DangerDetectRange[Type]`：危险检测范围
- `NPCID.Sets.AttackType[Type]`：攻击类型
- `NPCID.Sets.AttackTime[Type]`：攻击时间
- `NPCID.Sets.AttackAverageChance[Type]`：攻击概率
- `NPCID.Sets.HatOffsetY[Type]`：帽子偏移

### 4）`AI()`：NPC的行为逻辑

`AI()` 方法每帧都会运行，所以你可以在这里写"每帧要做的事情"：

- 改变速度：`NPC.velocity.X *= 1.1f;`
- 改变方向：`NPC.velocity = NPC.velocity.RotatedBy(0.1f);`
- 产生粒子：`Dust.NewDust(...)`
- 攻击玩家：`NPC.ai[0]++;`

### 5）`CanTownNPCSpawn()`：判断"能不能生成"

`CanTownNPCSpawn()` 方法判断这个NPC能不能生成：

```csharp
public override bool CanTownNPCSpawn(int numTownNPCs, int money)
{
    // 当玩家有至少10个金币时，这个NPC可以生成
    return money >= 100000;
}
```

参数说明：
- `numTownNPCs`：当前有多少个城镇NPC
- `money`：玩家有多少钱（单位：铜币）

如果返回 `true`，可以生成；如果返回 `false`，不能生成。

### 6）`TownNPCName()`：NPC的名字列表

`TownNPCName()` 方法返回NPC的名字：

```csharp
public override string TownNPCName()
{
    switch (WorldGen.genRand.Next(4))
    {
        case 0:
            return "小明";
        case 1:
            return "小红";
        case 2:
            return "小刚";
        default:
            return "小丽";
    }
}
```

你可以在这里写一个名字列表，游戏会随机选择一个。

### 7）`FindFrame()`：找到NPC的当前帧

`FindFrame()` 方法找到NPC的当前帧（用于动画）：

```csharp
public override void FindFrame(int frameHeight)
{
    // 简单的帧动画逻辑
    NPC.frameCounter++;
    if (NPC.frameCounter >= 12)
    {
        NPC.frameCounter = 0;
        NPC.frame.Y += frameHeight;
        if (NPC.frame.Y >= Main.npcFrameCount[Type] * frameHeight)
        {
            NPC.frame.Y = 0;
        }
    }
}
```

### 8）`SetupShop()`：设置NPC的商店

`SetupShop()` 方法设置NPC的商店：

```csharp
public override void SetupShop(Chest shop, ref int nextSlot)
{
    // 在商店里卖一些东西
    shop.item[nextSlot].SetDefaults(ItemID.Wood);
    nextSlot++;
    
    shop.item[nextSlot].SetDefaults(ItemID.Stone);
    nextSlot++;
    
    shop.item[nextSlot].SetDefaults(ItemID.IronBar);
    nextSlot++;
}
```

### 9）`GetChat()`：NPC的对话

`GetChat()` 方法返回NPC的对话：

```csharp
public override string GetChat()
{
    switch (Main.rand.Next(3))
    {
        case 0:
            return "你好！我是测试NPC。";
        case 1:
            return "今天天气不错！";
        default:
            return "你需要什么帮助吗？";
    }
}
```

### 10）`SetChatButtons()`：设置NPC的对话按钮

`SetChatButtons()` 方法设置NPC的对话按钮：

```csharp
public override void SetChatButtons(ref string button, ref string button2)
{
    button = "商店";
    button2 = "任务";
}
```

### 11）`OnChatButtonClicked()`：点击对话按钮时触发

`OnChatButtonClicked()` 方法在点击对话按钮时触发：

```csharp
public override void OnChatButtonClicked(bool firstButton, ref bool shop)
{
    if (firstButton)
    {
        // 点击"商店"按钮，打开商店
        shop = true;
    }
    else
    {
        // 点击"任务"按钮，显示任务信息
        Main.NewText("任务：收集10个木头");
    }
}
```

## 常见问题（先救命，后讲道理）

### 1）我赚够了钱，但NPC没生成

**原因**：最常见是 `CanTownNPCSpawn()` 返回 `false`，或者生成条件没满足。

**解决**：
- 检查 `CanTownNPCSpawn()` 的返回值
- 检查生成条件是否满足（比如钱够不够）

### 2）我生成了NPC，但没商店

**原因**：`SetupShop()` 没写，或者写错了。

**解决**：
- 检查 `SetupShop()` 是否存在
- 检查 `shop.item[nextSlot].SetDefaults(...)` 是否正确

### 3）我生成了NPC，但没对话

**原因**：`GetChat()` 没写，或者写错了。

**解决**：
- 检查 `GetChat()` 是否存在
- 检查返回的字符串是否正确

### 4）我点击了按钮，但没反应

**原因**：`OnChatButtonClicked()` 没写，或者写错了。

**解决**：
- 检查 `OnChatButtonClicked()` 是否存在
- 检查按钮逻辑是否正确
