# Basic NPC Drops and Loot
This guide will teach the basics of dropping items when enemies are killed. Please note that this page only applies to 1.4 tModLoader. NPC Loot in 1.3 tModLoader is completely different, see [Basic NPC Drops and Loot](Basic-NPC-Drops-and-Loot) for details.

# Basics
Terraria maintains a database of rules that dictate the items that each NPC type drops. This database is populated during mod loading. This data can be viewed by the user by visiting the Bestiary. We use the `ModifyNPCLoot` method in either our `ModNPC` class or our `GlobalNPC` class to register the rules that dictate the items that drop from enemies. In addition, all bag items that drop items are also structured in a similar manner through `ModifyItemLoot`.

## Why did loot change from the old system?
The 1.3 system of loot relied solely on code to dictate the drops and as such the resulting item drops for a particular NPC could not be reliably determined. The new system maintains a database of rules that helps populate the Bestiary feature as well as facilitate mods tweaking item drops. For example, in 1.3 it was impossible to add an item to a set of item drops without risking breaking other mods. The new system allows item drops to be much more reliably adjusted.

## IItemDropRule
Every item drop rule is an instance of the `IItemDropRule` class. There are many varieties of `IItemDropRule` which will be explained later. Each rule has logic that dictates the item, stack size, and chances of the item dropping.

## ModNPC.ModifyNPCLoot() vs GlobalNPC.ModifyNPCLoot() vs GlobalNPC.ModifyGlobalLoot()
There are 3 places we can put NPC loot rules. If our mod adds an NPC and we want specific drops for that NPC, please put the relevant code in the `ModifyNPCLoot` hook in the `ModNPC` class. If we want to add drops to specific vanilla NPCs, put code in the `ModifyNPCLoot` hook in a `GlobalNPC` class. If we want to add drops to all NPC, such as how Dungeon Chest keys or Souls drop, put the code in `GlobalNPC.ModifyGlobalLoot`. Drops added to all NPC are called global rules and do not show in the Bestiary. Remember, organization is key for maintainability of your mod.

## How do I specify my item?
In the examples below, we drop a vanilla item: `ItemID.Shackle`. This can be swapped for an item from your mod by replacing that with `ModContent.ItemType<ItemName>()`

