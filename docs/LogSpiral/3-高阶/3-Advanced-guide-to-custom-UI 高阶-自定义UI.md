In this guide you will learn about the various UI classes present in vanilla you can use to mod your own UIs. You should know about the following subjects before following this guide:

* Class hierarchy and inheritance
* Abstract / virtual and override
* Object oriented programming (in relation to class inheritance)

# Brief
UI in Terraria consists of various classes, most notably: UIElement, UIState, and UserInterface. We will go over each class and its importance in the process of creating a UI.

# Object relation
A custom UI is nothing more than a custom `UserInterface` with its state set to a custom `UIState`. In general, a UserInterface can have one _active_ UIState (it can however hold a history of states, up to a cap, which you can go back to), that state is then currently shown in that UserInterface. 

# UserInterface
There is no reason to create a custom class that derives from `UserInterface`. (Although you could, since the class isn't sealed) For most cases, simply declare a new field of type UserInterface in your ModSystem class. We will come back to this later.

# UIState
A `UIState` represents the state an interface is in. The class itself is very simple: it's actually a `UIElement` that spans across the entire screen width and height, allowing you to add an element anywhere on the screen.

# UIElement
The `UIElement` represents a class that is any kind of UIElement that can be part of an interface. Vanilla examples are the classes `UIPanel`, `UIImage` and `UIImageButton`. Each of which has a certain functionality to it. (Show a background panel, show an image or show a clickable button image respectively) You can make your own custom elements by deriving your class from UIElement. We will come back to this.

# Initial setup
First, you need a class that inherits from `ModSystem`, you can use an existing one or create a new one:

```cs
class MyUISystem : ModSystem { }
```

Then you'll need a UserInterface and UIState. You can define these new fields in your ModSystem class:

```cs
internal UserInterface MyInterface;
```

For your UIState, you should make a new custom class:

```cs
class TheUI : UIState { }
```

Then create a field for it in your ModSystem class:

```cs
internal TheUI MyUI;
```

## Initialize the UI
Because UI is something only to be seen by players, you shouldn't initialize UI on the server. This wastes resources and the server doesn't play the game nor see any graphics. Only initialize on the client. In your `ModSystem.Load()`, initialize your UI:

```cs
if (!Main.dedServ) {
    MyInterface = new UserInterface();

    MyUI = new TheUI();
    MyUI.Activate(); // Activate calls Initialize() on the UIState if not initialized and calls OnActivate, then calls Activate on every child element.
}
```

In your `ModSystem.Unload()` you can call any unload action you might need on your UI, and then set it to null:

```cs
MyUI?.SomeKindOfUnload(); // If you hold data that needs to be unloaded, call it in OO-fashion
MyUI = null;
```

Unload on the UI as shown above is not recommended, as it in general is bad practice to make UI responsible for data. However, it is useful if your UI holds static references such as textures.


## Updating and drawing the UI
Setting the state of your interface is nice, but the UI isn't magically called to update or draw itself. To do this you must override `ModSystem.UpdateUI(Gametime gameTime)` and `ModSystem.ModifyInterfaceLayers(List<GameInterfaceLayer> layers)`:

```cs
private GameTime _lastUpdateUiGameTime;

public override void UpdateUI(GameTime gameTime) {
    _lastUpdateUiGameTime = gameTime;
    if (MyInterface?.CurrentState != null) {
        MyInterface.Update(gameTime);
    }
}
```
The above snippet will call .Update on your interface and propagate it to its state and underlying elements.

```cs
public override void ModifyInterfaceLayers(List<GameInterfaceLayer> layers) {
    int mouseTextIndex = layers.FindIndex(layer => layer.Name.Equals("Vanilla: Mouse Text"));
    if (mouseTextIndex != -1) {
        layers.Insert(mouseTextIndex, new LegacyGameInterfaceLayer(
            "MyMod: MyInterface",
    	    delegate
            {
                if ( _lastUpdateUiGameTime != null && MyInterface?.CurrentState != null) {
                    MyInterface.Draw(Main.spriteBatch, _lastUpdateUiGameTime);
                }
                return true;
            },
            InterfaceScaleType.UI));
    }
}
```
The above snippet adds a custom layer to the vanilla layer list that will call .Draw on your interface if it has a state. This will make your UI actually draw and show up on screen. Set the InterfaceScaleType to UI for appropriate UI scaling.

- Notice that, in this case you're adding your UI layer below the "Mouse Text" layer, this means your UI will be drawn before that layer. You can add your custom layer next to other layers (vanilla or not) by looking for layers with other names. For a list of vanilla interface layers you can go [here](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Interface-layers-values).

## Showing the UI
For testing purposes, it is recommended to add a hotkey or other easily accessible means to toggle the UI. To show your UI, you need to set the interface's state to your UI instance. You should do it by accessing the instance of your ModSystem and calling .SetState:

```cs
MyUISystem uiSystemInstance = ModContent.GetInstance<MyUISystem>();
uiSystemInstance.MyInterface.SetState(uiSystemInstance.MyUI);
```

This snippet will set the state to your UI, causing it to show. If you want to hide the UI, simply pass `null` into the method call.

You can see why it is useful to use a dedicated class for your UIs. It is useful to make helper methods for this, such as:
```cs
internal void ShowMyUI() {
    MyInterface?.SetState(MyUI);
}

internal void HideMyUI() {
    MyInterface?.SetState(null);
}
```

And then simply call them:

```cs
ModContent.GetInstance<MyUISystem>().ShowMyUI();
ModContent.GetInstance<MyUISystem>().HideMyUI();
```


## State history
The interface keeps track of a state history. If you wish to go back to the previous state, you can call `MyInterface.GoBack()`, which will activate the previous state in history if there is one. Keep in mind it will remove the activated state from the history, so you need to call .SetState or .AddToHistory to put it back. History holds up to 32 states, if you add a new state in history if there are already 32, the oldest 4 states are removed. The state history is useful if your interface's state is constantly changed, for example if a progressive UI (e.g. pagination or tabs)


# Adding elements

If you activate your UI now, you might be confused since nothing shows. This is because your UI is empty.  
You can add any elements you want to the UIState, and they will then show up.

In your MyUI class, override the `OnInitialize` method. For example add a new UIPanel to the state:
```cs
public override void OnInitialize() { // 1
    UIPanel panel = new UIPanel();    // 2
    panel.Width.Set(300, 0);          // 3
    panel.Height.Set(300, 0);         // 3
    Append(panel);                    // 4
}
```
1) Override the OnInitialize method. This is called when we initialize the UI when our mod loads.
2) Create a new UIPanel instance. This is a vanilla class that will draw a vanilla styled backdrop on this element.
3) Set the width and height to something bigger so we can see it.
4) Append the panel to our UIState. Append is a method on the UIElement class and it allows you to add child elements to that element. Children are placed relative to that element. Since UIState covers the entire screen, our UIPanel will show up in the top left origin of the screen.


