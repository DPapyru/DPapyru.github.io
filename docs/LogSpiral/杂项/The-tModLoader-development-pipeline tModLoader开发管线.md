- **This article roughly explains how tModLoader was established, how it works and how it is being maintained**
- **Use this as an introduction to tML and get some valuable background insights about the API**

# How is tModLoader developed?
First of all, tModLoader is a modification to the vanilla source that facilitates both modding development for mods and loading (playing) with mods. It uses a custom built patcher (by chicken-bones) that can manage the source using patches. The patcher uses [ILSpy](https://github.com/icsharpcode/ILSpy) internally to decompile the vanilla client which allows access to modifications using an IDE such as [visual studio](https://visualstudio.microsoft.com/)

The patching system allows tML to be open-source as it does not disclose vanilla information nor does it host the decompiled source. Developers will have to manually decompile and patch their local source to work on the tML codebase. The patcher can do this by first decompiling the vanilla client, and then making separate managed projects in which one will have the patches applied. This will result in the user having access to the tML modified codebase locally.

# How is tModLoader updated?
Everytime vanilla updates, the patches for tModLoader become broken. This is due to changes in the vanilla codebase. For every update, the developers will have to manually go through patches to figure out what changed and how to fix the patch. This is all done manually.

# How does tModLoader facilitate modding needs?
tModLoader exposes a variety of classes and methods that can be used by modders to create their own content. It can then "build" a modders' mod and register its changed in the vanilla code. Modders get access to this by referencing the modded assembly (tModLoader) in their IDE. Every mod has one entry point, a "Mod" class, and from there can add any content that is desired.

tModLoader provides an Object-Oriented design approach for modders to build content, which is facilitated by classes such as [ModItem](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/ModLoader/ModItem.cs), [ModProjectile](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/ModLoader/ModProjectile.cs), [ModPlayer](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/ModLoader/ModPlayer.cs) and so forth. Modders can use these classes in their mod to add these respective subjects to their mod. For example using the ModItem class modders can add their own items to the game.

We've designed these classes to be easy to use and be [polymorphic](https://en.wikipedia.org/wiki/Polymorphism_(computer_science)). We expose the API via [abstract](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/abstract) methods or [virtual](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/virtual) methods, which can be overridden by the [deriving class](https://en.cppreference.com/w/cpp/language/derived_class). Abstract definitions do not contain any logic, and must be implemented by the deriving party. Virtual definitions _can_ contain base logic, but may be overridden by the deriving party.

Once a mod code base is made, it can be built using the in-game mod source menu which will package the mod into a .tmod file. This file can then be spread to other players so they can play the mod.

# How does tModLoader facilitate playing the game with mods?
tModLoader is not only a tool to build mods, it also allows playing them. It does so by providing a Mod Browser (to look for- and download mods) and providing in-game functionality to load in and apply mods to the game (as well as unloading them). Players only need a '.tmod' file to get started, which is tModLoader's specific package format for mods.

# How does tModLoader understand what mods want to add?
Upon loading a mod, tModLoader will load that [mods' assembly](https://www.google.com/search?client=firefox-b-d&q=c%23+code+assembly) (its code) and look for classes that are provided by tModLoader. It can then load this content into the game. This is done by the so-called 'Loader' classes. These are classes that contain specific code to load a certain content into the game. These classes do things such as preparing the vanilla source to be edited, this can include things like resizing arrays that hold particular content. 

The loaders contain methods that are called from specific points in the vanilla code, when modders would expect their code to execute. These calls are added by the tModLoader developers and is what makes the modded content work. tModLoader works sort of like a bridge between the client and mods; it will know which mods are loaded, and then proceed to call the necessary methods in them. This is why modders do not have to worry about how or when their code will be executed, they can simply focus on creating the content instead.

# Evasive patches
We try to edit the decompiled source as little as we can, due to the patching system. By doing so, we can minimize the difference in patches and thus make it easier to fix the API when vanilla updates. If you wish to contribute to the API, keep this in mind and try to minimize patch difference.

## Tips
These are also things we keep in mind ourselves to minimize our patch differences:

1. Call tModLoader classes from vanilla classes if you can, when code resides in our own classes it is not a maintenance hassle.
1. Do not refactor any vanilla code. As tempting as it may be, it will increase the patch difference and make it harder to update.
1. Document your changes, especially changes made in a patch. Mark line numbers and landmarks.
