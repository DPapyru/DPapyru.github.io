---
title: 第一个召唤物
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 25分钟
description: 做第一个召唤物同时学习AI系统
prev_chapter: DPapyru-第一个Buff.md
next_chapter: DPapyru-第一个Boss.md
topic: mod-basics
order: 8
colors:
  Red: "#f00"
---

# 第一个召唤物：做一个攻击型召唤物同时学习AI系统

这一章的目标很简单：做出你 Mod 里的第一个召唤物，并且你敢改它的关键数值。

召唤物是什么？简单来说，**召唤物是一个跟随玩家并自动攻击敌人的实体**。比如原版的星尘龙、泰拉棱镜等。

召唤物需要三个文件：

1. **召唤物类（Projectile）**：定义召唤物的行为和AI
2. **召唤物Buff**：让玩家拥有召唤物
3. **召唤物品**：给玩家添加召唤物Buff的物品

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名（更准确地说，是你的 Mod 的"命名空间前缀/根名字"）。不知道自己的 Mod 名也没关系，先照抄，后面我们会说怎么判断。

## 阅读前需求

- 已完成"第一个Buff"章节：知道如何创建Buff
- 已完成"第一个弹幕"章节：知道如何创建Projectile
- 知道怎么新建 `.cs` 文件（放进你的 Mod 项目里）

## 第一步：了解代码

建议你把文件放在类似位置：

- `Content/Projectiles/Minions/FlyingMinion.cs`（召唤物类）
- `Content/Buffs/FlyingMinionBuff.cs`（召唤物Buff）
- `Content/Items/FlyingMinionStaff.cs`（召唤物品）

### 1.1 创建召唤物类

先把下面这份代码复制到 `FlyingMinion.cs`：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ModLoader;
using Microsoft.Xna.Framework;

// 定义命名空间
namespace YourModName.Content.Projectiles.Minions
{
    // 定义一个继承自 ModProjectile 的类
    public class FlyingMinion : ModProjectile
    {
        // 召唤物的所有者
        public override void SetStaticDefaults()
        {
            // 设置召唤物的名字
            DisplayName.SetDefault("飞行小精灵");
            // 设置召唤物是召唤物类型
            Main.projFrames[Projectile.type] = 4;  // 有 4 帧动画
            Main.projPet[Projectile.type] = true;  // 是宠物/召唤物
        }

        // 设置召唤物的默认属性
        public override void SetDefaults()
        {
            // 设置召唤物的各项属性
            Projectile.width = 32;
            Projectile.height = 32;
            Projectile.tileCollide = false;  // 不与物块碰撞
            Projectile.friendly = true;  // 对敌人友好（会攻击敌人）
            Projectile.minion = true;  // 是召唤物
            Projectile.minionSlots = 1;  // 占用 1 个召唤物槽位
            Projectile.penetrate = -1;  // 穿透所有敌人（-1 表示无限穿透）
            Projectile.timeLeft = 18000;  // 存在时间（18000 帧约等于 5 分钟）
            Projectile.ignoreWater = true;  // 忽略水
            Projectile.aiStyle = -1;  // 不使用原版AI，使用自定义AI
        }

