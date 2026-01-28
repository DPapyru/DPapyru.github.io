***
This Guide was written for tModLoader v1.4.4, the most recent version of tModLoader. In legacy tModLoader, this generalized Condition class does not exist.
***

# Condition Class

Conditions are a simple [record](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record) that hold a `LocalizedText` Description and [`Func<bool>`](https://learn.microsoft.com/en-us/dotnet/api/system.func-1?view=net-6.0) Predicate. Conditions are used in Recipes and Town NPC shops. Conditions can also be used in NPC Loot and almost anywhere else.

The `Condition` class is within the `Terraria` namespace.

## Description

Each condition has a description. The description is a `LocalizedText` that describes what the condition is. `LocalizedText` is a special `string` that points to a key in the localization file. See the [localization guide](https://github.com/tModLoader/tModLoader/wiki/Localization) for more information on localization.

The description should be short and to the point. Most conditions start with words such as "In", "Near", "When", "During", "Before", or "After". Some examples are "After defeating King Slime", "In a Hallow biome", "During a Blood Moon", "Before defeating the Pirates", and "When the vendor is happy enough to sell pylons". The description could also start with "Not" such as "Not in an Drunk world". The descriptions do not end with punctuation.

The description can be accessed with `.Description`. For example, `Condition.TimeDay.Description` will return a `string` that says "During daytime".

Why is a description needed? A description of the condition can be used in several places to tell the player when something is available. For example, when the player gives the Guide a crafting material, text will display saying which crafting station is needed and which other conditions are needed (like being in a Graveyard biome). Mods may also want to show this description to players. *Recipe Browser* wants to show the player how to obtain an item, for example.

## Predicate

Each condition has a predicate. The predicate is a `Func<bool>` that defines when the condition is true. The predicate can be accessed with `Condition.TheCondition.Predicate`. We can also get the predicate as a simple `bool` with `.IsMet()`. For example `Condition.TimeDay.IsMet()` will return a `bool` saying if it is daytime or not.

# Pre-Defined Conditions

There are many useful conditions that we can use. These including checking which biome the player is in and which bosses have been defeated in the world. Look at the Condition class for all of the pre-defined Conditions:

* [Condition.cs](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/Condition.cs)
  * This file has all of the pre-defined Conditions as well as their predicates.
* [Localization file for the descriptions](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/Localization/Content/en-US/tModLoader.json#L762)
  * The descriptions for each of the pre-defined conditions can be found in the tModLoader localization file.

# Combining Multiple Conditions

Multiple Conditions can be combined when adding them to Recipes, Town NPC shop items, or NPC Loot. However, ALL Conditions must be satisfied. Multiple Conditions are ANDed together, not ORed.

For example, if an item is available in the Hallow biome but not in a Remix World (*Don't Dig Up* World) we would use the Conditions `Condition.InHallow` and `Condition.NotRemixWorld`. The following localized text would show to the player:
```
In a Hallow biome
Not in a Remix world
```

ANDing many Conditions is easy, but ORing Conditions can't be done. ORing Conditions is fairly rare, but one such example in vanilla is `NightAfterEvilOrHardmode` which has the description of "During the night after defeating the Eater of Worlds or Brain of Cthulhu, or anytime in Hardmode". This Condition is used by the Arms Dealer to sell Unholy Arrows. In order to OR Conditions together, we will need to create our own Condition.

# Creating Conditions

Even though there are many useful pre-defined Conditions, we may need to create our own.

To create a custom Condition, we need to define a variable with a type of `Condition` and give it a description and predicate.
```cs
//        Our variable                      Description (LocalizedText) Predicate (Func<bool>)
Condition OurConditionsName = new Condition("Our description key here", () => true);
```

ANDing many Conditions is easy, but ORing Conditions can't be done. We can create our own Condition that ORs several bools. Here is an example where we want the Condition to be true if Plantera OR Golem have been defeated.

```cs
Condition DownedPlanteraOrGolem = new Condition("Mods.YourModHere.Conditions.DownedPlanteraOrGolem", () => NPC.downedPlantBoss || NPC.downedGolemBoss);

// Alternately, we can use other Condition's predicates in our predicate by adding `IsMet()` to the other Condition.
// It may be easier and more clear to use another Condition's predicate. 
Condition DownedPlanteraOrGolem = new Condition("Mods.YourModHere.Conditions.DownedPlanteraOrGolem", () => Condition.DownedPlantera.IsMet() || Condition.DownedGolem.IsMet());
```

You'll notice we are specifying a localization key for our Description. This is so we can add support multiple languages in our mod without having to edit our Condition's code. We will put the actual text description in our [localization file](#Localization).

```cs
Condition InJungleOrDownedQueenBee = new Condition("Mods.YourModHere.Conditions.InJungleOrDownedQueenBee", () => Condition.InJungle.IsMet() || Condition.DownedQueenBee.IsMet())
```

Here is an example that is used by the Merchant to sell the Drum Set. It is available after defeating Eater of Worlds/Brain of Cthulhu, or defeating Skeletron, or in Hardmode. `"Conditions.DownedB2B3HM"` is localized text that is already defined in tModLoader.

```cs
Condition drumSetCondition = new Condition("Conditions.DownedB2B3HM", () => NPC.downedBoss2 || NPC.downedBoss3 || Main.hardMode);
```

Here is a more advanced example to check the percentage of the filled Bestiary. This Condition takes an argument. This is used by the Zoologist for many items. `"Conditions.BestiaryPercentage"` is localized text that is already defined in tModLoader.

```cs
Condition BestiaryFilledPercent(int percent) => new Condition(Language.GetText("Conditions.BestiaryPercentage").WithFormatArgs(percent),
  () => Main.GetBestiaryProgressReport().CompletionPercent >= percent/100f);
```

## Localization

We set our Descriptions to a localization key so that we can add support multiple languages in our mod without having to change our Condition code.

Our localization file would look something like this. Check the [Localization guide](https://github.com/tModLoader/tModLoader/wiki/Localization) for more information on localization.
```jisonlex
Mods: {
	YourModHere: {
		Conditions: {
			ConditionName: This is where we write the description
			InJungleOrDownedQueenBee: While in the Jungle or after defeating Queen Bee
			DownedPlanteraOrGolem: After defeating Plantera or after defeating Golem
		}
	}
}
```

## Creating a Conditions Class

If we are going to use a Condition that we have created several times in our mod, it would be more useful to define the Condition once in a custom Condition class rather than recreating it every time we need it. We can create a simple static class that has our commonly used Conditions in it.

```cs
public static class OurModConditions
{
	public static Condition DownedPlanteraOrGolem = new Condition("Mods.YourModHere.Conditions.DownedPlanteraOrGolem", () => Condition.DownedPlantera.IsMet() || Condition.DownedGolem.IsMet());
	
	public static Condition PlayerIsMale = new Condition("Mods.YourModHere.Conditions.PlayerIsMale", () => Main.LocalPlayer.Male);
	public static Condition PlayerIsFemale = new Condition("Mods.YourModHere.Conditions.PlayerIsFemale", () => !Main.LocalPlayer.Male);
	
	public static Condition PlayerHasAtLeast100Mana = new Condition("Mods.YourModHere.Conditions.PlayerHasAtLeast100Mana", () => Main.LocalPlayer.statManaMax2 >= 100);
}
```

Now, we can just use `OurModConditions.DownedPlanteraOrGolem` to get that specific condition when we need it.

See also: [ExampleConditions.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/ExampleConditions.cs)

# In Recipes

Conditions can be added to recipes with `recipe.AddCondition()`.

Here is an example recipe that requires the player be stood in a Graveyard biome.
```cs
Recipe.Create(ItemID.Tombstone)
	.AddIngredient(ItemID.StoneBlock, 10)
	.AddTile(TileID.HeavyWorkBench)
	.AddCondition(Condition.InGraveyard)
	.Register();
```

See the [Basic Recipe guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Recipes) for more information on recipes.

# In Town NPC Shops

Conditions can be added to shop items to determine when the item is available to purchase.

```cs
// Here, our item will be available after any Mechanical Boss has been defeated.
npcShop.Add(ItemID.HallowedBar, Condition.DownedMechBossAny);

// Here our item will be available during Full Moons and New Moons.
npcShop.Add(ItemID.MoonCharm, Condition.MoonPhases04);

// Here our item will be available in the Hallow biome AND while below the surface.
// Adding multiple conditions will require that ALL conditions are met for the item to appear.
npcShop.Add(ItemID.CrystalShard, Condition.InHallow, Condition.InBelowSurface);
```

See also: [Example Person's shop](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/ExamplePerson.cs#L281)

# In NPC Loot

Conditions can be used to create a DropCondtion. This is potentially much easier than creating an IItemDropRuleCondition or LeadingRuleCondition. Additionally, because of the description on Conditions, the Bestiary will say the availability of the item too! We can turn any normal Condition into a drop condition by adding `.ToDropCondition()` to the end of it.

```cs
Condition.TimeDay.ToDropCondition(ShowItemDropInUI.Always)
```

`ToDropCondition()` takes at least one argument to say if the item will show up in the Bestiary. `ShowItemDropInUI.Always` will make the item always appear in the Bestiary even if the condition isn't met, `ShowItemDropInUI.WhenConditionSatisfied` will make the item appear only when the condition is met, and `ShowItemDropInUI.Never` will make the item never appear in the Bestiary. The second argument of `ToDropCondition()` will determine if the description of the Condition will be shown (true by default).

Here is a full example of an NPC's loot. In this example, the Example Sword will be shown in the Bestiary at all times and will have an additional tooltip line that says "Drops: During daytime".

```cs
npcLoot.Add(ItemDropRule.ByCondition(Condition.TimeDay.ToDropCondition(ShowItemDropInUI.Always), ModContent.ItemType<ExampleSword>()));
```

See the [Basic NPC Drops and Loot guide](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Drops-and-Loot-1.4) for more information on NPC loot.

# In Mod Hair

`ModHair` can use a Condition to determine when the [hairstyle](https://terraria.wiki.gg/wiki/Hairstyles) should be available in the Stylist's shop. In vanilla, most hairstyles are available at all times, but a few require a boss to be defeated.

```cs
public override IEnumerable<Condition> GetUnlockConditions() {
	yield return Condition.DownedMartians;
}
```

If you want your hairstyle to be always available, simply don't override `GetUnlockConditions()`.
See [ExampleHair](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Hairs/ExampleHair.cs) for more information on Mod Hair.

# Other Uses For Conditions

Conditions can be used anywhere as bools by adding `.IsMet()`. Using a Condition instead of something else may be easier to understand.

Example: Which mechanical boss corresponds to `NPC.downedMechBoss1`, `NPC.downedMechBoss2`, `NPC.downedMechBoss3`? Besides memorizing which one goes with which, or referring to the [NPC Class Documentation](https://github.com/tModLoader/tModLoader/wiki/NPC-Class-Documentation#downedboss1) every time, we can just use a Condition. Using `Condition.DownedDestroyer.IsMet()`, `Condition.DownedTwins.IsMet()`, `Condition.DownedSkeletronPrime.IsMet()` is much easier to understand and doesn't require us to remember which number corresponds to which boss.

There are also some Conditions that combine several other bools into one. If we wanted to check if all mechanical bosses are defeated, instead of writing `NPC.downedMechBoss1 && NPC.downedMechBoss2 && NPC.downedMechBoss3`, we could just write `Condition.DownedMechBossAll.IsMet()`.

Conditions that check for the player will always use `Main.LocalPlayer`. This is not ideal for situations where you are given a `Player player` instance or are looping through `Main.player[]`. In these cases we should use the normal variables instead such as `player.ZoneJungle`.