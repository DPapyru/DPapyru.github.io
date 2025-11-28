This is a list of the vanilla interface layers stored in the layers parameter within `ModSystem.ModifyInterfaceLayers(List<GameInterfaceLayer> layers)`, in the order that they appear.

In order to use those, write your code like this:
```cs
int mouseItemIndex = layers.FindIndex(layer => layer.Name == "Vanilla: Mouse Item / NPC Head");
if (mouseItemIndex != -1) layers.Insert(mouseItemIndex, ...);
```

| Interface layer                      | Description     |
| :---                                 | :---            |
| Vanilla: Interface Logic 1           | Handles logic related to mouse input while using items held on the cursor. |
| Vanilla: MP Player Names             | Draws other players' names, distances, health text, and head icons. |
| Vanilla: Emote Bubbles               | Draws emote bubbles for NPCs and players as well as the NPC chat bubble when hovering over an NPC. |
| Vanilla: Entity Markers              | Draws the minion targeting marker for manually targeted NPCs. |
| Vanilla: Smart Cursor Targets        | Draws the targeted tile highlight when placing or breaking with smart cursor. |
| Vanilla: Laser Ruler                 | Draws the mechanical ruler tile grid. |
| Vanilla: Ruler                       | Draws the ruler lines and sets the ruler text value but doesn't draw the text itself. |
| Vanilla: Gamepad Lock On             | Draws indicators for NPC lock on. |
| Vanilla: Tile Grid Option            | Draws the radial tile grid overlay for the tile grid option. |
| Vanilla: Town NPC House Banners      | Draws NPC home banners and handles logic for manually kicking out NPCs from their home. |
| Vanilla: Hide UI Toggle              | Handles logic for hiding UI based on the hide UI toggle. |
| Vanilla: Wire Selection              | Draws and handles logic for the wire selection radial menu and wire mode cursor preview. Also draws the golf swing power gauge and golf ball indicator arrow. |
| Vanilla: Capture Manager Check       | Draws and handles logic for camera mode. |
| Vanilla: Ingame Options              | Draws and handles logic for the ingame options menu. |
| Vanilla: Fancy UI                    | Draws Fancy UIs such as the Achievements UI, Virtual Keyboard UI, and Mod Config UI. |
| Vanilla: Achievement Complete Popups | Draws ingame notifications for Achievements and Join Requests. |
| Vanilla: Entity Health Bars          | Draws health bars for NPCs and other players. |
| Vanilla: Invasion Progress Bars      | Draws invasion progress bars and boss health bars. |
| Vanilla: Map / Minimap               | Draws the ingame minimap. (Doesn't draw the fullscreen map or overlay map) |
| Vanilla: Diagnose Net                | Draws network diagnostics. |
| Vanilla: Diagnose Video              | Draws rendering diagnostics. |
| Vanilla: Sign Tile Bubble            | Draws the sign chat bubble when hovering over a sign. |
| Vanilla: Hair Window                 | Draws the stylist hairstyle menu. |
| Vanilla: Dresser Window              | Draws the dresser menu. |
| Vanilla: NPC / Sign Dialog           | Draws dialogue menus for NPCs and signs. |
| Vanilla: Interface Logic 2           | Handles logic related to inventory colors. |
| Vanilla: Resource Bars               | Draws health, mana, and breath bars, as well as buff icons. |
| Vanilla: Interface Logic 3           | Handles logic for when the player inventory is closed. |
| Vanilla: Inventory                   | Draws and handles logic for everything inventory related. |
| Vanilla: Info Accessories Bar        | Draws and handles logic for PDA informations. |
| Vanilla: Settings Button             | Draws and handles logic for the Settings button. |
| Vanilla: Hotbar                      | Draws and handles logic for the hotbar. |
| Vanilla: Builder Accessories Bar     | Draws and handles logic for builder accessory toggles. |
| Vanilla: Radial Hotbars              | Draws and handles logic for the radial hotbar and radial quickbar. |
| Vanilla: Mouse Text                  | Draws ruler measurement text and handles logic for setting mouse text. |
| Vanilla: Player Chat                 | Draws the chat. |
| Vanilla: Death Text                  | Draws the death text overlay. |
| Vanilla: Cursor                      | Draws the cursor. |
| Vanilla: Debug Stuff                 | Does absolutely nothing. |
| Vanilla: Mouse Item / NPC Head       | Draws items held on the cursor, also draws and handles logic for manually moving NPC homes. |
| Vanilla: Mouse Over                  | Draws sign text and handles logic for hovering over resource bars, NPCs, players, and dropped items. |
| Vanilla: Interact Item Icon          | Draws custom cursor icons and the currently selected item in the inventory. (Doesn't draw items held on the cursor) |
| Vanilla: Interface Logic 4           | Draws gamepad instructions, any pending mouse text, and handles logic related to interacting with NPCs using smart cursor. |