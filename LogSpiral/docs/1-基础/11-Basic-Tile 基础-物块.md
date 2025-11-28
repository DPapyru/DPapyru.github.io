***
This Guide has been updated to 1.4.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile/166add9cb77cce9848277575dc9c4f925ecfb69e). The 1.4 version can be found [here](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile/9223cb4451dbe651c893589d95da583913098eba)
***

# Basic Tile
This guide serves to explain the basics of Tiles.

# What is a Tile?
It is important to clearly understand tiles in your mind. Starting out, you might confuse or conflate tiles and items. Items are things in your inventory. Tiles are blocks in the world. Many items in the game place tiles, but aside from the item placing the tile and the tile returning the item, there is no enforced connection between an item and the tile it places. That said, most tiles modders will add will have 1 or many corresponding items. 

Confusingly, tiles exist alongside walls and wires in the `Tile` struct. Every tile coordinate in the game world corresponds to a `Tile` struct. `Main.tile` contains all of those `Tile`s. Keep in mind if you work with the `Tile` struct directly that they contain more than just the tile data. If you are curious about the `Tile` struct itself, or need to directly work with it, please see [Tile Class Documentation](https://docs.tmodloader.net/docs/stable/struct_tile.html)

## Tile-Item Pairing
An Item will place a specific Tile when `Item.createTile` is set to the `TileType` of the `ModTile`. If a Tile has multiple styles, setting `Item.placeStyle` allows you to specify that style. See [Multiple Styles](#multiple-styles) for more details. The `ModTile` will return the `ModItem` when mined as well. This process is automated, but can be customized for special tiles if needed. Modders can use `ModTile.RegisterItemDrop` to manually register drops for specific styles. `ModTile.GetItemDrops` can be used for full control of the drops. `TileLoader.GetItemDropFromTypeAndStyle` can be used to query the item drop from a tile type and tile style. [ExampleTrap.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleTrap.cs) is an example of a tile that uses custom styles, so custom item drop code is used.

### Basic tile placing item code
Items that place tiles are usually very simple. The following is about all that is needed. Adding a [`Recipe`](https://github.com/tModLoader/tModLoader/wiki/Basic-Recipes) is a typical additional section of code added to a tile placing item.
```cs
public class MyTable : ModItem
{
	public override void SetDefaults() {
		Item.DefaultToPlaceableTile(ModContent.TileType<MyMod.Tiles.Furniture.MyTable>(), 0);
		Item.value = 150;
	}
}
```

# Making a Tile
To add a tile to Terraria, we must first create a "class" that "inherits" from `ModTile`. To do so, make a .cs file in your mod's source directory (`My Games\Terraria\tModLoader\ModSources\MyModName`) and then open that file in your text editor. Paste the following into that file, replacing `NameHere` with the internal name of your tile and `ModNamespaceHere` with your mod's foldername/namespace. (A common mistake is to use apostrophes or spaces in internal names, don't do this, the computer won't understand.)

```cs
using Microsoft.Xna.Framework;
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ModNamespaceHere
{
	public class NameHere : ModTile
	{
		public override void SetStaticDefaults()
		{
			Main.tileSolid[Type] = true;
			Main.tileMergeDirt[Type] = true;
			Main.tileBlockLight[Type] = true;
			Main.tileLighted[Type] = true;
			DustType = DustID.Stone;
			AddMapEntry(new Color(200, 200, 200));
			// Set other values here
		}
	}
}
```

Now that you have a .cs file, bring in your texture file (a .png image file that you have made) and put it in the folder with this .cs file. Make sure read [Autoload](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload) so you know how to satisfy what the computer expects for its filename and folder structure.

# Framed vs FrameImportant Tiles
There are 2 different types of Tiles. One type is the regular tiles that are 1x1 (width of 1, height of 1) and adjust themselves as you place similar tiles next to them. These will be referred to as "Framed" tiles in this guide, but are also known as "Terrain" tiles. The other type are the tiles that do not change automatically, which we will call "FrameImportant" tiles. These tiles are usually larger than 1x1 so another name for them could be "MultiTiles". "Furniture" tiles is also another name for these tiles.  

Here is an example of the sprite of a Framed tile:    
![](https://i.imgur.com/vtH5d8n.png)

Here is an example of the sprite of a FrameImportant tile:    
![](https://i.imgur.com/s9ZtC9n.png)    

Not all 1x1 tiles are Framed tiles, here is an example of a 1x1 FrameImportant tile. If you recall, this `MetalBars` tile doesn't change when placed next to other tiles like Framed tiles do:    
![](https://i.imgur.com/bqoyLqT.png)

As you might have noticed, FrameImportant tiles can have multiple unique tile "styles". You might have also noticed some empty space in the spritesheets, this is padding. These concepts will be explored later.

# Coordinates
Tile coordinates are 1/16th the size of World coordinates. Remember this if you ever need to do anything involving Tiles and anything else such as NPC, Player, or Projectile. See the [Coordinates wiki page](https://github.com/tModLoader/tModLoader/wiki/Coordinates) to learn more.

# Padding
When making a sprite, it is important to adhere to the proper dimensions expected. For the most part, every individual tile will be 16x16 pixels with 2 pixels of padding to the right and below each, for a total of 18x18.
If you need help padding a sprite, you can use an external tool called [tSpritePadder](https://forums.terraria.org/index.php?threads/tspritepadder-ready-to-use-sprites-for-terraria-tiles.96177/).

# SetStaticDefaults
Now that we've gone through some preliminary info, lets focus on `SetStaticDefaults` and what to put in it. This section will explain most of the common items in `SetStaticDefaults`. The [documentation](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#documentation) further expands on these settings as well as many other more specialized settings not covered in this guide. The point of `SetStaticDefaults` is to define how the tile acts, such as is it solid, can things stand on it, and does lava kill it. Consulting similar tiles that you wish to emulate in ExampleMod is probably better than trying to do this from scratch. Many of the lines below set something to true, this means the default value is false. Don't bother including lines setting the value to the default, it just clutters your code.

It is useful to reference [`ModTile` classes from ExampleMod](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Tiles) to use as a guide when creating your own `ModTile`, especially when learning. Find the `ModTile` that is closest to what you need and copy the `SetStaticDefaults` code and then modify it if needed.

For this guide, many gifs will refer to this tile sprite:    
![](https://i.imgur.com/b009P8f.png)

## MinPick
`MinPick` controls the minimum pickaxe power that a pickaxe needs to break a tile. For example, setting `MinPick` to 50 for a tile will mean a pickaxe needs a pickaxe power higher than 50% to break it. `MinPick` defaults to 0, so any pickaxe can break the tile. Very few vanilla tiles use `MinPick` as it is often set for progression reasons, for example, Lihzahrd Brick has a `MinPick` of 210 to stop people breaking into the Jungle Temple early. For vanilla pickaxe powers, see the vanilla wiki: [Pickaxe Power](https://terraria.wiki.gg/wiki/Pickaxe_power), [Pickaxes](https://terraria.wiki.gg/wiki/Pickaxes), [Drills](https://terraria.wiki.gg/wiki/Drills).

## MineResist
`MineResist` controls how hard the tile is to mine by making it have more hitpoints, which normally would be 100 hitpoints. `MineResist` is a multiplier, so a `MineResist` of 2f will double the hitpoints of a tile to 200, and a `MineResist` of 0.5f will half it to 50. `MineResist` defaults to 1f, so the hitpoints of your tile stay at 100. `MineResist` is often set on tiles that also set a `MinPick` value. For vanilla `MineResist` values, see the table below or the [Vanilla Wiki](https://terraria.wiki.gg/wiki/Pickaxe_power).
| Tile | MineResist |
|-|-|
| Default | 1f |
| Dirt, Sand, Clay, Mud, Silt, Ash, Snow, Slush, Hardened Sand Block | 0.5f |
| Spikes & Wooden Spikes | 0.5f |
| Ebonstone, Crimstone, Pearlstone, & Dungeon Bricks | 2f |
| Cobalt & Palladium | 2f |
| Mythril & Orichalcum | 3f |
| Tombstones | 3f normally, 4f on a For The Worthy world |
| Adamantite & Titanium | 4f |
| Lihzahrd Brick | 4f |
| Chlorophyte | 5f |

## Main.tileSolid[Type] = true;
Setting this to true means the tile will be solid. Projectiles will collide with it and NPC and Players can stand on it.    

| `false` (default) | `true` |
| - | - |
| ![](https://github.com/tModLoader/tModLoader/assets/4522492/11d25d26-0d2d-4a8f-bab5-7092e87ea122) | ![](https://github.com/tModLoader/tModLoader/assets/4522492/b973894a-1d4f-470c-9104-adc5e6052af7) |

## Main.tileSolidTop[Type] = true;
Many tiles, such as placed bars, tables, anvils, etc. can be stood on but aren't solid. These tiles all set this value.    
`true`:    
![tileSolidTop true](https://github.com/tModLoader/tModLoader/assets/4522492/e608ddf4-faa0-48c7-b8cd-f48d82d834b6)    

## Main.tileTable[Type] = true;
Some tiles, such as bottles, can only be placed on "tables". Be sure to set this for flat topped furniture tiles.    

| `false` (default) | `true` |
| - | - |
| ![tileTable false](https://github.com/tModLoader/tModLoader/assets/4522492/d66d85e0-40a6-42a8-8880-7f2eda41a4c4) |  ![tileTable true](https://github.com/tModLoader/tModLoader/assets/4522492/5b063bac-cf0d-47f2-b626-7e39e1d9a4e3) |

## Main.tileMergeDirt[Type] = true;
This terrain tile will merge with dirt using the extra sprites provided in the spritesheet.    

| `false` (default) | `true` |
| - | - |
| ![](https://i.imgur.com/6UjS77f.png) | ![](https://i.imgur.com/4RvCh3p.png) |

## Main.tileSpelunker[Type] = true;	
## Main.tileShine[Type] = true;
## Main.tileShine2[Type] = true;
## Main.tileValue[Type] = true;
These are related to Metal Detector and ore shining. See [ExampleOre](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleOre.cs)

## Main.tileBlockLight[Type] = true;	
If set to `true`, light is blocked by this tile and the light will decrease as it passes through.     
![](https://i.imgur.com/BVIl2Fl.png)    

## Main.tileLighted[Type] = true;
If `true`, then the tile produces light. You can set the light color for tile using the `ModifyLight` hook.

## Main.tileLavaDeath[Type] = true;
Set to `true` if you'd like your tile to die if hit by lava.    
![tileLavaDeath true](https://github.com/tModLoader/tModLoader/assets/4522492/61610046-f13b-4d53-9654-c65f57b042d2)    
 
## Main.tileWaterDeath[Type] = true;
Set to `true` if you'd like your tile to die if hit by water.    

## Main.tileNoAttach[Type] = true;
Prevents tiles from attaching to this tile.    

| `false` (default) | `true` |
| - | - |
| ![tileNoAttach false](https://github.com/tModLoader/tModLoader/assets/4522492/7de72b32-7696-4d54-b946-97a3512509c5) | ![tileNoAttach true](https://github.com/tModLoader/tModLoader/assets/4522492/5c31bd62-9872-4add-aaf2-451000fe78fd) |

### Main.tileCut[Type] = true;
The tile can be destroyed by weapons.

### Main.tileLargeFrames[Type] = 1 or 2;
See [Custom Tile Variation](#custom-tile-variation) below.

## Other
These are more rarely used and won't be explained in this guide. See the [documentation](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#documentation) or vanilla source code if you need hints with these.
### Main.tileBouncy[Type] = true;
### Main.tileAlch[Type] = true;
### Main.tileStone[Type] = true;
### Main.tileAxe[Type] = true;
### Main.tileHammer[Type] = true;
### Main.tileNoSunLight[Type] = true;
### Main.tileDungeon[Type] = true;
### Main.tileRope[Type] = true;
### Main.tileBrick[Type] = true;
### Main.tileMoss[Type] = true;
### Main.tileNoFail[Type] = true;
### Main.tileObsidianKill[Type] = true;
### Main.tilePile[Type] = true;
### Main.tileBlendAll[Type] = true;
### Main.tileGlowMask[Type] = true;
### Main.tileContainer[Type] = true;
### Main.tileSign[Type] = true;
### Main.tileMerge[Type][otherType] = true;
### Main.tileSand[Type] = true;
### Main.tileFlame[Type] = true;
### Main.tileFrame[Type] = true;
### Main.tileFrameCounter[Type] = true;

## Main.tileFrameImportant[Type] = true;
This indicates that a tile is a FrameImportant tile. The frame important part of the name suggest that the frame is important, but what is frame? Frame is the coordinates within the spritesheet that the current tile should draw. For Framed tiles, the frame is never saved since the coordinate frame of a Framed tile is calculated when the world is loaded. For FrameImportant tiles, the world needs to save those coordinates, hence, "important". For modders, just remember to set this to `true` when you make a tile that uses a `TileObjectData`, or basically all tiles that aren't like dirt, ores, or other basic building tiles. See [TileObjectData](#tileobjectdata) below for details.
	
## ModTile properties: DustType, AdjTiles, etc
These are explained in the [documentation](https://docs.tmodloader.net/docs/stable/class_mod_tile.html#properties). You will need to expand the "Properties inherited from [ModBlockType](https://docs.tmodloader.net/docs/stable/class_mod_block_type.html)" section to see inherited properties such as `DustType` and `HitSound`.

## AddToArray(ref TileID.Sets.RoomNeeds.????);
Used to make a ModTile act as a lightsource, chair or table for the purposes of housing. Some examples:    
```cs
AddToArray(ref TileID.Sets.RoomNeeds.CountsAsTable);
AddToArray(ref TileID.Sets.RoomNeeds.CountsAsDoor);
AddToArray(ref TileID.Sets.RoomNeeds.CountsAsTorch);
AddToArray(ref TileID.Sets.RoomNeeds.CountsAsChair);
```    

## AddMapEntry			
`AddMapEntry` is for setting the color and optional text associated with the Tile when viewed on the map. Explore [ExampleMod examples](https://github.com/search?q=repo%3AtModLoader%2FtModLoader+AddMapEntry+path%3AExampleMod&type=Code) and the documentation for more info.

<a name="terraintile"></a>
# Terrain or Framed Tiles
Terrain tiles make up the majority of the world, like Dirt, Sand, Wood, Stone, etc. The vast majority of framed tiles are solid and will set `Main.tileSolid[Type] = true;`. These tiles are known as "framed" tiles because the game will automatically adjust which frame of the spritesheet to use based on nearby tiles. For example, some frames correspond to a lone tile and another might correspond to a tile with a tile above and a tile below. 

In this diagram we can see how several [`ExampleBlock`](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleBlock.cs) frames appear in-game when placed.    
![image](https://github.com/user-attachments/assets/43c07625-6263-4b1b-a1cb-2c635ee6fa9c)    

## Template
Here are a couple templates to use. The colors in these templates correspond to the `TileFrameNumber` variations explained later in this guide. The first template does not merge with dirt while the other does and sets `Main.tileMergeDirt[Type] = true;`.

Template 1:    
![merge_template_2x2](https://github.com/user-attachments/assets/85654015-ccb4-40f9-8703-3d9ee9525fc8)    
Template 2:    
![dirt_merge_template_2x2](https://github.com/user-attachments/assets/6c8393fd-d14d-4727-8e07-0eb064377a53)    

Other [ExampleMod examples](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Tiles) or [Terraria tile textures](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Prerequisites#vanilla-texture-file-reference) can also be used as a template.

## Variation
By default the game will automatically randomize between 3 different options when a tile is placed. This is the `Tile.TileFrameNumber` value. This will require more art work to be done to create a working spritesheet, but the variation makes the tile look more natural. 

In this example each color belongs to a different variation, notice how they are randomly used.

![image](https://github.com/user-attachments/assets/1de7fda1-ba13-4806-858f-5341915534c2)     
 
## Custom Framing
It is possible to customize the tile framing logic to merge with other tiles, have completely custom framing logic, and adjust the tile variation. 

[ExampleCustomFramingTile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleCustomFramingTile.cs) shows how to implement merging correctly with other non-dirt terrain tiles.

## Custom Tile Variation
The random variation is not always suitable for the desired look of a tile. Some tiles, like Lunar Rust Brick and Smooth Marble Block have custom tile variation code to instead present a consistent pattern. [ExampleCustomFramingTile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleCustomFramingTile.cs) shows a custom tile variation pattern that alternates row by row.

### `Main.tileLargeFrames[Type] = 2;` or 2x2 tiled pattern
Lunar Rust Brick has lines that are intended to connect to each other, it sets `Main.tileLargeFrames[Type] = 2;` to use a custom tile variation pattern that forces tile variations to repeat in a tiled 2x2 pattern. This pattern uses 4 variations instead of 3, so the tilesheet has a 2nd set of sprites to contain the 4th variation. The 5th and 6th variations are not actually used and are duplicates of the 4th option.

![tileLargeFrames2](https://github.com/user-attachments/assets/ac9a0dba-f0e2-45ce-9192-e0f2702e51f3)    

### `Main.tileLargeFrames[Type] = 1;` or 3x4 tiles pattern
Smooth Marble Block has a large tiled 3x4 pattern, it sets `Main.tileLargeFrames[Type] = 1;` to use this tile variation pattern.

![image](https://github.com/user-attachments/assets/e56b5211-3d5a-4fa6-9e5a-783b89904667)    

Again the 5th and 6th variations aren't used and are just duplicated in the spritesheet for simplicity.

![Tiles_357](https://github.com/user-attachments/assets/cb5a3447-f0d2-48bd-98fc-ef199f65f65b)     

## Animation
Terrain tiles that animate duplicate the whole spritesheet 1 or more times vertically. [ExampleLivingFireTile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleLivingFireTile.cs) shows the code needed and [ExampleLivingFireTile.png](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleLivingFireTile.png) shows how the spritesheet is expected to be laid out.

<a name="tileobjectdata"></a>
# TileObjectData or FrameImportant/MultiTiles
If a `ModTile` is not a Framed tile, it must have `Main.tileFrameImportant[Type] = true;` and the `TileObjectData` in `SetStaticDefaults`. FrameImportant tiles can be any size, from 1x1 to anything bigger. They can also have many different "styles". Each style can also have "alternates" which are alternate placements of the particular style. 

For this guide, many gifs will refer to this tile sprite:    
![](https://i.imgur.com/b009P8f.png)    

## Multiple Styles
You can take advantage of tile styles to simplify your code and avoid code repetition. Using this, you can have 1 `ModTile` file that places several styles. Each item that places this tile will have the same `Item.createTile` but will have different `Item.placeStyle` to differentiate which style to place. The `Item.DefaultToPlaceableTile` method will set all the required properties for a tile placing item and will assign `Item.createTile` and `Item.placeStyle` as well.

Tile style specific code can be added to various `ModTile` methods as well to customize the behavior of specific tile styles. [ExampleTorch.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleTorch.cs), for example, has different liquid placement properties, light color, and hover icon for the 2 styles of the tile.

See [StyleHorizontal](#stylehorizontal), [StyleMultiplier](stylemultiplier) and [StyleWrapLimit](#stylewraplimit) below for more information on how tile styles are organized in the spritesheet.

![](https://i.imgur.com/O923oDq.png)    

## Basic TileObjectData.newTile structure
In `SetStaticDefaults` we use `TileObjectData.newTile` to define properties of our tile. There are a few approaches to doing this. We can copy from a `TileObjectData` template, copy `TileObjectData` from an existing tile, or create a `TileObjectData` from scratch. 

Copying from a template or an existing tile can greatly simplify code and is suitable for inheriting common furniture settings. For example copying from `Style2x2` creates a typical 2x2 tile that can be placed on the ground and is immune to lava. Sometimes, however, we might inherit unexpected behaviors. For example `Style4x2` creates a 4x2 tile, but that tile is setup to have left and right placements. This is useful for beds, but might not be what is expected. 

Using `CopyFrom` can be convenient for common furniture types, but sometimes it is easier to just make the `TileObjectData` directly. This is especially true for tiles with dimensions not represented in the existing templates. Some existing templates might have behaviors that are unexpected, such as lava immunity or left and right placements, so doing it directly ensures that the tile behaves exactly as intended.

These approaches are explored more in the sections below.

The basic structure of setting up a `TileObjectData` is as follows:

```
Use TileObjectData.newTile.CopyFrom if desired
Adjust settings on TileObjectData.newTile
Adjust settings on TileObjectData.newAlternate if needed (explained later)
Adjust settings on TileObjectData.newSubTile if needed (explained later)
TileObjectData.addTile(Type);
```

The most important thing to remember is that `addTile` must be last and `CopyFrom` must be first if used. Doing this out of order will lead to errors.

## TileObjectData from scratch

To create a `TileObjectData` directly, follow the template below. Adjust values according to your desired width and height and then make whatever other adjustments are needed for your desired behavior. 

```cs
TileObjectData.newTile.UsesCustomCanPlace = true;
TileObjectData.newTile.StyleHorizontal = true;
TileObjectData.newTile.Width = 2;
TileObjectData.newTile.Height = 2;
TileObjectData.newTile.CoordinateWidth = 16;
TileObjectData.newTile.CoordinateHeights = [16, 16];
TileObjectData.newTile.CoordinatePadding = 2;
TileObjectData.newTile.AnchorBottom = new AnchorData(AnchorType.SolidTile | AnchorType.SolidWithTop | AnchorType.Table | AnchorType.SolidSide, TileObjectData.newTile.Width, 0);
// Additional edits here, such as lava immunity, alternate placements, and subtiles
TileObjectData.addTile(Type);
```

## CopyFrom
Terraria includes several existing `TileObjectData` templates to use as a base. If one of these templates match the desired behavior, you can use `CopyFrom` to easily setup the `TileObjectData` for your tile. The names are self explanatory usually.
Existing Templates include:   
```cs
StyleSwitch
StyleTorch
Style4x2 // Beds, has left and right placements
Style2x2
Style1x2
Style1x1
StyleAlch
StyleDye
Style2x1
Style6x3
StyleSmallCage
StyleOnTable1x1 // placeable on tables only, like bottles
Style1x2Top // "Hangs" from attaching to tiles above.
Style1xX
Style2xX
Style3x2
Style3x3
Style3x4
Style3x3Wall
```

Typically, you'll want to start out by copying a template, and modifying it as needed.
For example, [ExampleChair.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleChair.cs) first does:
`TileObjectData.newTile.CopyFrom(TileObjectData.Style1x2);`    
....and then it makes adjustments such as:     
```cs
TileObjectData.newTile.CoordinateHeights = [16, 18]; // the default is 16, 16
TileObjectData.newTile.CoordinatePaddingFix = new Point16(0, 2); // We added two more pixels
```
....and finally calls:    
```TileObjectData.addTile(Type);```

## CopyFrom TileID
We can copy from a specific existing tile rather than copy from one of the templates. Copying from an existing tile means copying even more specific behaviors. For example, copying from `Style1x2` would result in a typical 1x2 tile, but copying from `TileID.Chair` would result in a 1x2 tile that has a left and right placement style. Note that when using `CopyFrom`, tile style specific behaviors such as how some obsidian furniture is lava proof won't be copied. The `FullCopyFrom` method would additionally copy the style specific information. 

## Width
Modifies the width of the tiles in tile coordinates:    
`TileObjectData.newTile.Width = 3;`    
![](http://i.imgur.com/ZjvSjOV.png)    
`TileObjectData.newTile.Width = 2;`     
![](http://i.imgur.com/4Qqx0mC.png)    
`TileObjectData.newTile.Width = 1;`    
![](http://i.imgur.com/8dudSXH.png)    

Note that if you are modifying `Width`, you'll most likely need to modify `AnchorBottom` in a later statement as well.

## Height
Modifies the height of the tiles in tile coordinates:    
`TileObjectData.newTile.Height = 3;`    
![](http://i.imgur.com/ZjvSjOV.png)    
`TileObjectData.newTile.Height = 2;`     
![](http://i.imgur.com/IqzM18z.png)    
`TileObjectData.newTile.Height = 1;`    
![](http://i.imgur.com/ypcuohX.png)    

Note that if you are modifying `Height`, you'll most likely need to modify `CoordinateHeights` in a later statement as well.

## Origin
Modifies which part of the tile is centered on the mouse, in tile coordinates, from the top right corner:    
`TileObjectData.newTile.Origin = new Point16(0, 0); // default`    
![TileObjectData Origin 0 0](https://github.com/tModLoader/tModLoader/assets/4522492/c4c5cb05-ce17-40b1-ab63-cd54f6acfc8a)    
`TileObjectData.newTile.Origin = new Point16(2, 0); // To the right 2 tiles`     
Note how the cursor is placing the tile using the area marked "3" which is 2 to the right:    
![TileObjectData Origin 2 0](https://github.com/tModLoader/tModLoader/assets/4522492/301a6441-879b-4cba-a37b-a1f81dc8f1c2)    

## CoordinateHeights
This int array defines how tall each row of individual tiles within the tile should be. This array must be exactly the same number of elements as the value of `Height` or errors will happen. Note that these values don't include the padding pixels.

Basically, all values should be 16 in most cases. Use 18 on the bottom so that the texture can extend a little into the ground below. Here is a closeup of the texture, note how there is white there, this is to illustrate why we use 18 on a bottom tile sometimes.    
![](http://i.imgur.com/XMHqvfy.png)     
`TileObjectData.newTile.CoordinateHeights = [16, 16, 18]; // Extend into grass tiles.` 
   
Here we see the white pixels peeking out from behind the grass. Grass tiles don't completely cover their 16x16 area, leaving tiny holes. Correctly doing this will help the tile look like it's actually there and sitting in the soil, obviously modders should draw the sprite correctly and not with white. (note that it seems solid must be false for this.)    
![](http://i.imgur.com/CDzrin7.png)    
`TileObjectData.newTile.CoordinateHeights = [16, 16, 16]; // Don't extend into grass.`    
Notice how the grass doesn't completely cover its area, so our tile seems to float a little.    
![](http://i.imgur.com/PMBuMum.png)    

It is also possible to use [DrawYOffset](#drawyoffset) to shift a whole tile down to achieve a similar effect.

### Non 16 or 18 values
Values other than 16 or 18 are possible, but are very rarely done, usually just for 1x1 tiles (since bigger heights would just draw over each other for larger tiles). The coral tile, for example, is 24x26 (each style, excluding padding of course.) The code defines the follow for this effect:
```cs
TileObjectData.newTile.CoordinateHeights = [26];
TileObjectData.newTile.CoordinateWidth = 24;
TileObjectData.newTile.DrawYOffset = -8;
```    

![](https://i.imgur.com/65wwveE.png)       
![](https://i.imgur.com/ku0wQH7.png)    

## DrawYOffset
Offsets the drawing of this tile in the Y direction. Can be used to draw a tile at a location higher or lower than the default. 

The most common usage of this is to push a tile into the ground a little to make it appear to be sitting in the soil rather than floating above it. (This can also be done by having the bottom tile be 18 pixels tall using [CoordinateHeights](#coordinateheights), but if your art is already 16 pixels tall this is another option.) `TileObjectData.newTile.DrawYOffset = 2;` will move the tile 2 pixels down. Another common usage is hanging tiles like banners and lanterns, these use negative values. Banner tiles, like [ExampleWideBannerTile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleWideBannerTile.cs) also use [alternate placements](#newalternate---alternate-placement-styles) to offset the drawing either -2 or -10 pixels depending on if it is hanging below a platform or not.

This image shows several examples, note how these tiles all push into the dirt. The only exception in this screenshot is [ExampleClock](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleClock.cs) which does not use `DrawYOffset` at all and appears to hover as a result. The background can be seen peeking through the gaps in the grass below ExampleClock.

![image](https://github.com/user-attachments/assets/2c843023-abea-4e55-a93f-c784b72acf2a)

## DrawXOffset
Similar to `DrawYOffset` except applies to the X direction. The only example of this is how switches, seen in the image above, push into the tile they are placed on to appear more natural. This example also uses alternate placements to apply different `DrawXOffset` values to each orientation.

## CoordinateWidth 
Unlike `CoordinateHeights`, all tiles in a tile share the same width, so this is an `int` not an `int array`. If you aren't copying a style, make sure to set it to 16.    
`TileObjectData.newTile.CoordinateWidth = 16;`    

## CoordinatePadding 
This is the padding between tiles in the tile spritesheet. Adds a padding of 2 pixels to right and bottom of each area in the spritesheet. By convention, stick to 2. Do this or weird artifacts will appear. If you aren't copying an existing TileObjectData, make sure to set it to 2.    
`TileObjectData.newTile.CoordinatePadding = 2;`

## AnchorBottom/AnchorLeft/AnchorRight/AnchorTop
Anchors define required neighboring tiles for the placement of the tile to be valid. The most common anchor is `AnchorBottom` anchored to solid tiles for the full width of the tile, but more complex anchors can be made, such as an anchor only covering half of the side of the tile or anchoring to the left or right. Usually you get appropriate anchors for free when you use `CopyFrom`, but be aware that you'll need to fix anchors if you change the width or height of the `TileObjectData` if that width or height is used in an Anchor:     
```cs
TileObjectData.newTile.Width = 3; // This must be above the code assigning AnchorBottom
TileObjectData.newTile.AnchorBottom = new AnchorData(AnchorType.SolidTile, TileObjectData.newTile.Width, 0);
```

Here is an example of a custom `AnchorBottom`. The 2nd variable in the `AnchorData` constructor is the width and the 3rd is the start of the tiles that require the anchor. If the 1st or 2nd block under this is broken, the tile will break as well, but if the 3rd block is broken it will not break. The 1st Variable is a BitMask describing the types or tiles valid for the anchor.
```cs
TileObjectData.newTile.AnchorBottom = new AnchorData(AnchorType.SolidTile, TileObjectData.newTile.Width - 1, 0);
```    
![AnchorBottom 2 of 3](https://github.com/tModLoader/tModLoader/assets/4522492/1001a752-3f23-445d-937d-58872e58e9dd)    

Here is an example of an `AnchorTop` that requires the tile above to be empty. Place a tile above Coral and you'll see the coral break because of this code:    
```cs
TileObjectData.newTile.AnchorTop = new AnchorData(AnchorType.EmptyTile, TileObjectData.newTile.Width, 0);
```

By default, all anchors are empty, but if you used `CopyFrom` to copy from an existing tile, you might want to clear out an anchor that you inherited. To clear out an anchor set the anchor to `AnchorData.Empty`:
```cs
TileObjectData.newTile.AnchorBottom = AnchorData.Empty;
```

### Multiple AnchorType
The 1st parameter of the `AnchorData` constructor can be provided with multiple `AnchorType`s by combining them using the logical `OR` operator (`|`). When multiple `AnchorType`s are combined, the tile's anchor will be satisfied by anchored tiles matching ANY of the provided `AnchorType`.

For example, [ExampleWideBannerTile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleWideBannerTile.cs) uses `TileObjectData.newTile.AnchorTop = new AnchorData(AnchorType.SolidTile | AnchorType.SolidSide | AnchorType.SolidBottom | AnchorType.PlanterBox, TileObjectData.newTile.Width, 0);`. This allows the tile to anchor to solid tiles, terrain tiles that are not sloped on the face being anchored to, tiles with a solid bottom, and planter boxes. `ExampleWideBannerTile` also uses [alternate placements](#newalternate---alternate-placement-styles) to define another placement that only anchors to `AnchorType.PlatformNonHammered`. It uses this approach to provide a custom `DrawYOffset` value to the placement specifically below platforms.

## Direction
The direction this tile will be eligible to be placed in. By default this is set to `None` meaning the tile can be placed when the player is facing either direction. When used with alternate placements, a tile can be given separate sprites when the player is facing left and placing the tile or facing right and placing the tile. This is how chairs and bed tiles typically work. By convention, the normal placement is usually left and the alternate is right.   

```cs
TileObjectData.newTile.CopyFrom(TileObjectData.Style1x2);
TileObjectData.newTile.Direction = TileObjectDirection.PlaceLeft;
TileObjectData.newAlternate.CopyFrom(TileObjectData.newTile);
TileObjectData.newAlternate.Direction = TileObjectDirection.PlaceRight;
TileObjectData.addAlternate(1); // Facing right will use the second texture style
TileObjectData.addTile(Type);
```

![ExampleChair](https://github.com/tModLoader/tModLoader/assets/4522492/66cd9905-d4e9-4f4b-9d2f-ffbab99dbf3e)    

https://github.com/tModLoader/tModLoader/assets/4522492/fb2c9892-6e4f-4426-a1df-40379dd1dbf6

## StyleHorizontal
By default, tile styles are oriented vertically on the spritesheet:     
![](https://i.imgur.com/nx4asBg.png)     

It may be more convenient to place them horizontally. In fact, most of the `TileObjectData` templates are oriented horizontally. To do this:    
`TileObjectData.newTile.StyleHorizontal = true;`     
![](https://i.imgur.com/MzfnM3l.png)    
 
## StyleWrapLimit
If you are making a lot of styles, you should consider using `StyleWrapLimit` to keep your spritesheet files neatly laid out. This can make it easier to work with than a really long or tall image. `StyleWrapLimit` makes the image wrap around to the next row/column (depending on `StyleHorizontal`) to continue placing styles. In the Banner tile sprite (Tiles_91.xnb), `TileObjectData.newTile.StyleWrapLimit = 111;` means that styles 0 to 110 are on the first line, styles 111 to 221 are on the next, and so on. If you don't have additional lines of styles, you do not need to set this to anything. Note that this value is counted in placement styles, which is not necessarily tile styles if alternates or random styles are being used.    
![](https://i.imgur.com/pdI4S2N.png)    

## StyleMultiplier
Used to give room for alternate placements and random styles in the spritesheet. This room is added along the style layout direction, meaning horizontally if `StyleHorizontal` is true. This should be set to the product of the alternate placement styles and `RandomStyleRange` to ensure that each alternate placement and random style placement are all considered the same tile style.    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/85fe2692-6171-4bca-b217-14b99ebb1b96)    

Some tiles use `StyleMultiplier` and `StyleWrapLimit` together to place each style on its own line with only its alternate placements. For example, torches set both `StyleMultiplier` and `StyleWrapLimit` to 6 while setting `StyleHorizontal` to true. The end result is each tile style is on a new row rather than on the same row as placement styles from other tile styles:

![image](https://github.com/tModLoader/tModLoader/assets/4522492/3b925c97-3fd5-4c8c-887a-3c80a7b3223a)

## StyleLineSkip
Similar to `StyleMultiplier`, but adds room between lines of styles instead of in-line with styles. If `StyleHorizontal` is true, this means that additional rows will be added between rows of styles after the `StyleWrapLimit` is reached. This extra space can be used for tile states, such as "on" or "off" states and growth states. It can also be used for tile animation. This should be set even if `StyleWrapLimit` is not used to correctly calculate tile drops.

## RandomStyleRange
Allows this tile to place a randomly selected placement style when placing. For example, the Coral  tile uses a `RandomStyleRange` value of 6, allowing 6 different tile placement styles to be selected when placing. Use with `StyleMultiplier` to ensure all placed tiles are interpreted as the same style to allow tile drops to work as expected.      
`TileObjectData.newTile.RandomStyleRange = 6;`        
![](https://i.imgur.com/y23Gc7T.png)    

## UsesCustomCanPlace
Should always be `true`. If you copied a template it will already be `true`, but be sure you set it if you aren't copying from a template.

## Wires, Toggles, Changing Frame, Changing States
Sometimes we use extra frames in the spritesheet to allow our tile to toggle between off and on. The placement of extra sprites depends on `StyleLineSkip` and `StyleHorizontal`. These extra "states" for our tiles should still be the same tile style if set up correctly. See [ExampleLamp.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleLamp.cs) to see how `HitWire` changes the `TileFrameX` to change which sprite is drawn.    
![](https://i.imgur.com/Xq13Slr.png)  

## DrawFlipHorizontal and DrawFlipVertical   
If true, the tile placement preview will draw this tile flipped horizontally (or vertically) at even X (or Y) tile coordinates. This effect must be replicated in `ModTile.SetSpriteEffects` to work for the placed tile. See [ExampleLamp](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleLamp.cs#L66) for an example.   

```cs
public override void SetSpriteEffects(int i, int j, ref SpriteEffects spriteEffects) {
	if (i % 2 == 0) {
		spriteEffects = SpriteEffects.FlipHorizontally;
	}
}
```

https://github.com/tModLoader/tModLoader/assets/4522492/7d57d23a-68ab-46f6-a53a-5d371b9e626e

## Other
There are many more not yet explained in this guide. Many of these are explained in the actual [documentation](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#documentation) or in [ExampleMod examples](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Tiles). Decompile Terraria and look in `TileObjectData.Initialize` to figure out how they are used:     
```cs
AnchorWall
AnchorValidTiles
AnchorInvalidTiles
AnchorAlternateTiles
AnchorValidWalls
WaterDeath
LavaDeath
WaterPlacement
LavaPlacement
HookCheck
HookPostPlaceEveryone
HookPostPlaceMyPlayer
HookPlaceOverride
FlattenAnchors
CoordinatePaddingFix
DrawStepDown
```

## addTile(Type);
Be sure to call this or your mod won't load properly. This should be the last line of code dealing with `TileObjectData` in `SetStaticDefaults`.          
`TileObjectData.addTile(Type);`    

## newAlternate - Alternate placement styles
Some tiles have alternate placement styles. Beds and Chairs for example have alternate placement styles for facing left or facing right. Torches have alternate placement styles for anchoring to tiles below, to the left, to the right, or anchoring to walls. Additionally, sometimes additional placement options are added to a tile to allow placing the tile using multiple origins, such as how closed doors can be placed by clicking anywhere in the doorframe. These alternate placements are registered using `TileObjectData.newAlternate`. We can modify `TileObjectData.newAlternate` to assign different properties to each alternate placement. 

The basic pattern for `newAlternate` is to `CopyFrom` the current `TileObjectData.newTile`, make style specific changes to `TileObjectData.newAlternate`, then call `TileObjectData.addAlternate(placementStyleHere);` to finish it up. This should be done before any `TileObjectData.newSubTile` changes and before `TileObjectData.addTile(Type);`. This should be done after doing `TileObjectData.newTile` changes. When using alternate placements, be sure to also set [`StyleMultiplier`](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile#stylemultiplier) to ensure alternate placements of a tile style are still interpreted as the same tile style.

See the [Direction section](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile#direction) for an example of left and right placements.     
See [ExampleTorch.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleTorch.cs) and [ExampleSign.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleSign.cs) for examples of alternate placements using different anchors.     
See [ExampleDoorClosed.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleDoorClosed.cs) for an example of using `TileObjectData.addAlternate` to register multiple placement origins of the same placement style.     

## newSubTile - Tile styles
Tiles with multiple tile styles sometimes benefit from custom behavior for specific tile styles. This is done through `TileObjectData.newSubTile`.

### Conditional Behavior
You may have noticed that things like `Main.tileWaterDeath` are indexed by the tile type. You may have also remembered that both Cursed Torch and Ichor Torch work underwater and are not destroyed when touched by water. If you look in the code, you'll see that Cursed Torch and Ichor Torch are the same tile type as all the other torches. How is this possible? This is possible through `TileObjectData.newSubTile`. We can modify `TileObjectData.newSubTile` to allows different properties to be applied to different "tile styles" of the same tile type. More advanced usages of `newSubTile` can be learned by studying the source.

The basic pattern for `newSubTile` is to `CopyFrom` the current `TileObjectData.newTile`, make style specific changes to `TileObjectData.newSubTile`, then call `TileObjectData.addSubTile(styleNumberHere);` to finish it up. If alternate placements are being used `TileObjectData.newSubTile.LinkedAlternates = true;` needs to also be used. This should be done before `TileObjectData.addTile(Type);` and after doing `TileObjectData.newTile` and `TileObjectData.newAlternate` changes.

This examples shows the basic pattern and shows customizing tile style 1 to be placeable in lava and water. This example can be seen in full in [ExampleTorch](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleTorch.cs).    

```cs
// previous code TileObjectData.newTile and TileObjectData.newAlternate code above

TileObjectData.newSubTile.CopyFrom(TileObjectData.newTile);
TileObjectData.newSubTile.LinkedAlternates = true;
TileObjectData.newSubTile.WaterDeath = false;
TileObjectData.newSubTile.LavaDeath = false;
TileObjectData.newSubTile.WaterPlacement = LiquidPlacement.Allowed;
TileObjectData.newSubTile.LavaPlacement = LiquidPlacement.Allowed;
TileObjectData.addSubTile(1);

// Other TileObjectData.newSubTile and TileObjectData.addTile(Type); code below
```

# Retrieving tile style from `Tile`
We can retrieve the tile style of a placed `Tile` using the `TileObjectData.GetTileStyle(Tile)` method. This is mostly used to facilitate tile style specific behaviors in various `ModTile` methods. For example, in [`ExampleTorch.cs`](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleTorch.cs) the `TileObjectData.GetTileStyle` method is used in `ModifyLight` to customize the light emitted by the `ExampleTorch` and `ExampleWaterTorch` styles:

```cs
// In ModifyLight
int style = TileObjectData.GetTileStyle(Main.tile[i, j]);
if (style == 0) {
	r = 0.9f;
	g = 0.9f;
	b = 0.9f;
}
else if (style == 1) {
	r = 0.5f;
	g = 1.5f;
	b = 0.5f;
}
```

We also use it to set an appropriate cursor icon when the tile is hovered over. This code uses the `TileLoader.GetItemDropFromTypeAndStyle` method to retrieve the item type of the corresponding tile type and style:

```cs
// In MouseOver
int style = TileObjectData.GetTileStyle(Main.tile[i, j]);
player.cursorItemIconID = TileLoader.GetItemDropFromTypeAndStyle(Type, style);
```

# Animation
Do not change `TileFrameX` or `TileFrameY` of the tile for animation. The tile and its values should stay the same as it is animating. [ExampleAnimatedGlowmaskTile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleAnimatedGlowmaskTile.cs) shows changing state and animating a tile. [ExampleAnimatedTile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleAnimatedTile.cs) shows more animated tile options. [ExampleLivingFireTile.png](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleLivingFireTile.png) shows an animated Terrain tile.

# Full Examples
## Framed Tile
* [ExampleBlock.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleBlock.cs) - Typical terrain block

## FrameImportant Tile
* [ExampleTable.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleTable.cs) - Typical furniture tile
* [TileObjectDataShowcase.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/TileObjectDataShowcase.cs) - Showcases many advanced `TileObjectData` options. Serves as an example of how alternate placements, tile styles, animation, tile states, and random styles all fit together.

## Relevant References
* [Vanilla TileIDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#tile-ids)
* [ModTile Documentation](https://docs.tmodloader.net/docs/stable/class_mod_tile.html)
* [ModBlockType Documentation](https://docs.tmodloader.net/docs/stable/class_mod_block_type.html) - Contains other methods and properties that both `ModTile` and `ModWall` inherit.
* [TileObjectData Documentation](https://docs.tmodloader.net/docs/stable/class_tile_object_data.html) - Contains additional documentation for various `TileObjectData` fields.