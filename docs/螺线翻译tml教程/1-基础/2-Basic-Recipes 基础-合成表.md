***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Basic-Recipes/f1a9c7a29f517a696631670bf58f75e7a7e4ccb9)
***

# Basic Recipe
Recipes can be added to the game in 3 places. In `ModItem.AddRecipes`, `GlobalItem.AddRecipes`, and `ModSystem.AddRecipes`. Where you add your recipes is up to your organizational preferences, but do note that the `ModItem.CreateRecipe` method cannot be used everywhere as is, use `Recipe.Create` where it is not possible. 

Recipes consist of Ingredients (Items consumed to craft the result), Tiles (Tiles you need to stand by), and Results (Item created).

The "Material" tooltip is automatically added to every item that is used in at least one recipe as an ingredient, and should not be manually added.

# Basic Recipe Structure
## Required Using Statements
First, make sure that you have the following using statements in the .cs file. These using statements will let us access recipe related functions:    
```cs
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;
```
## Create Recipe and Assign Recipe Result
To start a recipe we create an instance of the `Recipe` class. We do this through the `Recipe.Create` method or the `ModItem.CreateRecipe` method. When creating a recipe, we need to assign the recipe result type and result stack. The `ModItem.CreateRecipe` method assumes that the recipe results in the current `ModItem`, so only the stack size is needed. The stack size is optional and defaults to 1:

In `GlobalItem` class, we type "Recipe.Create" to use the `Recipe.Create` method. Here are various examples, showing vanilla and modded ingredients as well as default stack sizes and custom stack sizes:
```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueZ); 
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueZ, 5); 
Recipe recipe = Recipe.Create(ModContent.ItemType<Content.Items.ExampleItem>());
Recipe recipe = Recipe.Create(ModContent.ItemType<Content.Items.ExampleItem>(), 10);
```
In `ModSystem` class, we also use `Recipe.Create`:
```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueZ); 
```
In `ModItem` class, we can use `Recipe.Create` to create a recipe that doesn't have this `ModItem` as a result:
```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueZ); 
// ... And we can use "CreateRecipe" directly to create a recipe that results in this ModItem. We can optionally provide a stack size:
Recipe recipe = CreateRecipe(); 
Recipe recipe = CreateRecipe(10); 
```
## Add Recipe Ingredients
Now, we add the ingredients. These are the items we want the recipe to be consumed when the recipe is crafted:

```cs
recipe.AddIngredient(ItemID.DirtBlock);
recipe.AddIngredient(ItemID.Ruby);
```
AddIngredient also takes an optional argument for specifying a stack size:

```cs
recipe.AddIngredient(ItemID.Chain, 10);
```
The previous examples added vanilla items to the recipe by referencing the ItemID class. With a capable IDE such as Visual Studio, you will find autocomplete and intellisense very useful, but you can also [look up ItemID names or values here](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#item-ids). 

We can also add modded items added by this mod. There are several ways we can do this. Go for whatever approach you like. The 1st approach is the cleanest. All of these methods can add the stack parameter. These examples all point to the `ExampleItem` class in the `ExampleMod.Content.Items` namespace:

```cs
recipe.AddIngredient<Content.Items.ExampleItem>();
recipe.AddIngredient<Content.Items.ExampleItem>(10);
recipe.AddIngredient(ModContent.ItemType<Content.Items.ExampleItem>());
recipe.AddIngredient(ModContent.GetInstance<Content.Items.ExampleItem>());
recipe.AddIngredient(Mod, "ExampleItem");
```

If you are in a `ModItem` class, you can also use that ModItem directly in a recipe:
```cs
recipe.AddIngredient(this, 5);
```

## Add Crafting Stations
Next, we can specify the crafting stations. This follows the same patterns as items. You can [look up TileIDs here](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Tile-IDs).

If you want the item to be crafted by hand, you should skip this step.

```cs
recipe.AddTile(TileID.WorkBenches);
recipe.AddTile(TileID.Anvils);
recipe.AddTile<Content.Tiles.Furniture.ExampleWorkbench>();
recipe.AddTile(ModContent.TileType<Content.Tiles.Furniture.ExampleWorkbench>());
recipe.AddTile(ModContent.GetInstance<Content.Tiles.Furniture.ExampleWorkbench>());
recipe.AddTile(Mod, "ExampleWorkbench");
```
## Register Recipe
Finally, we need to tell tModLoader that our Recipe is complete and add it to the game:
```cs
recipe.Register();
```

## Using Vanilla vs Modded Ingredients and Tiles
As a recap, vanilla items and tiles use the `TileID` and `ItemID` classes, while modded items and items use the `ModContent.TileType` and `ModContent.ItemType` methods:

```cs
recipe.AddTile(TileID.WorkBenches); // Vanilla Tile
recipe.AddTile(ModContent.TileType<Content.Tiles.Furniture.ExampleWorkbench>()); // Modded Tile
recipe.AddIngredient(ItemID.Meowmere); // Vanilla Item
recipe.AddIngredient(ModContent.ItemType<Content.Items.ExampleItem>()); // Modded Item
```

## Full Basic Recipe Example
Here are a few full basic recipe example. This first example resides in a ModSystem class. The recipe takes 1 Chain and 10 Stone Blocks, it is crafted at a workbench and anvil, and the resulting item is 1 AlphabetStatueA.

```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueA);
recipe.AddIngredient(ItemID.StoneBlock, 10);
recipe.AddIngredient(ItemID.Chain);
recipe.AddTile(TileID.WorkBenches);
recipe.AddTile(TileID.Anvils);
recipe.Register();
```

This example is in a `ModItem` class. This recipe crafts 3 of the ModItem from 5 `ExampleItem`s:

```cs
Recipe recipe = CreateRecipe(3);
recipe.AddIngredient<Content.Items.ExampleItem>(5);
recipe.Register();
```

# Chain Syntax
The code in this guide is quite wordy. Using the chaining syntax, we can reduce the verbosity of our code. This approach may be more pleasing to the modder. Only the final line has a semi-colon.
```cs
Recipe.Create(ItemID.AlphabetStatueA)
	.AddIngredient(ItemID.StoneBlock, 10)
	.AddIngredient(ItemID.Chain)
	.AddTile(TileID.WorkBenches)
	.AddTile(TileID.Anvils)
	.Register();
```


# Recipe Groups
Recipe Groups allow a single ingredient to be satisfied from a selection of similar items. The most common example of this is using Iron Bar or Lead Bar to craft a recipe. Recipe Groups are discussed in [Intermediate Recipes](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#recipegroups)

# Conditions
In addition to ingredients and crafting stations, recipes can also have conditions. Each condition must be satisfied for the recipe to be able to be crafted.

## Water, Honey, Lava, Shimmer
Water, Honey, Lava, and Shimmer are not technically Tiles, so to make a recipe require standing next to those, use one of the following:

```cs
recipe.AddCondition(Condition.NearWater);
recipe.AddCondition(Condition.NearLava);
recipe.AddCondition(Condition.NearHoney);
recipe.AddCondition(Condition.NearShimmer);
```
Note that `NearWater` is also satisfied by Sinks, so don't add the Sink tile separately.

## Other Vanilla Conditions
The [Conditions.cs](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/Condition.cs) page lists all other vanilla conditions. Use them in a similar manner.

## Custom Condition
Mods can also use custom conditions, those are discussed in the [Custom Conditions section of the Intermediate Recipes guide](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#custom-conditions).

# Multiple Recipes
With multiple Recipes in the same AddRecipes, make sure not to re-declare your variable name. The following will cause errors: 

```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueA); 
// other code
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueB);
// other code
```
You can name your variables recipe1, recipe2, and so on, but a cleaner approach would be to just reuse the same variable:

```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueA); 
// other code
recipe = Recipe.Create(ItemID.AlphabetStatueB); 
// other code
```

If you are using the [Chain Syntax](#Chain-Syntax), then simply do the same approach for each recipe on subsequent lines.

# Making an "upgraded" vanilla tile
As an aside, you may want your ModTile to count as, say, a workbench or anvil. To do this, add the following to your `ModTile.SetStaticDefaults`:

```cs
AdjTiles = [TileID.WorkBenches];
```

# Complete Examples
Here are 2 complete examples, one showing recipes added in a `ModItem` class more suitable for recipes involving that `ModItem`, and the other showing adding recipes in a `Mod` class more suitable for recipes involving vanilla items. Technically the recipes can go in either location, but for organization purposes it is sometimes nice to have recipes in ModItem classes.
## ModItem Example
```cs
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ExampleMod.Content.Items.Accessories
{
	public class ExampleShield : ModItem
	{
		// Other methods and fields here...

		public override void AddRecipes()
		{
			// This example showcases the more modern "chaining style" for recipe creation.
			// For a simpler example, see the ModSystem code below.
			CreateRecipe()
				.AddIngredient<ExampleItem>()
				.AddTile<ExampleWorkbench>()
				.Register();
		}
	}
}
```

## ModSystem Example
Remember that in `ModSystem`, we must pass in the recipe result item type.
```cs
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ExampleMod.Content
{
	public class ExampleRecipes : ModSystem
	{
		// Other methods and fields here...

		public override void AddRecipes()
		{
			// Here is an example of a recipe.
			Recipe recipe = Recipe.CreateRecipe(ItemID.Wood, 999);
			recipe.AddIngredient<Content.Items.ExampleItem>();
			recipe.Register();

			// Here we reuse 'recipe', meaning we don't need to re-declare that it is a Recipe
			recipe = Recipe.CreateRecipe(ItemID.PumpkinPie, 2);
			recipe.AddIngredient(ItemID.BlueBerries, 20);
			recipe.AddTile(TileID.WorkBenches);
			recipe.Register();
		}
	}
}
```

# Common Errors
### Error CS0117 'ItemID' (or TileID) does not contain a definition for 'MyModItem'
You tried to use the vanilla item syntax for adding a ModItem, read this tutorial again.
### Error CS0103 The name 'recipe' does not exist in the current context
You forgot to declare your first recipe as `Recipe`. Make sure the first recipe in your code starts with `Recipe recipe = ...`
### Error CS0128 A local variable named 'recipe' is already defined in this scope
Read `Multiple Recipes` above.
### My recipes aren't in game
Check that your AddRecipes method has override not virtual.
### No suitable method to override
Make sure you are only overriding AddRecipes in Mod, ModSystem, or ModItem.
### The crafting station or ingredient shown in game doesn't match my recipe code
This is most likely because you mistakenly passed in an `ItemID` into `AddTile` or a `TileID` into `AddIngredient`. By using the wrong ID class, you have accidentally referred to the wrong ID.

# Relevant References
* [Vanilla ItemIDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#item-ids)
* [Vanilla TileIDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#tile-ids)
* [Recipe Documentation](https://docs.tmodloader.net/docs/stable/class_recipe.html)
* [ModSystem Documentation](http://docs.tmodloader.net/docs/stable/class_mod_system.html)
* [ModItem Documentation](http://docs.tmodloader.net/docs/stable/class_mod_item.html)
* [GlobalItem Documentation](http://docs.tmodloader.net/docs/stable/class_global_item.html)

# Not covered in Basic level
There are other aspects of Recipes that will be covered in more advanced guides:
* [Recipe Groups](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#recipe-groups) -- Intermediate -- Allows a single ingredient to be 1 of a large group, like how most recipes involving wood can take Boreal Wood or Pearl Wood. ("any wood")
* [Editing Recipes](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#editing-recipes) -- Intermediate -- Edit existing recipes or disable existing recipes
* [Ordering Recipes](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#ordering-recipes) -- Intermediate -- Customize where in the crafting list a recipe will appear.
* [Shimmer Decrafting](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#shimmer-decrafting) -- Intermediate -- Customize which recipe is used for decrafting via the shimmer liquid.
* [Custom Conditions](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#custom-conditions) -- Intermediate -- Allows recipes to require custom conditions met in order to be crafted.
* [Custom Item Consumption](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#custom-item-consumption) -- Intermediate -- Allows a recipe to conditionally consume less ingredients than usual, such as what Alchemy Table does.
* [Custom Recipe Craft Behavior](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#custom-recipe-craft-behavior) -- Intermediate -- Allows running code after a recipe is crafted.
* [Cross-Mod Content](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#cross-mod-recipes) -- Intermediate -- Use Items or Tiles from other mods in your Recipe.