        // 自定义AI
        public override void AI()
        {
            // 获取召唤物的所有者
            Player player = Main.player[Projectile.owner];

            // 如果玩家死亡或没有召唤物Buff，召唤物消失
            if (!player.active || player.dead || !player.HasBuff(ModContent.BuffType<Buffs.FlyingMinionBuff>()))
            {
                Projectile.Kill();
                return;
            }

            // 更新召唤物的时间
            Projectile.timeLeft = 18000;

            // 计算召唤物与玩家的距离
            Vector2 targetPos = player.Center;
            float distanceToTarget = Vector2.Distance(Projectile.Center, targetPos);

            // 如果距离太远，飞向玩家
            if (distanceToTarget > 200f)
            {
                Vector2 direction = targetPos - Projectile.Center;
                direction.Normalize();
                Projectile.velocity = direction * 8f;  // 飞行速度
            }
            else
            {
                // 距离近时，减速
                Projectile.velocity *= 0.9f;
            }

            // 寻找最近的敌人
            NPC targetNPC = null;
            float minDistance = 400f;  // 搜索范围

            for (int i = 0; i < Main.maxNPCs; i++)
            {
                NPC npc = Main.npc[i];
                if (npc.active && !npc.friendly && npc.lifeMax > 5 && !npc.dontTakeDamage)
                {
                    float distance = Vector2.Distance(Projectile.Center, npc.Center);
                    if (distance < minDistance)
                    {
                        minDistance = distance;
                        targetNPC = npc;
                    }
                }
            }

            // 如果找到敌人，攻击敌人
            if (targetNPC != null)
            {
                Vector2 direction = targetNPC.Center - Projectile.Center;
                direction.Normalize();
                Projectile.velocity = direction * 10f;  // 攻击速度

                // 每 30 帧造成一次伤害
                if (Projectile.ai[0] >= 30f)
                {
                    Projectile.ai[0] = 0f;
                    // 造成伤害
                    int damage = 20;
                    targetNPC.StrikeNPC(damage, 0f, 0);
                    // 显示伤害数字
                    CombatText.NewText(targetNPC.getRect(), new Color(255, 255, 255), damage, true);
                }
                else
                {
                    Projectile.ai[0]++;
                }
            }

            // 更新动画帧
            Projectile.frameCounter++;
            if (Projectile.frameCounter > 5)
            {
                Projectile.frameCounter = 0;
                Projectile.frame++;
                if (Projectile.frame >= Main.projFrames[Projectile.type])
                {
                    Projectile.frame = 0;
                }
            }
        }
    }
}
```

### 1.2 创建召唤物Buff

再把下面这份代码复制到 `FlyingMinionBuff.cs`：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ModLoader;

// 定义命名空间
namespace YourModName.Content.Buffs
{
    // 定义一个继承自 ModBuff 的类
    public class FlyingMinionBuff : ModBuff
    {
        // 设置 Buff 的默认属性
        public override void SetStaticDefaults()
        {
            // 设置 Buff 的名字和描述
            Main.buffName[Type] = "飞行小精灵";
            Main.buffTip[Type] = "一个小精灵会帮你攻击敌人";
            // 设置 Buff 不会随时间消失
            Main.buffNoTimeDisplay[Type] = true;
            // 设置 Buff 不是负面效果
            Main.debuff[Type] = false;
            // 设置 Buff 不能被右键取消
            Main.buffNoSave[Type] = false;
            // 设置 Buff 是召唤物Buff
            Main.buffIsPet[Type] = false;
        }

        // 当玩家有这个 Buff 时，每帧都会调用这个方法
        public override void Update(Player player, ref int buffIndex)
        {
            // 如果玩家没有召唤物，生成一个
            if (player.ownedProjectileCounts[ModContent.ProjectileType<Projectiles.Minions.FlyingMinion>()] == 0)
            {
                Projectile.NewProjectile(
                    player.GetSource_Buff(buffIndex),
                    player.Center,
                    Vector2.Zero,
                    ModContent.ProjectileType<Projectiles.Minions.FlyingMinion>(),
                    20,  // 伤害
                    2f,  // 击退
                    player.whoAmI
                );
            }

            // 确保Buff不会消失
            player.buffTime[buffIndex] = 18000;
        }
    }
}
```

### 1.3 创建召唤物品

再把下面这份代码复制到 `FlyingMinionStaff.cs`：

