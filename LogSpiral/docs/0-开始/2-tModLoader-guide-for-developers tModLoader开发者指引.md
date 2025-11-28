___

**[I don't want to create mods, I just want to play with them](tModLoader-guide-for-players)**

___

**[I don't want to create mods, I want to contribute to tModLoader another way](tModLoader-guide-for-contributors)**

___


## Installation
If you still need to install tModLoader refer to the [tModLoader guide for players](tModLoader-guide-for-players).

## Developing with tModLoader
Before you begin, you will need two things, the ".NET 8 SDK" and a suitable IDE. Once you have these installed, you should start with the [Basic tModLoader Modding Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-Guide).

### IDE
Choose your favorite IDE to mod with tModLoader. Refer to the [development section](https://github.com/tModLoader/tModLoader/wiki#development) on the homepage. For the best mod making experience, using Visual Studio is highly recommended. Currently 2022 v17.8 or higher is required.

### .NET SDK
Install the [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) by downloading the installer, running it, and following the instructions. Download the installer for the latest SDK release labeled "x64" corresponding to your operating system. 
Don't download from links in the column labeled "Binaries". Don't download the .NET 9.0, .NET 7.0, or .NET 6.0 versions, those will not work.

<details><summary>Click to view visual instructions</summary><blockquote>

![chrome_2024-05-02_11-55-52](https://github.com/tModLoader/tModLoader/assets/4522492/75a9299b-0e1a-41cd-acd0-e6d8ffcfe591)

</blockquote></details>

To verify that you have the ".NET 8 SDK" properly installed, you can open a new command prompt and type `dotnet --list-sdks` and press enter. If you see a result with a version starting with the number 8, it is installed.     
![image](https://github.com/tModLoader/tModLoader/assets/4522492/ab93ade6-edb7-4088-881c-03f3871cd591)    
The folders shown should show the `Program Files` folder not the `Program Files (x86)` folder. If you see the 86 folder, that means you installed the 32 bit SDK by accident. You can uninstall it and then install the correct version **OR** install the correct version and [adjust the PATH variable](https://learn.microsoft.com/en-us/dotnet/core/install/windows?tabs=net80#no-net-sdk-was-found) so that the 64 bit SDK shows up instead.

If tModLoader still complains that it can't find the SDK, you may need to restart your computer for the changes to take effect.

## I am new to modding
If you are new to modding, it is recommended to start with [the starter guide](Basic-tModLoader-Modding-Guide). You can then move on to the [easy guides](home#easy-guides).

The following links might be useful for you:
1. [Our website](https://tmodloader.net)
1. [tModLoader documentation](https://tmodloader.github.io/tModLoader/)
2. tModLoader wiki (useful information and guides) -- **you are here right now.**
3. [Join our Discord server](https://discord.gg/tmodloader) (requires a free Discord account)
4. [Basic tModLoader Modding Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-Guide)
5. [Example Mod](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod) - A mod showcasing and teaching various tModLoader mod capabilities
6. [tModLoader's official release thread on TCF](http://forums.terraria.org/index.php?threads/.23726/)

## I am returning to modding
If you made tModLoader mods previously and either want to update your outdated mod or make a new mod, there is a high chance that the tModLoader API has changed. Please read the [Update Migration Guide](https://github.com/tModLoader/tModLoader/wiki/Update-Migration-Guide) for the versions you missed after reading the [tModPorter section](https://github.com/tModLoader/tModLoader/wiki/Update-Migration-Guide#tmodporter). Feel free to ask questions in Discord if you have any questions.