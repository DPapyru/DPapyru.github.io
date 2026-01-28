# Basic Tile Entity
This guide serves to explain common things shared among all tile entities.  
This guide assumes that you know how to create files, create classes and know what it means for a class to "inherit from" another class.
The [BasicTileEntity.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/BasicTileEntity.cs) file in ExampleMod showcases a basic tile entity. It can be studied alongside this guide as a working example of the concepts taught. 

# What is a Tile Entity?
It's important to recognize that there's a distinction between Tiles and Tile Entities. Tiles are at fixed locations within a world and must be accessed via the `Main.tile` variable, they cannot contain additional data and can't run code during the game update. Tile entities are additional data usually attached to a `Tile` that have an `Update` method, they usually work in conjunction with a Tile to make a tile behave dynamically. Tile entities can run code every game update, while normal Tiles only have a chance to run code when `RandomUpdate` is called on it by the world update game loop.

Basically, if a Tile needs to have additional data or reliably run code, it needs to have a corresponding Tile Entity bound to it and work with it.

# Making a Tile Entity
There are three components for making a tile entity. The `ModItem` places a `ModTile`. That `ModTile` attaches a `ModTileEntity` to itself when placed. Together, these three classes are needed for a working Tile Entity. 

## Making the Item
First and foremost, you will need a `ModItem` that places a `ModTile`.  
The noteworthy line needed is the line in `ModItem.SetDefaults` which sets `Item.createTile`. See [ExampleMod's Placeable Items](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Items/Placeable).

## Making the Tile Entity
Setting up a `ModTileEntity` requires the usage of a few hooks within the `ModTileEntity` class.

### IsTileValidForEntity(int x, int y)
This hook runs during world loading and when placing the entity on the server. It is used to automatically kill the tile entity if the hook returns `false`, indicating it is in an invalid location.  Below is a standard usage of `IsTileValidForEntity(int x, int y)`:
```cs
public override bool IsTileValidForEntity(int x, int y)
{
    Tile tile = Main.tile[x, y];
    //The MyTile class is shown later
    return tile.HasTile && tile.TileType == ModContent.TileType<MyTile>();
}
```

### LoadData/SaveData/NetSend/NetReceive
While not technically required to create a working tile entity, tile entities almost always need to store and sync custom data since this is one of their main purposes. The basic concepts of [saving and loading data](https://github.com/tModLoader/tModLoader/wiki/Saving-and-loading-using-TagCompound) as well as [syncing data over the network](https://github.com/tModLoader/tModLoader/wiki/Basic-Netcode#modtileentity) are taught in other guides. Feel free to consult them if you are not yet familiar with the concepts. Usually anything worth saving and loading is also worth syncing. Failure to sync data properly will lead to clients not seeing the correct values when interacting with the tile entity.

The [BasicTileEntity](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/BasicTileEntity.cs#L58) example is a simple example showcasing storing and syncing an single `int` value.

Override these methods but leave them unchanged for now.

### Update
`Update` is where logic for the tile entity can be executed every frame. This is also not technically required, but you will end up using it once you add features to your `ModTileEntity`, so override it as well but leave it unchanged for now.

The other hooks present in `ModTileEntity` are optional and will not be covered in this guide.

## Making the Tile
After making a normal `frameImportant` multitile (see the [Basic ModTile Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile) for more information), you only have to add a few lines in order to make it automatically place the tile entity.

### SetDefaults() / SetStaticDefaults()
Before the `TileObjectData.addTile(Type);` line, add the following:
```cs
// MyTileEntity refers to the tile entity mentioned in the previous section
TileObjectData.newTile.HookPostPlaceMyPlayer = ModContent.GetInstance<MyTileEntity>().Generic_HookPostPlaceMyPlayer;

// This is required so the hook is actually called.
TileObjectData.newTile.UsesCustomCanPlace = true; // This will already be set if using CopyFrom to clone an existing TileObjectData template.
```

### KillMultiTile(int i, int j, int frameX, int frameY)
Add the following line to this hook:
```cs
// ModTileEntity.Kill() handles checking if the tile entity exists and destroying it if it does exist in the world for you
// The tile coordinate parameters already refer to the top-left corner of the multitile
ModContent.GetInstance<MyTileEntity>().Kill(i, j);
```

## Basic Template
Here is a minimum example for the needed `ModItem`, `ModTileEntity`, and `ModTile`.
```cs
public class MyItem : ModItem
{
	public override void SetDefaults() {
		Item.DefaultToPlaceableTile(ModContent.TileType<MyTile>());
	}

	public override void AddRecipes() {
		CreateRecipe().AddIngredient(ItemID.Wood).Register();
	}
}

public class MyTileEntity : ModTileEntity
{
	public override bool IsTileValidForEntity(int x, int y) {
		Tile tile = Main.tile[x, y];
		return tile.HasTile && tile.TileType == ModContent.TileType<MyTile>();
	}

	public override void SaveData(TagCompound tag) {
	}

	public override void LoadData(TagCompound tag) {
	}

	public override void NetSend(BinaryWriter writer) {
	}

	public override void NetReceive(BinaryReader reader) {
	}

	public override void Update() {
	}
}

public class MyTile : ModTile
{
	public override void SetStaticDefaults() {
		Main.tileFrameImportant[Type] = true;

		TileObjectData.newTile.CopyFrom(TileObjectData.Style2x2);
		TileObjectData.newTile.CoordinateHeights = [16, 18];
		TileObjectData.newTile.StyleHorizontal = true;

		// This is the important line!
		TileObjectData.newTile.HookPostPlaceMyPlayer = ModContent.GetInstance<MyTileEntity>().Generic_HookPostPlaceMyPlayer; 

		TileObjectData.addTile(Type);
	}

	public override void KillMultiTile(int i, int j, int frameX, int frameY) {
		ModContent.GetInstance<MyTileEntity>().Kill(i, j);
	}
}
```

# Other
## Access the ModTileEntity from ModTile
The player will interreact with the `ModTileEntity` by interacting with the `ModTile`. The `TileEntity.TryGet` will retrieve the `ModTileEntity` that exists at the provided coordinates. You'll want to use `TileEntity.TryGet` within methods such as `ModTile.RightClick`, `ModTile.SetDrawPositions`, `ModTile.MouseOver`, and more where appropriate.

By accessing the tile entity instance, you can then open a UI, spawn items, display a message, display a tooltip, customize the tile visuals, and much more. The [BasicTileEntityTile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/BasicTileEntity.cs#L96) methods show several examples of using `TileEntity.TryGet` correctly.

Here is a basic example, note how `TryGet` is used within an `if` statement. There are rare situations where the `ModTileEntity` might not exist, so be sure to write defensive code like this to account for this situation:

```cs
// This hook goes in your ModTile
public override bool RightClick(int i, int j)
{
	if (TileEntity.TryGet(i, j, out MyTileEntity entity))
	{
		// Do things to your entity here
	}
}
```

## Visualize Tile Entities
Tile entities are invisible, they usually only have a visual effect if the `ModTile` they belong to use them for custom visuals. This can make it difficult while modding to verify the presence of a `ModTilentity`.

Modders can add `Dust.QuickDust(Position.X, Position.Y, Color.Red);` to `ModTileEntity.Update` for a quick way to verify that that the `ModTileEntity` exists:

![dotnet_2025-05-19_14-37-07](https://github.com/user-attachments/assets/2f883cef-f818-493f-a549-a6e7eb122eb5)    

Another option is a mod like [Modders Toolkit](https://steamcommunity.com/sharedfiles/filedetails/?id=2573569299), it provides a toggle for visualizing all tile entity locations:

![image](https://github.com/user-attachments/assets/9e3012a0-b9d9-4f84-835d-d8e87fde42f3)    



# Examples
- [BasicTileEntity.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/BasicTileEntity.cs) is the primary example of a tile entity. It showcases the vast majority of desired functionality while being simple enough to read and understand.
- [SimplePylonTileEntity](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/SimplePylonTileEntity.cs) and [AdvancedPylonTileEntity](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/AdvancedPylonTileEntity.cs) are `TEModdedPylon` classes. The `TEModdedPylon` class inherits from `ModTileEntity` itself and implements the required logic by itself. While not useful as learning examples for the `ModTileEntity` hooks, it is important to realize that pylons are tile entities.
