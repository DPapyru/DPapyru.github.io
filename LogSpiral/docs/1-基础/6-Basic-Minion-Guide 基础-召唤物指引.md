# Basic Minion Guide
In this guide we will go over minions, what makes them work, and show basic AI code snippets that most of them share.

## Introduction
A minion is, first of all, a projectile.
Not to be confused with a boss minion such as the Brain of Cthulhu Creeper, which is an NPC.
That means you are going to extend the `ModProjectile` class provided by tModLoader.
Then, you need a weapon that you use to summon it with, therefore extending `ModItem`.
The last thing being the thing that allows the minion to stay alive and to be able to be unsummoned:
A `ModBuff`.

To summarize:

* [ModProjectile](#modprojectile)
* [ModItem](#moditem)
* [ModBuff](#modbuff)

This sounds like much, but it really isn't. The majority is going to be the same as the examples (latter two classes)
and most of your own code is going to be in the `ModProjectile` which dictates how your minion behaves.
The only 'confusing' part is understanding how all those classes mesh together.
Therefore in the accompanying [ExampleSimpleMinion](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Projectiles/Minions) all these classes are in the same folder/file for easier organization.
It is highly advised to use an [IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE) for this guide,
because you will see the relationship between the classes easier.

## ModBuff
This class is responsible for the minion to be actually summoned and stay alive,
aswell as being able to be unsummoned by right clicking the icon.
In addition to that, the buff reapplies itself, guaranteeing infinite duration.
If you forget to implement the `Update()` code, it might lead to
* your minion still being alive after canceling the buff
* the buff being active even though your minion is not summoned

It will be the same code for most of the minions you will create, just replace `ExampleSimpleMinion` in the provided example accordingly.
You can see the full code [here](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/Minions/ExampleSimpleMinion.cs#L21).

## ModItem
This is your weapon that you use to summon the minion.

### Mandatory
 It is for the most part similar to other weapons, here are some notable differences for `SetDefaults()`:
```csharp
// So the weapon doesn't damage like a sword while swinging 
Item.noMelee = true;
// The damage type of this weapon
Item.DamageType = DamageClass.Summon;
Item.buffType = ModContent.BuffType<ExampleSimpleMinionBuff>();
Item.shoot = ModContent.ProjectileType<ExampleSimpleMinion>();
```
Notice how there is no `Item.buffTime` and `Item.shootSpeed` usually associated with the bottom two lines.
It is because buff time would be displayed on the item tooltip ('1 minute duration' for example, which doesn't make sense because minion duration is infinite),
and the minion has its own movement code rendering shoot speed useless in most cases.

```csharp
public override void ModifyShootStats(Player player, ref Vector2 position, ref Vector2 velocity, ref int type, ref int damage, ref float knockback) {
	position = Main.MouseWorld;
}

public override bool Shoot(Player player, EntitySource_ItemUse_WithAmmo source, Vector2 position, Vector2 velocity, int type, int damage, float knockback) {
	player.AddBuff(Item.buffType, 2);

	var projectile = Projectile.NewProjectileDirect(source, position, velocity, type, damage, knockback, Main.myPlayer);
	projectile.originalDamage = Item.damage;

	return false;
}

```
This is needed so the buff that keeps your minion alive and allows you to despawn it properly applies. You can see the full code [here](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/Minions/ExampleSimpleMinion.cs#L40).

## ModProjectile
This is your actual minion file where most of your code will be. It is advised to read up on
the [Basic Projectile Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile) whenever you have projectile-specific questions or problems.

### Mandatory
(For mandatory right-click targeting code, see [further down below](#intermission-targeting))
First of all we need a bunch of code that makes the projectile classify as a minion.

#### Defaults
In `SetStaticDefaults()`:
```csharp
// Sets the amount of frames this minion has on its spritesheet
Main.projFrames[Projectile.type] = 4;
// This is necessary for right-click targeting
ProjectileID.Sets.MinionTargettingFeature[Projectile.type] = true;

Main.projPet[Projectile.type] = true; // Denotes that this projectile is a pet or minion

ProjectileID.Sets.MinionSacrificable[Projectile.type] = true; // This is needed so your minion can properly spawn when summoned and replaced when other minions are summoned
ProjectileID.Sets.CultistIsResistantTo[Projectile.type] = true; // Make the cultist resistant to this projectile, as it's resistant to all homing projectiles.
```
In `SetDefaults()`:
```csharp 
// Only controls if it deals damage to enemies on contact (more on that later)
Projectile.friendly = true;
// Only determines the damage type
Projectile.minion = true;
// Declares the damage type (needed for it to deal damage)
Projectile.DamageType = DamageClass.Summon; 
// Amount of slots this minion occupies from the total minion slots available to the player (more on that later)
Projectile.minionSlots = 1f;
// Needed so the minion doesn't despawn on collision with enemies or tiles
Projectile.penetrate = -1;
```

#### Contact Damage
If your minion is supposed to headbutt into enemies (dealing contact damage), you need these two hooks:
```csharp
// Here you can decide if your minion breaks things like grass or pots
// (in this example false is returned, since having this on true might cause the queen bee larva to break and summon the boss accidently)
public override bool? CanCutTiles() {
	return false;
}

public override bool MinionContactDamage() {
	return true;
}
```
And in `AI()`, you need to set `Projectile.friendly` to the boolean that says if the minion has a target or not (more on that below).
This is needed so the minion doesn't damage target dummies while idling.

#### 'Active Check'
In `AI()`, the first code you write should always be this, just replace `ExampleSimpleMinionBuff` accordingly:
```csharp
Player player = Main.player[Projectile.owner];
if (player.dead || !player.active) {
	player.ClearBuff(ModContent.BuffType<ExampleSimpleMinionBuff>());
}
if (player.HasBuff(ModContent.BuffType<ExampleSimpleMinionBuff>())) {
	Projectile.timeLeft = 2;
}
```

This is technically all you need for your minion to now be summoned properly. But it doesn't do anything, how do we actually make it do something?

### Minion AI

There are two ways minions can attack: Directly dealing contact damage to the enemy, or shooting other projectiles at it.
There are also two ways a minion can move: Affected by gravity, or not.
The `ExampleSimpleMinion` showcases the simplest type of minion: contact damage + flying (and not colliding with tiles, which makes it even easier).

Even a simple minion requires a fair bit of code to do its job properly.
Most of the time it boils down to the same few general 'operations' it performs. These are:
* General behavior (determining idle position, overlap with other minions etc.)
* Targeting (enemy to attack based on conditions)
* Movement and Attack
* Animation and visual effects

If your minion does something more complex, you may want to look into designing your AI with states in mind.
An example for an NPC that uses states is [here](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/ExampleCustomAISlimeNPC.cs), same concepts can be applied to a minion.

The following code is all written inside the `AI()` hook (short for `public override void AI()`).

#### General Behavior
Tasks falling under this category include:
* Setting up certain variables 
* Aligning itself to other minions (notice how most minions reorder themselves behind you)
* Teleporting back to the player if the player or the minion got too far away from each other

You probably want your minion to be close to you if it isn't fighting? Then you need to give it an 'idle position'
where it goes to if there are no suitable targets. Such an idle position might be:
* Above the player
* Behind the player, in the line of summoned minions

Here is a mix between the two:
```csharp
Vector2 idlePosition = player.Center;
idlePosition.Y -= 48f;
float minionPositionOffsetX = (10 + Projectile.minionPos * 40) * -player.direction;
idlePosition.X += minionPositionOffsetX;
```
`Projectile.minionPos` is its place in the summoned minion list. For further movement, we will also create these variables:
```csharp
Vector2 vectorToIdlePosition = idlePosition - Projectile.Center;
float distanceToIdlePosition = vectorToIdlePosition.Length();
```
For more things that can be done here, look at `ExampleSimpleMinion's` `General behavior` region.

Now we can move on to the important bits: Actually doing something!

#### Targeting

NOTE: In 1.4, you can simply use Minion_FindTargetInRange in most cases

```
int startAttackRange = 700f;
int attackTarget = -1;
Projectile.Minion_FindTargetInRange(startAttackRange, ref attackTarget, false);
```

Your minion wants to attack things, so it needs to know what to attack and most importantly, what not to attack.
We first create a few variables that we need:
```csharp
// Starting search distance
float distanceFromTarget = 700f;
Vector2 targetCenter = Projectile.position;
bool foundTarget = false;
```

We start by iterating through all NPCs in the world, and check if they are even able to be targeted:
```csharp
for (int i = 0; i < Main.maxNPCs; i++) {
	NPC npc = Main.npc[i];
	if (npc.CanBeChasedBy()) {
		/* If we are here, that means we found an NPC that is:
		* active (alive)
		* chaseable (e.g. not a cultist archer)
		* max life bigger than 5 (e.g. not a critter)
		* can take damage (e.g. moonlord core after all it's parts are downed)
		* hostile
		* not immortal (e.g. not a target dummy)
		*/
		}
	}
}
```

In there you can now write whatever conditions you want related to the NPC and your minion, such as (examples):
```csharp
float between = Vector2.Distance(npc.Center, Projectile.Center);
bool closest = Vector2.Distance(Projectile.Center, targetCenter) > between;
bool inRange = between < distanceFromTarget;
bool lineOfSight = Collision.CanHitLine(Projectile.position, Projectile.width, Projectile.height, npc.position, npc.width, npc.height);
bool abovePlayer = player.Center.Y > npc.Center.Y;
```

You can combine them for example as follows:
```csharp
// The !foundTarget check is so it ignores any range checks
if (((closest && inRange) || !foundTarget) && lineOfSight)
```

Once we find a target, we update our search variables, to make sure that we only search for the closest NPC.
```csharp
distanceFromTarget = between;
targetCenter = npc.Center;
foundTarget = true;
```

After finding a target, if your minion deals contact damage, you also need to set its friendly status properly.
In combination with `MinionContactDamage()` this makes sure to only damage things if it has a target.
```csharp
Projectile.friendly = foundTarget;
```

#### Intermission: Targeting
If your summon weapon should support right-click targeting, you need the following code before the regular target finding loop:
```csharp
if (player.HasMinionAttackTargetNPC) {
	NPC npc = Main.npc[player.MinionAttackTargetNPC];
	float between = Vector2.Distance(npc.Center, Projectile.Center);
	// Reasonable distance away so it doesn't target across multiple screens
	if (between < 2000f) {
		distanceFromTarget = between;
		targetCenter = npc.Center;
		foundTarget = true;
	}
}
if (!foundTarget) {
	// Regular target finding loop
}
```

And this in your `SetStaticDefaults()`:
```csharp
ProjectileID.Sets.MinionTargettingFeature[Projectile.type] = true;
```

Finally, the full code can be seen in the `ExampleSimpleMinion's` `Find target` region.

#### Movement And Attack

The minion should ideally move with you when it's idle, and move towards enemies when it can. How do we do that?
This here provides a simple formula if you want to fly from `start` to `end`. For minions that move on the ground, it is more complicated (more on that at the end).
```csharp
float speed = 8f;
float inertia = 40f;
Vector2 direction = end - start;
direction.Normalize();
direction *= speed;
Projectile.velocity = (Projectile.velocity * (inertia - 1) + direction) / inertia;
```
`speed` is self-explanatory: its desired speed when it's flying straight.
`inertia` is how 'slow' the minion accelerates towards its `direction`.
Higher values means it will turn 'slower', lower values means its movement will be more twitchy.
`end` should be the `Vector2` of its destination (enemy target or idle position),
while `start` should preferably always be `Projectile.Center`.

We can put this simply into code if we consider `foundTarget` (then we use `targetCenter` as the `end`, 
else we use `vectorToIdlePosition` as `direction`),
and some nifty checks with distances that we calculated earlier so our minion doesn't 'glue itself' to its destination.

For the following movement technique (and shooting) you will need timers, [this guide](https://github.com/tModLoader/tModLoader/wiki/Time-and-Timers) will help you out.

If your minion is supposed to dash (like deadly sphere), that means a timed, high increase in velocity in a certain direction, combined with an additional slowdown for a certain time.
Since `ExampleSimpleMinion` is kept simple, this isn't covered there.

Because minions that do contact damage 'attack' while moving, but minions that shoot don't, we need proper shooting code.
This isn't in `ExampleSimpleMinion` but in `HoverShooter` at the end of `AI()`, [another minion example](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/Projectiles/Minions/HoverShooter.cs). (Note: `HoverShooter` has not been ported to 1.4 ExampleMod yet. Adjust the code accordingly.)

You can see the full movement code in `ExampleSimpleMinion's` `Movement` region.

#### Animation And Visual Effects

Your minion is moving, but not animating (assuming you have a spritesheet for it), so it looks bland. 
Here is a simple 'cycle through all frames from top to bottom at a given frequency' code snippet.
```csharp
int frameSpeed = 5;
Projectile.frameCounter++;
if (projectile.frameCounter >= frameSpeed) {
	Projectile.frameCounter = 0;
	Projectile.frame++;
	if (Projectile.frame >= Main.projFrames[Projectile.type]) {
		Projectile.frame = 0;
	}
}
```
`frameCounter` is a variable the game provides that you can use for animation
(counting the number of ticks before changing to another frame).
`frame` is the number of the image (from top to bottom, starting at 0) in your spritesheet.

Visual effects can be whatever you desire. Some are more complicated to implement than others.
Here are a few easy ones:

**Lean towards its direction in the x axis:**
```csharp
Projectile.rotation = Projectile.velocity.X * 0.05f;
```

**Create light:**
```csharp
Lighting.AddLight(Projectile.Center, Color.White.ToVector3() * 0.78f);
```

**Create dust:**
```csharp
if (Main.rand.NextBool(5)) {
Dust.NewDust(Projectile.position, Projectile.width, Projectile.height, DustID.Fire);
}
```

Other things are mentioned in the [Basic Projectile Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile).

You can see the full code [here](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/Minions/ExampleSimpleMinion.cs#L100).

## FAQ

**I want my weapon to summon two minions at the same time, like the Optic Staff**

1. In your `ModProjectile`, set `Projectile.minionSlots` to 0.5f.
2. In your `ModItem`, in the `Shoot()` hook, spawn another projectile via `Projectile.NewProjectile()`.

**I want to summon a projectile that occupies more than one minion slot, or more than one minion (total summoned minion slots bigger than 1)**

If applicable, see the above answer.
Additonally, in your `ModItem`, `SetStaticDefaults()`, assign this the number of minion slots that will be summoned with a single use of the weapon:
```csharp
ItemID.Sets.StaffMinionSlotsRequired[Item.type] = 2f; // 2f as an example
```

And in your `CanUseItem()` hook:
```csharp
return player.maxMinions >= ItemID.Sets.StaffMinionSlotsRequired[Item.type];
```

**My minion should be running on the ground instead of flying**

Coordinating movement with minion states like staying close to the player, jumping at enemies, flying when too far away from the player etc. is more advanced and isn't covered in this guide.
Consider the points below.

**My minion isn't going through platforms when an enemy is underneath it**

If your minion is not flying, you want to use the `TileCollideStyle()` hook. You might want to have `foundTarget`, `targetCenter` and others be fields in your `ModProjectile` instead of inside `AI()`, so you don't need to do the target finding code again here (see [Targeting](#targeting)). If you do that, make sure to reset them back to their defaults in `AI()` so everything resets itself.
```csharp
if (foundTarget) {
	Vector2 toTarget = targetCenter - Projectile.Center;
	// Here we check if the NPC is below the minion and 300/16 = 18.25 tiles away horizontally
	if (toTarget.Y > 0 && Math.Abs(toTarget.X) < 300) {
		fallThrough = true;
	}
	else {
		fallThrough = false;
	}
}
else {
	fallThrough = false;
}
return base.TileCollideStyle(ref width, ref height, ref fallThrough, ref hitboxCenterFrac);
```

**I want to do something exactly like vanilla/something not shown in the examples**

Your best bet is taking a look in vanilla source code yourself, the guide is found [here](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption).

**I want to make something like the Stardust Dragon**

Some of its code (mainly the replacing/adding new segments part) is very hardcoded. Most you can do is summoning all segments necessary at once.