using Terraria;
using Terraria.ModLoader;

public class ExampleItem : ModItem
{
    public override void SetDefaults()
    {
        Main.NewText("Hello tML IDE");
    }
    public override bool Shoot(player, source, position, velocity, type, damage, knockback)
    {
        Projectile.NewProjectile()
        return false;
    }
}