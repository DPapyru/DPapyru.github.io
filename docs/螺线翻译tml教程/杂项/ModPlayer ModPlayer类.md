# What is a ModPlayer
`ModPlayer` is the class used to add data and functionality to players. Each player will automatically have an instance of every `ModPlayer` attached to it, allowing the `ModPlayer` class to act as an extension to the vanilla `Player` class.

We use `ModPlayer` classes to store state and use that state to apply logic to affect the behavior of the player.

# If X, do Y
The most common usage of `ModPlayer` is to make a player do something when some other condition is met. Or in other words, "If X, do Y". As an example, we will explore how an accessory can give a player a specific effect. While this example is an accessory, the same logic applies to buffs, armor, potions, etc. This section will go through the code of [SimpleModPlayer](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/Players/SimpleModPlayer.cs).

First, we need to add a field to the `ModPlayer` to track if the effect is active on the player or not:
```cs
public bool FrostBurnSummon;
```
Next, we need to use the `ResetEffects` method to reset it to the default value. The game is designed in such a way that all gameplay effects and stats are recalculated each game update, this method facilitates that:
```cs
public override void ResetEffects() {
	FrostBurnSummon = false;
}
```
Next, we need to use our field to drive some gameplay logic. This is the "do Y" in "If X, do Y". This can be anything, such as when the player is damaged or damages an enemy, or when the player heals, or each game update. This usually comes down to finding a specific `ModPlayer` hook that relates to the desired effect and using it. The [ModPlayer documentation](https://docs.tmodloader.net/docs/stable/class_mod_player.html) and various ExampleMod examples can be consulted to find the correct approach. In this example, we will be using the `ModPlayer.OnHitNPCWithProj` method:
```cs
public override void OnHitNPCWithProj(Projectile proj, NPC target, NPC.HitInfo hit, int damageDone) {
	if ((proj.minion || ProjectileID.Sets.MinionShot[proj.type]) && FrostBurnSummon && !proj.noEnchantments) {
		target.AddBuff(BuffID.Frostburn, 60 * Main.rand.Next(3, 6));
	}
}
```
And finally, we need to give the player our effect under some conditions. This is the "If X" in "If X, do Y". Since this examples is an accessory item, the correct place is in `ModItem.UpdateAccessory`:
```cs
public override void UpdateAccessory(Player player, bool hideVisual) {
	player.GetModPlayer<SimpleModPlayer>().FrostBurnSummon = true;
}
```

And that's it. In summary, the `ModPlayer` is in charge of the actual logic of the effect, while accessories, buffs, armor, etc. is in charge of telling the player that the effect should be active. 

> [!NOTE]
> You might expect an accessory to contain the code for the effect it gives, but this is not how the game is designed. This is especially relevant when your mod introduces upgraded accessories. In the upgraded accessory item, you would just set the same `ModPlayer` fields as the original accessory item, and maybe add some additional effects. This design avoids duplicating gameplay logic code.

# Multiple ModPlayer Classes
Mods can have multiple `ModPlayer` classes, in fact, we highly recommend it. In particular, we recommend that `ModPlayer` classes stick to a single "responsibility". This means that a `ModPlayer` class in charge of fishing adjustments, for example, wouldn't also contain adjustments to max health stats.

# More Information
`ExampleMod` contains a wide variety of [`ModPlayer` examples](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Common/Players). Each example is documented and can be studied and applied to your own mod. 

Other related wiki page:
* [Saving and loading using TagCompound](https://github.com/tModLoader/tModLoader/wiki/Saving-and-loading-using-TagCompound) - Read this to learn about implementing persistent effects, since those require saving and loading.
* [ModPlayer documentation](https://docs.tmodloader.net/docs/stable/class_mod_player.html) - Find appropriate `ModPlayer` "hooks" suitable for your desired gameplay effects by searching the documentation.