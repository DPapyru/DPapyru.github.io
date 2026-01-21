---
title: 第一个Boss
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 30分钟
description: 做第一个Boss同时学习阶段转换
prev_chapter: ../3-战斗/DPapyru-第一个召唤物.md
next_chapter: ../5-高级/DPapyru-第一个世界生成.md
topic: mod-basics
order: 9
colors:
  Red: "#f00"
---

# 第一个Boss：做一个简单Boss同时学习阶段转换

Boss 是什么？简单来说，**Boss 是一个强大的敌人，通常有多个阶段，每个阶段有不同的行为**。比如原版的史莱姆王、克苏鲁之眼等。

{if C == 0}
> **适用人群**：首次接触 C#（C0）。
>
> **本章目标**：完成第一个 Boss，并能独立修改 Boss 的属性与阶段转换逻辑。
{else}
> **适用人群**：已具备 C# 基础（C≥1）。
>
> **建议路径**：先完成"复制 → 编译 → 进游戏验证"，再集中修改 `NPC.boss / Phase / AI()` 等关键行。
{end}

---

## 验收标准

完成本章后，你应能：

- 创建可召唤的 Boss
- 编写自定义 AI 行为
- 实现 Boss 阶段转换
- 理解 Boss 与普通 NPC 的区别

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

---

## 阅读前需求

- 已完成"第一个NPC"章节
- 已完成"第一个召唤物"章节
- 知道怎么新建 `.cs` 文件

---

## 第一步：了解代码

Boss 需要两个文件：

1. **Boss 类（NPC）**：定义 Boss 的行为和 AI
2. **召唤 Boss 的物品**：用于召唤 Boss

建议你把文件放在类似位置：

- `Content/NPCs/SimpleBoss.cs`（Boss 类）
- `Content/Items/SimpleBossSummon.cs`（召唤物品）

### 1.1 创建 Boss 类

把下面这份代码复制到 `SimpleBoss.cs`：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;
using Microsoft.Xna.Framework;

// 定义命名空间
namespace YourModName.Content.NPCs
{
    // 定义一个继承自 ModNPC 的类
    public class SimpleBoss : ModNPC
    {
        // Boss 的阶段
        public int Phase = 1;

        // 设置 Boss 的默认属性
        public override void SetStaticDefaults()
        {
            // 设置 Boss 的名字
            DisplayName.SetDefault("简单 Boss");
            // 设置 Boss 是 Boss 类型
            Main.npcFrameCount[NPC.type] = 4;  // 有 4 帧动画
        }

        // 设置 Boss 的默认属性
        public override void SetDefaults()
        {
            // 设置 Boss 的各项属性
            NPC.width = 100;
            NPC.height = 100;
            NPC.damage = 30;
            NPC.defense = 10;
            NPC.lifeMax = 2000;
            NPC.HitSound = SoundID.NPCHit1;
            NPC.DeathSound = SoundID.NPCDeath1;
            NPC.value = Item.buyPrice(gold: 5);
            NPC.knockBackResist = 0f;  // 不受击退影响
            NPC.aiStyle = -1;  // 不使用原版 AI，使用自定义 AI
            NPC.noGravity = true;  // 不受重力影响
            NPC.noTileCollide = true;  // 不与物块碰撞
            NPC.boss = true;  // 是 Boss
            NPC.npcSlots = 10f;  // 占用 10 个 NPC 槽位
            music = MusicID.Boss1;  // Boss 战音乐
        }

        // 自定义 AI
        public override void AI()
        {
            // 获取最近的玩家
            Player player = Main.player[NPC.target];

            // 如果玩家死亡或不存在，Boss 消失
            if (!player.active || player.dead)
            {
                NPC.TargetClosest(false);
                player = Main.player[NPC.target];
                if (!player.active || player.dead)
                {
                    NPC.velocity.Y -= 0.1f;
                    NPC.EncourageDespawn(10);
                    return;
                }
            }

            // 根据生命值切换阶段
            if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)
            {
                Phase = 2;
                // 第二阶段：增加速度和伤害
                NPC.damage = 50;
                // 显示阶段转换提示
                CombatText.NewText(NPC.getRect(), new Color(255, 0, 0), "第二阶段！", true);
            }