# Full Example
This example shows the basic file layout. The actual rules will be taught in [Typical Item Drop Rules](#typical-item-drop-rules) below.
Although the following examples exclude the using statements typically found in code for brevity, the following using is required for drop rules and drop conditions:
```cs
using Terraria.GameContent.ItemDropRules;
```
There may be other missing using statements necessary for these examples which will not be written here.

## Adding Drops to a ModNPC
```cs
namespace MyMod
{
	public class MyNPC : ModNPC
	{
		// Other code omitted from this example

		public override void ModifyNPCLoot(NPCLoot npcLoot) {
			// This is where we add item drop rules, here is a simple example:
			npcLoot.Add(ItemDropRule.Common(ItemID.Shackle, 50));
		}
	}
}
```

## Adding Drops to a Vanilla NPC
```cs
namespace MyMod
{
	public class MyGlobalNPC : GlobalNPC
	{
		public override void ModifyNPCLoot(NPC npc, NPCLoot npcLoot) {
			// First, we need to check the npc.type to see if the code is running for the vanilla NPC we want to change
			if (npc.type == NPCID.VampireBat) {
				// This is where we add item drop rules for VampireBat, here is a simple example:
				npcLoot.Add(ItemDropRule.Common(ItemID.Shackle, 50));
			}
			// We can use other if statements here to adjust the drop rules of other vanilla NPC
		}
	}
}
```

### Special Cases
Some vanilla bosses require special conditions and rules to detect when they are killed and ready to drop their loot.

Eater of Worlds:
```c#
if (System.Array.IndexOf(new int[] { NPCID.EaterofWorldsBody, NPCID.EaterofWorldsHead, NPCID.EaterofWorldsTail }, npc.type) > -1)
{
	LeadingConditionRule leadingConditionRule = new(new Conditions.LegacyHack_IsABoss());
	leadingConditionRule.OnSuccess(/*Your rule goes here*/);
	//leadingConditionRule.OnSuccess(/*Additional rules as new lines*/);
	npcLoot.Add(leadingConditionRule);
}
```

The Twins:
```c#
if (npc.type == NPCID.Retinazer || npc.type == NPCID.Spazmatism)
{
	LeadingConditionRule leadingConditionRule = new LeadingConditionRule(new Conditions.MissingTwin());
	leadingConditionRule.OnSuccess(/*Your rule goes here*/);
	//leadingConditionRule.OnSuccess(/*Additional rules as new lines*/);
	npcLoot.Add(leadingConditionRule);
}
```

## Adding Drops to all NPC (Global Rule)
```cs
namespace MyMod
{
	public class MyGlobalNPC : GlobalNPC
	{
		public override void ModifyGlobalLoot(GlobalLoot globalLoot) {
			// This is where we add global rules for all NPC. Here is a simple example:
			globalLoot.Add(ItemDropRule.Common(ItemID.Shackle, 50));
		}
	}
}
```

# Prerequisite Knowledge
## Chance (Denominator and Numerator)
The chance of an item is usually shown the the user as something like 25%, but in code, it is represented as a fraction. Fractions are composed of a numerator, the top number, and a denominator, the bottom number. For example, the fraction `1/4` corresponds to 25%. Many loot rules only use a denominator and assume a numerator of 1, but there should be other options available to construct a loot rule with a non-1 numerator.  

## Luck
// TODO: what is luck? how does it affect drops? Which rules are affected?

# Typical Item Drop Rules
Now that you know where to put item drop rules, now we will learn how to make actual rules. Many rules have multiple ways of creating them. The most common approach is to use the static helper methods in the `ItemDropRule` class, but you can also directly create the rules with the underlying class.

Each of the rules described below must be registered to the loot database. For example, if the rule you wish to use is `ItemDropRule.Common(ItemID.BeeGun)`, then the code you will end up writing will be `npcLoot.Add(ItemDropRule.Common(ItemID.BeeGun));`.

## Drop a Single Item
`ItemDropRule.Common(int itemId, int chanceDenominator = 1, int minimumDropped = 1, int maximumDropped = 1)`    
Or: `new CommonDrop(int itemId, int chanceDenominator, int amountDroppedMinimum = 1, int amountDroppedMaximum = 1, int chanceNumerator = 1)`    

This rule will drop the item at the chance given by the parameters provided. The stack size of the drop can also be controlled:
```cs
ItemDropRule.Common(ItemID.BeeGun) // Always drop 1 Bee Gun
ItemDropRule.Common(ItemID.BeeGun, 8) // Drop 1 Bee Gun 1 out of every 8 times (12.5% chance)
ItemDropRule.Common(ItemID.Torch, 4, 10, 15) // Drop a stack of 10 to 15 torches with 1 in 4 chance (25% chance)
new CommonDrop(ItemID.Torch, 5, 10, 15, 2) // Drop a stack of 10 to 15 torches with 2 in 5 chance (40% chance)
```

## Drop One of Many Items
`ItemDropRule.OneFromOptions(int chanceDenominator, params int[] options)`   
or `ItemDropRule.OneFromOptionsWithNumerator(int chanceDenominator, int chanceNumerator, params int[] options)`    
or `new OneFromOptionsDropRule(int chanceDenominator, int chanceNumerator, params int[] options)`   

This rule will drop 1 item from a selection of item options. This is typically what bosses use to drop one out of their set of boss weapons. The situation is a bit more complicated with bosses since they usually conditionally drop boss bags. Read the LeadingConditionRule section for more info.
```cs
// Drop one of these 3 items with 100% chance
ItemDropRule.OneFromOptions(1, ItemID.MagicDagger, ItemID.PhilosophersStone, ItemID.StarCloak)
// 1 in 100 or 1% chance to drop one of these 3 items. Or, effectively 0.33% chance each.
ItemDropRule.OneFromOptions(100, ItemID.AncientCobaltHelmet , ItemID.AncientCobaltBreastplate , ItemID.AncientCobaltLeggings) 
```

## Drop a Single Item with a Different Expert Mode Chance
`ItemDropRule.NormalvsExpert(int itemId, int chanceDenominatorInNormal, int chanceDenominatorInExpert)`    
or `new DropBasedOnExpertMode(IItemDropRule ruleForNormalMode, IItemDropRule ruleForExpertMode)`   

Many useful items drop more frequently in expert mode.
```cs
ItemDropRule.NormalvsExpert(ItemID.BlessedApple, 40, 30) // 1 in 40 (2.5%) chance in Normal. 1 in 30 (3.33%) chance in Expert
``` 

## Conditionally Drop Items
`ItemDropRule.ByCondition(IItemDropRuleCondition condition, int itemId, int chanceDenominator = 1, int minimumDropped = 1, int maximumDropped = 1, int chanceNumerator = 1)`   
or `new ItemDropWithConditionRule(int itemId, int chanceDenominator, int amountDroppedMinimum, int amountDroppedMaximum, IItemDropRuleCondition condition, int chanceNumerator = 1)`    

By passing in a `IItemDropRuleCondition`, an item drop rule that only drops items when certain conditions are met can be constructed.
```cs
// Drop 1 Soul of Light 20% of the time if SoulOfLight condition met
new ItemDropWithConditionRule(ItemID.SoulofLight, 5, 1, 1, new Conditions.SoulOfLight()) 
// Drop 30 to 90 CrimtaneOre if the world is Crimson and not Expert mode
ItemDropRule.ByCondition(new Conditions.IsCrimsonAndNotExpert(), ItemID.CrimtaneOre, 1, 30, 90) 
```

## Drop items if other Rule not chosen
See [Chaining Rules](#Chaining-Rules) for information on branching rules.

## Drop items like The Twins
This requires a custom condition, see below. You can look at the code of `Conditions.MissingTwin` as a guide for how to implement.

## Drop stack of item one by one like Lunar Fragments
`new DropOneByOne(int itemId, DropOneByOne.Parameters parameters)`    
See [MinionBossBody](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/MinionBoss/MinionBossBody.cs#L202) for an example of using `DropOneByOne`.

## Boss Bag
See [Full Boss Example](#full-boss-example) below

## Instanced or Per Player
// TODO

## Etc
// TODO: Add other common rules here

# Conditions (IItemDropRuleCondition)
Many drop rules allow for an `IItemDropRuleCondition` to be provided. This object dictates what conditions are needed for the drop to occur. Common conditions include current events, bosses defeated in the world, normal vs expert mode, current biome, and so on.
// TODO: Biome, Boss downed, Expert

## Custom Condition
You can create your own condition if needed.

See `ExampleDropCondition` in ExampleMod and the usages of it for an example of custom conditions.

### First Time Boss Defeated Condition
Plantera has a guaranteed drop of the Grenade Launcher and 50-149 Rocket I. Here is that code:
```cs
// First, a not expert rule is created
LeadingConditionRule notExpertRule = new LeadingConditionRule(new Conditions.NotExpert());
npcLoot.Add(notExpertRule);

// When the not expert rule is true, this firstTimeKillingPlanteraRule is attempted
LeadingConditionRule firstTimeKillingPlanteraRule = new LeadingConditionRule(new Conditions.FirstTimeKillingPlantera());
notExpertRule.OnSuccess(firstTimeKillingPlanteraRule);

// This rule drops a GrenadeLauncher and 50-149 RocketI as well
IItemDropRule greanadeLauncherRule = ItemDropRule.Common(ItemID.GrenadeLauncher);
greanadeLauncherRule.OnSuccess(ItemDropRule.Common(ItemID.RocketI, 1, 50, 150), hideLootReport: true);

// When the firstTimeKillingPlanteraRule succeeds, the greanadeLauncherRule will be attempted, dropping the items
firstTimeKillingPlanteraRule.OnSuccess(greanadeLauncherRule, hideLootReport: true);
// Otherwise, one out of these 7 rules will be attempted
firstTimeKillingPlanteraRule.OnFailedConditions(new OneFromRulesRule(1, greanadeLauncherRule, ItemDropRule.Common(ItemID.VenusMagnum), ItemDropRule.Common(ItemID.NettleBurst), ItemDropRule.Common(ItemID.LeafBlower), ItemDropRule.Common(ItemID.FlowerPow), ItemDropRule.Common(ItemID.WaspGun), ItemDropRule.Common(ItemID.Seedler)));
```
From this setup, the rules dictate that when not in expert mode, if it is the first time killing Plantera, then the Grenade Launcher is guaranteed to drop. When it is not the first time, one of the 7 rules will drop. The important part is the `Conditions.FirstTimeKillingPlantera` condition. This code is shown below:
```cs
public class FirstTimeKillingPlantera : IItemDropRuleCondition, IProvideItemConditionDescription
{
	public bool CanDrop(DropAttemptInfo info) => !NPC.downedPlantBoss;
	public bool CanShowItemDropInUI() => true;
	public string GetConditionDescription() => null;
}
```
The important part is the `CanDrop` method, which simply checks `!NPC.downedPlantBoss` (meaning it can drop when the boss hasn't been defeated), which is how the game tracks Plantera being defeated in the world. Crucially, NPC drops are calculated before boss flags like `NPC.downedPlantBoss` are set to true, that allows this to work.

This same approach can be used for other vanilla and modded bosses. Only `FirstTimeKillingPlantera` exists in the code, but a modder can create a `IItemDropRuleCondition` for any other boss by using the appropriate [NPC.downedX bool](https://github.com/tModLoader/tModLoader/wiki/NPC-Class-Documentation#downedboss1). Modded bosses can also be done in the same manner, except tracked with the [boss bool from your ModSystem class](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/Systems/DownedBossSystem.cs#L15)

# Chaining Rules
Rules can be chained together to form more complex item drop logic. For example, one of the Queen Bee drops is 1 of 4 options. 33% chance Hive Wand, 11% chance for each of Bee Hat, Bee Shirt, and Bee Pants. To form this logic, the following code is used:
```cs
ItemDropRule.ByCondition(new Conditions.NotExpert(), ItemID.HiveWand, 3).OnFailedRoll(ItemDropRule.OneFromOptionsNotScalingWithLuck(2, ItemID.BeeHat, ItemID.BeeShirt, ItemID.BeePants))
```
First, the HiveWand is dropped with 33% chance but only if the world is not expert. Chained to that item drop rule via the `OnFailedRoll` method is a rule that drops one of the 3 bee vanity set items with a 50% chance. The rule chained via `OnFailedRoll` is only used if the original rules condition was met but the random chance failed. Since there is a 66% chance that the 50% chance will be attempted, the final chance is 33% chance for one of the bee vanity items, or 11% chance each.

Other options for chaining include `OnSuccess` and `OnFailedConditions`. `OnSuccess` runs if the original rule succeeds and `OnFailedConditions` runs if the conditions failed.

Using a rule called `LeadingConditionRule`, a set of rules can be nested under a single rule rather than repeating the same conditions for each rule. This code defines a rule where `HiveWand` is dropped with a 25% chance and 10 to 30 `Beenade` are dropped with a 50% chance, but only if not in expert mode. 
```cs
// This code uses LeadingConditionRule to logically nest several rules under it.
LeadingConditionRule leadingConditionRule = new LeadingConditionRule(new Conditions.NotExpert());
leadingConditionRule.OnSuccess(ItemDropRule.Common(ItemID.HiveWand, 4));
leadingConditionRule.OnSuccess(ItemDropRule.Common(ItemID.Beenade, 2, 10, 30));
npcLoot.Add(leadingConditionRule);

vs
// This approach repeats the Condition code. Use whatever approach fits your logic
npcLoot.Add(ItemDropRule.ByCondition(new Conditions.NotExpert(), ItemID.HiveWand, 4));
npcLoot.Add(ItemDropRule.ByCondition(new Conditions.NotExpert(), ItemID.Beenade, 2, 10, 30));
```

Other common patterns are dropping a full armor set at once, or a weapon with its special ammo. The approach is similar.
```cs
//Drops the full copper armor set with 20% chance. This works by dropping the helmet with 20% chance, and then the other pieces with 100% chance if succeeded.
IItemDropRule copperArmorRule = ItemDropRule.Common(ItemID.CopperHelmet, 5);
copperArmorRule.OnSuccess(ItemDropRule.Common(ItemID.CopperChainmail, 1));
copperArmorRule.OnSuccess(ItemDropRule.Common(ItemID.CopperGreaves, 1));
npcLoot.Add(copperArmorRule);

//Drops the snowball cannon with 50% chance, and with it 75-150 snowballs. hideLootReport is used to prevent the snowballs from appearing in the bestiary. This makes sense here as snowballs are tied to the snowball cannon
var snowballCannonRule = ItemDropRule.Common(ItemID.SnowballCannon, 2);
snowballCannonRule.OnSuccess(ItemDropRule.Common(ItemID.Snowball, 1, 75, 150), hideLootReport: true);
npcLoot.Add(snowballCannonRule);
```

### Common Mistakes
One common mistake is accidentally adding chained rules as normal rules. This results in the conditions seemingly not working. This is an easy mistake to make. Lets take the `HiveWand`/`Beenade` example from earlier. If the modder writes the following, the `NotExpert` condition is seemingly ignored:

```cs
LeadingConditionRule leadingConditionRule = new LeadingConditionRule(new Conditions.NotExpert());
npcLoot.Add(leadingConditionRule.OnSuccess(ItemDropRule.Common(ItemID.HiveWand, 4)));
npcLoot.Add(leadingConditionRule.OnSuccess(ItemDropRule.Common(ItemID.Beenade, 2, 10, 30)));
```

The issue here is that the `leadingConditionRule` is actually not added as a drop rule. The `OnSuccess` method returns the rule being chained, resulting in the 2 `ItemDropRule.Common` rules being added directly by accident, and therefore ignoring the `NotExpert` condition. When using `OnSuccess`, `OnFailedConditions`, or `OnFailedRoll`, make sure to use them as statements separate from `npcLoot.Add` and only add the `LeadingConditionRule` once after all the chained rules have been chained to it.


# Full Boss Example
In Terraria, bosses drop different items depending on the game mode. In expert mode, a boss bag is dropped for each player. In normal mode, the items that would come out of a boss bag except expert only items are dropped instead. This example shows this pattern.
You can view the `ModifyNPCLoot` code on the [MinionBossBody](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/MinionBoss/MinionBossBody.cs) and the corresponding `ModifyItemLoot` code on the [MinionBossBag](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Consumables/MinionBossBag.cs), below is a minimal example to showcase it:
```cs
//The important parts to handle proper difficulty drops and the boss bag are the following:
//1. The boss:
//1.1. In the ModifyNPCLoot hook
npcLoot.Add(ItemDropRule.BossBag(ModContent.ItemType<MinionBossBag>())); // BossBag rule automatically checks expert mode itself
//1.2. Put any loot that belongs in the bag based on the "not expert" condition
LeadingConditionRule notExpertRule = new LeadingConditionRule(new Conditions.NotExpert());
notExpertRule.OnSuccess(ItemDropRule.Common(ModContent.ItemType<MinionBossMask>(), 7));

//2. The bag:
//2. In the ModItem
//2.1. In SetStaticDefaults, set ItemID.Sets.BossBag to true
ItemID.Sets.BossBag[Type] = true;
//2.2. Return true in CanRightClick
public override bool CanRightClick() {
	return true;
}
//2.3. In the ModifyItemLoot hook, replicate the drops from ModNPC.ModifyNPCLoot and add expert specific drops and money
public override void ModifyItemLoot(ItemLoot itemLoot) {
	itemLoot.Add(ItemDropRule.Common(ModContent.ItemType<MinionBossMask>(), 7)); // copy of non-expert drops from ModNPC.ModifyNPCLoot
	itemLoot.Add(ItemDropRule.Common(ItemID.JungleYoyo)); // expert specific drop example
	itemLoot.Add(ItemDropRule.CoinsBasedOnNPCValue(ModContent.NPCType<MinionBossBody>())); // drop money
}
```

# Consulting vanilla drop code
If you are curious how various vanilla drop rates correspond to code, it would be beneficial to read the decompiled code. All vanilla drops are found in the `Terraria.GameContent.ItemDropRules.ItemDropDatabase` class. Use the find tool with the NPCID number of the NPC you are interested in to find relevant snippets of code.

## Example
// TODO: example of finding a particular rule from the code

### Player who killed NPC
// TODO: This section is still 1.3 approach
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

# Editing drops
You can edit drops as well. See [ExampleNPCLoot](https://github.com/tModLoader/tModLoader/blob/1.4/ExampleMod/Common/GlobalNPCs/ExampleNPCLoot.cs) to learn more.

# Not covered in Basic level
* Let us know.