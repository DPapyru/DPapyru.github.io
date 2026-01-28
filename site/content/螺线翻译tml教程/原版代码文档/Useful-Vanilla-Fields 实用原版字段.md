This is a quick list of the most common vanilla fields and a small description to what it does when changed.

Index|
-----|
[Item Fields](https://github.com/tModLoader/tModLoader/wiki/Useful-Vanilla-Fields#item-fields)|
[Main Fields](https://github.com/tModLoader/tModLoader/wiki/Useful-Vanilla-Fields#main-fields)|
[NPC Fields](https://github.com/tModLoader/tModLoader/wiki/Useful-Vanilla-Fields#npc-fields)|
[Player Fields](https://github.com/tModLoader/tModLoader/wiki/Useful-Vanilla-Fields#player-fields)|
[Projectile Fields](https://github.com/tModLoader/tModLoader/wiki/Useful-Vanilla-Fields#projectile-fields)|
[WorldGen Fields](https://github.com/tModLoader/tModLoader/wiki/Useful-Vanilla-Fields#worldgen-fields)|

# Item Fields

See [Item Class Documentation](https://github.com/tModLoader/tModLoader/wiki/Item-Class-Documentation#fields-and-properties)

# Main Fields

For `Main.tileSolid` and other Tile related fields, see [Basic Tile](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile).

* expertMode; bool

If true, means that the world is in expert mode.

* hardMode; bool

If true, the world is currently in hardmode.

* rain; bool

If true, it is currently raining in the world.

* bloodMoon; bool

If true, it is currently a blood moon going on.

* spawnTileX, spawnTileY; int

The X and Y coordinates of the world spawn tile.

* npcShop; int

If greater than 0, the player currently has an NPC shop opened.

# NPC Fields

See [NPC Class Documentation](https://github.com/tModLoader/tModLoader/wiki/NPC-Class-Documentation#fields-and-properties)

# Player Fields

* armor; Item[]

Represents the primary equip slots of the player (not counting pet, mount and hook slots that are on a separate page).
0-2: Armor (Head, Chest, Legs), 3-7 + extra slots (up to 9): Accessories, 10-12: Vanity Armor (Head, Chest, Legs), 13-17 + extra slots (up to 19) Vanity Accessories.

* dash; int

Enables a dash ability depending on the value of the variable. 1 = Ninja Master Gear Dash. 2 = Eye of Cthulhu Shield Dash. 3 = Solar Armor Dash. 

* endurance; float (%)

Damage reduction modifier. 0 means no reduction, 1 is max reduction (minimum of 1 damage taken).

* immune; bool

Gives the player immunity. He cannot be hurt by being hit.

* immuneAlpha; int

Set to 0 to prevent blinking when immune.

* immuneTime; int

Represents the time in ticks the player is be immune for (use with the immune bool).

* inventory; Item[]

Represents the inventory, including hotbar, coin, and ammo slots. Coin slots are 50-53, while Ammo slots are 54-57. Main.maxInventory = 58 items total

* lifeRegen; int

Increases the player's life regen. The number is applied over 2 seconds.

* lifeRegenTime; int

Increases the player's life regen, but in a different way.

* magicCrit; int

The player's magic critical chance.

* magicDamage; float (%)

The player's magic damage.

* manaCost; float (%)

Lower the value to lower the mana cost of spells. You can augment it too to make them cost more mana.

* manaRegen; int

Increases the amount of mana the player regenerates. The amount is added over 2 seconds.

* manaRegenBonus; int

Increases the speed at which the player regenerates mana.

* maxMinions; int

The maximum allowed number of minions, default value is 1.

* maxRunSpeed; float

The maximum movement speed that the player can accelerate to.

* meleeCrit; int

The player's melee critical chance.

* meleeDamage; float (%)

The player's melee damage.

* meleeSpeed; float (%)

The player's melee swinging speed.

* minionDamage; float (%)

The player's minions damage.

* minionKB; float (%)

The player's minions knockback strength.

* moveSpeed; float

The player's movement speed. Caps at 1.6.

* noKnockback; bool

If true, the player isn't affected by knockback.

* noFallDmg; bool

If true, the player isn't affected by fall damage.

* numMinions; int

The current number of minions. Set via projectiles flagged as minion.

* rangedCrit; int

The player's ranged critical chance.

* rangedDamage; float (%)

The player's ranged damage.

* runAcceleration; float

The speed at which the player achieves their maximum movement speed.

* runSlowdown; float

The speed at which the player slowdowns when they stop moving.

* slotsMinions; float

The current filled slots of minions. Set via projectiles flagged as minion. Some minion projectiles only count as half a minion slot (think Retanimini and Spazmamini).

* statDefense; int

The player's defense.

* statLifeMax; int

The base amount of max health. Do not change it unless you know what you're doing, Use statLifeMax2 instead.
For example, this is the variable that Life Hearts increase. It is permanent and is saved automatically.

* statLifeMax2; int

The temporary max health of the player. 
For example, this is used for things like accessories or potions. It is temporary and resets upon world load.

* statManaMax; int

Similar to statLifeMax, but modifies mana instead.

* statManaMax2; int

Similar to statLifeMax2, but modifies mana instead.

* thrownCrit; int

The player's throwing critical chance.

* thrownDamage; float (%)

The player's throwing damage.

* wings; int

Set to the wingSlot value of the currently equipped wing item. Mainly used for visual wing feedback (dust spawning, etc).

* wingsLogic; int

Set to the wingSlot value of the currently equipped wing item. Used to determine wingTimeMax and additional wing mechanics.

* wingTime; int

The current wing time. Is substracted from when the player uses their wings. Defaults to wingTimeMax when grounded or grappled.

* wingTimeMax; int

Determines the player's max flight time with wings when not mounted. Defaults to 0.

# Projectile Fields

See [Projectile Class Documentation](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#fields-and-properties)

# Worldgen Fields

* crimson; bool

If true, crimson was generated for the world. Check if false for corruption instead.