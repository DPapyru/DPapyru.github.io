---
title: 第一个NPC - 创建基础怪物
description: 创建一个基础的 NPC 怪物，理解 NPC 的基本结构
author: Papyru
category: Modder入门
topic: mod-dev
last_updated: 2026-01-30
prev_chapter: 调试实战
next_chapter: 第一个弹幕
---

## 版本说明

> WARNING: 版本说明：本教程适用于 **tModLoader 1.4.4+**

> NPC API 在 1.4.4 版本中有较多更新，本文基于 1.4.4 编写。

兼容性说明：
- 1.4.4+: NPC API 与本文完全兼容
- 1.4.3 及更旧: 某些属性和方法可能不存在

## 本章目标

你已经学会了创建物品，现在我们进入更复杂的领域：创建 NPC。

本章目标：
- 理解 NPC 类的基本结构
- 创建一个基础的怪物 NPC
- 实现简单的 AI 行为
- 掌握 NPC 的属性设置
- 学会 NPC 的生成方法

预计用时：45-60 分钟

## 第一步：创建 NPC 类

创建一个继承 `ModNPC` 的类。

关键点：
- 类名建议和文件名一致（便于管理）
- 必须继承 `ModNPC`
- 需要重写必要的方法

**文件结构**：
```
MyFirstMod/
  NPCs/
    MyMonster.cs       // NPC 类
    MyMonster.png      // NPC 贴图（可选）
```

**代码示例**：
```csharp
using Terraria;
using Terraria.ModLoader;

namespace MyFirstMod.NPCs {
    public class MyMonster : ModNPC {
        // 这里添加 NPC 的代码
    }
}
```

**命名建议**：
- 使用描述性的类名，如 `MyMonster`、`Ghost`、`ZombieBoss`
- 避免使用过于简单的名称，如 `NPC1`、`MyNPC`

## 第二步：设置静态属性

`SetStaticDefaults` 方法在 Mod 加载时调用一次，用于设置不随单个 NPC 实例变化的属性。

**常用属性**：
- `DisplayName.SetDefault()` - 设置显示名称
- `Main.npcFrameCount[NPC.type]` - 设置帧数（用于动画）
- `NPCID.Sets.NPCBestiaryDrawOffset` - 图鉴显示偏移
- `NPCID.Sets.NPCBestiaryDrawModifiers` - 图鉴绘制修饰

**代码示例**：
```csharp
public override void SetStaticDefaults() {
    // 设置 NPC 的显示名称
    DisplayName.SetDefault("我的怪物");
    
    // 设置帧数（参考原版僵尸）
    Main.npcFrameCount[NPC.type] = Main.npcFrameCount[NPCID.Zombie];
    
    // 添加到怪物图鉴
    NPCID.Sets.NPCBestiaryDrawOffset.Add(Type, new(0, 4f));
}
```

**注意事项**：
- `DisplayName.SetDefault()` 必须调用，否则怪物没有名字
- 帧数需要根据贴图实际帧数设置
- 图鉴相关设置是可选的，但建议添加

## 第三步：设置实例属性

`SetDefaults` 方法在每次 NPC 生成时调用，用于设置单个 NPC 实例的属性。

**常用属性**：
- `width` / `height` - 碰撞箱尺寸
- `damage` - 造成伤害
- `defense` - 防御力
- `lifeMax` - 最大生命值
- `value` - 掉落金币价值
- `knockBackResist` - 击退抗性
- `aiStyle` - AI 类型（可参考原版）

**代码示例**：
```csharp
public override void SetDefaults() {
    // 基础属性
    NPC.width = 32;  // 宽度
    NPC.height = 44;  // 高度
    NPC.damage = 10;  // 伤害
    NPC.defense = 5;  // 防御
    NPC.lifeMax = 100;  // 最大生命值
    NPC.value = Item.buyPrice(copper: 50);  // 价值 50 铜币
    NPC.knockBackResist = 0.5f;  // 击退抗性 50%
    
    // AI 相关
    NPC.aiStyle = 3;  // 使用原版僵尸的 AI
    NPC.timeLeft = NPC.activeTime * 30;  // 存在时间
    
    // 标签
    NPC.HitSound = SoundID.NPCHit1;  // 被击中音效
    NPC.DeathSound = SoundID.NPCDeath1;  // 死亡音效
}
```

**属性说明**：
- `width` 和 `height` 应该根据贴图实际尺寸设置
- `lifeMax` 决定了怪物的血量，建议从 50-200 开始
- `damage` 建议从 5-20 开始（避免过强或过弱）
- `aiStyle` 可以参考原版 NPC 的值（3 是僵尸 AI）

## 第四步：实现 AI 行为

`AI` 方法每帧调用一次（60 次/秒），用于实现 NPC 的行为逻辑。

**AI 基础概念**：
- `NPC.ai` 数组：用于存储自定义 AI 数据（float[4]）
- `NPC.localAI` 数组：客户端本地 AI 数据（float[2]）
- `NPC.velocity`：速度向量
- `NPC.target`：目标玩家索引

