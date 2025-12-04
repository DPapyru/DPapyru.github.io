***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Time-and-Timers/ecf72a76ff8f2643414d2dd2095a7c0f7b01024e)
***

# Time and Timers
When dealing with various aspects of Terraria modding, you'll find yourself wanting to delay actions of make things happen less frequently. In short, you'll want to utilize time and timers to accomplish your modding goals. This guide will go over many time related concepts so that you don't unknowingly make a mistake in your code.

## Cooldowns
A cooldown is nothing other than a timer, often accompanied by a condition or trigger instead of repeating endlessly. The same concepts from this guide can be applied to implement a cooldown, for example when pressing a custom keybind, dashing, and many other things.

## Don't use Loops
When dealing with timers, the most important thing to remember is that the game loop is what is calling all the hooks and methods. Loops within your code will not act as a timer, they will loop the number of times within nanoseconds and then continue executing the code below it. Timers must be programmed taking into account that the game loop will call the methods once a tick. The following show common mistakes modders make.

### Mistake Examples
This example mistakenly assumes that the while loop will cause this code to wait 60 ticks and then run the code below. That is not the case, the while loop will run 60 times and then immediately run the code below. The correct approach necessitates storing the timer in a non-local variable and removing the loops, as shown in other examples.
```cs
int timer = 60;
while (timer > 0)
{
    timer--;
}
// Other code intended to run after timer expires
```

***

This example will also fail, `timer` will never reach above 60 because it is defined in the same scope, meaning it will start at 0, increment to 1, and then next tick will start at 0 again. To avoid this, put your timer definition (`int timer = 0;`) outside the method (usually the class). See the "Timer Using New Field" section for details.
```cs
int timer = 0;
timer++;
if (timer > 60)
{
    // Other code intended to run after timer expires
    timer = 0;
}
```

# Wall Time vs Game Time vs World Time
First off, it is important to know the difference between various types of time. 

Wall Time is actual time in the real world. We almost never want to use this in modding because usually our effects run at the same speed as the game or at the speed of the game world. Running things in wall time would mean that while the game is paused or is running at a slower frames per second, the events we are coding would still happen. This would lead to many bugs.

World Time is the reported time of the world. An issue that could arise with improper usage of world time would be events happening extremely quickly while an enchanted sundial is active.

Game time is the time we want to use for gameplay effects most often. Terraria tries to run at 60 frames per second, but weak computers might be running the game in slow motion if they can't maintain 60 FPS. By using game time in our logic, we can account for gameplay effects running at the same relative speed. For example, if an enemy should attack every second, using Wall time would mean that the users running Terraria at 30 FPS would have twice as many attacks to dodge. 

In summary, use Game Time for pretty much everything. Never use Wall Time. Use World Time for things tied to the day/night cycle of the world itself. 

# Game Time
Game Time is what we use for most gameplay timer elements. Game Time is consistent with respect to frame rate, so gameplay effects happen at the same frequency as the gameplay itself. This is almost always the intended behavior for modders looking to implement a "timer" in their mod. 

Game Time is measured in Ticks. Ticks is a term that refers to each time the game logic is updated. For example, every tick each projectile is advanced by their velocity and everything else moves as well. If you have a good computer, you'll get 60 ticks each second. Thus, an effect that you want to last 2 seconds would need to count to 120 ticks. As a reminder, it won't be exactly 2 seconds if the user is not hitting 60 FPS and has frame skip disabled, but that's ok because everything else in the game will be slowed down by the same degree.

Implementing a timer that counts in ticks is easy, you simply increment a field of your class each Update/AI/etc call. After increment, you can use an `if` statement to check if you've reached the intended value, and if so, run the code that does what you want, such as spawning a `Projectile`. Within this if statement, you might also want to reset your timer back to 0 if you intend to repeat the action. (An alternate approach is initializing your timer to a number and decrement it until it reaches 0. The effect is the same, either counting up or counting down. This is up to your preference.)

