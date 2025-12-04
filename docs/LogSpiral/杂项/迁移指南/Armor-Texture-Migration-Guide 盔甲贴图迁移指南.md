1.4 includes support for a new streamlined body armor texture format. This affects `EquipType.HandsOn/HandsOff/Body`. The old styles must be converted to the new styles in order to draw correctly.

# Body Texture
The previous `Body`, `Arms`, and `FemaleBody` textures have been combined into one new texture. The new texture contains "extended" arm sprites. These extended arm sprites are used in:
* Eating food (`ItemUseStyleID.EatFood`)
* Playing golf (`ItemUseStyleID.GolfPlay` and `ItemHoldStyleID.HoldGolfClub`)
* Drinking potions (`ItemUseStyleID.DrinkLiquid`)
* Using the Lawn Mower (`ItemUseStyleID.MowTheLawn`)
* Playing guitars (`ItemUseStyleID.Guitar` and `ItemHoldStyleID.HoldGuitar`)
* Swinging shortswords (`ItemUseStyleID.Rapier`)
* Using the Nightglow (`ItemUseStyleID.RaiseLamp` and `ItemHoldStyleID.HoldLamp`)
* Petting the Town Pets.

You can see examples of these Use Styles on the [Terraria Wiki](https://terraria.wiki.gg/wiki/Use_Style_IDs).

# Texture Templates and Tools

* [Sprite Transformer](https://forums.terraria.org/index.php?threads/96210/): A tool to quickly convert the old Body, Arms, and FemaleBody textures into the new format. As stated on the forum page, the tool is not 100% accurate because many of the new textures were hand drawn by Re-Logic. You will need to do some additional editing.

Use these templates as a reference when creating your new texture.
* [Sheet reference (by Mirsario)](https://cdn.discordapp.com/attachments/176975207800504321/852404448847986718/armor-template-3.png)
* [Sheet reference (by Re-Logic)](https://imgur.com/ZbAsfkn.png)
* [Sheet reference (full player)](https://imgur.com/8dzJAr3.png)
* [Sheet reference (full player with Copper Armor)](https://imgur.com/0iw2Tw2.png)
* [Sheet reference (full player with Scarecrow Shirt)](https://imgur.com/H5P8qN4.png)
* [Sheet reference (full player, dim)](https://imgur.com/UIyCVN2.png)
* [Colored areas reference](https://imgur.com/Xsxt4EF.png)
* [Colored areas reference (labeled)](https://imgur.com/3nhay8x.png)

# Full Porting Example

## Body

Here we will port the Solar Flare armor from the 1.3 textures into the 1.4 texture.

1. We have our 1.3 style `Body`, `Arms`, and `FemaleBody` textures.

 ![](https://imgur.com/dn1fror.png) ![](https://imgur.com/qsJK939.png) ![](https://imgur.com/yomz856.png)

2. We will input them into Sprite Transformer which will generate our new texture. If your armor set does not have a `FemaleBody`, check the "Use Body sprite sheet for Female equivalent" option in Sprite Transformer. 

 ![](https://imgur.com/BKALEWo.png)

 While Sprite Transformer is trying its best with the limited information it has, it's generated texture is not perfect. Notice the lack of the shoulder section. We will have to manually edit this texture to fix the issues. Use the references above as a guide for what goes where. Something to note: the shoulder sections will always draw over the arms except for when swinging and jumping.

3. We will edit the texture generated from Sprite Transformer to fix its issues. Here is what the finished Solar Flare Chestplate looks like: (From 1.4)

 ![](https://imgur.com/hRPTGA3.png)

Notice how the shoulders are now in the correct location, the arms are more complete, and the body sections are more complete.
 
## Accessories

HandsOn and HandsOff accessories need to follow this new format as well. Here we will port the Fire Gauntlets from the 1.3 style into the 1.4 style.

1. We have our 1.3 style `HandsOn` and `HandsOff` textures respectively.

 ![](https://imgur.com/xmlNoOn.png) ![](https://imgur.com/Jw5E7WS.png)

2. We can use Sprite Transformer for these too, but it is a little tricky. Sprite Transformer requires that we have a Body texture selected. We can use an [empty texture](https://imgur.com/saRgNdG.png) that is 40 × 1120 to use as our Body texture and then select the "Use Body sprite sheet for Female equivalent" option. Sprite Transformer's output looks like this, HandsOn and HandsOff textures respectively.

 ![](https://imgur.com/NyT3exB.png) ![](https://imgur.com/2iv76Wb.png)

3. The HandsOn texture looks very good. All we have to do is remove the extra extended section on the far right. The HandsOff texture is not very good, however. Sprite Transformer doesn't know that it was supposed to be the back hand. We will have to move it down ourselves and create extended sprites for it. Here is what our finished textures look like: (From 1.4)

 ![](https://imgur.com/btDMar7.png) ![](https://imgur.com/Dmiq7PZ.png)

# Additional Information and Pitfalls

More information about textures can be found on the [Terraria Workshop forum post](https://forums.terraria.org/index.php?threads/the-ultimate-guide-to-content-creation-and-use-for-the-terraria-workshop.100652/#advancedtexturepack)

### Texture Size

The final body texture should be 360 × 224

### Vanilla Textures

To see the vanilla textures for yourself, use a tool like [TConvert](https://forums.terraria.org/index.php?threads/61706/) to extract the vanilla assets. Make sure to look specifically in the `Images/Armor` folder for the armor and `Images/Accessories` folder for the accessories.

### "When I extract vanilla `Acc_HandsOn_#` or `Acc_HandsOff_#` accessories I still get the old texture format!"

Look in the `Images/Accessories` folder for the new style of textures. The `Acc_HandsOn_#` and `Acc_HandsOff_#` textures located in just the `Images` folder are the old format.

### "When I use Sprite Transformer, my output texture is just black and white!"

Set your source images to RGB colors instead of Indexed colors.

### "When I use Sprite Transformer, clicking Transform does nothing!"

Set your source images to RGB colors instead of Grayscale colors.

### "When I use Sprite Transformer, my output texture has strange dithering and a black background!"

Set your source images to 32-bit depth.