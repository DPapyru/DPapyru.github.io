using ModDocProject;
using Terraria;
using Terraria.ModLoader;

namespace ModDocProject.Modder入门.详细文档.Mod开发实践 {
    #region 元数据
    [Title("NPC弹幕联动 - 让怪物发射弹幕")]
    [Tooltip("实现怪物发射弹幕并控制弹幕行为")]
    [UpdateTime("2026-01-30")]
    [Author("Papyru")]
    [Category("Modder入门")]
    [Topic("mod-dev")]
    [PrevChapter("第一个弹幕")]
    [NextChapter("世界生成基础")]
    #endregion
    public class NPC弹幕联动 : ModNPC {
#if DOCS
public const string DocMarkdown_0 = """
> WARNING: 版本说明：本教程适用于 **tModLoader 1.4.4+**

## 本章目标

学会让 NPC 发射弹幕，实现怪物的远程攻击。

## NPC 发射弹幕

使用 `Projectile.NewProjectile` 方法：

```csharp
public override void AI() {
    NPC.ai[0]++;  // 计时器
    
    // 每 120 帧（2秒）发射一次
    if (NPC.ai[0] >= 120) {
        NPC.ai[0] = 0;
        
        if (NPC.HasValidTarget) {
            // 计算方向
            Vector2 direction = Main.player[NPC.target].Center - NPC.Center;
            direction.Normalize();
            
            // 发射弹幕
            Projectile.NewProjectile(
                null,
                NPC.Center,
                direction * 5f,
                ModContent.ProjectileType<MyProjectile>(),
                10,  // 伤害
                2f,  // 击退
                NPC.whoAmI  // 发射者
            );
        }
    }
}
```

## 弹幕来源

使用 `IEntitySource` 标识弹幕来源：

```csharp
IEntitySource source = NPC.GetSource_FromAI();

Projectile.NewProjectile(
    source,
    NPC.Center,
    direction * 5f,
    ModContent.ProjectileType<MyProjectile>(),
    10,
    2f,
    Main.myPlayer
);
```

## 控制发射频率

使用计时器控制：

```csharp
private float attackTimer = 0;

public override void AI() {
    attackTimer++;
    
    if (attackTimer >= 120) {
        attackTimer = 0;
        // 发射弹幕
    }
}
```

## 验证清单

- NPC 能在 AI 中发射弹幕
- 弹幕指向玩家
- 发射频率合理
- 弹幕来源正确标识

## 下一步

学习《世界生成基础》修改世界生成规则。
""";
#endif
    }
}
