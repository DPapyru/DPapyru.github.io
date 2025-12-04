# Why Use an IDE
This page will hopefully convince you to abandon making mods in Notepad. Be sure to click the links below to watch the videos. All info presented corresponds to [Visual Studio](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio), but other IDEs such as [Rider](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Rider) and [Visual Studio Code](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio-Code) have similar functionality.

# Syntax Error Checking    
When you make a syntax error, you'll see red underlines under the bad code, similar to a spell check.    
![](https://i.imgur.com/dwskGkr.png)    
You can hover over the error to see an explanation.    
![](https://i.imgur.com/a80jrK8.png)    
Seeing the explanation above, we can fix the code easily by changing `20.5f` to just `20`.

## Simple Misspellings
Visual Studio can fix simple misspellings as well. 

https://github.com/tModLoader/tModLoader/assets/4522492/5bab82f0-84dd-4b7d-8623-68c70275e8a4

## Show Potential Fixes
Sometimes Visual Studio can guess how to fix your error. For example, below we forget to add `using Terraria.ID;` to our ModItem class.    
![](https://i.imgur.com/dq7v87C.png)    
Clicking `Show potential fixes` or pressing the hotkey shows the following options.
![](https://i.imgur.com/BivfnXZ.png)     
Clicking the first option adds the appropriate using statement to our code. We can fix errors without trying to build in-game.

https://github.com/tModLoader/tModLoader/assets/4522492/9055c84c-fe13-4cb9-bf54-6a201cc5db31

# Autocomplete / Intellisense

## Field names
A common problem with new modders is that they don't know all the Terraria variable names or method names. For example, the various biomes/zones have names that aren't always what you might expect. You'll still need a little experience to know which class to look for these variables, but Intellisense helps immensely. In the video below, we see Intellisense suggesting the available Zones and downed bosses. Notice how Plantera being defeated is `downedPlantBoss`. This is why Intellisense is so valuable to a self-sufficient modder.     
![](https://i.imgur.com/CkGOuta.png)    

https://github.com/tModLoader/tModLoader/assets/4522492/8565bfed-b085-416c-841a-b5c409b0339c

### ItemIDs, NPCIDs, ProjectilesIDs, etc...
While you can waste your time looking up various vanilla IDs in our [reference pages](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs), it is much easier to just let Autocomplete do the work for us! Simply start typing your guess for the ID name and you will quickly see suggestions. You can select a suggestion to autocomplete it. How nice is that?    
![](https://i.imgur.com/8VpUJFF.png)

## Method names and parameters
Method names are also suggested in the same way. In addition, you can see the method parameters, both their names and types. For example, I'd like to add a buff to an enemy when I hit him with my sword. Typing `target.AddBuff(` will bring up the parameters, helping me complete my call to the AddBuff method.     
![](https://i.imgur.com/Oml4sUU.png)      

https://github.com/tModLoader/tModLoader/assets/4522492/df0ed4f6-80b2-4158-b440-178b2fbfa340

## Override
An extremely common task when making mods is to override various hooks such as `SetDefaults` or `UpdateAccessory`. Remembering the parameters to these hooks is sometimes hard to do. By using Visual Studio, you can easily write "override" followed by a space, followed by a few letters of the method you want to override, and then enter to easily override hooks. As a bonus, any missing using references will automatically be added to your code.     
**Before:**    
![](https://i.imgur.com/uOQMDHx.png)    
**After:**    
![](https://i.imgur.com/KpQARfo.png)     

https://github.com/tModLoader/tModLoader/assets/4522492/2715244e-b526-46b2-bfc9-1cdd82d15c46

## Cross Mod
By using the extract mod feature, `[Modname]_v[Modversion].dll` (and optionally a `[Modname]_v[Modversion].xml` documentation file if it exists) will be placed in `Terraria\tModLoader\ModSources\ModAssemblies`. This file can be added as a dll reference to your .csproj if your mod has a strong or weak reference to another mod (you'll still need the build.txt entries). This path is consistent and accessible from the Mod Sources folder, meaning that the reference added to .csproj is portable for all contributors for your mod, provided they extract the referenced mod on their computer. By doing this, you can enjoy auto-complete for the API provided by the mods you reference as well. Read more on that [here](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content).

# Build
You can build the mod from your IDE. In VS, find the `Build->Build [ModName]` menu to build the mod. Note that this is usually less useful than just debugging, but it can have some uses. Also note that attempting to build the mod while it is loaded in an open client won't work.

# Debug
With an IDE, such as VS, you can debug your mod. Debugging is the best way to pinpoint issues in your mod and solve them. While debugging, you can set 'breakpoints' which will make the application 'stop' and pause itself when it gets to that point. During this pause you can inspect what is happening, by for example looking at the values of variables in scope. You can quickly resume the application, or step over code to try to find the cause of a problem. To learn more about debugging, see its [own guide](Learn-How-To-Debug).

## Edit And Continue
With Edit And Continue (or eac) you can edit code after you've hit a breakpoint and see the effect of your edits in game immediately, rather than having to rebuild your mod manually. This is extremely useful for positioning projectile spawns or tweaking item defaults. Be sure to read [edit and continue](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio#edit-and-continue) in order to use this feature. Note that things like `ModItem.SetStaticDefaults`, `ModTile.SetDefaults`, or other code might only run when the mod is loading, so they cannot benefit from eac.

### Simple Example
In this video, we see 2 Example Gun spawned. After the first is spawned, a breakpoint is set in SetDefaults. Once it is hit, the game is paused and Visual Studio comes to the front. Then, `item.damage` is changed from 40 to 80. We press continue and we can hover over the 2 items and see that the second item was spawned with 80 damage. 

https://github.com/tModLoader/tModLoader/assets/4522492/34bba15f-23d0-4484-bee2-b8f5e8de8533

### Another Example
In the [Basic Projectile: Drawing and Collision](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#drawing-and-collision) guide, an example is shown using a breakpoint to test values for `ModProjectile.SetDefaults`: [Video](https://user-images.githubusercontent.com/4522492/265848754-d17b18ad-1d4b-46fb-90ee-dfa43789e484.mp4)

# Documentation
tModLoader will automatically provide documentation XMLdoc files, you can see documentation for a method when you hover it. This is the same info contained in the [online documentation](http://tmodloader.github.io/tModLoader/), just more easily accessible. For example, when the `override` menu is active, clicking on an entry will show the documentation for that method where the purpose and potential usages of that method can be viewed:    
![image](https://user-images.githubusercontent.com/4522492/184468884-b177fc6f-9050-4ae5-bff1-e9fab0140a7c.png)    

Hovering over an existing overridden method will also show the documentation:    
![image](https://user-images.githubusercontent.com/4522492/184468903-31fa6b84-a1d4-4754-b6d0-9aacf226a00c.png)    

Hover over a method parameter to see details on what the parameter does:    
![image](https://user-images.githubusercontent.com/4522492/184468932-a82c9cc9-6562-4ffd-be0c-0bed8e9ebecb.png)   

Hover over fields or methods to see details:     
![image](https://user-images.githubusercontent.com/4522492/184469232-b8333cff-a678-46e4-a33f-707cbbb63318.png)    
![image](https://user-images.githubusercontent.com/4522492/184469241-39eb4c8e-aeb9-48c4-8bc2-1c21c78d2747.png)    

Note that the amount and distribution of documentation is driven by modder feedback. If you find something that needs documentation, feel free to suggest it in the Discord chat.

## Documenting your own Mod
Documenting your own mod can be useful, once the mod becomes complex. Try to document things that are important, but don't feel pressured to document everything, this is all for your own benefit (unless you intend for other mods to use these methods, see the next section). Writing readable code is better than documenting nonsensical code, after all. For more information on writing documentation, see [XML documentation](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/xmldoc/). The easiest way to document a method is to type `///` the line above a method, Visual Studio will autocomplete the template and you can type notes.

## Mod Documentation
Modders making mods with API to be used by other mods can include `[ModName].xml` files in their mod and they will be automatically extracted alongside their `.dll` file and placed in `Terraria\tModLoader\ModSources\ModAssemblies` for easy collaboration (provided `hideCode` is not true, which would be counter-productive for a mod expecting to be referenced by other mods.). XMLdoc files for mods can be generated in Visual Studio during a regular build and should be named [ModName].xml and placed in the root of the mod's source folder.

To have Visual Studio generate documentation, add the following to the `PropertyGroup` section in your `.csproj` file:

```xml
<PropertyGroup>
	<GenerateDocumentationFile>True</GenerateDocumentationFile>
	<DocumentationFile>$(AssemblyName).xml</DocumentationFile>
</PropertyGroup>
```

To edit the `.csproj` file, either right click on the project in Visual Studio and click `Edit Project file` or open the file directly in a text editor.

You'll want to document any public methods and fields that you expect modders to use. To do this, type `///` on the line above the field or method. This will cause Visual Studio to generate the documentation stub, after that add any information you want to the `summary` section. You can look at the [`ModItem` source code](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/ModLoader/ModItem.cs) to see what useful documentation should look like. If you find the "Missing XML comment for publicly visible type or member X" warning annoying, feel free to add `dotnet_diagnostic.CS1591.severity = none` to your `.editorconfig` file or add `<NoWarn>1591</NoWarn>` to the `PropertyGroup` section along with the other new lines to ignore this warning.

Whenever you update the documentation, remember to build from Visual Studio at least once before release to update the `.xml` documentation file.

To use documentation from other mods, simply follow the steps in the [Expert Cross Mod Content guide](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content#visual-studio-steps). If a `[Modname]_v[Modversion].xml` file shows up in the `ModAssemblies` folder, it included documentation. Remember that we suggest leaving the referenced `.dll` files in the `ModSources\ModAssemblies` folder rather than copying them to your mod's source code folder, but if you do move the `.dll` file make sure to copy over the `.xml` file as well. Now, hover over any documented member as you normally would and you should see documentation show up if the mod author has documented that member. Many mods maintain documentation on their homepage or GitHub wiki, be sure to check those locations out if an `.xml` documentation file is not included in the mod. 

# Find All References (Ctrl-K, R)
Find all references makes it easy to locate all usages of a variable in your whole project. Simply right click on a variable and click `Find all references`. This is very useful to see where you assign and use your variables.     
![](https://i.imgur.com/QCUdJdc.png)    

https://github.com/tModLoader/tModLoader/assets/4522492/e37f0e9a-2bf7-4704-8e90-a5bf0a26d1ce

# Go To Definition (F12, Ctrl-Left Mouse Click)
By clicking on a variable or classname, you can press F12 (or Ctrl-Left Mouse Click) and Visual Studio will bring you right to where that class or variable is declared. If you do this on a class not in your code, such as the Terraria class `Dust` or the XNA class `Rectangle`, you will be led to a page with just the variables and methods, not the actual code. It is very useful to be able to read the Terraria code directly. Follow the "Go To Decompiled Code" section below to enable navigating directly into decompiled code, allowing you to view that code as well.    

https://github.com/tModLoader/tModLoader/assets/4522492/a19265ee-8f0c-4e33-a1c0-554c3b6bab75

## Go To Decompiled Code
By default, the `Go To Definition` command will not allow you to see the tModLoader/Terraria source code. We can enable this feature to make modding much more productive. In Visual Studio, use the search (Ctrl-Q) to search for "decompile source". Click on "Enable navigation to decompiled sources" and then check the checkbox and click "OK":    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/45b1ccc1-bcdd-444f-b507-18d4d5c227e6)    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/1b1fd419-38cd-4fb8-a85b-670486bf947a)    

From now on, you should be able to use the `Go To Definition` command to view decompiled Terraria code. Try it now by typing `Main.npc[0].CanBeChasedBy();` and use the `Go To Definition` command on `CanBeChasedBy`. After a delay as Visual Studio decompiles tModLoader, you should see the code of the `NPC.CanBeChasedBy` method:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/9a94f9f2-7192-45d6-bd0c-027309536919)

# Rename (F2)
Imagine you name a variable or class something stupid and want to change it. Without an IDE, you would have to manually check each file the variable is used in and edit the text. Even something like "Find and Replace" would be error prone if you use similar names for other variables. Using the Rename function, you can easily rename classes and variables. Be aware that if you are using methods like `mod.ItemType("Name")` rather than `ModContent.ItemType<Name>()`, this won't work. This is also a great reason to use the <> type methods for ItemType and NPCType, it is much easier to maintain. In the video, we rename a variable called `examplePet` to something better, `airplanePet`.         
![](https://i.imgur.com/PInjsqm.png)    

https://github.com/tModLoader/tModLoader/assets/4522492/88a34158-cbfc-4eb6-8f19-81d1eaa9cc79

# Parameter Info (Ctrl-Shift-Space)
Some Terraria methods have many many parameters. It can be hard to remember the order and types of those parameters. If you'd like to see the parameters of something like Item.NewItem or Projectile.NewProjectile, simply place your cursor inside the method and press `Ctrl-Shift-Space`. You can navigate left and right and watch the bold parameter change. Press up and down to switch between overloads of the same method.       
![](https://i.imgur.com/D0f2NM6.png)    

https://github.com/tModLoader/tModLoader/assets/4522492/61c8ca1e-fe95-40c7-93f2-d8460edeb97a

https://github.com/tModLoader/tModLoader/assets/4522492/571f8868-7094-4815-ad23-d0250dce15b5

# Goto (Ctrl-,)
An extremely useful shortcut, Goto allows you to quickly navigate to and class, method, or field in your code. Simply type `Ctrl-,` and the Go to All window will pop up. Type the name or part of the name and select the item to quickly navigate to the code. You can also type the first letter of each word in a name to find it. For example, typing `eqf` will suggest `ExampleQuestFish`. Visual Studio will smartly handle misspellings and partial matches as well. The video shows just how quick this feature can be and how easy it is to quickly navigate to other places in your code.         
![](https://i.imgur.com/TUthjgE.png)    

https://github.com/tModLoader/tModLoader/assets/4522492/24e0cb32-6c07-4635-9e90-f692dfc54534

# Quick Actions and Refactorings (Ctrl-.)
This context sensitive hotkey is useful in several situations. The suggestions depend on where the cursor is or what text is selected. Here are some useful actions:
## Introduce Local for All Occurrences
If you are repeating yourself a lot in your code accessing the same object via fields and methods, sometimes your code can get a bit repetitive. Making a local variable and re-using that variable makes the code much cleaner. If you highlight the first occurrence of repeated object access, you can use this action to quickly introduce a local variable that you can then give an appropriate name to.

https://github.com/tModLoader/tModLoader/assets/4522492/7f8be194-6862-4056-b91d-70e611320cab

# Format Document (Ctrl-E, D or Edit->Advanced->Format Document)
Properly formatted code is key for readability. Make sure to run this command before asking for help with your code as nothing is more annoying that poorly formatted code. 

https://github.com/tModLoader/tModLoader/assets/4522492/03e49732-da87-454f-8ab8-5b71c578f752

# Structure Guide Lines
Sometimes, especially in Projectile and NPC AI, you might get lost within your code. This is especially true with nested if statements. Hover over the dotted lines to quickly see where you currently are in your code. For example, here I easily see at a glance where in the logic of my AI I currently am.         
![](https://i.imgur.com/nVR628X.png)    

# Code Folding
Folding code by pressing the `-` or `+` buttons can be useful if you need a wider perspective on your code.    
![](https://i.imgur.com/BcgwF5H.png)    

# Goto Brace (Ctrl-])
Using this hotkey is useful when navigating vanilla code with large blocks of code within braces. 

https://github.com/tModLoader/tModLoader/assets/4522492/86ea2d85-b84a-4e11-b4f3-427b222b4dad

# Launch Profiles
Launch profiles can be setup to streamline mod development and testing. For example, a profile can be setup to launch the game directly into the world, skipping the player and world select menus. Launching the debugger directly into the game saves time and clicks. Other uses of launch profiles include testing specific mod packs and maintaining a mod-specific save directory for organizational purposes. See [Using Command Line Arguments for Debugging](https://github.com/tModLoader/tModLoader/wiki/Command-Line#using-command-line-arguments-for-debugging) to learn how to use this feature.

# C# Interactive
Did you know that `3/2` in c# is `1` not `1.5`? Sometimes you might want to experiment with some c# syntax, but don't want to make a mod just to test the code. The c# interactive window is very useful for this. You can do whatever you want in the c# interactive, each command will execute it after you press enter. `Alt-UpArrow` can be used to bring up previous statements.       
![](https://i.imgur.com/F6YABM2.png)    

https://github.com/tModLoader/tModLoader/assets/4522492/9e1f8d4f-c000-47d5-bb8c-61e0b5b90276

# Git integration
Git integration allows you to interact with your GitHub repository directly within your IDE. You can view diffs and make commits directly within your IDE. We recommend finding guides on Google to learn more.

# Visual Studio Live Share
This feature lets you invite someone into your project and collaboratively work on the code. Useful for mentoring other developers on your mod team or getting help on a tricky problem. Pair with Discord chat for voice chat.