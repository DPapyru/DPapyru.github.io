___
[New to IL editing? Read our other guide about IL editing first, click here!](Expert-IL-Editing)
___

# Introduction
This guide will explore the use of MonoMod to patch the code of other mods - a very useful tool for compatibility reasons, as well as a means to allow your mod to better interact with others. Using this, you are essentially given complete freedom of choice as to what changes you wish to make. It involves using techniques that will be familiar to experienced modders - `On` and `IL`, and I recommend trying it with vanilla before moving on to other mods, so you get a grasp of how it works. The expert IL guide can be found [here](https://github.com/tModLoader/tModLoader/wiki/Expert-IL-Editing).

# Word of Warning
Note that one of the tModLoader guidelines states: **Your mod will not do anything else deemed illicit, inappropriate, or harmful.
(Yes, we check the decompiled source of mods from time to time. If your code is obfuscated to prevent easy checking we may ban you if we decide to.) This also includes irresponsible use of reflection, Cecil, or other code that prevents harmonious mod coexistence.** This means that it is prohibited to use any of the techniques mentioned in this guide to deliberately prevent another mod from working, or otherwise compromise it. If you do, we will find out and you will be banned from the workshop. There are some exceptions, for example deliberately disabling/alter a mechanic because it would crash the game etc. But don't play around!

# Prerequisites

## Mod Extraction
If you are going to be IL editing specifically, then the prerequisites for that are identical to those mentioned in the IL guide (linked above). However, as we are editing other mods, there are also a few more things that need to be done.

In order to make changes to another mod, we first need acquire its `.dll` file, as we cannot make changes without knowing what to target. The simplest way to do this is by extracting a mod in-game:

<p align="center">
  <img width="50%" height="50%" src="https://i.imgur.com/VKuDY6a.png">
  <img width="50%" height="50%" src="https://i.imgur.com/TVwOPO6.png">
</p>

However, if this doesn't yield anything, using this fork of [ILSpy](https://github.com/steviegt6/ILSpy) allows `.tmod` files to be opened and extracted. After decompiling a `.dll` in ILSpy, its C# code can be saved (`File > Save Code`) for later viewing, and the IL can be viewed in ILSpy. You will need to do this with the mod's `.dll` file regardless of how it was acquired.

> [!NOTE]
> ILSpy must be used strictly for viewing purposes in most cases, as the license of the mod it is used on must be respected. If a mod does not have a visible license, it is All Rights Reserved.


Lastly, if you want access to the classes contained within another mod (primarily for writing `On` hooks), then you will need to add the mod's `.dll` as a dependency to your project. Note that this is **not** the same as having a strong reference to another mod; it simply allows the compiler to resolve any references to classes from that mod.

In VS, you can easily add a dependency by right-clicking `Dependencies` underneath your mod's `.csproj` in the solution explorer, clicking `Add Project Reference`, `Browse`, and selecting the mod's `.dll` in the file explorer. The mod in this guide will have `CalamityMod.dll` added as a reference to allow types from that mod to be resolved.

If you add a mod's `.dll` as a reference, you either need to add it as a strong reference or as a weak reference (read about both of these [here](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content)). This guide will add Calamity (the mod I will be using as an example) as a weak reference (`weakReferences = CalamityMod` in `build.txt`), as when using `On` to apply patches a weak reference is required\*, and for `IL` it is recommended so that less reflection is required.

<sup>\* It is required in any case where you need to reference types from the target mod. This technically isn't always, as a `static` method whose parameters are only types not from the target can be patched without needing to reference the mod, but this doesn't apply to 99% of use cases.</sup>

## Defensive Design

You cannot always assume that the mod you're targeting will be loaded, unless your mod confers a strong reference to it (i.e., it is in your mod's `modReferences` list in `build.txt`). As a result, when using weak references or none at all, your code must be written such that it won't crash if the target mod is not enabled.

To start off, let's create a `ModSystem` class responsible for handling cross-mod changes to Calamity, making use of defensive features:

