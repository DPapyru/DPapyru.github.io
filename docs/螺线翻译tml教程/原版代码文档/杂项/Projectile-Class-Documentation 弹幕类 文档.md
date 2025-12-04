***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation/f72e40082bc62929735e5ca8b983fe2a4584fde8)
***

# Projectile Class Documentation
This page lists methods and fields pertaining to the `Projectile` class. This page is useful for understanding what to use in `ModProjectile.SetDefaults` and `ModProjectile.AI`. 

Only common fields and methods are listed. The [full documentation](https://docs.tmodloader.net/docs/stable/class_projectile.html) should be consulted for a full listing of methods and fields not listed here. You can also see the names and documentation for these methods and fields directly in your [IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#documentation) once it is setup correctly.

Index|
-----|
[Fields](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#fields-and-properties)|
[Methods](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#methods)|

# Fields and Properties
You can assign these fields to give your `ModProjectile` various values. Typically you'll want to refer to this page when writing code for `ModProjectile.SetDefaults`. Be sure to visit [Vanilla Projectile Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Projectile-Field-Values) to see what values vanilla projectiles use for these fields. All fields listed are public unless otherwise noted. 

## Vanilla
| Field    | Type | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------|------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [type](#type)<a name="type"></a>|int |0 | This is the ProjectileID, automatically set.  |
| [aiStyle](#aistyle)<a name="aistyle"></a>| int | 0 | Selects which vanilla code to use for the AI method. Modders can use vanilla aiStyle to mimic AI code already in the game. See [ModProjectile.AIType](http://docs.tmodloader.net/docs/stable/class_mod_projectile.html#ad09901454c49ee3a5fbf3c5f5671ac73) and [ExampleCloneProjectile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleCloneProjectile.cs) to see how to use vanilla ai. If you are using custom AI code, you can omit this line. |
| [width](#width)<a name="width"></a>| int |0 | The width of the projectile's hitbox in pixels. |
| [height](#height)<a name="height"></a>|int  | 0| The height of the projectile's hitbox in pixels. |
| [friendly](#friendly)<a name="friendly"></a>| bool| false | If True, this projectile will hurt enemies (!npc.friendly) |
| [hostile](#hostile)<a name="hostile"></a>| bool|false  | If True, this projectile will hurt players and friendly npcs (npc.friendly) |
| [maxPenetrate](#maxpenetrate)<a name="maxpenetrate"></a>| int|1 | How many npc can it hit before dying. (Or tile bounces) Set at the end of SetDefaults automatically to the current value of penetrate.  |
| [penetrate](#penetrate)<a name="penetrate"></a>| int|1 | Current penetrate value. |
| [alpha](#alpha)<a name="alpha"></a>| int| 0 | How transparent to draw this projectile. 0 to 255. 255 is completely transparent. [ExampleBullet](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs) sets this to 255, and the projectile aiStyle of 1 automatically decreases alpha each tick, letting the projectile fade in quickly after being spawned. Useful for projectiles that look odd when initially spawned on the weapon because of texture overlap. |
| [timeLeft](#timeleft)<a name="timeleft"></a>|int | 3600| Each update timeLeft is decreased by 1. Once timeLeft hits 0, the Projectile will naturally despawn. The default value, 3600, is measured in ticks, which are usually 60 per seconds, so the default despawn time is about 60 seconds. Adjust this if you want the projectile to fizzle early rather than travel infinitely. Note that extraUpdates will cause it to decrease faster than normal time because Update is being called more often. |
| [tileCollide](#tilecollide)<a name="tilecollide"></a>|bool |true | The projectile will collide with tiles, usually bouncing or killing the tile depending on `ModProjectile.OnTileCollide`. [ExampleBullet](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs#L37) shows how to bounce. |
| [ignoreWater](#ignorewater)<a name="ignorewater"></a>| bool | false | The projectile will not be affected by water. |
| [extraUpdates](#extraupdates)<a name="extraupdates"></a>|int |0 | Additional update steps per tick. Useful for really fast projectiles such as [Shadowbeam Staff](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption#example-item-and-projectile-shadowbeam-staff-clone). |
| [scale](#scale)<a name="scale"></a>| float | 1f | Scales the projectile drawing, but not the hitbox, making this not suitable for affecting hitbox. |
| [frame](#frame)<a name="frame"></a>| int | 0 | The frame # in the spritesheet that this projectile will be drawn with. Example: projectile has 4 frames, then `frame` can have values between 0 and 3 |
| [frameCounter](#framecounter)<a name="framecounter"></a>| int | 0 | Used as a timer to decide when to change `frame` |
| [rotation](#rotation)<a name="rotation"></a>| float | 0f | Rotation of the projectile. Radians not Degrees. Use `MathHelper` if you want to convert degrees to radians. 0 is facing right, pi/2 is facing down, and so on. |
| [oldPos](#oldpos)<a name="oldpos"></a>| Vector2[] | | Holds the value of `Projectile.position` from previous updates. Use for drawing trails. Must be used with `ProjectileID.Sets.TrailCacheLength` and `ProjectileID.Sets.TrailingMode` to be used. See [ExampleBullet](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs) |
| [oldRot](#oldrot)<a name="oldrot"></a>| float[] | | Holds the value of `Projectile.rotation` from previous updates. See above. |
| [oldSpriteDirection](#oldspritedirection)<a name="oldspritedirection"></a>| int[] | | Holds the value of `Projectile.spriteDirection` from previous updates. See above. |
| [ai](#ai)<a name="ai"></a>| float[] | 0, 0 | An array used for any sort of data storage, which is occasionally synced to the server. Call [netUpdate](#netUpdate)<a name="netUpdate"></a> to manually sync. |
| [localAI](#localai)<a name="localai"></a>| float[] | 0, 0 | Acts like `ai`, but does not sync to the server. |
| [noDropItem](#nodropitem)<a name="nodropitem"></a>| bool | false | Set to true if you don't want this item to have a chance to recover the ammo item that shot this. For example, if you shoot the wooden arrow projectile, it will sometimes drop the wooded arrow item. If your weapon shoots multiple arrows for 1 ammo, you might want to consider setting this field to prevent infinite ammo glitches. |
| [minion](#minion)<a name="minion"></a>| bool | false | Indicates that this projectile is a minion |
| [minionSlots](#minionslots)<a name="minionslots"></a>| float | 0f | Set to 1f on a minion to count it towards the minion limit of the summoning player (Optic Staff summons two minions at once with 0.5f each) |
| [spriteDirection](#spritedirection)<a name="spritedirection"></a>| int | |  |
| [hide](#hide)<a name="hide"></a>| bool | | Projectile is not drawn normally. See (TODO) [ExampleBehindTilesProjectile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/Projectiles/ExampleBehindTilesProjectile.cs#L22) |
| [lavaWet](#lavawet)<a name="lavawet"></a>| bool | false | Indicates that this projectile is currently in lava |
| [wetCount](#wetcount)<a name="wetcount"></a>| | |  |
| [wet](#wet)<a name="wet"></a>| bool | false | Indicates that this projectile is currently in water |
| [netImportant](#netimportant)<a name="netimportant"></a>| bool | false | Indicates that this projectile will be synced to a joining player (by default, any projectiles active before the player joins (besides pets) are not synced over). Example: glowsticks |
| [netUpdate](#netupdate)<a name="netupdate"></a>| bool | false | Set manually to true in `ModProjectile.AI` once to make it sync its current ai[] array to the server and other clients (depending on what the Main.netMode is where this is set to true in) |
| [netUpdate2](#netupdate2)<a name="netupdate2"></a>| bool | false | Used internally to check for projectiles that spam `netUpdate`. Don't use it yourself manually |
| [numUpdates](#numupdates)<a name="numupdates"></a>| | |  |
| [identity](#identity)<a name="identity"></a>| int | | The projectile's universal unique identifier, which is the same on all clients and the server. Usually used to find the same projectile on multiple clients and/or the server, e.g. `Projectile match = Main.projectile.FirstOrDefault(x => x.identity == identity);` |
| [light](#light)<a name="light"></a>| float | 0f | Set to a value above 0f to make this projectile emit a white light (higher number: more intensive light. 1f being stronger than a torch)) |
| [position](#position)<a name="position"></a>| Vector2 | | |
| [velocity](#velocity)<a name="velocity"></a>| Vector2 | Vector2.Zero | The amount of coordinates this projectile will move per tick |
| [active](#active)<a name="active"></a>| bool | | True if this Projectile actually exists. `Main.projectile` will hold a lot of junk data in it. If you are iterating over `Main.projectile`, be sure to check `active` to make sure the projectile is still alive. For example, old projectiles that die aren't removed from the array, they simply have active set to false. |
| [owner](#owner)<a name="owner"></a>| | | The index of the player who owns this projectile. In Multiplayer, Clients "own" projectiles that they shoot, while the Server "owns" projectiles spawned by NPCs and the World. It is very important to check `if (projectile.owner == Main.myPlayer)` for things like dropping items or spawning projectiles in `ModProjectile.AI` and some other methods because `AI` runs simultaneously on all Clients and the Server. This check gates some of the code that should only run on the owners computer. [ExamplePaperAirplaneProjectile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExamplePaperAirplaneProjectile.cs#L142) checks owner for spawning the recovered item. If you don't do this, you will run into desync bugs in your mod. |
| [damage](#damage)<a name="damage"></a>| int | 0 | This will always be set in `Projectile.NewProjectile` based on the weapons damage. Don't assume that setting it to something in `SetDefaults` does anything. |
| [originalDamage](#originaldamage)<a name="originaldamage"></a>| int | 0 | Set manually on projectile spawn in vanilla for minions and sentries, aswell as automatically by tML when `ContinuouslyUpdateDamage` is true. Causes the projectile to update its damage every tick (contrary to the usual design of "snapshotting" damage) |
| [knockBack](#knockback)<a name="knockback"></a>| float | 0f |  |
| [trap](#trap)<a name="trap"></a>| bool | false | If true, this projectile was spawned by a trap tile. |
| [npcProj](#npcproj)<a name="npcproj"></a>| bool | false | If true, this projectile was spawned by a friendly Town NPC. |
| [projUUID](#projuuid)<a name="projuuid"></a>| | |  |
| [](#)<a name=""></a>| | |  |
| [](#)<a name=""></a>| | |  |

## tModLoader

| Field    | Type | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------|------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [ArmorPenetration](#armorpenetration)<a name="armorpenetration"></a>| int | 0 | The number of defense points that this projectile can ignore on its own. Cannot be set to negative values. On spawn, if this projectile was fired from a weapon, this value has the total armor penetration of the weapon that made the projectile added to itself. |
| [CritChance](#critchance)<a name="critchance"></a>| int | 0 | The critical strike chance modifier of this projectile. Cannot be set to negative values. On spawn, if this projectile was fired from a weapon, this value has the total critical strike chance of the weapon that made the projectile added to itself. |
| [DamageType](#damagetype)<a name="damagetype"></a>| DamageClass | DamageClass.Default | The damage class of the projectile, relates to damage bonuses and crit. Vanilla options can be assigned via the `DamageClass` fields, and modded through `ModContent.GetInstance<CustomDamageClassNameHere>()` |
| [ContinuouslyUpdateDamage](#continuouslyupdatedamage )<a name="continuouslyupdatedamage "></a>| bool | false | If set, `damage` will be recalculated based on `originalDamage`, `DamageType` and the owning player, just like minions and sentries. |
| [ModProjectile](#modprojectile)<a name="modprojectile"></a>| ModProjectile | null | The ModProjectile instance that controls the behavior of this projectile. This property is null if this is not a modded projectile. |
| [Globals](#globals)<a name="globals"></a>| RefReadOnlyArray<Instanced<GlobalProjectile>> | | Do not touch. Use `Projectile.GetGlobalProjectile` |
| [](#)<a name=""></a>| | |  |

# Methods
Only the most basic methods are documented here. Other documented methods will show documentation in your [IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#documentation) when you hover over them.

## Vanilla
Remember that static methods are called by writing the classname and non-static methods use the instance name. `Projectile.NewProjectile(...)` vs `someProjectileInstance.Kill(...)`

### public static int NewProjectile(IEntitySource spawnSource, float X, float Y, float SpeedX, float SpeedY, int Type, int Damage, float KnockBack, int Owner = 255, float ai0 = 0f, float ai1 = 0f) <a name="newprojectile"></a>
Spawns a projectile in the world. The owner variable should pretty much always be set to `Main.myPlayer`. See [IEntitySource](https://github.com/tModLoader/tModLoader/wiki/IEntitySource) for info on the `spawnSource` parameter.

Proper usage with multiplayer in mind:
* If spawned from a player (via accessory, on hit by, on use, etc.), only the "owner" of this projectile should spawn it:
```c#
if (Main.myPlayer == player.whoAmI)
{
    //player.whoAmI could be Projectile.owner instead if this runs from a projectile
    Projectile.NewProjectile(...);
}
```

* Otherwise, if no player "owns" the projectile (such as a friendly or hostile NPC shooting it, or the world itself spawns it), spawn it on the server (or singleplayer)
```c#
if (Main.netMode != NetmodeID.MultiplayerClient)
{
    Projectile.NewProjectile(...);
}
```

In both cases, this guarantees that `NewProjectile` runs only on one instance of the game, such that no duplicate projectiles spawn.

### public static int GetByUUID(int owner, int uuid)
Do not use this method to get a projectile on a client based on its Projectile.identity. Instead, loop through the Main.projectile[] on the client you wish to find the projectile on and check if there is a projectile that has the same Projectile.identity as the projectile you want to find.

## tModLoader
### public T GetGlobalProjectile\<T\>(bool exactType = true) where T : GlobalProjectile

Gets the GlobalProjectile instance (of the specified Type) associated with this projectile instance.

### public void CloneDefaults(int type)

Allows you to copy the defaults of a different type of projectile.

### public bool CountsAsClass\<T\>() where T : DamageClass

Returns true if the projectile counts as the given damage class (of the specified type) towards effects.

### public bool CountsAsClass(DamageClass damageClass)

Returns true if the projectile counts as the given damage class towards effects.