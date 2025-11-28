# Introduction
Terraria is programmed in C#. In C#, [access modifiers](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/access-modifiers) such as `public`, `internal`, and `private` are used to restrict how classes, methods, properties, and fields are accessed. For example, something with an accessibility of `private` will not be accessible outside of the class itself. Proper usage of access modifiers is a sign of well structured code, and usually there is little reason to bypass these access modifiers. 

As modders, however, we sometimes need to access something not normally accessible due to the nature of modding a game. Since we can't implement the code directly in the Terraria source code, we need to bypass the access restrictions using something called [`Reflection`](https://learn.microsoft.com/en-us/dotnet/framework/reflection-and-codedom/reflection). 

When using `Reflection`, we must be aware of the implications of accessing inaccessible members. For example, something marked as `private` might be that way because the `class` needs to adjust other fields in tandem with that field to keep the code working correctly. Make sure to study the code containing the members you are using reflection to access to ensure that the behavior is maintained.

Do note that tModLoader itself will change the access modifiers of various members depending on how useful they would be to modders. It might seem like tModLoader could just change everything in Terraria to `public`, but we do not do that because access modifiers are useful and help modders write correct code. Please feel free to suggest changes if they would benefit modders.

Finally, be aware that by using reflection your mod could stop working when tModLoader updates. tModLoader developers try not to break mods by not changing public methods and fields, but private methods and fields have no such guarantee. 

# Basic Concepts
There are many well-written tutorials online about "c# reflection". Rather than reiterate the basic concepts and information about reflection, this guide directs the reader to consult those tutorials to establish a basic understanding of the concepts. Google "c# reflection" and follow whatever tutorials you find until you feel somewhat comfortable, then come back to this page to see how reflection can be used in tModLoader.

Note that this guide has not yet been updated to new [UnsafeAccessorAttribute](https://learn.microsoft.com/en-us/dotnet/api/system.runtime.compilerservices.unsafeaccessorattribute?view=net-8.0) approach to reflection added in .NET 8, this guide will be updated at a later date with that info.

## Accessing a private field
In `NPC` there is a static field named `defaultSpawnRate` that is `private`. We want to read the value. First, we use reflection to get a `FieldInfo`. `FieldInfo` is a special class that facilitates accessing the field.
```cs
FieldInfo NPCDefaultSpawnRateFieldInfo = typeof(NPC).GetField("defaultSpawnRate", BindingFlags.NonPublic | BindingFlags.Static);
```
Next, we use the `FieldInfo` to access the value. Since the field is `static`, we pass in `null` as the `object` argument.
```cs
Main.NewText("defaultSpawnRate is " + NPCDefaultSpawnRateFieldInfo.GetValue(null));
```
To set the value, we use the `SetValue` method. Once again we pass in `null` as the `object` argument. Make sure the value you are passing in matches the `Type` of the field, it is up to the programmer to do this when using reflection.
```cs
NPCDefaultSpawnRateFieldInfo.SetValue(null, 300);
```

## Accessing a private field of a private class
Some classes in Terraria are private. In this case, we must use reflection to access the `Type` of the class rather than use the `typeof` operator. To use the `GetType` method, we need an `Assembly` instance. For Terraria classes we can use `typeof(Mod).Assembly` to retrieve that. Use the assembly to retrieve the `Type`, then use reflection as normal to access private fields of that class.
```
var UIGridType = typeof(Mod).Assembly.GetType("Terraria.ModLoader.UI.Elements.UIGrid");
FieldInfo _innerListFieldInfo = UIGridType.GetField("_innerList", BindingFlags.Instance | BindingFlags.NonPublic);
```

## Using reflection with members of other mods
Reflection is used in 2 ways when dealing with other mods. 

The first way is to access `private` members as we have done previously. This is useful for mods with [strong or weak references](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content#strong-references-aka-modreferences-expert) to the target mod.

The second way to to access members of other mods [without any reference](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content#no-references-aka-reflection-expert) at all. In this case, your code can't access the fields not because they are private, but because they may or may not exist at all. This can be useful for loose cross mod compatibility, such as a mod looking for a specifically named field in a class to drive some effect.

Reflection for other mods is the same as above, but we need to access the `Assembly` of the `Mod` containing the `Type`. After retrieving the `Mod` instance with `ModLoader.GetMod` or `ModLoader.TryGetMod`, the `Code` field of the `Mod` class is the `Assembly` object we need.

```cs
Mod ExampleMod = ModLoader.GetMod("ExampleMod");
FieldInfo ExampleMagicMirrorItemNameCycleColorsFieldInfo = ExampleMod.Code.GetType("ExampleMod.Content.Items.Tools.ExampleMagicMirror").GetField("itemNameCycleColors");

Color[] MyItemNameCycleColors = [
	Color.Red,
	Color.Orange,
	Color.Yellow,
];
ExampleMagicMirrorItemNameCycleColorsFieldInfo.SetValue(null, MyItemNameCycleColors);
```

# Clean Code
When using reflection, sometimes the code can get a bit verbose. The code examples in this guide are written with the intention of accessing or setting a reflected member once for the sake of simplicity. It is useful to use other programming approaches if accessing a member multiple times.

## Store MemberInfo instance
Rather than use `GetField`/`GetMethod`/`GetProperty` each time the code should access a private member, you can store the `MemberInfo` as a field in your class and reuse it. This should be done for efficiency and convenience. Reflection is slow, so retrieving the `MemberInfo` only once and reusing it will speed up code that needs to use reflection. 

`TODO: Example`