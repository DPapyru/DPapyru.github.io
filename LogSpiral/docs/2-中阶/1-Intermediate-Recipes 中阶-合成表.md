***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes/c5e693d7cf96c9ff58167da11a5da30b759c427c)
***

# Prerequisites 
* [Basic Recipes](Basic-Recipes)

# Recipe Groups
Recipe groups allow you to create a recipe that accepts any item out of a list of specified ingredients. For example, all varieties of wood are in the vanilla "Wood" Group. Instead of creating 8 separate recipes to use each type of vanilla wood, we would create 1 recipe that uses the "Wood" recipe group. Mods can also add recipe groups to simplify their recipes.

## Using Existing Recipe Groups
Vanilla groups consist of: "Wood", "IronBar", "PresurePlate", "Sand", "Fragment", "Birds", "Scorpions", "Squirrels", "Bugs", "Ducks", "Butterflies", "Fireflies", "Snails", "Dragonflies", "Turtles", and "Fruit". To use a vanilla recipe group, simply add the following instead of a similar `Recipe.AddIngredient` line:
```csharp
// Option 1: The name of the group as a string
recipe.AddRecipeGroup("Wood", 5); // parameter 1 is the group name, parameter 2 is the item stack count
// Option 2: Use the RecipeGroupID value.
recipe.AddRecipeGroup(RecipeGroupID.IronBar, 10);
```
Note that, like with `Recipe.AddIngredient`, the parameter for providing an explicit stack count is optional and defaults to 1.

## New Recipe Groups
You may have noticed that aside from "Wood" and "IronBar", there aren't many useful vanilla recipe groups. Luckily, we can make our own recipe groups. Let's imagine we want to make a recipe that used a Magic Mirror or Ice Mirror as an ingredient. Without recipe groups, we would have to do this:
```csharp
Recipe recipe = CreateRecipe();
recipe.AddIngredient(ItemID.MagicMirror);
recipe.AddIngredient(ItemID.Gel, 10);
recipe.AddTile(TileID.Chairs);
recipe.AddTile(TileID.Tables);
recipe.Register();

recipe = CreateRecipe();
recipe.AddIngredient(ItemID.IceMirror);
recipe.AddIngredient(ItemID.Gel, 10);
recipe.AddTile(TileID.Chairs);
recipe.AddTile(TileID.Tables);
recipe.Register();
```
In this example, it isn't too bad, but imagine you have 10 or 20 similar items that you'd like to use for your recipe - it would get unmanageable very quickly. To solve this, first, we must add a new recipe group. We do this in a `ModSystem` class by overriding the `ModSystem.AddRecipeGroups` method:
```csharp
// The Terraria.Localization using directive (using Terraria.Localization;) is required for Language methods.
public override void AddRecipeGroups()
{
	RecipeGroup group = new RecipeGroup(() => $"{Language.GetTextValue("LegacyMisc.37")} {Lang.GetItemNameValue(ItemID.MagicMirror)}", ItemID.IceMirror, ItemID.MagicMirror);
	RecipeGroup.RegisterGroup(nameof(ItemID.MagicMirror), group);
}
```
As seen above, first we construct the group, then we call `RecipeGroup.RegisterGroup` with the desired name. As a convention, please use `"ModName:GroupName"` for recipe groups that mainly concern items or usages specific to your mod. If you are using vanilla items to make a group that could conceivably be used by other mods for the same purpose, use `nameof(ItemID.IconicItem)`, where `IconicItem` is the earliest item to be added to the game in the group (smallest ItemID value). For example, if you were adding a group for SilverBar and TungstenBar, use SilverBar because that was the first item added to the game. Doing this allows multiple mods to collaborate seamlessly. If Mod A adds a SilverBar group, and Mod B adds a similar group but with a 3rd SilverBar variant, the game will seamlessly merge the recipegroups, allowing all recipes using the groups to allow all variants. 

