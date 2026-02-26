using Terraria;

namespace ExMod.Content.Projectile;

public class FirstProj : ModProjectile
{
    public override void SetDefaults()
    {
        Projectile.aiStyle = -1; // 设置弹幕的aiStyle避免出现 AI冲突 问题，当然设置为其它值，如 ProjAIStyleID.Arrow 这一类也行
    }
    public override void OnHitNPC(NPC target, HitInfo hit, int damageDone)
    {
        
    }
}