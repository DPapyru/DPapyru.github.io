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

这一章的目标很简单：做出你 Mod 里的第一个 Boss，并且你敢改它的关键数值。

Boss 是什么？简单来说，**Boss 是一个强大的敌人，通常有多个阶段，每个阶段有不同的行为**。比如原版的史莱姆王、克苏鲁之眼等。

Boss 需要两个文件：

1. **Boss 类（NPC）**：定义 Boss 的行为和AI
2. **召唤 Boss 的物品**：用于召唤 Boss

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名（更准确地说，是你的 Mod 的"命名空间前缀/根名字"）。不知道自己的 Mod 名也没关系，先照抄，后面我们会说怎么判断。

## 阅读前需求

- 已完成"第一个NPC"章节：知道如何创建NPC
- 已完成"第一个召唤物"章节：知道如何编写AI
- 知道怎么新建 `.cs` 文件（放进你的 Mod 项目里）

## 第一步：了解代码

建议你把文件放在类似位置：

- `Content/NPCs/SimpleBoss.cs`（Boss 类）
- `Content/Items/SimpleBossSummon.cs`（召唤物品）

### 1.1 创建 Boss 类

先把下面这份代码复制到 `SimpleBoss.cs`：

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
            DisplayName.SetDefault("简单Boss");
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
            NPC.aiStyle = -1;  // 不使用原版AI，使用自定义AI
            NPC.noGravity = true;  // 不受重力影响
            NPC.noTileCollide = true;  // 不与物块碰撞
            NPC.boss = true;  // 是 Boss
            NPC.npcSlots = 10f;  // 占用 10 个 NPC 槽位
            music = MusicID.Boss1;  // Boss 战音乐
        }

        // 自定义AI
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

            // 根据阶段执行不同的AI
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

再把下面这份代码复制到 `SimpleBossSummon.cs`：

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
            Main.NewText("简单Boss 已经被召唤！", 255, 255, 0);
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

复制完成后先编译一次，确保"能跑"。能跑之后我们再来"只手敲关键行"。

### 题目

```quiz
type: choice
id: mod-basics-first-boss-edit-lines
question: |
  下面哪些行是"你以后想改 Boss 生命值/阶段转换"最常会动到的？
options:
  - id: A
    text: |
      `NPC.lifeMax = 2000;`
  - id: B
    text: |
      `if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)`
  - id: C
    text: |
      `NPC.velocity = direction * 3f;`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  Boss 生命值在 `SetDefaults()` 里改，阶段转换在 `if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)` 里改，移动速度在 `NPC.velocity` 里改。
  `using ...` 一般不用动，除非你删了/加了新东西导致编译报错。
```

## 第二步：学习关键内容

现在开始"中间形态"的练习：你可以保留其它代码不动，只对下面这些行做一次"删掉 → 自己敲回去"。

建议练习顺序：

1. 在 `SimpleBoss.cs` 的 `SetDefaults()` 里把这些行删掉，再自己敲回去：
   - `NPC.lifeMax = 2000;`
   - `NPC.boss = true;`
   - `music = MusicID.Boss1;`
2. 在 `SimpleBoss.cs` 的 `AI()` 里把这几行删掉，再自己敲回去：
   - `if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)`
   - `Phase = 2;`
   - `NPC.damage = 50;`
   - `Vector2 direction = targetPos - NPC.Center;`
   - `direction.Normalize();`
   - `NPC.velocity = direction * 3f;`
3. 在 `SimpleBossSummon.cs` 的 `UseItem()` 里把这几行删掉，再自己敲回去：
   - `NPC.SpawnOnPlayer(player.whoAmI, ModContent.NPCType<NPCs.SimpleBoss>());`
   - `Main.NewText("简单Boss 已经被召唤！", 255, 255, 0);`

你会发现：你不需要知道"C# 的全部规则"，也能写出一个能工作的 Boss。

## 第三步：教你"怎么读这份代码"（从上往下）

下面我们按"阅读顺序"讲一下：每段在干嘛、你现在需要记住什么。

### 1）`ModNPC`：NPC 的基类

`ModNPC` 是 tModLoader 里"NPC 的基类"。

我们写的 `SimpleBoss` 是"基于这个基类创建的一个新 NPC"。

### 2）`NPC.boss = true;`：最重要的那一行

这一行告诉游戏：**这是一个 Boss**。

