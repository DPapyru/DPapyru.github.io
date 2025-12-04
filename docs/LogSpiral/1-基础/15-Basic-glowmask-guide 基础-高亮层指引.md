In this guide we will go over glowmasks, what they are and how to apply them.

## What is 'masking', and how is it used in Terraria?
First, you need to know what a 'mask' is before you can understand what a glowmask is. Masking in art is commonly used for protecting a selected area from change during production, in Terraria we are doing almost the same. By applying a glowmask in Terraria, we are not really masking any part of the original sprite (like how you would do in art), instead we have a separate sprite containing the pixels we want to mask. This sprite is then drawn on top of the original sprite, with its color not influenced by light, creating a glow effect.

## What does a Terraria glowmask look like?
Here is an example of a weapon, and its glowmask:

| Normal sprite | Glowmask sprite |
|:-------------:|:-------------:|
| ![](https://i.imgur.com/8T2z1Qi.png) 	| ![](https://i.imgur.com/MxWHKGa.png) |

You can see that in the glowmask, we are only displaying the pixels we want to mask, any other pixels are removed. Since glowmasks are used to draw parts not influenced by light, it is most often the pixels of parts that would be lit up (or give light themselves) in real life that stay in the glowmask sprite.

## What can glowmasks be applied to?
A glowmask can be applied to virtually anything you want, be it an npc, projectile, item, or even an armor the player is wearing. For equipped gear (and also weapons being held), you would use PlayerLayers which is beyond basic and thus not covered in this guide.

## How do I 'apply' a glowmask?
Vanilla has its own 'system' for glowmasks in place, however you can **not** make use of this system as it does not accommodate for modded content. Also, the word 'apply' should be loosely taken as you don't really apply your glowmask to the original sprite, instead we will be drawing the glowmask separately from the original sprite.

### How do I draw my glowmask?
For drawing your glowmask on top of the original sprite, you will want to use the appropriate **Post**Draw hook. This will ensure the glowmask draws on top of the original sprite. You can also opt for complete manual drawing by overriding the appropiate **Pre**Draw hook, this requires more manual work however and is not recommended unless required because of something else. It is common to suffix sprite names with _Glow or _Glowmask as a naming convention. Here is an example of using PostDrawInWorld to draw a glowmask for an item that is dropped in the world: 
```csharp
public override void PostDrawInWorld(SpriteBatch spriteBatch, Color lightColor, Color alphaColor, float rotation, float  scale, int whoAmI) 	
{
	Texture2D texture = ModContent.Request<Texture2D>("YourModName/Items/MyItem_Glowmask", AssetRequestMode.ImmediateLoad).Value;
	spriteBatch.Draw
	(
		texture,
		new Vector2
		(
			item.position.X - Main.screenPosition.X + item.width * 0.5f,
			item.position.Y - Main.screenPosition.Y + item.height - texture.Height * 0.5f + 2f
		),
		new Rectangle(0, 0, texture.Width, texture.Height),
		Color.White,
		rotation,
		texture.Size() * 0.5f,
		scale, 
		SpriteEffects.None, 
		0f
	);
}
```
You don't _have to_ use this code as it only serves as example. Generally there is just a few steps you need to follow when drawing a glowmask:
* Make sure you draw the glowmask sprite, not the original sprite
* Make sure to draw with Color.White or at least a color that is fully opaque
  * Achieve opaqueness by increasing the alpha channel closer to 255. (lowering closer to 0 will achieve transparency) Remember that XNA Colors take _bytes_ for their RGBA channels, so the values range between 0 and 255
* Make sure to draw with a center origin (if required)
  * You can get the center origin with: `texture.Size() * 0.5f`
* Make sure the original sprite and the glowmask sprite have the same size
* Better to cache Texture2D requested with ModContent.Request, e.g. request it beforehand and save into variable, and use that variable instead


