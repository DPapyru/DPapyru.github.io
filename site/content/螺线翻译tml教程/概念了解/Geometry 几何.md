# Why Geometry
Many visually interesting effects and interesting behaviors that a modder would want to implement in their mod require a small bit of geometry knowledge. This guide will explain the most basic usages of geometry in regard to tModLoader modding.

For example, spawning dust or projectiles in an arc, having an enemy shoot towards the player, and writing homing behaviors all make use of geometry. After teaching the basics, the latter part of this guide will have examples of these concepts.

# Prerequisite Knowledge
## Geometry Education
As a programmer, especially one with interest in video games, geometry is an essential skill. As Terraria is a 2D game, the geometry knowledge needed is not extensive, but familiarity with the basics of Vectors is essential.

## Coordinates
Terraria uses different sets of coordinates, and the directions of X and Y might surprise you if you haven't worked in graphics before. See [Coordinates](https://github.com/tModLoader/tModLoader/wiki/Coordinates) and familiarize yourself with world coordinates and the direction of positive X and Y.

## Rotation
Rotation is expressed in radians, not degrees. If you would like to use degrees, simply call the `MathHelper.ToRadians` method. Typically you only want to use degrees for the initial assignment of some behavior, such as declaring that the weapon will shoot in a 30 degree arc. Also note that a rotation of 0 faces to the right. Rotating by 90 degrees will point straight down, as Y points down. 

# Vector2
`Vector2` is a struct that represents a 2 dimensional vector as taught in geometry. A `Vector2` contains 2 fields, `X` and `Y`, representing the magnitude of the `X` and `Y` components of the 2 dimensional vector. In tModLoader, Vector2 are used for two main purposes. The first purpose is locations. A `Vector2` is used to represent the position of many game elements, such as a `Player`, `Projectile`, `Dust`, or `NPC`. `Vector2` are also used to represent velocity. Velocity is the speed that something is traveling in both the X and Y directions. For example, if a players position is `3, 7` and the player has a velocity of `4, 8`, then the players position will move each time the game updates positions by its velocity. In this example, after 1 update, the players new position will be `7, 15` as `3 + 4 = 7` and `7 + 8 = 15`. As you can see, adding vectors is done by adding each individual component. If Vector A represents a position, and Vector B represents a velocity, then after X units of time, the new position will be equal to `A + X * B`. Here are some diagrams teaching this concept in the Terraria coordinate system. Notice in the video how each tick the position is changed equal to the velocity of the player. Remember that the game runs at 60 updates per second, so velocity values are in world space units per update, not world space units per second.    