As a note, `Language.GetTextValue("LegacyMisc.37")` is just the word "Any" in the selected language and requires the `Terraria.Localization` using directive at the top of your code. The syntax here is a little difficult for newcomers (as it makes use of [lambda expressions](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions)), so please follow it exactly.

As a note: use `ModContent.ItemType<YourModItem>()` instead of `ItemID.ItemName` for `ModItem`s.

Next, we need to use the `RecipeGroup`. We do this just like with vanilla recipe groups, except our recipe group's name will be different:
```csharp
recipe.AddRecipeGroup("ModName:GroupName");
```
## Complete Example
```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;
using Terraria.Localization;

namespace ExampleMod
{
	public class ExampleRecipes : ModSystem
	{
		public override void AddRecipeGroups()
		{
			RecipeGroup group = new RecipeGroup(() => $"{Language.GetTextValue("LegacyMisc.37")} {Lang.GetItemNameValue(ItemID.MagicMirror)}", ItemID.IceMirror, ItemID.MagicMirror);
			RecipeGroup.RegisterGroup(nameof(ItemID.MagicMirror), group);
		}

		public override void AddRecipes()
		{
			Recipe recipe = Recipe.Create(ModContent.ItemType<Items.MinionControlRod>());
			recipe.AddIngredient(ItemID.SlimeStaff);
			recipe.AddRecipeGroup(nameof(ItemID.MagicMirror));
			recipe.AddTile(TileID.Chairs);
			recipe.AddTile(TileID.Tables);
			recipe.Register();

			recipe = Recipe.Create(ModContent.ItemType<Items.SummonersAssociationCard>());
			recipe.AddIngredient(ItemID.Gel, 10);
			// Here, instead of adding 5 ItemID.Wood, we use a RecipeGroup to specify all types of Wood in a single recipe.
			recipe.AddRecipeGroup("Wood", 5);
			recipe.AddTile(TileID.Chairs);
			recipe.AddTile(TileID.Tables);
			recipe.Register();
		}
	}
}
```
Note that the name used in `Recipe.AddRecipeGroup` is identical to what we defined when registering our modded `RecipeGroup`.

## Editing Vanilla Recipe Groups
In some situations, you may want to add your own items to existing recipe groups. In this example, we will add another wood type to the "Wood" recipe group.
```csharp
public override void AddRecipeGroups()
{
	if (RecipeGroup.recipeGroupIDs.ContainsKey("Wood"))
	{
		int index = RecipeGroup.recipeGroupIDs["Wood"];
		RecipeGroup group = RecipeGroup.recipeGroups[index];
		group.ValidItems.Add(ModContent.ItemType<MyWood>());
	}
}
```
Note that checking `if (RecipeGroup.recipeGroupIDs.ContainsKey(...))` is not *necessary*, but it will prevent errors if some other mod completely removes that recipe group for one reason or another. This can also be used for [cross-mod compatibility](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content).

