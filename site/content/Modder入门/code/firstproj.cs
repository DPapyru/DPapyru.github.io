using Terraria;

namespace ExMod.Content.Projectiles;

public class FirstProj : ModProjectile
{
    public override void SetDefaults()
    {
        Projectile.aiStyle = -1; // 设置弹幕的aiStyle避免出现 AI冲突 问题，当然设置为其它值，如 ProjAIStyleID.Arrow 这一类也行
        Projectile.width = Projectile.height = 30; // 设置弹幕的宽高
        Projectile.DamageType = DamageClass.Melee; // 设置弹幕的伤害类型,非友好类型能够跳过
        Projectile.friendly = true; // 友好弹幕，可以伤害敌对NPC
        Projectile.hostile = false; // 敌对弹幕，能和上面一起true，然后谁也打（
        Projectile.usesLocalNPCImmunity = true; // 启动独立无敌帧
        Projectile.localNPCHitCooldown = 1; // 设置无敌帧
        Projectile.tileCollide = false; // 设置弹幕能否碰撞物块
    }
    public override void AI()
    {
        // 这里填写AI内容
        // 弹幕的更新应该都在这里更新(当然还有别的地方，不过最推荐这边)
    }

    public void TryArrow()
    {
        // 这个方法里面是试试 Arrow 的AI运动
        // 核心逻辑是：有一个重力向下，水平速度不变，向下的速度有一个上限
        if(Projectile.velocity.Y < 3) // 注意！泰拉坐标轴的Y轴和平常的平面直角坐标轴是反过来的，上是负数，下是正数！
            Projectile.velocity.Y += 0.1f;
    }
}