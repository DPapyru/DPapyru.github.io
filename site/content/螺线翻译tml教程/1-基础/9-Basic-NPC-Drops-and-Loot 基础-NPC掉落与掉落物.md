# Basic NPC Drops and Loot
This guide will teach the basics of dropping items when enemies are killed. Please note that this page only applies to 1.3 tModLoader. NPC Loot in 1.4 tModLoader is completely different, see ModifyNPCLoot usages in ExampleMod for examples and [Basic NPC Drops and Loot 1.4](Basic-NPC-Drops-and-Loot-1.4).

## Basics
We use the NPCLoot method in either our ModNPC class or our GlobalNPC class to specify the items the drop from enemies.

### ModNPC.NPCLoot() vs GlobalNPC.NPCLoot()
There are 2 places we can put NPC loot code. If our mod adds an NPC and we want specific drops for that NPC, please put the relevant code in that ModNPC class. If we want to add drops to vanilla NPC, put code in a GlobalNPC class. If we want to add drops to all NPC, such as how Dungeon Chest keys or Souls drop, put the code in GlobalNPC. Remember, organization is key for maintainability of your mod.

### Item.NewItem
Throughout this guide you will see the `Item.NewItem` method being called. See [Useful Vanilla Methods](https://github.com/tModLoader/tModLoader/wiki/Useful-Vanilla-Methods#public-static-int-newitemint-x-int-y-int-width-int-height-int-type-int-stack--1-bool-nobroadcast--false-int-pfix--0-bool-nograbdelay--false-bool-reverselookup--false) to see the parameters. This method spawns an item into the game world. The item is spawned centered into the area specified by the parameters. 

### How do I specify my item?
In the examples below, we drop a vanilla item: `ItemID.BeeGun`. This can be swapped for an item from your mod by replacing that with `ModContent.ItemType<ItemName>()`

### Drop 1 item all the time
The following shows the most basic example. This code will drop 1 Bee Gun every time this ModNPC is killed.

```c#
public override void NPCLoot()
{
	Item.NewItem(npc.getRect(), ItemID.BeeGun);
}
```

### Additional drops
We can add additional drops by adding other lines of code.

```c#
Item.NewItem(npc.getRect(), ItemID.Beenade);
Item.NewItem(npc.getRect(), ItemID.HiveWand);
```

### Stack Size
If we wish to drop more than one item in a stack, specify the number to drop.

```c#
Item.NewItem(npc.getRect(), ItemID.Beenade, 20);
```

### Drop Per Player or Instanced
//TODO per player

#### Instanced
If you want an item to drop like boss bags do (one per player, clientside (other players won't see the drops that belong to other players)), use the `npc.DropItemInstanced` method:

```c#
npc.DropItemInstanced(npc.position, npc.Size, ItemID.Picksaw, 1, true);
```

The last two parameters are stack size, and if an interaction is required between the NPC and the player for it to drop.

## Randomness
Most of the time, we don't want an item to drop all the time, but rather with a small chance. We can use a random number generator to give our items a chance to drop. We will use `Main.rand.[METHODNAME]` to do this, usually `Main.rand.Next`.

### Random Chance
If we want a 1 in X chance, the following code is recommended. Note that the `Next(int max)` method returns a number from 0 to max - 1. In the following example, the returned value possibilities are: 0, 1, 2, 3, 4, 5, and 6. (Never 7!) Also, don't change the 0.

```c#
if (Main.rand.Next(7) == 0)
	Item.NewItem(npc.getRect(), ItemID.Beenade, 20);
```

### Random Stack
Remember, Main.rand.Next(int) could return 0 and doesn't return max value, so use one of the following.

```c#
Item.NewItem(npc.getRect(), ItemID.Beenade, 5 + Main.rand.Next(3)); // 5, 6, or 7
Item.NewItem(npc.getRect(), ItemID.Beenade, Main.rand.Next(5, 8)); // 5, 6, or 7
// WRONG! DO NOT USE, has chance to drop 0: Item.NewItem(npc.getRect(), ItemID.Beenade, Main.rand.Next(5));
```

### Specific Chance
Sometimes, a 1 in X ratio might not be what we want.
```c#
if(Main.rand.Next(7) < 2) // a 2 in 7 chance
```
We can even do specific percentages.
```c#
if (Main.rand.NextFloat() < .1323f) // 13.23% chance
```
## Other Conditions
There are times we want to check other conditions, such as expertMode or current biome.
### Using Conditions
We can add conditions to our NPCLoot code using logical operators such as AND (&&)

```c#
if (Main.rand.Next(7) == 0 && Main.expertMode)
	// Expert only drop here. 1 in 7 chance to drop in an expert world.
```

### Double Expert Mode Drops
The following is an example of doubling expert mod drops. You can do it however you want, just make sure the logic is sound.

```c#
if(Main.rand.NextBool(Main.expertMode ? 2 : 1, 5))
```

### Different Expert Mode Drops
If you want to be more specific with your expert mode conditions, or any other condition, use an if-else statement.

```c#
// Drop 10-20 in expert mode, 20-30 in normal mode:
if(Main.expertMode)
	Item.NewItem(npc.getRect(), ItemID.Beenade, Main.rand.Next(20, 31));
else
	Item.NewItem(npc.getRect(), ItemID.Beenade, Main.rand.Next(10, 21));
```

### Biome or Location
The following shows the code for how vanilla drops Soul of Light. Note that this example is more suitable for a GlobalNPC class rather than an NPCLoot class since it add drops to all NPC that die in the biome/zone.

```c#
// We check several things that filter out bosses and critters, as well as the depth that the npc died at. 
if (Main.hardMode && !npc.boss && npc.lifeMax > 1 && npc.damage > 0 && !npc.friendly && npc.position.Y > Main.rockLayer * 16.0 && npc.value > 0f && Main.rand.NextBool(Main.expertMode ? 2 : 1, 5))
{
	if (Main.player[Player.FindClosest(npc.position, npc.width, npc.height)].ZoneHoly)
	{
		Item.NewItem(npc.getRect(), ItemID.SoulofLight);
	}
}
```

### Custom Biome
Replace `.ZoneHoly` in the above example with `.GetModPlayer<ExamplePlayer>().ZoneExample`.

### Player who killed NPC
Sometimes we want to do something for the player who attacked the NPC last. NPC has a lastInteraction field that will default to 255, meaning no player has damaged the npc. It is possible for an NPC to die with lastInteraction still being 255 if townNPC or traps deal all the damage to the NPC. Because of this, usually code meant to reward or affect the player who killed the NPC might look something like this, falling back on FindClosestPlayer if needed:

```c#
int playerIndex = npc.lastInteraction;
if (!Main.player[playerIndex].active || Main.player[playerIndex].dead)
{
	playerIndex = npc.FindClosestPlayer(); // Since lastInteraction might be an invalid player fall back to closest player.
}
Player player = Main.player[playerIndex];
// Other code affecting the player. Might need ModPackets if relevant.
```

## Random Choice
Many times we want to drop a random item from a set of choices. There is the naive way and a better way.

```c#
int choice = Main.rand.Next(2);
if (choice == 0)
{
	Item.NewItem((int)npc.position.X, (int)npc.position.Y, npc.width, npc.height, ModContent.ItemType<PuritySpiritMask>());
}
else if (choice == 1)
{
	Item.NewItem((int)npc.position.X, (int)npc.position.Y, npc.width, npc.height, ModContent.ItemType<BunnyMask>());
}
```

The above code could also be replaced with a switch statement.

A better way:

```c#
using Terraria.Utilities;
// --------
var dropChooser = new WeightedRandom<int>();
dropChooser.Add(mod.ItemType<Items.Armor.PuritySpiritMask>());
dropChooser.Add(mod.ItemType<Items.Armor.BunnyMask>());
int choice = dropChooser;
Item.NewItem(npc.getRect(), choice);
```

This second method is a lot easier to maintain. You can also assign different weights to different choices. This usage is probably more Advanced or Expert level, but I thought I'd mention it. 

One more way:

```c#
int[] choices = [ModContent.ItemType<CarKey>(), ModContent.ItemType<ExampleLightPet>(), ItemID.PinkJellyfishJar];
int choice = Main.rand.Next(choices);
Item.NewItem(npc.getRect(), choice);
```

## What about Vanilla NPC?
If you would like to have an item drop from a vanilla NPC, all the same ideas apply except that instead of putting our code in our ModNPC class, we put code in a GlobalNPC class and use an if statement to filter out npc drops we don't want to affect

```c#
class MyGlobalNPC : GlobalNPC
{
	public override void NPCLoot(NPC npc)
	{
		if(npc.type == NPCID.Frankenstein)
		{
			// Place added drops specific to Frankenstein here
		}
		// Addtional if statements here if you would like to add drops to other vanilla npc.
	}
}
```

### Special Cases
Some vanilla bosses require special conditions to detect when they are killed and ready to drop their loot.

Eater of Worlds:
```c#
if (npc.boss && System.Array.IndexOf(new int[] { NPCID.EaterofWorldsBody, NPCID.EaterofWorldsHead, NPCID.EaterofWorldsTail }, npc.type) > -1)
```

The Twins:
```c#
if (npc.type == NPCID.Retinazer && !NPC.AnyNPCs(NPCID.Spazmatism) || npc.type == NPCID.Spazmatism && !NPC.AnyNPCs(NPCID.Retinazer))
```

## Other approaches
### NextBool
There is a NextBool method you can use if you want to use it rather than comparing a random number to 0

```c#
if (Main.rand.NextBool(7))
	Item.NewItem(npc.getRect(), ItemID.Beenade, 20); 
```

# Not covered in Basic level
* BlockLoot
* Let us know.