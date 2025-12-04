___

**[I don't want to just play mods, I want to make them](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-developers)**

___

**[I don't want to just play mods, I want to contribute to tModLoader](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-contributors)**

___

## Steam Installation
To install [tModLoader](https://store.steampowered.com/app/1281930/tModLoader) on Steam, you need to own [Terraria](https://store.steampowered.com/app/105600/Terraria) on Steam.
Simply browse for [tModLoader](https://store.steampowered.com/app/1281930/tModLoader/) on Steam and install it.
The tModLoader installation will exist alongside the vanilla installation, allowing you to play both vanilla and modded without the hassle of reinstalling vanilla. 
Note that users using Family Share to install Terraria will need to follow the [Steam Family Share Installation](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-players#steam-family-share-installation) instructions below.

By default, the current stable version of tModLoader will be installed by Steam. Currently the stable version is based on Terraria v1.4.4 content.

### Beta Branches
tModLoader updates regularly. Most users will want to use the default release, but users can use the beta branches feature of Steam to switch to a legacy or preview version of tModLoader. Legacy versions of tModLoader are useful for playing a mod that hasn't been updated to the latest stable tModLoader. Preview versions of tModLoader are useful to test new features or to test new content added in a Terraria update that hasn't made it to stable yet.

> **Note:** If you are switching tModLoader versions to use a particular mod, be aware that other mods you enjoy might not be on the version you switch to, so you might not be able to use all the mods you want together. This is particularly true for preview versions of tModLoader.

Here are the available options:
* `default/None` - This is the stable version that we expect players to use. It is currently based on Terraria 1.4.4.9 content. Users in the middle of a 1.4.3 playthrough should switch back to to `1.4.3-legacy`.
* `1.3-legacy` - This is the latest 1.3 release. There are a few fondly remembered mods only available on 1.3 tModLoader.
* `1.4.3-legacy` - This is the latest 1.4.3 release. This is where many users currently playing the game should be, especially those waiting for mods to update to 1.4.4. 
* `preview-v2024.X` - This version contains upcoming changes. This is where we test new features. Users should be aware that playing through the game on a preview version is not recommended.

### To access 1.3 (Legacy tModLoader) and other Beta options
Follow the instructions below to switch to a different version of tModLoader in Steam. If you are a GOG user or otherwise need to manually install a specific version, use the [Manual Installation](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-players#manual-installation) instructions instead.

**Video Instructions:**

If these video instructions are unclear, read the **Written Instructions** below.     

https://github.com/tModLoader/tModLoader/assets/4522492/4ac8e231-c409-48e9-a3e0-9024b78f2af1

<details><summary>Written Instructions:</summary><blockquote>

 Go to Library: 

![image](https://user-images.githubusercontent.com/59670736/169886058-3eb1b43c-a113-468b-8213-ef0bcccc8e01.png)

 Find tModLoader:

![image](https://user-images.githubusercontent.com/59670736/169886128-43f95278-a2a4-4b13-bb7c-1b670c81b657.png)

 Right Click tModLoader:

![image](https://user-images.githubusercontent.com/59670736/169886174-dfe0612b-75d9-4469-8f13-be3649fd35fc.png)

 Click Properties to Open the Steam Game Control Panel

![image](https://user-images.githubusercontent.com/59670736/169886269-f3a0e854-bbe6-4c2f-ab4c-6980406fea51.png)

 Select Betas

![image](https://user-images.githubusercontent.com/59670736/169886307-e60be211-d331-443f-bcde-109f61c23323.png)

 In the dropdown, select whichever beta you want

![image](https://user-images.githubusercontent.com/59670736/169886370-5a340164-ccfe-4520-a3f5-515fd81671cf.png)

 Close the Prompt (no code required)

![image](https://user-images.githubusercontent.com/59670736/169886435-b9cd7a18-eeb9-46f8-a41f-3dc450be8702.png)

</blockquote></details>

### How to uninstall?
Simply right-click tModLoader -> Manage -> Uninstall.
Your vanilla install will be unharmed.

### Steam Family Share Installation
For some reason, if you don't own Terraria and are instead using a family shared Terraria, tModLoader won't launch and will take you to the Steam store. This is a limitation on Steam's end, however workarounds exist for both 1.4.X and 1.3 versions
Please note that these workarounds do not allow for Steam Multiplayer and thus you will need to use `IP connect` options for multiplayer


On the 1.4.X version, the workaround is to install tModLoader following the Manual Installation instructions and launch it using the `start-tModLoaderFamilyShare.bat/sh` included in the files. Alternatively, if you are able to get Steam to download the files in the Steam Client, that also works in theory, but has seen varying success among users.
You may also choose to setup this launch as a `non-steam game` in your library to enable steam overlay in game.

On the 1.3 version, a workaround is to install tModLoader through steam as normal and then copy the `steam_appid.txt` file from the Terraria install folder to the tModLoader install folder, replacing the existing file.

## Manual Installation
This installation is necessary for players who have purchased Terraria from GOG or who otherwise want to install a particular version of tModLoader. These steps should be repeated each time you want to update tModLoader.

Installing tModLoader is relatively easy.

1. Goto the **[releases](https://github.com/tModLoader/tModLoader/releases)** page and download the tModLoader release you want.
    1. `Default/None/1.4.4`: Visit **[latest](https://github.com/tModLoader/tModLoader/releases/latest)** and download `tModLoader.zip`
    2. `1.3`: Visit [v0.11.8.9](https://github.com/tModLoader/tModLoader/releases/tag/v0.11.8.9) and download the file corresponding to your operating system
    3. `1.4.3`: Visit the [releases page](https://github.com/tModLoader/tModLoader/releases) and find the latest entry that mentions 1.4.3. Expand the section labeled "Assets" and click to download the "tModLoader.zip" file.
    4. `1.4.4-preview`: The download for the preview version of tModLoader for can be found by visiting the [releases page](https://github.com/tModLoader/tModLoader/releases). Find the most recent entry that has "preview" in the name. Expand the section labeled "Assets" and click to download the "tModLoader.zip" file. You'll need to regularly manually install new versions of 1.4.4-preview if you want to keep up to date with changes. 
2. Unzip the **contents** of the zip you downloaded to a folder named `tModLoader` either next to or nested inside the Terraria install folder. 
On 1.4, if the folder contains a 'Build' folder, you will need to remove this intermediate folder and bring the contents up one level. (GOG usually installs to `C:\GOG Games`, and Steam to `C:\Program Files (x86)\Steam\steamapps\common\Terraria`. See [this video](https://github.com/tModLoader/tModLoader/assets/4522492/c49b8252-b48a-4cdd-b4cb-b032a22fa812) to find the steam installation location if you customized it.) (If you are on Linux and own the game on GOG, the nested option inside `Terraria\game` is preferred) If you don't know how to unzip a zip file, get someone who knows how to use a computer to help you.
    * **Option 1, side-by-side (Recommended)**:    
![](https://i.imgur.com/gmrBMSO.png)    
    * **Option 2, nested**:    
![](https://i.imgur.com/YWaqZPO.png)    
    * **DO NOT** install the tModLoader files directly into the Terraria folder. This option not supported for GOG on Mac.
3. [This step applies to 1.3 ONLY] Remove or Add the Steam files depending on which version of the game you own:
    1. If you are using the GOG version of Terraria, delete the Steam file from the folder you just extracted tModLoader into (these files might already be deleted from the zip you downloaded):
        * Windows: `steam_api.dll`
        * Linux: `lib/libsteam_api.so` and `lib64/libsteam_api.so`
        * Mac: `tModLoader.app/Contents/MacOS/osx/libsteam_api.dylib`
    2. If you are using the Steam version of Terraria, if the Steam files are missing from the zip, copy them from your Terraria install to the tModLoader install:
        * Copy the `steam_appid.txt`, then, depending on your platform:
            * Windows: `steam_api.dll` and `CSteamworks.dll`
            * Linux: `lib/libsteam_api.so`, `lib/libCSteamworks.so`, `lib64/libsteam_api.so`, and `lib64/libCSteamworks.so`
            * Mac: `tModLoader.app/Contents/MacOS/osx/libsteam_api.dylib` and `tModLoader.app/Contents/MacOS/osx/CSteamworks`
5.  [1.4 ONLY] GoG users will need to install Steam if they haven't already. Our Mod Browser uses some of the Steam install files to facilitate accessing the Steam Workshop. You should NOT need an account/be logged in for this to work. 
    1. Special Note for Linux: If your steam installation is not recognized (Error "unable to access steam workshop"), try uninstalling it and reinstalling Steam from the APT repositories via the terminal
    2. If for some reason installing Steam is impossible on your system, tModLoader will still work but downloading mods in-game will not. Mods will have to be manually installed. 
6. [Linux/Mac only] Make `start-tModLoader.sh`, `start-tModLoaderServer.sh`, and `start-tModLoader-FamilyShare.sh` executable. You can do this in the file properties or by running the `chmod +x start-tModLoader.sh` command in a terminal while in the destination install directory (do the same for the other 2 filenames).
7. Done. You can now make a desktop shortcut for tModLoader and launch tModLoader from that. (The file `start-tModLoader.bat` launches the game, that is what you could make a shortcut to.)

Tip: Here is an easy way to find where your Terraria files are located: ([video example](https://github.com/tModLoader/tModLoader/assets/4522492/c49b8252-b48a-4cdd-b4cb-b032a22fa812))

1. Locate Terraria in your Steam game library, right click it and click 'Properties'
2. Browse to the 'Local Files' tab and click on the 'Browse local files...' button
3. You are now in your Terraria folder (this is where you should install tModLoader)

### Manual Installation Common Issues
Windows 1.3 only: If the game doesn't launch at all, you might not have .NET 4.5 or XNA 4.0 installed. Download and run both installers:
1. [Microsoft .NET Framework 4.5](https://www.microsoft.com/en-us/download/details.aspx?id=30653)
2. [Microsoft XNA Framework Redistributable 4.0](https://www.microsoft.com/en-us/download/details.aspx?id=20914)

Linux/Mac: When launching from Steam, Steam shows the game launching and then the button goes right back to "Play": This is most likely caused by not making the `.sh` files executable. Revisit step 6 of the [manual install instructions](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-players#manual-installation) above.

### How to uninstall?

1. Open Steam, go to your game library section and locate Terraria.
2. Let Steam **[verify the integrity of game files](https://support.steampowered.com/kb_article.php?ref=2037-QEUH-3335)** for Terraria, this will reconfigure your game files to run vanilla.
4. Done. You can launch Terraria as usual.

If you use GOG, simply delete the tModLoader folder you made before. Your worlds and players will be saved.

## Downgrade tModLoader
1.4 tModLoader updates every month. Sometimes a mod you are using fails to update in a timely manner and will cease to work with the latest tModLoader 1.4 release. Other times a rare bug affecting your setup might manifest that was not caught. You can manually downgrade if this is the case. To manually downgrade, find the latest release for the version you used to use on **[releases](https://github.com/tModLoader/tModLoader/releases)** page and download it. It is a `tModLoader.zip` file. To easily find the latest release from the previous update, type "stable" into the search bar and press enter. This will filter out all the "preview" releases. Scroll down to find the release you need. For example, if you launch tModLoader and it recently updated to `v2022.06+` and it stopped working with an important mod, you can find the latest `v2022.05+` stable release and download it. 

After downloading, open up the tModLoader install directory and delete all the files. Make sure you are in the install folder and not the saves folder. To find the install directory, right click on tModLoader, click `Manage`, then `Browse Local Files`. This [video](https://github.com/tModLoader/tModLoader/assets/4522492/c49b8252-b48a-4cdd-b4cb-b032a22fa812) shows that process. After deleting the original files, you can take the files from the .zip you downloaded and put them in the install folder. This [video](https://github.com/tModLoader/tModLoader/assets/4522492/fd4fca84-725f-4b97-862d-8f659fc3abdb) shows this process. Linux and Mac users will additionally need to make the files executable, see step 6 of the [manual install instructions](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-players#manual-installation) above. 

Once you know the outdated mod updated, you can delete all files in the install directory and use steam to verify game integrity to upgrade back to the current tModLoader release.  

To use 1.3, simply select `1.3-legacy` in the tModLoader betas menu: [video](https://github.com/tModLoader/tModLoader/assets/4522492/3b398cd6-8652-48eb-bd6f-99e8f89672fd)

## Dual Install - Have 1.3 and 1.4 tModLoader installed at the same time
You can keep 1.3 and 1.4 tModLoader installed at the same time if you utilize Steams ability to add non-Steam games. To do this, first switch to `1.3-legacy` and make sure the download finished. Open the install folder and copy all the files. Go up one level and make a tModLoader13 folder. Go into the tModLoader13 folder and paste the files. In Steam, switch back to the default beta branch on tModLoader. Next, click on the `Games` menu and click `Add a Non-Steam Game to My Library`. Click `Browse...` and navigate to the tModLoader13 folder, most likely this will be "C:\Program Files (x86)\Steam\steamapps\common\tModLoader13". Click on "tModLoader.exe", click "Open", then click "Add Selected Programs". Finally, right click on the 2nd tModLoader entry in your library and click properties, then change "tModLoader" to "tModLoader 1.3" and close the window. Now you have the legacy tModLoader and the auto-updating 1.4 tModLoader both in your library. 

## Migrate Everything From 1.3 to 1.4
For the most part, the transition from 1.3 to 1.4 should be a clean start. The 2 are practically different games, and available mods won't match up. If you want to, however, you can migrate existing mods, worlds, and players.
### Mods
Be aware the most of the mods you used on 1.3 might not be on 1.4. You can manually search for mods in the "Download Mods" menu, or you can use a modpack file to attempt to download all of them in one go. First, open up the 1.3 saves folder and find the enabled.json file in the Mods folder, this might be in `\Documents\My Games\Terraria\ModLoader\Mods\enabled.json`. Open up 1.4 tModLoader, click `Workshop`, `Mod Packs`, and then click `Open Mod Pack Folder`. Paste the enabled.json file that you copied earlier into this folder. Click `Back` and then `Mod Packs` to refresh the menu. You should see an entry for "enabled". Click `View Mods in Mod Browser` then click `Download All`. You'll most likely get a message that not all mods were found on the mod browser. If you do, simply click the download button on each mod in the listing. 

### Players
Use the in-game menu to migrate players. Cloud players will not show up so you will have to switch to `1.3-legacy` and take them off the cloud if you wish to copy them over.

### Worlds
Use the in-game menu to migrate worlds. Cloud worlds will not show up so you will have to switch to `1.3-legacy` and take them off the cloud if you wish to copy them over.

## My worlds and characters disappeared when I installed!
**tModLoader DOES NOT use your vanilla world and player files.**
The in-game should give you the option to _copy over_ your original vanilla files. This option won't work for players and worlds you have used in Terraria 1.4.
You do not have to worry about your vanilla saves being modified; they will be copied for modded gameplay use. When you go back to vanilla, you will see your original saves.

tModLoader uses separate folders to store player (.plr) and world (.wld) files, mainly because it will store additional data for them. Your vanilla players and worlds will be stored in: `%UserProfile%\Documents\My Games\Terraria` (for Windows) in the _Players_ and _Worlds_ folders respectively.

If the automatic copy doesn't work, copy the "World" and "Player" folders from `%UserProfile%\Documents\My Games\Terraria` to `%UserProfile%\Documents\My Games\Terraria\tModLoader`.

## How do I download and play mods?
tModLoader comes with a mod browser. Refer to the [mod browser guide](Mod-Browser) to learn how to download and play mods.

## I have too little memory to run multiple mods!
Terraria and 1.3 tModLoader are 32-bit applications. In short, this means they are only capable of utilizing up to ~4 GiB of RAM. With a lot of mods, you may run out of memory. The solution is using less mods, unfortunately. Alternatively, you can try using the unofficial 64-bit version of 1.3 tModLoader.

1.4 tModLoader is 64 bit by default, which alleviates this problem.

## I use macOS Catalina. What do I do?
If you experience any problems, try using the 64-bit version of tModLoader or talk to us on Discord.

## How Do I Use Mod Packs in 1.4?
1.4 tModLoader significantly overhauls the Mod Pack feature to provide several additional functionalities.

To start with, save your Enabled Mods as usual.
The UI will now show a lot of buttons. Let's walkthrough them.
![image](https://user-images.githubusercontent.com/59670736/180901414-3ca8f2f4-c053-4851-8de7-fa617f182db1.png)

First and foremost, I will use two different terms moving forward: 
A mod pack will refer to a frozen copy of mods that don't update with time.
A mod collection will refer to a list of mods that are always the latest.

The first 2 buttons operate on the 'Mod Collection' style. 
Enable Only this List - disables all mods, and than loads only those defined in the collection
Enable this List - loads mods defined in the collection on top of any existing loaded mods. Useful for stacking collections

View List & View Mods in Mod Browser allow you to see what the mods in the pack/collection are, and download them freshly on the mod browser for yourself.

Update List with Enabled - Updates the mod pack or collection with the currently enabled set of mods. Will delete or add to the collection/pack as required

Import Pack (Local) - Tells tModLoader to check the mod pack for the frozen set of mods to load. Any mods loaded from the Pack, while active, will override any existing mods you have downloaded. When a Mod Pack is active, it will shows as such in the Top Right Corner.

Remove Pack (Local) - Undoes the changes made by Import Pack (Local)

Export Pack Instance - Exports a copy of the ModConfigs and <ModPackName>/Mods folder to InstallDirectory/<ModPackName> so that you can either setup a second instance of tModLoader with an older version OR quickly setup a server with the pack. Check InstallDirectory/<ModPackName>/SaveData/Mods for an install.txt file listing all the workshop publish ids and a tmlversion.txt labelling the tml version to use.

Delete Instance - Deletes the exported instance files created by Export Pack Instance

