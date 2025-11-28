# What is tModCodeAssist?
`tModCodeAssist` is a [custom code analyzer](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/overview) that provides code fixes for mod projects. It is included in tModLoader and is automatically enabled. To take advantage of `tModCodeAssist`, make sure your [IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE) is properly configured according to our guides.

The purpose of `tModCodeAssist` is to help modders create readable code. For example, when following the [Vanilla Code Adaption guide](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption), a modder might end up with `int dust = Dust.NewDust(projectilePosition, 1, 1, 175, 0f, 0f, 0, default(Color), 1f);` in their source code. The number `175` corresponds to a specific dust, but it is impossible to know which dust just from the number alone. Rather than look up the number in `DustID.cs`, `tModCodeAssist` will suggest a code fix that will automatically change `175` to `DustID.SpectreStaff` and the modder can choose to apply it to their code.

Another purpose is to prevent modders from mixing up IDs. For example, new modders frequently mix up `ItemID` and `TileID` when making a Recipe for their items, leading to the mod not working for no discernable reason. `tModCodeAssist` detects these misused ID values and reports an error to the modder.

All of these issues will be reported in the `Error List` tab in your IDE:
![Error List tab](https://github.com/user-attachments/assets/34422bb7-81db-4514-9b67-9be15fd570e9)

## Applying Code Fixes
To use the code fix suggestions, simply hover over the green underlined code and click "Show potential fixes" and then the appropriate suggestion. (Or, place the cursor, type the `ctrl-.` hotkey, then click the appropriate suggestion) This works in the exact same manner as the [code fixes provided by your IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#show-potential-fixes).

<blockquote>

### **Show potential fixes:**
![Show potential fixes](https://github.com/user-attachments/assets/7e5c9397-8593-46ea-a820-28b2821e97e1)

### **Change magic number:**
![Change magic number](https://github.com/user-attachments/assets/698e3353-1379-488e-b719-390193a5eee1)
</blockquote>

In the above example, `Item.rare = 3;` was changed to `Item.rare = ItemRarityID.Orange;`. You can still hover over `ItemRarityID.Orange` to see that it has the value of `3`.

## Applying Code Fixes to whole File or Project

Clicking the "Fix all occurrences in: Project" option is a great choice for applying these code fixes to the whole mod all at once.

<blockquote>

![Fix all occurrences](https://github.com/user-attachments/assets/26d03366-a946-4925-adb4-b8f488ba195d)    
</blockquote>

# Diagnostics
Below are the current diagnostics and code fixes provided by tModCodeAssist. You can easily navigate to these entries by clicking the hyperlink in the Code column of the Error List panel in your IDE:    

![](https://github.com/user-attachments/assets/0b23bd60-a5f6-4b38-a741-a24c26f42744)

## ChangeMagicNumberToID
Severity: ⚠️ Warning

This diagnostic will warn of ["magic numbers"](https://en.wikipedia.org/wiki/Magic_number_(programming)) and suggest changing them to their appropriate value from their corresponding ID class. For example, `Item.useStyle = 1;` will be changed to `Item.useStyle = ItemUseStyleID.Swing;`. Since modders deal with decompiled Terraria, we usually end up with raw numbers when [adapting vanilla code](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption). This diagnostic and code fix will restore the original meaning of those values for the modder and leave the code much more readable. [PR](https://github.com/tModLoader/tModLoader/pull/4727).

## BadIDType
Severity: ⛔ Error

This diagnostic will error if an incorrect ID class is used in a place where another ID class is expected. For example, `recipe.AddTile(ItemID.WorkBench)` will error because the modder has mistakenly used an `ItemID` value for a method that expects a `TileID`. Since ID values are just numbers, without the error this code would result in the Presents tile being the crafting station instead of the Workbenches tile because `ItemID.WorkBench` has a value of 36 and that is the same as `TileID.Presents`. 

To fix this issue, change the ID class and let [Autocomplete / Intellisense](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#autocomplete--intellisense) help you find the correct entry. If you can't find the entry in the correct ID class, consulting the [Vanilla Content IDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs) might help. There are several ID class entries that don't match the English name, so you might need to look them up. Also note that tiles can have multiple styles in the same TileID, such as how `TileID.MythrilAnvil` corresponds to both the Mythril Anvil and the Orichalcum Anvil. [PR](https://github.com/tModLoader/tModLoader/pull/4742).

## CommonCollisionName
Severity: ⛔ Error

This diagnostic will error if a namespace or classname matches one of several frequently used Terraria classes. For example, attempting to make a namespace named `MyMod.Item` will error. The reserved names currently include: "Main", "Mod", "Player", "Item", "NPC", "Projectile", "Gore", "Dust", "Entity", "Liquid", "Mount", "Tile", "Recipe", "ModPlayer", "ModItem", "ModNPC", "ModProjectile", "ModGore", "ModDust", "ModType", "ModMount", "ModTile", and "ModWall". New modders frequently make an `Item` namespace, which in turn leads to situations where the compiler can't rectify the name collision and will throw errors with lines of code like `Item.value = Item.buyPrice(gold: 12);`. 

We recommend that modders name their namespaces with plural nouns, such as `Items` or `Projectiles` to prevent namespace collisions with Terraria classes (which are usually singular nouns). [PR](https://github.com/tModLoader/tModLoader/pull/4746).

## SimplifyUnifiedRandom
Severity: ℹ️ Info

This diagnostic suggests changing `if (Main.rand.Next(3) == 0)` to `if (Main.rand.NextBool(3))`. These are logically the same, but the `NextBool` approach is more expressive of code intent and helps avoid mistakes for new modders who might not understand what the original code was doing. [PR](https://github.com/tModLoader/tModLoader/pull/4727).

## SimplifyLocalPlayer
Severity: ℹ️ Info

This diagnostic suggest changing `Main.player[Main.myPlayer]` to `Main.LocalPlayer`. These two are logically the same but `Main.LocalPlayer` is more expressive of code intent. [PR](https://github.com/tModLoader/tModLoader/pull/4748).

# Configuring Code Fixes
There are extremely rare situations where the code fixes suggestions might not be desired by the modder. 

<details><summary>Details</summary><blockquote>

The modder can configure the code fixes using their IDE. Code fixes can be suppressed to varying scopes using the options provided.

![Suppress](https://github.com/user-attachments/assets/80a61eb0-f147-43d9-8bdd-44fe17b4382a)

</blockquote></details>

# Contributing New Features to tModCodeAssist
We welcome community contributions that add new features to `tModCodeAssist`. Writing Code Analyzer code is quite different from writing "normal" C# code and the process can be quite daunting, but there are simple templates modders can follow to easily add capabilities to the existing code fixes. 

## Adding to the `ChangeMagicNumberToID` Analyzer
This section will teach how to add to the `ChangeMagicNumberToID` code fix feature of `tModCodeAssist`. This means if some field or method parameter isn't currently being fixed to a ID class entry, we can add it and it will then work as expected. This guide assumes you already know how to [setup the tModLoader source code](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-contributors#getting-the-tmodloader-code-for-the-first-time) and make pull requests. See the [tModLoader guide for contributors guide](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-contributors) if that is not the case.

We will be using [this pull request](https://github.com/tModLoader/tModLoader/pull/4747) as a guide for the rest of this section. Open up the "Files Changed" tab and follow along:

1. If the ID class you want to add support for is not included in `tModCodeAssist.csproj` yet, add it by manually editing the file in the manner shown in the example.
2. Add the "binding" to `MagicNumberBindings.cs` by following the example. A "binding" is simply a mapping between a field (or method parameter) and the ID class it should be using. If the ID class does not have a `IdDictionary Search` field, you'll need to provide the `idType` argument matching the `Type` of the `const` fields in the ID class. Otherwise, you should not provide that argument.
3. Add new lines to existing tests in `ChangeMagicNumberToIDUnitTest.cs` that demonstrate the new code fix. In this file you'll see 2 versions of a code snippet in each test. The first is the original code and the second is the code after the code fixes from this analyzer have been applied. Adding a single line to test your new binding is usually sufficient. Take note of the special `[|number|]` syntax in the original code snippet indicating where the code fix should be applied.
4. Run the tests to ensure they work:
    <details><summary>Expand for instructions </summary><blockquote>
    
    Right click on the `tModCodeAssist.Tests` project in the solution explorer and click `Run Tests`.
    ![Run Tests Button](https://github.com/user-attachments/assets/628dee98-c215-488f-bf43-e56c0c39a061)
    
    This will open the `Test Explorer` window. Verify that the tests all pass. You might want to deliberately sabotage the test as a sanity check to confirm that it fails as expected as well.   
    ![Test Explorer window](https://github.com/user-attachments/assets/cdf97bde-1541-4222-a572-c9e20b4d3002)    
    </blockquote></details>

5. If ExampleMod has any missing ID values, we want to fix these and add them to our pull request. To do this, first build the `Terraria` project. This should result in ExampleMod seeing the updated `tModCodeAssist.dll` file. You should now see the fix suggestion.
6. Make the pull request as normal.

## Adding completely new feature to tModCodeAssist
For a completely new feature, you'll need to be more familiar with code analyzers to be successful. The [Tutorial: Write your first analyzer and code fix](https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/tutorials/how-to-write-csharp-analyzer-code-fix) official guide is a good place to get started learning. Compare what you learn in that tutorial to the `tModCodeAssist` code to get even more familiar with how it works. Another good resource is [RoslynQuoter](https://roslynquoter.azurewebsites.net/), on this website you can convert C# code to the corresponding syntax tree representation. This will help you make sense of how the code is represented. Similarly, Visual Studio has a built-in Syntax Visualizer accessed from `View->Other Windows->Syntax Visualizer`. You can use it for the same purpose.

If you have any further questions or want to discuss, come to the [Discord server](https://discord.gg/tmodloader) where development happens, we'd be happy to guide you.