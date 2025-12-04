# What is a Wall?
Walls are fairly straightforward and creating a `ModWall` is mostly an exercise in following the existing patterns. Like tiles, walls are comprised of 2 parts, the `ModItem` that places the wall, and the `ModWall` itself.

## Wall-Item Pairing
An `Item` will place a specific `Wall` when `Item.createWall` is set to the `WallType` of the `ModWall`. The `ModWall` will typically return the `ModItem` as well. This process is automatic for walls that are placed by the same item they return, otherwise use `RegisterItemDrop(ModContent.ItemType<ItemName>());` in `ModWall.SetStaticDefaults` to manually specify the item drop.

# Basic Example
`ExampleWall` in ExampleMod is a basic example. It has 4 files:
* [ExampleMod/Content/Walls/ExampleWall.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Walls/ExampleWall.cs) is the actual `ModWall` class
* [ExampleMod/Content/Walls/ExampleWall.png](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Walls/ExampleWall.png) is the texture for the `ModWall`
* [ExampleMod/Content/Items/Placeable/ExampleWall.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Placeable/ExampleWall.cs) is the corresponding `ModItem` class that places the `ExampleWall` `ModWall`.
  * Note: The code `Item.DefaultToPlacableWall(ModContent.WallType<Walls.ExampleWall>());` in `ModWall.SetStaticDefaults` automatically sets `Item.createWall` and all other properties common to wall items.
* [ExampleMod/Content/Items/Placeable/ExampleWall.png](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Placeable/ExampleWall.png) is the texture for the `ExampleWall` `ModItem`.

`ExampleWallUnsafe` in ExampleMod is also a basic example, but only has 2 files, the `ModWall` class and corresponding texture. `ExampleWallUnsafe` doesn't have an item that places it, so `RegisterItemDrop` is used to register the item drop.

# Advanced Example
See [ExampleMod/Content/Walls/ExampleWallAdvanced.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Walls/ExampleWallAdvanced.cs) for an advanced example showcasing animation, custom framing, and lighting.

# Texture
The texture for a wall has several sections for drawing the wall in different positions depending on which neighbors are the same wall type. Notice how for each orientation, there are 3 options. The sections are referred to as "style" and the options are referred to as "WallFrameNumber". `ExampleWall` is based off of `Gemspark` walls since it is simple to comprehend. Consult other [existing wall textures](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Prerequisites#vanilla-texture-file-reference) for more detailed examples.    
![](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Walls/ExampleWall.png)

If `Main.wallLargeFrames` is used, a 4th `WallFrameNumber` is added to the mix for each `style` to add even more variety. That template is shown here:    
![Wall_179](https://user-images.githubusercontent.com/4522492/191140372-60a897bf-f69c-4615-bab5-57cefc84066c.png)

This template shows how `Main.wallLargeFrames` values of 1 ("Phlebas") and 2 ("Lazure") produce a deterministic pattern rather than a random pattern.    
![image](https://user-images.githubusercontent.com/4522492/193192050-91e6502d-8f39-4c28-8221-297562ca0f51.png)

## Animated
If the wall is animated, the pattern is repeated. This is only supported for non-`Main.wallLargeFrames` walls.
![Wall_225](https://user-images.githubusercontent.com/4522492/191140761-06536d43-3b87-4ffc-b036-d3b9cf1739f0.png)

# Wall Properties
In `ModWall.SetStaticDefaults`, various data can be assigned to affect the behavior of the wall.
### Main.wallHouse
If true, the wall is considered a safe wall, used for various things.
### Main.wallDungeon 
If true, the wall is considered a dungeon wall.
### Main.wallLight 
If true, light flows in from the background, such as fences and glass.
### Main.wallLargeFrames 
If 1, the "Phlebas" pattern is used (Plating-type walls). If 2, the "Lazure" pattern is used. These both use the 4th `WallFrameNumber` option.
### Main.wallBlend
Assign to a known `WallID` to blend with similar walls. For example, in an unsafe variant of a wall you would write `Main.wallBlend[Type] = ModContent.WallType<MyWallSafe>();`. You should not do the reverse on the safe variant, only on one of the walls.

# Animated
As seen above, the texture for animated walls has several copies of the template. The wall will animate in accordance with the timing and pattern provided in the `ModWall.AnimateWall` hook.

## Example
This example loops 7 frames of animation, switching frames every 10 frames. A cycling or more advanced pattern can be made with some effort. 
```cs
public override void AnimateWall(ref byte frame, ref byte frameCounter) {
	frameCounter++;
	if (frameCounter >= 10) {
		frameCounter = 0;
		frame++;
		if (frame >= 7)
			frame = 0;
	}
	// Or, more succinctly:
	if (++frameCounter >= 10) {
		frameCounter = 0;
		frame = (byte)(++frame % 7);
	}
}
```

# Safe vs Unsafe
Many Terraria walls have safe and unsafe variants. The safe wall variant is the wall placed by the item the player receives when mining the unsafe wall. The unsafe wall is placed during world generation and usually can't be placed by the player. The unsafe wall is used in NPC Spawning calculations. This separation lets players mine walls and use them for decoration without risking enabling various enemies from specifically spawning in their creations. As a mod developer, this pattern is good to follow if NPC spawning logic takes wall types into account.

# Custom Framing
With `ModTile.WallFrame`, a modder can implement whatever framing logic they desire. This example from [ExampleWallAdvanced](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Walls/ExampleWallAdvanced.cs#L48) shows weighting the 1st option more than the other 2 options:    
![image](https://user-images.githubusercontent.com/4522492/191853500-0208243b-68cd-4302-8984-79d5c2f81468.png)

```cs
public override bool WallFrame(int i, int j, bool randomizeFrame, ref int style, ref int frameNumber) {
	if (randomizeFrame) {
		// Here we make the chance of WallFrameNumber 0 very rare, just for visual variety: https://i.imgur.com/9Irak3p.png
		if (frameNumber == 0 && WorldGen.genRand.NextBool(3, 4)) {
			frameNumber = WorldGen.genRand.Next(1, 3);
		}
	}
	return base.WallFrame(i, j, randomizeFrame, ref style, ref frameNumber);
}
```
Here is the comparison between this example and WallID.Cog, which has a similar texture, note how rare the WallFrameNumber 0 is:    
![]( https://i.imgur.com/9Irak3p.png)

## Don't use for Game Logic
Make sure not to use wall framing for game logic, only visuals. Wall framing is not synced and each player sees their own pattern of wall framing.

# Relevant References
* [Vanilla WallIDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#wall-ids)
* [ModWall Documentation](https://docs.tmodloader.net/docs/stable/class_mod_wall.html)
* [ModBlockType Documentation](https://docs.tmodloader.net/docs/stable/class_mod_block_type.html) - Contains other methods and properties that both `ModTile` and `ModWall` inherit.