            // 计算与玩家的距离
            Vector2 targetPos = player.Center;
            float distanceToTarget = Vector2.Distance(NPC.Center, targetPos);

            // 根据阶段执行不同的 AI
            if (Phase == 1)
            {
                // 第一阶段：缓慢移动，偶尔冲刺
                NPC.ai[0]++;  // 计时器

                if (NPC.ai[0] < 180)
                {
                    // 缓慢移动
                    Vector2 direction = targetPos - NPC.Center;
                    direction.Normalize();
                    NPC.velocity = direction * 3f;
                }
                else if (NPC.ai[0] < 240)
                {
                    // 冲刺
                    Vector2 direction = targetPos - NPC.Center;
                    direction.Normalize();
                    NPC.velocity = direction * 12f;
                }
                else
                {
                    // 重置计时器
                    NPC.ai[0] = 0;
                }
            }
            else if (Phase == 2)
            {
                // 第二阶段：快速移动，频繁冲刺
                NPC.ai[0]++;  // 计时器

                if (NPC.ai[0] < 120)
                {
                    // 快速移动
                    Vector2 direction = targetPos - NPC.Center;
                    direction.Normalize();
                    NPC.velocity = direction * 6f;
                }
                else if (NPC.ai[0] < 180)
                {
                    // 冲刺
                    Vector2 direction = targetPos - NPC.Center;
                    direction.Normalize();
                    NPC.velocity = direction * 15f;
                }
                else
                {
                    // 重置计时器
                    NPC.ai[0] = 0;
                }
            }

            // 更新动画帧
            NPC.frameCounter++;
            if (NPC.frameCounter > 10)
            {
                NPC.frameCounter = 0;
                NPC.frame++;
                if (NPC.frame >= Main.npcFrameCount[NPC.type])
                {
                    NPC.frame = 0;
                }
            }
        }

        // Boss 死亡时掉落物品
        public override void OnKill()
        {
            // 掉落战利品
            Item.NewItem(NPC.GetSource_Loot(), NPC.getRect(), ItemID.GoldCoin, 10);
            Item.NewItem(NPC.GetSource_Loot(), NPC.getRect(), ItemID.Heart, 5);
        }

        // Boss 受到伤害时
        public override void HitEffect(NPC.HitInfo hit)
        {
            // 显示伤害数字
            CombatText.NewText(NPC.getRect(), new Color(255, 255, 255), hit.Damage, true);
        }
    }
}
```

### 1.2 创建召唤物品

把下面这份代码复制到 `SimpleBossSummon.cs`：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;
using YourModName.Content.NPCs;  // 引用我们的 Boss 类

// 定义命名空间
namespace YourModName.Content.Items
{
    // 定义一个继承自 ModItem 的类
    public class SimpleBossSummon : ModItem
    {
        // 设置物品的默认属性
        public override void SetDefaults()
        {
            // 设置召唤物品的各项属性
            Item.width = 32;
            Item.height = 32;
            Item.useStyle = ItemUseStyleID.HoldUp;
            Item.useAnimation = 30;
            Item.useTime = 30;
            Item.useTurn = true;
            Item.UseSound = SoundID.Item44;
            Item.consumable = true;
            Item.rare = ItemRarityID.Yellow;
            Item.value = Item.buyPrice(gold: 1);
            Item.maxStack = 20;
        }

        // 使用物品时召唤 Boss
        public override bool? UseItem(Player player)
        {
            // 检查是否已经有 Boss 存在
            bool bossExists = false;
            for (int i = 0; i < Main.maxNPCs; i++)
            {
                if (Main.npc[i].active && Main.npc[i].type == ModContent.NPCType<NPCs.SimpleBoss>())
                {
                    bossExists = true;
                    break;
                }
            }

            if (bossExists)
            {
                // 如果 Boss 已经存在，显示提示
                Main.NewText("Boss 已经存在了！", 255, 0, 0);
                return false;
            }

            // 召唤 Boss
            NPC.SpawnOnPlayer(player.whoAmI, ModContent.NPCType<NPCs.SimpleBoss>());
            Main.NewText("简单 Boss 已经被召唤！", 255, 255, 0);
            return true;
        }

        // 添加合成配方
        public override void AddRecipes()
        {
            Recipe recipe = CreateRecipe();
            recipe.AddIngredient(ItemID.DirtBlock, 50);
            recipe.AddIngredient(ItemID.StoneBlock, 50);
            recipe.AddTile(TileID.DemonAltar);
            recipe.Register();
        }
    }
}
```

