***
This Guide has been updated to 1.4.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Basic-Item/f240adbd4e8629200547bd80057207a0182382d4)
***

# Basic Item
This guide serves to explain common things shared among all items.

# What is an Item?
It is important to be aware of the distinction between Items, Projectiles, and Tiles. Starting out, you may inadvertently confuse concepts if you aren't clear how they are different. For example, some people might get confused and try to add a workbench item to a recipe when really they wanted to add the workbench tile. It is also important to realize that many something like a boomerang weapon consists of both the item and the projectile. While a simple concept, try to remember.

# Making an Item
To add an item to Terraria, we must first create a "class" that "inherits" from ModItem. To do so, make a .cs file in your mod's source directory (`My Games\Terraria\tModLoader\ModSources\MyModName`) and then open that file in your text editor. Paste the following into that file, replacing `NameHere` with the internal name of your item and `ModNamespaceHere` with your mod's foldername/namespace. (A common mistake is to use apostrophes or spaces in internal names, don't do this, the computer won't understand.)
```cs
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ModNamespaceHere
{
    public class NameHere : ModItem
    {
        public override void SetDefaults()
        {
            Item.width = 20;
            Item.height = 20;
            Item.maxStack = 999;
            Item.value = 100;
            Item.rare = ItemRarityID.Blue;
            // Set other Item.X values here
        }

        public override void AddRecipes()
        {
            // Recipes here. See Basic Recipe Guide
        }
    }
}
```
Now that you have a `.cs` file, bring in your texture file (a `.png` image file that you have made) and put it in the folder with this `.cs` file. Make sure read [Autoload](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload) so you know how to satisfy what the computer expects for its filename and folder structure.

# SetDefaults
The most important part of an Item is the `SetDefaults`. `SetDefaults` is where you set values for the item, things like what ammo does the item use, how big is the item, and which tile the item places. See [Item Class Documentation](https://github.com/tModLoader/tModLoader/wiki/Item-Class-Documentation) to see what values commonly set in `SetDefaults` mean. You can also view vanilla item values by visiting [Vanilla Item Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Item-Field-Values). Many examples of different items can be found in [ExampleMod.Content.Items](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Items)

# Localization
After you build your mod, the localization file, typically found in `My Games\Terraria\tModLoader\ModSources\MyModName\Localization\en-US_Mods.MyModName.hjson`, will be populated with entries for the newly added items. For items you'll see entries for the `DisplayName` and the `Tooltip`. The `DisplayName` will default to the `classname` with capital letters separating the words. The `Tooltip` will default to nothing. You can edit this file to customize these localizations:

```
Items: {
	NameHere: {
		DisplayName: Name Here
		Tooltip: This is a modded item.
	}
}
```

If you want a tooltip with multiple lines, please read [the Multiline section in the Localization wiki page](https://github.com/tModLoader/tModLoader/wiki/Localization#multiline) to learn the correct syntax.