## Adding some text
Let's spice things up by adding some text to our UIPanel. We can do this in the same fashion, but this time appending the element to our panel variable:
```cs
public override void OnInitialize() {
    UIPanel panel = new UIPanel();
    panel.Width.Set(300, 0);
    panel.Height.Set(300, 0);
    Append(panel);

    UIText text = new UIText("Hello world!"); // 1
    panel.Append(text);                       // 2
}
```
1) Initialize the UIText.
2) The UIText element is now a child of the UIPanel element. The text should show in the UIPanel.

## Centering element
Most of your time will be spent perfecting placement of elements in your UI. You will be messing with various fields on the UIElement class:
```cs
public StyleDimension Top;
public StyleDimension Left;
public StyleDimension Width;
public StyleDimension Height;
public StyleDimension MaxWidth = StyleDimension.Fill;
public StyleDimension MaxHeight = StyleDimension.Fill;
public StyleDimension MinWidth = StyleDimension.Empty;
public StyleDimension MinHeight = StyleDimension.Empty;
public bool OverflowHidden;
public float PaddingTop;
public float PaddingLeft;
public float PaddingRight;
public float PaddingBottom;
public float MarginTop;
public float MarginLeft;
public float MarginRight;
public float MarginBottom;
public float HAlign;
public float VAlign;
```

