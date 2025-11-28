- **This guide does not cover [Visual Studio](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio), but Visual Studio Code.**
- **Visual Studio Code takes less space to store than Visual Studio.**
- **Visual Studio Code runs on Windows, Mac, and Linux.**
- **If you inexperienced in modding, have space on your computer and are on Windows, it is highly recommended to get Visual Studio instead.**
- **This guide is not meant to learn C# fundamentals**

# Prerequisites

## Installation

1. Download [Visual Studio Code](https://code.visualstudio.com/). 
1. Install Visual Studio Code by running the downloaded installer. Allow the program to run and accept license agreements as you would normally do. The default options should be suitable.
1. Install the [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) by downloading the installer, running it, and following the instructions. Download the installer for the latest SDK release labeled "x64" corresponding to your operating system. Don't download the .NET 6.0 or .NET 7.0 versions, those will not work. ([Visual Guide](https://github.com/tModLoader/tModLoader/assets/4522492/75a9299b-0e1a-41cd-acd0-e6d8ffcfe591)) 
1. Launch Visual Studio Code.
1. Install the **C# Dev Kit** extension.
    1. You should see something similar to the following: [Welcome Page](https://i.imgur.com/YwNh3x6.png)
    1. Click the Extensions button: [Button Location](https://i.imgur.com/fqMhVKd.png)
    1. Type `C#` into the search bar, click the "C# Dev Kit" extension, then click the install button: [Install C# Extension Steps](https://i.imgur.com/KYNArmF.png)
    2. *Optional*. If you are an experienced user, **IntelliCode for C# Dev Kit** will be a helpful extension. Install that as well if interested. However, if you are inexperienced, this will just cause confusion and is not recommended: [Extension Details](https://i.imgur.com/1wxx5pg.png)
    3. Wait for the installation to complete. The output window will show other extensions being downloaded and installed as it is packaged with C# Dev Kit: [Extensions Installed](https://i.imgur.com/9R1jazM.png)

# Creating a Mod

Follow the instructions in [Basic tModLoader Modding Guide](Basic-tModLoader-Modding-Guide)

# Open your Mod Source

1. It is very important that you installed the extensions mentioned above and .NET 8 SDK listed in [Prerequisites](#prerequisites).
1. Open Visual Studio Code
1. Click `Open Folder`. If you don't see it, click `File->Open Folder`. Navigate to `%UserProfile%\Documents\My Games\Terraria\ModLoader\Mod Sources\TutorialMod` if you're on Windows, or Navigate to `~\Library\Application Support\Terraria\ModLoader\Mod Sources\TutorialMod` if you're on Mac, and click `Select Folder`: [Example](https://i.imgur.com/lCaN4aP.png)
1. You should now see various files available to edit. Open `TutorialMod.cs` and you should be able to start writing code.
1. You can create new folders and `.cs` files by right clicking in empty space in the Explorer pane: [New File](https://i.imgur.com/B6fh4JD.png)

# Build your Mod

1. Building your mod is easy. Just open `Terminal->New Terminal` from the Menu Bar: [Location](https://i.imgur.com/LnrCB0W.png)
2. Once the terminal is open, simply just type `dotnet msbuild` to build your mod.

## Enabling Hot Reload

This feature is disabled by default. You will need to open settings and enable it.

1. Press `Ctrl + ,` on your keyboard to open settings, then click on the icon on the top right: [Location](https://i.imgur.com/JwdkHte.png)
2. Inside the curly braces, add these lines:
```
"csharp.experimental.debug.hotReload": true,
"csharp.debug.hotReloadOnSave": true
```
3. Press `Ctrl + S` to save. Hot Reloading should be enabled.

## Common Build Issues

* If you get an error relating to "project.assets.json not found. Run a NuGet package restore to generate this file.", then go to `Terminal-> NewTerminal`, run the `dotnet restore` command in the terminal that appears. Now you can run the build again with `dotnet msbuild`.

* If you get an error relating to "System.IO.IOException: The process cannot access the file TutorialMod.tmod because it is being used by another process.", you need to disable the mod in tModLoader and reload mods so that the file can be edited. Closing tModLoader completely is also an option when building.

# Why Use Visual Studio Code

Please read the [Why Use an IDE](Why-Use-an-IDE) page. Most of the features apply to Visual Studio Code. If you aren't seeing errors being underlined or fixes being suggested, you might have skipped installing the [C# Dev Kit Extension](#prerequisites).

# Debugging

Debugging can be achieved by using VS Code's Run and Debug feature.

1. Click `Run and Debug` (or press `Ctrl + Shift + D`): [Location](https://i.imgur.com/pUxWjVf.png)
2. While having a `.cs` related to the mod opened in the main editor, click `Run and Debug` button: [Big Button](https://i.imgur.com/FmKbi7z.png)
3. tModLoader should start while enabling your current state of your mod. You can add breakpoints from here and hot reload when necessary and if enabled: [Debug Console](https://i.imgur.com/2LQIgLc.png)
4. To add breakpoints, simply click the red dot left of the line number as so: [Red Circle Breakpoint](https://i.imgur.com/1MlX9mN.png)

# Issues
## Autocomplete, Error Reporting, or IntelliSense not working
Assuming you followed every step in [Prerequisites](#prerequisites), the most common reason for this error is failing to open your mod's code correctly. Please follow the [Open your Mod Source](#open-your-mod-source) section. Failure to open your mod this way will make using Visual Studio Code counterproductive.