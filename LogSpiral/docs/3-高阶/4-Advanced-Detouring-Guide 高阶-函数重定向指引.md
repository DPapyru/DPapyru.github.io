# Prerequisites

You should know [how to look through vanilla code](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption).

You should know [what Events are](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/events/).

# What and why

Sometimes when trying to implement a feature, we won't be able to just override a hook provided by tModLoader. However, if we could somehow 'override' an existing vanilla method, we would be able to produce the effect we want. This is basically what detours are.

tModLoader provides an API for detouring vanilla methods, providing many events for us to subscribe to. They follow the pattern:

`namespace.On_Class.MethodName_MethodSignature`

examples:
```
Terraria.On_Player.GetItemGrabRange
Terraria.GameContent.ItemDropRules.On_CommonDrop
Terraria.On_Projectile.NewProjectile_IEntitySource_Vector2_Vector2_int_int_float_int_float_float_float
Terraria.On_NPC.HitModifiers.SetInstantKill
```

A few things to note here:
- `On_` only prefixes the class, never the namespace or method
- Methods with overloads are affixed with the method signature to tell them apart, only when the method actually has overloads
- Nested types, like `NPC.HitModifiers`, have their detour events on the parent

All of these `On` events are how we detour vanilla methods.

# How

To detour one of them, we use a `Load` hook somewhere, we'll be using `ModSystem` for this example, but you may prefer to put it somewhere else, a `ModPlayer` or `ModItem` if it's related to the other code there.

So, we `override` `Load`

```cs
public class DetourExample : ModSystem 
{
    public override void Load() {
    
    }
}
```

Now, we just pick something to detour. You will usually find out what you need to detour by looking through vanilla code. For this example, we will write a detour that triples the buff time of any buff, excluding flask buffs and debuffs. If we search through vanilla code a little, we will find that the `Player.AddBuff_DetermineBuffTimeToAdd` method does this.

We're going to use a feature of Visual Studio, but any proper IDE should also have this functionality. If we type out our event followed by `+=` to subscribe a method, we will see this:

