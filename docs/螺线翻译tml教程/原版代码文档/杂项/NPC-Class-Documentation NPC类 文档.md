# NPC Class Documentation
This page lists methods and fields pertaining to the `NPC` class. This page is useful for understanding what to use in `ModNPC.SetDefaults` and `ModNPC.AI`.

Only common fields and methods are listed. The [full documentation](https://docs.tmodloader.net/docs/stable/class_n_p_c.html) should be consulted for a full listing of methods and fields not listed here. You can also see the names and documentation for these methods and fields directly in your [IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#documentation) once it is setup correctly.

Index|
-----|
[Fields](https://github.com/tModLoader/tModLoader/wiki/NPC-Class-Documentation#fields-and-properties)|
[Methods](https://github.com/tModLoader/tModLoader/wiki/NPC-Class-Documentation#methods)|

# Fields and Properties
You can assign these fields to give your `ModNPC` various values. Typically you'll want to refer to this page when writing code for `ModNPC.SetDefaults` and `ModNPC.AI`. Be sure to visit [Vanilla NPC Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-NPC-Field-Values) to see what values vanilla npc use for these fields. All fields listed are public unless otherwise noted.

| Field    | Type | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------|------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [width](#width)<a name="width"></a>| int | 0 | The width of the npc hitbox |
| [height](#height)<a name="height"></a>| int | 0 | The height of the npc hitbox |
| [aiStyle](#aistyle)<a name="aistyle"></a>| int | 0 (-1 for ModNPC) | Determines which AI code to run. Many NPC share the same AI code by having the same aiStyle. ModNPC can utilize vanilla aiStyle values in addition to ModNPC.aiType to mimic vanilla behavior to some degree. If you wish to further customize the AI of a ModNPC, you should read [Advanced Vanilla Code Adaption](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption). If you are using completely custom AI, set this to -1 since an aiStyle of 0 will face the player automatically, which may interfere with your logic. |
| [damage](#damage)<a name="damage"></a>| int | 0 | The amount of damage this NPC will deal on collision. Usually npc.damage is scaled by some factor when NPC spawn projectiles with Projectile.NewProjectile in AI code. For example, passing in `(int)(npc.damage * 0.5f)` as the Damage parameter. |
| [defDamage](#defdamage)<a name="defdamage"></a>| int | 0 | Stores the value of `damage` at the end of SetDefaults. Useful for scaling damage in AI code. |
| [defense](#defense)<a name="defense"></a>| int | 0 | How resistant to damage this NPC is. |
| [defDefense](#defdefense)<a name="defdefense"></a>| int | 0 | Stores the value of `defense` at the end of SetDefaults. Useful for scaling defense in AI code, like how King Slime changes defense as it gets smaller. |
| [lifeMax](#lifemax)<a name="lifemax"></a>| int | 0 | The maximum life of this NPC. |
| [life](#life)<a name="life"></a>| int | 0 | The current life of the NPC. Automatically assigned to lifeMax at the end of SetDefaults. |
| [realLife](#reallife)<a name="reallife"></a>| int | -1 | This value is used for multi-part npcs that share life while maintaining separate hitboxes. This is useful for worm enemies. The value represents the index in `Main.npc` of the npc that has the actual life for this multi-part npc. All the segments will point to the same npc, usually the "head" of the npc, and the head and all other non-multi-part npcs will have the default value of -1 still. |
| [HitSound](#hitsound)<a name="hitsound"></a>| LegacySoundStyle | null | The sound that plays when this npc is hit. |
| [DeathSound](#deathsound)<a name="deathsound"></a>| LegacySoundStyle | null | The sound that plays when this npc dies. |
| [alpha](#alpha)<a name="alpha"></a>| int | 0 | 0 is opaque, and 255 is transparent. This is the opposite of typical representations of alpha in computer graphics, so be aware of that. |
| [color](#color)<a name="color"></a>| Color |  |  |
| [value](#value)<a name="value"></a>| float | 0f | How many copper coins the NPC will drop when killed (100 copper coins = 1 silver coin etc.). |
| [rarity](#rarity)<a name="rarity"></a>| int | 0 | How rare the NPC is for the Lifeform Analyzer. 4 is for Tim and Mimics, 1 is for bound town NPCs. |
| [immune](#immune)<a name="immune"></a>| int[] | all 0 | This determines if an NPC can be hit by a item or projectile owned by a particular player (it is an array, each slot corresponds to different players (whoAmI)). It is decremented towards 0 every update.	Melee items set immune[player.whoAmI] to player.itemAnimation, which starts at item.useAnimation and decrements towards 0. Penetrating projectiles usually set immune to 10, while non-penetrating projectiles do not set immune. ExampleAnimatedPierce.cs explains more about options for npc and projectile immunity. |
| [buffImmune](#buffimmune)<a name="buffimmune"></a>| bool[] | all false | Make the NPC immune to buffs/debuffs. Example: `npc.buffImmune[BuffID.OnFire] = true;` |
| [knockBackResist](#knockbackresist)<a name="knockbackresist"></a>| float | 1f | How much of the knockback it receives will actually apply. 1f: full knockback; 0f: no knockback. |
| [scale](#scale)<a name="scale"></a>| float | 1f | Makes the NPC bigger or smaller. Bigger than 1f = bigger. |
| [townNPC](#townnpc)<a name="townnpc"></a>| bool | false | If true, the npc counts as a town NPC. Has multiple implications (i.e. npc shop, housing, hostile spawn rate reduction). |
| [noGravity](#nogravity)<a name="nogravity"></a>| bool | false | If true, the npc will not be affected by gravity. Demon Eyes and other floating npc use this. |
| [noTileCollide](#notilecollide)<a name="notilecollide"></a>| bool | false | If true, the npc does not collide with tiles, making the npc pass through tiles freely. Meteor Head and Worm npc use this. |
| [npcSlots](#npcslots)<a name="npcslots"></a>| float | 1f | Represents how much this npc counts towards the npc spawn limit. Small critters like worms or flys have values around .1f and .25. Enemies that are more difficult than normal have values higher than 1f, and bosses and mini bosses have values around 6. Proper npcSlots values help balance the game and prevents the player from randomly being overwhelmed by powerful enemies. Check the [Vanilla NPC Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-NPC-Field-Values) spreadsheets to determine a suitable value for your NPC. |
| [boss](#boss)<a name="boss"></a>| bool | false | Set to true if the NPC is a boss. Prevents off-screen despawn. |
| [netAlways](#netalways)<a name="netalways"></a>| bool | false | If true, makes sure that this NPC is always synced in multiplayer for newly joined players (same happens if it's a boss or townNPC). |
| [](#)<a name=""></a>|  |  |  |

## Static Fields

Static fields are accessed by the classname, not the instance. For example, we write `NPC.downedPlantBoss` to check if Plantera has been defeated yet.

| Field    | Type | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------|------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [killCount](#killcount)<a name="killcount"></a>| int[] | 0 | Indexed by BannerID. Returns how many kills of the specified BannerID have been killed. Many NPC can share the same BannerID and many NPC actually don't have a Banner ID at all. This code will retrieve the bannerID of an NPC, or -1 if it does not exist: `int bannerID = Item.NPCtoBanner(npc.BannerID());` |
| [savedTaxCollector](#savedtaxcollector)<a name="savedtaxcollector"></a><br>[savedGoblin](#savedgoblin)<a name="savedgoblin"></a><br>[savedWizard](#savedwizard)<a name="savedwizard"></a><br>[savedMech](#savedmech)<a name="savedmech"></a><br>[savedAngler](#savedangler)<a name="savedangler"></a><br>[savedStylist](#savedstylist)<a name="savedstylist"></a><br>[savedBartender](#savedbartender)<a name="savedbartender"></a>| bool | false | These values indicate which NPC have been found in the wild. You can use these in various conditions in your mod. |
| [downedBoss1](#downedboss1)<a name="downedboss1"></a><br>[downedBoss2](#downedboss2)<a name="downedboss2"></a><br>[downedBoss3](#downedboss3)<a name="downedboss3"></a><br>[downedDeerclops](#downedDeerclops)<a name="downedDeerclops"></a><br>[downedQueenBee](#downedqueenbee)<a name="downedqueenbee"></a><br>[downedSlimeKing](#downedslimeking)<a name="downedslimeking"></a><br>[downedGoblins](#downedgoblins)<a name="downedgoblins"></a><br>[downedFrost](#downedfrost)<a name="downedfrost"></a><br>[downedPirates](#downedpirates)<a name="downedpirates"></a><br>[downedClown](#downedclown)<a name="downedclown"></a><br>[downedPlantBoss](#downedplantboss)<a name="downedplantboss"></a><br>[downedGolemBoss](#downedgolemboss)<a name="downedgolemboss"></a><br>[downedMartians](#downedmartians)<a name="downedmartians"></a><br>[downedFishron](#downedfishron)<a name="downedfishron"></a><br>[downedEmpressOfLight](#downedEmpressOfLight)<a name="downedEmpressOfLight"></a><br>[downedHalloweenTree](#downedhalloweentree)<a name="downedhalloweentree"></a><br>[downedHalloweenKing](#downedhalloweenking)<a name="downedhalloweenking"></a><br>[downedChristmasIceQueen](#downedchristmasicequeen)<a name="downedchristmasicequeen"></a><br>[downedChristmasTree](#downedchristmastree)<a name="downedchristmastree"></a><br>[downedChristmasSantank](#downedchristmassantank)<a name="downedchristmassantank"></a><br>[downedAncientCultist](#downedancientcultist)<a name="downedancientcultist"></a><br>[downedMoonlord](#downedmoonlord)<a name="downedmoonlord"></a><br>[downedTowerSolar](#downedtowersolar)<a name="downedtowersolar"></a><br>[downedTowerVortex](#downedtowervortex)<a name="downedtowervortex"></a><br>[downedTowerNebula](#downedtowernebula)<a name="downedtowernebula"></a><br>[downedTowerStardust](#downedtowerstardust)<a name="downedtowerstardust"></a><br>[downedTowers](#downedtowers)<a name="downedtowers"></a><br>[downedQueenSlime](#downedQueenSlime)<a name="downedQueenSlime"></a><br>[downedMechBossAny](#downedmechbossany)<a name="downedmechbossany"></a><br>[downedMechBoss1](#downedmechboss1)<a name="downedmechboss1"></a><br>[downedMechBoss2](#downedmechboss2)<a name="downedmechboss2"></a><br>[downedMechBoss3](#downedmechboss3)<a name="downedmechboss3"></a><br>| bool | false | These values indicate which bosses have been defeated in the world. Most are self explanitory. `downedBoss1` refers to Eye of Cthulu, `downedBoss2` refers to either Brain of Cthulhu or Eater of Worlds, and `downedBoss3` referes to Skeletron. `downedMechBoss` 1, 2, and 3 refer to The Destroyer, The Twins, and Skeletron Prime respectively. |

## tModLoader Only

| Field    | Type | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------|------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [modNPC](#modnpc)<a name="modnpc"></a>| ModNPC | null | The ModNPC instance that controls the behavior of this NPC. This property is null if this is not a modded NPC. |
| [globalNPCs](#globalnpcs)<a name="globalnpcs"></a>| internal GlobalNPC[] | new GlobalNPC[0] | Do not touch. Use `NPC.GetGlobalNPC` |
| [](#)<a name=""></a>| | |  |

# Methods
Remember that static methods are called by writing the classname and non-static methods use the instance name. `NPC.NewNPC(...)` vs `npc.CloneDefaults(...)`
### public static int NewNPC(int X, int Y, int Type, int Start = 0, float ai0 = 0f, float ai1 = 0f, float ai2 = 0f, float ai3 = 0f, int Target = 255)
Spawns an NPC in the world. Use this to spawn minions from bosses. 
Example: `NPC.NewNPC((int)npc.position.X, (int)npc.position.Y, ModContent.NPCType<ExampleBossMinion>();` The `ai` parameters can initialize an NPC with particular data if needed for special AI behavior.

### public static bool AnyNPCs(int Type)
Returns true if there are any NPC of the supplied type alive in the world. Useful for boss spawning items or anytime you need to check if an NPC is alive. 
Example: `if (NPC.AnyNPCs(ModContent.NPCType<CaptiveElement2>())) {`

### public static int CountNPCS(int Type)
Same as `AnyNPCs` except returns the number of active NPC of the supplied type.

### public static int FindFirstNPC(int Type)
Returns the index of the first NPC of the supplied type. Returns -1 if not found. Use to index into `Main.npc` to get the NPC instance.

### public static void SpawnOnPlayer(int plr, int Type)
Spawns a boss somewhere off screen of the specified player. This is the most common way of spawning bosses.

## tModLoader Only
### public GlobalNPC GetGlobalNPC(Mod mod, string name)

Gets the GlobalNPC instance (with the given name and added by the given mod) associated with this npc instance.

### public T GetGlobalNPC\<T\>(Mod mod) where T : GlobalNPC

Same as the other GetGlobalNPC, but assumes that the class name and internal name are the same.

### public T GetGlobalNPC\<T\>() where T : GlobalNPC

Same as the other GetGlobalNPC, but assumes that the class name and internal name are the same, as well as the Mod. This is the one you should use 99% of the time.

### public void CloneDefaults(int type)

Allows you to copy the defaults of a different type of NPC.