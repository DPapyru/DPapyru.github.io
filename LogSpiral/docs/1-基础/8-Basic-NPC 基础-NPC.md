***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC/0883f94540ceb6a3350a5d8d8094c31a749f1c02)
***

# What is an NPC

An NPC is a "non-player character", in Terraria these are enemies, critters, townspeople, and rarely projectiles disguised as NPCs that you can damage (imp fireball, dark caster's water sphere).

**####**

**This page is very incomplete; For other NPC related pages, visit the wiki search bar**

**####**

# Spawn projectiles

If you want your hostile `NPC` to spawn projectiles, first of all make sure the projectile you spawn is hostile and not friendly, so that it won't damage other hostile NPCs and so that it will damage players and friendly critters.
This code usually goes in the [AI](https://docs.tmodloader.net/docs/stable/class_mod_n_p_c.html#ae8d0a987b5ccdb2c583e789af32c9287) hook. It shows the most common scenario: shoot one projectile from the NPC directly towards the targeted player (usually the nearest):

```csharp
NPC.TargetClosest();
if (NPC.HasValidTarget && Main.netMode != NetmodeID.MultiplayerClient)
{
    var source = NPC.GetSource_FromAI();
    Vector2 position = NPC.Center;
    Vector2 targetPosition = Main.player[NPC.target].Center;
    Vector2 direction = targetPosition - position;
    direction.Normalize();
    float speed = 10f;
    int type = ProjectileID.PinkLaser;
    int damage = NPC.damage; //If the projectile is hostile, the damage passed into NewProjectile will be applied doubled, and quadrupled if expert mode, so keep that in mind when balancing projectiles if you scale it off NPC.damage (which also increases for expert/master)
    Projectile.NewProjectile(source, position, direction * speed, type, damage, 0f, Main.myPlayer);
}
```

You can emit the `NPC.TargetClosest();` code if you already have it in your `AI`. You want to couple this usually with a [timer](https://github.com/tModLoader/tModLoader/wiki/Time-and-Timers), and if you want to spawn it some other way, [ExampleGun](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleGun.cs) showcases a few variants you can transfer over (logically, don't copy its code into the NPC, it won't work). Visit the [NewProjectile](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#public-static-int-newprojectileientitysource-spawnsource-float-x-float-y-float-speedx-float-speedy-int-type-int-damage-float-knockback-int-owner--255-float-ai0--0f-float-ai1--0f-) documentation for more info.

# Frequently Asked Questions
### The NPC never spawns or disappears if spawned in manually
This can happen if you accidently wrote `NPC.life = value` instead of `NPC.lifeMax = value` in `SetDefaults`.

### The NPC has much higher stats in hardmode
This occurs if the base stats like damage, defense, and lifeMax are comparably small (equivalent to Blue Slime for example). Add `NPCID.Sets.DontDoHardmodeScaling[Type] = true` in `SetStaticDefaults`.

### The spawned projectile deals no damage/disappears immediately
Make sure the `Owner` parameter in `Projectile.NewProjectile` is set to `Main.myPlayer`. A common misconception is setting it to `NPC.whoAmI`, which is not what the game expects. The owner exists to determine for what side/client to execute various logic on, such as dealing damage or handling projectile disappearing.

### The spawned projectile deals way too much damage
In expert mode, NPC.damage is scaled up by 2 (by default). Various NPCs also scale in damage again once reaching hardmode (important if you use NPC.damage to spawn the projectile with). In addition to all of that, hostile projectiles gain an automatic x2 damage, with another x2 added for expert mode. If you want to counteract that, halve the damage before spawning the projectile, and again in expert mode.