```csharp
// 引用必要的命名空间
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;
using YourModName.Content.Buffs;  // 引用我们的 Buff 类

// 定义命名空间
namespace YourModName.Content.Items
{
    // 定义一个继承自 ModItem 的类
    public class FlyingMinionStaff : ModItem
    {
        // 设置物品的默认属性
        public override void SetDefaults()
        {
            // 设置召唤武器的各项属性
            Item.damage = 20;
            Item.DamageType = DamageClass.Summon;
            Item.width = 32;
            Item.height = 32;
            Item.useTime = 30;
            Item.useAnimation = 30;
            Item.useStyle = ItemUseStyleID.Swing;
            Item.noMelee = true;  // 不造成近战伤害
            Item.knockBack = 3f;
            Item.value = Item.buyPrice(gold: 1);
            Item.rare = ItemRarityID.Green;
            Item.UseSound = SoundID.Item44;
            Item.shoot = ModContent.ProjectileType<Projectiles.Minions.FlyingMinion>();  // 发射的召唤物
            Item.shootSpeed = 0f;  // 召唤物不需要速度
            Item.buffType = ModContent.BuffType<FlyingMinionBuff>();  // 添加的 Buff
        }

        // 添加合成配方
        public override void AddRecipes()
        {
            Recipe recipe = CreateRecipe();
            recipe.AddIngredient(ItemID.Wood, 10);
            recipe.AddIngredient(ItemID.Feather, 5);
            recipe.AddTile(TileID.WorkBenches);
            recipe.Register();
        }
    }
}
```

复制完成后先编译一次，确保"能跑"。能跑之后我们再来"只手敲关键行"。

### 题目

```quiz
type: choice
id: mod-basics-first-minion-edit-lines
question: |
  下面哪些行是"你以后想改召唤物伤害/攻击速度"最常会动到的？
options:
  - id: A
    text: |
      `Projectile.damage = 20;`
  - id: B
    text: |
      `if (Projectile.ai[0] >= 30f)`
  - id: C
    text: |
      `Projectile.velocity = direction * 10f;`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  召唤物伤害在 `StrikeNPC()` 里改，攻击速度在 `if (Projectile.ai[0] >= 30f)` 里改，飞行速度在 `Projectile.velocity` 里改。
  `using ...` 一般不用动，除非你删了/加了新东西导致编译报错。
```

## 第二步：学习关键内容

现在开始"中间形态"的练习：你可以保留其它代码不动，只对下面这些行做一次"删掉 → 自己敲回去"。

建议练习顺序：

1. 在 `FlyingMinion.cs` 的 `SetDefaults()` 里把这些行删掉，再自己敲回去：
   - `Projectile.minionSlots = 1;`
   - `Projectile.timeLeft = 18000;`
   - `Projectile.aiStyle = -1;`
2. 在 `FlyingMinion.cs` 的 `AI()` 里把这几行删掉，再自己敲回去：
   - `Vector2 direction = targetPos - Projectile.Center;`
   - `direction.Normalize();`
   - `Projectile.velocity = direction * 8f;`
   - `targetNPC.StrikeNPC(damage, 0f, 0);`
3. 在 `FlyingMinionBuff.cs` 的 `Update()` 里把这几行删掉，再自己敲回去：
   - `Projectile.NewProjectile(...);`
   - `player.buffTime[buffIndex] = 18000;`

你会发现：你不需要知道"C# 的全部规则"，也能写出一个能工作的召唤物。

## 第三步：教你"怎么读这份代码"（从上往下）

下面我们按"阅读顺序"讲一下：每段在干嘛、你现在需要记住什么。

### 1）`ModProjectile`：弹幕的基类

`ModProjectile` 是 tModLoader 里"弹幕的基类"。

我们写的 `FlyingMinion` 是"基于这个基类创建的一个新弹幕"。

### 2）`Projectile.minion = true;`：最重要的那一行

这一行告诉游戏：**这是一个召唤物**。

如果没有这一行，这个弹幕就不会被当作召唤物处理。

### 3）`Projectile.aiStyle = -1;`：使用自定义AI

这一行告诉游戏：**不使用原版AI，使用自定义AI**。

- `-1`：表示使用自定义AI
- 其他值：使用原版AI（比如 `0` 表示默认AI）

