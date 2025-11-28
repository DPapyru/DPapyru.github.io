***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Basic-Ammo/3ac8255f8a511bc25d15090d52fcd045febccb4f)
***

# What is Ammo?
Ammo is a system that links Weapon items, ammo items, and projectiles together. The basic idea is this: Weapon items have `Item.useAmmo` set to an AmmoID, Ammo items that weapon should use have `Item.ammo` set to that same AmmoID, and that Ammo item has `Item.shoot` set to the particular projectile that will be shot by the weapon when the ammo is used.

As an example, let's consider `Wooden Bow` and `Flaming Arrow`. The `Wooden Bow` has `Item.useAmmo = AmmoID.Arrow;` and `Flaming Arrow` has `Item.shoot = ProjectileID.FireArrow;` and `Item.ammo = AmmoID.Arrow;`. When the player is shooting their `Wooden Bow`, Terraria looks in the player's inventory and searches for items with `Item.ammo` matching `Wooden Bow`'s `Item.useAmmo`. If an ammo item is found, the ammo item's `Item.shoot` projectile is spawned and the ammo is consumed.

As a convention, AmmoIDs match the ItemID of the first ammo item. For example, AmmoID.Arrow and ItemID.WoodenArrow are both equal to 40. All other arrows have `Item.ammo = AmmoID.Arrow;`.

# How do I use vanilla ammo for my weapon?
To use vanilla ammo, simply set Item.useAmmo to the correct AmmoID. For example, `Example Gun` in ExampleMod has `Item.useAmmo = AmmoID.Bullet;`.

# How do I make a vanilla ammo?
To make an ammo that belongs to a vanilla ammo class, simply set Item.ammo to the correct AmmoID. For example, `Example Bullet` has `Item.ammo = AmmoID.Bullet;` set in it's SetDefaults method. In addition, the ammo item must also define the projectile that the ammo shoots. `Example Bullet` shows this example: `Item.shoot = ModContent.ProjectileType<Projectiles.ExampleBullet>();`

# How do I make a new ammo class?
A new ammo class can be made by designating one of your ammo items as the AmmoID. For example, Example Mod shows us a new "ExampleCustomAmmo" ammo class. The `ExampleCustomAmmo` item has `Item.ammo = Item.type;` to designate it as a the defining ammo of the ammo class. `ExampleCustomAmmoGun` has `Item.useAmmo = ModContent.ItemType<ExampleCustomAmmo>();` to match the pattern we have established with vanilla ammo items.
Any further ammo would have `Item.ammo = ModContent.ItemType<ExampleCustomAmmo>()` and any other weapons using that ammo would have `Item.useAmmo = ModContent.ItemType<ExampleCustomAmmo>()`.

# How can I make a new ammo class out of vanilla items?
Use a GlobalItem class to set `Item.ammo` and `Item.shoot` to a new projectile that you've made.

```cs
public class AmmoModificationsGlobalItem : GlobalItem
{
	public override void SetDefaults(Item item)
	{
		// We type "item" here instead of "Item" because this item is a parameter named "item".
		if (item.type == ItemID.Rope)
		{
			item.ammo = ItemID.Rope;
			item.shoot = ModContent.ProjectileType<RopeShot>();
		}
		if (item.type == ItemID.VineRope)
		{
			item.ammo = ItemID.Rope;
			item.shoot = ModContent.ProjectileType<VineRopeShot>();
		}
		// and so on, for SilkRope and WebRope
	}
}
```

Note that using vanilla items to make new items runs the risk of conflict with other mods, so use it sparingly to maintain compatibility and to prevent your players from getting confused.

# Weapons using Multiple Ammo Types or Ignoring Specific Ammo Items
The [ModItem.CanChooseAmmo](https://docs.tmodloader.net/docs/stable/class_mod_item.html#a20ec23ea02f6acf3a68fa63aabb14917) hook allows weapons to supplant the normal ammo choosing logic. A common usage is to allow a weapon to use multiple ammo types. See [ExampleSpecificAmmoGun.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleSpecificAmmoGun.cs#L68) for an example of this as well as additional notes.

# Manually Consuming Ammo
Ammo is typically consumed by weapons via the game logic, but there are situations where the modder might need to manually choose and consume ammo. The most typical example of this is held projectile weapons. These include Vortex Beater, Phantasm, Celebration Mk2, and Phantom Phoenix.

**TODO**