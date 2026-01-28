***

**Note:** This page is out of date and only relevant for 1.3 tModLoader. Modders using 1.4+ should rely on the documentation instead.


***


# Tile Class Documentation
This page lists methods and fields pertaining to the Tile class. If you are working directly with `Tile`s, you can consult this page for an understanding of various things. If you want to create a Tile in your mod, this is not relevant, see [Basic Tile Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile) for that. See also [Main.tile[]](https://github.com/tModLoader/tModLoader/wiki/Main-Class-Documentation#tile). It is good to remember that `Main.tile[]` can have null values in it, null values are empty/air tiles. Non-null values could also be empty/air tiles as well.

Index|
-----|
[Fields](#fields-and-properties)|
[Methods](#methods)|
[Bitfield Data](#bitfield-data)|

# Fields and Properties
The `Tile` class is structured to be very compact and efficient. You usually don't want to modify many of these fields directly. All values default to 0.

| Field    | Type | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|----------|------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [type](#type)<a name="type"></a>| ushort | Corresponds to the TileID of this tile. Since the dirt tile has the value of 0, you need to check other values to know if this tile has a tile or not. `Tile.active()` can be used to check if the `Tile` is air or not. |
| [wall](#wall)<a name="wall"></a>| ushort | Corresponds to the WallID of this tile. A value of 0 means no wall. |
| [liquid](#liquid)<a name="liquid"></a>| byte | Represents how much liquid is in the tile. Ranges from 0, no liquid, to 255, filled with liquid. |
| [sTileHeader](#sTileHeader)<a name="sTileHeader"></a>| ushort | A bit field. Don't touch this directly, use the methods. Stores: Wires, Actuator, Slope, Color, and HalfBrick data. |
| [bTileHeader](#bTileHeader)<a name="bTileHeader"></a>| byte | A bit field. Don't touch this directly, use the methods. Stores: LiquidType, WallColor, and Wire4 data. |
| [bTileHeader2](#bTileHeader2)<a name="bTileHeader2"></a>| byte | A bit field. Don't touch this directly, use the methods. Stores: FrameNumber, wallFrameX, and WallFrameNumber data. |
| [bTileHeader3](#bTileHeader3)<a name="bTileHeader3"></a>| byte | A bit field. Don't touch this directly, use the methods. Stores: SkipLiquid, CheckLiquid, and wallFrameY data. |
| [frameX](#frameX)<a name="frameX"></a><br>[frameY](#frameY)<a name="frameY"></a>| short | Corresponds to the coordinates of the 16x16 (usually) area in the spritesheet this Tile uses. For a Framed tile, this value is set automatically as the world loads or other tiles are placed or mined nearby. See [Framed vs FrameImportant](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile#framed-vs-frameimportant-tiles) for more info. For FrameImportant tiles, this value will not change and will be saved and synced in Multiplayer. In either case, `frameX` and `frameY` correspond to the coordinates of the top left corner of the area in the spritesheet that this Tile should draw. Some Tiles such as Christmas Tree and Weapon Rack use the higher bits of these fields to do tile-specific behaviors. Modders should not attempt to do similar approaches, but should use `ModTileEntity`s |
| [collisionType](#collisionType)<a name="collisionType"></a>| int | Get only property. Unused. |
| [](#)<a name=""></a>| | |

# Methods
## public Tile()
Constructor, all values default to 0.

## public Tile(Tile copy)
Constructor that clones another Tile

## public object Clone()
Creates a clone of the Tile. `Tile clone = (Tile)Main.tile[x,y].Clone()`

## public void CopyFrom(Tile from)
Copies fields from another Tile.

## public void ClearEverything()
Clears all fields.

## public bool active()
## public void active(bool active)
Sets or checks if the Tile has a tile present or not. 

## public bool nactive()
Returns true is Tile is active but not actuated. Equivalent to `tile.active() && !tile.inActive()`.

## public bool inActive()
## public void inActive(bool inActive)
Sets or checks if the tile is actuated.

## public void liquidType(int liquidType)
## public byte liquidType()
Sets or checks liquid type. 0 water, 1 lava, 2 honey. 

## public bool lava()
## public void lava(bool lava)
## public bool honey()
## public void honey(bool honey)
Sets or checks liquid type.

## public bool wire()
## public void wire(bool wire)
## public bool wire2()
## public void wire2(bool wire2)
## public bool wire3()
## public void wire3(bool wire3)
## public bool wire4()
## public void wire4(bool wire4)
Sets or checks presence of individual wires.

## public bool actuator()
## public void actuator(bool actuator)
Sets or checks presence of actuator on tile.

## public byte color()
## public void color(byte color)
Sets or checks tile color.

## public byte wallColor()
## public void wallColor(byte wallColor)
Sets or checks wall color.

## public byte frameNumber()
## public void frameNumber(byte frameNumber)
Framed tiles usually have 3 choices (alternate images), this sets or checks that value.

## public int wallFrameX()
## public void wallFrameX(int wallFrameX)
## public byte wallFrameNumber()
## public void wallFrameNumber(byte wallFrameNumber)
## public int wallFrameY()
## public void wallFrameY(int wallFrameY)
Various wall framing related methods. 

## public bool checkingLiquid()
## public void checkingLiquid(bool checkingLiquid)
## public bool skipLiquid()
## public void skipLiquid(bool skipLiquid)
Various Liquid movement related methods.

## public bool topSlope()
## public bool bottomSlope()
## public bool leftSlope()
## public bool rightSlope()
## public bool HasSameSlope(Tile tile)
## public bool halfBrick()
## public void halfBrick(bool halfBrick)
## public byte slope()
## public void slope(byte slope)
## public static void SmoothSlope(int x, int y, bool applyToNeighbors = true)
Various slope related methods.

## public override string ToString()
Prints debug info about a Tile.

## public void ClearTile()
## public bool isTheSameAs(Tile compTile)
## public int blockType()
## public void ResetToType(ushort type)
## internal void ClearMetadata()
## public Color actColor(Color oldColor)
Various methods.

# Bitfield Data
In order to store its data efficiently, each `Tile` uses several "header" fields as **bitfields**.

A **bitfield** is a variable used for a sequence of bits instead of an actual value.  Accessing and modifying the bits is usually done through the bitwise operators:  `|` (bitwise-OR), `&` (bitwise-AND), `^` (bitwise-XOR), `~` (bitwise-NOT), `<<` (shift left logical) and `>>` (shift right logical).

An example of uses for each operator is shown below:

| Operator  | Value 1 | Value 2 | Expression |   Expression (binary)    | Result | Result (binary)
|-----------|---------|---------|------------|--------------------------|--------|----------------
|    `\|`   |   35    |   68    | `35 \| 68` | `0010 0011 \| 0100 0100` |  103   | `0110 0111`
|    `&`    |   39    |   68    | `39 & 68`  | `0010 0111 & 0100 0100`  |   4    | `0000 0100`
|    `^`    |   47    |   68    | `47 ^ 68`  | `0010 1111 ^ 0100 0100`  |  107   | `0110 1011`
|    `~`    |   68    |   n/a   | `~ 68`     | `~ 0100 0100`            |  187   | `1011 1011`
|    `<<`   |   35    |   2     | `35 << 2`  | `0010 0011 << 0000 0010` |  210   | `1000 1100`
|    `>>`   |   35    |   2     | `35 >> 2`  | `0010 0011 >> 0000 0010` |   8    | `0000 1000`

| Operator | Explanation
|----------|------------
|   `\|`   | If the bit in Value 1 or the bit in Value 2 is set, the bit in the result is also set.
|   `&`    | The bit in the result is set only if the bit in Value 1 and Value 2 is set.
|   `^`    | The bit in the result is set only if the bit in Value 1 or Value 2 is set, but not both.
|   `~`    | Every 1 bit becomes a 0 bit and vice versa.
|   `<<`   | Every bit in Value 1 is shifted to the left Value 2 times.  Zeros are filled in from the right and any bits that overflow past the most significant bit (the first one) are removed.
|   `>>`   | Every bit in Value 1 is shifted to the right Value 2 times.  The most significant bit is filled in from the left and any bits that overflow past the least significant bit (the last one) are removed.

The `Tile` class has four bitfields:  `sTileHeader`, `bTileHeader`, `bTileHeader2` and `bTileHeader3`.  These bitfields should ***NOT*** be modified directly.  Instead, use the various methods in `Tile`.

For reference, here's what every bit in the bitfields represent and where they are normally accessed:

## sTileHeader
`-SSS UHGB RTAC CCCC`

`-`: Unused.

`SSS`: Where the slope type for this `Tile` is stored.  Accessed from `tile.slope()` and `tile.slope(byte)`.  0 is no slope, 1 is down-left slope, 2 is down-right slope, 3 is up-left slope and 4 is up-right slope.

`U`: If this `Tile` has an Actuator on it.  Accessed from `tile.actuator()` and `tile.actuator(bool)`.

`H`: If this `Tile` is a half-brick.  Accessed from `tile.halfBrick()` and `tile.halfBrick(bool)`.

`G`: If this `Tile` has a Green Wire on it.  Accessed from `tile.wire3()` and `tile.wire3(bool)`.

`B`: If this `Tile` has a Blue Wire on it.  Accessed from `tile.wire2()` and `tile.wire2(bool)`.

`R`: If this `Tile` has a Red Wire on it.  Accessed from `tile.wire()` and `tile.wire(bool)`.

`T`: If this `Tile` is actuated.  Accessed from `tile.inActive()` and `tile.inActive(bool)`.

`A`: If this `Tile` is active (not air).  Accessed from `tile.active()` and `tile.active(bool)`.

`C CCCC`: Where the paint color type for this `Tile` is stored.  Accessed from `tile.color()` and `tile.color(byte)`.  Value ranges from 0 to 30.

## bTileHeader
`YLLW WWWW`

`Y`: If this `Tile` has a Yellow Wire on it.  Accessed from `tile.wire4()` and `tile.wire4(bool)`.

`LL`: Where the liquid type for this `Tile` is stored.  Accessed from `tile.lava()`, `tile.lava(bool)`, `tile.honey()` and `tile.honey(bool)`.  0 is water, 1 is lava and 2 is honey.

`W WWWW`: Where the paint color type for this `Tile`'s wall is stored.  Accessed from `tile.wallColor()` and `tile.wallColor(byte)`.  Value ranges from 0 to 30.

## bTileHeader2
`WWNN XXXX`

`WW`: Related to wall framing.  Accessed from `tile.wallFrameNumber()` and `tile.wallFrameNumber(byte)`.  Values range from 0 to 3.

`NN`: The alternate frame number for this `Tile`.  Accessed from `tile.frameNumber()` and `tile.frameNumber(byte)`.  Values can range from 0 to 3, but vanilla only uses 0 to 2.

`XXXX`: Where the frameX for this `Tile`'s wall in its spritesheet is stored.  Accessed from `tile.wallFrameX()` and `tile.wallFrameX(byte)`.  The values range from 0 to 15.  `tile.wallFrameX()` returns this value * 36 when called, and `tile.wallFrameX(byte)` sets this value to the parameter / 36.

## bTileHeader3
`---S CYYY`

`---`: Unused.

`S`: A flag used for liquid updating.  Accessed from `tile.skipLiquid()` and `tile.skipLiquid(bool)`.

`C`: A flag used for liquid updating.  Accessed from `tile.checkingLiquid()` and `tile.checkingLiquid(bool)`.

`YYY`: Where the frameY for this `Tile`'s wall in its spritesheet is stored.  Accessed from `tile.wallFrameY()` and `tile.wallFrameY(byte)`.  Values range from 0 to 7.  These bits are handled in the same manner as the `XXXX` bits in `bTileHeader2`.