**基础 AI 示例**：
```csharp
public override void AI() {
    // 查找最近的目标（玩家）
    NPC.TargetClosest(true);
    
    // 如果有有效目标
    if (NPC.HasValidTarget) {
        // 计算方向向量
        Vector2 direction = Main.player[NPC.target].Center - NPC.Center;
        direction.Normalize();
        
        // 移动向目标
        NPC.velocity = direction * 2f;
    } else {
        // 没有目标时随机移动
        NPC.velocity.X = Main.rand.NextFloat(-2f, 2f);
    }
    
    // 确保怪物在地面上
    if (NPC.collideX) {
        NPC.velocity.X *= -1f;
    }
}
```

**高级 AI 技巧**：
```csharp
private int aiTimer = 0;

public override void AI() {
    aiTimer++;
    
    NPC.TargetClosest(true);
    
    // 每 2 秒改变一次移动方向
    if (aiTimer % 120 == 0) {
        if (NPC.HasValidTarget) {
            Vector2 direction = Main.player[NPC.target].Center - NPC.Center;
            direction.Normalize();
            NPC.velocity = direction * 2f;
        }
    }
}
```

**注意事项**：
- AI 方法每帧调用，避免在 AI 中进行繁重的计算
- 使用计时器控制动作频率（而不是每帧都执行）
- 参考 `Main.npcFrameCount` 实现动画
- 碰撞检测使用 `NPC.collideX`、`NPC.collideY`

## 第五步：NPC 生成方法

有两种方法让 NPC 生成在游戏中：
1. 通过 `SpawnConditions` 自动生成
2. 手动使用代码生成

### 方法1：自动生成（推荐）

```csharp
public override float SpawnChance(NPCSpawnInfo spawnInfo) {
    // 只在夜间生成
    if (!Main.dayTime) {
// 只在地表生成
if (spawnInfo.spawnTileY < Main.worldSurface) {
    return 0.1f;  // 10% 的生成率
}
    }
    
    return 0f;  // 不生成
}
```

**常见生成条件**：
- `Main.dayTime` - 是否白天
- `spawnInfo.spawnTileY < Main.worldSurface` - 地表
- `spawnInfo.spawnTileX` - X 坐标
- `spawnInfo.playerSafe` - 玩家是否安全（是否有房子）
- `spawnInfo.playerInTown` - 玩家是否在城镇

### 方法2：手动生成

```csharp
// 在 Mod 类中添加生成方法
public void SpawnMyMonster(Vector2 position) {
    int npcType = ModContent.NPCType<MyMonster>();
    int npcIndex = NPC.NewNPC(null, (int)position.X, (int)position.Y, npcType);
    
    if (Main.netMode == NetmodeID.Server) {
// 同步到客户端
NetMessage.SendData(MessageID.SyncNPC, -1, -1, null, npcIndex);
    }
}

// 使用示例：在玩家按下某个键时生成
public override void PostUpdate() {
    Player player = Main.LocalPlayer;
    
    // 按下 F5 键生成怪物
    if (Main.keyState.IsKeyDown(Keys.F5)) {
SpawnMyMonster(player.Center + new Vector2(0, -200));
    }
}
```

### 使用 Hero's Mod 生成

1. 安装 Hero's Mod
2. 在游戏中打开命令界面
3. 输入命令：
   ```
   /spawnnpc MyModName:MyMonster
   ```

4. 按 Enter 执行，怪物会在玩家附近生成

## 验证清单

### 验证清单

**阶段1：代码结构**
- 创建了 NPC 类（继承 `ModNPC`）
- 重写了 `SetStaticDefaults` 方法
- 重写了 `SetDefaults` 方法
- 重写了 `AI` 方法（如果需要自定义 AI）
- 添加了 `SpawnChance` 方法（如果需要自动生成）

**阶段2：属性设置**
- 设置了 `DisplayName`
- 设置了 `width` 和 `height`
- 设置了 `damage`（建议 5-20）
- 设置了 `defense`（建议 0-10）
- 设置了 `lifeMax`（建议 50-200）
- 设置了碰撞音效和死亡音效

**阶段3：AI 行为**
- AI 方法每帧执行
- NPC 能找到目标玩家
- NPC 能向目标移动
- 使用了计时器控制动作频率

**阶段4：生成验证**
- NPC 能在游戏中生成
- NPC 显示正确的名称
- NPC 能正常移动
- NPC 能造成伤害
- NPC 能被击败

### 常见问题排查

**问题1：NPC 没有名字**
- 检查 `SetStaticDefaults` 中是否调用了 `DisplayName.SetDefault()`

**问题2：NPC 不移动**
- 检查 `AI` 方法是否被正确重写
- 检查 `NPC.velocity` 是否被设置
- 检查是否有碰撞箱问题

**问题3：NPC 不生成**
- 检查 `SpawnChance` 返回值是否大于 0
- 检查生成条件是否满足（白天/夜间、位置等）
- 使用 Hero's Mod 手动生成测试

**问题4：NPC 瞬间消失**
- 检查 `lifeMax` 是否设置
- 检查 `NPC.timeLeft` 是否设置过大
- 检查是否有外部逻辑导致 NPC 被杀死

### 下一步

完成本章后，你已经掌握了创建基础 NPC 的方法。

接下来，你将学习：
- 《第一个弹幕》 - 创建攻击效果
- 《NPC弹幕联动》 - 让怪物发射弹幕
- 《世界生成基础》 - 修改世界生成规则

这些内容将帮助你创建更丰富、更有趣的 Mod 内容。

<!-- generated from: Modder入门/详细文档/Mod开发实践/第一个NPC.cs -->
