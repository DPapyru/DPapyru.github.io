# Intermediate Prerequisites
Before consulting any of the Intermediate-level guides, please read below so you are prepared for Intermediate-level concepts. Please also make sure that you have gone through the Basic Prerequisites and corresponding Basic level tutorials related to things you are interested in.

## Upgrade from Text Editor to an IDE
In Basic, we used a Text Editor to write some simple code, but using an IDE (Integrated Development Environment) is extremely recommended for anyone attempting anything in the Intermediate-level guides.

We recommend installing the latest [Visual Studio](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio). It is free and fully featured. If you aren't on Windows, or prefer Visual Studio Code, we recommend installing [Visual Studio Code](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio-Code)

### Installation
Follow the guides linked above to install the selected IDE and other corresponding prerequisites.

### IntelliSense
One of the main reasons we use an IDE is to take advantage of IntelliSense. IntelliSense refers to the capability of the IDE to suggest variable and method names to us as we type. This is important because we need to type things correctly for the computer to understand us. For example, if we wanted to reference the "Cloud in a Bottle" item in code, we need to write `ItemID.CloudinaBottle` exactly. Without an IDE, we might make an assumption on the correct spelling and capitalization and type `ItemID.CloudInABottle` instead. This will result in an error. Our IDE will automatically suggest the correct variable name, saving typing and time.     
> ![image](https://github.com/tModLoader/tModLoader/assets/4522492/c62e6bdf-6af5-48ab-9caf-4d125ecf0099)    

Here is a video showing how IntelliSense also shows parameter names for methods we are calling:    

https://github.com/tModLoader/tModLoader/assets/4522492/0e682781-5094-4a1d-bb7f-40634f26816b    

This was a short exploration into IntelliSense. Please see the dedicated [IntelliSense section in the Why Use an IDE wiki page](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#autocomplete--intellisense) for more information and examples. IntelliSense is extremely important.

### Usage
The guides for your selected IDE ([Visual Studio](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio) or [Visual Studio Code](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio-Code)) have sections for creating a mod and opening your mod's source correctly. Please follow those guides to properly open the source code for your mod. It is important to open the source code in the manner explained in those guides. Failure to open your mod's source code correctly will result in your IDE being only as useful as a normal Text Editor.

### Advanced
As you make mods, eventually you will need to learn more advanced techniques. The [Advanced Prerequisites](https://github.com/tModLoader/tModLoader/wiki/Advanced-Prerequisites) guide will prepare you for that by teaching how to access and read the Terraria source code.

The [Why Use an IDE wiki page](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE) is another great resource to learn about useful IDE features such as Edit and Continue, Debugging, and Breakpoints.

## Inheritance
Please [read about inheritance](https://www.tutorialspoint.com/csharp/csharp_inheritance.htm)

Inheritance is used everywhere in tModLoader modding. If you look back on our sword we made during Basic, you'll notice that our sword inherits from `ModItem`.

## Hooks
A "Hook" is a method that is made available to modders so that they can achieve special effects for their mod. Hooks are virtual methods that modders override if they wish to use them. 

## Documentation
Learning to read [documentation](http://tmodloader.github.io/tModLoader/) is essential to modding. For example, [Example Gun](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleGun.cs#L79) has an example that overrides the `ModItem.Shoot` method. We see from the method signature that `Shoot` returns a `bool`. The `bool` that we return has special meaning, but we won't know unless we look it up. Open up the Documentation and search for "Shoot" and then click the result, and then the sub-result for the ModItem class. You will be taken to a description. Read the description and learn what the parameters and return values represent. Looking back on that `ExampleGun` code, you should now see how the hook manages to prevent the game's default behavior of spawning the projectile by using the Shoot hook.    
> ![](https://i.imgur.com/lQ5gAh2.png)    

### Virtual and Override
You may notice that the documentation lists all the hooks as virtual, but all the ExampleMod code has override. This is because we override virtual methods when we inherit from them. [Read about inheritance](https://www.tutorialspoint.com/csharp/csharp_inheritance.htm) again if you've forgotten.

## Vanilla Texture File Reference
Looking at vanilla texture files and seeing how they are laid out is very useful, especially when you start animating NPC. Terraria stores textures in `.xnb` files that we can't open normally. The best option is to just extract all the Texture files to `.png` files and keep them around in a folder so you can look at them whenever you need to.    

Instructions: Download [TConvert](https://forums.terraria.org/index.php?threads/tconvert-extract-content-files-and-convert-them-back.61706/) and run it. Fix the `Terraria Content Folder` path if needed, then click `Use Terraria`. Finally, use the folder icon for `Output Folder` to specify where you want to keep the extracted files.  I suggest creating a folder in the ModLoader folder so you can easily find it: `\Documents\My Games\Terraria\ModLoader\VanillaTextures\`. You can uncheck the options other than `Images` if you'd like. Now, click `Extract` and wait for it to finish. From now on, if you are curious how many frames an NPC has, you can simply find the png file corresponding to the NPCID and view it in your image viewer. 

Alternatively, you can also find Terraria sprites on [The Spriters Resource](https://www.spriters-resource.com/pc_computer/terraria/), but they may or may not be the original layout, dimensions, or filenames. Use the website only if you need a quick reference, the best option is to extract your current Terraria textures directly.