***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload/26fd108fd8ec4948a8134ffa35c3ee6bb90a1e7c)
***

Autoload is a mechanism whereby tModLoader makes some assumptions about your mod in order to simplify the amount of work the modder has to do in their mod. In this Basic guide, we will focus on how Textures are autoloaded because that is the primary interest of beginner modders.

Items, Projectiles, and NPC all need a texture to work correctly. Any one of these without an associated texture will cause your mod to be unable to load. tModLoader can't magically know which texture file you want associated with which thing, but it can make an educated guess based on the pattern it knows.

This is the pattern:

Take the Mod Sources path: 
`C:\Documents\My Games\Terraria\tModLoader\ModSources`

Add the Namespace of the class, replacing '.' with '\\': 
`namespace ExampleMod.NPCs`
`C:\Documents\My Games\Terraria\tModLoader\ModSources\ExampleMod\NPCs`

Add the classname of the class, then append '.png':
`public class FlutterSlime : ModNPC`
`C:\Documents\My Games\Terraria\tModLoader\ModSources\ExampleMod\NPCs\FlutterSlime.png`

In more concise terms, look for the .png file with filename matching the classname of the thing in the folder designated by the namespace of the class.

Basically, just make sure the .cs file and .png file exist in the same directory and that the class in the .cs file matches the filename of the .png file. It is a good idea to also make sure the .cs file matches the classname and .png filename as well. Also, you must make sure that the folder path from the Mod Sources folder matches the namespace (with 
'.' becoming '\\' in the folder structure.)

A visual explanation:  
![](https://i.imgur.com/9z50wHh.png)

### Extra Textures

In addition to the normal texture that a piece of content might require, there are other textures that will be autoloaded for specific types of content. Listed here are the most common examples of this.

Accessory items with textures that draw on the player have `[AutoloadEquip(EquipType.Something)]` annotating the class. These items require a separate texture post-fixed with the equip type, such as `_Back` or `_Shield`, for example.

Town NPC and Boss NPC classes annotated with `[AutoloadHead]` and `[AutoloadBossHead]` will autoload textures post-fixed with `_Head` and `_Head_Boss` textures respectively. These are the textures drawn to the minimap. 

Tiles with `TileID.Sets.HasOutlines` set will autoload textures post-fixed with `_Highlight` containing the smart interact outline texture.

Mounts and minecarts will need a texture. Extra textures post-fixed with `_Back` (drawn behind the player), `_Front` (drawn in front the player), or [other options](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/ModLoader/MountTextureType.cs) will be autoloaded. At least one will be necessary for a functioning mount.

# Music
Music files need to be in a folder or subfolder of a folder named "Music" to be autoloaded as music. Modders can use `MusicLoader.AddMusic` for any music file that does not meet that condition.

# Background
Background texture files need to be in a folder or subfolder of a folder named "Backgrounds" to be autoloaded as background textures. Modders can use `BackgroundTextureLoader.AddBackgroundTexture` for any texture file that does not meet that condition.