# Advanced Prerequisites
Basically all the previous prerequisites. See Beginner and Intermediate prerequisite guides first. 

## Advanced IDE Capabilities
If you haven't already, now is the time to explore the capabilities of your IDE. Please see the [Why Use an IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE) guide to familiarize yourself with everything your IDE can do to improve your mod making productivity. Of particular note, make sure you are fully taking advantage of IntelliSense and that you know how to use the Debugger.

## tModLoader Source code
You may need to decompile tModLoader to understand the correct way to do something, or to figure out the recommended approach to what you are doing. Anyone attempting to do Advanced level guides probably needs their own copy of decompiled `tModLoader.dll`. 

### But wait, I found the code on Google!
No. That code is bad and will not work. It has tens of thousands of decompilation errors. Just decompile it yourself, it is easy. Read on.

### Simple Way
A simpler way is to download a recent release of [ILspy](https://github.com/icsharpcode/ILSpy/releases) (These instructions last tested with ILSpy 9.0), scroll down to "Assets", expand it if needed, and download the zip with "binaries" in its name matching your CPU architecture (most likely x64), unzip the it to a folder, and launch `ILSpy.exe`. (If you are on Linux or Mac, you will need to use [AvaloniaILSpy](https://github.com/icsharpcode/AvaloniaILSpy/releases) instead of ILSpy. The following instructions should be mostly the same.)

Then, to make adaption easier, go into `View`->`Options`->`Decompiler` tab, scroll down to the `Other` section and enable `Always qualify member references`, and press `OK`. This will make it so instead of just `width = 20;` it will say `base.width = 20;`, making adjusting the code easier. 

Then use `File`->`Open` to open `tModLoader.dll` from the [install directory](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install). 

In addition, you should also use `File`->`Open` to open `FNA.dll`, found in `[Install Directory]\Libraries\FNA\1.0.0\FNA.dll`. You can drag the `.dll` file in instead of `File`->`Open` if you want. Do the same for `ReLogic.dll` (`[Install Directory]\Libraries\ReLogic\1.0.0\ReLogic.dll`) as well.

Finally make sure tModLoader is selected on the navigation pane and then click `File`->`Save...` and navigate to a convenient **empty** folder and press click `Save` (You'll want to choose a folder that you can easily find later, I suggest making a folder in the [Saves directory](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves): `C:\Documents\My Games\Terraria\tModLoader\DecompiledTModLoader`). 

![image](https://github.com/user-attachments/assets/d092ec75-c980-41b0-906d-29afdd461faf)

This will take a minute or so depending on your computer. Once that is done, the folder that you saved the code to now has a `tModLoader.csproj` file, opening this file should open Visual Studio if you have it installed (highly recommended). If you do not have Visual Studio installed, you'll have to navigate the files individually through file explorer.

If you see "Unknown result type (might be due to invalid IL or missing references)" anywhere in the files, you most likely forgot to open `FNA.dll` and `ReLogic.dll`.

There are a few drawbacks to the simple way. The biggest drawback is you can't debug tModLoader itself. This is an advanced technique, but if you wish to do this later, come back to these instructions and read the `Hard Way` below. The other drawback is you might find the code to have decompilation errors. With the latest version of ILspy, these are very limited and easily fixed.

> ![](http://i.imgur.com/ZeXH2p5.png)    

### Simple Way, Adaption Guide Extra Steps
If you are following the [Advanced Vanilla Code Adaption](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption) guide, you may want to do one additional step before exporting the code. The default behavior for ILSpy is to omit qualifying member references. What this means is that code you find in `Projectile.cs`, for example, would read as `if (type == 601)` rather than `if (this.type == 601)`. The second approach greatly simplifies adapting vanilla code, as it allows using a simple Find/Replace operation to convert the code into code suitable for pasting into our `ModProjectile` class. Without this approach, the code is very difficult to fix. To enable this second approach, go to `View`->`Options`->`Decompiler` and scroll down to the `Other` section. Find `Always qualify member reference values`, make sure it is checked, then click `OK`. From now on ILSpy will output code with this extra text to greatly simplify adaption.    
![](https://i.imgur.com/8hByh7p.png)    

### Hard Way
The best way to get the source code is to download the tModLoader repository and go through the [setup instructions](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-contributors#getting-the-tmodloader-code-for-the-first-time). This will net you a completely functional solution that you can open in Visual Studio. This method will take more time and it's not usually required unless you need to debug Terraria code itself or contribute to tModLoader directly. 