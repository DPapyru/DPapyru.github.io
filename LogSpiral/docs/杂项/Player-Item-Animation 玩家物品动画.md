# Overview

Player item animation seems simple at first, but it begs a few questions.  
Notably, how does the Clockwork Assault rifle work like it does?  Why can't you switch items for a short while after using some weapons?
All of these questions will be answered below.

A simple overview of the terminology and system is:
- `Animation` governs the visuals.
  - For melee weapons, the hit-box moves with the animation, and the hit rate also resets with the animation, so this affects dps
- `Use` governs the effect of the weapon (shooting, mining, building, consuming etc)
- `Speed` refers to a multiplier that uniformly affects both animation and use
  - This is why, by default, `AttackSpeed` also increases use speed (fire rate, digging rate etc)
- Weapon prefixes which increase speed modify `Item.useTime` and `Item.animationTime` directly, so in this sense they are 'speed' modifiers, but since they directly affect the item stats, rather than making a separate multiplier they are distinct from `UseSpeed` hooks and the player `AttackSpeed` stat
- For some items (such as tools) it may be desirable for `AttackSpeed` and `UseSpeed` to only affect the animation of the weapon. tML provides `Item.attackSpeedOnlyAffectsWeaponAnimation` for this purpose.
  - Note that for whatever historical reason, vanilla sets this on most melee projectile weapons (like beam sword). Prior to the 'true melee' rework in 1.4.4, this was more widespread.

## itemTime, itemAnimation and reuseDelay
In order to keep track of when the player is using an item, the game uses three variables in `Player`: `itemTime`, `itemAnimation` and `reuseDelay`.

### itemTime
`player.itemTime` determines how long the current "use" for the player's held item will last for.  When this value reaches zero and `player.itemAnimation` hasn't reached zero yet, then the use code for the item will repeat.

Most codes in vanilla, including tile placing, first check if `player.itemTime == 0` (among other conditions), then set `player.itemTime = player.useTime;` (give or take a call to `PlayerHooks.TotalUseTime()` or use speed modifiers such as `player.wallSpeed`) if that was true.  
After that, the actual "use code" for the item will run and the game will wait until `player.itemTime == 0 && player.itemAnimation > 0` is true (among other conditions depending on the item).

Example (`item.shoot > 0` code):
```cs
if (item.type == 2223)
    shoot = 357;

itemTime = PlayerHooks.TotalUseTime(item.useTime, this, item);
Vector2 vector = RotatedRelativePoint(MountedCenter);
bool flag9 = false;
```

### itemAnimation
`player.itemAnimation`, in conjunction with `player.itemAnimationMax`, is used to determine how far along in the use animation the player is in.  
Any item use is wrapped around a check of `player.itemAnimation > 0`, so this field is what drives the use.

**Noteworthy Cases:**
- If the player's held item's `useTime` is **equal to** its `useAnimation`, nothing spetacular happens.  
- If the player's held item's `useTime` is **less than** its `useAnimation`, the item use code will be called multiple times during the animation due what was mentioned in the previous sub-section.  
- If the player's held item's `useTime` is **greater than** its `useAnimation`, then the player will be unable to switch items nor use the item again until `player.itemTime` has reached zero, which would happen *after* the use animation finishes.
  - However, if `player.reuseDelay` is greater than `0` when `player.itemAnimation` reaches 0 in this case, the leftover timer from `player.itemTime` will be overwritten.

Example (`item.shoot > 0` check):
```cs
flag8 = flag8 && ItemLoader.CheckProjOnSwing(this, item);
if (item.shoot > 0 && itemAnimation > 0 && itemTime == 0 && flag8) {
    int shoot = item.shoot;
    // ...
```

For reference, this is what `ItemLoader.CheckProjOnSwing(Player, Item)` does:
```cs
public static bool CheckProjOnSwing(Player player, Item item){
    return item.modItem == null || !item.modItem.OnlyShootOnSwing || player.itemAnimation == player.itemAnimationMax - 1;
}
```
Basically, it makes sure that the player is just starting the item use animation.  
Items that use `item.useStyle = 5;` bypass the above method call.

