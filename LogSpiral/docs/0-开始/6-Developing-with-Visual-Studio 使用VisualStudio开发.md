- **This guide supports VS 2019 and VS 2022 edition**
- **Visual Studio only runs on Windows. Mac and Linux users should consider [Visual Studio Code](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio-Code) or [Rider](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Rider) instead.**
- **It does not cover [Visual Studio Code](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio-Code).**
- **This guide is not meant to learn C# fundamentals**

# Prerequisites
1. Download [Visual Studio Community](https://visualstudio.microsoft.com/). 
    1. The community edition is free of charge. 
    1. If you are using **tml 1.3**, you need to download and install the [2019 edition](https://visualstudio.microsoft.com/vs/older-downloads/) (If the community edition is not available there, try [here](https://docs.microsoft.com/en-us/visualstudio/releases/2019/release-notes)), else you get the errors mentioned below. You can use 2022 afterwards if you want to.
    1. If you are using **tml 1.4**, you need 2022. v17.8 or higher is required, you may need to [update](https://learn.microsoft.com/en-us/visualstudio/install/update-visual-studio?view=vs-2022#use-the-visual-studio-installer-1).
1. During installation, check the `.NET desktop development` workload. Nothing else needs to be checked. ([Example](https://i.imgur.com/Y8uZ14h.png)) 
    1. You may be tempted to uncheck items you think you don't need in the `Individual components` tab to save hard drive space or bandwidth. We have not currently determined which individual components are able to be unchecked for tModLoader modding. Many have unchecked things and have been unable to compile mods. If you get an error message similar to "The type 'Object' is defined in an assembly that is not referenced.", you may have this issue and should do the full workload install. 
    1. If you've forgotten this step, you can click on Tools->Get Tools and Features to bring up the installer again. ([Example](https://i.imgur.com/EmqEsmH.png))
1. Install `.NET 8.0 SDK` by visiting [the dotnet 8.0 download site](https://dotnet.microsoft.com/en-us/download/dotnet/8.0), downloading the installer for the latest SDK release labeled "x64" corresponding to your operating system, and running the installer to completion. Don't download the .NET 6.0 or .NET 7.0 versions, those will not work. You might need to restart Visual Studio or your computer after the install. ([Visual Guide](https://i.imgur.com/EzRCHdk.png))

# Creating a Project
First we must create a new project for our mod. To do this, follow the instructions in [Basic tModLoader Modding Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-Guide) for generating a Mod Skeleton, which will contain the project files.

## Creating or Updating an existing project for an old mod
If you are updating a mod from before 1.4, you can use the "Upgrade .csproj file" button in the Mod Sources menu. This will create a fully working project for you to open and continue working on.    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/12231152-f764-4bc3-9a39-472a38f149c8)    

# Opening your Project
It is very important that you open the `.csproj` file from the file explorer. If you open individual `.cs` files, Visual Studio will be completely useless. To open the `.csproj`, navigate to `Documents\My Games\Terraria\tModLoader\ModSources\[ModName]\` and double-click on `[ModName].csproj`. Make sure you aren't opening the `[ModName].csproj.user` or `[ModName].cs` files. This will likely happen if you do not have file extensions shown. Watch [this](https://github.com/tModLoader/tModLoader/assets/4522492/7ae18fe2-f9cf-4bcf-b3af-67bfce7495f2) to see how to toggle file extensions. Now that Visual Studio is open, make sure you see the following:    
![](https://i.imgur.com/NreIujY.png)    
Click the `Solution Explorer` button to see the `.cs` files in your mod. You must open `.cs` files from here in order to correctly use Visual Studio. Let's make sure autocomplete is working. Open up `Items\TutorialSword.cs` and type `item.` on a new line after the existing `item.autoReuse = true;`. You should see the autocomplete popup show up:    
![](https://i.imgur.com/2WOzFND.png)    
Congratulations, you are ready to write code for your mod. Read below for info on building and debugging within Visual Studio.

# Building with Visual Studio
Building your mod within Visual Studio lets you quickly make sure the code you have written doesn't have any build errors. First, make sure tModLoader itself is closed, or at least that the mod you are building is unloaded. Next, simply select the Build->Build [Modname] menu item:    
![](https://i.imgur.com/Afx2wtd.png)    
If you have errors, you'll see them in the Error List. You can click on each error to see the offending code: 
![](https://i.imgur.com/eO0w0cn.png)    
If you do not have errors, you should see Build Succeeded on the bottom left. If you open the Output Panel (View->Output), you should see something similar to this:
![](https://i.imgur.com/mrMpzB3.png)    

**Please keep in mind that Visual Studio DOES NOT abide to your buildIgnore rules, and your built .tmod file will be larger than if you would use the in-game build option. _So, before you release your mod, ALWAYS build using the in-game menu_.**

# Debugging
Debugging is the main feature that sets Visual Studio apart from Visual Studio Code. This will let you set breakpoints in your mod and inspect variables in Visual Studio. To debug, **first make sure tModLoader is closed**, then simply click the button labeled "Terraria" or press F5:    
![](https://i.imgur.com/7GUHYCS.png)    
If you have errors, the Error List will appear, otherwise, the mod will build, be enabled automatically, and Terraria will start. (You may find that Full screen mode makes modding difficult, I suggest using Windowed mode while making mods.) If Visual Studio tells you that there are build errors and asks if you would like to launch anyway, **say no**! Fix the errors and try again. You'll know it is working if you see this:
![](https://i.imgur.com/9vK1rvF.png)    
More information on how to debug and the benefits of debugging are found in the [Why Use an IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#debug) page, please read it, it is extremely useful.

## Debugging with Family Share
If you are launching tModLoader through Family Share on Steam, you will be required to do the following fix, otherwise it will fail to launch the game correctly through VS:
1. Open the `Properties` folder in your mod's root folder, and open the `launchSettings.json` in a text editor.
2. Change
```json
"workingDirectory": "$(tMLSteamPath)"
```
  to
```json
"workingDirectory": "$(tMLSteamPath)",
"environmentVariables": {
"SteamClientLaunch": "1"
}
```
3. Save the file.

Alternatively, you can open VS, navigate to Debug -> \<ModName\> Debug Properties, and add `SteamClientLaunch=1` into the "Environment variables" field (or `SteamClientLaunch` into Name and `1` into Value, depending on your VS version).

# Edit and Continue
While debugging, you can edit the source code and recompile the mod in-game without having to reload mods or restart the game. The [Why Use an IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#edit-and-continue) page has more info on this topic, please read it, it is extremely useful. ***Anything between "Next Steps" and "Common issues" is not required to do, this has been set up by the "Create Mod" button when you made your mod. Don't touch your .csproj if you don't know EXACTLY what you are doing.***

# Next Steps
Now that you have setup Visual Studio, your mod development speed can increase greatly. Please read [Why Use an IDE](Why-Use-an-IDE) for more tips on how an IDE like Visual Studio greatly speed up your modding.

## Additional Recommended Extensions
To further improve the modding experience, consider these extensions that can be added to Visual Studio.

### HJSON
The [Hjson extension](https://github.com/Rijam/vs-hjson/releases) adds syntax highlighting to `.hjson` files. Keys and values are colored to help identify mistakes.    

![Hjson_Highlighting](https://github.com/tModLoader/tModLoader/assets/4522492/170fbe6b-ed73-4570-8d30-bf3a7e4b8ed9)     

### HLSL
The [HLSL Tools extension](https://github.com/tgjones/HlslTools) greatly improves editing shader files in Visual Studio.

![image](https://github.com/tModLoader/tModLoader/assets/4522492/b298659f-69ac-48ba-be44-5a27eec55d5e)    

# Manual Setup
Setting up a project for your mod manually is not recommended. Modders should use the automatic mod project generation. The info in this section is for informational purposes only and likely only applies to outdated tModLoader versions.

<details><summary>Expand for Manual Setup instructions</summary><blockquote>

## Creating a Project
1. Open Visual Studio and go to New -> Project
1. Select the "Class Library" template
1. Set the _internal_ name for your mod. (No special characters allowed)
1. Uncheck "Create directory for solution" if using VS 2017, and check "Place solution and project in the same directory" if using VS 2019.
1. Make sure to set the location to the Mod Sources directory
1. Click OK
    1. Your output should look similar to [this](https://i.imgur.com/8JBLt1A.png). Note, your window may look different, this is the window for VS 2019. 
1. Go to the Solution Explorer tab, right click on Solution -> ModName -> References and click Add Reference... ([example](https://i.imgur.com/oM30lfT.png))
1. Click Browse... and select the tModLoader executable (likely: `C:\Program Files (x86)\Steam\steamapps\common\tModLoader\tModLoader.exe`, if you're not on Windows check out [this video](https://github.com/tModLoader/tModLoader/assets/4522492/74a6bc40-5dd0-46a6-a947-2a76fbd4135c))
1. Add a new txt file named `build.txt` to the root of your project
1. `buildIgnore = *.csproj, *.user, obj\*, bin\*, .vs\*` to your build.txt
1. Add the XNA references to your project. You should have these if you can play Terraria, otherwise see [here](https://www.microsoft.com/en-us/download/details.aspx?id=20914)
    1. Open the csproj file in a good text editor (like [Notepad++](https://notepad-plus-plus.org/))
    1. Find the reference section and add the following:
    ```
    <Reference Include="Microsoft.Xna.Framework" />
    <Reference Include="Microsoft.Xna.Framework.Game" />
    <Reference Include="Microsoft.Xna.Framework.Graphics" />
    ```
    1. VS should prompt to reload the project, do so. Otherwise, simply re-open the project.
1. Create a class extending `Terraria.ModLoader.Mod`

## Building with Visual Studio
This will let you build your mod from within Visual Studio, so you don't have to rebuild from within the game, or have your sources in the Mod Sources folder.

1. Right click on your mod project in the Solution Explorer and click Properties
1. Go to the Build Events tab
1. Add the following to the Post-build event command line
`"C:\Program Files (x86)\Steam\steamapps\common\tModLoader\tModLoaderServer.exe" -build "$(ProjectDir)\"`
    1. Ensure the paths are enclosed by double quotes, change the path to your tModLoaderServer if you have it installed elsewhere.

# Debugging
This will let you set breakpoints in your mod and inspect variables in VS. Change the paths if you installed Terraria elsewhere.

1. Right click on your mod project in the Solution Explorer and click Properties
1. Go to the Debug tab
1. Set the Start Action to Start external program: `C:\Program Files (x86)\Steam\steamapps\common\tModLoader\tModLoader.exe`
1. Set the Working directory to `C:\Program Files (x86)\Steam\steamapps\common\tModLoader`
    1. Add the line `includePDB = true` to your build.txt if you want to include line numbers in exception stack traces (useful for debugging). _However it will increase the size of your mod and should be omitted from release builds_.

# Setup Edit and Continue
This will let you edit the source code and recompile the mod during debugging, without having to restart the game.

1. Simply add `-eac "$(TargetPath)"` to the end of your Post-build event command line

</blockquote></details>

# Common issues
These issues usually only apply if you have not upgraded to the 0.11 .csproj. Please update your csproj in the Mod Sources menu first.

## Autocomplete isn't doing anything for me.
(Also: Autocomplete is changing things I don't want it to, like changing `item` to `Items`.)
1. Check that your .cs files are actually in the project, and that you are opening the project not just individual .cs files. You can use the show all files toggle and then right click -> include in project to add missing source files to the project.    
[Example](http://i.imgur.com/dNMyROY.png)
2. Make sure you aren't opening .cs files from the File Explorer. You should always open the .csproj (or .sln) file and then once Visual Studio is open, open your .cs source files from the Solution Explorer. If you don't, you'll notice that the top left area says Miscellaneous Files, meaning the file doesn't belong to a project. If you see Miscellaneous Files, check step 2 again.    
[Example](https://i.imgur.com/bw41Wt4.png)    
After fixing:    
[Example](https://i.imgur.com/RY456Nb.png)
3. Make sure the Solution Explorer is in solution view and not folder view. [Button Location](https://i.imgur.com/NIOP3fn.png)     
4. Make sure Visual Studio is at v17.8 or higher. [Update instructions](https://learn.microsoft.com/en-us/visualstudio/install/update-visual-studio?view=vs-2022#use-the-visual-studio-installer-1).

## The current .NET SDK does not support targeting .NET 8.0. Either target .NET 7.0 or lower, or use a version of the .NET SDK that supports .NET 8.0
This means you need to update Visual Studio to v17.8 or higher. This is required as of May 1st, 2024, the v2024.03 stable release. [Update instructions](https://learn.microsoft.com/en-us/visualstudio/install/update-visual-studio?view=vs-2022#use-the-visual-studio-installer-1).

## The SDK 'Microsoft.NET.Sdk' specified could not be found.
This means you skipped installing the `.NET desktop development` workload mentioned at the top of this page. [Prerequisites](#Prerequisites)

If you are sure you did that, then another possibility is that the 32 bit dotnet SDK is taking priority on your computer's `PATH`. Follow the instructions in [this answer](https://stackoverflow.com/questions/67049414/windows-or-visual-studio-2022-cant-find-the-latest-installed-net-sdk-due-to-bi/67049415#67049415) to see if that applies to your situation and how to fix it.

## The project doesn't know how to run the profile with the name 'Terraria' and the command 'Executable'
![unknown (8)](https://user-images.githubusercontent.com/4522492/193676280-b8d1cd7c-5b64-4a98-b7d8-d3ce7e936429.png)    
This means you skipped installing the `.NET desktop development` workload mentioned at the top of this page. [Prerequisites](#Prerequisites)

## Error CS0246 The type or namespace name 'ReLogic' could not be found
Make sure you are using the updated .csproj and this error will automatically fix itself. See [Creating or Updating an existing project for an old mod](#creating-or-updating-an-existing-project-for-an-old-mod) to update your csproj.

## Error CS0246 The type or namespace name 'Mod' (or 'ModLoader', 'ModItem', etc) could not be found
You have added a reference to the vanilla Terraria.exe, remove it and add a correct reference to the modded Terraria.exe.

## CS5001 Program does not contain a static 'Main' method suitable for an entry point
Make sure "Output type" is set to "Class Library" in the project properties.

## References to other classes stopped working! (such as : ModItem, : ModProjectile etc.)
Simply restart Visual Studio and it should fix itself.
If it does not, you can attempt removing the .vs folder in your mod source root, then reloading the project.

## Failed to load pre-compiled edit and continue dll System.IO.FileNotFoundException: Could not find file 'C:\...\YYY.pdb'.
This error occurs when the project wasn't created with the mod skeleton generator. To fix this error, go under your project's properties (right-click the project under the Solution Explorer and click `Properties`), go to the `Build` tab, click the `Advanced` button and change the value of `Debugging Information` to `Full`.

## VS 2019 keeps opening instead of VS 2022
If you find that opening your `.csproj` file is opening VS 2019 when you have 2022 installed, the issue can be solved by updating the `.sln` file. First, open up VS 2022, then use `File->Open->Project/Solution...` to open the `.csproj` directly. Next, open the `Solution Explorer` panel and click on the `Solution` line at the top. Click `File->Save SolutionName.sln as...` and then click `Save`. This will update the `.sln` file that the `.csproj` is bound to. You can now close VS and try double clicking on the .csproj to verify that it opens VS 2022 now.

# Miscellaneous
## Determining issues from screenshots
If you are helping someone online that is struggling to get Visual Studio to work, these visual clues will help identify their issues:

### Wrong Visual Studio Version
![image](https://user-images.githubusercontent.com/4522492/194128001-f4b38ca6-bb45-4b60-bc2a-0c4458bb83f7.png)     
The `Save All` icon is an easy way to recognize if they are in the wrong Visual Studio version. Direct them to [Prerequisites](#prerequisites) to download Visual Studio 2022.

### Wrong Program
![image](https://user-images.githubusercontent.com/4522492/194130930-c0bf7aef-a397-4666-9c49-858d7f91aad5.png)    
The guidelines in Visual Studio are a dotted line, Visual Studio Code has solid lines, and Notepad++ has dotted lines with very small dots. Also note how Notepad++ fails to do complete syntax highlighting. Direct them to [Prerequisites](#prerequisites) to download Visual Studio 2022.

### Unsaved Changes
![image](https://github.com/tModLoader/tModLoader/assets/4522492/b8a4b584-de98-47e1-818b-16d2fc45af77)    
All editors have a small * mark in the editor tab indicating that a file has changes that are not saved. In Visual Studio and Notepad++, colors in the gutter area indicate lines that have not yet been saved. In VS, hollow gutter marks are unsaved edits or additions, while solid marks are recently saved changes. In Notepad++ orange lines are unsaved and green lines are saved changes. 

Even if changes are saved, the mod might not have been rebuilt. The easiest way to avoid these issues altogether is to always launch directly from Visual Studio rather than saving changes in the editor and then building the mod in game. This approach also has the added benefit of allowing hot reload and build and continue to work, greatly speeding up testing.

### Miscellaneous Files
![image](https://user-images.githubusercontent.com/4522492/194131467-a47a0e90-692a-40c3-af8b-290566b6aabd.png)    
If you see "Miscellaneous Files" instead of the mod name, the user didn't open their `.csproj` and instead opened the `.cs` file directly. Other clues include a lack of syntax highlighting for classes and method invocations. Direct them to [Opening your Project](#opening-your-project).