```cs
using Terraria.ModLoader;

namespace CrossmodTest;

[ExtendsFromMod("CalamityMod")]
public class CalamityCrossmodSystem : ModSystem
{
    public override void Load()
    {
        ApplyOnEdits();
        ApplyILEdits();
    }

    private void ApplyOnEdits()
    {
    }

    private void ApplyILEdits()
    {
    }
}
```
The `[ExtendsFromMod("CalamityMod")]` attribute is used on the class. This prevents tModLoader from autoloading and from attempting to resolve the references in this class unless Calamity is enabled, which prevents a [JIT Exception](https://github.com/tModLoader/tModLoader/wiki/JIT-Exception) from occurring if Calamity is not loaded.

If using `ExtendsFromMod` on the class is not desirable for some reason, another option is to use `ModLoader.HasMod` to conditionally call the methods that apply patches. Each of those methods would need to be annotated with the `JITWhenModsEnabled` attribute when using this alternate approach.

# Using `On`
First, let's decide on a change to make. (All source code from Calamity shown hereon out is courtesy of the Calamity Mod Team, and can be found on their [public GitHub](https://github.com/CalamityTeam/CalamityModPublic)).

In Calamity, the method `CalamityUtils.SpawnBossBetter` is used several times throughout its codebase, and is used to spawn some bosses with extra parameters:

```cs
	public static NPC SpawnBossBetter(Vector2 relativeSpawnPosition, int bossType, BaseBossSpawnContext spawnContext = null, float ai0 = 0f, float ai1 = 0f, float ai2 = 0f, float ai3 = 0f)
	{
		if (Main.netMode == 1)
		{
			return null;
		}
		if (spawnContext == null)
		{
			spawnContext = new ExactPositionBossSpawnContext();
		}
		Vector2 spawnPosition = spawnContext.DetermineSpawnPosition(relativeSpawnPosition);
		int bossIndex = NPC.NewNPC(NPC.GetBossSpawnSource(Player.FindClosest(spawnPosition, 1, 1)), (int)spawnPosition.X, (int)spawnPosition.Y, bossType, 0, ai0, ai1, ai2, ai3);
		if (Main.npc.IndexInRange(bossIndex))
		{
			BossAwakenMessage(bossIndex);
			return Main.npc[bossIndex];
		}
		return null;
	}
```
One of the instances this method is called is when spawning Supreme Calamitas (SCal):
```cs
...
NPC scal = CalamityUtils.SpawnBossBetter(spawnPosition, ModContent.NPCType<SupremeCalamitas>());
...
```

The goal will be to replace SCal with another NPC on spawning; this example will use a gnome. This is therefore a good use-case for an `On` hook, as we want to change the return value of a method and replace its functionality with our own.

One of the first things you might notice when trying to patch another mod is that, unlike with patches targeted at vanilla, there are no `On_X` or `IL_X` classes that provide events to apply your patches with. This is because these are pre-generated and supplied by the dependency `MMHook_Terraria.dll`. Additionally, if you are familiar with how `On` typically works, this might seem like an obstacle as there are no `orig_X` delegates that you can use as the `orig` parameter in your hook.

To resolve this, you first need to declare a delegate with the same signature as the target method. This will be used as your `orig` delegate, which calls the original method when called in your hook:
```cs
private delegate NPC orig_SpawnBossBetter(Vector2 relativeSpawnPosition, int bossType, BaseBossSpawnContext spawnContext = null, float ai0 = 0f, float ai1 = 0f, float ai2 = 0f, float ai3 = 0f);
```
Next, we can actually apply the hook. Since there are no pregenerated `On_X` methods available, it must be manually applied with `MonoModHooks.Add`. This tModLoader method wraps MonoMod's `new Hook()` functionality for applying `On` hooks. If need be, you can disable a hook with `MonoModHooks.Remove`, but this is usually unnecessary as tModLoader automatically removes all hooks on unload.

To apply it, we need to get the `MethodInfo` of the target method, and declare another method to act as the hook. This method should have the same signature as the target, but with the `orig_SpawnBossBetter` delegate from earlier as an additional first parameter:
```cs
    private void ApplyOnEdits()
    {
        // First, get the MethodInfo of the method you want to apply the On patch to.
        MethodInfo targetMethod = typeof(CalamityUtils).GetMethod("SpawnBossBetter", BindingFlags.Static | BindingFlags.Public);

        // Call MonoModHooks.Add using the target method and your patch method.
        MonoModHooks.Add(targetMethod, OnSpawnBossBetter);
    }

    private NPC OnSpawnBossBetter(orig_SpawnBossBetter orig, Vector2 relativeSpawnPosition, int bossType, BaseBossSpawnContext spawnContext = null, float ai0 = 0f, float ai1 = 0f, float ai2 = 0f, float ai3 = 0f)
    {
    }
```
Currently, this won't compile, since `OnSpawnBossBetter` needs to return an NPC instance (which, according to the source code from earlier, is the instance of the boss that the method spawns). This means we should populate the method. Since we only want to target SCal, we need to fall back to the method's default behaviour if the `bossType` parameter is not SCal's NPC ID:
```cs
    private NPC OnSpawnBossBetter(orig_SpawnBossBetter orig, Vector2 relativeSpawnPosition, int bossType, BaseBossSpawnContext spawnContext = null, float ai0 = 0f, float ai1 = 0f, float ai2 = 0f, float ai3 = 0f)
    {
        // If the boss summoned would not have been supreme calamitas, run the original behaviour.
        if (bossType != ModContent.NPCType<SupremeCalamitas>())
        {
            return orig(relativeSpawnPosition, bossType, spawnContext, ai0, ai1, ai2, ai3);
        }
    }
```
Any code after this block will apply only to SCal. To mimic the original method's functionality, we can adapt some of the position calculation and `Netmode` check code from the original source code:
```cs
    private NPC OnSpawnBossBetter(orig_SpawnBossBetter orig, Vector2 relativeSpawnPosition, int bossType, BaseBossSpawnContext spawnContext = null, float ai0 = 0f, float ai1 = 0f, float ai2 = 0f, float ai3 = 0f)
    {
        // If the boss summoned would not have been supreme calamitas, run the original behaviour.
        if (bossType != ModContent.NPCType<SupremeCalamitas>())
        {
            return orig(relativeSpawnPosition, bossType, spawnContext, ai0, ai1, ai2, ai3);
        }

        // This code is adapted from the original source code, which preserves functionality and instantiates the right entity source.
        if (Main.netMode == NetmodeID.MultiplayerClient)
        {
            return null;
        }

        spawnContext ??= new ExactPositionBossSpawnContext();

        Vector2 spawnPosition = spawnContext.DetermineSpawnPosition(relativeSpawnPosition);
        IEntitySource source = NPC.GetBossSpawnSource(Player.FindClosest(spawnPosition, 1, 1));
    }
```
Finally, we can add a method call that spawns our new NPC and returns its instance. A shorthand version of `NPC.NewNPC` is `NewNPCDirect`:
```cs
    private NPC OnSpawnBossBetter(orig_SpawnBossBetter orig, Vector2 relativeSpawnPosition, int bossType, BaseBossSpawnContext spawnContext = null, float ai0 = 0f, float ai1 = 0f, float ai2 = 0f, float ai3 = 0f)
    {
        // If the boss summoned would not have been supreme calamitas, run the original behaviour.
        if (bossType != ModContent.NPCType<SupremeCalamitas>())
        {
            return orig(relativeSpawnPosition, bossType, spawnContext, ai0, ai1, ai2, ai3);
        }

        // This code is adapted from the original source code, which preserves functionality and instantiates the right entity source.
        if (Main.netMode == NetmodeID.MultiplayerClient)
        {
            return null;
        }

        spawnContext ??= new ExactPositionBossSpawnContext();

        Vector2 spawnPosition = spawnContext.DetermineSpawnPosition(relativeSpawnPosition);
        IEntitySource source = NPC.GetBossSpawnSource(Player.FindClosest(spawnPosition, 1, 1));

        // Where supreme calamitas would have spawned, spawn a gnome instead.
        NPC npc = NPC.NewNPCDirect(source, spawnPosition, NPCID.Gnome);

        return npc;
    }
```
This code will now compile, and when we attempt to summon SCal via the mod's spawning method:

<p align="center">
  <img width="50%" height="50%" src="https://media3.giphy.com/media/i5loB6UGovmm7vqKIN/giphy.gif" alt="Description">
</p>

> [!NOTE]
> The most common pitfall with using `On` is forgetting to call the `orig` delegate, which results in functionality being lost when done unintentionally. Unless you want to prevent the base method from running, always call `orig`!

# Using `IL`

This guide assumes you already know how `IL` edits work, and if you don't, it's advisable to first read the main [IL guide](https://github.com/tModLoader/tModLoader/wiki/Expert-IL-Editing). Code-wise, `IL` edits require less boilerplate than `On`, as you do not need a delegate or even weak references - just a `MethodInfo` representing the target method.

Once again, let's select a method that we'd like to IL edit. Looking at SCal again, we will change the text that is displayed in chat when she spawns. This happens in the `AI` method in her `ModNPC` class, which is over a thousand lines long. This makes it infeasible to use `On`, as it's unreasonable to replace the functionality of the entire method, so we need to make more granular edits with `IL`.

The easiest way to relate IL and C# code is to use ILSpy in the mode that superimposes both IL and C#. Let's navigate to the area of the AI code that this message is sent in ILSpy, at `CalamityMod.NPCs.SupremeCalamitas.SupremeCalamitas.AI`:

<p align="center">
  <img width="50%" height="50%" src="https://i.imgur.com/d7fzRrw.png">
</p>
The corresponding source code snippet is shown below:

```cs
		if (!startText)
		{
			if (!bossRush)
			{
				string key = "Mods.CalamityMod.Status.Boss.SCalSummonText";
				if (cirrus)
				{
					key = "Mods.CalamityMod.Status.Boss.CirrusSummonText";
				}
				else if (DownedBossSystem.downedCalamitas)
				{
					key += "Rematch";
				}
				CalamityUtils.DisplayLocalizedText(key, cirrus ? cirrusTextColor : textColor);
			}
			startText = true;
		}
```
Now that we have a target method, we need to set up a pair of methods to apply that edit using the IL counterpart of `Add`, known as `MonoModHooks.Modify`. The signature of the edit itself is the same as any other IL edit:
```cs
    private void ApplyILEdits()
    {
        // First, get the MethodInfo of the method you want to apply the IL patch to.
        MethodInfo targetMethod = typeof(SupremeCalamitas).GetMethod("AI", BindingFlags.Instance | BindingFlags.Public);

        // Call MonoModHooks.Modify using the target method and your patch method.
        MonoModHooks.Modify(targetMethod, ILSupremeCalamitasAI);
    }

    private void ILSupremeCalamitasAI(ILContext il)
    {
        ILCursor c = new(il);
    }
```
The easiest way to edit the text in this case would be to change the value of `key` from earlier, which we will do by replacing its value after it is first pushed onto the stack. The first step is to navigate to the instruction where that string is loaded onto the stack by matching its value to an `Ldstr`:
```cs
    private void ILSupremeCalamitasAI(ILContext il)
    {
        ILCursor c = new(il);

        if (!c.TryGotoNext(MoveType.After, i => i.MatchLdstr("Mods.CalamityMod.Status.Boss.SCalSummonText")))
            throw new Exception("IL edit failed!");
    }
```
In case you haven't seen this pattern before, an exception is thrown if the instruction with the matching operand could not be located. Alternatively, you could `return` here instead of throwing, which would prevent the edit from applying safely rather than preventing mods from loading. `MoveType.After` places the cursor after the target instruction, so we can insert our own and avoid having to remove instructions (this is discouraged, as it could disrupt other edits).

The next step is to insert our new value onto the stack. Since we can't leave unused values on the stack, we first have to `Pop` the existing value:
```cs
    private void ILSupremeCalamitasAI(ILContext il)
    {
        ILCursor c = new(il);

        if (!c.TryGotoNext(MoveType.After, i => i.MatchLdstr("Mods.CalamityMod.Status.Boss.SCalSummonText")))
            throw new Exception("IL edit failed!");

        c.Emit(OpCodes.Pop);
    }
```
This will then allow us to push a new value onto the stack using `Ldstr`. Since the string itself is a localization key - `"Mods.CalamityMod.Status.Boss.SCalSummonText"` - the new string must also be a localization key in this case. For simplicity's sake, instead of adding a new one to the mod, I will use another localization key from Calamity - `"Mods.CalamityMod.Status.Boss.CryogenBossText"`. This is can be found in the public GitHub's localization file. Let's push that onto the stack:
```cs
    private void ILSupremeCalamitasAI(ILContext il)
    {
        ILCursor c = new(il);

        if (!c.TryGotoNext(MoveType.After, i => i.MatchLdstr("")))
            throw new Exception("IL edit failed!");

        c.Emit(OpCodes.Pop);
        c.Emit(OpCodes.Ldstr, "Mods.CalamityMod.Status.Boss.CryogenBossText");
    }
```
Finally, when SCal is summoned in-game (with the gnome edit disabled), the message is changed as we would expect (before vs. after):
<p align="center">
  <img width="50%" height="50%" src="https://i.imgur.com/3a1O0Ax.png">
  <img width="50%" height="50%" src="https://i.imgur.com/7qnTW1X.png">
</p>

The full source of both test edits is as follows:

```cs
using CalamityMod;
using CalamityMod.DataStructures;
using Microsoft.Xna.Framework;
using System.Reflection;
using Terraria;
using Terraria.DataStructures;
using Terraria.ModLoader;
using Terraria.ID;
using CalamityMod.NPCs.SupremeCalamitas;
using MonoMod.Cil;
using System;
using Mono.Cecil.Cil;

namespace CrossmodTest;

[ExtendsFromMod("CalamityMod")]
public class CalamityCrossmodSystem : ModSystem
{
    public override void Load()
    {
        ApplyOnEdits();
        ApplyILEdits();
    }

    private delegate NPC orig_SpawnBossBetter(Vector2 relativeSpawnPosition, int bossType, BaseBossSpawnContext spawnContext = null, float ai0 = 0f, float ai1 = 0f, float ai2 = 0f, float ai3 = 0f);

    private void ApplyOnEdits()
    {
        // First, get the MethodInfo of the method you want to apply the On patch to.
        MethodInfo targetMethod = typeof(CalamityUtils).GetMethod("SpawnBossBetter", BindingFlags.Static | BindingFlags.Public);

        // Call MonoModHooks.Add using the target method and your patch method.
        MonoModHooks.Add(targetMethod, OnSpawnBossBetter);
    }

    private NPC OnSpawnBossBetter(orig_SpawnBossBetter orig, Vector2 relativeSpawnPosition, int bossType, BaseBossSpawnContext spawnContext = null, float ai0 = 0f, float ai1 = 0f, float ai2 = 0f, float ai3 = 0f)
    {
        // If the boss summoned would not have been supreme calamitas, run the original behaviour.
        if (bossType != ModContent.NPCType<SupremeCalamitas>())
        {
            return orig(relativeSpawnPosition, bossType, spawnContext, ai0, ai1, ai2, ai3);
        }

        // This code is adapted from the original source code, which preserves functionality and instantiates the right entity source.
        if (Main.netMode == NetmodeID.MultiplayerClient)
        {
            return null;
        }

        spawnContext ??= new ExactPositionBossSpawnContext();

        Vector2 spawnPosition = spawnContext.DetermineSpawnPosition(relativeSpawnPosition);
        IEntitySource source = NPC.GetBossSpawnSource(Player.FindClosest(spawnPosition, 1, 1));

        // Where supreme calamitas would have spawned, spawn a gnome instead.
        NPC npc = NPC.NewNPCDirect(source, spawnPosition, NPCID.Gnome);

        return npc;
    }

    private void ApplyILEdits()
    {
        // First, get the MethodInfo of the method you want to apply the IL patch to.
        MethodInfo targetMethod = typeof(SupremeCalamitas).GetMethod("AI", BindingFlags.Instance | BindingFlags.Public);

        // Call MonoModHooks.Modify using the target method and your patch method.
        MonoModHooks.Modify(targetMethod, ILSupremeCalamitasAI);
    }

    private void ILSupremeCalamitasAI(ILContext il)
    {
        ILCursor c = new(il);

        if (!c.TryGotoNext(MoveType.After, i => i.MatchLdstr("Mods.CalamityMod.Status.Boss.SCalSummonText")))
            throw new Exception("IL edit failed!");

        c.Emit(OpCodes.Pop);
        c.Emit(OpCodes.Ldstr, "Mods.CalamityMod.Status.Boss.CryogenBossText");
    }
}
```