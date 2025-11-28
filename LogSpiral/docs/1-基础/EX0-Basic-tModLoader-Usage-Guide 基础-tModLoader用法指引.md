- **Learn the basics of using tModLoader for both players and modders**
- If you run into problems, see the [Usage FAQ](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ)  

# Installing tModLoader
[Read our install instructions](tModLoader-guide-for-players)

# Installing Mods
- Mods are files with the ".tmod" extension. The most common way to get mods is through the in-game Steam workshop menus. This will work for GOG users as well. From the main menu, click `Workshop` and then `Download Mods`. You can then search and find mods to download. Alternatively you can visit the [tModLoader Steam workshop](https://steamcommunity.com/app/1281930/workshop/) directly and subscribe to mods on that website.
    - It is highly recommended that you visit the website and/or read the description of mods you want to download. Many mods change game mechanics so familiarizing yourself with the changes will help avoid confusion.
- If you manually download a mod, you can place it in the [Mods](#mods) folder. Note that this mod will not auto-update and will appear as purple in the mods menu to remind you that it is manually installed. Manually installing mods is mostly useful for users helping to test a mod, normal users should always use the workshop approach. 

# Enabling Mods
Use the `Workshop->Manage Mods` menu to set the mods you wish to use, then click back to reload.

# Playing with non-tModLoader users
**tModloader will not connect to non-tModLoader Terraria servers.**
If you want to play together, you must either use Terraria, or your friends must install and launch tModLoader. Think of them as 2 completely separate games.

You can learn more about running a modded server [here](Starting-a-modded-server).

# World and Player Backups
Modding games is inherently prone to bugs, and bugs could cause your world or player to be unplayable. Because of this, tModLoader maintains multiple backups of your world and player files. The player backups are in `Terraria\TMLSAVEDIRECTORYHERE\Players\Backups` and the world backups are in `Terraria\SAVEFOLDERNAMEHERE\Worlds\Backups`. (Replace `SAVEFOLDERNAMEHERE` with the [save directory](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves) corresponding to your tModLoader version.) If you find that you can't load a world or player anymore, you can roll back to a previous save by restoring the files from one of these backups. You'll lose some progress since the last save, but it is better than losing everything.

## Restoring a Backup
In the backup folder, you'll find many zip files. The files are named with the date of the backup followed by the name of the player or world. These instructions will show the process for restoring a world backup, but the process is exactly the same for a player backup, except for folder and file names. For example, if your `Terraria\SAVEFOLDERNAMEHERE\Worlds\Backups` folder has the files `2021-02-21-CoolTown.zip` and `2021-02-19-CoolTown.zip`, then you have 2 backups of the world "CoolTown", one from February 21st, and one from February 19th. If the current "CoolTown" isn't loading in tModLoader, you can attempt to restore backups in reverse chronological order until it finally works. First, let's make a backup of the current world files that aren't working. You want to do this since the issue could be a broken mod you are using, and you'll want to be able to restore to the latest save if that is the case. Find `WorldName.twld` and `WorldName.wld`, copy and paste them to a safe location, something like `Terraria\SAVEFOLDERNAMEHERE\TempWorldBackup\` should be fine. Make sure you have "File Name Extensions" visible, so you are sure you are backup up the `.twld` and `.wld` files instead of the `.twld.bak` and `.wld.bak` files. If you can't find these files, you might have the world on the cloud, if so, move the world off the cloud first, then follow the steps.     
![](https://i.imgur.com/4m69DnM.png)    
Now that you have a backup of the latest save, open the newest .zip file for the world backup you wish to restore from the `Terraria\SAVEFOLDERNAMEHERE\Worlds\Backups` folder and copy the files to the clipboard. Navigate back to the Worlds folder and paste. Make sure to say "replace files in the destination" when asked.
![](https://i.imgur.com/kesLiid.png)    
![](https://i.imgur.com/8QSH6sF.png)    
Now, open tModLoader and attempt to load the World. If it succeeds, great, if it fails, try again with the 2nd most recent backup. You can use cheat mods like [Cheat Sheet](https://steamcommunity.com/sharedfiles/filedetails/?id=2563784437) or [HEROs Mod](https://steamcommunity.com/sharedfiles/filedetails/?id=2564645933) to restore lost items, if you wish. If you can't get backups to load, your issue is likely a broken mod. You can [read client.log](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#reading-clientlog) for hints as to which mod is erroring, or come to [the Discord chat](https://discord.gg/tmodloader) for help.

# Paths
Here are some useful default paths:

## Install
In Steam right click on `tModLoader` in the library, then hover over `Manage` and click on `Browse local files`. The folder that opens is the install folder.

<details><summary>Video instructions</summary><blockquote>

https://github.com/tModLoader/tModLoader/assets/4522492/0dac7f15-520e-434e-b180-5c584583ddf3

</blockquote></details>

If you use GOG, the game is installed wherever you installed it. The install instructions instruct the user to install tModLoader to a folder next to the Terraria install folder. The default locations are listed in the next sub-section. If you have a desktop or start menu shortcut, you can right click on it and select `Open file location` to open the install directory location directly.

### Default Install Locations
**Steam:**    
Windows Install: `C:\Program Files (x86)\Steam\steamapps\common\tModLoader`    
Linux Install: `~/.local/share/Steam/steamapps/common/tModLoader` or `~/.steam/steam/steamapps/common/tModLoader`    
Mac Install: `Library/Application Support/Steam/steamapps/common/tModLoader` 

**GOG:**    
**Note:** These locations are only suitable if the Terraria folder exists in the same location because tModLoader must be installed next to Terraria.    
Windows Install: `C:\Program Files (x86)\GOG Galaxy\Games\tModLoader` or `C:\GOG Games\tModLoader`    
Linux Install: `$HOME/GOG Games/tModloader`    
Mac Install: `/Applications/tModLoader`    

## Saves
Every major version of tModLoader uses it's own save folder. Replace `SAVEFOLDERNAMEHERE` in the next section with the one that matches the version you are currently on.
* `1.3` - `ModLoader`
* `1.4.3` - `tModLoader-1.4.3`
* `1.4.4` - `tModLoader`
* `1.4.4 Preview` - `tModLoader-preview`

Windows Saves: `%UserProfile%\Documents\My Games\Terraria\SAVEFOLDERNAMEHERE` (This is typically found in `C:\Documents\`)    
Linux Saves: `~/.local/share/Terraria/SAVEFOLDERNAMEHERE/` or `$XDG_DATA_HOME/Terraria/SAVEFOLDERNAMEHERE/`    
Mac Saves: `~/Library/Application support/Terraria/SAVEFOLDERNAMEHERE/`    

### Cloud
Steam keeps a local copy of cloud data on the computer. This is useful if you need to copy cloud players or worlds from Terraria or tModLoader to the local saves. tModLoader data will in the tModLoader sub-folder:    
Windows Cloud Saves: `C:\Program Files (x86)\Steam\userdata\[some number here]\105600\remote`  

Browser Cloud Access: [Steam Remote Storage](https://store.steampowered.com/account/remotestorage)

## Mods
Your manually installed mods are stored in a subfolder of the [Saves](#saves) folder called `/Mods`. Workshop mods are stored in `C:\Program Files (x86)\Steam\steamapps\workshop\content\1281930`, but you shouldn't touch the folder and instead unsubscribe in steam.

## Logs
The Logs are found in a subfolder of the [Install](#install) folder called `/tModLoader-Logs`. If you are sharing logs for support with game-breaking issues, please post all log files. Just `client.log` and/or `server.log` (if relevant) is sufficient if the issue happens in-game. 