### reuseDelay
`player.reuseDelay` is the intended way to force the player to wait a bit longer after using an item (via `item.reuseDelay`).  
However, for any items where `item.melee`, `item.createTile > 0` or `item.createWall > 0` is true, this field **is ignored**.

If `item.reuseDelay > 0` is true for the player's held item, the following code is ran just before the check for if the player just clicked the "use item" button (usually Left Mouse):
```cs
// Found in Player.ItemCheck(int)
if (itemAnimation == 0 && reuseDelay > 0){
    itemAnimation = reuseDelay;
    itemTime = reuseDelay;
    reuseDelay = 0;
}
```

Thus, the player has to wait this additional time *and* an additional item use doesn't occur since `player.itemAnimation > 0 && player.itemTime == 0` will never be true after the above code snippet runs.

### itemTime vs itemAnimation
The item animation (`itemAnimation`) doesn't necessarily match or sync with the item use time (`itemTime`). For example, the iron pickaxe has `useAnimation = 20` and `useTime = 13`. This means that over 2 visual swings of the pickaxe (2 * 20, or 40 frames), the pickaxe will finish 3 usages (3 * 13, or 39 frames) and be starting on the 4th usage at frame 40.

An item being animated does not necessarily mean the item is being "used". For example when swinging a pickaxe, if the user click in an empty location, the item will animate but `itemTime` will not be affected. If the user clicks on a mineable tile, both will be set at the same time. If the mouse moves from an empty location to a mineable tile during the swing, the usage can even start off sync from the animation. 

There are some types of items that require manually triggering an "item usage". Projectile weapons, tiles, wall, tools, potions, and some others all automatically trigger and item usage when the user clicks, but items that don't fit into normal categories might not trigger an "item usage".

For example, `ExampleManaCrystal` and `ExampleLifeFruit` will both play the animation when the player clicks and `CanUseItem` is `true`, but the result of `UseItem` determines if the game will consider the item as being used or not, ultimately setting `itemTime`. `ExampleMagicMirror` is another example, it calls `player.ApplyItemTime(Item);` in the `UseStyle` method to start an item usage. 

### Manually setting itemTime or itemAnimation
Sometimes it is useful to assign `itemTime` or `itemAnimation` directly. This is usually done with held projectiles to tell the game that the player is currently using an item and should appear as such. The `Player.SetDummyItemTime` method sets both conveniently. 

### Case Study - Clockwork Assault Rifle
To better illustrate how `itemTime`, `itemAnimation` and `reuseDelay` work together, please expand and read the following section:

<details><summary>Details</summary><blockquote>

In the following spreadsheet, we can see the values of `itemTime`, `itemAnimation`, `reuseDelay`, and others through time ("Game Updates" column) as a player uses the Clockwork Assault Rifle item. Note that the values shown are from the start of the game update before the events occur.

In this example we see that as the player clicks to use the item on game update 34, the `itemTime` and `itemAnimation` values are set to their max values and count down from there. Each time `itemTime` would reach 0 before `itemAnimation` does it resets back to `itemTimeMax`, resulting in a 3 shot volley. Once `itemTime` and `itemAnimation` both reach 0 at the end of game update 46 the `reuseDelay` value is applied to both. After the `reuseDelay` expires during update 60 the item usage is once again begun anew, starting a new volley of shots.

