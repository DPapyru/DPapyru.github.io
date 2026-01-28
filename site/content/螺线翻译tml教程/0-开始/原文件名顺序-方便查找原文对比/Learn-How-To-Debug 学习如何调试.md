# What is Debugging?
Debugging is how modders investigate problems in their code in an attempt to fix them. The mod builds fine, but the mod does not behave as expected. Inevitably, something in your mod will not work as intended. When this happens, you'll need to "debug" the mod to determine where the issue is happening.

Debugging can take many forms, this guide will focus on 3 approaches: [Isolation Debugging](#Isolation-Debugging), [Text Debugging](#Text-Debugging), and [Debugger Debugging](#Debugger-Debugging). 

This guide focuses on tModLoader modding. The official [How to debug for absolute beginners](https://learn.microsoft.com/en-us/visualstudio/debugger/debugging-absolute-beginners?view=vs-2022&tabs=csharp) guide is a great resource for general C# debugging and covers a few more conceptual topics as well as general C# debugging. It is highly recommended that modders read that as well. 

# Isolation Debugging
The first step when encountering a bug is to isolate it as much as possible. Testing with a new world and new player can rule out many sources of issues. Additionally, other mods are a big source of unknown behaviors, the bug you are seeing could potentially be a feature or a conflict with one of them. 

Disable all other mods and make sure the bug still exists, if it does, that means the problem is in your code, which means you can fix it. If the bug does not exist, you'll need to figure out which mod is causing the issue by loading individual mods with your mod. If the bug happens with only one other mod, it might be a bug from that mod. Collaborating with that modder to fix the issue might be necessary.

Once you know a bug is caused by your mod, you'll want to identify where the issue is coming from. The following sections will help you discover the issue. 

# Text Debugging
If you are not familiar with using a debugger like Visual Studio or just need to quickly visualize some data, then debugging via text can be useful. Do note that eventually you'll want to learn [Debugger Debugging](#Debugger-Debugging) because it is quicker and more powerful.

Text debugging, simply put, is printing text that you can read in an attempt to identify an issue. For example, if some math operation isn't giving the results you expect, printing the values out can help identify the issue. First, let's explore the text debugging methods available:

## Text Debugging Methods
The following are typical approaches for text debugging in tModLoader. With all of these approaches, make a string from the data you want to output. For example, if you have a variable called `total`, you might want to make a string `$"The Total is: {total}."` and pass that into any of these methods. To learn more about creating a string from text and data, see this [C# String Interpolation](https://www.w3schools.com/cs/cs_strings_interpol.php) tutorial.

### Main.NewText
This method outputs text to the in-game chat window. This is simple and straightforward. The text will be easily visible and will disappear after some time.   

`Main.NewText($"Using Main.NewText: Current health: {player.statLife}.");`:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/6eacdbe3-9b39-4e0e-8c54-1fc7b0aefdc8)        

### Mod.Logger.Info
This method outputs text to the [logs file](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#logs). A client outputs to `client.log` and the server process outputs to `server.log`. This approach will persist the data, so it might be more useful to use this approach if you need to track something over time.     

`Mod.Logger.Info($"Using Mod.Logger.Info: Current health: {player.statLife}.");`:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/6e2daa44-0442-4500-9dcf-7814b73c1cb9)    

### Console.WriteLine
If you are familiar with programming, using `Console.WriteLine` for text debugging should be familiar with you. This approach, however, is not very useful for debugging mods. The console is hidden, so there is no way to see the text. Use one of the other approaches. 

### CombatText.NewText
This approach spawns floating text. The text quickly disappears, but because the text spawns at a specified location, it can be useful for situations where that is helpful. The method requires passing in a Rectangle for the location and a Color: 

`CombatText.NewText(player.getRect(), Color.Purple, $"Using CombatText.NewText: Current health: {player.statLife}.");`:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/a725aab3-7450-4343-9025-2058088fdd39)    

### Dust.QuickDust, Dust.QuickBox, Dust.QuickDustLine
Not text, but spawning dust at specific world coordinates can be useful for code dealing with world locations. Use this to verify [geometry calculations](https://github.com/tModLoader/tModLoader/wiki/Geometry) in Projectile and NPC AI code.    

```cs
Dust.QuickDust(player.TopLeft, Color.Red);
Dust.QuickDust(player.BottomRight, Color.Blue);
```

![image](https://github.com/tModLoader/tModLoader/assets/4522492/97ef7aa3-7d1b-4d71-a481-9afde3de11c6)    

## How to use Text Debugging
Now that we know how to output text, lets go through an example. This exercise will help teach how to use Text Debugging. Consider the following code in a healing potion item similar to [ExampleHealingPotion](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Consumables/ExampleHealingPotion.cs):
```cs
public override void GetHealLife(Player player, bool quickHeal, ref int healValue) {
	int numberOfDiamonds = player.CountItem(ItemID.DiamondRing);
	float healMultiplier = numberOfDiamonds / 10;
	healMultiplier = Utils.Clamp(healMultiplier, 0f, 1f);
	healValue = 100 + (int)(10 * healMultiplier);
}
```
The intent of this code is to heal the player 100 health plus 10 health for every Diamond Ring in the player's inventory, up to a max of 200 health total. At first glance, this code seem correct, but it actually always heals for 100 health because of bugs. Lets add some text debugging to identify the issues:
```cs
public override void GetHealLife(Player player, bool quickHeal, ref int healValue) {
	int numberOfDiamonds = player.CountItem(ItemID.DiamondRing);
	Main.NewText($"numberOfDiamonds: {numberOfDiamonds}.");
	float healMultiplier = numberOfDiamonds / 10;
	Main.NewText($"healMultiplier initial: {healMultiplier}.");
	healMultiplier = Utils.Clamp(healMultiplier, 0f, 1f);
	Main.NewText($"healMultiplier after Clamp: {healMultiplier}.");
	healValue = 100 + (int)(100 * healMultiplier);
	Main.NewText($"healValue: {healValue}.");
}
```
This code results in the following output when the player is holding 5 Diamond Rings:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/9c403f63-7b85-43f5-afd9-aeb8cebc4094)    

For some reason the `CountItem` method is only counting up to 1. Lets look at the documentation for the method:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/4b2dcb64-1308-43ac-b97f-5e08df04f405)    

It seems that there is a 2nd parameter called `stopCountingAt`. We want to count up to 10, so lets fix this issue by changing that line to `int numberOfDiamonds = player.CountItem(ItemID.DiamondRing, 10);` and try again:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/48eb0b0b-f6e6-492e-af6a-ba3e6236c7cd)    