![image](https://user-images.githubusercontent.com/82264356/263371842-20b68694-d427-4fc7-8532-dd7d82432136.png)

This is a handy feature of (most) IDEs, which allows you to quickly generate a method with the correct parameters. If we go ahead and press tab, we will see this:

![image](https://user-images.githubusercontent.com/82264356/263371901-76a8e96c-a36c-40c9-9785-ccbb3dd6a2b4.png)

This allows us to rename our subscribed method to whatever we want, you can leave it if you want. I like naming my methods after what they do rather than what they're detouring, so we will use this for this example:

```cs
public class DetourExample : ModSystem 
{
    public override void Load() {
        Terraria.On_Player.AddBuff_DetermineBuffTimeToAdd += TripleBuffTime;
    }

    private int TripleBuffTime(On_Player.orig_AddBuff_DetermineBuffTimeToAdd orig, Player self, int type, int time1) {
        throw new System.NotImplementedException();
    }
}
```

First thing's first, let's go ahead and make it `static` to avoid capturing any instanced stuff from our class ([see here for more information](#Common-Mistakes)). Now, we have a couple more parameters than the vanilla method. This `On_Player.orig_AddBuff_DetermineBuffTimeToAdd orig` and `Player self`. This is a common pattern you'll see in detours, the first `orig` parameter is how we call the vanilla method and the second `self` parameter is the object this method is being invoked on (note: `self` won't be here when detouring static methods, as there is no instance to be passed). As you may already be able to tell, these follow the pattern:

`On_Class.orig_MethodName orig` and `Class self`

Additionally, any parameters passed to the existing vanilla method are after these 2, in this example we have `int type` and `int time1`, but other methods you detour might have more or less.

So, let's actually implement something

```cs
public class DetourExample : ModSystem 
{
    public override void Load() {
        Terraria.On_Player.AddBuff_DetermineBuffTimeToAdd += TripleBuffTime;
    }

    private static int TripleBuffTime(On_Player.orig_AddBuff_DetermineBuffTimeToAdd orig, Player self, int type, int time1) {
        int buffTime = orig(self, type, time1);

        return buffTime;
    }
}
```

All this will do is call `orig`, which will call the vanilla method for us, then returns the result. This is the exact same as not having the detour at all. Let's go ahead and *actually* do something

```cs
public class DetourExample : ModSystem 
{
    public override void Load() {
        Terraria.On_Player.AddBuff_DetermineBuffTimeToAdd += TripleBuffTime;
    }

    private static int TripleBuffTime(On_Player.orig_AddBuff_DetermineBuffTimeToAdd orig, Player self, int type, int time1) {
        int buffTime = orig(self, type, time1);

        if (!Main.debuff[type] && !BuffID.Sets.IsAFlaskBuff[type] && !Main.buffNoTimeDisplay[type] && time1 != 2) {
            return buffTime * 3;
        }

        return buffTime;
    }
}
```

We've added a little bit of logic here - if our buff isn't a debuff, a flask buff or a buff that shouldn't have its time increased, return triple the result from `orig`. 

And that's it... our detour is finished! If we go ahead and test this out, we'll see that a 10 minute mining potion provides 30 minutes of buff.

![image](https://user-images.githubusercontent.com/82264356/263373060-bcc099d3-8378-4716-b8a2-676c04be0366.png)
![image](https://user-images.githubusercontent.com/82264356/263373119-155081c1-922d-4e93-affb-16e000f2f2dd.png)

This is just one example of how you can use detours, and it's an extremely basic one. 

# What about...

## Unsubscribing

If you understand events, you'll know we usually need to unsubscribe from them, otherwise our methods stay subscribed when they shouldn't be. tModLoader handles unsubscribing for us behind the scenes, so we don't need to do it.

## Multiple mods subscribing to the same event

You can actually test this out yourself - detour the same method multiple times, place some logs in there by calling `Main.NewText("Hello, from the first detour!")` and see what happens when you switch up the order of your detours. You should see that the last method subscribed is called first, and if you remove the `orig` call, *only* the last method is called. Basically, when you call `orig` it actually calls the next subscribed method, ending with the vanilla method. So, if your mod is loaded before another mod that detours the same method, their `orig` will call your detour, and your `orig` will call the vanilla logic. If it's the other way around, your `orig` calls their detour, their `orig` calls the vanilla logic.

## Constructors

These are detourable too. `ctor` is the instance constructor, `cctor` is the static constructor.

## Detouring methods *without* a provided event

This is common if you want to detour methods from other mods. It's out of scope for this guide, but [this guide](https://github.com/tModLoader/tModLoader/wiki/Detouring-and-IL-Editing-using-HookEndpointManager) explains it in detail.

# Common mistakes

## Detouring inlined methods

Compiled C# programs are ran by a Common Language Runtime (CLR). In simple terms, the CLR, while running the program, will look for optimisations it can make that will make the program run faster. One of the optimisations it will make is inlining a method call - removing the method call entirely and replacing it with the actual body of the method instead. If methods are inlined, we can't detour them, as the method is never called for our detour to be called. It's impossible to tell whether or not methods will be inlined, however small methods (<10 lines of code) are highly likely to be inlined. When detouring small methods, do a quick test first to see if the method is being inlined before writing your full logic.

## Capturing objects

If we use instanced properties/fields in our detour, we open the door to accidentally capturing those objects. This can cause issues, as we capture these objects from the dummy instance created by tModLoader, then continue to use them each time our detour is run. If we capture the `ModPlayer` `Player` property, it won't be the same as the `self` we might be passed in our detour. The way around this is just making our detour method static, and using the provided `self` parameter to access instanced data. Ex:

```cs
    public class DetourExample : ModPlayer
    {
        public bool EpicAccessory { get; set; } // Assume this is reset properly in ResetEffects and assigned properly in an accessory item

        public override void Load() {
            Terraria.On_Player.AddBuff_DetermineBuffTimeToAdd += TripleBuffTime;
        }

        private int TripleBuffTime(On_Player.orig_AddBuff_DetermineBuffTimeToAdd orig, Player self, int type, int time1) {
            int buffTime = orig(self, type, time1);

            if (!Main.debuff[type] && !BuffID.Sets.IsAFlaskBuff[type] && !Main.buffNoTimeDisplay[type] && time1 != 2) {
                int buffTimeMult = EpicAccessory ? 5 : 3;
                return buffTime * buffTimeMult;
            }

            return buffTime;
        }
    }
```

Here, we're accidentally capturing that `EpicAccessory` bool, allowed by our detour method being instanced. If we throw a `static` in there, we'll see this error:

![image](https://user-images.githubusercontent.com/82264356/264714299-9c74c284-3b1f-4802-ba5e-a01b70a24632.png)

So, let's fix it up to use the passed instance.

```cs
    public class DetourExample : ModPlayer
    {
        public bool EpicAccessory { get; set; } // Assume this is reset properly in ResetEffects and assigned properly in an accessory item

        public override void Load() {
            Terraria.On_Player.AddBuff_DetermineBuffTimeToAdd += TripleBuffTime;
        }

        private static int TripleBuffTime(On_Player.orig_AddBuff_DetermineBuffTimeToAdd orig, Player self, int type, int time1) {
            int buffTime = orig(self, type, time1);

            if (!Main.debuff[type] && !BuffID.Sets.IsAFlaskBuff[type] && !Main.buffNoTimeDisplay[type] && time1 != 2) {
                int buffTimeMult = self.GetModPlayer<DetourExample>().EpicAccessory ? 5 : 3;
                return buffTime * buffTimeMult;
            }

            return buffTime;
        }
    }
```

Note: If you're subscribing a method created via lambda syntax (`evt += (orig, self, params) => { }`), you can still add the `static` keyword before the parameters declaration (`evt += static (orig, self, params) => { }`). However, the actual method generated by the compiler ***is not guaranteed to be static***. For more information, see [Microsoft's explanation of static anonymous functions](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-9.0/static-anonymous-functions)