# Custom Conditions
In the [Conditions section of the Basic Recipes guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Recipes#conditions), using existing conditions in recipes is taught. Custom conditions can also be used in mods. 

The most common custom condition for mods would likely be a condition for if the player is in a custom `ModBiome`. To do this, use the `AddCondition` method and pass in a new instance of the `Condition` class. Within the `Condition` class constructor, a localization key and a method with no arguments that returns a bool will need to be provided. In this case, we will use the `InModBiome` method to query if the local player is in our `ModBiome`. This example only allows the recipe to be crafted if the player is in the `ExampleSufaceBiome`:
```cs
Recipe.Create(ItemID.AlphabetStatueG)
	.AddIngredient(ItemID.StoneBlock, 3)
	.AddCondition(new Condition("Mods.ExampleMod.Conditions.InExampleBiome", () => Main.LocalPlayer.InModBiome<ExampleSurfaceBiome>()))
	.Register();
```
This approach works well for effects used in a single recipe, but adding the same code to many different recipes will be messy and error-prone. The solution to this is to reuse the `Condition`. It is recommended to place all `Condition` instances in an appropriately named static class so that they can easily be referenced for any recipe that would use it in your whole mod.

Static class with shared `Condition` instances:
```cs
namespace ExampleMod.Content
{
	public static class ExampleConditions
	{
		public static Condition InExampleBiome = new Condition("Mods.ExampleMod.Conditions.InExampleBiome", () => Main.LocalPlayer.InModBiome<ExampleSurfaceBiome>());

		// Other Condition instances can go here.
	}
}
```
Using a `Condition` from the static class. This code can be used in any recipe in any file, provided the correct using statement is used:
```cs
Recipe.Create(ItemID.AlphabetStatueG)
	.AddIngredient(ItemID.StoneBlock, 3)
	.AddCondition(ExampleConditions.InExampleBiome)
	.Register();
```
The condition description will be shown to the user if they look at the recipe from the Guide's recipe help or a mod like [Recipe Browser](https://steamcommunity.com/sharedfiles/filedetails/?id=2619954303).    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/e365694c-0405-4fe1-8f11-711b367bbb21)    

# Shimmer Decrafting
By default, the first recipe that results in an item will be the recipe used to decraft that item. This behavior can be customized with conditions. The comments and examples in [ShimmerShowcase.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/ShimmerShowcase.cs) teach how to customize to shimmer decrafting feature.

# Custom Item Consumption
Recipes don't always consume all the items used as ingredients. For example, all recipes that use `TileID.Bottles` as a crafting station will be subject to the [Alchemy Table effect](https://terraria.wiki.gg/wiki/Alchemy_Table). All ingredients have a 1/3rd chance to not be consumed. Note that the modder still needs the full amount of ingredients to craft the item, they just might not be consumed.

Modders can make their own custom recipe item consumption rules and apply them to individual recipes. This is done by the `AddConsumeItemCallback` method. The modder provides a delegate (The delegate is of the `ConsumeItemCallback` Type) that will run when the item is being crafted, for each ingredient. That delegate has the ability to adjust the amount of each item that is consumed.

```cs
Recipe.Create(ItemID.AlphabetStatueB)
	.AddIngredient(ItemID.StoneBlock, 10)
	.AddIngredient(ItemID.Chain)
	.AddConsumeItemCallback((Recipe recipe, int type, ref int amount) => {
		if (type == ItemID.Chain) {
			amount = 0;
		}
	})
	.AddTile(TileID.HeavyWorkBench)
	.Register();
```
In this example, we add a recipe that will not consume the `ItemID.Chain` item. This is done by adding a `ConsumeItemCallback` delegate that will set the amount to 0 if the ingredient being checked is `ItemID.Chain`. This approach works well for effects used in a single recipe, but adding the same code to many different recipes will be messy and error-prone. The solution to this is to reuse the delegate. It is recommended to place all `ConsumeItemCallback` delegates in an appropriately named static class so that they can easily be referenced for any recipe that would use it in your whole mod.

Static class with shared `ConsumeItemCallback` delegates:
```cs
namespace ExampleMod.Content
{
	public static class ExampleConsumptionRules
	{
		public static void DontConsumeChain(Recipe recipe, int type, ref int amount) {
			if (type == ItemID.Chain) {
				amount = 0;
			}
		}

		// Other ConsumeItemCallback delegates can go here.
	}
}
```
Using a `ConsumeItemCallback` delegate. This code can be used in any recipe in any file, provided the correct using statement is used:
```cs
Recipe.Create(ItemID.AlphabetStatueC)
	.AddIngredient(ItemID.StoneBlock, 10)
	.AddIngredient(ItemID.Chain)
	.AddConsumeItemCallback(ExampleConsumptionRules.DontConsumeChain)
	.AddTile(TileID.HeavyWorkBench)
	.Register();
```

The Alchemy Table effect uses a bit of advanced logic. First, the Alchemy Table tile itself uses [AdjTiles](https://github.com/tModLoader/tModLoader/wiki/Basic-Recipes#making-an-upgraded-vanilla-tile) to act like `TileID.Bottles`. This means it will satisfy the crafting station requirement for recipes requiring `TileID.Bottles`. The code also sets the `Player.alchemyTable` bool to true, indicating that the player is under the effects of the alchemy table. Finally, the `ConsumeItemCallback` code applied to each of the potion recipes does the following to check for the `alchemyTable` bool and give each item a 1/3 chance to be consumed:
```cs
public static void Alchemy(Recipe recipe, int type, ref int amount) {
	if (!Main.LocalPlayer.alchemyTable) {
		return;
	}

	int amountUsed = 0;

	for (int i = 0; i < amount; i++) {
		if (!Main.rand.NextBool(3)) {
			amountUsed++;
		}
	}

	amount = amountUsed;
};
```
To adapt this to a modded situation, modders might need to use a `ModPlayer` bool or something like `Main.LocalPlayer.adjTile[TileID.HeavyWorkBench]` as the condition instead of the `alchemyTable` bool.

As demonstrated, modders can do advanced logic in `ConsumeItemCallback` code. Remember that your users will not know about these effects unless it is communicated to them. The Alchemy Table item tooltip, for example, tells the player "33% chance to not consume potion crafting ingredients".

# Custom Recipe Craft Behavior
We can use the `AddOnCraftCallback` method to run code after the recipe is crafted. This is not done for any vanilla Terraria content, but it can be useful for advanced features added by mods. Similar to the approach shown for using [AddConsumeItemCallback](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#custom-item-consumption), we want to store these methods statically so they are easily reusable. The following example is a trivial example, but should give an idea about what can be done. This example randomly spawns fireworks projectiles and the confetti item into the players inventory when the recipe is crafted. You can test this out by crafting the item in ExampleMod:
```cs
Recipe.Create(ItemID.AlphabetStatueZ)
	.AddIngredient(ItemID.StoneBlock, 10)
	.AddIngredient(ItemID.Chain)
	.AddOnCraftCallback(ExampleRecipeCallbacks.RandomlySpawnFireworks)
	.AddTile(TileID.HeavyWorkBench)
	.Register();
```
```cs
namespace ExampleMod.Common
{
	public static class ExampleRecipeCallbacks
	{
		public static void RandomlySpawnFireworks(Recipe recipe, Item item, List<Item> consumedItems, Item destinationStack) {
			if (Main.rand.NextBool(3)) {
				int fireworkProjectile = ProjectileID.RocketFireworksBoxRed + Main.rand.Next(4);
				Projectile.NewProjectile(Main.LocalPlayer.GetSource_FromThis(), Main.LocalPlayer.Top, new Microsoft.Xna.Framework.Vector2(0, -Main.rand.NextFloat(2f, 4f)).RotatedByRandom(0.3f), fireworkProjectile, 0, 0, Main.myPlayer);

				Main.LocalPlayer.QuickSpawnItem(Main.LocalPlayer.GetSource_FromThis(), ItemID.Confetti, 5);
			}
		}
	}
}
```

# Ordering Recipes
Recipes can be placed before or after specific recipes to group them with similar recipes. To do this, use the `SortBeforeFirstRecipesOf`, `SortBefore`, `SortAfterFirstRecipesOf`, or `SortAfter` method. By default recipes will be placed at the end of the recipe listing.

`SortBeforeFirstRecipesOf` and `SortAfterFirstRecipesOf` take an `ItemID` and are simple to use:
```cs
CreateRecipe()
	.AddIngredient(ItemID.Terrarium)
	.AddIngredient(ModContent.ItemType<NPCs.ExampleCritterItem>())
	.SortAfterFirstRecipesOf(ItemID.FrogCage) // places the recipe right after vanilla frog cage recipe.
	.Register();
```

`SortBefore` and `SortAfter` take a specific `Recipe`, which allows more complex logic. One potential use is to place a recipe between 2 recipes with the same result.
```cs
CreateRecipe()
	.AddIngredient<ExampleItem>()
	.AddTile<Tiles.Furniture.ExampleWorkbench>()
	.SortBefore(Main.recipe.First(recipe => recipe.createItem.wingSlot != -1)) // Places this recipe before any wing so every wing stays together in the crafting menu.
	.Register();
```    
![image](https://github.com/user-attachments/assets/8a9223ae-8863-41ca-ae0f-604ec0ddbb1d)    
![image](https://github.com/user-attachments/assets/e52a6050-735d-4013-847b-0e9504575590)    

# Editing Recipes
We can edit vanilla recipes or recipes from other mods from within a `ModSystem.PostAddRecipes` method. Basically, we iterate over the recipes to find the recipe we want to tweak, then modify ingredients, tiles, or even disable the recipe entirely.

## Complete Example
This code removes the "Chain" item from all vanilla recipes. The second half of this example finds and disables an exact recipe. Do not remove entries from `Main.recipe`, that will break many things.
```csharp
public override void PostAddRecipes() {
	for (int i = 0; i < Recipe.numRecipes; i++) {
		Recipe recipe = Main.recipe[i];

		if (recipe.TryGetIngredient(ItemID.Chain, out Item ingredient)) {
			recipe.RemoveIngredient(ItemID.Chain);
		}

		if(recipe.HasRecipeGroup("IronBar") && recipe.HasTile(TileID.Anvils) && recipe.HasResult(ItemID.Chain) && recipe.createItem.stack == 10) {
			recipe.DisableRecipe();
		}
	}
}
```

# Cross-Mod Recipes
If you wish to use items or tiles from other mods in your recipes, you need to plan ahead. Read [Expert Cross Mod Content](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content) for an idea of some considerations you'll need to keep in mind. For example, the mod you are referencing might change the item name in an update to their mod, breaking your mod in the process. Another issue is planning for the other mod not being enabled. In that case, you might want to skip the recipe altogether or plan an alternate recipe. The example below shows the alternate ingredients approach. 

```cs
Recipe recipe = Recipe.Create(ItemID.Wood, 999);
if (ModLoader.TryGetMod("ExampleMod", out Mod exampleMod) && exampleMod.TryFind<ModItem>("ExampleWings", out ModItem ExampleWings)) {
	recipe.AddIngredient(ExampleWings.Type);
}
else {
	recipe.AddIngredient(ModContent.ItemType<MyItem>());
	recipe.AddIngredient(ItemID.EnchantedSword);
}
recipe.Register();
```
As you can see, this recipe takes `ExampleMod`'s `ExampleWings` item if `ExampleMod` is enabled and `ExampleWings` exists in that mod, and the current mod's `MyItem` and vanilla's `EnchantedSword` if `ExampleMod` is not enabled. If you have opted to only load your mod if the other mod is enabled, you can simplify the logic since the other mod will always be available if you are using `modReferences`.

# Common Errors

### `MyModItem.AddRecipeGroups()`: no suitable method found to override
`ModSystem.AddRecipeGroups` has to go in the `ModSystem` class, not your `ModItem` class.

# Relevant References
* [Vanilla ItemIDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#item-ids)
* [Vanilla TileIDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#tile-ids)
* [Recipe Documentation](http://docs.tmodloader.net/docs/stable/class_recipe.html)
* [ModSystem Documentation](http://docs.tmodloader.net/docs/stable/class_mod_system.html)
* [ModItem Documentation](http://docs.tmodloader.net/docs/stable/class_mod_item.html)
* [GlobalItem Documentation](http://docs.tmodloader.net/docs/stable/class_global_item.html)