Centering an element is a common use case for modders. Centering an element relative to it's parent is easy. To center the text in our UIPanel, we can use HAlign and VAlign, and set both to 0.5f:
```cs
public override void OnInitialize() {
    UIPanel panel = new UIPanel();
    panel.Width.Set(300, 0);
    panel.Height.Set(300, 0);
    Append(panel);

    UIText text = new UIText("Hello world!");
    text.HAlign = 0.5f; // 1
    text.VAlign = 0.5f; // 1
    panel.Append(text);
}
```
This is basically setting our horizontal and vertical alignment to 50%, centering our element.

### Header-like text
We can use these alignment tricks to perfectly align our text like a header, if we want. We can set HAlign to 50% to horizontally center our text, we can either set VAlign to a low value or a fixed absolute value by setting the Top position. The latter is recommended:
```cs
public override void OnInitialize() {
    UIPanel panel = new UIPanel();
    panel.Width.Set(300, 0);
    panel.Height.Set(300, 0);
    Append(panel);

    UIText header = new UIText("My UI Header");
    header.HAlign = 0.5f;  // 1
    header.Top.Set(15, 0); // 2
    panel.Append(header);
}
```
1) Set the horizontal alignment to 50%
2) Set the Top position to 15 pixels. The text should be 15 pixels down relative to the UIPanel. Remember you could use VAlign for this, but it will scale as your UIPanel changes size. This may screw up things as you change the UIPanel's size.


### Centering the UIPanel
Your UI probably still shows in the top-left corner of your UIState. Most modders will want their UI show up in the center of screen. Because UIState spans across the entire screen size, we can use the HAlign and VAlign trick to center our UIPanel:

```cs
public override void OnInitialize() {
    UIPanel panel = new UIPanel();
    panel.Width.Set(300, 0);
    panel.Height.Set(300, 0);
    panel.HAlign = panel.VAlign = 0.5f; // 1
    Append(panel);
}
```

1) This is a neat trick to set both fields to the same value.

This trick however will not work if you change how your UIState spans across the screen, or if your UIPanel isn't appended to the UIState itself. Beware of the parent of your UIPanel and align it accordingly.


# Interaction with UIElements
The most common interaction modders want is doing something when an item is clicked, such as a button.  
Let's add a button to the UI with an interaction:

```cs
public override void OnInitialize() {
    UIPanel panel = new UIPanel();
    panel.Width.Set(300, 0);
    panel.Height.Set(300, 0);
    Append(panel);

    UIText header = new UIText("My UI Header");
    header.HAlign = 0.5f;
    header.Top.Set(15, 0);
    panel.Append(header);

    UIPanel button = new UIPanel();   // 1
    button.Width.Set(100, 0);
    button.Height.Set(50, 0);
    button.HAlign = 0.5f;
    button.Top.Set(25, 0);            // 2
    button.OnLeftClick += OnButtonClick;  // 3
    panel.Append(button);

    UIText text = new UIText("Click me!");
    text.HAlign = text.VAlign = 0.5f; // 4
    button.Append(text);              // 5
}

private void OnButtonClick(UIMouseEvent evt, UIElement listeningElement) {
    // We can do stuff in here!
}
```
1) Initialize a new UIPanel. Because there is no UIButton class (only UIImageButton), we will use UIPanel and UIText for this.
2) Set the top position slightly below our header.
3) Add the new OnClick event. It is important to note events will propagate through the parent-child chain. This means if we click the UIText, the click event will end up in our UIPanel (button) as well because it is the parent. For this reason we only have to add the handler to the UIPanel.
4) Set the text alignment so it centers in our button panel.
5) Append the text to our button. The button is appended to our background pannel.

OnButtonClick currently does nothing. Let's change our text. In order to do this, we must make our button text a field on class level instead of scoped to just the OnInitialize method:
```cs
private UIText text; // Init later

public override void OnInitialize() {
    // ... code
    text = new UIText("Click me!");
    // ... other code
}
```
Now we can access text in our OnButtonClick method:
```cs
private void OnButtonClick(UIMouseEvent evt, UIElement listeningElement) {
    text.SetText("I was clicked!");
}
```

