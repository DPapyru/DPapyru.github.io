This is a collection of vanilla methods that are useful when modding. This list is meant as a quick reference to the most commonly used methods, but with more advanced mods it is highly recommended to add Terraria as a reference to your IDE since this list isn't exhaustive.

## Item  
See [Item Class Documentation](https://github.com/tModLoader/tModLoader/wiki/Item-Class-Documentation#methods)

## Projectile  
See [Projectile Class Documentation](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#methods)

## Dust  
### public static int NewDust(Vector2 Position, int Width, int Height, int Type, float SpeedX = 0f, float SpeedY = 0f, int Alpha = 0, Color newColor = default(Color), float Scale = 1f)
Spawns a dust in the world. 

## Lighting  
### public static void AddLight(int i, int j, float R, float G, float B)
Adds light to the world at the tile coordinates provided. 

## Player  
### public void QuickSpawnItem(int item, int stack = 1)
Spawns an item right on a player, a simple alternative to Item.NewItem.
### public bool HasItem(int type)
Determines if the player has the specified item in their inventory. Example: `if(player.HasItem(ModContent.ItemType<SpectreGun>())){...}`
### public void AddBuff(int type, int time1, bool quiet = true)
Adds a buff to a player.
### public int FindBuffIndex(int type)
Returns -1 if the player doesn't have the buff, and an index (0 to 21) if the player does.

## NPC
### public static int NewNPC(int X, int Y, int Type, int Start = 0, float ai0 = 0f, float ai1 = 0f, float ai2 = 0f, float ai3 = 0f, int Target = 255)
Spawns an NPC in the world. Example: `NPC.NewNPC(i, j, ModContent.NPCType<PuritySpirit>());`
### public void AddBuff(int type, int time, bool quiet = false)
Adds a buff to an NPC. Example: `Main.npc[i].AddBuff(BuffID.Ichor, 60);`
### public int FindBuffIndex(int type)
Returns -1 if the NPC doesn't have the buff, and an index (0 to 4) if the NPC does. Example: `if (npc.FindBuffIndex(BuffID.Cursed) >= 0){...}`

## Main  
### public static void PlaySound(int type, int x = -1, int y = -1, int Style = 1)
Plays a sound. Type is the category and style is the sound within that category. x and y give the sound a position, but can be left as -1 for center.
### public static void NewText(string newText, byte R = 255, byte G = 255, byte B = 255, bool force = false)
Prints text messages to the console.

## WorldGen
### public static void TileRunner(int i, int j, double strength, int steps, int type, bool addTile = false, float speedX = 0f, float speedY = 0f, bool noYChange = false, bool overRide = true)
Useful for spawning ores during worldgen. This method has a lot of vanilla tile specific code, but should still work. i and j are coordinates, type is the tile to place. 

### public static void OreRunner(int i, int j, double strength, int steps, ushort type)
A safer version of TileRunner. Vanilla uses this method for the hardmode ores. Only tiles in the TileID.Sets.CanBeClearedDuringOreRunner or Main.tileMoss arrays will be replaced, keeping chests, trees, and special tiles safe from being overwritten. 