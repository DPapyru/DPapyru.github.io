This wiki page serves to act as a reference for most of the technical aspects of the `Terraria.Player::Update(int)` method.  
If you want a full reference, decompile tModLoader via the `setup.bat` tool (see: [tModLoader guide for contributors](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-contributors)).

The update "tasks" are listed in logical order, using numbered lists to indicate relevance.

1. `LockOnHelper::Update()` is invoked if the player is this game's client (`i == Main.myPlayer`) and it's not a server player (`Main.netMode != 2`)
    * [Explanation](#lockonhelperupdate)
1. `DontStarveDarknessDamageDealer::Update(Player)` is invoked if the player is this game's client (`i == Main.myPlayer`) and the world is The Constant (`Main.dontStarveWorld`)
    * [Explanation](#dontstarvedarknessdamagedealerupdateplayer)
1. Ground/Air Speed Stat Resetting
    * `Player::maxFallSpeed` is set to `10`
    * `Player::gravity` is set to `Player::defaultGravity` (`0.4`)
    * `Player::jumpHeight` is set to `15`
    * `Player::jumpSpeed` is set to `5.01`
    * `Player::maxRunSpeed` and `Player::accRunSpeed` are set to `3`
    * `Player::runAcceleration` is set to `0.08`
    * `Player::runSlowdown` is set to `0.2`
1. `Player::onWrongGround` (the variable responsible for preventing minecart movement if not on a minecart track) is cleared if the player's mount is inactive or not a minecart
1. `Player::heldProj` is set to `-1`
1. `Player::instantMovementAccumulatedThisFrame` (a variable used for sideways pulley movement) is set to `Vector2.Zero`
1. If the player is holding the Portal Gun or has recently exited a Portal Gun portal (`Player::PortalPhysicsEnabled`), `Player::maxFallSpeed` is set to `35`
1. Wet Movement Checking
    1. If `Player::wet` is set
        1. If `Player::honeyWet` is set:
            * `Player::gravity` is reduced to `0.1`
            * `Player::maxFallSpeed` is reduced to `3`
        1. Otherwise, if `Player::merman` is set:
            * `Player::gravity` is reduced to `0.3`
            * `Player::maxFallSpeed` is reduced to `7`
        1. Otherwise, if `Player::trident` (a variable set to `true` when the player is holding a Trident and not in a mount/minecart) is set:
            * `Player::gravity` is reduced to `0.25`
            * `Player::maxFallSpeed` is reduced to `6`
            * `Player::jumpHeight` is increased to `25`
            * `Player::jumpSpeed` is increased to `5.51`
            * If the player is holding the UP movement key (`Player::controlUp`):
                * `Player::gravity` is reduced to `0.1`
                * `Player::maFallSpeed` is reduced to `2`
        1. Otherwise:
            * `Player::gravity` is reduced to `0.2`
            * `Player::maxFallSpeed` is reduced to `5`
            * `Player::jumpHeight` is increased to `30`
            * `Player::jumpSpeed` is increased to `6.01`
1. If the player has the Distorted debuff:
    * `Player::gravity` is set to `0`
1. `Player::maxFallSpeed` is incremented by `0.01`
1. If the player is this game's client (`Main.myPlayer == i`)...
    1. The quick-grapple timer for gamepads is handled
    1. The preview shown before placing a tile is reset (`TileObject.objectPreview.Reset()`)
    1. `Player::downedDD2EventAnyDifficulty` (a variable used to track if the player can use DD2 sentries outside of the event) is set if `DD2Event::DownedInvasionAnyDifficulty` is set
1. `NPC::freeCake` handling
    * Player receives a Slice of Cake from the Party Girl if they talk to her during a naturally-occurring party
1. The `Player::emoteTime` timer is decremented
1. `Player::ghostDmg` (a variable used to track when the player can spawn the "ghost" projectiles from the Spectre set bonus) is decremented by `6.6666665`
1. `Player::lifeSteal` handling
    * If the world is in normal mode and `Player::lifeSteal` is less than `80`, it is incremented by `0.6`.  It is then capped at `80`
    * Otherwise, if `Player::lifeSteal` is less than `70`, it is incremented by `0.5`.  It is then capped at `70`
1. `Player::ResizeHitbox()` is invoked
    * [Explanation](#playerresizehitbox)
1. If the player is on a mount and that mount is the Rudolph mount (Reindeer Bells), light is spawned on the player's center
1. Other Client Checking
    1. `Player::outOfRange` is cleared
    1. If the player is not this game's client (`whoAmI != Main.myPlayer`) and they're outside of the world bounds, `Player::outOfRange` is set
        * NOTE: due to `Terraria.Tile` becoming a struct in 1.4 tModLoader, the additional checks for if the player is an unloaded world section fail.
    1. If the player is considered "out of range":
        * `Player::numMinions`, `Player::slotsMinions` and `Player::itemAnimation` are set to `0`
        * `Player::UpdateBuffs(int)` is invoked
            * [Explanation](#playerupdatebuffsint)
        * `Player::PlayerFrame()` is invoked
            * [Explanation](#playerupdateframe)

// TODO: finish docs

### LockOnHelper::Update()
The lock-on system is a hidden mechanic in Terraria that's usually gatekept behind gamepad usage.  
Activating the system and selecting a target NPC causes the effective cursor location to be snapped onto the target NPC's center for weapon aiming purposes.

This method handles checking if the system can be used, updating timers for the arrow visuals and finding valid targets.

### DontStarveDarknessDamageDealer::Update(Player)
While in complete darkness for at least 5 seconds, the player starts receiving 50 damage every second.

In order to be considered "in darkness", the following is evaluated:
1. Retrieve the light value at the player's center
1. Convert the light value into a 3D vector, where the range of each component is between `0` and `1`, inclusive.  For comparison, a color value of `255` is converted into `1`
1. If the length of that vector is less than `0.15`, then the player is considered "not safe", aka in darkness.

### Player::ResizeHitbox()
This method updates the player's Y-position to account for `Player::HeightOffsetBoost`, a property that either uses `Mount::HeightBoost` if the player is on a mount or `PortableStoolUsage::HeightBoost` if the player is on a Step Stool, or `0` if neither are the case.

### Player::UpdateBuffs(int)
This method is responsible for updating the remaining time for all of the player's active buffs as well as applying their effects.

1. If the player is currently hitting NPCs with the Life Drain item (`soulDrain > 0`) and they're this client's player (`whoAmI == Main.myPlayer`),
    * The **Life Drain** (ID 151) buff is granted for 2 game ticks
1. If the world is The Constant (`Main.dontStarveWorld`),
    * `Player::UpdateStarvingState(bool)` is invoked
        * [Explanation](#playerupdatestarvingstatebool)
1. For each active buff on the player (buff index = `j`):
    1. If the player is this client's player (`whoAmI == Main.myPlayer`) and the buff's remaining time can decrease (`!BuffID.Sets.TimeLeftDoesNotDecrease[buffType[j]]`)
        * `buffTime[j]` is decremented by `1`
    1. The following buffs are checked in order.  If the current iterating buff matches any of the following, its affects are applied:
        1. **Obsidian Skin** (ID 1)
            * `Player::lavaImmune` is set (Prevents lava damage)
            * `Player::fireWalk` is set (Prevents receiving the **Burning** debuff)
            * `Player::buffImmune[24]` is set (ID 24 = **On Fire!** debuff)
        1. Any mount buff (`BuffID.Sets.BasicMountData[buffType[j]] != null`)
            * `Player::mount` is initialized with the buff's mount data
            * `Player::buffTime[j]` is set to `10`
        1. **Star in a Bottle** (ID 158)
            * `Player::manaRegenBonus` is incremented by `2`
        1. **Sharpened** (ID 159)
            * `Player::GetArmorPenetration(DamageClass.Melee)` is increased by `12`
        1. **Sugar Rush** (ID 192)
            * `Player::pickSpeed` is decremented by `0.2`
            * `Player::moveSpeed` is incremented by `0.2`
        1. **Cerebral Mindtrick** (ID 321)
            * `Player::allCrit` is increased by `10`
            * `Player::minionDamage` is increased by `0.1`
        1. **Regeneration** (ID 2)
            * `Player::lifeRegen` is incremented by `4`
// TODO: finish explanation

### Player::UpdateFrame()
// TODO

### Player::UpdateStarvingState(bool)
// TODO