如果没有这一行，这个 NPC 就不会被当作 Boss 处理。

### 3）`NPC.aiStyle = -1;`：使用自定义AI

这一行告诉游戏：**不使用原版AI，使用自定义AI**。

- `-1`：表示使用自定义AI
- 其他值：使用原版AI（比如 `0` 表示默认AI）

### 4）`Phase`：Boss 的阶段

我们定义了一个 `Phase` 变量，用来表示 Boss 的当前阶段。

- `Phase = 1`：第一阶段
- `Phase = 2`：第二阶段

```quiz
type: choice
id: mod-boss-phase-variable
question: |
  `Phase` 变量的作用是什么？
options:
  - id: A
    text: |
      表示 Boss 的当前阶段
  - id: B
    text: |
      表示 Boss 的生命值
  - id: C
    text: |
      表示 Boss 的移动速度
answer: A
explain: |
  `Phase` 变量用来表示 Boss 的当前阶段，比如第一阶段、第二阶段等。
```

### 5）`if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)`：阶段转换条件

这一行的作用是：**当 Boss 的生命值低于 50% 且当前是第一阶段时，切换到第二阶段**。

- `NPC.life`：Boss 的当前生命值
- `NPC.lifeMax`：Boss 的最大生命值
- `0.5f`：50%
- `&&`：逻辑与运算符，表示"并且"
- `Phase == 1`：当前是第一阶段

所以 `if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)` 的意思是：**当 Boss 的生命值低于 50% 且当前是第一阶段时**。

```quiz
type: choice
id: mod-boss-phase-transition
question: |
  `if (NPC.life < NPC.lifeMax * 0.5f && Phase == 1)` 的作用是什么？
options:
  - id: A
    text: |
      当 Boss 的生命值低于 50% 且当前是第一阶段时，切换到第二阶段
  - id: B
    text: |
      当 Boss 的生命值低于 50% 时，Boss 死亡
  - id: C
    text: |
      当 Boss 的生命值等于 50% 时，Boss 恢复生命值
answer: A
explain: |
  这一行是阶段转换的条件，当 Boss 的生命值低于 50% 且当前是第一阶段时，切换到第二阶段。
```

### 6）`NPC.ai[0]++`：计时器

这一行的作用是：**增加计时器**。

- `NPC.ai[0]`：NPC 的 AI 数组，可以用来存储各种数据
- `++`：自增运算符，意思是"加 1"

我们用 `NPC.ai[0]` 作为计时器，用来控制 Boss 的行为。

### 7）`NPC.SpawnOnPlayer(player.whoAmI, ModContent.NPCType<NPCs.SimpleBoss>());`：召唤 Boss

这一行的作用是：**在玩家位置召唤 Boss**。

- `player.whoAmI`：玩家的 ID
- `ModContent.NPCType<NPCs.SimpleBoss>()`：Boss 的类型

### 8）`Main.NewText(...)`：显示提示信息

这一行的作用是：**在屏幕上显示提示信息**。

- `"简单Boss 已经被召唤！"`：提示信息
- `255, 255, 0`：颜色（黄色）

## 常见问题（先救命，后讲道理）

### 1）我编译报错，最常见是哪里？

- `YourModName` 没替换：如果你项目默认命名空间不是这个，可能会提示找不到类型/命名空间。你可以先把 `namespace YourModName...` 里的 `YourModName` 换成你项目里其它 `.cs` 文件最上面用的那个名字。
- `Content.NPCs` 写错了：`namespace` 的后半段你可以随便取，但要确保它只是"分类名"，不要写奇怪符号。
- `using YourModName.Content.NPCs;` 没加：如果 `SimpleBoss` 变红，检查 `using YourModName.Content.NPCs;` 是否存在。

### 2）我进游戏找不到这个召唤物品/配方

- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 配方需要在恶魔祭坛旁边打开合成栏才会出现
- 召唤物品需要右键使用才会召唤 Boss

### 3）我使用了召唤物品，但是没有 Boss

- 检查 `NPC.boss = true;` 是否存在
- 检查 `AI()` 方法是否正确重写
- 检查 `NPC.SpawnOnPlayer()` 是否在 `UseItem()` 方法里

## 下一步会学什么？

这一章你已经完成最关键的一步：**你能创建 Boss，并且知道如何实现阶段转换**。

下一章我们会做第一个世界生成：你会看到"世界生成"是怎么在游戏中生成新结构和矿物的。