### Events
There are many events like OnLeftClick, here is a list of them:
```cs
public event UIElement.MouseEvent OnLeftMouseDown;
public event UIElement.MouseEvent OnLeftMouseUp;
public event UIElement.MouseEvent OnLeftClick;
public event UIElement.MouseEvent OnLeftDoubleClick;
public event UIElement.MouseEvent OnRightMouseDown;
public event UIElement.MouseEvent OnRightMouseUp;
public event UIElement.MouseEvent OnRightClick;
public event UIElement.MouseEvent OnRightDoubleClick;
public event UIElement.MouseEvent OnMouseOver;
public event UIElement.MouseEvent OnMouseOut;
public event UIElement.ElementEvent OnUpdate;
public event UIElement.ScrollWheelEvent OnScrollWheel;
public event UIElement.MouseEvent OnMiddleMouseDown;
public event UIElement.MouseEvent OnMiddleMouseUp;
public event UIElement.MouseEvent OnMiddleClick;
public event UIElement.MouseEvent OnMiddleDoubleClick;
public event UIElement.MouseEvent OnXButton1MouseDown;
public event UIElement.MouseEvent OnXButton1MouseUp;
public event UIElement.MouseEvent OnXButton1Click;
public event UIElement.MouseEvent OnXButton1DoubleClick;
public event UIElement.MouseEvent OnXButton2MouseDown;
public event UIElement.MouseEvent OnXButton2MouseUp;
public event UIElement.MouseEvent OnXButton2Click;
public event UIElement.MouseEvent OnXButton2DoubleClick;
```

### Preventing mouse clicks from using selected item
By default, UI won't prevent mouse clicks from causing the player to use their currently selected item. To implement this behavior, the `Player.mouseInterface` bool must be set to true. This should be done in a `DrawSelf` method. The logic should be applied to the lowest parent that makes sense. Do not apply this to the UIState itself since UIState covers the whole screen, but rather apply it to the panels or containers added to the UIState.

```cs
protected override void DrawSelf(SpriteBatch spriteBatch) {
    base.DrawSelf(spriteBatch);
    // If this code is in the panel or container element, check it directly
    if (ContainsPoint(Main.MouseScreen)) {
        Main.LocalPlayer.mouseInterface = true;
    }
    // Otherwise, we can check a child element instead
    if (panel.ContainsPoint(Main.MouseScreen)) {
        Main.LocalPlayer.mouseInterface = true;
    }
}
```

### Preventing scroll wheel from shifting selected Hotbar item
By default, UI won't prevent the scroll wheel from shifting the selected Hotbar item. To implement this behavior, the `Terraria.GameInput.PlayerInput.LockVanillaMouseScroll` method should be called. This should be done in a `DrawSelf` method. The logic should be applied to the lowest parent that makes sense. Do not apply this to the UIState itself since UIState covers the whole screen, but rather apply it to the scrollable lists or panels added to the UIState or other containers.

```cs
protected override void DrawSelf(SpriteBatch spriteBatch) {
    base.DrawSelf(spriteBatch);
    // If this code is in the scrollable element, check it directly
    if (IsMouseHovering) {
        PlayerInput.LockVanillaMouseScroll("MyMod/ScrollListA"); // The passed in string can be anything.
    }
    // Otherwise, we can check a child element instead
    if (list.IsMouseHovering) {
        PlayerInput.LockVanillaMouseScroll("MyMod/ScrollListB"); // The passed in string can be anything.
    }
}
```

# Tooltip on hover
Another useful interaction modders commonly want is showing a tooltip when hovering an element. 
This can be done by overriding the DrawSelf method and checking if the mouse hovers the element (Note that if you override DrawSelf you also need to call base.DrawSelf in it), and then change Main.hoverItemName. Let's show this tooltip if we hover the button: (you'll need to make button a field on class level just like we did with the text)
```cs
 protected override void DrawSelf(SpriteBatch spriteBatch) {
    base.DrawSelf(spriteBatch); // This ensures the Draw call is propagated to the children(s)
    if (text.IsMouseHovering || button.isMouseHovering) {
        Main.hoverItemName = "Click to see what happens";
    }
}
```
Do note that this way of modifying mouse text only works if ``Main.hoverItemName`` is set before the ``"Vanilla: Mouse Text"`` GameInterfaceLayer is actually rendered. This will be the case if you did not modify the ``ModifyInterfaceLayers`` implementation proposed at the start of this wiki page. If you are displaying UI above this layer, ``Main.hoverItemName =  [...]`` should be moved somewhere that gets called earlier, but if possible past all update method calls as vanilla ones may delete your text content.

