---
title: 实战项目：第一个完整Mod - 从零到发布
description: 整合所学知识，创建一个完整的 Mod 项目
author: Papyru
category: Modder入门
topic: mod-dev
last_updated: 2026-01-30
---

> WARNING: 版本说明：本教程适用于 **tModLoader 1.4.4+**

## 项目目标

创建一个包含以下内容的完整 Mod：
1. 新武器物品
2. 配方合成
3. 新 NPC 怪物
4. 自定义弹幕

## 项目结构

```
MyFirstCompleteMod/
  MyFirstCompleteMod.cs     // Mod 主类
  Items/
    MySword.cs
    MySword.png
  NPCs/
    MyMonster.cs
    MyMonster.png
  Projectiles/
    MyProjectile.cs
    MyProjectile.png
  build.txt                 // 构建配置
  description.txt           // Mod 描述
```

## 步骤1：创建 Mod 主类

```csharp
public class MyFirstCompleteMod : Mod {
    public override void Load() {
        // 自动加载所有内容
    }
}
```

## 步骤2：添加物品

### 武器物品

```csharp
public class MySword : ModItem {
    public override void SetDefaults() {
        Item.damage = 20;
        Item.DamageType = DamageClass.Melee;
        Item.width = 40;
        Item.height = 40;
        Item.useTime = 25;
        Item.useAnimation = 25;
        Item.useStyle = ItemUseStyleID.Swing;
        Item.knockBack = 6f;
        Item.value = Item.buyPrice(silver: 50);
        Item.rare = ItemRarityID.Green;
        Item.UseSound = SoundID.Item1;
    }
    
    public override void AddRecipes() {
        CreateRecipe()
            .AddIngredient(ItemID.IronBar, 10)
            .AddIngredient(ItemID.Wood, 5)
            .AddTile(TileID.Anvils)
            .Register();
    }
}
```

## 步骤3：添加怪物

```csharp
public class MyMonster : ModNPC {
    public override void SetStaticDefaults() {
        DisplayName.SetDefault("水晶骷髅");
        Main.npcFrameCount[NPC.type] = Main.npcFrameCount[NPCID.Skeleton];
    }
    
    public override void SetDefaults() {
        NPC.width = 30;
        NPC.height = 50;
        NPC.damage = 15;
        NPC.defense = 6;
        NPC.lifeMax = 80;
        NPC.value = Item.buyPrice(silver: 10);
        NPC.aiStyle = 3;
    }
    
    public override float SpawnChance(NPCSpawnInfo spawnInfo) {
        return !Main.dayTime ? 0.1f : 0f;
    }
}
```

## 步骤4：添加弹幕

```csharp
public class MyProjectile : ModProjectile {
    public override void SetDefaults() {
        Projectile.width = 16;
        Projectile.height = 16;
        Projectile.damage = 25;
        Projectile.friendly = true;
        Projectile.penetrate = 1;
        Projectile.timeLeft = 300;
    }
}
```

## 步骤5：配置文件

### build.txt

```
authorName = Papyru
modName = MyFirstCompleteMod
modVersion = 1.0.0
description = 我的第一个完整 Mod
```

### description.txt

```
我的第一个完整 Mod

添加了新武器、怪物和弹幕。
```

## 步骤6：测试

1. 启动游戏，加载 Mod
2. 合成武器，测试使用
3. 找到怪物，测试战斗
4. 检查所有功能正常
5. 查看日志确认无错误

## 步骤7：发布

1. 运行 `tModLoader -build build.txt`
2. 生成 `.tmod` 文件
3. 在 Mod Browser 上传
4. 填写描述和标签
5. 提交审核

## 优化建议

- 添加贴图和音效
- 实现更多合成配方
- 创建更多怪物
- 添加套装效果
- 编写详细文档

## 完成检查

- Mod 能正常加载
- 物品能合成和使用
- 怪物能生成和战斗
- 弹幕能正常工作
- 无运行时错误
- 已生成 `.tmod` 文件

恭喜你完成了第一个完整 Mod！

<!-- generated from: Modder入门/详细文档/Mod开发实践/实战项目第一个完整Mod.cs -->