![ClockworkAssualtRifleSpreadsheet](https://github.com/user-attachments/assets/bac681ec-bb3d-4b1e-94dd-8b8fc0c43fb9)

</blockquote></details>

## Helpful Properties
tModLoader provides several properties that encapsulate `player.itemTime` and `player.itemAnimation` to allow modders to write code that is easier to comprehend and more expressive. Use these when possible. Doing so will help you avoid typos and logic errors.

### Player.ItemAnimationJustStarted
Evaluates to `true` if the item animation is in it's first frame. Equivalent to `itemAnimation == itemAnimationMax && itemAnimation > 0`.

### Player.ItemTimeIsZero  
Evaluates to `true` if the item usage is in it's first frame. Equivalent to `itemTime == 0`. Note that this particular property is only valid to be used in `UseItem` and `UseAnimation` hooks. [ExamplePickaxe](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Tools/ExamplePickaxe.cs) uses this to run code once per swing.

### Player.ItemAnimationActive
Evaluates to `true` if an item animation is currently running. Equivalent to `itemAnimation > 0`.

### Player.ItemAnimationEndingOrEnded
Returns `true` if the item animation is on or after it's last frame. Meaning it could (if the player clicks etc) start again next frame. Vanilla uses it to despawn spears, but it's not recommended because it will desync in multiplayer (a remote player could get the packet for a new projectile just as they're finishing a swing). It is recommended to use ai counters for the lifetime of animation bound projectiles instead. Equivalent to `itemAnimation <= 1`. [ExampleJoustingLanceProjectile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleJoustingLanceProjectile.cs) uses this.

### Player.ItemUsesThisAnimation
The number of times the item has been used/fired this animation (swing). [ExampleSpecificAmmoGun](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleSpecificAmmoGun.cs#L82) uses this to vary the logic for each shot in a multi-shot volley. 

### Item.attackSpeedOnlyAffectsWeaponAnimation
Dictates whether or not attack speed modifiers on this weapon will actually affect its use time. Defaults to `false`, which allows attack speed modifiers to affect use time. Set this to true to prevent this from happening. Used in vanilla by all melee weapons which shoot a projectile and have `noMelee` set to false. [ExampleHamaxe](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Tools/ExampleHamaxe.cs) and [ExamplePickaxe](https://github.com/tModLoader/tModLoader/blame/stable/ExampleMod/Content/Items/Tools/ExampleHamaxe.cs) use this to match the behavior that melee speed should not affect mining speed.

### Item.shootsEveryUse
If `true`, this item will shoot it's projectiles each time the weapon animation plays, rather than the use time. Defaults to `false`. [ExampleSwingingEnergySword](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleSwingingEnergySword.cs) uses this, as do True Excalibur, The Horseman's Blade, Terra Blade, and others.

### Item.useLimitPerAnimation
Dictates the amount of times a weapon can be used (shot, etc) each time it animates (is swung, clicked, etc). Defaults to `null`. Used in vanilla by the following: Tome of Infinite Wisdom, Nightglow, Eventide

### Item.consumeAmmoOnFirstShotOnly
Dictates whether or not this item should only consume ammo on its first shot of each use. Defaults to `false`. Used in vanilla by the following: Flamethrower, Elf Melter.

### Item.consumeAmmoOnLastShotOnly
Dictates whether or not this item should only consume ammo on its last shot of each use. Defaults to `false`. Used in vanilla by the following: Clockwork Assault Rifle, Clentaminator, Eventide

### Player.channel and Item.channel
Items that "channel" are items that are in-use as long as the user holds the use button. These weapons commonly spawn a "held projectile" that acts as a weapon item and handles spawning bullets or other secondary projectiles itself. It is up to the logic in the held projectile to properly account for use time and use animation scaling if needed. For example, the Vortex Beater item spawns the Vortex Beater projectile. The Vortex Beater projectile has timers and logic to control how bullets are spawned

# Adjusting Use Speed and Animation Speed
Never directly modify `Item.useTime` and `Item.useAnimation` dynamically. tModLoader provides hooks to cooperatively adjust use times and animation times. For dynamic effects and accessories, please use the hooks as designed for maximum compatibility.

### (ModPlayer|ModItem|GlobalItem).UseTimeMultiplier
Allows you to change the effective `useTime` of an item.

### (ModPlayer|ModItem|GlobalItem).UseAnimationMultiplier
Allows you to change the effective `useAnimation` of an item.

### Player.GetWeaponAttackSpeed
Gets the total attack speed for the provided weapon for the player. Takes into account `GetTotalAttackSpeed` of the items damage class.

### Player.GetTotalAttackSpeed
Gets the total attack speed for the provided damage class for the player.

### Player.GetAttackSpeed
Gets the attack speed modifier for this damage type on this player, for editing. [ExampleStatBonusAccessory](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Accessories/ExampleStatBonusAccessory.cs) uses this to boost ranged attack speed.

### DamageClass.MeleeNoSpeed
This is a damage class used by various projectile-only vanilla melee weapons. Attack speed has no effect on items with this damage class.

# Other Information
> How does the Clockwork Assault rifle work like it does?

The **Clockwork Assault Rifle** item has the following code in its defaults:
```cs
useAnimation = 12;
useTime = 4;
reuseDelay = 14;
```
Due to `useTime` being less than `useAnimation`, `player.itemTime` will end up looping `12 / 4 = 3` times before forcing the item animation to continue for `14` frames.

> Why can't you switch items for a short while after using some weapons?

In `Player.Update(int)`, the condition `player.itemAnimation == 0 && player.itemTime == 0 && player.reuseDelay == 0` must be true before checking the triggers in `PlayerInput.Triggers.Current` for the 10 hotbar slots.
```cs
if (PlayerInput.Triggers.Current.Hotbar1) {
    selectedItem = 0;
    flag7 = true;
}

if (PlayerInput.Triggers.Current.Hotbar2) {
    selectedItem = 1;
    flag7 = true;
}

if (PlayerInput.Triggers.Current.Hotbar3) {
    selectedItem = 2;
    flag7 = true;
}

if (PlayerInput.Triggers.Current.Hotbar4) {
    selectedItem = 3;
    flag7 = true;
}

if (PlayerInput.Triggers.Current.Hotbar5) {
    selectedItem = 4;
    flag7 = true;
}

if (PlayerInput.Triggers.Current.Hotbar6) {
    selectedItem = 5;
    flag7 = true;
}

if (PlayerInput.Triggers.Current.Hotbar7) {
    selectedItem = 6;
    flag7 = true;
}

if (PlayerInput.Triggers.Current.Hotbar8) {
    selectedItem = 7;
    flag7 = true;
}

if (PlayerInput.Triggers.Current.Hotbar9) {
    selectedItem = 8;
    flag7 = true;
}

if (PlayerInput.Triggers.Current.Hotbar10) {
    selectedItem = 9;
    flag7 = true;
}
```

On the other hand, if that condition was false, the game instead checks the number keys on the main keyboard (`D0` through `D9`) specifically instead of the triggers set.
```cs
if (Main.keyState.IsKeyDown(D1)) {
    selectedItem = 0;
    flag10 = true;
}

if (Main.keyState.IsKeyDown(D2)) {
    selectedItem = 1;
    flag10 = true;
}

if (Main.keyState.IsKeyDown(D3)) {
    selectedItem = 2;
    flag10 = true;
}

if (Main.keyState.IsKeyDown(D4)) {
    selectedItem = 3;
    flag10 = true;
}

if (Main.keyState.IsKeyDown(D5)) {
    selectedItem = 4;
    flag10 = true;
}

if (Main.keyState.IsKeyDown(D6)) {
    selectedItem = 5;
    flag10 = true;
}

if (Main.keyState.IsKeyDown(D7)) {
    selectedItem = 6;
    flag10 = true;
}

if (Main.keyState.IsKeyDown(D8)) {
    selectedItem = 7;
    flag10 = true;
}

if (Main.keyState.IsKeyDown(D9)) {
    selectedItem = 8;
    flag10 = true;
}

if (Main.keyState.IsKeyDown(D0)) {
    selectedItem = 9;
    flag10 = true;
}
```