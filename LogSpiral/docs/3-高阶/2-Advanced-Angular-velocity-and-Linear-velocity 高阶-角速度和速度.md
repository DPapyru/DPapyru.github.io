Read the [Advanced-Prerequisites](Advanced-Prerequisites) page before continuing.

# What is angular velocity used for?
We can use angular velocity to accurately spin an object by its velocity, when implemented well it will work perfectly. You can also in fact spin non spherical objects by angular velocity if you wanted to, but you'd have to use an imaginable sphere as the base. Because the outcome is considered a scalar, it can be easily applied in any sort of speed.

# Angular velocity
First, let's go over things you need to have some understanding of before continuing:
* **Angles**. What is an angle? How is an angle comprised? Where and when is it used?
* **Vectors**. What is a Vector and how and when is it used? You understand Vectors used in a 2D space.
* **Radians**. You understand radians. What are radians, and how do they relate to angles?
* **Spheres/circles**. What is a circle? You know and understand what makes a circle and how to work with one.
* **Scalars/Pseudo-scalar**. You know what a scalar is.

It _may_ be useful to understand what a **pseudo vector** is, since the angular velocity is one. I will explain it here. A pseudo vector or axial vector is a mathematical object that, like a "normal" vector, has a direction and a magnitude but which, in contrast to an ordinary vector, is invariant under the axis of the underlying axis while an ordinary vector would be opposed to direction to become.

We will start with angular velocity, then move to linear velocity.

## What is angular velocity?
In physics, the angular velocity of an object is the rate of change of its angular displacement with respect to time. I suppose these words are too fancy for some, so let's break it down. You just need to understand the words `angular velocity`. 

Imagine a spherical object like a ball, when this object moves it is also spinning or orbiting around its center. The angular velocity is a measurement between the relation of the spherical object's velocity and the spinning around its center. These rotations around the center are often called a `revolution`, one revolution being a full spin around the center. 

We can look at the SI unit of angular velocity to make some more sense out of this, which is `radians per second`. We know a full circle is 2π, or 360 degrees. Because a revolution is a full spin, we can visualize this as: `x revolutions/sec * 2π radians/revolution`. If this looks confusing, think about the following: we have _x_ amount of revolutions per second, every revolution equals 2π. This must mean we have 2π radians per revolution. So, this can be rewritten as the revolutions cancel each other out: `x * 2π radians/sec`, which I hope makes sense to you intuitively. 

To give an example before we move on, imagine doing 5 revolutions per second. We know a full spin is 2π radians, so 1 revolution is 2π radians. Meaning for every revolution, we are spinning 2π radians, so with 5 revolutions per second we're spinning 10π radians per second. This measurement of _how fast we are spinning around the center point_ is what we call _angular velocity_, sometimes it's also called _angular speed_. The angular velocity here being `10π radians/sec` and the angular speed being `10π`.

## Setting up
Before we start spinning, we should setup a helper property for our angular velocity. Remember that our angular velocity is our revolutions per second, meaning the total amount of spins around the center per second. To relate this to our velocity, we need to find a way to make use of our velocity vector. We can do this by taking the magnitude (length) of our velocity. The magnitude is basically the 'size' of our vector, which is a scalar. If we multiply our magnitude with the total angular displacement of a full spin, we end up with: `2π * magnitude`. This defines our angular speed. Let's implement: (_note that this showcases c#7 getters_)
```cs
double AngularVelocity
{
  get => Math.PI * 2 * velocity.Length;
}
```
Because Terraria has useful helpers, you can replace 2π with `MathHelper.TwoPi` for a constant value, which is much faster compared to continuously calculating (because TwoPi is a constant)
```cs
double AngularVelocity
{
  get => MathHelper.TwoPi * velocity.Length;
}
```

## Applying angular velocity
You can apply the angular velocity in many different ways, as you can apply rotation in many different ways in Terraria. One way you can do it, is by adding the angular velocity to the rotation of the entity in the AI. This is useful for things like npcs or projectiles: `this.rotation += this.angularVelocity;`. It is important that you add the angular velocity instead of setting it directly to it, because remember that it defines the angular **displacement**.

If you work with something else, it is likely you should store your own angle variable. Then in any sort of update call, you can apply the same behavior as above.

With custom draw code, you should pass the displaced angle to draw with. The following example assumes you have already applied above behavior somewhere. This means you've applied the angular displacement: `rotation += angularVelocity`. 
```cs
spriteBatch.Draw
(
  texture, position, frame, color, rotation, size, scale, spriteEffects, layer
);
// rotation should equal the old rotation plus the angular velocity
```
Understand that you will get glitching issues if you are nowhere updating the actual rotation by the angular displacement, but instead passing `rotation + angularVelocity` to the draw call.

## Drafting the linear velocity formula with math
Angular velocity = angular speed, denoted by lowercase omega (w) => `x revolutions / sec`

The formula of linear velocity: `v = s/t`, next confine s: `s = arc length = 2π * r * (theta/360)`
Where r is the radius and theta the angle. Now we can rewrite this with radians:`2π * r * (theta / 2π)`, the 2π cancel each other out, leaving: `r * theta`

So now we have: `v = linear velocity = r * theta / t`. Going back to angular velocity: `w = theta / t`. This formula should make sense, as we said earlier the angular velocity is the angular displacement with respect to time. This is exactly what is displayed here.

So we end up with: `v = r * w`