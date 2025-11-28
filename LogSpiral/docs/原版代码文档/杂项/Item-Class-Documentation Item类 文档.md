# Item Class Documentation
This page lists common methods and fields pertaining to the `Item` class. This page is useful for understanding what to use in `ModItem.SetDefaults`. 

Only common fields and methods are listed. The [full documentation](https://docs.tmodloader.net/docs/stable/class_item.html) should be consulted for a full listing of methods and fields not listed here. You can also see the names and documentation for these methods and fields directly in your [IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#documentation) once it is setup correctly.

Index|
-----|
[Fields](https://github.com/tModLoader/tModLoader/wiki/Item-Class-Documentation#fields-and-properties)|
[Methods](https://github.com/tModLoader/tModLoader/wiki/Item-Class-Documentation#methods)|

# Fields and Properties
You can assign these fields to give your `ModItem` various values. Typically you'll want to refer to this page when writing code for `ModItem.SetDefaults`. Be sure to visit [Vanilla Item Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Item-Field-Values) to see what values vanilla items use for these fields. All fields listed are public unless otherwise noted.

| Field    | Type | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------|------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [value](#value)<a name="value"></a> | int | 0 | Value is the number of copper coins the item is worth (aka, cost to buy from a merchant). Setting it to 10462 would mean the item cost 1 gold, 4 silver, and 62 copper. The sell price of an item is one fifth of its value. Value also influences reforge costs with the goblin tinkerer. For convenience, you can also use the `Item.buyPrice()` method for setting values: `item.value = Item.buyPrice(0, 1, 4, 62);` You can also use the `Item.sellPrice()` method if you would rather think about an items value the other way.  Both `Item.buyPrice(0, 0, 10, 55)` and `Item.sellPrice(0, 0, 2, 11)` would set the value to 1055. |
| [useStyle](#usestyle)<a name="usestyle"></a>| int | 0 | The use style of your item:    <br>1 for swinging,    <br>2 for drinking,    <br>3 act like shortsword,    <br>4 for use like life crystal,    <br>5 for use staffs or guns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| [useTurn](#useturn)<a name="useturn"></a>| bool | false | Whether the player can turn around while the using animation is happening.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [autoReuse](#autoreuse)<a name="autoreuse"></a>|bool | false| Whether the item is in continuous use while the mouse button is held down. |
| [holdStyle](#holdstyle)<a name="holdstyle"></a>| int|0 | The hold style of your item:<br>1 for holding out (torches and glowsticks)<br>2 for holding up (Breathing Reed)<br>3 for a different version of holding out (Magical Harp) |
| [useAnimation](#useanimation)<a name="useanimation"></a>| int|100 | The time span of the using animation for the item. Recommended to be the same at useTime as this is only the animation. Blocks use 15. Default value is 100. Terraria runs at 60 frames per second, so 15 is 1/4th of a second. |
| [useTime](#usetime)<a name="usetime"></a>|int |100 | The time span of using the item in frames. Blocks use 10. Default value is 100. Weapons usually have equal useAnimation and useTime, unequal values for these two results in multiple attacks per click. See [ExampleGun.cs's Clockwork Assault Rifle example](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleGun.cs#L105). |
| [reuseDelay](#reusedelay)<a name="reusedelay"></a>|int | 0| A delay in frames added at the end of the using animation for the item, during which the player wont be able to use any items. |
| [consumable](#consumable)<a name="consumable"></a>|bool |false | Whether the item is consumed after use. |
| [rare](#rare)<a name="rare"></a>| int|0 | Range from -1 to 13.<br>Check wiki link for respective colors: https://terraria.wiki.gg/wiki/Rarity. You can use `ItemRarityID` for convenience: [ItemRarityID.cs](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/ID/ItemRarityID.cs), [Sample Usage](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/ExampleHairDye.cs#L30) |
| [maxStack](#maxstack)<a name="maxstack"></a>|int | 1| The maximum number of items that can be contained within a single stack. |
| [width](#width)<a name="width"></a>| int |0 | The width of the dropped item's hitbox in pixels. |
| [height](#height)<a name="height"></a>|int  | 0| The height of the dropped item's hitbox in pixels. |
| [scale](#scale)<a name="scale"></a>| float | 1f | The size multiplier of the item's sprite while the item is being used. Also increases range for melee weapons. |
| [createTile](#createtile)<a name="createtile"></a>| int | -1 | The ID of the tile this item places on use. |
| [placeStyle](#placestyle)<a name="placestyle"></a>| int | 0| The style of the tile being placed. Used for tiles that have a different look depending on the item used to place them. |
| [createWall](#createwall)<a name="createwall"></a>| int |-1 | The ID of the wall this item places on use. |
| [UseSound](#usesound)<a name="usesound"></a>|LegacySoundStyle | null | The sound that your item makes when used. <br>Ex: `item.UseSound = SoundID.Item1;`|
| [damage](#damage)<a name="damage"></a>|int | -1| The base damage inflicted by the item. |
| [knockBack](#knockback)<a name="knockback"></a>|float | 0f| The force of the knock back. Max value is 20.  |
| [shoot](#shoot)<a name="shoot"></a>|int | 0 | The ID of the projectile that is fired by the item on use. If this weapon uses useAmmo, then this value is ignored as the projectile will be decided by the ammo item, but shoot should still be 10 by convention. |
| [shootSpeed](#shootspeed)<a name="shootspeed"></a>| float| 0f| The velocity in pixels the projectile fired by the item will have. Actual velocity depends on the projectile being fired. If your weapon is shooting projectiles and they are stationary, change this to something like 10f. Throwing Knife uses 10f. Held projectiles like Vortex Beater use shootSpeed to determine how far away from the player to hold the projectile. |
| [noMelee](#nomelee)<a name="nomelee"></a>| bool |false | If true, the item's using animation will not deal damage. Set to true on most weapons that aren't swords. |
| [accessory](#accessory)<a name="accessory"></a>|bool |false | Whether the item is an accessory. |
| [melee](#melee)<a name="melee"></a><br>[magic](#magic)<a name="magic"></a><br>[ranged](#ranged)<a name="ranged"></a><br>[thrown](#thrown)<a name="thrown"></a><br>[summon](#summon)<a name="summon"></a>| bool | false | The type of damage this item deals, if it is a weapon. |
| [axe](#axe)<a name="axe"></a><br>[pick](#pick)<a name="pick"></a><br>[hammer](#hammer)<a name="hammer"></a>| int | 0| These 3 correspond to the power, but axe power is multiplied by 5, so adjust accordingly. |
| [defense](#defense)<a name="defense"></a>|int |0 | The amount of defense this item provides when equipped, either as an accessory or armor. |
| [crit](#crit)<a name="crit"></a>| int |0 | The base critical chance for this item. Remember that the player has a base crit chance of 4. |
| [noUseGraphic](#nousegraphic)<a name="nousegraphic"></a>| bool | false| If true, the item's sprite will not be visible while the item is in use. |
| [useAmmo](#useammo)<a name="useammo"></a>| int | AmmoID.None (0) | The ID of the ammo used by this item. See [Ammo Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Ammo) |
| [ammo](#ammo)<a name="ammo"></a>| int | AmmoID.None (0) | The ID of the ammo class this item is part of. See [Ammo Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Ammo) |
| [notAmmo](#notammo)<a name="notammo"></a>|bool | false | If true and the item is ammo, the item will not count as ammo for certain ammo-specific behavior, such as the tooltip mentioning the item is ammo, or ammo items going into ammo slots first when picked up. Used for the Coin items, Ale, and Wire. |
| [mana](#mana)<a name="mana"></a>| int | 0 | The amount of mana this item consumes on use. |
| [channel](#channel)<a name="channel"></a>|bool | false | Used for items that have special behavior when the attack button is held. |
| [potion](#potion)<a name="potion"></a>| bool | false | If true, this item will inflict potion sickness on use. Also determines whether the item cannot be used when the player has potion sickness, and if the item can be used with the Quick Heal key. |
| [healLife](#heallife)<a name="heallife"></a>| int |0 | The amount of life this item heals on use. |
| [healMana](#healmana)<a name="healmana"></a>| int |0 | The amount of mana this item heals on use. |
| [buffType](#bufftype)<a name="bufftype"></a>| int |0 | The ID of the buff given by this item on use. To have a potion give multiple buffs, assign one buff here and in `ModItem.UseItem`, call `player.AddBuff(buffID, time)` for the remaining buffs you wish to give. Make sure to set [buffTime](#buffTime) as well or the buff will instantly disappear. |
| [buffTime](#bufftime)<a name="bufftime"></a>| int |0 | The duration in ticks of the buff given by this item on use. |
| [expert](#expert)<a name="expert"></a>|bool |false | Signifies that this item is an expert mode item. |
| [bait](#bait)<a name="bait"></a><br>[fishingPole](#fishingpole )<a name="fishingpole"></a>|int | 0| Correspond to fishing power of bait or poles respectively. |
| [questItem](#questitem)<a name="questitem"></a>|bool |false | Whether this item's tooltip will mention it is a quest item. |
| [mech](#mech)<a name="mech"></a>| bool |false | Whether this item will show wires when held. |
| [material](#material)<a name="material"></a>| bool | false | If this item is a an ingredient in any recipe. Automatically assigned. |
| [backSlot](#backslot)<a name="backslot"></a><br>[balloonSlot](#balloonslot)<a name="balloonslot"></a><br>[bodySlot](#bodyslot)<a name="bodyslot"></a><br>[faceSlot](#faceslot)<a name="faceslot"></a><br>[frontSlot](#frontslot)<a name="frontslot"></a><br>[handOffSlot](#handoffslot)<a name="handoffslot"></a><br>[handOnSlot](#handonslot)<a name="handonslot"></a><br>[headSlot](#headslot)<a name="headslot"></a><br>[legSlot](#legslot)<a name="legslot"></a><br>[neckSlot](#neckslot)<a name="neckslot"></a><br>[shieldSlot](#shieldslot)<a name="shieldslot"></a><br>[shoeSlot](#shoeslot)<a name="shoeslot"></a><br>[waistSlot](#waistslot)<a name="waistslot"></a><br>[wingSlot](#wingslot)<a name="wingslot"></a><br>| sbyte| -1 | These values indicate which equipment slots the accessory or armor will show. These slots correspond the the textures that are shown while equipped. tModLoader automatically will assign your item the correct values based on the AutoloadEquip attribute. |

| Field    | Type | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------|------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [DD2Summon](#dd2summon)<a name="dd2summon"></a>|bool |false |  |
| [ToolTip](#tooltip)<a name="tooltip"></a>|ItemTooltip|null |  |
| [active](#active)<a name="active"></a>|bool |true | If false, this item is empty regardless of other values set. |
| [alpha](#alpha)<a name="alpha"></a>| int|0 |  |
| [buy](#buy)<a name="buy"></a>| bool|false |  |
| [cartTrack](#carttrack)<a name="carttrack"></a>| bool|false |  |
| [color](#color)<a name="color"></a>| Color|Transparent| Draws the item sprite with a colored tint. Gel and Sharkfin use this to spawn different colored items from the same ItemID. `NetMessage.SendData(88, ...` needs to be used to sync this if not done in SetDefaults.  |
| [dye](#dye)<a name="dye"></a>|byte |0 |  |
| [expertOnly](#expertonly)<a name="expertonly"></a>| bool|false | If true, the accessory won't give any effects unless the world is in Expert mode. |
| [favorited](#favorited)<a name="favorited"></a>| bool|false    | If the item has been marked as favorited in the inventory. |
| [flame](#flame)<a name="flame"></a>| bool|false | |
| [glowMask](#glowmask)<a name="glowmask"></a>|short |-1 |  |
| [hairDye](#hairdye)<a name="hairdye"></a>|short |-1 |  |
| [instanced](#instanced)<a name="instanced"></a>|bool |false |  |
| [lavaWet](#lavawet)<a name="lavawet"></a>|bool |false |  |
| [lifeRegen](#liferegen)<a name="liferegen"></a>|int | 0|  |
| [makeNPC](#makenpc)<a name="makenpc"></a>|short |0 | Spawns the specified NPCID. |
| [manaIncrease](#manaincrease)<a name="manaincrease"></a>|int |0 |  |
| [mountType](#mounttype)<a name="mounttype"></a>|int | -1| Specifies which mount to equip when the item is used. See [ExampleMountItem](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/Mounts/ExampleMountItem.cs) |
| [netID](#netid)<a name="netid"></a>|int |0 | Don't use. |
| [noWet](#nowet)<a name="nowet"></a>|bool |false |  |
| [paint](#paint)<a name="paint"></a>|byte |0 |  |
| [prefix](#prefix)<a name="prefix"></a>|byte |0 |  |
| [release](#release)<a name="release"></a>|int |0 |  |
| [sentry](#sentry)<a name="sentry"></a>| bool|false |  |
| [shopCustomPrice](#shopcustomprice)<a name="shopcustomprice"></a>|int? |null | Use in `ModNPC/GlobalNPC.SetupShop` to assign a custom price for an item regardless of the value field. Use with `shopSpecialCurrency` to use a custom currency rather than coins. See [ExampleNPCShop.SetupShop](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/GlobalNPCs/ExampleNPCShop.cs#L17) |
| [shopSpecialCurrency](#shopspecialcurrency)<a name="shopspecialcurrency"></a>|int |-1 | Used in conjunction with [shopCustomPrice](#shopCustomPrice) to specify a custom currency. See [ExampleMod.Load](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/ExampleMod.cs#L14) and [ExampleCustomCurrency](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Currencies/ExampleCustomCurrency.cs) |
| [stack](#stack)<a name="stack"></a>|int |1 | Current stack of the Item. |
| [tileBoost](#tileboost)<a name="tileboost"></a>|int |-1 | Specifies the use range of a Tool |
| [tileWand](#tilewand)<a name="tilewand"></a>|int |0 |  |
| [type](#type)<a name="type"></a>|int |0 | This is the ItemID, automatically set.  |
| [uniqueStack](#uniquestack)<a name="uniquestack"></a>| bool|false |  |
| [vanity](#vanity)<a name="vanity"></a>| bool|false | Specifies that an armor is a vanity item. |
| [wet](#wet)<a name="wet"></a>| bool|false |  |
| [wetCount](#wetcount)<a name="wetcount"></a>|int|0 |  |
| [](#)<a name=""></a>| | |  |

## Static Fields

Static fields are accessed by the classname, not the instance. For example, we write `Item.staff[item.type]` to check if an item is marked as a staff. Set these values in `ModItem.SetStaticDefaults`.

| Field    | Type | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------|------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [staff ](#staff)<a name="staff"></a>| bool[] | false | Indexed by ItemID. This makes the useStyle animate as a staff instead of as a gun. See [ExampleStaff](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/Items/Weapons/ExampleStaff.cs). If the staff doesn't rotate, make sure `Item.shootSpeed` is not 0. |
| [](#)<a name=""></a>| | |  |

## tModLoader Only

| Field    | Type | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------|------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [modItem](#moditem)<a name="moditem"></a>| ModItem | null | The ModItem instance that controls the behavior of this item. This property is null if this is not a modded item. |
| [globalItems](#globalitems)<a name="globalitems"></a>| internal GlobalItem[] | new GlobalItem[0] | Do not touch. Use `Item.GetGlobalItem` |
| [](#)<a name=""></a>| | |  |

# Methods
Remember that static methods are called by writing the classname and non-static methods use the instance name. `Item.NewItem(...)` vs `item.CloneDefaults(...)`
<a name="newitem"></a>
### public static int NewItem(int X, int Y, int Width, int Height, int Type, int Stack = 1, bool noBroadcast = false, int pfix = 0, bool noGrabDelay = false, bool reverseLookup = false)
Spawns an item in the world. Commonly seen used in ModNPC.NPCLoot. X, Y, Width, and Height are commonly derived from the npc. This method should not be called on multiplayer clients. If you need to spawn items from client code, use `player.QuickSpawnItem`, it handles the multiplayer syncing code needed.
Example: `Item.NewItem((int)npc.position.X, (int)npc.position.Y, npc.width, npc.height, ModContent.ItemType<ExampleItem>());`

### public static int NewItem(Rectangle rectangle, int Type, int Stack = 1, bool noBroadcast = false, int prefixGiven = 0, bool noGrabDelay = false, bool reverseLookup = false)
This alternate method signature can simplify code.  
Example: `Item.NewItem(npc.getRect(), ModContent.ItemType<ExampleItem>());`

## tModLoader Only
### public GlobalItem GetGlobalItem(Mod mod, string name)

Gets the GlobalItem instance (with the given name and added by the given mod) associated with this item instance.

### public T GetGlobalItem\<T\>(Mod mod) where T : GlobalItem

Same as the other GetGlobalItem, but assumes that the class name and internal name are the same.

### public T GetGlobalItem\<T\>() where T : GlobalItem

Same as the other GetGlobalItem, but assumes that the class name and internal name are the same, as well as the Mod. This is the one you should use 99% of the time.

### public void CloneDefaults(int type)

Allows you to copy the defaults of a different type of item.