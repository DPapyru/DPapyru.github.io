___
Please read the [expert guide prerequisites](Expert-Prerequisites) beforehand. <br>
New to modding? Then you should not follow this tutorial <br>
_Original:_ https://forums.terraria.org/index.php?threads/a-beginners-guide-to-shaders.86128/
___

# Introduction

Shaders are extremely powerful and, provided you know what you are doing, lightweight tools to create fancy visuals. 
However, they are also quite complex, and the implementation barrier is rather high. The purpose of this guide is to help remedy this, and provide an introductory course for writing your very own shaders for Terraria modding.

[[https://i.imgur.com/GZ4aAqa.gif|inline]] 

## What is a shader?

Very generally speaking, a shader is a piece of code that creates or modifies rendering output. In layman's terms, this basically means "code that makes pretty things". In game development, we primarily use two types of shaders: vertex shaders and pixel shaders (also known as fragment shaders). Vertex shaders are used to modify 3D models, for instance to move or deform them. Pixel shaders are used to modify the actual pixel output of your screen. They often work in tandem with vertex shaders, but can also function perfectly well on their own, as we see in Terraria.

An important thing to understand about shaders is that they're not executed just once, but "for every X". A vertex shader applied to a 3D model will run its code for every vertex (point) of that model. A pixel shader applied to a texture will run for every pixel that that texture is covering (which, yes, can cover the entire screen). This might be confusing at first, but you'll get the hang of it after writing a few passes.

Because Terraria doesn't contain any 3D models (sort of), it doesn't use any vertex shaders. It does use pixel shaders, which can be broadly divided into three groups:

1. Armor shaders*: primarily consists of player dyes, but also contains some miscellaneous effects such as (part of) the Pillar force field and the water shader.
2. Screen shaders: consists of screen filters, such as the Celestial Invasion and Blood Moon tints.
3. Tile shaders: consists of tile paints.

_* Internally, these are known as Pixel Shaders, but to avoid confusion with the containing set I refer to these as Armor Shaders instead._

Implementing your own tile shaders is rather complex, and in my personal opinion shouldn't be done to begin with unless you know Terraria's engine (and more importantly, its limitations) inside out, so you'll be limited to making armor shaders and screen shaders. There is a fundamental difference between how these two shaders work, as well as their parameters, but their basic structure remains the same.

## Shader structure

Terraria shaders consists of three parts: parameters, passes and techniques. Passes and techniques aren't really used to their full capability, so all you really need to know that for the purposes of writing shaders for Terraria, a pass is a single function that modifies the pixel output, and all passes are contained within a technique. If we take the vanilla dyes as an example, every dye uses a pass to change the appearance of an armor piece, accessory or mount, and all of these passes are contained within a single technique.

A parameter is information passed from outside (i.e. Terraria) into the shader, such as the color the shader should use. It allows you to make multiple effects from a single pass (all basic color dyes use the same pass, just with a different color parameter). When you create your own shader and want to use Terraria's pre-existing shader system (which you should), your shader needs to contain all the parameters the default shaders does: if not, Terraria will attempt to set parameters that don't exist, causing a crash. Armor shaders and screen shaders do not use the same set of parameters, so they will be discussed individually in their respective chapters.

You can find blank examples of both armor and screen shaders attached to the bottom of this post.

## Armor shaders

![Rising Dye](https://i.imgur.com/bCz7fFb.gif)

Terraria's armor shaders modify how a specific texture is drawn. The most obvious example of this are the various dyes that can be applied to armor pieces, accessories and mounts, however they can also be used to apply entirely shaded visuals to blank textures (think of the Pillar's force field: that is entirely a shader).

The parameters of the armor shader are as follows:

```hlsl
sampler uImage0 : register(s0); // The texture that you are currently drawing.
sampler uImage1 : register(s1); // A secondary texture that you can use for various purposes. This is usually a noise map.
float3 uColor;
float3 uSecondaryColor;
float uOpacity;
float uSaturation;
float uRotation;
float uTime;
float4 uSourceRect; // The position and size of the currently drawn frame.
float2 uWorldPosition;
float uDirection;
float3 uLightSource; // Used for reflective dyes.
float2 uImageSize0;
float2 uImageSize1;
float2 uTargetPosition;
float4 uLegacyArmorSourceRect;
float2 uLegacyArmorSheetSize;
```

## Screen shaders

[[https://i.imgur.com/pjpwfxO.png|inline]]

Terraria's screen shaders modify the contents of the entire screen rather than a specific texture. The most common application of screen shaders is to give the screen a certain tint, but they can be used for other effects as well, such as distortion effects, overlays or simply turning the screen upside down, if for whatever reason you'd want to do that. Screen shaders should not be confused with custom skies, such as the meteors that fall in the background at a Solar Pillar: those have nothing to do with shaders, and are not covered in this guide.

Screen shaders are significantly more complex than pixel shaders, so unless you're trying to do something very simple like tinting the screen, I advise you to start with armor shaders first. This guide doesn't contain any examples of screen shaders because most of the information about armor shaders carries over.

The parameters of the screen shader are as follows:

```hlsl
sampler uImage0 : register(s0); // The contents of the screen.
sampler uImage1 : register(s1); // Up to three extra textures you can use for various purposes (for instance as an overlay).
sampler uImage2 : register(s2);
sampler uImage3 : register(s3);
float3 uColor;
float3 uSecondaryColor;
float2 uScreenResolution;
float2 uScreenPosition; // The position of the camera.
float2 uTargetPosition; // The "target" of the shader, what this actually means tends to vary per shader.
float2 uDirection;
float uOpacity;
float uTime;
float uIntensity;
float uProgress;
float2 uImageSize1;
float2 uImageSize2;
float2 uImageSize3;
float2 uImageOffset;
float uSaturation;
float4 uSourceRect; // Doesn't seem to be used, but included for parity.
float2 uZoom;
```

# How to write a shader

Now this is all fine and dandy, but how do you actually go about writing a shader? In this chapter, I'll show you some examples of shaders and what they do.

## Basic shader

To start of with, a shader file in XNA (the framework Terraria uses) has the extension `.fx`. Apart from that, it works like any other text file, so you don't need any special software to start writing shaders.

Let's start with some armor shaders. To start off, let's write the absolute smallest working shader possible.

```hlsl
sampler uImage0 : register(s0);
sampler uImage1 : register(s1);
float3 uColor;
float3 uSecondaryColor;
float uOpacity;
float uSaturation;
float uRotation;
float uTime;
float4 uSourceRect;
float2 uWorldPosition;
float uDirection;
float3 uLightSource;
float2 uImageSize0;
float2 uImageSize1;
float2 uTargetPosition;
float4 uLegacyArmorSourceRect;
float2 uLegacyArmorSheetSize;
    
float4 ArmorBasic(float4 sampleColor : COLOR0) : COLOR0
{
    return sampleColor;
}
    
technique Technique1
{
    pass ArmorBasic
    {
        PixelShader = compile ps_2_0 ArmorBasic();
    }
}
```
That's quite a lot to unpack. The parameters you already know, so let's look at the middle bit.

```hlsl
float4 ArmorBasic(float4 sampleColor : COLOR0) : COLOR0
{
    return sampleColor;
}
```
What we have here is a single pass. Now, you might recognize that the `float4` in front of `ArmorBasic` means that that is the return type. The `: COLOR0` indicates where this return type should be stored, namely in the COLOR0 register of the GPU. Put two and two together, and what this means is that this pass writes a color value consisting of four floats (red, green, blue and alpha) to the GPU.

As for `float4 sampleColor : COLOR0`, this means you're declaring a parameter equal to what's in that COLOR0 register. So what this pass does is take the value of COLOR0 and put it in COLOR0. Not very useful, as you might imagine.

We'll move on to something more useful in a bit, but let's first take a look at that last part of the shader:
```hlsl
technique Technique1
{
    pass ArmorBasic
    {
        PixelShader = compile ps_2_0 ArmorBasic();
    }
}
```
All this really does is compile the technique, by in turn compiling all the the passes we want it to contain. Every time you create a pass, you'll have to add it to the technique if you want to use it in Terraria. Also, make sure you use `ps_2_0`, or you'll get compatibility problems.

I'll leave out the parameters and techniques from now on to keep the code snippets short, but obviously you still need those if you're going to compile.

Okay, so let's make something more useful. Right now, we're writing the contents of a register to that same register, which is entirely useless. What we want to do for starters is to just draw the texture. To do so, we have to make some adjustments.
```hlsl
float4 ArmorBasic(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    return color;
}
```
So two things happened here: one, we added `float2 coords : TEXCOORD0` as a parameter, and two, we added something called `tex2D` To understand either of these, you first have to remember what I mentioned in the introduction: a pixel shader is executed for every pixel that the texture covers (not every pixel of the texture, but if you're drawing sprites at a scale of one that basically amounts to the same thing). Now, you can probably tell that `coords` takes the value of the TEXCOORD0 register just like `sampleColor` did, but what does the value actually mean? Basically, it represents the coordinates of the current pixel relative to the texture. This might sound complex, but hopefully this image clears it up:

![Coordinate illustration](https://i.imgur.com/A6Chqtu.png)

So, imagine the shader running on this texture. It will start in the top left corner, in which case `coords` will be equal to (0, 0). Halfway through the first row, it'll be (0.5, 0). In the dead center of the texture, it will be (0.5, 0.5), and at the bottom right corner it'll be (1, 1).

What does `tex2D` do then? Simply put, it samples the color data of `uImage0` at position `coords`. And because the shader runs for every pixel, and `coords` updates accordingly, essentially it's tracing the texture pixel by pixel. So what this pass does is nothing short of simply drawing your texture.

There's a problem, however, in that you are overwriting the contents of the color register. This can sometimes be useful when it is intentional (screen shaders generally do this), but it can also cause issues, especially if you're overwriting transparency. So usually, you want to multiply whatever your result is with the content of the register before writing to it:
```hlsl
float4 ArmorBasic(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    return color * sampleColor;
}
```
Sampling will form the basis of almost all of your passes, but doesn't do much by itself. Let's introduce some parameters.

## Parameters & Swizzles

Now we can draw our sprites, but that's not really any different from what the game already does: we want a custom effect. Say, for instance, we want to tint our sprite. If we didn't know any better, we might try to do this:
```hlsl
float4 ArmorTint(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    color *= uColor;
    return color * sampleColor;
}
```
Here, we're using our `uColor` parameter from our parameter list, but there's a problem: `color` is a `float4`, but `uColor` is a `float3`, and you can't multiply those with each other. What we want to is multiply the red, green and blue channels of our texture with the value of the parameter, so instead we do this:
```hlsl
float4 ArmorTint(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    color.rgb *= uColor;
    return color * sampleColor;
}
```
The line `color.rgb *= uColor;` is equal to:
```hlsl
color.r *= uColor.r;
color.g *= uColor.g;
color.b *= uColor.b;
```
This member access is what we call a swizzle. We use `rgba` to refer to color data, but sometimes you're working with positions, in which case `xyzw` makes more sense. Therefore, you could also do this:
```hlsl
color.xyz *= uColor;
```
This is exactly the same as the previous line, it's just syntactic sugar. You can even mix them up in the same line. What you can not do, however, is mix them up in the same swizzle:
```hlsl
color1.rgb = color2.xyz; // This is fine.
color1.xgb = color2.xyz; // This is not.
```
Anyway, let's get back to our original pass. Let's pass in pure red and see what happens:

![Red simple](https://i.imgur.com/2IhgYzX.png)

Not bad. Let's look at a slightly more complex example:
```hlsl
float4 ArmorLuminosity(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    float luminosity = (color.r + color.g + color.b) / 3;
    color.rgb = luminosity * uColor;
    return color * sampleColor;
}
```
What we do here is calculate the luminosity (brightness) of each pixel, and then multiply our color with it. This prevents large dark patches where your tint complements the color of the texture.

The result:

![Red luminosity](https://i.imgur.com/Pj1ozO8.png)

## Getting creative with coordinates

While we can already can do rather nice stuff, it's all rather uniform. To add some variety, we can work with our coordinates to get something nice. Let's make a simple gradient:
```hlsl
float4 ArmorGradient(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    color.rgb *= coords.x;
    return color * sampleColor;
}
```

If you remember the image above that explained how coordinates work, you might be able to guess what happens here: the leftmost pixels will be black, and will brighten to their original color. I had to slightly enhance the result for clarity, but it would look something like this:

![Gradient horizontal](https://i.imgur.com/hSNMYTl.png)

Simple, right? You can even combine two gradients into opposite directions:
```hlsl
float4 ArmorColorGradient(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    float luminosity = (color.r + color.g + color.b) / 3;
    color.rgb *= ((coords.x * uColor) + ((1 - coords.x) * uSecondaryColor)) * luminosity;
    return color * sampleColor;
}
```
![Gradient horizontal multicolor](https://i.imgur.com/w3PTOr3.png)

Alright, so that's horizontally. Let's try it vertically!
```hlsl
float4 ArmorVerticalGradient(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    color.rgb *= coords.y;
    return color * sampleColor;
}
```
![Gradient vertical bad](https://i.imgur.com/yIMcvQB.png)

Hm, that doesn't look right. If you look very closely, you might be able to see that the bottom of the robe is getting slightly brighter, but surely it should be fully bright at that point? What's going on?

The problem here is that coordinates are relative to the texture you are drawing, not the frame you are drawing. As you might know, every armor set in Terraria is twenty frames long, so the y-coordinate at the end of our first frame is only 0.05, rather than 1. This is especially evident once you look at a walk cycle:

![Gradient vertical bad anim](https://i.imgur.com/pZuvvF8.gif)

To solve this, we want the y-coordinate to be 0 at the beginning of our current frame and to be 1 at the end. Fortunately, there's a (relatively) simple formula for that:
```hlsl
float frameY = (coords.y * uImageSize0.y - uSourceRect.y) / uSourceRect.w;
```
You can work out exactly what this does in your own time, but it "shrinks" the coordinates to encompass just a single frame, and then shifts the origin to the active frame. Now, let's try this again:
```hlsl
float4 ArmorVerticalGradient(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    float frameY = (coords.y * uImageSize0.y - uSourceRect.y) / uSourceRect.w;
    color.rgb *= frameY;
    return color * sampleColor;
}
```
![Gradient vertical good](https://i.imgur.com/TD8CvHI.png)

Yep, that's much better!

## Passing time

(That might be the absolute worst pun I've ever made)

Now, there's a good chance you're here not for the boring gradient stuff, but because you want to make animated shaders, and you'd be right too! Actually, making an animated shader is deceptively easy: all you have to do is use the `uTime` parameter. However, the main problem is using it correctly.

Say I were to do this:
```hlsl
float4 ArmorAnimated(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    color.rgb *= uTime;
    return color * sampleColor;
}
```
Now, this would just increase the brightness until infinity (well, until one hour has passed, at which point it would reset, but that's still a long wait), and that's not really helpful. Instead, most dyes use a sine function to turn raw time into a sine wave. This will give you a nice and predictable scalar to use:
```hlsl
float4 ArmorAnimatedSine(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    color.rgb *= sin(uTime);
    return color * sampleColor;
}
```
![Sine animation](https://i.imgur.com/xQAqvm1.gif)

As you might know, a sine wave... well, waves... between 1 and -1. In this particular case, that negative range isn't really useful, as negative colors just display as black. If we wanted to remove that negative range and just bounce between 0 and 1, we could do this:
```hlsl
float time = (sin(uTime) + 1) / 2;
float altTime = sin(uTime) * 0.5f + 0.5f; // Same thing. [/code]
```
Apart from sine waves, there's another, less-useful-but-still-nice way to establish pattern, and that's by using `frac`, which gets the fractional component of a number. When used with `uTime`, you get a nice sawtooth pattern, ranging from 0 to 1 exclusive.
```hlsl
float4 ArmorAnimatedFrac(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    color.rgb *= frac(uTime);
    return color * sampleColor;
}
```
![Frac animation](https://i.imgur.com/djj1vSI.gif)

Okay, one more. What happens if we combine coordinates with time? Cool stuff, that's what:
```hlsl
float4 ArmorRadar(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    float wave = 1 - frac(coords.x + uTime);
    color.rgb = color.rgb * wave;
    return color * sampleColor;
}
```
![Radar dye](https://i.imgur.com/XvnaDFY.gif)
Becase we're adding `uTime` to `coords.x`, our 'split point' (where the results of `frac` jumps from ~0.99 back to 0) keeps shifting to the left, giving us a nice radar-like effect. Want to speed up or slow down the shift? Simply multiply `uTime` by a scalar:
```hlsl
float wave = 1 - frac(coords.x + uTime * 0.5f); // This would be half as fast.
float wave = 1 - frac(coords.x + uTime * 2); // This would be twice as fast. Or half as slow. Whatever takes your fancy.
```
## Making some noise

Finally, we'll take a look at how we can use noise to pep up our dyes a bit. Most dyes have a rather geometric feel to them, and sometimes that can be very nice. However, if you want to add some randomness (perceived or otherwise), you can use a noise map. Several dyes already do this: the stars in Twilight Dye, the sand in Shifting Sands Dye and the... eh, vortex... in Vortex Dye are all created through use of a noise map.

The applications of noise are very diverse, and I won't touch upon them all. However, one of the more common applications is to use it as an overlay. For that to work, we do have to do quite a bit of work, though.

The first problem you have to solve is the different pixel ratios: because coordinates range from 0 to 1 regardless of how large an image is, using one set of coordinates for both images will not cover the same amount of pixels if the images aren't the same size, which results in ugly stretching:
```hlsl
float4 ArmorNoise(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    float4 noise = tex2D(uImage1, coords); // Same coords
    color.rgb = noise.rgb;
    return color * sampleColor * color.a; // Multiplying by color.a to mask the invisible pixels.
}
```
![Noise bad](https://i.imgur.com/Kuw015o.png)

To convert texture coordinates to noise coordinates, you can use this formula:
```hlsl
float2 noiseCoords = (coords * uImageSize0 - uSourceRect.xy) / uImageSize1;
```
This gets the Cartesian coordinates of the pixel you want and then determines the coordinates that will get you that pixel. In practice, that would look like this:
```hlsl
float4 ArmorNoise(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    float2 noiseCoords = (coords * uImageSize0 - uSourceRect.xy) / uImageSize1;
    float4 noise = tex2D(uImage1, noiseCoords);
    color.rgb = noise.rgb;
    return color * sampleColor * color.a; // Multiplying by color.a to mask the invisible pixels.    
}
```
![Noise good](https://i.imgur.com/CjpZhBE.png)

You can then do all sort of things with it (most of them ugly):
```hlsl
float4 ArmorNoise(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    float2 noiseCoords = (coords * uImageSize0 - uSourceRect.xy) / uImageSize1;
    float4 noise = tex2D(uImage1, noiseCoords);
    float luminosity = (color.r + color.g + color.b) / 3;
    color.rgb = luminosity * noise.b * 2;
    return color * sampleColor;
}
```
![Noise applied](https://i.imgur.com/WP9ld0c.png)

If you simple want to sample the noise map for a pseudo-random scalar, you can dispense with all this: just sample with the normal coordinates, and it should work just as well.

These are pretty much all the building blocks you need to make your own shaders. While there are some more neat tricks you can pull off, this should be sufficient to get you going.

# Compiling your shader

Once you have finished writing a shader, you'll need to compile it before you can use it. There are two ways to do this: the most straightforward is to use an application that can compile .fx files into .xnb such as [fxcompiler](https://github.com/tModLoader/tModLoader/raw/refs/heads/gh-pages/downloads/fxcompiler.zip) ([Reach version](https://github.com/tModLoader/tModLoader/raw/refs/heads/gh-pages/downloads/fxcompiler_reach.exe)), or [EasyXnb](https://github.com/SuperAndyHero/EasyXnb/releases) (Required for shader model 3). The second way is to build them with a XNA application.

Using fxcompiler or EasyXnb is very simple: just put the files you want to compile into the same folder as the exe, run it, and you're done. Move the .xnb files to your mod folder (_YourModName/Effects_ is a good place to put them) and you're done. If you build them with a XNA application, they will end up in your bin folder.

A additional option is to use the Modders Toolkit Shader Tool. The Shader tool allows live testing and development of your shader in-game. More info can be found on the [Modders Toolkit Wiki](https://github.com/JavidPack/ModdersToolkit/wiki/Shader-Tool).

# Using your shader

How to use your shader largely depends on what kind of shader it is, but first and foremost you'll have to load them first. You do this in the `Load` function of your `Mod`:
```cs
using Microsoft.Xna.Framework.Graphics;
using Terraria.Graphics.Effects;
using Terraria.Graphics.Shaders;
using Terraria.ID;
using Terraria.ModLoader;
using ReLogic.Content;
using Terraria;

public class MyMod : Mod
{
	// stuff...

	public override void Load() {

		// All of this loading needs to be client-side.

		if (Main.netMode != NetmodeID.Server) {
			// First, you load in your shader file.
			// You'll have to do this regardless of what kind of shader it is,
			// and you'll have to do it for every shader file.
			// This example assumes you have both armor and screen shaders.

			Asset<Effect> dyeShader = this.Assets.Request<Effect>("Effects/MyDyes");
			Asset<Effect> specialShader = this.Assets.Request<Effect>("Effects/MySpecials");
			Asset<Effect> filterShader = this.Assets.Request<Effect>("Effects/MyFilters");

			// To add a dye, simply add this for every dye you want to add.
			// "PassName" should correspond to the name of your pass within the *technique*,
			// so if you get an error here, make sure you've spelled it right across your effect file.

			GameShaders.Armor.BindShader(ModContent.ItemType<MyDyeItem>(), new ArmorShaderData(dyeShader, "PassName"));

			// If your dye takes specific parameters such as color, you can append them after binding the shader.
			// IntelliSense should be able to help you out here.   

			GameShaders.Armor.BindShader(ModContent.ItemType<MyColorDyeItem>(), new ArmorShaderData(dyeShader, "ColorPass")).UseColor(1.5f, 0.15f, 0f);
			GameShaders.Armor.BindShader(ModContent.ItemType<MyNoiseDyeItem>(), new ArmorShaderData(dyeShader, "NoisePass")).UseImage("Images/Misc/noise"); // Uses the default Terraria noise map.

			// To bind a miscellaneous, non-filter effect, use this.
			// If you're actually using this, you probably already know what you're doing anyway.
			// This type of shader needs an additional parameter: float4 uShaderSpecificData;
			GameShaders.Misc["MyMod:EffectName"] = new MiscShaderData(specialShader, "PassName");

			// To bind a screen shader, use this.
			// EffectPriority should be set to whatever you think is reasonable.   

			Filters.Scene["MyMod:FilterName"] = new Filter(new ScreenShaderData(filterShader, "PassName"), EffectPriority.Medium);
		}
	}
}
```
You can also load your shader in the loading methods of your content or `ModSystem` classes. For example, [ExampleDye.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/ExampleDye.cs) shows loading the dye shader and binding it to the dye item all within the dye's `ModItem` class. It is much preferred to keep the shader loading code in the class that will use it. Also note the slight difference in syntax, `Mod.Assets.Request` is used instead of `this.Assets.Request`.

For dyes, this is entirely sufficient: equipping your dye item will show the dye. Simple, right? For filters, you'll have to activate them when appropriate. Activating (and deactivating) a filter is very simple:
```cs
if (Main.netMode != NetmodeID.Server) // This all needs to happen client-side!
{
    Filters.Scene.Activate("FilterName");

    // Updating a filter
    Filters.Scene["MyMod:FilterName"].GetShader().UseProgress(progress);

    Filters.Scene["MyMod:FilterName"].Deactivate();
}
```

For an example of how you can put filters to use, check out my other guide for a shockwave filter:

https://forums.terraria.org/index.php?threads/tutorial-shockwave-effect-for-tmodloader.81685/

# Tips & Tricks

I've already given most of my trade secrets away by now, but there are a few tidbits left that might be able to help you if you get stuck.

1. **Mask your sprite when necessary** -
Sometimes, your shader will fill up the transparent parts of your sprite as well. You can generally remedy this by multiplying your color by the alpha of your sample (unless you've overwritten it, which you shouldn't really be doing do). See the examples with noise maps above for an... well... example.
2. **Be efficient** -
Shaders are executed many times per frame. Make sure they're as fast as possible, or at the very least not any slower than necessary. Personally, I think that extends to all code, but I seem to be in the minority on that front.
3. **Be mindful with flashing effects** -
Certain people who suffer from epilepsy can get an epileptic insult from flashing effects. Be mindful of this, and if your mod does end up containing content that may trigger such insults, give due warning.
4. **Experiment!** -
Many of my dyes are the result of sheer mucking about. Don't be afraid to push the envelope (without blowing up your GPU, that is), you might be pleasantly surprised.

That's all I have to say. If you have any questions about anything in this thread, feel free to ask them here!

***

_Armor shader template_
```cs
sampler uImage0 : register(s0);
sampler uImage1 : register(s1);
float3 uColor;
float3 uSecondaryColor;
float uOpacity;
float uSaturation;
float uRotation;
float uTime;
float4 uSourceRect;
float2 uWorldPosition;
float uDirection;
float3 uLightSource;
float2 uImageSize0;
float2 uImageSize1;
float2 uTargetPosition;
float4 uLegacyArmorSourceRect;
float2 uLegacyArmorSheetSize;

float4 ArmorBasic(float4 sampleColor : COLOR0, float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    return color * sampleColor;
}

technique Technique1
{
    pass ArmorBasic
    {
        PixelShader = compile ps_2_0 ArmorBasic();
    }
}
```

_Screen shader template_
```cs
sampler uImage0 : register(s0);
sampler uImage1 : register(s1);
sampler uImage2 : register(s2);
sampler uImage3 : register(s3);
float3 uColor;
float3 uSecondaryColor;
float2 uScreenResolution;
float2 uScreenPosition;
float2 uTargetPosition;
float2 uDirection;
float uOpacity;
float uTime;
float uIntensity;
float uProgress;
float2 uImageSize1;
float2 uImageSize2;
float2 uImageSize3;
float2 uImageOffset;
float uSaturation;
float4 uSourceRect;
float2 uZoom;

float4 FilterMyShader(float2 coords : TEXCOORD0) : COLOR0
{
    float4 color = tex2D(uImage0, coords);
    return color;
}

technique Technique1
{
    pass FilterMyShader
    {
        PixelShader = compile ps_2_0 FilterMyShader();
    }
}
```