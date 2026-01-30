using ModDocProject;
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.Mod开发实践 {
    #region 元数据
    [Title("第一个弹幕 - 创建攻击效果")]
    [Tooltip("创建基础弹幕并理解其工作原理")]
    [UpdateTime("2026-01-30")]
    [Author("Papyru")]
    [Category("Modder入门")]
    [Topic("mod-dev")]
    [PrevChapter("第一个NPC")]
    [NextChapter("NPC弹幕联动")]
    #endregion
    public class 第一个弹幕 : ModProjectile {
#if DOCS
        #region 版本说明
public const string DocMarkdown_0 = """
> WARNING: 版本说明：本教程适用于 **tModLoader 1.4.4+**

> 弹幕 API 在 1.4.4 版本有更新，本文基于 1.4.4 编写。
""";
        #endregion

        #region 本章目标
        public const string DocMarkdown_1 = """
弹幕是游戏中的"飞行物体"，包括箭矢、魔法弹、火焰等。

本章目标：
- 理解 Projectile 类结构
- 创建基础弹幕
- 实现弹幕的移动和生命周期
- 让物品发射弹幕

预计用时：30-45 分钟
""";
        #endregion

        #region 弹幕基础概念
        public const string DocMarkdown_2 = """
弹幕（Projectile）是游戏中独立运动的对象。

常见弹幕类型：
- 物理弹幕：箭矢、飞刀（受重力影响）
- 魔法弹幕：火球、激光（直线飞行）
- 特殊弹幕：追踪弹、爆炸弹（自定义行为）

弹幕属性：
- `Projectile.width/height` - 碰撞箱尺寸
- `Projectile.damage` - 伤害值
- `Projectile.velocity` - 速度向量
- `Projectile.ai` - 自定义 AI 数据（float[4]）
- `Projectile.owner` - 发射者（玩家或 NPC）
""";
        #endregion

        #region 第一步：创建弹幕类
        public const string DocMarkdown_3 = """
创建继承 `ModProjectile` 的类。

```csharp
public class MyProjectile : ModProjectile {
    // 弹幕代码
}
```

文件结构：
```
Projectiles/
  MyProjectile.cs
  MyProjectile.png  (可选贴图)
```
""";
        #endregion

        #region 第二步：设置属性
        public const string DocMarkdown_4 = """
`SetDefaults` 设置弹幕的初始属性。

```csharp
public override void SetDefaults() {
    // 基础属性
    Projectile.width = 16;
    Projectile.height = 16;
    Projectile.damage = 15;
    Projectile.knockBack = 3f;
    
    // 行为属性
    Projectile.friendly = true;  // 友好（玩家使用）
    Projectile.hostile = false;  // 不敌对
    Projectile.tileCollide = true;  // 会撞墙
    
    // 时间属性
    Projectile.penetrate = 1;  // 穿透次数
    Projectile.timeLeft = 300;  // 存在时间（5秒）
}
```
""";
        #endregion

        #region 第三步：实现 AI 行为
        public const string DocMarkdown_5 = """
`AI` 方法每帧调用一次，控制弹幕行为。

```csharp
public override void AI() {
    // 添加粒子效果（可选）
    if (Main.rand.NextBool(3)) {
        Dust.NewDust(
            Projectile.position,
            Projectile.width,
            Projectile.height,
            DustID.Fire,
            Projectile.velocity.X * 0.5f,
            Projectile.velocity.Y * 0.5f
        );
    }
    
    // 重力效果（可选）
    Projectile.velocity.Y += 0.1f;
    
    // 旋转效果（可选）
    Projectile.rotation += 0.1f;
}
```
""";
        #endregion

        #region 第四步：让物品发射弹幕
        public const string DocMarkdown_6 = """
修改物品的 `UseItem` 方法发射弹幕。

```csharp
public override bool? UseItem(Player player) {
    // 发射弹幕
    int damage = Item.damage;
    int knockback = Item.knockBack;
    
    // 计算发射方向
    Vector2 mousePos = Main.MouseScreen;
    Vector2 playerPos = Main.screenPosition + new Vector2(Main.screenWidth / 2, Main.screenHeight / 2);
    Vector2 direction = mousePos - playerPos;
    direction.Normalize();
    
    // 生成弹幕
    int projectileType = ModContent.ProjectileType<MyProjectile>();
    Projectile.NewProjectile(
        null,
        player.Center,
        direction * 10f,  // 速度
        projectileType,
        damage,
        knockback,
        player.whoAmI
    );
    
    return true;
}
```

**注意事项**：
- 确保物品的 `Item.shoot` 和 `Item.shootSpeed` 设置正确
- 使用 `ModContent.ProjectileType<>` 获取弹幕类型
""";
        #endregion

        #region 验证清单
public const string DocMarkdown_7 = """
### 验证清单

- 创建了弹幕类（继承 `ModProjectile`）
- 设置了碰撞箱尺寸
- 设置了伤害值
- 实现了 `AI` 方法（如果需要自定义行为）
- 物品能成功发射弹幕
- 弹幕能正常移动
- 弹幕能击中敌人

### 常见问题

**问题1：弹幕不显示**
- 检查贴图是否存在
- 检查 `Projectile.width` 和 `height` 是否设置

**问题2：弹幕不移动**
- 检查 `Projectile.velocity` 是否在生成时设置
- 检查是否有 `Projectile.tileCollide = true` 但立即撞墙

**问题3：弹幕无法伤害敌人**
- 检查 `Projectile.friendly = true`
- 检查 `Projectile.damage` 是否设置

### 下一步

完成本章后，你掌握了弹幕的基础用法。

接下来学习：
- 《NPC弹幕联动》 - 让怪物发射弹幕
- 《世界生成基础》 - 修改世界生成规则
        """;
        #endregion
#endif
    }
}