# Interactions when the UI shows or hides
Override the methods .OnActivate() and .OnDeactivate() to do things when your UI activates or deactivates respectively. For example activate can be used to retrieve most recent data to fill the UI, deactivate can reset variables that store this data. Use deactivate to make your UI fresh for its next activation and so it holds less items in memory while it is not used. (Ideally set things to null to unallocate memory)

# Custom UIElement
Making your own element is easy. You will have to make a custom class that inherits the `UIElement` class. The OnInitialize, OnActivate, OnDeactivate, DrawSelf and Update methods will be the staple methods to override.

A trivial example is making our own custom button class to facilitate what we do above.  
Let's start with the basics: first define what our class is and should do.  
The button class must show some text and be clickable, when clicked an assigned action can be performed.  
Good, now that we know the use-case for the class, we can model it:
```cs
public class UIClickableButton : UIElement {

    // 1
    private object _text;
    private UIElement.MouseEvent _clickAction;
    private UIPanel _uiPanel;
    private UIText _uiText;

    // 2
    public string Text 
    {
        get => _uiText?.Text ?? string.Empty; // 3
        set => _text = value;
    }

    public UIClickableButton(object text, UIElement.MouseEvent clickAction) : base() { // 4
        _text = text?.toString() ?? string.Empty;
        _clickAction = clickAction;
    }

    public override void OnInitialize() { 
        _uiPanel = new UIPanel();               // 5
        _uiPanel.Width = StyleDimension.Fill;   // 5
        _uiPanel.Height = StyleDimension.Fill;  // 5
        Append(_uiPanel);

        _uiText = new UIText("");               // 6
        _uiText.VAlign = _uiText.HAlign = 0.5f; // 6
        _uiPanel.Append(_uiText);

        _uiPanel.OnLeftClick += _clickAction;       // 7
    }

    public override void Update(GameTime gameTime) {
        base.Update(gameTime); // Propagate update to child elements.
        if (_text != null) {                    // 8
            _uiText.SetText(_text.ToString());
            _text = null;
            Recalculate();                      // 9
            base.MinWidth = _uiText.MinWidth;   // 9
            base.MinHeight = _uiText.MinHeight; // 9
        }
    }
}
```
There's a lot going on, let's see:
1) We define variables our custom button needs.
2) A public property that we can use to get and set the text backing field. More on this in point 8.
3) Simply return the text of our _uiText, or and empty string if it is null. (not initialized yet)
4) Our constructor. We must pass a text and click action. Text is of type object, modelled after the UIText class.
5) Create a new UIPanel as the base background. We set the size to Fill, which is equal to calling Set(0, 1f); 1f stands for 100%, so in this case we will stretch the UIPanel as big as we make this element.
6) Create a new UIText that we align centered in our UIPanel.
7) Register the click action to just the UIPanel. Remember that click actions on children propagate through the parent-child chain, so the click event will end up on our UIPanel OnClick handler.
8) By updating the UIText's text during Update, we can make our text changes thread-safe and avoid errors if we edit the text while it is being drawn.
9) Recalculate forces this element and its children to recalculate sizes, padding etc. You should do this if the contents change, such as the text in this case. We can copy the min width and min height as they are calculated from the UIText class in this case during Recalculate().

Now we can use this class, instead of what we did before:

```cs
private UIClickableButton _button;

public override void OnInitialize() {
    UIPanel panel = new UIPanel();
    panel.Width.Set(300, 0);
    panel.Height.Set(300, 0);
    Append(panel);

    UIText header = new UIText("My UI Header");
    header.HAlign = 0.5f;
    header.Top.Set(15, 0);
    panel.Append(header);

    _button = new UIClickableButton("Click me!", OnButtonClick);
    _button.Width.Set(100, 0);  
    _button.Height.Set(50, 0);
    _button.HAlign = 0.5f;
    _button.Top.Set(25, 0);
     panel.Append(_button);
}

private void OnButtonClick(UIMouseEvent evt, UIElement listeningElement) {
    _button.Text = "I was clicked!";
}
```