# What are JIT Exceptions?
In an effort to avoid silent errors caused by tModLoader updating frequently and mods becoming "out-of-date", tModLoader now inspects all classes and methods of each mod as it loads, checking that it can work properly. 

tModLoader developers strive to avoid these types of issues through careful programming, but sometimes these issues are unforeseen or unavoidable.

# Player Instructions
The mod is broken, you'll need to wait for the mod to update. It is possible the author does not know the mod is broken or does not wish to continue updating the mod. You can check the mods preferred feedback location to see if you can find more information or inform the author of the issue if no one else has reported the issue. Typically mods have a GitHub Issue tracker, a Discord server, or the mod's Steam Workshop page as their preferred feedback location.

# Modder Instructions
You need to update your mod. Most of the time these errors happen because tModLoader changed and your mod has not updated. For example, if a tModLoader method changes, your mod will be broken because it is trying to use a method that no longer exists. The other possibility is that your mod uses strong or weak references and recent tModLoader changes dictate that you will need to further annotate some methods or classes in your mod to accommodate.

## tModLoader Changed
You'll need to change the code in your mod to fix all the errors now present and publish a release. The first step is to run tModPorter from the ModSources menu. This should fix most errors. There will be some errors remaining that have new comments added by tModPorter, you'll need to fix those remaining errors according to the commented instructions. There are some changes that won't be handled by tModPorter. The `#preview-update-log` channel on the [tModLoader Discord](https://discord.gg/tmodloader) is where we track breaking changes introduced in the tModLoader Preview in anticipation for each months `stable` update. There will usually be `Porting Notes` listed for changes that could break existing mods. The [Update Migration Guide](https://github.com/tModLoader/tModLoader/wiki/Update-Migration-Guide) is also updated occasionally. There is a slight possibility that there are no errors in Visual Studio, but your original published mod fails to load. In this case, building the mod and publishing again should fix the issue. This is typically caused by a new optional argument being added to a method you were previously using.

### tModLoader Changed Example
Here is a typical `JITException` message, this example will go through interpreting and fixing this specific error:    
![image](https://user-images.githubusercontent.com/4522492/168198434-efe69dc0-91f0-4de3-98e2-9c1a464c06f4.png)    
First, we see at the top the the mod causing the error is called "BannerBonanza". In the next section, we see the actual `JITException` message, it says that:
> In BannerBonanza.Items.BannerRackItem.SetDefaults, Method not found: 'Void Terraria.Item.DefaultToPlacableWall(UInt16)'."    

From this, we know that in the `BannerRackItem` class in the `BannerBonanza.Items` namespace, the `SetDefaults` method is where this particular error is happening. The error says that the method `Void Terraria.Item.DefaultToPlacableWall(UInt16)` doesn't exist. When this mod was built, the method did exist, but apparently it doesn't anymore. 

At this point, you could check the `#preview-update-log` channel on the [tModLoader Discord](https://discord.gg/tmodloader) and look for recent messages talking about this. Here is an example of what that would look like:    
![image](https://user-images.githubusercontent.com/4522492/168232320-c63110a8-776f-4e35-9a57-bde54fa69f5d.png)

At this point, open up Visual Studio and navigate to the location of the error. You should be able to immediately see red underlines indicating an error:    
![image](https://user-images.githubusercontent.com/4522492/168201563-48c70e41-95f2-4161-92ef-4b421faa3e6e.png)    
Using the information provided in the update log message or other methods, fix the error by changing `DefaultToPlacableWall` to `DefaultToPlaceableWall`. (Notice the missing "e" in the original "Placeable" spelling.)

This quick example should teach the basic steps for fixing JIT Exceptions, but feel free to come by the `#mod-programming-help` channel if you have trouble figuring out how to fix your issue. There is a slight possibility that there are no errors in Visual Studio, but your original published mod fails to load. In this case, building the mod and publishing again should fix the issue. This is typically caused by a new optional argument being added to a method you were previously using.

## Strong References
If you get this error with a strongly referenced mod, most likely that mod changed. Extract the latest .dll from that mod and reference the newer .dll file in visual studio instead of the older one. Make sure to update build.txt to reference at least that version number using `modReferences = TheOtherMod@0.2`. Next, fix the errors and publish an update.

## Weak References
The other possible cause of a `JITException` is a weak reference to another mod. When the game inspects all classes looking for errors, it'll trigger `JITException` for references to other mods that can't be resolved. You'll need to annotate classes with special attributes to tell tModLoader to skip attempting to inspect these classes. `[JITWhenModsEnabled(...)]` excludes a class/method/property from the load time JIT. Use this on any member which directly references a type from a mod that may not be present. Provide the mod names that all need to be loaded to allow the inspection. Here are some examples in a fictional mod `ExampleModDepTest`:    
```cs
public class ExampleModCalls
{
    [JITWhenModsEnabled("ExampleMod")]
    public static int property => ModContent.ItemType<ExampleItem>();

    [JITWhenModsEnabled("ExampleMod")]
    public ExampleModCalls()
    {
        ModContent.GetInstance<ExampleModConfig>().ExampleWingsToggle = true;
    }

    [JITWhenModsEnabled("ExampleMod")]
    public static void method()
    {
        ModContent.GetInstance<ExampleModConfig>().ExampleWingsToggle = true;
    }

    [JITWhenModsEnabled("ExampleMod")]
    public static Action lambda()
    {
        return [JITWhenModsEnabled("ExampleMod")] () => ModContent.GetInstance<ExampleModConfig>().ExampleWingsToggle = true;
    }
}

[JITWhenModsEnabled("ExampleMod")]
public class SeparateClass
{
    public ExampleItem item = ModContent.GetInstance<ExampleItem>();

    public static ExampleModConfig method() => ModContent.GetInstance<ExampleModConfig>();

    public static Func<ExampleModConfig> lambda() => () => ModContent.GetInstance<ExampleModConfig>();
}
```

If you have special circumstances, you can use the `NoJIT` attribute on a class/method/property to skip the JIT process altogether. If you need more control, you can create a custom subclass of `MemberJitAttribute` or set `Mod.PreJITFilter` to a custom override. Note that the base implementation of `ShouldJIT` checks for `MemberJitAttribute`.

These annotations do not exempt you from properly gating calls to methods with references to Types in weakly referenced mods as taught in the [Expert Cross Mod Content](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content#weak-references-aka-weakreferences-expert) guide.