### These are the things you can use in the ModMount's SetDefaults

| MountData | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| :--  | :--                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| mountData.spawnDust (int) | The ID of the dust spawned when mounted or dismounted.|
| mountData.buff (int) | The ID number of the buff assigned to the mount.|
| mountData.abilityChargeMax (int) | Used in the Scutlix mount, represents the maximum amount of time in frames a mount will charge its ability until it stops charging. In the case of the Scutlix mount, it affects the rate of change of the lighting on the mount's eyes. The higher the value is for the Scutlix mount, the slower the blue value of the color value of the lighting on the Scutlix's eyes will raise each frame until the max. |
| mountData.abilityCooldown (int) | The amount of time in frames before the mount can call Mount.UseAbility or the ModMount can call MountLoader.UseAbility.  |
| mountData.abilityDuration (int) | How long, in frames, the crosshair on the Scutlix mount will exist on screen after the ability has been used. |
| mountData.swimSpeed (float) | This parameter is used in vanilla for the turtle mount, the drill mount, and the cute fishron mount. It represents the horizontal velocity, how many pixels on the x axis it can move per frame. |
| mountData.heightBoost (int) | How many pixels the player is boosted in the vertical axis when mounted. |
| mountData.fallDamage (float) | A number which is the fall damage multiplier. |
| mountData.runSpeed (float) | The amount of pixels the mount can move left or right, possibly modified by other variables before applied to the player's position update next frame. |
| mountData.dashSpeed (float) | The speed the mount moves when in the state of dashing. |
| mountData.flightTimeMax (int) | The amount of time in frames a mount can be in the state of flying. |
| mountData.jumpHeight (int) | How many pixels the player and mount will ascend (negative y velocity) when pressing the jump button. | 
| mountData.acceleration (float) | The rate at which the mount falls faster down the y axis due to gravity when in the air. To find the speed in pixels per frame that you will be falling while mounted at any given time will be your existing Y velocity - Acceleration + Gravity + 0.001. Gravity will be a value between 0.25 and 1 depending on your X position in relation to the world's surface position divided by 6. |
| mountData.jumpSpeed (float) | The rate at which the player and mount ascend towards (negative y velocity) the jump height when the jump button is presssed. |
| mountData.blockExtraJumps (boolean) | |
| mountData.totalFrames (int) | The total amount of frames involved in the animation of the mount when involved in movement under various conditions. There is an order to the sequence of movement states a mount can have. The order goes: Standing, Running, Freefalling, Flying, Swimming, Dashing |
| standingFrameStart (int) | The index of the starting frame in the mount's animation frame array
| mountData.constantJump (boolean) | |
| mountData.MinecartUpgradeDashSpeed | Alternate dashSpeed for this minecart while the Minecart Upgrade Kit is active. Defaults to 20f. |
| mountData.MinecartUpgradeAcceleration | Alternate acceleration for this minecart while the Minecart Upgrade Kit is active. Defaults to 0.1f. |
| mountData.MinecartUpgradeJumpHeight | Alternate jumpSpeed for this minecart while the Minecart Upgrade Kit is active. Defaults to 15f. |
| mountData.MinecartUpgradeJumpSpeed | Alternate jumpSpeed for this minecart while the Minecart Upgrade Kit is active. Defaults to 5.15f. |
| mountData.MinecartUpgradeRunSpeed | Alternate runSpeed for this minecart while the Minecart Upgrade Kit is active. Defaults to 20f. |