## Important Fields
* `Main.GameUpdateCount` - Each time a world is loaded, this will reset to 0. Incremented by 1 each tick, even while the game is paused. 
* `Player.miscCounter` - Incremented by 1 each tick and cycles from 0 to 299. Use this to drive player visuals. 
* `NPC.ai[]` and `Projectile.ai[]` - A common approach in vanilla code is to use these arrays as timers.  
* [`Projectile.timeLeft`](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#timeleft) - Counts down to 0, once 0 is hit, the Projectile will die automatically. By default, will be 3600 (60 seconds), but can be changed in `SetDefaults`. Can be used for a simple timer, usually for counting ticks after spawning or before despawning. See example below.
* [`Projectile.extraUpdates`](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#extraupdates)/`Projectile.MaxUpdates` - This will cause Projectile.Update to run multiple times for special effects. Be aware of this if you are implementing a timer but it seems to be too fast. You'll need to scale your timer logic to account for the additional Updates.

## Examples
In these examples, we'll use `ModNPC.AI` or `ModProjectile.AI` to advance our timers. 
### Timer Using Projectile.ai[] (or NPC.ai[])
(This example uses `Projectile.ai[]` as an example, but `NPC.ai[]` also works the same way)
If you are using an original AI, or know that the aiStyle you are using doesn't use one of the 2 ai slots (4 for npc), you can use projectile.ai[] as a timer. Since projectile.ai[] is automatically synced, this could be convenient, but it does require some investigation to make sure the ai slot is free to use:
```cs
Projectile.ai[0]++;
if(Projectile.ai[0] > 120) {
    // Our timer has finished, do something here:
    // SoundEngine.PlaySound, Dust.NewDust, Projectile.NewProjectile, etc. Up to you.
    Projectile.ai[0] = 0;
}
```
[ExampleAdvancedAnimatedProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedAnimatedProjectile.cs#L79) shows using a timer to fade in the Projectile for 50 ticks, then fade back out.    

We can use a property to make the code much easier to read:   
```cs
public float Timer {
	get => Projectile.ai[0];
	set => Projectile.ai[0] = value;
}

public override void AI() {
	// Other code...
	Timer++;
	if (Timer > 120) {
		// Our timer has finished, do something here:
		// SoundEngine.PlaySound, Dust.NewDust, Projectile.NewProjectile, etc. Up to you.
		Timer = 0;
	}
	// Other code...
}
```
[ExampleCustomAISlimeNPC.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/ExampleCustomAISlimeNPC.cs#L178) shows this approach in practice.

### Timer Using New Field
`NPC.ai[]` and `Projectile.ai[]` are synced automatically over the multiplayer network by the game, but you can make new fields in your `ModNPC` or `ModProjectile` class. This makes the code much easier to read, but you might need to sync this extra data. Read [Multiplayer Compatibility](https://github.com/tModLoader/tModLoader/wiki/Multiplayer-Compatibility#npc--modnpc) if you want to learn more. Some data won't need to be synced, so try to familiarize yourself with when data needs to be synced.

Making a new field to act as a timer is simple:
```cs
public class ExampleBullet : ModProjectile
{
	public int Timer;

	public override void SetDefaults() {
		// code here
	}

	public override void AI() {
		Timer++;
		if (Timer > 120) {
			// Our timer has finished, do something here:
			// SoundEngine.PlaySound, Dust.NewDust, Projectile.NewProjectile, etc. Up to you.
			Timer = 0;
		}
	}
}
```    
ExampleMod has many examples: [Abomination Send/ReceiveExtraAI](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/NPCs/Abomination/Abomination.cs#L231). [More Examples](https://github.com/tModLoader/tModLoader/search?utf8=%E2%9C%93&q=SendExtraAI+path:ExampleMod&type=Code)

### Projectile One Time Timer Using Projectile.timeLeft
If you need something to happen once X ticks after spawning, you can take advantage of `Projectile.timeLeft` (you may want to change `Projectile.timeLeft` in `ModProjectile.SetDefaults` to something smaller):
```cs
// when the projectile has 1 seconds left in its life 
if(Projectile.timeLeft == 60) {
    // do something here.
} 
```
### Modulo Timer
For visual effects, you can get away with making a timer that simply uses `Main.GameUpdateCount`. Don't use this approach for gameplay elements, as the inaccuracy will cause issues.
```cs
if(Main.GameUpdateCount % 60 == 0) {
   // Dust.NewDust or some other visual effect.
}
```
Here is another example showing cycling between 4 colors with 1 second between. Dividing `GameUpdateCount` by 60 turns the value into counting seconds, and using modulo 4 lets it cycle. This code came from a `ModifyTooltips` method, but the idea can be in other situations.
```cs
switch (Main.GameUpdateCount / 60 % 4)
{
	case 0:
		line.OverrideColor = new Color(254, 105, 47);
		break;
	case 1:
		line.OverrideColor = new Color(34, 221, 151);
		break;
	case 2:
		line.OverrideColor = new Color(190, 30, 209);
		break;
	case 3:
		line.OverrideColor = new Color(0, 106, 185);
		break;
}
```

### Cycling, Looping, Interpolating effects

We can use a timer to control a visual effect that should change over time. For example, if we want to transition a tooltip between 2 colors, we can use a timer to control how far close we are to the 2nd color. This is called interpolation. To do this, use a modulo timer approach and divide the result by the period. `(Main.GameUpdateCount % 60) / 60f`, for example, would start at 0 and move towards 1 each game update until it looped back to 0 after 60 game updates or 1 second. We use this value to call the `Color.Lerp` method, which will return a color value suitably between the input values.

**Looping**
```cs
float lerpAmount = (Main.GameUpdateCount % 60) / 60f;
Color color = Color.Lerp(Color.Red, Color.Green, fade); 
```
As the game runs this code each game update, the colors will transition from red to green and then loop back to red over the course of a second. Change 60 to adjust the speed. There are other "Lerp" methods such as `MathHelper.Lerp` and `Utils.MultiLerp` to experiment with.

**Cycling**    
Another approach is cycling. A cycling effect is achieved by interpolating from 0 to 1 and back to 0. This approach will avoid the jumps that looping will result in. The `Utils.PingPongFrom01To010` takes a value from 0 to 1 and interpolates from 0 to 1 and back to 0 without any jumps. This example transitions from red to green and back to red, then repeats.

```cs
float lerpAmount = Utils.PingPongFrom01To010((Main.GameUpdateCount % 60) / 60f);
Color color = Color.Lerp(Color.Red, Color.Green, fade); 
```
`Utils.Turn01ToCyclic010` operates the same way, but does so smoothly as a cosine wave would. Use this for an even smoother effect that avoids the transition suddenly reversing direction. 

# World Time
World Time usually advances at the same pace as Game Time, but there are several situations where the difference is critical. While the game is paused, world time does not progress. While an enchanted sundial is in use, time progresses 60 times faster than usual. Journey Mode also allows adjusting world time. Be aware that mods could also change how fast time progresses. For example, time can be paused in HerosMod, so relying on World Time for gameplay effects would fail. 

## Important Fields
Here are the important fields relating to World Time: 
* `Main.dayTime` - true during the day, false at night
* `Main.time` - A value between 0 (4:30 AM) and 54000 (7:30 PM) during the day and between 0 (7:30 PM) and 32400 (4:30 AM) during the night. Use with Main.dayTime. Main.time usually increments by 1 each tick (see `Main.dayRate`). Each in-game hour is 3600 ticks. 
  * Example: `Main.dayTime && Main.time < 18000.0` - Morning between 4:30 AM and 9:30 AM (because 18000/3600 == 5) 
* `Main.dayRate` - Normally 1. 60 while enchanted sundial is happening. The value is added to `Main.time` during the `Main.UpdateTime` method.

## Intended Use
* [NPC Spawning](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Spawning)
* World Update events, such as the TODO: [Volcano event in ExampleWorld](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/ExampleWorld.cs#L336)

# Wall Time
When you are a beginner modder, you may find yourself googling "c# timer" in an attempt to code up something for your mod. If you did, you found examples of using `System.Timers`. Those concepts do not apply to video games or tModLoader modding at all, as they are examples of Wall Time. You'll need to consult [World Time](#world-time) and [Game Time](#game-time) above to determine the correct approach. Again, any usage of `System.Timers` is almost certainly the wrong approach. It'll be buggy and incorrect when the user pauses the game or uses an enchanted sundial.

The same can be said for using `Thread.Sleep` to wait some time before running code. That will freeze the game. You need to write your own logic to run code later by taking advantage of the game loop.

One appropriate usage of wall time for modders is measuring the performance of a piece of code, such as a world generation method. Feel free to use wall time to measure performance:
```cs
var stopWatch = Stopwatch.StartNew();
// Code to measure
ModContent.GetInstance<ExampleMod>().Logger.Info($"{stopWatch.ElapsedMilliseconds} milliseconds have elapsed.");
```