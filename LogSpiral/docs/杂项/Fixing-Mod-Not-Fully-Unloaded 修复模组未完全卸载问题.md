# Introduction

This guide goes over debugging your mod in Visual Studio in an effort to determine why your mod isn't fully unloading during a mod reload. Proper unload code ensures that mods properly reset their values and don't use excess RAM. This guide assumes you know how to debug your mod in Visual Studio, as it is necessary.

![](https://i.imgur.com/EmXS4eb.png)     

# Unload Basics
As you know, c# utilizes managed memory, meaning we can usually ignore memory considerations as we can trust that the garbage collector will clean up objects that are no longer being referenced. For Mods, there are many common pitfalls that will result in objects being referenced after tModLoader attempts to unload the Mod, causing a mod to continue consuming RAM/memory after being disabled. In an effort to fix these issues, starting in tModLoader v0.11 the Mods menu will inform users of mods that fail to unload properly. 

[ExampleMod.Unload](https://github.com/tModLoader/tModLoader/blob/master/ExampleMod/ExampleMod.cs#L143) shows many common things that modders need to remember to "unload" (set to null). The main culprit is usually static references to any tModLoader class. Make sure to set those to null. Static references to XNA classes like `Texture2D` will also cause issues.

# Debug
After you have made sure to null out all references you can think of, you may find that your mod is still failing to unload. To fix this, we will use Visual Studio. First, however, make sure to disable all other mods, as some mods maintain references to other mods. If disabling all other mods fixes the issue, the issue is with a different mod that is preventing your mod from unloading. Tell them to fix their mod.

## Launch the Debugger
Start your mod as normal through Visual Studio. See [Developing with Visual Studio](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio#debugging) if you have forgotten, but this guide assumes you know how to debug your mod in Visual Studio.

## Edit and Continue plus memory Snapshots
After a successful launch, disable the mod, then reload and take note of the icon notifying that the mod did not unload properly. Now, in Visual Studio, click `Take Snapshot` in the `Diagnostics Tool` window. This will make VS remember all the currently active objects in memory. Click the number in the objects column and a window will come up to search the snapshot.

![](https://i.imgur.com/vguLKEZ.png)    
![](https://i.imgur.com/IKk1Hba.png)    

In the search bar on the top right, type in the namespace of your mod. This will filter the results to just object references of classes added in your mod. (Also make sure `Paths to Root` is selected) You should see 1 or more results:

![](https://i.imgur.com/eyD7yoM.png)    

Here we have selected the `PresentOpener.PresentOpener` (the name of the `Mod` class this example happens to be using) item from the list, populating the view below with references to that Type. The tree view below shows that there is 1 reference to this Type in the class in a static variable in PresentOpener itself, in a field called `Instance`. Looking at our `Mod.Unload` code, we can see that it is actually empty! Oops!

![](https://i.imgur.com/dW14RXy.png)     

Let's set a breakpoint there, enable the mod, reload, disable the mod, then reload again. This will hit the breakpoint, allowing us to fix this first issue.

![](https://i.imgur.com/GOv1vSp.png)     

Now, we repeat the process again. This time hopefully the item we just fixed no longer shows up. Make sure to take snapshots after disabling a mod that was loaded previously. Lets fix another issue:

![](https://i.imgur.com/2oQDRz6.png)    
 
Here we see another static reference, this time to a tModLoader API class (ModConfig). Remember, static references to these classes will prevent the data from being unloaded. Lets set a breakpoint at the start of `Mod.Unload` again and fix this problem as well. Then, we can do another snapshot once we are done and have once again loaded and unloaded the mod.

![](https://i.imgur.com/v9XVb7T.png)      

We are getting closer, just a few more. Looking at these last 2, I noticed that PresentProcessUI held a reference to our VanillaItemSlotWrapper class. Fixing the unloaded reference to PresentProcessUI automatically orphans the reference to the VanillaItemSlotWrapper class, making this last fix a 2 for 1. 

![](https://i.imgur.com/F71FFKR.png)    

After setting the 3 static fields from our `Mod` class to null in `Unload`, our mod finally unloads properly. Not all issues are as easily solved, but I hope this guide teaches you how to use the Visual Studio Diagnostic Tools to debug these memory issues well enough that you can figure out how to fix your own mod. 

![](https://i.imgur.com/sSDtR8H.png)    

## Tips
### ILoadable
It may be wise to implement an ILoadable interface:
```cs
internal interface ILoadable {
    void Load();
    void Unload();
}
```
You can implement this interface in any class you wish to follow load/unload behavior, then from your main Load() and Unload() routines in the Mod class, you can simply call Load() and Unload() respectively on anything that implements ILoadable:
```cs
ILoadable loadable = new MyLoadableImpl();

public void Load() {
    // Given you have a loadable component somewhere
    loadable.Load();
}

public void Unload() {
    // Given you have a loadable component somewhere
    loadable.Unload();
}
```

### What is `+<>c`
Those can be ignored, and should go away once you fix the other issues.

### Compare To Snapshot confusion
If the reference results doesn't seem to be getting smaller, make sure you aren't comparing to a previous snapshot:

![](https://i.imgur.com/NIe3DjD.png)     