The value of `numberOfDiamonds` is now correct, but `healMultiplier` is still incorrect. It seems that `float healMultiplier = numberOfDiamonds / 10;` results in a value of `0` when `numberOfDiamonds` is `1`! This is not what we want. This is caused by [integer division](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/arithmetic-operators#integer-division), we can fix this by changing `numberOfDiamonds / 10;` to `numberOfDiamonds / 10f;`. Lets do that fix and try again:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/0ec58e15-7cdc-43bb-9788-29b71281935f)    

It's all working correctly now. 

In this example we used text debugging to determine where bugs were happening. Using a similar approach, you should be able to locate logic errors in your mod's code. Text debugging is a useful tool, but can be quite tedious. Typing out code to output text to the chat isn't very efficient. Once you are familiar with the basic concept of debugging, you should advance to using [Debugger Debugging](#Debugger-Debugging) as soon as possible. 

## Clean Up
Once text debugging has served it's purpose, remember to remove text debugging code from your mod. Nothing is more annoying for your users than seeing strange text appear in the chat during seemingly random circumstances. 
 
There are some situations where the text debugging code might be useful later. One approach is to use a [preprocessor directive](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/preprocessor-directives) to hide the code in the release build of the mod. With this approach, the code will be present when debugging from Visual Studio, but will not be present in the mod when built in-game:    
```cs
#if DEBUG
	Main.NewText("This text will only show for debug builds");
#endif
```
Sometimes debug text can be useful if you are remotely helping a user of your mod diagnose an issue. Sending them a special build of the mod with the debug text can be useful, but another approach is to provide a config that toggles additional debug logging. For example, the `BossChecklist` mod uses [a config setting](https://github.com/search?q=repo%3AJavidPack%2FBossChecklist%20ModCallLogVerbose%20&type=code) to control if text will be logged. This toggle allows mods integrating with that mod a way to diagnose their `Mod.Call` code.

# Debugger Debugging
In the Text Debugging section, we learned to output specific values to the chat to identify and fix a couple of bugs. That process is tedious because the modder needs to rebuild the mod each time they make a change. In this section we will learn to leverage the power of a debugger (Visual Studio) to debug our mods. This section assumes the modder is using [Visual Studio](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio) and has correctly set it up, please consult that guide to follow those prerequisites.

This section will cover the basics of debugging, it is highly recommended that modders familiar with these basics should further consult the official [First look at the Visual Studio Debugger](https://learn.microsoft.com/en-us/visualstudio/debugger/debugger-feature-tour?view=vs-2022) guide for more tips. There are a variety of additional techniques discussed there to greatly enhance the usefulness of debugging. 

## Launching the Debugger
First, make sure to open your mod's project in Visual Studio. Next, make sure tModLoader is closed. Also make sure that "Debug" is selected in the solution configuration drop-down. Now click the button labeled "Terraria" or press F5:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/01413b2a-7525-418b-9d72-951c1e391938)    

If you have errors, the Error List will appear, otherwise, the mod will build, be enabled automatically, and Terraria will start. (You may find that Full screen mode makes modding difficult, I suggest using Windowed mode while making mods.) If Visual Studio tells you that there are build errors and asks if you would like to launch anyway, say no! Fix the errors and try again. You'll know it is working if you see this:

![68747470733a2f2f692e696d6775722e636f6d2f39764b317276462e706e67](https://github.com/tModLoader/tModLoader/assets/4522492/93790fec-63a1-48a6-bae4-51af4fd27ec0)    

Go in game and prepare to trigger your bug.

### Debugging the Server
You can debug the server process directly by selecting the "Terraria Server" launch target instead of "Terraria" in the dropdown. You can launch a client normally and connect to the server via `localhost` as the ip address once the server loads the world.

## Breakpoint
We need to pause the program to "inspect" the data. This is called "break mode". To do this, click in the "line number margin" on a line of code where you suspect a bug is happening. This will place a red dot. This red dot is a "breakpoint".    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/6409eb14-f43f-420f-957b-50367217e94a)    

The next time tModLoader runs that line of code, the game will enter break mode and you'll see a yellow arrow in visual studio overlapping that breakpoint. You will not be able to interact with the game while in break mode. The yellow arrow indicates which line of code will run next. 

In tModLoader, do whatever action is needed to trigger the line of code that has a breakpoint on it. (This could be shooting the weapon, killing an enemy, equipping an accessory, etc.)    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/2a01125c-6f3e-4c31-aebd-fbacc836005e)    

By pressing the `F10` keys, you can advance the state of the game by 1 line. This is called "stepping through" the code. Pressing `F5` or the green continue button will leave break mode and the game will resume. The game will run until it hits another breakpoint.    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/e3e9b62e-f371-44a5-9d17-3e04845ab692)    

## Inspect Variables
If the game isn't in break mode, repeat the steps to enter break mode near the code that has a bug. We will now "inspect" variables. To do this, simply hover the cursor over the variable. The [First look at the Visual Studio Debugger](https://learn.microsoft.com/en-us/visualstudio/debugger/debugger-feature-tour?view=vs-2022#inspect-variables-with-data-tips) guide talks more about this feature:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/327eb0c3-1104-4e24-a0d8-3f768b054bd9)    

It is important to remember that the yellow arrow indicates the next line to execute. In the image above, the value of `numberOfDiamonds` is still `0` because the line of code hasn't run yet. Pressing `F10` to advance one line, the value has now changed to `5`, which is correct.

![image](https://github.com/tModLoader/tModLoader/assets/4522492/d620f053-44e4-4c7f-b3b5-4c698e8a2987)     

By stepping through the code and inspecting variables, we can follow the logic and identify where errors are happening. The [Autos and Locals windows](https://learn.microsoft.com/en-us/visualstudio/debugger/debugger-feature-tour?view=vs-2022#inspect-variables-with-the-autos-and-locals-windows) will quickly show all variables relevant to the current method. Pinning variables is another useful technique. Another useful feature is that the values of pinned variables and variables in the Locals or Autos windows will turn red after they are changed while stepping through code.

## Edit Code
Once a bug has been identified, you can make edits to code even while debugging. When the file is saved, they should take effect immediately. To enable this feature, double check that the "Hot Reload on File Save" option is checked:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/34e90454-6570-4884-8dfb-a9af6903c1ed)     

Note that adding new methods and classes will likely require the game to be relaunched:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/6a1c8fad-708d-4f6a-81da-1e4f3f792da8)    

Using "Debugger Debugging", you should be able to fix the same issue used as an example in the "Text Debugging" much more quickly. Fixing bugs quicker leaves you more time to make fun mods.

## Exception Debugging
Debugging exceptions is something only possible while using the debugger. When an exception happens while debugging, the game will immediately enter break mode. In Visual Studio, the line responsible for the exception will appear. From there, you can inspect variables and try to identify the bug.

If the exception happens in tModLoader code, you may see a blank screen because you do not have the source code available. In this case, look at the "Stack Trace" window and navigate to the lines from your mod that caused tModLoader code to throw an exception.

The [Examine the call stack](https://learn.microsoft.com/en-us/visualstudio/debugger/debugger-feature-tour?view=vs-2022#examine-the-call-stack) and [Inspect an exception](https://learn.microsoft.com/en-us/visualstudio/debugger/debugger-feature-tour?view=vs-2022#exception) sections on the official guide explain this concept in further depth.

### Exception Debugging Example
Discovering the exact cause of `Object reference not set to an instance of an object` errors: In this [video](https://github.com/tModLoader/tModLoader/assets/4522492/0d6401fe-3c57-46c7-9612-3097d207b7e5), we can easily diagnose where the error is happening. When the error happens in the game, Visual Studio is brought to the front and the line where the error occurs is highlighted. We can then hover over things and inspect their values. Here we notice that `instance` is null.

Now we can fix the error, we can use `Find all references` to confirm that yes, we forgot to set `instance` to a value. You might notice the green underline under `instance` warning us that `instance` is never assigned. We should have paid attention! Now we can easily fix the error: [video](https://github.com/tModLoader/tModLoader/assets/4522492/7cc8f838-6096-4a5c-8c4d-83c9647ca262)

## View Decompiled tModLoader Code
While debugging, we can use F10 to step over lines. Sometimes we need to look into a method to figure out an issue. F11 allows us to step into a method. By stepping into a method, we can see how and why an object might be changed. If that method is from tModLoader, we won't be able to step into it by default. We can enable a feature to allow stepping into decompiled code. To do this in Visual Studio, use the search (Ctrl-Q) to search for "decompile source". Click on "Automatically decompile to source when needed (Managed only)", Scroll down to check the checkbox, and finally click "OK":    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/45b1ccc1-bcdd-444f-b507-18d4d5c227e6)     
![image](https://github.com/tModLoader/tModLoader/assets/4522492/034de91f-4636-4fd5-9ecd-36d6549809b3)    
From now on, you'll be able to step into tModLoader methods as you are debugging. It may take a bit of time for the decompilation to finish.