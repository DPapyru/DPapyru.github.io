---
title: 第一个召唤物
author: 小天使
date: 2026-01-19
last_updated: 2026-01-19
difficulty: beginner
time: 25分钟
description: 做第一个召唤物同时学习AI系统
prev_chapter: ../3-战斗/DPapyru-第一个Buff.md
next_chapter: ../5-高级/DPapyru-第一个Boss.md
topic: mod-basics
order: 8
colors:
  Red: "#f00"
---

# 第一个召唤物：做一个攻击型召唤物同时学习AI系统

召唤物是什么？简单来说，**召唤物是一个跟随玩家并自动攻击敌人的实体**。比如原版的星尘龙、泰拉棱镜等。

{if C == 0}
> **适用人群**：首次接触 C#（C0）。
>
> **本章目标**：完成第一个召唤物，并能独立修改召唤物的 AI 行为。
{else}
> **适用人群**：已具备 C# 基础（C≥1）。
>
> **建议路径**：先完成"复制 → 编译 → 进游戏验证"，再集中修改 `Projectile.minion / AI() / StrikeNPC` 等关键行。
{end}

---

## 验收标准

完成本章后，你应能：

- 创建可跟随玩家的召唤物
- 编写简单的 AI 逻辑（跟随、攻击）
- 修改召唤物的属性与行为
- 理解召唤物、Buff、物品之间的关系

> 本文里会出现 `YourModName`。它是占位符：你要把它换成你自己的 Mod 名。

---

## 阅读前需求

- 已完成"第一个Buff"章节
- 已完成"第一个弹幕"章节
- 知道怎么新建 `.cs` 文件

---

## 第一步：了解代码

召唤物需要三个文件：

1. **召唤物类（Projectile）**：定义召唤物的行为和 AI
2. **召唤物Buff**：让玩家拥有召唤物
3. **召唤物品**：给玩家添加召唤物 Buff 的物品

建议你把文件放在类似位置：

- `Content/Projectiles/Minions/FlyingMinion.cs`（召唤物类）
- `Content/Buffs/FlyingMinionBuff.cs`（召唤物 Buff）
- `Content/Items/FlyingMinionStaff.cs`（召唤物品）

### 1.1 创建召唤物类

把下面这份代码复制到 `FlyingMinion.cs`：

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
            Projectile.aiStyle = -1;  // 不使用原版 AI，使用自定义 AI
        }

        // 自定义 AI
        public override void AI()
        {
            // 获取召唤物的所有者
            Player player = Main.player[Projectile.owner];

            // 如果玩家死亡或没有召唤物 Buff，召唤物消失
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

### 1.2 创建召唤物 Buff

把下面这份代码复制到 `FlyingMinionBuff.cs`：

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
            // 设置 Buff 是召唤物 Buff
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

            // 确保 Buff 不会消失
            player.buffTime[buffIndex] = 18000;
        }
    }
}
```

### 1.3 创建召唤物品

把下面这份代码复制到 `FlyingMinionStaff.cs`：

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

复制完成后先编译一次，确保"能跑"。

### 概念关联测验

> **测验对应概念**：`Projectile.minion`、`AI()`、`HasBuff()`

```quiz
type: choice
id: mod-basics-first-minion-basics
question: |
  下列哪些行是修改"召唤物行为"时最常改动的？
options:
  - id: A
    text: |
      `Projectile.minion = true;`
  - id: B
    text: |
      `Projectile.velocity = direction * 8f;`
  - id: C
    text: |
      `targetNPC.StrikeNPC(damage, 0f, 0);`
  - id: D
    text: |
      `using Terraria.ModLoader;`
answer:
  - A
  - B
  - C
explain: |
  召唤物标识在 `Projectile.minion` 里改，飞向玩家在 `Projectile.velocity` 里改，攻击伤害在 `StrikeNPC()` 里改。
```

---

## 第二步：练习（建议）

### 2.1 召唤物文件里最常改的行

在 `SetDefaults()` 里：

- `Projectile.minionSlots = 1;`（占用槽位）
- `Projectile.timeLeft = 18000;`（存在时间）
- `Projectile.aiStyle = -1;`（自定义 AI）

在 `AI()` 里：

- `Projectile.velocity`（移动速度）
- `targetNPC.StrikeNPC(damage, 0f, 0);`（攻击伤害）

### 2.2 练习方式

把这些行删掉，再自己敲回去。

---

## 第三步：补充阅读（按需）

{if C == 0}
{[./_分流/第一个召唤物-C0-CSharp读代码.md][C# 补课（C0）：看懂本章语法]}
{end}

{if T == 0}
{[./_分流/第一个召唤物-T0-tML读代码.md][tModLoader 补课（T0）：看懂本章 API]}
{end}

---

## 常见问题（排错）

### 1）我编译报错，最常见是哪里？

**原因**：`YourModName` 没替换，或 `namespace` 写错了

**解决**：
- 检查 `namespace YourModName...` 里的 `YourModName` 是否换成你项目实际使用的名字
- 检查 `using YourModName.Content.Buffs;` 是否正确

### 2）我进游戏找不到这个召唤武器/配方

**解决**：
- 确认 Mod 已启用，且你确实重新"编译并加载"了 Mod
- 配方需要在工作台旁边打开合成栏才会出现
- 召唤武器需要右键使用才会给玩家添加召唤物 Buff

### 3）我使用了召唤武器，但是没有召唤物

**解决**：
- 检查 `Projectile.minion = true;` 是否存在
- 检查 `AI()` 方法是否正确重写
- 检查 `Projectile.NewProjectile()` 是否在 `Update()` 方法里

---

## 本章自测（可选）

用于自查是否达到"能创建召唤物"的最低标准：

- [ ] 我能指出 `SetDefaults()` 中三处常改动点：槽位/时间/AI样式
- [ ] 我能指出 `AI()` 中两处常改动点：移动/攻击
- [ ] 我能解释召唤物、Buff、物品三者之间的关系

---

## 下一步

本章完成后，你应能独立创建召唤物并编写简单的 AI 行为。

下一章我们会做"第一个 Boss"：你会看到 Boss 是怎么拥有复杂 AI 和阶段转换的。