复制完成后先编译一次，确保"能跑"。

### 概念关联测验

> **测验对应概念**：`NPC.boss`、`Phase`、`NPC.SpawnOnPlayer()`

```quiz
type: choice
id: mod-basics-first-boss-basics
question: |
  下列哪些行是修改"Boss属性/阶段"时最常改动的？
options:
  - id: A
    text: |
      `NPC.boss = true;`
  - id: B
    text: |
      `if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)`
  - id: C
    text: |
      `NPC.damage = 50;`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  Boss 标识在 `NPC.boss` 里改，阶段转换条件在 `if (NPC.life < NPC.lifeMax * 0.5f...)` 里改，伤害在 `NPC.damage` 里改。
```

---

## 第二步：练习（建议）

### 2.1 Boss 文件里最常改的行

在 `SetDefaults()` 里：

- `NPC.lifeMax = 2000;`（生命值）
- `NPC.boss = true;`（标识为 Boss）
- `music = MusicID.Boss1;`（Boss 战音乐）

在 `AI()` 里：

- `if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)`（阶段转换条件）
- `Phase = 2;`（切换阶段）
- `NPC.velocity = direction * 3f;`（移动速度）

### 2.2 练习方式

把这些行删掉，再自己敲回去。

---

## 第三步：补充阅读（按需）

{if C == 0}
{[./_分流/第一个Boss-C0-CSharp读代码.md][C# 补课（C0）：看懂本章语法]}
{end}

{if T == 0}
{[./_分流/第一个Boss-T0-tML读代码.md][tModLoader 补课（T0）：看懂本章 API]}
{end}

---

## 常见问题（排错）

### 1）我编译报错，最常见是哪里？

**原因**：`YourModName` 没替换，或 `namespace` 写错了

**解决**：
- 检查 `namespace YourModName...` 里的 `YourModName` 是否换成你项目实际使用的名字
- 检查 `using YourModName.Content.NPCs;` 是否正确

### 2）我进游戏找不到这个召唤物品/配方

**解决**：
- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 配方需要在恶魔祭坛旁边打开合成栏才会出现
- 召唤物品需要右键使用才会召唤 Boss

### 3）我使用了召唤物品，但是没有 Boss

**解决**：
- 检查 `NPC.boss = true;` 是否存在
- 检查 `AI()` 方法是否正确重写
- 检查 `NPC.SpawnOnPlayer()` 是否在 `UseItem()` 方法里

---

## 本章自测（可选）

用于自查是否达到"能创建 Boss"的最低标准：

- [ ] 我能指出 `SetDefaults()` 中三处常改动点：生命/Boss标识/音乐
- [ ] 我能指出 `AI()` 中两处常改动点：阶段转换/移动速度
- [ ] 我能解释阶段转换的工作原理

---

## 下一步

本章完成后，你应能独立创建 Boss 并实现阶段转换。

下一章我们会做"第一个世界生成"：你会看到世界生成是怎么在游戏中生成新结构和矿物的。
