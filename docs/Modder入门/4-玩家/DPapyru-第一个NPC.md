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

NPC 是泰拉瑞亚世界里"活的东西"：村民、商人、护士……都是 NPC。

{if C == 0}
> **适用人群**：首次接触 C#（C0）。
>
> **本章目标**：完成第一个 NPC，并能独立修改 NPC 的属性与交互逻辑。
{else}
> **适用人群**：已具备 C# 基础（C≥1）。
>
> **建议路径**：先完成"复制 → 编译 → 进游戏验证"，再集中修改 `NPC.townNPC / SetupShop() / GetChat()` 等关键行。
{end}

---

## 验收标准

完成本章后，你应能：

- 创建可生成的城镇 NPC
- 为 NPC 添加商店和对话功能
- 修改 NPC 的基本属性
- 理解 NPC 的生命周期与交互逻辑

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

---

## 阅读前需求

- 已完成"第一个武器"章节
- 知道怎么新建 `.cs` 文件并编译

---

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
        // SetDefaults：设置 NPC 的默认属性
        public override void SetDefaults()
        {
            NPC.width = 18;
            NPC.height = 40;
            NPC.townNPC = true; // 这个 NPC 是城镇 NPC（可以住进房子）
            NPC.friendly = true; // 这个 NPC 是友好的（不会攻击玩家）

            // NPC 的名字
            NPC.displayName = "测试NPC";

            // NPC 的生命值
            NPC.lifeMax = 250;
            NPC.defense = 15;

            // NPC 的移动速度
            NPC.moveSpeed = 0.5f;

            // NPC 的碰撞箱
            NPC.knockBackResist = 0.5f;
        }

        // SetStaticDefaults：设置 NPC 的静态属性
        public override void SetStaticDefaults()
        {
            // NPC 的名字（在地图上显示）
            Main.npcFrameCount[Type] = 25; // NPC 有多少帧动画

            // NPC 的贴图（暂时用原版商人代替）
            NPCID.Sets.ExtraFramesCount[Type] = 9;
            NPCID.Sets.AttackFrameCount[Type] = 4;
            NPCID.Sets.DangerDetectRange[Type] = 700;
            NPCID.Sets.AttackType[Type] = 0;
            NPCID.Sets.AttackTime[Type] = 90;
            NPCID.Sets.AttackAverageChance[Type] = 30;
            NPCID.Sets.HatOffsetY[Type] = 4;
        }

        // AI：NPC 的行为逻辑，每帧都会运行
        public override void AI()
        {
            // 让 NPC 在白天和晚上有不同的行为
            if (!Main.dayTime)
            {
                // 晚上，NPC 移动速度变快
                NPC.velocity.X *= 1.1f;
            }
        }

        // CanTownNPCSpawn：判断"能不能生成"
        public override bool CanTownNPCSpawn(int numTownNPCs, int money)
        {
            // 当玩家有至少 10 个金币时，这个 NPC 可以生成
            return money >= 100000;
        }

        // TownNPCName：NPC 的名字列表
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

        // FindFrame：找到 NPC 的当前帧
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

        // SetupShop：设置 NPC 的商店
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

        // GetChat：NPC 的对话
        public override string GetChat()
        {
            switch (Main.rand.Next(3))
            {
                case 0:
                    return "你好！我是测试 NPC。";
                case 1:
                    return "今天天气不错！";
                default:
                    return "你需要什么帮助吗？";
            }
        }

        // SetChatButtons：设置 NPC 的对话按钮
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
                Main.NewText("任务：收集 10 个木头");
            }
        }
    }
}
```

复制完成后先编译一次，确保"能跑"。

### 概念关联测验

> **测验对应概念**：`NPC.townNPC`、`SetupShop()`、`GetChat()`

```quiz
type: choice
id: mod-basics-npc-basics
question: |
  下列哪些行是修改"NPC属性/交互"时最常改动的？
options:
  - id: A
    text: |
      `NPC.townNPC = true;`
  - id: B
    text: |
      `shop.item[nextSlot].SetDefaults(ItemID.Wood);`
  - id: C
    text: |
      `return "你好！我是测试 NPC。";`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  NPC 类型在 `NPC.townNPC` 里改，商店物品在 `SetupShop()` 里改，对话内容在 `GetChat()` 里改。
```

---

## 第二步：练习（建议）

### 2.1 NPC 文件里最常改的行

在 `SetDefaults()` 里：

- `NPC.width / NPC.height`（NPC 大小）
- `NPC.lifeMax`（最大生命值）
- `NPC.defense`（防御力）
- `NPC.moveSpeed`（移动速度）

在 `SetupShop()` 里：

- 添加商店物品

在 `GetChat()` 里：

- 修改对话内容

### 2.2 练习方式

把这些行删掉，再自己敲回去。

---

## 第三步：补充阅读（按需）

{if C == 0}
{[./_分流/第一个NPC-C0-CSharp读代码.md][C# 补课（C0）：看懂本章语法]}
{end}

{if T == 0}
{[./_分流/第一个NPC-T0-tML读代码.md][tModLoader 补课（T0）：看懂本章 API]}
{end}

---

## 常见问题（排错）

### 1）我赚够了钱，但 NPC 没生成

**原因**：最常见是 `CanTownNPCSpawn()` 返回 `false`，或者生成条件没满足。

**解决**：
- 检查 `CanTownNPCSpawn()` 的返回值
- 检查生成条件是否满足（比如钱够不够）

### 2）我生成了 NPC，但没商店

**原因**：`SetupShop()` 没写，或者写错了。

**解决**：
- 检查 `SetupShop()` 是否存在
- 检查 `shop.item[nextSlot].SetDefaults(...)` 是否正确

### 3）我生成了 NPC，但没对话

**原因**：`GetChat()` 没写，或者写错了。

**解决**：
- 检查 `GetChat()` 是否存在
- 检查返回的字符串是否正确

### 4）我点击了按钮，但没反应

**原因**：`OnChatButtonClicked()` 没写，或者写错了。

**解决**：
- 检查 `OnChatButtonClicked()` 是否存在
- 检查按钮逻辑是否正确

---

## 本章自测（可选）

用于自查是否达到"能创建 NPC"的最低标准：

- [ ] 我能指出 `SetDefaults()` 中三处常改动点：大小/生命/防御
- [ ] 我能指出 `SetupShop()` 中两处常改动点：添加物品/nextSlot++
- [ ] 我能解释 NPC 商店和对话的工作原理

---

## 下一步

本章完成后，你应能独立创建 NPC 并为其添加商店和对话功能。

下一章我们会做"第一个 Boss"：你会看到 Boss 是怎么拥有复杂 AI 和阶段转换的。
