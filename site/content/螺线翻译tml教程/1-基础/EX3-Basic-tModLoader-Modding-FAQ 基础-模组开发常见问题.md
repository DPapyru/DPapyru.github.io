### "Terraria.ModLoader.Mod.GetTexture(String name)" error
___
This is the 1.3 error of the `MissingResourceException` below. <!--kept for stuff that links to it-->

### "Terraria.ModLoader.Exceptions.MissingResourceException: Expected resource not found" error
___
This error means that tModLoader can't find the Texture that you have specified. You may be thinking, "Where did I specify the Texture to use?", and to answer that, you should read the [Autoload](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload) page. If you are making an equipment item, such as armor, vanity, or accessories, pay special attention to the "Extra Textures" section as well, equipment items need 2 separate textures.  

Now that you read about Autoloading, you now know that the texture is derived from the namespace and classname of the class. If you don't know what namespace and classname are: [Google](http://www.google.com)

Imagine a class named `CoolGun` in the namespace `ExampleMod.Items` in a file named `MyGun.cs` which resides in the folder `\Mod Sources\CoolMod\Items\Weapons\` alongside the texture file `MyGun.png`.

The texture the modder assumed would be used: `\Mod Sources\CoolMod\Items\Weapons\MyGun.png`  
The texture autoload will actually look for: `\Mod Sources\ExampleMod\Items\CoolGun.png`  

Lets go through the problems a novice modder will run into here:
- Expecting the .cs filename and .png filename have to match.
  - Not true, the classname needs to match the texture filename. It is helpful, however, to keep the .cs filename and the class the same.
- Expecting the folder path of the .cs file to matter
  - Not true, the namespace of the class within the .cs file matters for autoloading the texture correctly. It is helpful, however, to match the namespace structure to the folder structure.

Seeing the error, the novice modder will take the following steps:
- Keep .cs filenames, classnames, and .png filenames consistent. 
- Make sure your base namespace and Mod Sources folder are equal
- Make sure your namespace and folder structure match: ExampleMod.Items.Weapons becomes `\Mod Sources\ExampleMod\Items\Weapons\`

A visual explanation:  
![](https://i.imgur.com/XLeNQCs.png)

### 'ClassName.MethodName(Parameters)': no suitable method found to override
This means that the parameters you provided for the method do not match the parameters of the virtual method you are trying to override. This is most often the case for modders attempting to override hooks and finding outdated code samples from old tutorials or AI. For example, you might have copied  
```cs
public override void OnHitNPCWithProj(Projectile proj, NPC target, int damage, float knockback, bool crit)
```
from an outdated example, but 
```cs
public override void OnHitNPCWithProj(Projectile proj, NPC target, NPC.HitInfo hit, int damageDone)
```
is the correct updated method parameters for the current version of tModLoader. Another common mistake is taking code from one class, such as a `ModItem` class for example, and pasting it in another class directly, such as a `ModProjectile` class. While many methods are present in both base classes, their parameters will usually differ and the method parameters and the code within need to be adjusted to accommodate that. Virtual methods or "hooks" require that the parameters match the existing method parameters provided by tModLoader, it is a template that must be followed and extra or changed parameters will not work. 

The fix is easy, either look up the correct parameters in the [documentation](http://tmodloader.github.io/tModLoader/) and use them or delete what you have and use your IDE to [generate the correct parameters automatically](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#override).

### "Sequence contains no matching element" error
___
This means your Mod doesn't contain any class extending from Mod. If you went through the [Basic Modding Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-Guide) you should notice that one of the files has `class MyMod : Mod`. Make sure you have 1 and only 1 of these classes in your mod.

### "error CS0234: The type or namespace name 'X' does not exist in the namespace 'Y' (are you missing an assembly reference?)"
___
This usually happens when your code has namespaces or classes that conflict with vanilla Terraria classes or namespaces. For example, if you happen to have a namespace named Projectile, and try to use Projectile.NewProjectile, the computer will be confused if you are referring to the Terraria.Projectile class or something in your Projectile namespace. The easiest solution is to not name your namespaces the same as vanilla classes. For example, ExampleMod has namespaces named Dusts, Projectiles, and Items as to not conflict with vanilla classes of Dust, Projectile, and Item.

### Error CS0103: The name 'X' does not exist in the current context
___
This means you have a variable name that the computer doesn't understand. Basically you invented something and the computer has no idea what you are talking about. Imagine your friend said "Hand me the Flobulizer", but you have no idea what that is and have never heard that word before. It is the same with the computer. You might tell the computer to "give player the Chilled debuff", but the computer has no idea what "player" is. To fix: google some tutorials on c# variables and learn how variables work, then make sure to declare the variable before attempting to use. 

### Error CS0246: The type or namespace name 'Player' (or Item, Projectile, etc) could not be found (are you missing a using directive or an assembly reference?)
___
This is because the computer doesn't know what the Player class is. You need to tell the computer where Player is found. Do this by adding "using Terraria;" to the top of the file so the computer knows how to find the Player class. (Another common one is Vector2 and Color, which needs "using Microsoft.Xna.Framework;")

### Error CS0103: The name 'ItemID' (or ProjectileID, NPCId, etc) does not exist in the current context
___
This is because the computer doesn't know what the ItemID class is. You need to tell the computer where ItemID is found. Do this by adding "using Terraria.ID;" to the top of the file so the computer knows how to find the ItemID class.

### 'LocalizedText' does not contain a definition for 'SetDefault'
___
*If you are porting an old mod, refer to the [migration guide](https://github.com/tModLoader/tModLoader/wiki/Update-Migration-Guide#localization-changes) for how to resolve these errors in the entire mod.*

This error means that you are using outdated code (pre-1.4.4). Remove or comment those lines, then when you compile the mod, edit the generated localization. You can learn more about localization files and the workflow [here](https://github.com/tModLoader/tModLoader/wiki/Localization).

### You must add a reference to assembly 'Relogic, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
___
If you are using Visual Studio, you might need to add a [reference to Relogic.dll](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio#error-cs0246-the-type-or-namespace-name-relogic-could-not-be-found)

### Error CS0161: 'ExampleItem.UseItem(Player)' (or some other hook): not all code paths return a value
___
Some methods return values. When using tModLoader hooks, you need to be aware that methods return values and not returning a value is an error. For example, UseItem has the method signature of: `bool UseItem(Player player)`, and that `bool` there tells us that we have to return a bool value. Consult the [documentation](http://tmodloader.github.io/tModLoader/) to know what value to return.

### System.Threading.ThreadStateException: FNA3D graphics functions must be called on the main thread
___
[1.4 only] If you get this issue, this means you are performing graphics tasks (such as disposing or premultiplying textures) in places that are not ran on the main thread (such as `Load` and `Unload`). To get around this, wrap your code in this:
```cs
Main.QueueMainThreadAction(() => {
	// Your code here
});
```

### C# 6 issues: "An attempt was made to load an assembly from a network location..."
This is related to Windows blocking downloaded files. What happens is the downloaded tModLoader zip file is marked as "blocked" or "downloaded from the internet", and when you use the default windows unzipping process, all unzipped files are also marked as well. Those files need to be unblocked to properly function. The easiest way to do this is to first unblock the tModLoader download and then install tModLoader again. Do this by pressing selecting the zip file in the file explorer and pressing the shortcut "alt-enter" or right clicking on the file and selecting Properties. Then simply click unblock and then press Ok. Windows 7 and 8 might look different:  

![](https://i.imgur.com/5IaE5U8.png)

Since installing over a previous installation is very easy, this is the recommended process. If you'd rather do it manually, open your Terraria install folder and view the properties of all the files tModLoader installs and unblock each file. This includes the Terraria.exe and all the files in the Mod Compile folder.

### TileObjectData.AddTile Issues
___
Make sure you call `TileObjectData.AddTile` after all of your statements regarding `TileObjectData.newTile`. Misordered code involving these statements will break Terraria.




