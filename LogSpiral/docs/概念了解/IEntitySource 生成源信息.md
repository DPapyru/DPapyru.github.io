If you are making a 1.4 tModLoader mod, you will need to use `IEntitySource`. This guide will go over the purpose of `IEntitySource` and the most frequent uses of it.

# Purpose of IEntitySource
`IEntitySource` works with the `OnSpawn` hooks to provide additional information about _why_ a `Projectile/NPC/Item` is spawned in the world. There are two primary use cases:
- Altering the properties of an `NPC`/`Projectile` only when spawned from a specific context (eg bombs from pots, or minions of a boss).
- Transferring stats or buffs (such as npc banner id, or player/weapon crit chance), from the source to the spawned entity (normally a `Projectile`)

For example, when a Boss NPC spawns minions, those minions are spawned with the `IEntitySource` value resulting from the helper method `NPC.GetSource_FromAI()`. The result of that helper method is a `EntitySource_Parent` class with an `Entity` field of type `NPC`. This `IEntitySource` could then be detected by a mod that intended to reduce the HP of all boss minions by half. This additional info can help facilitate many more effects that were previously impossible to accomplish with mods.

Note that `OnSpawn` does not let you prevent the spawning of an entity. On/IL hooks are currently required for that, but such a hook could be considered in the future (causing the returned entity to be the 'dummy' entity slot at the end of the array).

See `ExampleSourceDependentProjectileTweaks`, `ExampleSourceDependentItemTweaks`, or `ProjectileWithGrowingDamage` classes in Example Mod for some uses.

# Lifetime
Do not store `IEntitySource` in fields. The validity of the information they encapsulate is only relevant at the moment of spawning. Any lasting effects of the source information will need to be registered in fields within your mod at the time of spawning. The details on why it is a bad idea are too advanced for this guide.

# Methods requiring IEntitySource
The following commonly used methods require `IEntitySource`.
* `Gore.NewGore`
* `Gore.NewGoreDirect`
* `Gore.NewGorePerfect`
* `Player.QuickSpawnItem`
* `Player.QuickSpawnClonedItem`
* `Item.NewItem`
* `NPC.NewNPC`
* `Projectile.NewProjectile`
* `Projectile.NewProjectileDirect`

# Using Sources
### If in doubt use something which extends from `EntitySource_Parent`
Most of the time, this means calling `GetSource_FromThis()`, `GetSource_FromAI()`, `GetSource_Loot()`, `GetSource_Death()`, `GetSource_OnHit()` or `GetSource_OnHurt()`

`EntitySource_Parent` is the most important source. tML uses this to transfer values such as `bannerIdToRespondTo/CritChance/ArmorPenetration` from the parent `NPC` or `Player` (or `Player` + `Item` in the case of `EntitySource_ItemUse`) to a spawned `Projectile`. These values are also transferred from parent projectiles to child projectiles via `EntitySource_Parent` ensuring the initial 'source' value is retained.

### Detailed list

* NPC spawning projectiles should use `NPC.GetSource_FromAI()`
* NPC spawning item drops should use `NPC.GetSource_Loot()` (if loot) or `NPC.GetSource_DropAsItem()` (if anything else). (Note that 99.9% of NPC item drops should be using the new loot system)
* NPC spawning other NPC, such as boss minions, should use `NPC.GetSource_FromAI()`
* NPC spawning gore on death should use `NPC.GetSource_Death()`
* Projectiles spawning items, such as arrow recovery drops, should use `Projectile.GetSource_DropAsItem()`
* Projectiles spawning other projectiles, like a splitting projectile or a shooting minion, should use `Projectile.GetSource_FromThis()`
* Held projectile weapons spawning other projectiles using ammo should use `player.GetSource_ItemUse_WithPotentialAmmo(player.HeldItem, usedAmmoItemId)`
* Spawning minions or pets in `ModBuff.Update`: use `player.GetSource_Buff(buffIndex)`
* An accessory spawning a projectile: use `player.GetSource_Accessory(itemInstance)` or `player.GetSource_Accessory_OnHurt(itemInstance, hurtInfo.DamageSource)`
* An armor set bonus spawning a projectile: Use `player.GetSource_FromThis("SetBonus_MySetName")`
* Spawning things in `ModItem.UseItem`, or any `ModItem` not covered elsewhere: `player.GetSource_ItemUse(Item)`
* Player spawning Projectiles in `ModItem.Shoot` should use the `source` passed into the method
* Tile dropping an item (`ModTile.KillMultiTile` or `GlobalTile.Drop`) should use `WorldGen.GetItemSource_FromTileBreak(i, j)`
* Player spawning an item due to dropping or being unable to recover an item from a UISlot (player.GetItem overflow) should use `new EntitySource_OverfullInventory(player)`

# Retrieving Information from IEntitySource
Using the information provided by `IEntitySource` is the other half of the purpose of this feature. There are various methods available that provide the source to the modder, all called `OnSpawn`.

For example, in `GlobalProjectile.OnSpawn`, there is a `IEntitySource source` parameter. We can use casting to cast the `IEntitySource` to the source that we wish to check. This code uses the `is` operator and the [property pattern](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/patterns#property-pattern) to quickly match a specific set of conditions.
```cs
// Property pattern approach
if (source is EntitySource_Parent { Entity: NPC { type: NPCID.TacticalSkeleton } }) {
	// Do things here to projectiles (BulletDeadeye) spawned by the TacticalSkeleton enemy without affecting others
}
// Non property pattern approach
if (source is EntitySource_Parent parent && parent.Entity is NPC npc && npc.type == NPCID.TacticalSkeleton) {
	// Do things here to projectiles (BulletDeadeye) spawned by the TacticalSkeleton enemy without affecting others
}
```

For maximum compatibility with mods which add custom entity sources, use `is` with interfaces rather than classes when they exist:
- `is IEntitySource_WithStatsFromItem` instead of `is EntitySource_ItemUse`
- `is IEntitySource_OnHit` instead of `is EntitySource_OnHit`
- `is IEntitySource_OnHurt` instead of `is EntitySource_OnHurt`

Note that for most things, you'll have to manually sync changes. OnSpawn happens on the client or server that spawns the entity, any changes that should reflect on other clients need to by synced in some manner. The files in [ExampleMod/Common/EntitySources](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Common/EntitySources) show examples of this.
