# Coordinates
Many modders get confused when working with Tiles, Projectiles, or Drawing code because they don't understand the various Coordinates in Terraria. This guide will teach you.

## Common
Common to all coordinates is the fact that the X axis goes up from left to right and the Y axis goes up from top to bottom. **Down is positive Y, up is negative Y**. All coordinates start in the top left of what they represent.

## World Coordinates
Players, NPC, Projectiles, and Dust all reside in world coordinates. World coordinates are typically represented as a `Vector2`, meaning that the `X` and `Y` components of world coordinates are float values, meaning non-whole number values like 3943.23 and 2334.213 are valid values. If you are using 100% screen zoom, each pixel on your monitor is equal to 1 unit of world space. The world coordinate of 0, 0 resides on on the very top left corner of the world. 

## Tile Coordinates
Tiles are in tile coordinates. Tile coordinates are only used in Tile related methods and the `Main.tile` array. Tile coordinates are typically represented as a `Point` or `Point16`, meaning that `X` and `Y` components of tile coordinates must be whole numbers/ints.

## Screen Coordinates
Screen coordinates (actually window coordinates) are used for things like drawing on the screen and user interface elements. A common mistake with manually drawing entities is to draw them using the position of the entity. This doesn't work because the draw code only accepts screen space coordinates, not world space coordinates. Make sure to subtract Main.screenPosition from whatever you are trying to draw to draw it correctly.

### Drawing Tiles
Tiles are drawn not necessarily drawn to the screen all the time. If you are using `ModTile.SpecialDraw` or `PostDraw` or `PreDraw`, use `Vector2 zero = Main.drawToScreen ? Vector2.Zero : new Vector2(Main.offScreenRange);` in your code and add `zero` to all calls to `spriteBatch.Draw`. The reason for this is to accommodate the shift in drawing coordinates that occurs when using the different Lighting modes. Press `Shift+F9` to change lighting modes quickly to verify your code works for all lighting modes.

## Converting Coordinates
### Tile <--> World
Each tile is occupies a 16x16 area of world coordinate space. If you multiply a tile coordinate by 16, you end up with a world coordinate pointing to the top left corner of that tile. You can use `Vector2.ToWorldCoordinates` to simplify your code. `Point.ToWorldCoordinates` automatically adds 8 to both X and Y, returning world coordinates of the center of the tile.

```cs
// Finding the tile exactly behind the player.
Point tileLocation = Main.LocalPlayer.Center.ToTileCoordinates();
Tile tile = Main.tile[tileLocation.X, tileLocation.Y];
Tile theSameTile = Main.tile[tileLocation]; // Point and Point16 can be used to index directly into Main.tile

// Spawning dust in World coordinates from the tiles Tile coordinates
Point16 position = new Point16(i, j);
Dust.NewDustDirect(position.ToWorldCoordinates(), 4, 4, dustChoice, 0f, 0f, 100, default, 1f);
```

### World <--> Screen
When drawing tiles manually, you need to be aware of `Main.drawToScreen`, mentioned above.

## Relevant Fields
### Main.MouseWorld
World Coordinates of the current mouse position. Unfortunately this doesn't work with zoom.

### Main.MouseScreen
Screen Coordinates of the mouse. `Main.mouseX` and `Main.mouseY` are the same.

# Example
![](https://i.imgur.com/T6La54i.png)

Lets look at this picture to review. The white lines depict the Tile spaces, the red points show the world coordinate of the tile when converted to world coordinates. The bottom right tile is at tile coordinate `3548, 256`. Converting this to world coordinates by multiplying by 16 gets us `56768, 4096`. The snails position is displayed in the yellow box. The position of entities relates to the top left corner of the entity. Adding `0, 16` to the world position of the tile mentioned earlier, we arrive at `56768, 4112`, which is very close to the top snail position shown. (the snail is still a pixel to the right of that point)  I hope this has helped visualize this concept.

Some practical examples are:
```cs
// spawn 50 coordinates above the player center
Vector2 spawnPosition = player.Center + new Vector2(0, -50);

// Tile coordinates are used to index tiles in the world, here given an `i` and `j` representing X and Y
Tile tileLeft = Main.tile[i - 1, j];
```