![](https://i.imgur.com/GCqPyFc.png)    

https://github.com/tModLoader/tModLoader/assets/4522492/e5c11e4c-b6d8-43c0-bbe5-9feb07105ced

We can also use vectors to represent the difference between two points. A common example of this is an enemy shooting a projectile at the player. If you want to program an enemy to shoot at the player, your code needs to know what direction to shoot at. We can calculate that direction by subtracting the player.position from the npc.position. Subtraction of vectors works the same as addition, the X components are subtracted from each other and the Y components of the vector are subtracted from each other. The vector from A to B is calculated by the following: `vector = B - A`. Imagine an enemy at `14, 4` and a player at `3, 12`. By subtracting the enemy position from the player position, we get a result of `-11, 8`. In our code, we can't use this vector directly, as it represents the raw difference in position, not a direction. To turn this vector into a direction and subsequently use it to spawn a projectile, read the Vector2.Normalize section below. The diagram below shows the resulting vector from the enemy to the player. 

![](https://i.imgur.com/TT90bk0.png)    

### Position vs Center
In the above diagrams, you might have noticed that the arrows originate and point to the top left corners of the entities. In reality, `Player.position` does refer to the top left corner, as that is just how the game is designed. What this means is we rarely actually use `Player.position` in code. Instead, we use `Player.Center` as that value points to the center of the entity. (All entities can be thought of having a rectangle as their hitbox). The same can be said for `NPC.Center` and `Projectile.Center`. From now on, the guide will use `.Center` as this position makes more sense to use.

## Acceleration
When the game updates the position of something like a projectile, it takes the current velocity and adds it to the current position. This happens 60 times a second and operates in world coordinates. For projectiles like a bullet, this is all that needs to happen, but we can implement "acceleration" to influence the velocity over time to give our projectile interesting movement. This acceleration happens in various `AI` methods and also in various collision methods. Acceleration can be used to simulate gravity, wind resistance, and homing capabilities.

### Gravity
Gravity is simulated by adding a positive Y velocity to the entity every update. The game implements gravity to players by default. NPCs are affected by gravity by if `NPC.noGravity` is false. Dust also have a `noGravity` field. Projectiles are not affected by gravity, so the modder must add a gravity force to the projectile in `ModProjectile.AI` if they wish. The [Basic Projectile](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#gravity) guide goes into various details for implementing gravity. 

```cs
Projectile.velocity.Y = Projectile.velocity.Y + 0.1f;
```

### Drag or Wind Resistance
To simulate wind resistance, please read the [Basic Projectile](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#wind-resistance) guide. Essentially a component of the velocity is multiplied by a number slightly smaller than 1, so slowly reduce it.

### Homing
Homing in its simplest form is basically accelerating towards a target. See [Basic Projectile](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#homing).

### Collision and Bounce
When a projectile collides with a solid tile, the velocity instantly reverses direction to allow the projectile to bounce. See [Basic Projectile](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#bounce-and-ontilecollide) for more on this. 

### Acceleration Visualization Examples

In the video below, we can see a summary of most of the topics above. Red arrows represent velocity, and the blue arrows represent acceleration. In the Shuriken examples, we can see that the acceleration forces point slightly to the left and down. The left force is caused by wind resistance and the down force is caused by gravity. Also notable is that for one third of a second immediately after being spawned, the Shuriken does not have any forces acting on it. This is done through a timer such as shown in the [delayed gravity](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#delayed-gravity) section and gives the Shuriken an interesting movement behavior. The grenade does not have the same wind resistance force, so we only see a gravity force. When the grenade collides with a tile, we see a large force for an instant. This is the collision force which reverses the projectile velocity.    

https://github.com/tModLoader/tModLoader/assets/4522492/c6ee3ea3-1485-419b-b113-41cf2a23ea07

## Vector2.Normalize
When working with vectors, much of the time the size of the vector isn't relevant, only the direction that the vector represents. Imagine a player 100 units away from an enemy and another player 1000 units away from the enemy in the same direction. If we calculate the vectors from the enemy to each of these players, those vectors will point in the same direction but one will be 10 times longer. If we used these vectors as-is in our `AI` method for spawning a projectile to shoot at the players, the second projectile will travel 10 times faster! We don't want this, we want enemy projectiles to have a consistent speed no matter how far away the player is. (Right now we are imagining a bullet style projectile, if your enemy is lobbing something like a grenade, you would want to take distance into account up to the max intended throw speed of your enemy, but that kind of advanced AI behaviors is not what we are talking about here.) 

The solution to this problem is to "normalize" the Vector. Normalizing vectors simply means we scale the vector to have a length of 1, resulting in what is called a Unit Vector. You could do this by using the Pythagorean theorem you learned in school, but luckily the `Vector2` class has this functionality already in it. We don't want to use the normal Normalize method, however, because there is a possibility of dividing by zero and crashing the game. Instead, we use a method called `SafeNormalize`:
```cs
// This code would likely be located in a ModNPC.AI method
// Note that player would be defined earlier in this code somehow, likely by using NPC.TargetClosest(); and Player player = Main.player[NPC.target];
// First, calculate the vector from the npc to the player by subtracting the two vectors in the correct order (Vector from A to B is B - A)
Vector2 vectorFromNpcToPlayer = player.Center - NPC.Center;
// Next, call SafeNormalize to scale the vector down to a length of 1 (aka, a unit vector), this results in a vector that only represents a direction
Vector2 directionFromNpcToPlayer = vectorFromNpcToPlayer.SafeNormalize(Vector2.UnitX);
// Next, we need our npc to have some intended shoot velocity. You'll want to experiment to find a good speed.
float shootVelocity = 10;
// Finally, we spawn the projectile in the intended direction with the intended initial velocity by multiplying the vector by our shootVelocity
Projectile.NewProjectile(source, NPC.Center, directionFromNpcToPlayer * shootVelocity, ProjectileID.BombSkeletronPrime, 5, 0, Main.myPlayer);
```

## Vector2.ToRotation
Given a Vector2, normalized or unnormalized, we can calculate a rotation value by calling the `ToRotation` method on that vector. Many flying enemies rotate to face their target, such as Demon Eyes. You can use a vector representing the vector from the enemy to the player to set the enemy rotation, or you can use the current enemy velocity to set `NPC.rotation`. For more advanced situation, you may want an enemy NPC to slowly rotate towards a target rather than immediately turn to face the player. 
```cs
// First, calculate a Vector pointing towards what you want to look at
Vector2 vectorFromNpcToPlayer = player.Center - NPC.Center;
// Second, use the ToRotation method to turn that Vector2 into a float representing a rotation in radians.
float desiredRotation = vectorFromNpcToPlayer.ToRotation();
// Now we can do 1 of 2 things. The simplest approach is to use the rotation value directly
NPC.rotation = desiredRotation;
// A second approach is to use that rotation to turn the npc while obeying a max rotational speed. Experiment until you get a good value.
NPC.rotation = NPC.rotation.AngleTowards(desiredRotation, 0.02f); 
```

## Multiplying Vectors
We can scale vectors by simply multiplying them by a float. We typically scale normalized vectors, such as in the `Vector2.Normalize` example above. In that example, we had a unit vector representing a direction to the player that we intended to shoot at. By multiplying that vector by our intended shoot velocity, we made a vector that was in the same direction as before but much longer. Since we are using that `Vector2` in the `velocity` parameter of the `Projectile.NewProjectile` method, the result is the projectile will spawn with the desired speed in the desired direction.

You can also multiply vectors for other reasons. For example, in [ExampleAdvancedFlailProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedFlailProjectile.cs#L328) we multiply a projectile velocity vector by `0.2f` or `0.4f` (the `bounceFactor` variable), effectively cutting the velocity of the projectile to a fraction of it's original velocity. This gives the flail a weighty feel as it bounces off tiles.

## Vector2 Length
We can determine the length of a Vector easily without resorting to the Pythagorean theorem. Calculating the length of a vector can be very useful in many situations. An example is an enemy that won't shoot until the player gets within a specific range. By checking the length of the vector from the enemy to the player, we can have the enemy decide whether or not to spawn the projectile.
```cs
// We can use the Length method of Vector2 to determine the length of an existing Vector2
Vector2 vectorFromNpcToPlayer = player.Center - NPC.Center;
float distanceBetweenPlayerAndNpc = vectorFromNpcToPlayer.Length();
// Or, we can use the Vector2.Distance method to calculate the length between 2 existing Vector2
float distanceBetweenPlayerAndNpc = Vector2.Distance(player.Center, NPC.Center);
// Then, use that value in your logic
if(distanceBetweenPlayerAndNpc < 300) {
    // Player is within range, spawn projectile here
}
```

### Vector2 Length Squared
If you are doing something computer intensive like iterating over many entities to find the closest one, you should be aware that using the length squared methods are more efficient. Using `Vector2.DistanceSquared` or `Vector2.LengthSquared` in this situation is more efficient if you desire.

## Vector2 rotation
Rotating a vector can be useful for many purposes. A common example is giving a weapon inaccuracy. By taking an original `Vector2` and calling the `RotatedByRandom` method on it, we can calculate a new `Vector2` that has been rotated at most the provided radians. See [ExampleShotgun.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleShotgun.cs#L38) to see this in action. Note that the resulting distribution is not evenly distributed, which works well for this effect.

We can also rotate a vector by a non-random amount. The `RotatedBy` method does this. For example, we could rotate a vector by `MathHelper.Pi / 2` or `MathHelper.ToRadians(90)` to calculate a vector that is perpendicular to the original vector. We could use that vector to create a splitting projectile. By repeatedly rotating a vector, we can calculate several vectors representing an arc. See [ExampleGun.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleGun.cs#L79) to see this in action in the Vampire Knives example. 

// Others?

# Random Vectors
Utilizing random vectors is an easy way to add variety to visual and behavior effects. There are many ways to generate a random vector. The diagrams accompanying the following approaches show the distribution an an in-game example of spawning several dust using the approach to illustrate their behavior. 

## Random Vector Within Circle
This approach is the most typical result when a modder wants to make a random vector. The results are well distributed.
```cs
// Normal approach
Vector2 speed = Main.rand.NextVector2Circular(1f, 1f);
// Generate vectors within an arc only. 
Vector2 speed = Main.rand.NextVector2Unit((float)MathHelper.Pi / 4, (float)MathHelper.Pi / 2) * Main.rand.NextFloat();
// NextVector2Circular allows supplying the width and height radii, for an oval distribution
Vector2 speed = Main.rand.NextVector2Circular(0.5f, 1f);
```    
![](https://i.imgur.com/RJZuLoA.png)     ![](https://i.imgur.com/N6XF5CZ.png)    ![](https://i.imgur.com/wGW3hFn.png)    

https://github.com/tModLoader/tModLoader/assets/4522492/07341fea-ad1f-4418-b464-c0a28093e96d

https://github.com/tModLoader/tModLoader/assets/4522492/d330ee58-8bda-4cc6-b37c-16b71daf321b

https://github.com/tModLoader/tModLoader/assets/4522492/80677a4e-6719-4a75-9d20-9665415b4a49

## Random Vector Along Circle Edge
By generating a random vector that reaches the edges, a modder can generate a random vectors with a consistent length or magnitude.    
```cs
// Normal approach
Vector2 speed = Main.rand.NextVector2Unit();
// Optional parameters allow for specifying a range of rotations. In this example, the start rotation is  MathHelper.Pi / 4 and it can be up to MathHelper.Pi / 2 more than that.
Vector2 speed = Main.rand.NextVector2Unit((float)MathHelper.Pi / 4, (float)MathHelper.Pi / 2);
```    
https://github.com/tModLoader/tModLoader/assets/4522492/ada40247-d17c-4dc0-a7cd-87b531e0cd74

https://github.com/tModLoader/tModLoader/assets/4522492/35c9caa2-a907-4e97-91c7-731e62a317b5

## Random Vector Within Square
A lot of old Terraria code uses a strange approach to randomizing vectors. Each component, X and Y, are randomly generated in the following manner:   
```cs
float xSpeed = Main.rand.NextFloat(-1f, 1f);
float ySpeed = Main.rand.NextFloat(-1f, 1f);
// Another approach
Vector2 speed = Utils.RandomVector2(Main.rand, -1f, 1f);
```
On first glance, this seems like it should work fine, but this approach actually has a strange distribution that may be unwanted, it actually can generate vectors longer than intended extending out towards the corners of an imaginary square. In the image and video below, note the odd shape that forms.   
![](https://i.imgur.com/rmPZlwk.png)    

https://github.com/tModLoader/tModLoader/assets/4522492/5bd85be8-15a8-4a1f-bea3-8a5d4a9e6809
## Random Vector Square Edge
Not very useful.

# Examples
Now that we have a basic knowledge of geometry and have seen various `Vector2` methods that facilitate that knowledge, we can finally use geometry to program interesting behaviors into our mod.

In these examples, you may see Dust or Projectiles being used to illustrate the technique, but they are interchangeable. Just remember to consult the method signature of the method you are using to know the purpose of each parameter.

## Spawn a random burst/circle of something
This is the code used for the random vector section above. In this example, we use a for loop to spawn 50 dust, each with a random vector along the edge of the circle. Note that we multiply the vector by 5 to scale it and make it larger, causing the dust to move a good distance.
```cs
for (int i = 0; i < 50; i++) {
	Vector2 speed = Main.rand.NextVector2CircularEdge(1f, 1f);
	Dust d = Dust.NewDustPerfect(Main.LocalPlayer.Top, DustID.BlueCrystalShard, speed * 5, Scale: 1.5f);
	d.noGravity = true;
}
```
We can use some simple geometry to change the spawn location away from the same spot. By adding `speed * 32` to `Main.LocalPlayer.Top`, the dust start in a small circle and expand outward from there instead of all starting in the same spot. 
```cs
Dust d = Dust.NewDustPerfect(Main.LocalPlayer.Top + speed * 32, DustID.BlueCrystalShard, speed * 2, Scale: 1.5f);
```
The speed has been reduced to more easily visualize the effect.    

https://github.com/tModLoader/tModLoader/assets/4522492/9b9913f2-afaa-487d-ab7c-df3b81739fcb
## Shoot at a Target
In [ExampleWormHead](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/ExampleWorm.cs#L73), the basic pattern of an enemy shooting a projectile at the player is shown.

Basically, to shot at a target, we calculate the vector from the source to the target, normalize it, then scale that normalized vector by some shoot speed. Make sure to only call this code if the attack cooldown, distance, and line of sight checks pass, as shown in the linked example.

```cs
// The geometry of shooting towards a target:
Vector2 direction = (target.Center - NPC.Center).SafeNormalize(Vector2.UnitX); // normalized vector pointing towards the target
Vector2 velocity = direction * 7f; // shoot velocity
Projectile.NewProjectile(..., velocity, ...); // Use that velocity in NewProjectile where appropriate
```

## Face toward a Target
You can face a target by using [Vector2.ToRotation](https://github.com/tModLoader/tModLoader/wiki/Geometry#vector2torotation). If your entity texture is not oriented to face to the right, you may have to add `MathHelper.Pi / 2` to rotate the entity an additional 90 degrees. Also be aware that sometimes projectile or NPC flip the sprite when facing left. This is done via the `spriteDirection` bool. If this bool is true, you may need to add an additional 180 degrees of rotation to compensate by adding `MathHelper.Pi`:
```cs
// At the end of ModProjectile.AI
if (Projectile.spriteDirection == -1) { 
	Projectile.rotation += MathHelper.Pi;
}
```

// TODO: Explain what happens automatically, where to put various direction and spriteDirection code in both projectile and npc

# Learn More
After mastering this guide, learning collision could be useful. // TODO: Make a collision guide.



