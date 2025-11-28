***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content/838b9239b7030e2c7bf3654ef527b4d8b70a3e2d)
***

# Read First

When inter-operating with other mods, there are several things to note. The biggest thing to note is that the Mod you wish to interact with may or may not actually be loaded. Calling methods, accessing fields, or trying to use Items from mods that aren't loaded will cause problems. You can avoid the issue altogether if you make your mod "strongly" depend on the other mod, but this means that your mod can't be loaded without the other mod present. An alternative to a strong dependency is a weak dependency. Weak dependencies are the most difficult to do correctly but also the most powerful. A 3rd option is less powerful than the other 2 but much easier and relies on Mod.Call, a simple way of passing messages between mods. This option requires the mod you wish to operate with to support it. A 4th option is using reflection, and is a bad approach. A 5th option is for simple things like recipes. These options are explained from simplest to strongest below.

# Simple Cross Mod content. Recipes, Items, and Tiles (Intermediate)

The easiest form of cross-mod content is utilizing items or tiles in recipes, shops, or drops. The first thing to note is that the mod may or may not exist. To determine if it exists, we first ask tModLoader for the Mod object.
```cs
ModLoader.TryGetMod("ExampleMod", out Mod exampleMod);
```
The `exampleMod` object is now either `null` or a valid reference to the `Mod` class of `ExampleMod`. There are two ways to determine whether a mod is loaded when using `ModLoader.TryGetMod`, you can either use the boolean value returned by the method or check if the `Mod` instance is null. In this example, it's easier to check if the method returned `true`. We will add an item to our Town NPC's shop.
```cs
public override void AddShops() 
{
	// other code assigning npcShop

	// Find mod and then find item in that mod
	if (ModLoader.TryGetMod("ExampleMod", out Mod exampleMod)) {
		if (exampleMod.TryFind("ExampleWings", out ModItem exampleWings)) {
			npcShop.Add(exampleWings.Type);
		}
		// Add more items to the shop from Example Mod
	}

	// Alternate approach: Find item from mod directly
	if(ModContent.TryFind("ExampleMod", "ExampleTorch", out ModItem exampleTorch)) {
		npcShop.Add(exampleTorch.Type);
	}
	
	// other code and npcShop.Register();
}
```
As you can see, we can use the `exampleMod` object and invoke the `TryFind` method to get the `ModItem` for the item. We then use `ModItem.Type` to retrieve the item type for that item. The 2nd example shows using `ModContent.TryFind` to get the `ModItem` in one step instead. Note that `"ExampleWings"` corresponds to the internal name of an item, so it may be necessary to ask the other modder so you can get the correct internal name of the items you wish to use. See [Determining Internal Names](#determining-internal-names) below for more approaches. Also be aware that if the mod you are referencing changes the internal name, your mod will break until you fix it. It is recommended that mods expecting cross-mod content refrain from changing fields, methods, and namespaces other mod expect to remain consistent.

Similar code can be used for NPC loot and recipes.

## Recipe Example
See [here](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#cross-mod-recipes) for a recipe example.

## NPC Loot Example
```cs
public override void ModifyNPCLoot(NPCLoot npcLoot) {
	if (ModContent.TryFind("ExampleMod", "ExampleSoul", out ModItem exampleSoul)) {
		npcLoot.Add(ItemDropRule.Common(exampleSoul.Type, 5));
	}
}
```

## Selectively Loading Content Example
We can selectively load or not load content based on other mods being enabled. This can be useful to avoid content overlap or to facilitate cross-mod content. To do this, simply check if the mod is enabled in the `IsLoadingEnabled` method:
```cs
public override bool IsLoadingEnabled(Mod mod) {
	return ModLoader.HasMod("SomeOtherMod"); // Only load this content if the "SomeOtherMod" is enabled as well.
}
```

## Determining Internal Names
If you use the [Helpful Hotkeys](https://steamcommunity.com/sharedfiles/filedetails/?id=2645058109) mod and enable the `Show Developer Info` setting, then use the `Query Mod Origin` hotkey while hovering over a modded entity in-game, you can determine the internal name of that entity. Another approach is setting a breakpoint after the `ModLoader.GetMod` method call and inspecting the resulting `Mod` object. For example, you could inspect the `items` dictionary to find the `Name` property of the `ModItem` you are interested.

Another mod you can use is ["Which Mod Is This From"](https://steamcommunity.com/sharedfiles/filedetails/?id=2563851005): Enable everything in its config and it tells you the internal name of entities when hovered over.

# Call, aka Mod.Call (Intermediate)

Call is a method that requires cooperation from both the Called mod and the Calling mod. The Called mod will publish details on the variety of messages they accept and Calling mods wishing to inter-operate with those mods conform to the message format to send messages to the Called mod. 

To teach this concept, we will inter-operate with a popular mod utilizing Call: [Census - Town NPC Checklist](https://steamcommunity.com/sharedfiles/filedetails/?id=2687866031) (This mod lets us add our mod's town NPCs to an extended housing panel which lists their conditions. Very useful for players to know when a Town NPC can move in). First, we will find a place to get the Calls in the first place. The mod has a [wiki](https://github.com/JavidPack/Census/wiki/Support-using-Mod-Call) where the calls are explained. Reading this page, we find 1 message that we can send to Census. The page also instructs us to do `Call` in `PostSetupContent`, but this could be different for other mods. We now use the same technique as we did earlier and call `ModLoader.TryGetMod` to check if the mod is loaded. We must also make sure to follow the message format perfectly or risk errors. Let's now do the code as if we wanted to add Census support for ExampleMod:
```cs
public override void PostSetupContent()
{
    if (ModLoader.TryGetMod("Census", out Mod censusMod))
    {
        censusMod.Call("TownNPCCondition", ModContent.NPCType<Content.NPCs.ExamplePerson>(), $"Have either an Example Item [i:{ModContent.ItemType<Content.Items.ExampleItem>()}] or an Example Block [i:{ModContent.ItemType<Content.Items.Placeable.ExampleBlock>()}] in your inventory");
    }
}
```
Now, if we build our mod, we will see that our town NPC is added to the housing panel even if it hasn't moved in yet. 

`Mod.Call` is very useful, and is a very easy way for mods to communicate with each other. For info on how to implement receiving `Mod.Call` so other mods can interact with your mod, see the source code for Census or other open source mods. A fully commented showcase of calling other mods' Mod.Calls (including the most popular mod utilizing Call: Boss Checklist) and how to organize them can be found [in ExampleMod (ModIntegrationsSystem)](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/Systems/ModIntegrationsSystem.cs).

# Strong References, aka modReferences (Expert)

Strong references are easy, but prevent your mod from being loaded if the referenced mod isn't loaded. Strong References represent a hierarchy of mods where it would make no sense for the referencing mod to be enabled without the referenced mod. To begin, let's imagine we want to reference ExampleMod. First, add a line of "modReferences = ExampleMod" to your `build.txt`. You may want to specify a [minimum version](#strong-and-weak-references) as well. Second, make sure ExampleMod is downloaded and enabled. Third, we can code as normal, doing whatever you want. As an example, let's make a hotkey that sets Abomination and Purity spirit to defeated. First, we should add a using statement: `using ExampleMod;`. Next, in our `ModPlayer.ProcessTriggers`, where hotkeys should be processed, we can do this:
```cs
public override void ProcessTriggers(TriggersSet triggersSet)
{
    if (MyMod.ToggleChecklistHotKey.JustPressed)
    {
         ExampleMod.ExampleWorld.downedAbomination = true;
         ExampleMod.ExampleWorld.downedPuritySpirit = true;
    // ...
```
This example is extremely simple, but all manner of things can be done with a mod reference. Calling methods, accessing public variables, using the generic versions of `ModContent.ItemType` and `ModContent.NPCType`, and so on.

### Access Modifiers
If you find that you cannot access a specific class, method, or field, but others are working, that member might have a non-public access modifier. If you are unfamiliar with the meaning of access modifiers such as private and public, please read the [Access Modifiers (C# Programming Guide)](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/access-modifiers) to familiarize yourself. Something being non-public can either be an intentional design decision by the author of the mod you are referencing, or an oversight. Ask the mod author to update the mod to fix the issue if it is an oversight. 

## Visual Studio Steps

To properly code in Visual Studio, VS needs a reference to the `.dll` file contained within the `.tmod` file. Use the menus in tModLoader to extract the mod and find the `.dll` files (`Workshop`->`Manage Mods`->`More Info`->`Extract`). If no `.dll` file is extracted, the mod author has chosen not to allow it to be unpacked, so ask them nicely for it. By default, these end up in the `ModSources\ModAssemblies` folder of the [saves directory](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves) with a filename of `[ModName]_v[version].dll`. We recommend using this folder for referencing mod `.dll` files as it will simplify collaboration while avoiding other issues. Do not place mod `.dll` files inside your mod's source folder, it will end up packaged into the `.tmod` and bloat the file. If you do not want to use the recommended location and insist on keeping the mod `.dll` in the mod's source folder, you'll want to use [build.txt](https://github.com/tModLoader/tModLoader/wiki/build.txt) to ignore the file or the folder the file is in. Make sure that folder is not the `lib` folder, or you'll run into other issues. Add the reference by right clicking `Dependencies` in the solution explorer, then clicking `Add Project Reference`, then `Browse`, then the `Browse...` button, then navigate to the .dll and finally clicking `Add` and then `OK`. You will also need to save the changes to the project, `File->Save All` should work to do that.

![image](https://github.com/user-attachments/assets/5c5ebe45-b0bd-453b-94b0-21e8250c7cda)    
![image](https://github.com/user-attachments/assets/33db3383-a451-44d7-a349-d959b41b8a1f)

## Visual Studio Code Steps
All the information in the Visual Studio Steps except how to actually add the reference applies to Visual Studio Code as well. To add the .dll reference in Visual Studio Code, first navigate to the solution explorer and then click on the `.csproj` file entry. This will open the `csproj` file for editing. In the `.csproj` file text you should see an `ItemGroup` section nested under the `Project` section. If you do not, you can manually type it as shown or use the `Upgrade .csproj file` button in the Mod Sources menu to regenerate the `.csproj` file. 

![NVIDIA_Share_2025-06-10_12-11-04](https://github.com/user-attachments/assets/f6680bf7-6c6c-4d4f-8217-443e75ef90cd)

Next, we need to add a `Reference` section. We will now need the filename of the .dll file, if you are unsure of the filename open up the `ModSources\ModAssemblies` folder in your file browser and find the .dll file. Next, type the following, replacing the mod name, version, and file path as appropriate for the mod .dll file you are referencing:
```xml
	  <Reference Include="CheatSheet">
	    <HintPath>..\ModAssemblies\CheatSheet_v0.7.4.7.dll</HintPath>
	  </Reference>
```
The file should look like this in the end. Be sure to save this file, then verify it works by attempting to access the classes in the mod and seeing if autocomplete is working correctly. You can also verify by seeing if autocomplete will suggest the namespace.

![image](https://github.com/user-attachments/assets/104b81e3-ffb6-4e39-855f-90f045285eed)

![image](https://github.com/user-attachments/assets/86f5717f-2fb5-4917-a09e-97e8c4471d60)

![image](https://github.com/user-attachments/assets/abab2ca8-f44b-41c7-b030-f914866cd58f)

You can also expand the `Dependencies->Assemblies` section and look for the mod name. It should be there, but if it has a ⚠️ icon, you made a typo that needs fixing. If it is there without that icon it should be working.

![image](https://github.com/user-attachments/assets/39978c2c-c664-485b-9085-c61eac3ec735)

## Mod Documentation
If the mod you are referencing included documentation, you should be able to see those as well when working with those classes. Read [this](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#mod-documentation) for more information.

# Weak References, aka weakReferences (Expert)

Weak References have the same capabilities as Strong references, but they don't have the restriction that the referenced mod must be enabled to work. They do, however, necessitate much more careful programming. The process is largely the same, but instead of a "modReferences = ExampleMod" line in `build.txt` there is a "weakReferences = ExampleMod" line. You may want to specify a [minimum version](#strong-and-weak-references) as well.

Weak References necessitate careful programming. For example, if you have the code `ExampleMod.Common.Systems.DownedBossSystem.downedMinionBoss = true;` in a method that is called, but ExampleMod isn't loaded, the game will crash. With Weak References, you have to make sure that variables and classes that might not be loaded are never seen by the virtual machine as it runs the c# code. Some examples:
```cs
npcShop.Add<ExampleWings>();

// now for a cross-content item
if (ModLoader.HasMod("ThoriumMod")) {
	if (ThoriumMod.ThoriumWorld.downedStarScouter) {
		npcShop.Add(ItemID.Gel);
	}
}
```
In this example, the game will crash. You might think that the check for `thoriumLoaded` being `true` would prevent the game from crashing, but what happens is the .Net runtime will try to understand all the code mentioned in this method as it is invoked, and since it can't make sense of `ThoriumMod.ThoriumWorld.downedStarScouter`, it will crash.

Here is a solution that does work, moving the potentially unresolvable code to a property, effectively preventing the runtime from ever having to know about `ThoriumMod.ThoriumWorld.downedStarScouter` unless that mod is actually loaded:
```cs
if (ModLoader.HasMod("ThoriumMod"))
{
    if (ThoriumModDownedStarScouter)
    {
        npcShop.Add(ItemID.Gel);
    }
}

[JITWhenModsEnabled("ThoriumMod")]
public bool ThoriumModDownedStarScouter => ThoriumMod.ThoriumWorld.downedStarScouter;
```

The `JITWhenModsEnabled` attribute is required and is explained in the [JIT Considerations section](#jit-considerations) below.

Weak References are hard, but a neat thing to do. Many things, however, are much better off handled with `Mod.Call`. I hope this guide will help you choose the best approach to cross-mod content. In this specific example, ThoriumMod provides the `Mod.Call` documented on its [wiki](https://thoriummod.wiki.gg/wiki/Mod_Calls#GetDownedBoss).

## Inheritance
When inheriting from a class in a referenced mod, the class must be annotated with the [`ExtendsFromMod` attribute](#extendsfrommod) to prevent a crash if the reference mod is not loaded.

## Visual Studio Steps

Weak References also require the `.dll` file to work properly in Visual Studio. Read the [Visual Studio Steps](#visual-studio-steps) instructions in the Strong References section above.

## Testing
You may mistakenly think that your weak reference is working because you disabled the weakly referenced mod and your mod still loads. This is a false positive. To properly test weak references, you **must** disable the referenced mod and then close and re-open tModLoader.

## Recommendations
The best practice is to put all code that directly uses a weakReference (potentially optional one), in a separate class. You can annotate the class with `[JITWhenModsEnabled("ReferencedModName")]` so the whole class is excluded from the JIT process. This can simplify logic and ensure that the JIT (Just-In-Time) compiler never has to resolve unresolvable references when they aren't available, preventing a crash. [ItemChecklist's MagicStorageIntegration.cs](https://github.com/JavidPack/ItemChecklist/blob/1.4/MagicStorageIntegration.cs) shows this approach. Also note how the methods of this class are only called if MagicStorage is loaded. Another approach for self-contained logic is a `ModSystem` class using `ExtendsFromMod` to prevent the `ModSystem` from autoloading if the referenced mod doesn't exist. Using `JITWhenModsEnabled` and overriding `IsLoadingEnabled` and checking `ModLoader.HasMod` is also an option.

# No References, aka reflection (Expert)

Using [reflection](https://github.com/tModLoader/tModLoader/wiki/Reflection) to do cross mod is not ideal. For one, reflection relies on strings for accessing classes and fields of the target mod. As the target mod updates and changes, your mod will fail as well unless you program defensively. This option is not cooperative and can be inefficient. It is a poor choice, but is useful when avoiding dependencies and is necessary when accessing private members of other mods. It is much better if you work together with the author(s) of the other mod(s), so they can open up their mod for modifications you want to make with your mod. Using Github together is your best bet!

# JIT Considerations
tModLoader inspects all classes and methods of each mod as it loads. This will cause issues for mods weakly referencing members of other mods. To avoid this issue, modders need to annotate members with special `Attributes`.

### JITWhenModsEnabled
`[JITWhenModsEnabled(...)]` excludes a class/method/property from the load time JIT inspection, preventing a load crash. The [JIT Exception weak references](https://github.com/tModLoader/tModLoader/wiki/JIT-Exception#weak-references) page has more info about this topic.

### ExtendsFromMod
If you are inheriting from a base class in the mod you are weakly referencing, you can use the `[ExtendsFromMod(...)]` attribute to specify that the mod should not be autoloaded or considered at all when mods inspect other mods. Here is an example:    

```cs
[ExtendsFromMod("ExampleMod")]
public class ExampleItemSubclass : ExampleItem
{
}
```
If your `ModX` class depends on another mod being loaded, but not necessarily inheriting from classes in that mod, you can still use `ExtendsFromMod` to prevent it from being loaded.

If you're having issues with using reflection to iterate types in your assembly elsewhere, make sure you're using tModLoader's `AssemblyManager.GetLoadableTypes` instead of directly using `someAssembly.GetTypes`. This stops your code from trying to load potentially unloaded types.

# Minimum Reference Version
It is useful to limit referenced mods to a minimum version. For example, if the content of the referenced mod that you wish to interact with was added in v2.0, we would only want to attempt to access that content if the user is loading v2.0 or higher of that mod. Attempting to access content or classes that do not exist in the referenced mod will lead to loading errors or bugs.

## Strong and Weak References
For strong and weak references, we can add the minimum version to the `modReferences` or `weakReferences` line in `build.txt`. We simply add `@` and then the version number to the mod name. For example "weakReferences = ExampleMod@2.0" would specify that ExampleMod must be v2.0 or higher. This version qualifier prevents your mod from loading with older versions of the referenced mod. Make sure to update this value whenever your mod references a feature added in a newer version of the mod.

## Mod.Version
We can check the version of a referenced mod in code for more dynamic behavior. This is particularly useful for manually implementing a minimum version check for mods not using the strong or weak dependency approaches. `Mod.Call` are sometimes updated in mod updates as well, so checking a referenced mod's version ensures that you do not attempt to use an unsupported `Mod.Call` if the user is loading an older version of that mod.

```cs
if (ModLoader.TryGetMod("ExampleMod", out Mod exampleMod)) {
	if (exampleMod.Version >= new Version(2, 0)) {
		// ExampleMod 2.0 specific logic here.
	}
}
```

# Dependency Mod Considerations
There are several things an author of a mod intended to be used as a dependency should keep in mind. Read this section if you are making a library mod or a content mod you expect other mods to expand on.

## Access Modifiers
Declaring appropriate access modifiers is an important step for preparing your mod to be used as a dependency of other mods. If you are unfamiliar with the meaning of access modifiers such as private and public, please read the [Access Modifiers (C# Programming Guide)](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/access-modifiers) to familiarize yourself. 

Mods should use `public` to exposed classes and members to other mods while using `internal` and `private` for things that are not intended to be accessed. You should also try to keep the names of classes, fields, and methods that are `public` unchanged in updates to your mod. The `Type`s and parameters as well should remain unchanged. The reason for this is any mod depending on your mod will break if it was using any of those changed things, and your users will be disappointed because they can no longer continue their playthrough. Some might refer to these public members as the "public API" of a mod. On the other hand, it is perfectly fine to change `internal` and `private` members in updates, since no mod should be accessing them directly unless they are deliberately bypassing the design of how your mod operates.

### Library Mod
When making a library mod, you'll want to expose as `public` only the methods those mods should be using. This makes is easier for those authors to know how to use your library. 

If you need to change the parameters of a method, consider keeping the current method around and annotating it with `[Obsolete("Use X instead", error: true)]`. The `error` parameter being `true` will force dependent mods to update to the new method the next time they build the mod, but the mod will still work as-is as long as the obsolete method still has the functionality. This approach is used in tModLoader as well, see [the tModLoader Style Guide](https://github.com/tModLoader/tModLoader/wiki/tModLoader-Style-Guide#adding-a-parameter-to-a-hook) for more information about marking methods as obsolete.

### Content Mod
For content mods, dependent mods will likely want to access all of the content classes directly, such as `ModContent.ItemType<YourModItem>()`. This will make it easier to make recipes using your items and reuse projectiles and other content from your mod. For this reason, we suggest that content classes are declared as `public`. 

## Mod.Version
The intention of `Mod.Version` is to indicate how "big" of changes had occurred since the previous release. If your mod needs a complete redesign, it should most likely be accompanied by a change in the `Major` number of the `Version`. For example, `v1.3` changing to `v2.0` would indicate that the mod has changed significantly and likely has a new "public API".

## ModType
A `ModType` can greatly simplify loading content from other mods. The [Custom ModType Example pull request](https://github.com/tModLoader/tModLoader/pull/4611) is a great resource for learning about implementing a custom `ModType`.

## Mod.Call
Exposing a `Mod.Call` API can be useful, see the information in the [Call, aka Mod.Call (Intermediate) section](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content#call-aka-modcall-intermediate).

## Documentation
Including documentation directly in your mod means that modders will see that documentation in their IDE. Be sure to read [this wiki section](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#mod-documentation) to learn how to include documentation in your mod.

## Wiki
A developer facing wiki can be useful, especially for library mods. A wiki can include information for using the `Mod.Call`, inheriting from base classes, and other things. The [Boss Checklist GitHub wiki](https://github.com/JavidPack/BossChecklist/wiki) is a good example of a such a wiki.

## Inheritance
If you expose a class with the intention of it being inherited in other mods, there are a few small things to be aware of, especially if you have `abstract` classes other mods might inherit from:

### ModType.Mod
`ModType.Mod` refers to the `Mod` the class belongs to, this is not necessarily your mod when other mods are inheriting from content in your mod! 

For example, calling `Mod.GetLocalization("CommonMessage")` will return the `Mods.MyMod.CommonMessage` localization entry when called on content from your mod, but will return the `Mods.OtherMod.CommonMessage` localization entry when called on content from other mods inheriting from your class. This behavior is desired in some situations, and undesired in others. If this is not what you intend, be sure to use `ModContent.GetInstance<MyMod>().GetLocalization("CommonMessage")` in these situations.

It is up to you as the author of the dependency mod to ensure that the logic in your code works as intended for content in your mod and from other mods inheriting from your classes.