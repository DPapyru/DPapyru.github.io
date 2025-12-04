# Purpose
This will explain the bare minimum that is required to draw a simple UI element (button) on the screen. Drawing one element has multiple steps and understanding these are required to build larger UI aspects.

# High Level Process
This image explains the general classes and process you will follow to draw a simple button on the screen. Notice you aren't drawing the UI element on screen until the very last step.  
![ui-process](https://user-images.githubusercontent.com/8439537/80857675-c28f0000-8c08-11ea-95df-39712a2159c3.png)

# Making a Button
Making a button is fairly straight forward. You'll want to make a new class and inherit from UIElement from vanilla code. 
```cs
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Terraria.UI;
using Terraria;
using Terraria.ModLoader;

namespace YourMod.UI
{
    class PlayButton : UIElement
    {
        Color color = new Color(50, 255, 153);

        public override void Draw(SpriteBatch spriteBatch)
        {
            spriteBatch.Draw((Texture2D)ModContent.Request<Texture2D>("Terraria/Images/UI/ButtonPlay"), new Vector2(Main.screenWidth + 20, Main.screenHeight -20) / 2f, color);
        }   
    }
}
```
Notice a few things:
* I named my class after the element it will be. This will be a button that displays a play symbol
* spriteBatch.Draw is using a vanilla texture (the play button texture itself)
* The Vector2 parameter you feed spriteBatch.Draw uses the _screen_ coordinates the player can see, not _world_ coordinates. The UI element is set to spawn in the middle of the screen with a little offset so that it's not right on the player

# Place the Button in a UIState/Canvas
The correct terminology (and class) is UIState. However, I think it's easier to think of the next piece as a canvas an artist draws on. You can place hundreds of buttons on this if you really wanted to. You _would_ need to let your buttons accept custom starting coordinates in its constructor however. Right now, it would draw all of the hundreds of buttons in the same spot.

For a lack of a better idea, we'll call this state/canvas that the button will go on a menu bar even though it will only hold one button for now.
```cs
using Terraria.UI;

namespace YourMod.UI
{
    class MenuBar : UIState
    {
        public PlayButton playButton;

        public override void OnInitialize()
        {
            playButton = new PlayButton();

            Append(playButton);
        }
    }
}
```
Notice the following:
* Only one of our newly made play buttons is used, and it's using whatever default it has back in the the PlayButton class (drawn in center of screen)
* We must Append() the playButton to the UIState/canvas for it to show up when we draw it later

# Drawing the UIState/Canvas to the Screen
Now comes the fun part. We currently have a button that is placed on a MenuBar UIState/canvas. Now we'll make a copy of that to give to the user interface class, and then tell the game to draw it. Think of the MenuBar UIState/canvas as the original and the user interface as the copy, or the MenuBar as a stamp and user interface as the ink.

The following code is required to go in your class file that inherited from `ModSystem`.

First, we need to annotate the `ModSystem` class with `[Autoload(Side = ModSide.Client)]` to allow the mod to load on servers without erroring. We do this to make sure that UI code is not executing on servers. UI code on servers will cause errors because textures, fonts, and other graphical assets can't be loaded in that context.
```cs
namespace YourMod.UI
{
	[Autoload(Side = ModSide.Client)]
	public class MenuBarSystem : ModSystem
	{
```

Next, we'll declare a variable of UIState we made above which holds our single button.
```cs
internal MenuBar MenuBar;
```
Next, we'll declare a variable of the UserInterface that will use the MenuBar later. We did not need to create this class or inherit from it.
```cs
private UserInterface _menuBar;
```
In Load(), let's set the two above to actual instances, then feed the MenuBar to the UserInterface. If you don't Activate() the UI element here while the mod is loading, you will crash once the game starts. It will throw a _Object reference not set to an instance of an object_ error.
```cs
public override void Load()
{
    MenuBar = new MenuBar();
    MenuBar.Activate();
    _menuBar = new UserInterface();
    _menuBar.SetState(MenuBar);
}
```
I'm unclear on the next part but assume it's needed so here it is.
```cs
public override void UpdateUI(GameTime gameTime)
{
    _menuBar?.Update(gameTime);
}
```
And finally, we end with the most complicated part. I was told all of this code is required and cannot explain to you how it works. Essentially this is where the drawing actually occurs after we've fed the UserInterface everything it needed. If you do not use this code, your entire UI will disappear!
```cs
public override void ModifyInterfaceLayers(List<GameInterfaceLayer> layers)
{
    int mouseTextIndex = layers.FindIndex(layer => layer.Name.Equals("Vanilla: Mouse Text"));
    if (mouseTextIndex != -1)
    {
        layers.Insert(mouseTextIndex, new LegacyGameInterfaceLayer(
            "YourMod: A Description",
            delegate
            {
                _menuBar.Draw(Main.spriteBatch, new GameTime());
                return true;
            },
            InterfaceScaleType.UI)
        );
    }
}
```
# Results
At this point, your screen should have a button just like this. Notice it's not a menu bar... yet. You'd simply add and arrange more UIElements to it in the future.

![terraria-button](https://user-images.githubusercontent.com/8439537/80858632-6380b980-8c0f-11ea-950e-c4740ef506c1.png)

Ok, so it might not be the most exciting thing in the world, but you should now be able to iterate off of this idea and make whatever elements you'd like.

To quickly understand what you can do with the UIElements, create a new class, inherit from it but do not add anything yet. Right click within the class brackets, click quick actions and then auto generate overrides. That will allow you to figure out what actions you can take. Notice that Draw() showed up! Since it looks like Draw() is drawing a sprite batch, you should right click on SpriteBatch and peek its definitions to get more ideas. If you look closely, you'll see that we could have called Draw() in our UIElement code many different ways.

# Medium Level Example
Finally, if you'd like more hand-holding then check out Example Mod's `ExampleCoinUI` and study how they implemented some UI elements [here](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Common/UI/ExampleCoinsUI). Keep in mind the three classes we discussed above and you should be able to figure it out. You'll notice they use other classes in place of `UIElement` that aid in the implementation of certain UI pieces (`UIPanel` and `UIImageButton`)

# 
Thanks to Scalie and absoluteAquarian for helping me figure this out.
