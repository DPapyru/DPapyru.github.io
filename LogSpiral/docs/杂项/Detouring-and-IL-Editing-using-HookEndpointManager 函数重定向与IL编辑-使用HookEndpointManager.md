___
[New to IL editing? Read our other guide about IL editing first, click here!](Expert-IL-Editing)

[This guide involves IL editing other mods, click here to learn more](https://github.com/tModLoader/tModLoader/wiki/Patching-Other-Mods-Using-MonoMod)

- In 1.4.4 `HookEndpointManager` is obsolete, use `new Hook()` for detours or `new ILHook()` for IL patches, these require to be applied, unloaded and stored manually. 
___

There is also another way to modify other mod methods. If you looked into dlls generated with MonoMod's HookGen, you would see that it uses `HookEndpointManager`:
```cs
public static event ILContext.Manipulator Initialize
{
	add
	{
		HookEndpointManager.Modify<On.Wikithis.ItemWiki.hook_Initialize>(MethodBase.GetMethodFromHandle(methodof(global::Wikithis.ItemWiki.Initialize()).MethodHandle), value);
	}
	remove
	{
		HookEndpointManager.Unmodify<On.Wikithis.ItemWiki.hook_Initialize>(MethodBase.GetMethodFromHandle(methodof(global::Wikithis.ItemWiki.Initialize()).MethodHandle), value);
	}
}
```

You can skip creating intermediate dll with HookGen and call `HookEndpointManager` directly. However, it's not possible (at least in C#10 and .NET 6) to create hooks exactly like HookGen does it, so doing this will require some knowledge of working with Reflection.

## Preparations

Start by getting `MethodInfo` of the method you want to detour or IL-edit:
```cs
public class DetourManagerExample : Mod
{
    public override void Load()
    {
        if (ModLoader.HasMod("CalamityMod"))
        {
            // Class in which target method is
            Type calamityDetourClass = Type.GetType("CalamityMod.World.MiscWorldgenRoutines");

            // Public and Static binding flags since PlaceRoxShrine is a public static method
            MethodInfo detourMethod = calamityDetourClass.GetMethod("PlaceRoxShrine", BindingFlags.Public | BindingFlags.Static);
        }
    }
}
```

## Detouring

If the method has more than 1-2 parameters, or any `ref`, `out` or `in` parameters, add separate delegate for original method:
```cs
public class DetourManagerExample : Mod
{
    private delegate void orig_PlaceRoxShrine();

    public override void Load()
    {
        ...
    }

    private static void PlaceRoxShrine_Detour(orig_PlaceRoxShrine orig)
    {
        // your patch code, same as detouring with HookGen
    }
}
```
`orig_PlaceRoxShrine` delegate matches with original method signature (return type and parameters).

Detour method (`PlaceRoxShrine_Detour`) matches original method but with added first parameter, `orig_PlaceRoxShrine` delegate.

<b>Please note that instance methods will have first parameter as class instance:</b>

```cs
class MethodClass
{
    public int InstanceMethod(string instanceParameter) { ... }

    public static string StaticMethod(int instanceParameter) { ... }
}

class DetourClass
{
    private delegate int orig_InstanceMethod(MethodClass self, string instanceParameter);
    private int InstanceMethod_Detour(orig_InstanceMethod orig, MethodClass self, string instanceParameter) {  }

    private delegate string orig_StaticMethod(int instanceParameter);
    private string StaticMethod_Detour(orig_InstanceMethod orig, int instanceParameter) {   }
}
```

And finally, call `HookEndpointManager.Add`:
```cs
HookEndpointManager.Add(detourMethod, PlaceRoxShrine_Detour);
```

<b>tModLoader will make sure all detours and IL edits are unloaded during mod unloading, there is no need to manually unregister them</b>

### `Action`s and `Func`s

In some scenarios, custom orig delegate can be replace with `Action` or `Func`, 
for example if method has 1 or less parameters

```cs
public class DetourManagerExample : Mod
{
    public override void Load()
    {
        if (ModLoader.HasMod("CalamityMod"))
        {
            Type calamityDetourClass = Type.GetType("CalamityMod.World.MiscWorldgenRoutines");
            MethodInfo detourMethod = calamityDetourClass.GetMethod("PlaceRoxShrine", BindingFlags.Public | BindingFlags.Static);

            HookEndpointManager.Add(detourMethod, PlaceRoxShrine_Detour);
        }
    }

    private static void PlaceRoxShrine_Detour(Action orig)
    {
        // your patch code, same as detouring with HookGen
    }
}
```

Some more Action/Func examples
```cs

// Can be detoured with Action
public void VoidParameterlessMethod() { ... }

// Can be detoured with Func
public string StringParameterlessMethod() { ... }

// Can be detoured with Action<int>
public void VoidMethod(int integer) { ... }

// Can be detoured with Func<int, string>
public string StringMethod(int integer) { ... }
```

In some cases Action or Func can't be used, for example, if method has any `ref`, `out` or `in` parameter(s)

```cs
public int OutMethod(ref int refInt) { ... }

public int RefMethod(out int outInt) { ... }
```

## IL Editing

IL Editing is easier to setup than detouring, just create a method that retuns `void` and has single parameter - `ILContext` to manipulate IL and call `HookEndpointManager.Modify`.
```cs
public class ILEditManagerExample : Mod
{
    public override void Load()
    {
        if (ModLoader.HasMod("CalamityMod"))
        {
            Type calamityDetourClass = Type.GetType("CalamityMod.World.MiscWorldgenRoutines");
            MethodInfo detourMethod = calamityDetourClass.GetMethod("PlaceRoxShrine", BindingFlags.Public | BindingFlags.Static);

            HookEndpointManager.Modify(detourMethod, PlaceRoxShrine_ILEdit);
        }
    }

    private static void PlaceRoxShrine_ILEdit(ILContext il) 
    {
        // IL manipulations here, same as with HookGen or any other IL edit
    }
}
```