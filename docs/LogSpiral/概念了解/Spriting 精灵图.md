# What is a Sprite?

A "Sprite" refers to 2D graphics typically found in 2D games. For example, the Gold Bar item sprite, `Item_19.png`, looks like this: ![Item_19](https://user-images.githubusercontent.com/4522492/159594962-1a594c3c-cd6c-4741-b60e-f8409461d845.png) .  When making mods, you'll typically need to make a sprite for each bit of visual content you add to your mod. 

This guide will teach you the basics of spriting and how sprites work in relation to tModLoader.

## Sprite Frame
Many sprites have several "frames" within a single image - usually referred to as spritesheets. These are typically used for animation or variation. For example, the GiantBee projectile looks like this:     
![](https://i.imgur.com/jRhab1A.png)    
You can find this texture in your extracted copy of the vanilla textures by finding `Projectile_566.png`. The game was told by the programmer that this sprite has 4 frames in it, so the game knows to split the 96 pixel high texture into 4 equally sized 24 pixel high sections. The game cycles between these 4 frames as the game draws this projectile

Some sprite frames are for variety. Here is the Metal Bars sprite, `Tiles_239.png`, this sprite is shared between all metal bar tiles:    
![](https://camo.githubusercontent.com/9781684c4d69c2de30fc3495148a112bf50207246f4dbf1da36bb5a7afa28620/68747470733a2f2f692e696d6775722e636f6d2f62716f794c71542e706e67)    
Spriting tiles is a full topic for itself, please consult the [Basic Tile](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile#framed-vs-frameimportant-tiles) guide and confirm specifics with your programmer before making tile sprites.




## File Format
Every tModLoader sprite must be a .png file. As long as you don't mess with settings in your program, saving as a .png should work fine. 


## Sprite Making Tools
You **will need** to use a capable art / spriting program. MS Paint (pre-Windows 11) will not work for most sprites you might want to make because it can not save transparent pixels. See [](https://github.com/tModLoader/tModLoader/wiki/Basic-Prerequisites#drawing-program) to find a list of suitable programs. The rest of this guide will use Aseprite in example diagrams, but any of these programs should have similar capabilities.

While the full version costs money, Aseprite does offer a free compilable version that is 100% safe and legal to use. You can compile it by using [this guide](https://github.com/aseprite/aseprite/blob/main/INSTALL.md).

Other spriting programs that are recommended include, but are not limited to:
* [Piskel](https://www.piskelapp.com/)
* [GIMP](https://www.gimp.org/)
* [LibreSprite](https://libresprite.github.io/#!/)
* [paint.NET](https://www.getpaint.net/)

## Vanilla Sprite Resources
Before getting started, we recommend extracting the vanilla sprites to a folder you can easily access. We will be using the `C:\Documents\My Games\Terraria\ModLoader\VanillaTextures` folder in this guide. To do this, follow [this guide](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Prerequisites#vanilla-texture-file-reference). We will be using these textures as guides for sizing and orientation of similar content we will be making in our mod. 

If you just need a reference for how big various vanilla textures are, you can consult this [text file](https://forums.terraria.org/index.php?attachments/sprite-information-spreadsheet-tsv.384515/). 

## Live Editing Sprites
If you need to make slight adjustments to a tile or armor texture, it can be very time consuming to make sprite changes, rebuild the mod, reload mods, then test in-game to see if the changes were correct. You can use a mod called "Modders Toolkit" to edit textures live in-game. Follow the video below to see how that is done. After making changes, you'll need to rebuild the mod for the changes to persist.

<details><summary>Live editing sprites showcase video</summary><blockquote>

**Instructions:** Download and enable the [Modders Toolkit](https://steamcommunity.com/sharedfiles/filedetails/?id=2573569299) mod. In-game, click the small icon in the bottom left, then find the button that says "Click to toggle Texture Tool" and click it. The texture tool should be showing. Click the mod you are working on in the listing, then check "Watch Mod Sources". Use your image editing program to make adjustments. When you save your changes in the image editing program, Modders Toolkit will notice the changes and update the in-game texture for you. 

https://github.com/tModLoader/tModLoader/assets/4522492/9da8b20d-3fa8-4fd8-9724-8e844364e868

</blockquote></details>

## Making Sprites

### 2x2 Pixels
Terraria uses a pixel art style where each pixel is actually a 2x2 block of pixels. You do not have to follow this art style, but be aware of this concept. If you would like to follow this style, you can simplify your efforts by drawing in normal pixels and scaling your resulting sprite by 200% while using the "Nearest Neighbor" option when resizing. Note that this will also change the padding from 2 pixels to 1.

If somehow your sprite upscales incorrectly, a common term you may see thrown around is mixels. A "mixel" refers to mixed sized pixels within a sprite, leading to inconsistency and making the sprite appear messy. It is recommended to always sprite in 1x1 pixels and then upscale to 2x2, not the other way around or with a mixture of the two. 

Another concern is players may be tempted to use `Item.scale` to adjust the size of their sprites directly if they appear too small. While this is useful in the sense of converting 1x1 sprites to 2x2, this certainly isn't useful for cases such as converting an already 2x2 sprite to something bigger (say 4x4). The reasoning you wouldn't use this is due to upscaling a sprite in this manner causing both mixels (as discussed prior) as well as it won't match with the 2x2 sprites in the game already.

The left side of this example has inconsistent pixel sizes, whereas the right keeps it consistent. The right ends up looking cleaner since it is consistent within itself.    
![](https://i.imgur.com/06pNr1r.png)    

### Dimensions
The dimension of a sprite refers to the height and width the sprite is comprised of. For example, a sprite that is 20 pixels wide and 20 pixels tall would be a 20x20 sprite.

The maximum dimensions a sprite can be is 2048x2048 before being resized - so 1024x1024 before being resized to 2x2.

## Art Tools

## Padding
When a sprite has several frames, we use padding to separate the individual frames. By default, Terraria expects 2 pixels of padding between each frame. For horizontally laid out frames, this means 2 pixels of padding below each frame, even the last one. Here is the GiantBee projectile sprite with magenta padding drawn in to show where padding goes.    
![](https://i.imgur.com/CYsKgX3.png)    

For tiles, the padding goes to the right and below each frame.

## Animation
Animation is done by including several frames of animation within your sprite. Make sure the frames are evenly spaced.

--Example here of incorrect spacing, then fixed with guidelines showing padding and even texture splitting--

Animation typically loops, but custom animation cycles are also possible. The animation speed and pattern are up to your programmer, so the details of that are found in separate guides. 
* [Projectile Animation Code Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#animationmultiple-frames)

## Orientation
Many things in Terraria have an expected orientation. For example, NPC sprites usually face left ![](https://i.imgur.com/PhcRvIa.png), arrow projectiles point up ![](https://i.imgur.com/ogDFqEa.png), and staff point to top right ![](https://i.imgur.com/ax451LJ.png). These conventions are useful to follow because the code drawing these sprites expects the sprites to be oriented in a specific manner. Hitboxes and drawing will be wonky if you do not follow these conventions. Consult the most similar vanilla sprite for a good idea on how to orient your sprite.

### Projectile

### Glowmasks
Glowmasks refer to a separate sprite that is drawn at full brightness regardless of lighting. This is typically used for glowing lights on weapons. For example, the regular VortexDrill item sprite, ![](https://i.imgur.com/Oa54l03.png), can only be seen when there is light around, but the corresponding glowmask sprite, ![](https://i.imgur.com/dNTFMTM.png), is drawn in full brightness regardless of nearby lights:    
![](https://i.imgur.com/jjV8Txq.png) ![](https://i.imgur.com/hGEHjCu.png)

To make a glowmask sprite, make a copy of the original sprite and remove all pixels that shouldn't "glow". Your programmer will then need to write some code to make it draw correctly.

# Example
Here we will make a sprite for a sword. First, I'll look at a similar vanilla sword sprite to get an idea on how big I want to make it. First, I'll look up a weapon with the size I'm interested in on the wiki. Lets go with [Muramasa](https://terraria.wiki.gg/wiki/Muramasa). The item sprites on the wiki aren't exactly the same as the actual sprites, so don't use that sprite. Instead, find the ItemID by looking for "Internal Item ID: ###" in the infobox. Here we see the number is 155, so open up your copy of the extracted vanilla sprites and find `Item_155.png`. Open this file in your sprite editor and use Save As to save a copy of this file to the folder where you are saving your sprites. Now, feel free to draw a sword while keeping the same orientation and general size. Take note of the 2x2 pixels as well. By using this approach, you will make a sprite that will appear the same size as a vanilla weapon. In this case, the sprite is 58x58 pixels. With time, you'll learn the conventions of various entity sizes and be able to make sprites without needing vanilla texture guides.

# Making Good Pixel Art

This guide has focused on the technical details of how sprites are structured and how to integrate them into your mod. If you find making sprites difficult, it may be worth finding an artist friend to collaborate with. If, however, you want to further develop your artistic skills, there are many learning resources on the internet to guide you. Joining the [tModLoader Discord server](https://discord.gg/tmodloader) and visiting the `#spriting` channel is a great way to get advice and feedback from other spriters. Here are some links to other learning resources:
* [The Ultimate Pixel Art Tutorial (Video)](https://www.youtube.com/watch?v=lfR7Qj04-UA)