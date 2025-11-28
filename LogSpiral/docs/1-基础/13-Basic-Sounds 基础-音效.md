***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Basic-Sounds/0dd271b8a344c26fb1a1b375b1250d4f7069c626)
***

# Introduction
We can use sounds in many places in tModLoader and this guide will educate you on how tModLoader organize and use sounds.

# Sound Basics
There are 2 concepts to be aware of. The first is the actual sound asset. This correlates with a specific sound file, such as a .wav file. The second concept is the `SoundStyle`, which is an object representing a sound asset and associated playback settings.

## Sound Assets

Sound assets can be found in your ModSources folder and in the Terraria install directory. Sound assets can be many different sound file formats including .wav, .ogg, .mp3, and .xnb. For example, [ExampleMod](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Assets/Sounds/Items/Guns) has an `ExampleGun.ogg` file found in `ExampleMod\Assets\Sounds\Items\Guns\ExampleGun.ogg`. In your Terraria install folder, you'll find hundreds of sound files in the `C:\Program Files (x86)\Steam\steamapps\common\Terraria\Content\Sounds` folder. These files are .xnb files, which is a special format that you can't listen to directly by double clicking. To listen to these sounds on your computer, see the [Extract](#Extract) section below.

## SoundStyle

Existing `SoundStyle`s can be found in the `Terraria.ID.SoundID` class and new `SoundStyle`s can be created in your mod for variations on existing sound assets or playing sound assets contained within your mod.

To create a new `SoundStyle`, you'll need the path to the sound file without the file extension. Using that path, you can create the SoundStyle object and store it for later use. 

```cs
// Creating a SoundStyle from a sound file in this Mod, then playing it
SoundStyle ExampleGunSoundStyle = new SoundStyle("ExampleMod/Assets/Sounds/Items/Guns/ExampleGun");
SoundEngine.PlaySound(ExampleGunSoundStyle);

// Creating a SoundStyle from a sound file from Terraria, then playing it
SoundStyle CoinsSoundStyle = new SoundStyle("Terraria/Sounds/Coins");
SoundEngine.PlaySound(CoinsSoundStyle);
```
Instead of assigning to a variable, you can directly play the sound:
```cs
// Creating a SoundStyle from a sound file in this Mod, then playing it
SoundEngine.PlaySound(new SoundStyle("ExampleMod/Assets/Sounds/Items/Guns/ExampleGun"));

// Creating a SoundStyle from a sound file from Terraria, then playing it
SoundEngine.PlaySound(new SoundStyle("Terraria/Sounds/Coins"));
```
`SoundStyle`s can be further customized to adjust volume, pitch, overlap behavior, and more. See the [Customizing Sound Playback](#Customizing-Sound-Playback) section below to learn more.

# Play Sounds
Some sounds play automatically, while others can be manually played.

## Pre-Determined Event Sounds

The most common usage of sounds is to play them when certain events occur. For example, when an `Item` is used, the `Item.UseSound` is played automatically. By assigning a `SoundStyle` to these existing fields, the sound will play automatically when expected. 

We can assign a `SoundStyle` to `Item.UseSound`, `NPC.HitSound`, `NPC.DeathSound`, `ModWall.HitSound`, and `ModTile.HitSound`. We will do these in the corresponding `SetDefaults` override. Below are some examples using existing `SoundStyle`s as well as an example using a custom `SoundStyle`:

```cs
// using Terraria.ID; needed at top of .cs file

public override void SetDefaults()
{
	// other code
	Item.UseSound = SoundID.Item1;  // sword swing sound
}

public override void SetDefaults()
{
	// other code
	NPC.HitSound = SoundID.NPCHit24; // Giant Tortoise hit sound
	NPC.DeathSound = SoundID.NPCDeath4; // Bat death sound
}

// using Terraria.Audio; additionally needed at top of .cs file for this example

public override void SetDefaults()
{
	// other code
	Item.UseSound = new SoundStyle($"ExampleMod/Assets/Sounds/Items/Guns/ExampleGun"); // Sound file from this mod
}
```
Other available existing sounds to use can be found through [Intellisense](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#autocomplete--intellisense), but be aware that most sounds have fairly generic names. You'll want to consult the [Finding Sounds](#Finding-Sounds) section below if you are trying to find a specific sound.    
![](https://i.imgur.com/LIX0kff.png)     

When using an existing `SoundStyle`, you inherit the playback settings assigned to that `SoundStyle`. See the [Customizing Sound Playback](#Customizing-Sound-Playback) section below to learn more.

## Play Sounds Manually

To play a sound manually, use the `SoundEngine.PlaySound` method. This method is in the `Terraria.Audio;` namespace, so make sure you have `using Terraria.Audio;` at the top of your .cs file.

The `SoundEngine.PlaySound` method has 2 parameters. The first is the `SoundStyle`, this is required. The 2nd parameter is an optional `Vector2` representing the position of the sound in world coordinates. If the position is omitted, the sound is played without any panning effect as if it were happening in the center of the screen.

To play an existing sound, simply call the method:
```cs
SoundEngine.PlaySound(SoundID.Item59); // piggy bank oink
```
To play that sound at a specific location, pass in the location as the 2nd parameter. The location is in world coordinates. This example assumes the code is in a `ModProjectile`:
```cs
SoundEngine.PlaySound(SoundID.Item59, Projectile.Center); // piggy bank oink
```

### Where do I put this code?
Wherever makes sense, but commonly `ModNPC.AI` or `ModProjectile.AI` are the most frequent places to manually play sounds. Using randomness or timers can help make your content seem natural.

# Customizing Sound Playback

Many existing `SoundStyle`s found in the `SoundID` class are pre-configured with various playback customization. For example, if you play `SoundID.NPCHit24`, you'll notice that it is half as loud as `new SoundStyle("Terraria/Sounds/NPC_Hit_24")`. Each `SoundStyle` has data attached to it that configures these custom behaviors.

To customize a `SoundStyle`, we will use the [`with` syntax](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/with-expression). The `with` syntax basically allows us to create a copy of an existing object except with some specified changes. For example, if we use `NPC.HitSound = SoundID.NPCHit4;` in our `ModNPC` but find that the volume is too high to fit our enemy, we could create a `SoundStyle` copy with custom volume like this: `NPC.HitSound = SoundID.NPCHit4 with { Volume = 0.7f };` 

The `with` syntax works with modded and vanilla sounds, and also allows multiple tweaks. The most common tweaks are explored below. Here is how multiple tweaks can be used in a single `with` statement:

```cs
NPC.HitSound = SoundID.NPCHit4 with { 
    Volume = 0.5f, 
    Pitch = 0.5f, 
    PitchVariance = 0.1f, 
    MaxInstances = 3, 
    SoundLimitBehavior = SoundLimitBehavior.IgnoreNew 
};
```

## Volume
Volume defaults to `1f` (100%) and can range from `0f` to `1f`.

## Pitch
Pitch can be adjusted up or down and defaults to `0f`. The lower limit, `-1f`, is down one octave and the upper limit, `1f`, is up one octave.

## Pitch Variance
Pitch variance is a randomness added to the pitch each time the sound is played. This can add some variety to sounds to make them less repetitive. 

## MaxInstances
This dictates how many instances of a sound can be playing at the same time. The default is `1`. Adjust this to allow overlapping sounds.

## SoundLimitBehavior
When the `MaxInstances` limit is reached, this tweak adjusts what will happen. The default is to `ReplaceOldest`, which will restart the sound. The other option is `IgnoreNew`, which will ignore the latest attempt to play the sound.

## IsLooped
This dictates if the sound should loop. Defaults to false. When using this, it is extremely important that you follow the guidelines in the [Looping Sounds](#looping-sounds) section of this guide.

## Variation
It is possible to assign multiple sound assets to a sound style and have them randomly play. To do this, the sound assets must be named the same but postfixed with a final number at the end. For example, `SoundStyle ExampleGunsSoundStyle = new SoundStyle("ExampleMod/Assets/Sounds/Items/Guns/ExampleGun_", 3);` would randomly play `ExampleGun_1`, `ExampleGun_2`, or `ExampleGun_3` with equal chance. 

### Weighted Chance and Specific Variant Postfixes
Weighted chance and more control over the specific postfixes can be achieved through the other `SoundStyle` constructor overloads.     
![image](https://user-images.githubusercontent.com/4522492/176332504-3d5f41a1-0420-48bf-ae38-ed3adb62334e.png)    

The vanilla duck sound is a good example. There are 2 main variations, `Zombie_10` and `Zombie_11`. There is also an extremely rare `Zombie_12`, which is a human saying "quack". Quite unsettling. The code for this uses weights to strongly favor the 2 normal quack sounds. The `Zombie_10` and `Zombie_11` sounds are weighted to 300f each, and the `Zombie_12` sound is weighted to 1f. This means that the `Zombie_12` sound will play about 1 out of every 601 quacks:  
  
```cs
SoundStyle quack = new SoundStyle("Terraria/Sounds/Zombie_", stackalloc (int, float)[] { (10, 300f), (11, 300f), (12, 1f) });
```    

## Position
The position of a sound determines how loud the sound will be played in relation to the screen location. It also controls how the sound will play louder on one side of the sound output to hint at the direction of the sound. Position is not a property of `SoundStyle`, rather it is the 2nd parameter of `SoundEngine.PlaySound`. It is optional, and when not provided the sound will play normally with no panning or volume dampening. 

# Active Sounds
With sounds in video games, most of the time it is completely sufficient to use the "Fire and Forget" approach. "Fire and Forget" is a video game programming term that refers to starting some action and letting it run it's course without having any way of adjusting it after starting it. For most sound effects, there is no need to stop the sound early or adjust the volume or pitch, since they are usually so short that it would not be worth the effort. 

There are, however, situations that warrant tracking the sound as it is playing and adjusting it dynamically. The most common usage of this functionality is long sounds and looping sounds.

tModLoader refers to these sounds as "Active Sounds".    

The [ActiveSoundShowcaseProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ActiveSoundShowcaseProjectile.cs) file can be used as a hand-on guide and reference to active sounds. It is highly recommended to use `ExampleMod` to experiment with the `ActiveSoundShowcase` item in-game. `ActiveSoundShowcaseProjectile.cs` can be seen as a companion guide to this wiki section.    

To properly use active sounds, first we need to familiarize ourselves with the following classes:

### SlotId
Previous examples in this guide have shown using the `SoundEngine.PlaySound` method to play a sound, but haven't shown doing anything with the return value of the method. The `SoundEngine.PlaySound` method actually does have a return value. The return value of `SoundEngine.PlaySound` is a `SlotId` instance. The returned `SlotId` instance can be stored as a class variable to retrieve the instance of that sound at a later time. 

Using the `SoundEngine.TryGetActiveSound` method, a `SlotId` can retrieve the corresponding `ActiveSound` to act on it.

### ActiveSound
The `ActiveSound` class corresponds to a single instance of an actual `SoundStyle` that is currently playing. Mod code typically will use a `SlotId` or `SoundStyle` to retrieve a `ActiveSound` to act on it. 

Using `SoundEngine.FindActiveSound`, a `SoundStyle` can be used to retrieve an `ActiveSound` from a `SoundStyle`. It is more common to use the `SoundEngine.TryGetActiveSound` approach, however, as multiple instances of an entity playing the same `SoundStyle` would cause the incorrect `ActiveSound` to be retrieved.

### SoundUpdateCallback
The 3rd parameter of `SoundEngine.PlaySound`, an optional parameter, is a `SoundUpdateCallback` delegate. Modders can pass in a method that returns a bool and takes a single `ActiveSound` parameter that will be invoked as the sound updates each tick. This callback is the main mechanism for dynamically altering sounds, but the sound can be altered in other methods as suitable to the design of the code.

## Panning Sound or Changing Sound Location
Now we can use what we have learned so far for the most common usage of "Active Sounds": dynamically adjusting the location of a sound. When an NPC or projectile makes a sound, usually the sound is quick enough that the player does not notice that the sound does not move with the NPC or projectile, but if the sound is long, it is more noticeable if it doesn't pan correctly. To adjust the location of the sound, we can retrieve the `ActiveSound` and modify it's properties. 

### Panning Long Sound Example
```cs
public class MyNPC : ModNPC
{
	SlotId wooshSoundSlot;
	SoundStyle wooshSoundStyle = new SoundStyle("ModMod/Sounds/whoosh");

	public override void AI() {
		// other AI code...

		// Check if the sound is already playing...
		if (!SoundEngine.TryGetActiveSound(wooshSoundSlot, out var activeSound)) {
			// if it isn't, play the sound and remember the SlotId
			wooshSoundSlot = SoundEngine.PlaySound(wooshSoundStyle, NPC.Center);
		}
		else {
			// if it is playing, update the location of the sound to match the NPCs position
			activeSound.Position = NPC.Center;
		}
	}
}
```

## Stopping a Sound
If something interrupts the source of a sound, the sound can be stopped early. To do this, follow the same logic as before, but call the `Stop` method on the `ActiveSound`. This can be done in any relevant place in the code.

## Changing Sound Volume
In the same manner, the `Volume` field on the `ActiveSound` instance can be changed to dynamically adjust sound volume.

## Changing Sound Pitch
In the same manner, the `Pitch` field on the `ActiveSound` instance can be changed to dynamically adjust sound volume.

## SoundUpdateCallback Approach
The SoundUpdateCallback approach explained in the looping sounds section is also a good approach. It allows all the sound logic to be contained in a single place. 

## Looping Sounds
The techniques discussed so far are sufficient for long sounds, but for looping sounds they can potentially cause sounds that continue playing until the game is closed. For example, a sound set to loop might be started, but then an exception or other buggy code causes the entity tracking the "Active Sound" to be inactivated. The sound, without anything to tell it to stop, will obediently keep playing forever.

It is for this reason that when dealing with looping sounds, modders should **always** use the `SoundUpdateCallback` parameter of `SoundEngine.PlaySound`. In fact, many might find the `SoundUpdateCallback` approach more convenient than using the `SlotId` approach explained earlier for non-looping sounds.

To make a looping sound, simply add `IsLooped = true` to the `SoundStyle` that will be played.

### SoundUpdateCallback Example
Using a `SoundUpdateCallback` delegate as a parameter to `SoundEngine.PlaySound`, the provided method will be called every game update, allowing the sound to update position and other properties. The return value of the delegate controls if the sound should be stopped. The following example shows a projectile playing a sound that updates its position every update. The sound will be stopped when the projectile is no longer active, but other logic can be used as well.

```cs
public class MyProjectile : ModProjectile
{
	SlotId loopingSoundSlot;
	SoundStyle loopingSoundStyle = new SoundStyle("ModMod/Sounds/loopSound") {
		IsLooped = true,
	};

	public override void AI() {
		// other AI code...

		// Check if the sound is already playing...
		if (!SoundEngine.TryGetActiveSound(loopingSoundSlot, out var activeSound)) {
			// if it isn't, play the sound and remember the SlotId
			var tracker = new ProjectileAudioTracker(Projectile);
			loopingSoundSlot = SoundEngine.PlaySound(loopingSoundStyle, Projectile.position, soundInstance => {
				// This example is inlined, see ActiveSoundShowcaseProjectile.cs for other approaches
				soundInstance.Position = Projectile.position;
				return tracker.IsActiveAndInGame();
			});
		}
	}
}

```

**Note:** when dealing with `Projectile`s tracking a sound, the `ProjectileAudioTracker` instance is required in order to avoid rare edge cases. The examples in [ActiveSoundShowcaseProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ActiveSoundShowcaseProjectile.cs) show the proper way to use them. For `NPC`, checking `.active` should be sufficient. For other situations, make sure the logic allows the sound to properly stop at some point.  

# Adapting Vanilla Code or Code From Past tModLoader Versions
Previous versions of tModLoader and code taken from decompiled Terraria do not use the same `SoundStyle` approach to playing sounds. To use code using old approaches, you'll need to fix the code. For example you might find code like `SoundEngine.PlaySound(12);` or `SoundEngine.PlaySound(4, (int)base.position.X, (int)base.position.Y, 7);`, but attempting to use this code in a mod will result in errors such as `No overload for method 'PlaySound' takes 4 arguments`.

To fix these, you'll want to look up the sound on the [Sound IDs page on the Official Terraria wiki](https://terraria.wiki.gg/wiki/Sound_IDs), find the row corresponding to the parameters you have, and change it to use the `SoundID` entry instead. There might be some slight discrepancies, for example	
"NPC Hit 50" corresponds to `SoundID.NPCHit50` and "NPC Killed 18" corresponds to `SoundID.NPCDeath18`. Rely on good judgement and [Intellisense](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#autocomplete--intellisense) if you still get errors.

Here is a simple example:
```cs
// Old code
SoundEngine.PlaySound(12);
```
Now, we open up the wiki and find the entry with the ID of 12:    
![image](https://user-images.githubusercontent.com/4522492/171317783-e1dc3817-13e5-4444-abd9-4451f23a04aa.png)    
With this information, we can update our code:  
```cs
// Fixed code
SoundEngine.PlaySound(SoundID.MenuTick);
```

Sometimes vanilla code uses `-1` for the 2nd and 3rd parameters. These parameters represent a null position, so you can safely ignore them. Sometimes you also see a `1` as the "Style" parameter for a sound that only has 1 entry on the wiki. You can ignore those as well:
```cs
// Old
SoundEngine.PlaySound(12, -1, -1, 1);
// Fixed
SoundEngine.PlaySound(SoundID.MenuTick);
```

Sometimes there are 2 numbers (a "Type" and a "Style"), these will show up on the wiki as a number followed by another number in parenthesis.
```cs
// Old code
SoundEngine.PlaySound(4, (int)base.position.X, (int)base.position.Y, 7);
```
Now, we open up the wiki and find the entry with the ID of 4 and style of 7. This will appear as `4 (7)` on the wiki:
![image](https://user-images.githubusercontent.com/4522492/171318331-62a11319-12a1-48d3-b905-87df52a199b7.png)    
With this information, we can update our code. Also, since the second parameter of `SoundEngine.PlaySound` is a `Vector2` now, we can pass in the position directly rather than passing in `X` and `Y` coordinates separately:  
```cs
// Fixed code
SoundEngine.PlaySound(SoundID.NPCDeath7, base.position);
```

Rarely, old code set volume or pitch offset. To fix these, use the `with` syntax shown in the [Customizing Sound Playback](#Customizing-Sound-Playback) section above. 
```cs
// Old
SoundEngine.PlaySound(12, -1, -1, 1, 0.75f, 0.3f);
// Fixed code A: Taking into account the volume and pitch settings of the existing SoundStyle, if any. This is a direct adaptation of the old code
SoundStyle adjusted = SoundID.MenuTick with {
	Volume = SoundID.MenuTick.Volume * 0.75f,
	Pitch = SoundID.MenuTick.Pitch + 0.3f,
};
SoundEngine.PlaySound(adjusted);
// Fixed code B: Ignoring the existing volume and pitch settings inherited by the existing SoundStyle. This is technically different, but might be useful to know. Note that pitch has 1f added to it.
SoundEngine.PlaySound(SoundID.MenuTick with { Volume= 0.75f, Pitch = 1.3f });
```

To adapt old code from your mod, you'll need to make a `SoundStyle` as taught in the [SoundStyle](#SoundStyle) section above.

# Finding Sounds
For many mods, reusing sounds that come with Terraria is a great idea. Terraria comes with over 700 sounds, but it can be difficult to remember or find a specific sound. There are several approaches to finding a Terraria sound to use. 
1. Extract all the sounds and play them in your media player
2. Find a sound from an item or npc you remember
3. Consult the source code to find the code that plays a specific sound

## Extract
The Terraria sound files are .xnb files, you cannot play these files on your computer directly. [TConvert](https://forums.terraria.org/index.php?threads/tconvert-extract-content-files-and-convert-them-back.61706/) can extract the Terraria sound files and save them as .wav files that you can easily load into VLC or whatever media player you have on your computer. Playing them all one after the other can be a quick way to find a unique sound to use.

## Find a Sound on the Terraria Wiki
If you consult the [Sound IDs page on the Official Terraria wiki](https://terraria.wiki.gg/wiki/Sound_IDs), you can find and play any sound. The internal name column corresponds to the `SoundID` field you would use. Use this approach if you know a specific enemy or item makes a sound and you want to find that sound. 

## Mod Testing Mods
Some mods can help find and play existing sounds:

[Modders Toolkit](https://forums.terraria.org/index.php?threads/modders-toolkit-a-mod-for-modders-doing-modding.55738/) has an option to log sounds, allowing you to see what code is causing sounds to play and also see modded sound paths as well as sound types and sound styles. It also has tools to test volume and pitch customization and generate sound playback code that you can paste into your mod.

## Source Code (Expert Prerequisites needed)
By searching `NPC.SetDefaults` or `Item.SetDefaults` using the `ItemID` or `NPCID` number, you can easily find sounds corresponding to what you want.

Not all sounds played in Terraria are just `UseSound`,`HitSound`, or `DeathSound` data, so you must use this approach if you wish to find sounds that are played under special circumstances. For example, you may wonder about the quack sounds that ducks play on occasion. Searching the source for the NPCID of Duck, 362, you will find one of the results shows `SoundEngine.PlaySound(30, (int)position.X, (int)position.Y);` nested within the condition that it is daytime and a 1 in 200 chance. We can now use this information to implement a new duck correctly.

We'll have to change this code to fit the tModLoader approach, so change it to `SoundEngine.PlaySound(SoundID.Duck, position);`

## Spread Sheets
Look up UseSound, HitSound, and DeathSound of vanilla Items and NPC here:    
[Vanilla Item Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Item-Field-Values)    
[Vanilla NPC Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-NPC-Field-Values)    
Note: The spread sheets are currently out of date, so you'll have to convert the number it says to a `SoundID` field. For example, if the `UseSound` of an item says "20", you'll have to change that to `SoundID.Item20`.

## Find Sounds from other Sources
If you want to find a sound on the internet, try to look for sounds that are legally free to use.

# Common Errors
### The name SoundID doesn't exist in the current context
Add `using Terraria.ID;` to the top of your source file.

### The name SoundEngine doesn't exist in the current context
Add `using Terraria.Audio;` to the top of your source file.

### The type or namespace name 'SoundStyle' could not be found (are you missing a using directive or an assembly reference?)
Add `using Terraria.Audio;` to the top of your source file.

### "Ensure that the specified stream contains valid PCM mono or stereo wave data."
Run your .wav through [Audacity](http://www.audacityteam.org/download/) using `File->Export Audio->Wav (Microsoft) signed 16-bit PCM`. For reference, the following are the allowed parameters for Wav files:
1. Must be a PCM wave file
2. Can only be mono or stereo
3. Must be 8 or 16 bit
4. Sample rate must be between 8,000 Hz and 48,000 Hz

## Relevant References
* [Vanilla SoundIDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#sound-ids)

## Not covered in Basic level
Music -- Music is handled in a separate manner.