```quiz
type: choice
id: mod-minions-custom-ai
question: |
  `Projectile.aiStyle = -1;` 的作用是什么？
options:
  - id: A
    text: |
      使用原版默认AI
  - id: B
    text: |
      使用自定义AI
  - id: C
    text: |
      不使用AI
answer: B
explain: |
  `Projectile.aiStyle = -1;` 表示使用自定义AI，你需要在 `AI()` 方法里编写自己的AI逻辑。
```

### 4）`AI()`：召唤物的核心方法

这个方法是召唤物的核心：**每一帧都会调用这个方法**。

在这个方法里，你可以编写召唤物的AI逻辑，比如跟随玩家、攻击敌人等。

### 5）`Vector2.Distance(Projectile.Center, targetPos)`：计算距离

这一行的作用是：**计算召唤物与目标之间的距离**。

- `Projectile.Center`：召唤物的中心位置
- `targetPos`：目标位置
- `Vector2.Distance()`：计算两点之间的距离

### 6）`direction.Normalize();`：归一化向量

这一行的作用是：**将向量归一化，使其长度为1**。

- `direction`：方向向量
- `Normalize()`：归一化方法

归一化后的向量可以用来表示方向，然后乘以速度就可以得到速度向量。

```quiz
type: choice
id: mod-minions-normalize
question: |
  `direction.Normalize();` 的作用是什么？
options:
  - id: A
    text: |
      将向量归一化，使其长度为1
  - id: B
    text: |
      将向量反转
  - id: C
    text: |
      将向量清零
answer: A
explain: |
  `Normalize()` 方法将向量归一化，使其长度为1，这样就可以用来表示方向。
```

### 7）`Projectile.velocity = direction * 8f;`：设置速度

这一行的作用是：**设置召唤物的速度**。

- `direction`：方向向量（已归一化）
- `8f`：速度大小

所以 `Projectile.velocity = direction * 8f;` 的意思是：**让召唤物以每帧 8 像素的速度向目标方向移动**。

### 8）`targetNPC.StrikeNPC(damage, 0f, 0);`：造成伤害

这一行的作用是：**对敌人造成伤害**。

- `damage`：伤害值
- `0f`：击退强度
- `0`：击退方向

### 9）`Projectile.NewProjectile(...)`：生成召唤物

这一行的作用是：**生成一个新的召唤物**。

- `player.GetSource_Buff(buffIndex)`：召唤物的来源
- `player.Center`：生成位置
- `Vector2.Zero`：初始速度
- `ModContent.ProjectileType<Projectiles.Minions.FlyingMinion>()`：召唤物类型
- `20`：伤害
- `2f`：击退
- `player.whoAmI`：玩家ID

## 常见问题（先救命，后讲道理）

### 1）我编译报错，最常见是哪里？

- `YourModName` 没替换：如果你项目默认命名空间不是这个，可能会提示找不到类型/命名空间。你可以先把 `namespace YourModName...` 里的 `YourModName` 换成你项目里其它 `.cs` 文件最上面用的那个名字。
- `Content.Projectiles.Minions` 写错了：`namespace` 的后半段你可以随便取，但要确保它只是"分类名"，不要写奇怪符号。
- `using YourModName.Content.Buffs;` 没加：如果 `FlyingMinionBuff` 变红，检查 `using YourModName.Content.Buffs;` 是否存在。

### 2）我进游戏找不到这个召唤武器/配方

- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 配方需要在工作台旁边打开合成栏才会出现
- 召唤武器需要右键使用才会给玩家添加召唤物Buff

### 3）我使用了召唤武器，但是没有召唤物

- 检查 `Projectile.minion = true;` 是否存在
- 检查 `AI()` 方法是否正确重写
- 检查 `Projectile.NewProjectile()` 是否在 `Update()` 方法里

## 下一步会学什么？

这一章你已经完成最关键的一步：**你能创建召唤物，并且知道如何编写AI**。

下一章我们会做第一个Boss：你会看到"Boss"是怎么拥有复杂AI和阶段转换的。
