This page contains guides for migrating your code to new methods and functionality of newer tModLoader versions. When a tModLoader update requires rewriting code, we will present the information here. For migration information from past versions, see [Update Migration Guide Previous Versions](Update-Migration-Guide-Previous-Versions)

<!-- Generated with https://luciopaiva.com/markdown-toc/ -->
# Table of contents

- [tModPorter](#tmodporter)
- [v2025.08](#v202508)
- [v2025.07](#v202507)
- [v2025.06](#v202506)
- [v2025.05](#v202505)
- [v2025.04](#v202504)
- [v2025.03](#v202503)
- [v2025.02](#v202502)
- [v2025.01](#v202501)
- [v2024.12](#v202412)
- [v2024.11](#v202411)
- [v2024.10](#v202410)
- [v2024.09](#v202409)
- [v2024.08](#v202408)
- [v2024.07](#v202407)
- [v2024.06](#v202406)
- [v2024.05](#v202405)
- [v2024.04](#v202404)
- [v2024.03](#v202403)
- [v2024.02](#v202402)
- [v2024.01](#v202401)
- [v2023.12](#v202312)
- [v2023.11](#v202311)
- [v2023.09](#v202309)
- [v2023.08](#v202308)
  - [Extra Jump API](#extra-jump-api)
  - [Rework `NPCID.Sets.DebuffImmunitySets`](#rework-npcidsetsdebuffimmunitysets)
  - [Smaller Changes](#smaller-changes-v202308)
  - [Other v2023.08 Changes](#other-v202308-changes)
- [v2023.X (1.4.4)](#v2023x-144)
  - [Localization Changes](#localization-changes)
  - [New Vanilla Features](#new-vanilla-features)
  - [Renamed or Moved Members](#renamed-or-moved-members)
  - [Big change concepts](#big-change-concepts)
    - [Localization Changes Details](#localization-changes-details)
    - [Player/NPC damage hooks rework. Hit/HurtModifiers and Hit/HurtInfo](#playernpc-damage-hooks-rework-hithurtmodifiers-and-hithurtinfo)
    - [Shop Changes (aka Declarative Shops)](#shop-changes-aka-declarative-shops)
    - [Tile Drop Changes](#tile-drop-changes)
    - [Improve Player.clientClone performance](#improve-playerclientclone-performance)
    - [Max Health and Mana Manipulation API](#max-health-and-mana-manipulation-api)
  - [Smaller Changes](#smaller-changes)

# tModPorter
tModPorter is a tool that automatically applies code fixes to mod source code for changes made to tModLoader. As a modder, the first step in updating a mod after a major tModLoader release is usually to run tModPorter. tModPorter will modify your source code files to fix or provide suggestions on how to fix your code for the new update. Please also read the relevant corresponding porting notes below to be fully aware of changes made in case you need to adapt your code further. 

To run tModPorter, visit the `Workshop->Develop Mods` menu in game and click on the "Run tModPorter" button. You should see a window pop up with the status of the process. Once it is complete, you should see "Complete!" and a message noting how many files were affected. tModPorter might not fix your mod completely, you may need to still fix some things manually, see the instructions in the next section.   
![image](https://github.com/tModLoader/tModLoader/assets/4522492/4f9b52da-08b8-49d3-88b4-bcbdfa50acb9)    
![NVIDIA_Share_2023-11-27_14-47-50](https://github.com/tModLoader/tModLoader/assets/4522492/9c008200-e4d6-49e9-a87a-39797a1df14f)    

### tModPorter Notes
Some tModPorter fixes will add comments to your mods source code for changes that might require additional work from the modder. Open Visual Studio and begin working on updating parts of the code that tModPorter either couldn't port or left a comment with instructions. To find all comments, first go to `Tools -> Options -> Environment -> Task List` and add `tModPorter` as a custom token. Then close it and open `View -> Task List`, which will list all comments. You can also use the search bar to filter specific comments. 

<!-- Templates:
Short:
### `PR Title`
**Pull Request:** <commit or PR link>    
**Short Summary:** 
**Porting Notes:** 

Long:
### `PR Title`
**Pull Request:** <commit or PR link>

**Short Summary**
> - Line 1
> - Line 2

**Porting Notes**
> - Line 1
> - Line 2
-->

# v2025.08

### `ModAchievement implementation and Example Mod examples`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4515>

**Short Summary**
> - `ModAchievement` has been added, allowing mods to add new achievements to the game. (Note that these are not actual steam achievements and won't appear on steam)
> - Achievement menu has been updated with search, additional filters, and the option to reset all achievements.
> - ExampleMod has been updated with plenty of examples, please read them and the PR description before starting to make your own `ModAchievement`, there are several important nuances to `ModAchievement` that are taught in the examples. 

**Porting Notes**
> - If you have manually manipulated the achievements previously, please use this new system.

### `Tile Conversion Fallback/Inheritance`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4709>

**Short Summary**
> - Tiles and walls can now specify a 'conversion fallback tile'. When a modded conversion attempts to convert a tile but there is no registered conversion for that tile, the tile will be converted as if it was the fallback tile.
> - Use `(Tile|Wall)Loader.RegisterConversionFallback` and `(Tile|Wall)Loader.RegisterSimpleConversion` as described in the PR description to indicate tile conversion fallback types.
> - Overriding `Mod(Tile|Wall).Convert` is now only required for advanced use cases where `RegisterSimpleConversion` doesn't suffice.

**Porting Notes**
> - If your mod already implements tile conversion logic, consider adapting to the new options in this PR where appropriate for better compatibility and easier to maintain code:
> - Use `(Tile|Wall)Loader.RegisterSimpleConversion` for conversions which don't need any additional logic beyond converting the tile/wall.
> - Use `(Tile|Wall)Loader.RegisterConversionFallback` for conversions which do need special logic but should still be treated as a pure counterpart for other conversions.
> - Remove explicit conversion code when the fallback conversion would produce the same result.

### `Add hook for when a tile is being replaced via block swap`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4686>

**Short Summary**
> - `(Global|Mod)Tile.ReplaceTile` added, it is called when a tile is being replaced via the block swap feature.

**Porting Notes**
> - If a block-swappable tile has `KillMultiTile` or `KillTile` logic, you might want to test it with block swap and decide if `ReplaceTile` should be used to implement some or all of the same effects.

### `Added ExampleCustomUseStyleWeapon, an example of a custom useStyle`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/3760>

**Short Summary**
> - Added `ExampleCustomUseStyleWeapon`, showcasing an implementation of `UseStyle` and `UseItemHitbox`, and `UseItemFrame` to implement a custom item use style.
> - Added `ItemLoader.RegisterUseStyle` to allow mods to safely determine a unique custom use style ID.
> - Added helper methods: `Utils.CornerRectangle`, `Utils.BoundingRectangle`, and `Utils.Including`

**Porting Notes**
> - Replace magic numbers (made up numbers) for custom `Item.useStyle` values with the result of `ItemLoader.RegisterUseStyle`. This will allow greater compatibility and will avoid the potential of conflicting values between mods.

### `Add new workshop tag for translation mods`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/3860>

**Short Summary**
> - A "Translation" tag has been added to the Steam Workshop for mods, allowing users to filter by (or filter out) mods that add translations. It will automatically be set during publishing for mods setting `translationMod = true` in build.txt.

**Porting Notes**
> - The tag will be applied the next time the mod is published. Upload a new release if you want the tag right away.

### `Add ModSystem.PostWorldLoad and TileID.Sets.ClearedOnWorldLoad`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4776>

**Short Summary**
> - `TileID.Sets.ClearedOnWorldLoad` added to support properly cleaning up temporary tiles similar to the tiles placed by Ice Rod.
> - `ModSystem.PostWorldLoad` added for situations where `ModSystem.OnWorldLoad` is too early.

**Porting Notes**
> - If currently using a detour, IL edit, or the `WorldFile.OnWorldLoad` event for code covered by the new features in this PR, consider using these new features instead.

### `Add opt-out of mod building in tModLoader.targets`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4731>

**Short Summary**
> - Projects can import `tModLoader.targets` to reference tModLoader without being built as a mod by setting the property `BuildMod` instead of redefining the target that would build a mod.
> - This feature is intended for non-mod tools or libraries that need access to tModLoader references but shouldn't be packaged as a mod when the project is built.

**Porting Notes**
> - Replace `<Target Name="BuildMod"></Target>` with `<BuildMod>false</BuildMod>` within a `PropertyGroup`.

# v2025.07

### `tModCodeAssist port`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4727>

**Short Summary**
> - The `tModCodeAssist` code analyzer (formally `tModLoader.CodeAssist`) has been reworked and is now directly included in tModLoader releases.
> - This new implementation will be much easier to update and we intend to add more requested code fixes to the analyzer. We welcome suggestions and feedback at [the thread](https://discord.com/channels/103110554649894912/1215350228786479204).
> - If you are unaware, this feature is responsible for the suggestions in your IDE to change code like `item.useStyle = 5;` to `item.useStyle = ItemUseStyleID.Shoot;`.
> - This also fixes the issue where the old `tModLoader.CodeAssist` would cause issues for users who had bad nuget settings.

**Porting Notes**
> - If you run into issues in your IDE after this update, you likely need to run "Upgrade .csproj file" from the `Mod Sources` menu. (To remove the old reference to `tModLoader.CodeAssist`)

### `ProjectileID.Sets.IsInteractable and ExampleInteractableProjectile`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4701>

**Short Summary**
> - Support for interactable projectiles added. Projectiles can now be targeted by smart select and draw a smart select highlight.
> - Use `ProjectileID.Sets.IsInteractable` and follow the logic in `ExampleInteractableProjectile` to make an interactable projectile.

**Porting Notes**
> - Replace any detours or IL edits on the `Projectile.IsInteractible` method with `ProjectileID.Sets.IsInteractable` usage
> - Consider upgrading existing projectiles that can be right clicked directly with this smart cursor support for better compatibility and user experience.

### `PreHoverInteract hook for NPCs`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4539>

**Short Summary**
> - Add `(Mod|GlobalNPC).PreHoverInteract` hooks. Lets modders override or piggyback off of right clicking on or hovering over an NPC

### `Add ExampleVine`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4704>

**Short Summary**
> - Adds `ExampleVine` and some documentation.

**Porting Notes**
> - We encourage any mod with vine tiles to compare your code against `ExampleVine` and `ExampleVineGlobalTile`. It is possible your vines do not match the vanilla behavior, such as converting properly when the grass tile changes (Clentaminator), rendering properly (offset and flipping), not cutting when the user is using the staff of regrowth, breaking when the tile above is block swapped, incorrectly growing on activated tiles, incorrectly growing on bottom slope tiles, not propagating paint to newly grown vines, etc.

### `Properly support manually setting bestiary stars`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4702>

**Short Summary**
> - Fixes manually setting bestiary stars. Mods can now set `ContentSamples.NpcBestiaryRarityStars` in `SetStaticDefaults`.

**Porting Notes**
> - Mods setting `ContentSamples.NpcBestiaryRarityStars` in `GlobalNPC.SetBestiary` currently work by accident, but we recommend setting `ContentSamples.NpcBestiaryRarityStars` in `SetStaticDefaults` instead.

# v2025.06

### `More sound fixes and new SoundStyle options`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/2566>

**Short Summary**
> - Many vanilla sound behaviors have been fixed
> - Sounds no longer stop when pausing the game by default
> - Sounds using the same `SoundStyle.SoundPath` now properly honor `SoundStyle.Identifier` and won't be seen as the same sound
> - `SoundStyle` now has `LimitsArePerVariant`, `RerollAttempts`, and `PauseBehavior` fields to further customize sound behavior.

**Porting Notes**
> - In fixing various bugs, this PR does change some existing behaviors some modders might have unwittingly relied on. We recommend that modders test the sounds in their mod that relate to the following:
> - Sounds now continue playing when the game is paused by default. If this is not desired, consider setting setting `SoundStyle.PauseBehavior` to `PauseBehavior.StopWhenGamePaused` (or `PauseBehavior.PauseWithGame`).
> - Various changes to `IsTheSameAs` now means that some `SoundStyle` that previously were seen as the same are now seen as different and vice versa. If you have multiple `SoundStyle` using the same `SoundPath` but want them to behave independently for sound limiting purposes, make sure to set `Identifier`.
> - Consider setting `SoundStyle.LimitsArePerVariant` if making use of the variants feature to allow each variant to have an independent instance limit.

### `Add ModConfig.SaveChanges`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4212>

**Short Summary**
> - `ModConfig.SaveChanges` has been added to allow mod code to safely modify and save changes to `ModConfig`.
> - `ModConfig.HandleAcceptClientChangesReply` added to facilitate reacting to the reply of save requests for `ServerSide` configs.
> - `ModConfig.AcceptClientChanges` can now make changes to the pending config values before accepting.
> - `ExampleFullscreenUI.cs` has been updated to showcase using `ModConfig.SaveChanges` correctly.

**Porting Notes**
> - If using reflection to access `UIModConfig.SaveConfig`, use `ModConfig.SaveChanges` instead.
> - If your mod has UI, consider using `ModConfig.SaveChanges` to save user preferences to preserve UI positioning and toggles.

### `Negative NPCIDs now compatible with NPCDefinition`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4684>

**Short Summary**
> - Negative NPCIDs, such as Pinky, are now usable with NPCDefinition

**Porting Notes**
> - Due to some negative values now being valid for `NPCDefinition.Type`, the `NPCDefinition.Type` for an "unloaded" `NPCDefinition` has changed from `-1` to `-66`. If you have code checking `NPCDefinition.Type == -1` directly, it would be better to check `NPCDefinition.IsUnloaded` instead.

# v2025.05

### `Add equipment loadouts support for ModAccessorySlot`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4340>

**Short Summary**
> - `ModAccessorySlot` now supports loadouts by default.

**Porting Notes**
> - If loadout support is not wanted for a `ModAccessorySlot`, set `HasEquipmentLoadoutSupport` to false
> - `ModAccessorySlot` without custom backgrounds that support loadouts will be tinted with loadout colors as normal. If using a custom slot background, however, they will not be affected. A new hook, `ModAccessorySlot.BackgroundDrawColor`, can be used to further customize the color.
> - `Player.DropItem` is now obsolete, use `Player.TryDroppingSingleItem` instead.
> - `(Mod|Global)CanAccessoryBeEquippedWith/CanEquipAccessory` and `ModAccessorySlot.CanAcceptItem` can now be called on the server and remote clients instead of just the local client. This might mean some syncing issues need to be addressed.

### `Finish implementing deleting unloaded tiles feature, add VanillaFallbackOnModDeletion examples`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4325>

**Short Summary**
> - `ModTile/ModWall.VanillaFallbackOnModDeletion` has finally been implemented. See the PR description for images depicting what this means.
> - Users can use the `/purgeunloaded` chat command to remove tiles in a world from mods they are no longer using.
> - Modders can assign values to `VanillaFallbackOnModDeletion` to dictate which vanilla tile a deleted tile should revert back to.

**Porting Notes**
> - Nothing is required, but if you want to make it possible for your mod to be removed from a world, consider assigning values to `VanillaFallbackOnModDeletion`.
> - The default fallback of `Dirt` should work, but if something is more appropriate it can be used.

### `ModNPC.DeathMessage, ModNPC.ModifyDeathMessage(), and NPCID.Sets.IsTownChild`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4629>

**Short Summary**
> - Adds customization for town NPC and boss death messages.
> - Adds `ModNPC.DeathMessage` which modifies the message broadcasted when a town NPC or boss dies. This also affects what the town NPC's tombstone says in hardcore mode. This allows custom death messages similar to "The Twins", which were previously not possible. Color can also be modified with `ModNPC.ModifyDeathMessage`.
> - Adds `NPCID.Sets.IsTownChild` which prevents tombstones from being spawned in hardcore and sets the death message to "X has left!" unless specified otherwise by the method above. This is what the Angler and Princess use.

**Porting Notes**
> - `ModNPC.BossLoot(name, potionType)` became obsoleted and replaced with `ModNPC.BossLoot(potionType)`. Both will still be called for now but you should consider changing to `DeathMessage` ahead of time.
> - If you had a workaround for paired or group bosses, you can get rid of it and use `DeathMessage` instead to prevent duplicate boss defeat messages.

### `Fix wall blending (Main.wallBlend) issues for modded walls`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4655>

**Short Summary**
> - Wall blending has been fixed to work as intended for modded walls. Wall blending is when the border between different types of walls don't have a thin black line between them.
> - Previously all modded walls blended with each other, but that has been fixed and each wall will now only blend with walls they are intended to blend with.
> - Please see the pull request for more information, there are images and animations that show the original issue and fixed behaviors.

**Porting Notes**
> - Add `Main.wallBlend[Type] = ModContent.WallType<OtherWall>();` to any `ModWall` where blending was intended. This only needs to be done on one of the walls in a pair, since this is indicating that this wall should be considered to be the other wall for the purposes of blending.
> - `WallID.Sets.BlendType` never worked in the first place, despite being recommended on our wiki previously. If you were using it, remove it and use `Main.wallBlend` instead.

# v2025.04

### `UpdateVisibleAccessory and UpdateItemDye hooks for items, CustomVisualEquipType example showcase`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4606>

**Short Summary**
> - `UpdateVisibleAccessory` and `UpdateItemDye` hooks added to `ModItem` and `GlobalItem`
> - `CustomVisualEquipType` folder in ExampleMod showcases a full custom visual equip type example

**Porting Notes**
> - If you have modded visual elements that don't show up properly on the player select screen, such as a custom equip type layer, you should move code assigning those flags/fields to `UpdateVisibleAccessory` while checking that `hideVisual` if false. (Follow the examples)
> - Existing methods like `UpdateAccessory`, `UpdateVanity`, and `UpdateEquips` couldn't perfectly work for custom draw flags like these.

### `Added Player.breathEffectiveness to facilitate "extends underwater breathing" effects`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4399>

**Short Summary**
> - `Player.breathEffectiveness` added to facilitate compatibility for adjusting underwater breathing time
> - Adjusting `Player.breath` directly to implement a Breathing Reed or Diving Helmet effect is no longer the best option.
> - `breathMax = 200;` added to `Player.ResetEffects`, so it is no longer necessary for mods to do it.

**Porting Notes**
> - Remove `Player.breathMax = 200;` from `ModPlayer.ResetEffects`.
> - If adjusting `Player.breath` previously, consider instead adjusting `Player.breathEffectiveness` for more compatibility.
> - Technically `Player.breath` is the breath capacity and `Player.breathEffectiveness` is how long each unit of breath lasts, so advanced situations might warrant adjusting both, see PR for details.

### `Uncapped Sound Effect Pitch`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4618>

**Short Summary**
> - This PR allows `SoundStyle`'s `Pitch`, `PitchVariance`, and `PitchRange` properties to produce pitch values outside the `-1..+1` octave range they were previously restricted to.

**Porting Notes**
> - Check if any of your code has accidentally relied on the previously present internal clamping, and alter it to always produce the pitch range you intend it to.
> ```cs
> // This used to produce [0.25...1.0], but will now produce [0.25...1.25]`.
> SoundStyle { Pitch = 0.75f, PitchVariance = 1.00f }
> // So change to this for the old behavior to remain:
> SoundStyle { PitchRange = (0.25f, 1.0f) }
> ```

# v2025.03

### `Custom and Named ID Sets`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4381>

**Short Summary**
> - Custom ID sets (ID sets are arrays indexed by a content ID like `ItemID.Sets.IsDrill`) are now fully supported. Use `ModSystem.ResizeArrays` or a class annotated with `[ReinitializeDuringResizeArrays]` to correctly initialize them.
> - Custom ID sets can be registered with a name ("named ID set") allowing multiple mods to access the same array. After registration they can be used exactly as an existing ID set would be used.
> - You might know of this concept by other names like "content tags".
> - See the PR description for more information.

**Porting Notes**
> - There are no breaking changes, but the custom and named ID sets supported in this PR might greatly simplify existing code, especially for cross-mod situations where data is accessed by multiple mods.
> - There are some situations that were incorrect before but now throw errors during loading due to this PR. The most common issue is calling `EquipLoader.AddEquipTexture` for an equip type that has already been autoloaded using `[AutoloadEquip]`. To fix, get rid of one or the other.

### `Added Convert() hook for ModBlockTypes, Tile/WallLoader.RegisterConversion(), and other biome conversion related features` and `Modifiable chlorophyte conversions`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4566>, <https://github.com/tModLoader/tModLoader/pull/4630>

**Short Summary**
> - Adds `ModTile/ModWall.Convert` hook to allow modded tiles to be converted via clentaminator, purification powder, hardmode worldgen or infection spreading.
> - Adds `Tile/WallLoader.RegisterConversion` methods to provide or block 'global' conversions for tiles.
> - Adds `WorldGen.ConvertTile/Wall()` and `SpreadInfectionToNearbyTile` helper methods to cut down on repeated code
> - Adds `BiomeConversionID.PurificationPowder` for conversion hooks.
> - Adds `ModBiomeConversion` to register custom conversions.
> - Adds `BiomeConversionID.Chlorophyte` and calls `Convert` hooks when chlorophyte attempts to purify nearby tiles in `hardUpdateWorld`

### `Basic tile entity and more`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4528>

**Short Summary**
> - Full example of a `ModTileEntity`, `BasicTileEntity.cs`, that should be complex enough to be useful but simple enough to use as a template.
> - Various new helper methods: `TileObjectData.TopLeft`, `TileEntity.TryGet`, `ModTileEntity.Generic_HookPostPlaceMyPlayer/Generic_Hook_AfterPlacement`, `Point16.Deconstruct`. Please see `BasicTileEntity.cs` and the PR details to see how these are used.
> - `TileID.Sets.PreventsTileHammeringIfOnTopOfIt` added to help implement chest-like tiles that shouldn't break easily.
> - Various bug fixes and related documentation, see PR for details.

**Porting Notes**
> - Nothing is required, but the new example and helper methods can be used to clean up existing Tile Entity code.
> - `TileID.Sets.PreventsTileHammeringIfOnTopOfIt` can replace some workarounds.
> - See the PR for full porting note details.

### `ExampleChandelier and several new related ModTile hooks`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4551>

**Short Summary**
> - Chandeliers and other rigid swaying tiles can now customize their physics and flame visuals behaviors (`ModTile.AdjustMultiTileVineParameters` and `ModTile.GetTileFlameData`)
> - `ModTile.EmitParticles` added to simplify spawning tile dust and gore with the correct timing and behavior
> - `Animation.NewTemporaryAnimation` support. `ModTile`s can now use custom 1-off animations, similar to how the MushroomStatue behaves.
> - `ExampleChandelier` added, showing off all these hooks and more.
> - Modded torches now work with Torch God event and The Constant rain extinguishing feature.

**Porting Notes**
> - Revisit `TileDrawing.TileCounterType.MultiTileVine` tiles and see if any of the new features would help make them better.
> - Consider moving tile dust and gore code from `DrawEffects` to `EmitParticles`. Doing so would allow simplifying code greatly by removing the boilerplate code.
> - Update torch tiles with dust spawning if you had used `ExampleTorch` as a guide.

### `ModMapLayer positioning`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4587>

**Short Summary**
> - `ModMapLayer` now supports ordering. (`GetDefaultPosition` and `GetModdedConstraints`)
> - Previously all modded map layers would be drawn in load order after all existing layers.

**Porting Notes**
> - Adjust your `ModMapLayer` to use the new ordering methods if desired. 
> - Many users might expect Pings to show above all layers, so adding `public override Position GetDefaultPosition() => new Before(IMapLayer.Pings);` would be recommended for that.

### `Damage classes inherit generic weapon prefixes by default`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4572>

**Short Summary**
> - Fixes `ModItem.WeaponPrefix` 's default implementation to automatically include prefixes from `DamageClass.Generic`
> - To opt-out of GenericPrefixes, set this to false

### `Fix vanilla frost and pumpkin moon music priority`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4392>

**Short Summary**
> - Frost and Pumpkin moon music had higher priority than all other music and could not be overridden.
> - They now both have the proper `Event` priority.

**Porting Notes**
> - If you had workarounds for this, they can be removed.

# v2025.02

### `Fix ExampleRelic and add TileCounterType.CustomSolid/NonSolid support for AddSpecialDraw`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4535>

**Short Summary**
> - The ExampleMod relic, `MinionBossRelic.cs`, did not match the vanilla behavior completely. It animated at a slower frame rate and was blurry due to interpolation. This example has been fixed.
> - `AddSpecialPoint` now supports custom rendering, which allows 60fps rendering rather than the 15fps rendering of `AddSpecialLegacyPoint`

**Porting Notes**
> - Fix your relic tiles using the changes to `MinionBossRelic.cs` in this PR as a guide.
> - Consider using `AddSpecialPoint` instead of `AddSpecialLegacyPoint` for `ModTile.SpecialDraw` usages that would benefit from rendering at 60fps rather than 15fps. The pull request description has steps to do this.
> - Consider adjusting `ModTile.AnimateTile` frameCounter logic to count to multiples of 4 for smoother animation. The updated `ModTile.AnimateTile` docs explain why values that are not multiples of 4 results in jerky animation

### `Localize custom player death messages (PlayerDeathReason.ByCustomReason)`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4553>

**Short Summary**
> - `PlayerDeathReason.ByCustomReason(string)` is now `Obsolete`, replaced by `PlayerDeathReason.ByCustomReason(NetworkText)` to correctly support localization of death messages.
> - Previously users would see death messages in the language of the player that died, not their own selected language.

**Porting Notes**
> - If already using `LocalizedText`, change `localizedText.Format(substitutions)` to `localizedText.ToNetworkText(substitutions)`.
> - If still using a string directly, consider supporting custom death message localization by following the example shown in `ExampleOnBuyItem.SetStaticDefaults` and `OnCreated`.

### `Enable developer features for local mods built from outside of "Mod Sources" folder`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4548>    
**Short Summary:** Mods which are built from locations outside the `Mod Sources` folder via the command line/visual studio will now show in the `Mod Sources` menu. See the "How to use" section of the PR to learn how to use this feature. This can give some developers more flexibility over their paths and workflows    
**Porting Notes:** Symbolic links in the `Mod Sources` folder pointing to other folders might now result in duplicate entries in the Develop Mods menu. Deleting those links will fix this.

# v2025.01

### `Simple Vanilla Tree Shaking Hook`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4503>

**Short Summary**
> - `GlobalTile.PreShakeTree` and `GlobalTile.ShakeTree` added to allow customizing drops from shaking vanilla trees.
> - `ShakeTrees.cs` showcases using these hooks.

**Porting Notes**
> - `ModTree` and `ModPalmTree` `CountsAsTreeType` now default to `TreeTypes.Custom` instead of `TreeTypes.Forest` and `TreeTypes.Palm` respectively. This means that modded tress no longer default to having all the vanilla tree shake drops. Adjust this back if that behavior was desired.

### `Minor Decraft Fixes`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/3993>

**Short Summary and Porting Notes**
> - `ConsumeItem` hooks, callbacks and methods have been replaced with `ConsumeIngredient/IngredientQuantity` hooks which have an additional `bool isDecrafting` parameter. 
>   - This allows you to apply discounts when shimmering to prevent infinite craft-shimmer exploits.
>   - The current classes and hooks are marked `[Obsolete]` but remain functional
> - Added read-only property `Recipe.DecraftDisabled`, exposing previously internal state
> - The `internal` field `Recipe.alchemy` has been removed, as its functionality is now covered by `Recipe.IngredientQuantityRules.Alchemy`

### `Added MusicID.Sets.SkipsVolumeRemap[]`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4530>

**Short Summary**
> - If you would like to make your mods' music slightly louder than vanilla's intended volume range, or to use old music files whose volume was adjusted for pre-1.4 TML, you are now able to opt out of the internally used XACT-matching volume remapping, via either the new `MusicID.Sets.SkipsVolumeRemap` set, or the new `Mod.MusicSkipsVolumeRemap` property.
> - The default music volume behaviors remain unchanged. As before this PR and since TML for 1.4, by default any given music track is lowered in playback volume to better match vanilla music volume in-game, matching it best if the file had a peak amplitude of `+0.0dB`. If the volume remap is skipped for a music track, then it will be able to play at about twice the volume of vanilla tracks.

# v2024.12

### `Allow ModPlayer.DrawEffects fullBright parameter to work without modifying other variables`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4463>    
**Short Summary:** Previously, `ModPlayer.DrawEffects`' `fullBright` parameter required modifying any of the color parameters to actually have effect. This requirement has been removed making it easier to use correctly.    
**Porting Notes:** If using `fullBright`, you can remove any workaround code setting `r`, `g`, `b`, or `a`.

# v2024.11

### `Port ExampleBanner (EnemyBanner)`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4442>

**Short Summary**
> - Enemy banner tiles are now fully supported, and `EnemyBanner.cs` shows a fully correct implementation.
> - `ModBannerTile` added. It contains all the code common to enemy banner tiles and should be used.
> - Various other fixes and documentation related to banners.

**Porting Notes**
> - Read the porting notes in the pull request description to learn how to use this new feature.
> - Existing banner tile examples in other mods have various bugs, please read the porting notes even if your mod already has banner tiles.

### `Bestiary Categorization Control`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4430>

**Short Summary**
> - Allows modders to "categorize" a custom bestiary info element, giving more control over where the element will be drawn in a given Bestiary entry.

**Porting Notes**
> - Implement `ICategorizedBestiaryInfoElement` and the `ElementCategory` property to support this feature for `IBestiaryInfoElement` in your mods.

### `More BitsByte helper methods for reading and writing`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4352>

**Short Summary**
> - Sending and receiving bools through `BitsByte` or `BinaryWriter` was inconvenient, new methods have been added.

**Porting Notes**
> - Consider using the new `BinaryReader.ReadFlags` and `BinaryWriter.WriteFlags` methods to simplify and improve the readability of your code.

# v2024.10
### `Multi-Tile Wind Sway Capabilities`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4429>

**Short Summary**
> - Allows modders to "register" their multi-tiles to sway in the wind and with player interaction, facilitating implementing swaying multi-tiles such as banners, chandeliers, vines, etc.
> - `ExampleWideBanner` added, `ExampleAnimatedTile`/"Red Firefly in a Bottle" (a lantern tile) updated.
> - `TileObjectData.IsTopLeft` added. Various methods made public.

**Porting Notes**
> - Please update your banners, lanterns, chandeliers, etc to use the new tile swaying mechanics for consistency with vanilla tiles.
> - `TileDrawing.TileCounterType`/`AddSpecialPoint`/`CrawlToTopOfVineAndAddSpecialPoint`/`CrawlToBottomOfReverseVineAndAddSpecialPoint` are all now public
> - Consider replacing `if (tile.TileFrameX == 0 && tile.TileFrameY == 0) {` or `if (tile.TileFrameX % FullTileWidth == 0 && tile.TileFrameY % FullTileHeight == 0) {` checks with `TileObjectData.IsTopLeft(tile)` for cleaner code if appropriate.

### `Increase Workshop Publication Requirements`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4424>

**Short Summary**
> - Mods are now required to have a unique icon and mod description.
> - `icon.png` will automatically be scaled up for workshop publishing, meaning modders no longer need to create a `icon_workshop.png` for their icon on the workshop unless they want the workshop icon to be more detailed than the regular icon.

**Porting Notes**
> - Make sure your mod has a unique icon and description if you can no longer publish the mod.

### `ModCloud implementation and Example Mod examples`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4367>

**Short Summary**
> - `ModCloud` added to allow custom clouds.
> - Textures in a folder named "Clouds" will now be autoloaded as `ModCloud` unless `Mod.CloudAutoloadingEnabled` is false.

**Porting Notes**
> - If you happened to have a folder named "Clouds" that doesn't contain `ModCloud`s, you can add `CloudAutoloadingEnabled = false;` to your `Mod` class constructor.

### `Docs and fixes for breath related fields`
**Pull Request:** <https://github.com/tModLoader/tModLoader/commit/0d55bc751d5b2b7c5fabb5ea5e3a028a2215283a>    
**Short Summary:** `Player.breathMax` now resets to `200` and `Player.breath` is capped to `Player.breathMax`.    
**Porting Notes:** If your mod previously reset `Player.breathMax` or `Player.breath`, it is no longer necessary.

### `Fix ExampleMod afterimage trail drawing and related docs`
**Pull Request:** <https://github.com/tModLoader/tModLoader/commit/7accd386a4f795fd1df50a02abc88ec1774f8f33>    
**Short Summary:** Afterimage example code in `ExampleMod` was incorrect. If you used it as a guide, please fix your usage of it.    
**Porting Notes:** Change `for (int k = 0; k < Projectile.oldPos.Length; k++)` to `for (int k = Projectile.oldPos.Length - 1; k > 0; k--)` to draw afterimages from furthest to closest for the proper afterimage layering.

### `Made DynamicSpriteFont.SpriteCharacterData public`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4427>    
**Short Summary:** `SpriteCharacterData` is now public. Public getters for `_spriteCharacters` and `_defaultCharacterData`    
**Porting Notes:** If your mod previously used reflection, consider updating or verifying compatibility.

### `Allow Player.Hurt to be cancelled`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4403>

**Short Summary**
> - Adds `HurtModifiers.Cancel()` and `HurtInfo.Cancelled`, making it easier for mods to make a player situationally ignore certain damage instances.
> - Cancelling a hurt has the same effect as returning true from FreeDodge, though even undodgeable hurts can be cancelled. Unlike FreeDodge, immune frames are not applied, so the player can still be hit by another attack this tick, or the same attack next hit.

**Porting Notes**
> - None. Modders do not need to check if a `HurtInfo` is `Cancelled`, tModLoader will not be passing cancelled hurts to hooks.

# v2024.09
### `Add hook for armor set bonus activation`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4369>

**Short Summary**
> - `ModPlayer.ArmorSetBonusActivated` and `ModPlayer.ArmorSetBonusHeld` added to facilitate triggering modded armor set bonus effects without workarounds.
> - ExampleMod updated to now showcase an armor set effect, armor set shadows, and more varied `ModKeybind` usage.

**Porting Notes**
> - If you were using a custom hotkey or detour/IL edit to activate armor set bonuses, consider migrating to `ModPlayer.ArmorSetBonusActivated` or `ModPlayer.ArmorSetBonusHeld`

# v2024.08
### `Multiple prefix category support`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4175>

**Short Summary**
> - `ModItem` can now belong to multiple prefix categories, either via their `DamageClass` or by overriding `ModItem.MeleePrefix/WeaponPrefix/RangedPrefix/MagicPrefix` 
> - `DamageClass.GetPrefixInheritance` added to allow DamageClasses to declare which vanilla prefix categories weapons using it should inherit. (For example, a Melee/Magic hybrid class might want weapons to get Melee and Magic prefixes)

**Porting Notes**
> - Some existing items in your mod may now count towards multiple prefix categories, especially those using a custom `DamageClass`. Test these items and determine if their prefixes are desired. Adjust `DamageClass.GetPrefixInheritance` or `ModItem.MeleePrefix/WeaponPrefix/RangedPrefix/MagicPrefix` as appropriate.
> - The `MultiplePrefixSupportTestMod.tmod` mod contained in the PR description can be used to easily compare prefix results, please use it to verify that the item prefixes are as expected.
> - If using `Item.GetPrefixCategory`, use `Item.GetPrefixCategories` instead and adjust your logic

# v2024.07
### `Fix several TileObjectData issues and document TileObjectData class`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4275>

**Short Summary**
> - `TileObjectData` class has been fully documented
> - Basic Tile wiki page updated
> - Fixed several issues related to `TileObjectData`/tile placement: 
>  - Modded tiles with alternate placements would sometimes require a workaround to not break when placed
>  - Fixed `TileObjectData.GetTileStyle`/`GetTileInfo` incorrectly ignoring `StyleMultiplier` when used with `StyleLineSkip`, which will allow tiles also using `StyleWrapLimit` to function correctly.
> - `ExampleDoorOpen` fixed to not break when opened to the left.
> - `TileObjectDataShowcase.cs` added to showcase and visualize advanced `TileObjectData` usage, such as left and right placements, random placements, animation, toggle states, custom anchors, and multiple styles.

**Porting Notes**
> - Modders should fix their open door tiles if they are using `TileObjectData.newTile.CopyFrom(TileObjectData.GetTileData(TileID.OpenDoor, 0));` or if their doors break when opening to the left.
> - Modders should double check that tiles using placement alternates (`TileObjectData.newAlternate`/`TileObjectData.addAlternate()`) work as expected. The fixes should not cause issues, but it is possible that incorrect workarounds to issues fixed in this PR are now broken.
> - Modders should use `StyleLineSkip` and `StyleMultiplier` where correct. This should reduce the amount of workarounds such as using `RegisterItemDrop` or `GetItemDrops` to fix item drops that are incorrectly being calculated.

# v2024.06
### `Example Rockets and explosive projectile fixes and features`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/3501>

**Short Summary**
> - `ProjectileID.Sets.Explosive[]` to match the behavior of vanilla explosives without having to use `aiStyle 16`
> - New `Projectile.HurtPlayer(Rectangle hitbox)` method which will damage the local player if they intersect the hitbox.
> - New `PrepareBombToBlow` hook to implement explosives correctly.
> - A full set of rocket projectiles as well as rocket launcher and rocket ammo items, showing how they all connect to each other.

**Porting Notes**
> - If you were using `Projectile.aiStyle = ProjAIStyleID.Explosive` (16) to match the vanilla behavior of explosives, you can now use `ProjectileID.Sets.Explosive[]`. Also override `PrepareBombToBlow` and add the explosion resizing logic there.
> - Rocket ammo should have `ProjectileID.Sets.SpecificLauncherAmmoProjectileMatches` defined for all applicable vanilla launchers.
> - Rocket launchers should set `AmmoID.Sets.SpecificLauncherAmmoProjectileFallback` to the closest vanilla launcher to inherit ammo-specific projectiles from.
> - If you were using `PickAmmo()` or similar to fix your rocket ammo shooting the wrong projectile for the Snowman Cannon and Celebration Mk2, double check that because it is probably not necessary anymore.

### `Modify Petting, Chat Bubble, Party Hat, and Emote Bubble positions`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4222>

**Short Summary**
> - `NPCID.Sets.PlayerDistanceWhilePetting[]` to change the distance away the player stands while petting Town Pets/Slimes.
> - `NPCID.Sets.IsPetSmallForPetting[]` to change whether the player's arm will be angled up or down while petting Town Pets/Slimes.
> - `(Mod|Global)NPC.ChatBubblePosition(ref Vector2 position, ref SpriteEffects spriteEffects)` to change the chat bubble that appears while hovering over a Town NPC.
> - `(Mod|Global)NPC.EmoteBubblePosition(ref Vector2 position, ref SpriteEffects spriteEffects)` to change the emote bubble on NPCs.
> - `(Mod|Global)NPC.PartyHatPosition(ref Vector2 position, ref SpriteEffects spriteEffects)` to have more control over the party hat on Town NPCs.
> - New `NPCID.Sets.NPCFramingGroup[Type] = 8` which has no predefined offsets for the party hat.

### `ExampleFlask and EmitEnchantmentVisualsAt hook`
**Pull Request:** <https://github.com/tModLoader/tModLoader/commit/5108256b0839172203b1534035755e9064a7780e>

**Short Summary**
> - `(ModPlayer|ModProjectile|GlobalProjectile)EmitEnchantmentVisualsAt` hooks added. These facilitate weapon enchantment visuals.
> - `MeleeEffects` has been used for this, but only covers items and does not cover projectiles. With both hooks it is now possible to fully support weapon enchantment visuals.
> - `ExampleFlask` and `ExampleWeaponImbue` showcase a full implementation of a flask potion and corresponding weapon imbue, the most common type of weapon enchantment. 

**Porting Notes**
> - Mods with weapon enchantments (such as flasks, frost armor, or magma stone-type effects) should implement the `EmitEnchantmentVisualsAt` hook. The code will be quite similar to the `MeleeEffects` code you are already using, see `ExampleWeaponEnchantmentPlayer.cs` for an example.
> - Use `Player.MeleeEnchantActive` instead of setting `Player.meleeEnchant` to a high value, if you want.
> - Consider testing projectiles in your mod while weapon enchantments are active, set `Projectile.noEnchantments = true` for special projectiles that shouldn't be affected by weapon enchantment effects (buffs) or visuals (dust).
> - If weapon enchantment visuals on melee projectiles seem to be incorrectly positioned, such as would likely happen on "energy swords" such as Excalibur, consider using `Projectile.noEnchantmentVisuals = true` and `Projectile.EmitEnchantmentVisualsAt` as shown in `ExampleSwingingEnergySwordProjectile` to manually position the enchantment visuals.

### `Add UseItem back to QuickHeal and QuickMana, missing since 1.3`
**Pull Request:** <https://github.com/tModLoader/tModLoader/commit/2f6c9a25a3ac178af30f8bd58e1c411b77ab006d>

**Short Summary**
> - `ItemLoader.UseItem` (`(Mod|Global)Item.UseItem`) calls added back to `Player.QuickHeal` and `Player.QuickMana`. This was missing since 1.3.

**Porting Notes**
> - Check that UseItem logic dealing with health/mana potions still works with quick heal and quick mana hotkeys.

# v2024.05
Nothing this month.

# v2024.04
### `Allow shaders to omit parameters they don't use.`
**Pull Request:** <https://github.com/tModLoader/tModLoader/commit/30b2b9b1e3347a1c98ebe6924811ba5e82391dc3>    
**Short Summary:** Shaders no longer need to declare all the parameters expected by the game

### `GoreID.Sets.LiquidDroplet`
**Pull Request:** <https://github.com/tModLoader/tModLoader/commit/06996a53d6071cbd33653b8bfda2628ca47c8777>

**Short Summary**
> - `GoreID.Sets.LiquidDroplet` has been added to completely support modded liquid droplet gore. The old `GoreID.Sets.DrawBehind` approach resulted in some slight visual bugs.

**Porting Notes**
> - Replace usages of `GoreID.Sets.DrawBehind` with `GoreID.Sets.LiquidDroplet` in modded liquid droplet gore. Compare against ExampleDroplet.cs.

### `ModTile/GlobalTile.CanPlace functionality restored`
**Pull Request:** <https://github.com/tModLoader/tModLoader/commit/6e66b805a8ba15adf1a3b25710d558cea3a5416d>

**Short Summary**
> - `ModTile/GlobalTile.CanPlace` has not worked correctly, this has been fixed. 

**Porting Notes**
> - Verify that your `CanPlace` code is still correct and get rid of any manual workarounds. Note that `CanPlace` is still called during block swap by design.

### `ItemID.Sets.DuplicationMenuToolsFilter added`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4120>    
**Short Summary:** It was previously impossible to declare that an item was a tool for the creative mode duplication menu. This is now possible with `ItemID.Sets.DuplicationMenuToolsFilter`

### `shopCustomPrice infinite money exploit`
**Short Summary**
> - Modders should double check their `Item.shopCustomPrice` usage. We've recently become aware of mods setting `shopCustomPrice` far lower than `Item.value`. We've determined that a custom price `0.44 times` the regular value would allow a user with max happiness and a discount card to sell the item back to a shop for more than the purchase price after leaving and entering the world. This is because the normal `Item.value` is used to determine the sell price. Either raise `shopCustomPrice` or lower `Item.value` to avoid this exploit.

# v2024.03
This release includes an update from .NET 6 to .NET 8. Modders will need to install the [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) and [update Visual Studio to at least VS2022 17.8](https://learn.microsoft.com/en-us/visualstudio/install/update-visual-studio?view=vs-2022#use-the-visual-studio-installer-1). After that, restart the computer. See below for details.

### `Port TML from .NET 6 to .NET 8`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4037>

**Short Summary**
> - Upgrades tModLoader from .NET6 to .NET8.
> - Players have reported noticeable performance improvements. World generation benchmarks finish 10% faster!
> - Mod developers will benefit from access to new C# and .NET features, such as [`ref fields`](<https://github.com/dotnet/csharplang/blob/main/proposals/csharp-11.0/low-level-struct-improvements.md>), [`generic math`](<https://github.com/dotnet/csharplang/blob/main/proposals/csharp-11.0/static-abstracts-in-interfaces.md>), [`unsafe accessors`](<https://learn.microsoft.com/en-us/dotnet/api/system.runtime.compilerservices.unsafeaccessorattribute>), and more.

**Porting Notes**
> - Install the [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
> - To update your mods' project files - access the `Develop Mods` menu and click the `Upgrade` button near your mod. Due to [`#4134`](<https://github.com/tModLoader/tModLoader/pull/4134>), this is now a safe operation to perform. Future runtime updates will not require this step.
> - If you're a developer who's using `Windows 8.1` or earlier - you'll need to run a command for a continued smooth experience. Press `Win + R`, paste `setx DOTNET_EnableWriteXorExecute 0` in the "Run" window, and press enter. A PC restart is also recommended for ensured compatibility. Players do not really need to do this.
> - .NET 8 development in Visual Studio requires VS2022 17.8 or later. If updating from VS2019 - make sure to export your customization/configuration for a re-import post-update.
> - You may need to restart the computer as well.

### `Refactored mod creation to use a file tree of templates.`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4134>

**Short Summary**
> - Upgrading mods will no longer completely reset their `.csproj` files, when possible. It's now a safe operation to perform.
> - All files in the mod template produced by the "Create Mod" dialog have been slightly improved, including the default mod icon.
> - Properties like `LangVersion`, `TargetFramework`, `PlatformTarget`, and the `CodeAssist` `PackageReference` are removed in favor of coming from the always-imported `tModLoader.targets`. If you have any edge-cases that this change interferes with - let us know. Conditional groups are currently skipped just in case.

# v2024.02
### `New Asset guidelines and new Asset<Effect> constructor to ShaderData`
**Pull Request:** <https://github.com/tModLoader/tModLoader/compare/3ed8e6eff98af2b7fea55b236a7849e409617ff8...58ed35b2ddedcc7f67a7be50a57223de2cd414b0>

**Short Summary**
* We've noticed that many mods do not use `Assets<T>` as efficiently as they can. These changes and accompanying guides will help modders improve their mod's load times and performance.
* A new [Assets wiki page](https://github.com/tModLoader/tModLoader/wiki/Assets) has been made to teach modders various guidelines on how to properly use the `Asset` class.
* [ExampleMod has been updated](https://github.com/tModLoader/tModLoader/pull/4121) to follow these new guidelines. It serves as a practical example of the guidelines taught in the Asset wiki page.
* Log messages will warn about mods that spend a long time using `AssetRequestMode.ImmediateLoad` during mod loading.
* ShaderData now has a constructor that takes a `Asset<Effect>`, allowing for more efficient Shader loading.

**Porting Notes** 
* Please read the new [Assets wiki page](<https://github.com/tModLoader/tModLoader/wiki/Assets>) and apply the guidelines taught within. 
* Replace `ShaderData` constructors with the new `Asset<Effect>` approach: 
> Old:    
> ```new ArmorShaderData(new Ref<Effect>(Mod.Assets.Request<Effect>("Assets/Effects/ExampleEffect", AssetRequestMode.ImmediateLoad).Value), "ExampleDyePass")```    
> New:    
> ```new ArmorShaderData(Mod.Assets.Request<Effect>("Assets/Effects/ExampleEffect"), "ExampleDyePass")```    

### `Fix incorrect fishing line offset with vanilla bobbers on modded rods.`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4060>

**Short Summary:** `ModProjectile.ModifyFishingLine` has been made obsolete and `ModItem.ModifyFishingLine` has been added to replace it. Basically, the pole item now controls the string position and color instead of the bobber projectile, matching the Terraria behavior.    

**Porting Notes:** Move logic from the bobber projectile's `ModProjectile.ModifyFishingLine` to the rod item's `ModItem.ModifyFishingLine`.

### `Separate DisplayName and DisplayNameClean`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4052>

**Short Summary:** `Mod.DisplayNameClean` property added. Use this when outputting the display names of mods to logs or console window. Also use it if your mod has the ability to search or filter by mod display name, such as a search bar.    

**Porting Notes:** Change `Mod.DisplayName` to `Mod.DisplayNameClean` if appropriate.

### `A Complete Builder Toggle API`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/3943>

**Short Summary:** `BuilderToggle` now has more functionality, such as custom drawing, ordering, and left and right click methods.

**Porting Notes:** `BuilderToggle.DisplayColorTexture` is now obsolete. Use `BuilderToggle.Draw/DrawHover` instead and modify `drawParams.Color`.

### `Modded Sand and Sandgun support`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4053>

**Short Summary**
* Sand tiles and associated falling sand and sandgun projectiles are now natively supported.
* If your mod implemented sand tiles previously they should still work. You can consult ExampleSand to see how it can be done with much cleaner code. Modded sand examples available previously online have slight inconsistencies with bugfixes added in 1.4.4 Terraria, so it might be worth switching to the native approach for exact behavior consistency.

**Porting Notes**
* If you used reflection to access `WorldGen.SpawnFallingBlockProjectile`, it is no longer private and can be called normally.

### `Allow .hjson files to be used for non-localization purposes`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4087>

**Short Summary**
* TML will no longer interfere in cases where mod developers want to utilize `.hjson` files for non-localization needs (such as content and data declarations), as long as the files' names don't begin with language codes (e.g. `en-US`).
* If you're going to make use of this - it's recommended that you use consistent suffixes in your asset enumeration patterns (e.g. `*.weather.hjson`, `*.data.hjson`, `*.recipe.hjson`), as to not repeat our initial mistake.

**Porting Notes**
* `LocalizationLoader.(GetCultureAndPrefixFromPath -> TryGetCultureAndPrefixFromPath)`. Unlikely that anyone used it.

### `Two PRs improving the performance and usability of HookList and GlobalHookList`
**Pull Requests:** <https://github.com/tModLoader/tModLoader/pull/4088> <https://github.com/tModLoader/tModLoader/pull/4089>

**Short Summary**
* Improves mod loading times by up to 10%
* Methods for custom hooks are no longer specified via reflection, and instead use the 'lambda expression' syntax
* The only mods with runtime breakage are those with custom hooks that have `ref` or `out` parameters.

Examples of adding custom hooks (for an imaginary method `OnThrow` in `MyInterface`):
```cs
// GlobalItem hook
GlobalHookList<GlobalItem> HookOnThrow = ItemLoader.AddModHook(GlobalHookList<GlobalItem>.Create(g => ((MyInterface)g).OnThrow));

// ModPlayer hook
HookList<ModPlayer> HookOnThrow = PlayerLoader.AddModHook(HookList<ModPlayer>.Create(p => ((MyInterface)p).OnThrow));
```

Ping Chicken Bones or Mirsario on Discord if you need help updating your mod or implementing custom hooks.

# v2024.01

### `Fix Knockback.Flat affecting NPC with knockBackResist values of 0`
**Pull Request:** <https://github.com/tModLoader/tModLoader/commit/03a47b82c764e73243aa809f0d033f4dfbaaa793>

**Short Summary**
* `NPC` with `knockBackResist` values of 0 are supposed to be immune to knockback, but the old implementation would apply knockback to NPC if `NPC.HitModifiers.Knockback.Flat` were assigned a value. 
* This was deemed incorrect, so a `DisableKnockback` method was added to disable knockback altogether. It is automatically applied to NPC with `knockBackResist` values of 0

**Porting Notes**
* If, for some reason, your mod depended on this behavior, you'll have to devise a workaround. This behavior has been deemed incorrect so an easy workaround has not been implemented.

### `Fix Multilure and Sonar buff cause item-pickup-texts to be increased by 1`
**Pull Request:** <https://github.com/tModLoader/tModLoader/commit/247c77b853aa299c39328d3484ab9e072d4cc1d1>

**Short Summary:** Fixes multiple bobbers causing sonar buff related issues.    
**Porting Notes:** If you are using `Projectile.localAI[2]` in bobber projectiles, use your own GlobalProjectile field instead. The fix uses it.

# v2023.12

### `Make type 0 entities inactive in SetDefaults and TurnToAir`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4032>

**Short Summary**
* `SetDefaults(0)` and `TurnToAir()` will now set `active` to `false` for `NPC`, `Projectile` and `Item`
* Should reduce issues with dummy and despawned entities being assumed `active` by accident, and subsequent `GetGlobal` calls failing.

### `Check outer types for PreJITFilter attributes and improve error messages`
**Pull Request:** <https://github.com/tModLoader/tModLoader/pull/4033>

**Short Summary**
* Outer types will be checked for jit filter attributes such as `[ExtendsFromMod("ModName)"]`
* This makes it easier to use lambdas which reference types from weakly referenced mods

### `Main menu ActiveInterface & Recalculate() spam fixes`
**Commits:** [#0](<https://github.com/tModLoader/tModLoader/commit/e842f3b>), [#1](<https://github.com/tModLoader/tModLoader/commit/17b4266>).

**Short Summary**
* A commit has been pushed to `Preview` to fix an accidental long-present misbehavior of main menu interfaces being recalculated every frame, with the fix improving performance among other things.
* This misbehavior has resulted in some of our recent main menu GUIs being written without proper manual `Recalculate()` calls, making them dependent on this bug, as due to it everything looked fine to us in testing.    

**Porting Notes**
* If your mod contains custom user interfaces **that get shown in main menu** - please ensure that they didn't get borked on preview, and if they did - insert manual `Recalculate()` calls when first activating the interface, or when it should be refreshed. As you usually would when writing GUIs.
 
**Example fixes:**
* [TModLoader's Delete Mod dialog fix](<https://github.com/tModLoader/tModLoader/commit/77019e9>).
* [TerrariaOverhaul's custom config screen fixes](<https://github.com/Mirsario/TerrariaOverhaul/pull/165/commits/83f5978>).

# v2023.11

### [PR 3922](https://github.com/tModLoader/tModLoader/pull/3922): Bad Tile Object Data leading to Render Mismatch
**Short Summary:** 
* There was a visual bug with tModLoader that could lead to 'floating' tiles
* Annoyingly, these issues are sometimes caused by incorrect code in the ModTile loading immediately before the 1st affected ModTile, leading to bugs that are hard to track down.
* This PR fixes the issue by resetting the affected fields in CopyFrom. This PR also throws errors in CopyFrom to instruct the modder that their code is not doing what they think it is, and will give you an error while developing your mod if applicable

### [Bug Fix Commit](https://github.com/tModLoader/tModLoader/commit/a44fd59a54df7823dc5b4ee5be3e09081fab3087): `NPC.aiStyle` now defaults to -1 for modded NPCs
**Short Summary:** 
* ai = -1 is for custom AI applications. The tModLoader code expected to handle -1 as the default, but had been written as zero due to a typo.
* If you had been using aiStyle 0 implicitly by leaving it as default, then you will need to explicitly assign it going forward 


# v2023.09

### [Fix 3825](https://github.com/tModLoader/tModLoader/commit/89d407f518804819abd363bb939ba990c56f9758): TileDrawing.IsVisible(tile) now public
**Short Summary:** 
* Terraria 1.4.4 added echo tiles and coating, but ExampleMod and other mods have not adapted their code.
* Many mods using `ModTile.PostDraw` will erroneously draw torch flames and spawn dust when the tile is invisible.
* Made `TileDrawing.IsVisible(tile)` method public, updated ExampleMod to use.

### [PR 3750](https://github.com/tModLoader/tModLoader/pull/3750): ModConfig.AcceptClientChanges parameters changed. 
**Short Summary:** `string` parameter replaced with `NetworkText` parameter for better localization support.

### [PR 3684](https://github.com/tModLoader/tModLoader/pull/3684): `TileID.Sets.CanPlaceNextToNonSolidTile` added
**Short Summary:** 
* New `TileID.Sets.CanPlaceNextToNonSolidTile[]` which allows players to place tiles next to non-solid tiles.
* Allows for the same placement behavior of Cobwebs, Coin Piles, Living Fire Blocks, Smoke Blocks, and Bubble Blocks.

# v2023.08

### Extra Jump API
[PR 3552](https://github.com/tModLoader/tModLoader/pull/3552) added a proper API for implementing and modifying extra mid-air jumps.

**Short Summary:**
* Adds `ExtraJump`, a singleton type representing an extra jump that is controlled via the `ExtraJumpState` structure
  * The `ExtraJumpState` object for an extra jump can be obtained via the `GetJumpState` methods in `Player`
  * Extra jumps can be disabled for the "current update tick" or consumed entirely
    * **NOTE:** `ExtraJumpState.Disable()` will consume the extra jump if it is available and prematurely stops it if it's currently active
* Adds new methods related to checking the state of the player's extra jumps to `Player`
  * Also includes a `blockExtraJumps` field, which prevents any extra jumps from being used, but does not stop the currently active jump nor consume any remaining extra jumps
* Flipper swimming is now considered an "extra jump" and can be accessed via `Player.GetJumpState(ExtraJump.Flipper)`
* `Player.sandStorm` is now more directly related to the state of the *Sandstorm in a Bottle* extra jump

ExampleMod contains examples for [simple](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/Accessories/ExampleExtraJumpAccessory.cs) and [complex](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/Accessories/ExampleMultiExtraJumpAccessory.cs) extra jumps, as well as an example for [modifying an extra jump](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Common/Players/ExampleExtraJumpModificationPlayer.cs).

The PR's original comment contains snippets for enabling/disabling an extra jump, temporarily disabling extra jumps in a `ModBuff` and changing the horizontal movement modifications for an extra jump.

**Porting Notes:**
* `Player.hasJumpOption_X`, `Player.canJumpAgain_X` and `Player.isPerformingJump_X` for all vanilla jumps are now accessed via the `ExtraJumpState` for the respective extra jump
  * If you were setting one or more of these fields to `false` in order to disable the extra jump, use `ExtraJumpState.Disable()` instead
  * If you were disabling all extra jumps:
    * Set `Player.blockExtraJumps = true;` for temporary disabling
    * Call `Player.ConsumeAllExtraJumps()` (optionally followed by `Player.StopExtraJumpInProgress()`) for permanent disabling until the player lands
* `Player.accFlipper` and `Player.sandStorm` are now properties, so any code that was using them will have to be rebuilt

### Rework `NPCID.Sets.DebuffImmunitySets`
[PR 3453](https://github.com/tModLoader/tModLoader/pull/3453) reworks NPC buff immunities

**Short Summary:**      
- Replace `NPCID.Sets.DebuffImmunitySets` with `NPCID.Sets.SpecificDebuffImmunity`, `NPCID.Sets.ImmuneToAllBuffs`, and `NPCID.Sets.ImmuneToRegularBuffs` to simplify modder code.
- Added buff immunity inheritance through the `BuffID.Sets.GrantImmunityWith` set and corresponding methods.

**Porting Notes:** 
- If your mod has any NPCs or does anything with buff immunity, you'll need to update their buff immunity code. Read the Porting Notes section of [PR 3453](https://github.com/tModLoader/tModLoader/pull/3453).
- Mods should consider using the new buff immunity inheritance system for buff inheritance compatibility.

<a name="smaller-changes-v202308"></a>
### [PR 3770](https://github.com/tModLoader/tModLoader/pull/3770): Rename `(Mod|Global)Projectile.Kill` hook to `OnKill`
**Short Summary:** `(Mod|Global)Projectile.Kill` renamed to `OnKill` to better match the behavior and other similar hooks.     
**Porting Notes:** Run tModPorter or rename usages of `(Mod|Global)Projectile.Kill` to `OnKill`

### [PR 3759](https://github.com/tModLoader/tModLoader/pull/3759): `ModPlayer.OnPickup` hook
**Short Summary:** 
- Adds `ModPlayer.OnPickup` which functions the same as the `GlobalItem` hook.     
- The hook has been added for convenience, to reduce the need to make a separate `GlobalItem` class when many of the effects modders want to make are stored on a `ModPlayer` instance

### [PR 3746](https://github.com/tModLoader/tModLoader/pull/3746): Add modded world header data
**Short Summary:** 
- Modded world data can be now be saved into a 'header' in the .twld file. The header can be read without deserializing the entire .twld file, and the modded data is accessible in the world select menu and during vanilla world loading.
- The list of mods the world was last played with is now shown in the world select menu, just like for players
- The list of mods (and version of those mods) the world was generated with is now stored in the header. Only applies to worlds generated in the future of course.    

See [PR 3746](https://github.com/tModLoader/tModLoader/pull/3746) for more details and usage examples    

### [PR 2918](https://github.com/tModLoader/tModLoader/pull/2918): Modded Emote Bubble
**Short Summary:**  
- Modders can now make custom emotes
- Modders can adjust how NPC pick emotes
- ExampleMod shows off several custom emotes and custom emote spawning    

### [PR 3731](https://github.com/tModLoader/tModLoader/pull/3731): Modded Builder Toggles
**Short Summary:** Modders can now make builder toggles, which are those small icons top left of the inventory that are used for block swap, wire visibility, etc.     
**Porting Notes:** If you previously made builders toggles using your own approach, use the tModLoader approach.

### [PR 3710](https://github.com/tModLoader/tModLoader/pull/3710): Better Changelogs
**Short Summary:** Expand ChangeLog functionality     
**Porting Notes:** 
-  tModLoader no longer adds it's own text when a changelog.txt is provided. We recommend adding to your own changelog.txt files based on [ExampleMod's changelog.txt](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/changelog.txt)
- All 4 fields in the example, such as `{ModVersion}`, are replaced with the info from tModLoader during publishing for convenience.

### [PR 3568](https://github.com/tModLoader/tModLoader/pull/3568): Rubblemaker support
**Short Summary:** Modders can now add tiles to the [Rubblemaker](https://terraria.wiki.gg/wiki/Rubblemaker)   

### Other v2023.08 Changes
* [`ItemID.Sets.IsSpaceGun` added](https://github.com/tModLoader/tModLoader/commit/b6a6fcc40d2d39aed6df98e862f29e8deaf7a77e)
* [`GlobalInfoDisplay.ModifyDisplayParameters` replaces `ModifyDisplayValue`/`ModifyDisplayName`/`ModifyDisplayColor`](https://github.com/tModLoader/tModLoader/commit/3ca9bf16a3722c35ea86377b7a28f4456b072743)
* [`GenPass.Disable` and `GenPass.Enabled`](https://github.com/tModLoader/tModLoader/commit/8460afd82e71a88b7fa3856713e33baa4f0fda57)
* [`TooltipLine.Hide` and `TooltipLine.Visible`](https://github.com/tModLoader/tModLoader/commit/42daf2a8789bebab092902a4dad59bdfdfd88a17)
* [`ModTree.Shake`'s `createLeaves` parameter now defaults to `true`](https://github.com/tModLoader/tModLoader/commit/1352e4b5c8109de9f86cc20735bceb91ebdb5198)
* [Automatic TranslationsNeeded.txt feature](https://github.com/tModLoader/tModLoader/commit/aee3e5ece65982d28dd0e4c5930e4fbc501e3882)
* [`GlobalInfoDisplay.ModifyDisplayColor` has new `displayShadowColor` parameter](https://github.com/tModLoader/tModLoader/commit/8e0274a1fb317b856600a804acc93cd2635d31fe)
* [`DamageClassLoader.GetDamageClass` added](https://github.com/tModLoader/tModLoader/commit/e9572b649b8e8af69c2d493b33043bb61e3e9c9a)
* [`TileRestingInfo` constructor changed](https://github.com/tModLoader/tModLoader/commit/e5ac187611e201685650bca482cbecfa457b7649)
* [`ModTile.IsTileBiomeSightable` hook](https://github.com/tModLoader/tModLoader/commit/57d8c0de992e688465257c184f2eaf1c7307ea3e)
* [`SceneMetrics.GetLiquidCount` added](https://github.com/tModLoader/tModLoader/commit/d03a022416e01f7858800454e20ce28a1d5c954b)
* [`NPCID.Sets.BelongsToInvasionGoblinArmy`/`BelongsToInvasionFrostLegion`/`BelongsToInvasionPirate`/`BelongsToInvasionMartianMadness`/`NoInvasionMusic`/`InvasionSlotCount` added](https://github.com/tModLoader/tModLoader/commit/4f378265980bc513105618113a22b76f531358b3)
* [`ArmorIDs.Head.Sets.IsTallHat` added](https://github.com/tModLoader/tModLoader/commit/a2f8cfa204f403fe6d99aee67a6722a22329cf0d)
* [`GoreID.Sets.PaintedFallingLeaf` added](https://github.com/tModLoader/tModLoader/commit/e171965d2547488d7eca5d45c4eac6d0cadf252c)
* [All `LocalizationCategory` implementations now virtual](https://github.com/tModLoader/tModLoader/commit/ffea871bc30f5eea3ba0f4d2162ce26c38d8eb2d)

# v2023.X (1.4.4)
The tModLoader team took advantage of the release of Terraria 1.4.4.9 to implement a wide variety of breaking changes. These changes are large features that have been highly requested from the community. The extent of the changes, as well as changes in Terraria, are so large that all mods will need to update to continue working on 1.4.4. tModLoader for 1.4.3 will continue to be available to users as the `1.4.3-legacy` steam beta option. If a modder intends to continue updating their mod for 1.4.3 users, they should use backups or [Git](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Git-&-mod-management) to maintain copies of their source code for 1.4.3 and 1.4.4. 

This migration guide assumes the mod has already been migrated to 1.4.3. If that is not the case, do that first.

The first step in migrating to 1.4.4 is following the [Localization Changes](#localization-changes) section below. Once that is done, switch to the `None` branch on steam by following the [instructions](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-players#to-access-13-legacy-tmodloader-and-other-beta-options). Launch tModLoader, make sure it says `Terraria v1.4.4.9` and `tModLoader v2023.6.x.y` in the corner. Next, visit the Workshop->Develop Mods menu in game and click on the "Run tModPorter" button. After that completed, you are ready to open Visual Studio and begin working on updating parts of the code that tModPorter either couldn't port or left a comment with instructions (to find all comments, first, go to Tools -> Options -> Environment -> Task List, and add `tModPorter` as a custom token. Then close it, and opening View -> Task List will list all comments, where you can also use the search bar to filter specific comments). As 1.4.4 continues to update, you might need to "Run tModPorter" again if an update breaks something.

## Localization Changes
The largest change to tModLoader is that localization is now done fully in the `.hjson` localization files. You **MUST** follow the [Migrating from 1.4.3 to 1.4.4](https://github.com/tModLoader/tModLoader/wiki/Localization#migrating-from-143-to-144) instructions. Failure to do this step will make porting a mod extremely tedious. More details can be found in [Localization Changes details](#localization-changes-details).

## New Vanilla Features
Terraria 1.4.4 has many new features and changes. The [1.4.4 changelog](https://terraria.wiki.gg/wiki/1.4.4) details these changes. Modders should be aware of the changes in case they would impact the balance or functionality of their mods. For example, `NPC` can now have 20 buffs and `Player` can now have 44 buffs by default.

Of specific note is the Shimmer, modders should consider how content in their mod would interact with the Shimmer. [ExampleMod](https://github.com/tModLoader/tModLoader/search?utf8=%E2%9C%93&q=shimmer+path:ExampleMod&type=Code) contains examples of various shimmer features, such as transforming NPC, decrafting examples, and transforming items.

### Other Vanilla Changes
* `ModWaterStyle` now requires an additional texture, `_Slope`. See `ExampleWaterStyle` for details.
* `GrantPrefixBenefits` is only called if `Item.accessory` is `true`. This applies in mod accessory slots too now.
* Reforging is now implemented via `Item.ResetPrefix`. This sets `prefix` to 0 and then refreshes the item. Make sure any custom fields set by custom prefixes are not serialized independently.

## Renamed or Moved Members
All of the changes in this section will be handled by tModPorter and are listed here for completeness. Modders can skip this section and go directly to [Big change concepts](#big-change-concepts) to see the changes that require the modder to make big changes to their mod.

### Namespaces / Classes
* `GameContent.UI.ResourceSets.HorizontalBarsPlayerReosurcesDisplaySet` -> `GameContent.UI.ResourceSets.HorizontalBarsPlayerResourcesDisplaySet`

### Static Methods
* `NetMessage.SendObjectPlacment` -> `NetMessage.SendObjectPlacement`

### Static Fields / Constants / Properties
* `ID.TileID.Sets.TouchDamageSands` -> `ID.TileID.Sets.Suffocate`
* `ID.TileID.Sets.TouchDamageOther` -> `ID.TileID.Sets.TouchDamageImmediate` and possibly `ID.TileID.Sets.TouchDamageBleeding`
* `ID.TileID.Sets.TouchDamageVines` -> `ID.TileID.Sets.TouchDamageImmediate` and `ID.TileID.Sets.TouchDamageDestroyTile`
* `DustID.Fire` -> `DustID.Torch`
* `MessageID.SendNPCBuffs` -> `MessageID.NPCBuffs`
* `MessageID.Unlock` -> `MessageID.LockAndUnlock`
* `MessageID.StartPlaying` -> `MessageID.InitialSpawn`
* `MessageID.SpawnBoss` -> `MessageID.SpawnBossUseLicenseStartEvent`
* `MessageID.Teleport` -> `MessageID.TeleportEntity`
* `MessageID.ClientHello` -> `MessageID.Hello`
* `MessageID.LoadPlayer` -> `MessageID.PlayerInfo`
* `MessageID.RequestWorldInfo` -> `MessageID.RequestWorldData`
* `MessageID.RequestTileData` -> `MessageID.SpawnTileData`
* `MessageID.StatusText` -> `MessageID.StatusTextSize`
* `MessageID.FrameSection` -> `MessageID.TileFrameSection`
* `MessageID.SpawnPlayer` -> `MessageID.PlayerSpawn`
* `MessageID.PlayerHealth` -> `MessageID.PlayerLifeMana`
* `MessageID.TileChange` -> `MessageID.TileManipulation`
* `MessageID.MenuSunMoon` -> `MessageID.SetTime`
* `MessageID.ChangeDoor` -> `MessageID.ToggleDoorState`
* `MessageID.UnusedStrikeNPC` -> `MessageID.UnusedMeleeStrike`
* `MessageID.StrikeNPC` -> `MessageID.DamageNPC`
* `MessageID.PlayerPVP` -> `MessageID.TogglePVP`
* `MessageID.HealEffect` -> `MessageID.PlayerHeal`
* `MessageID.PlayerZone` -> `MessageID.SyncPlayerZone`
* `MessageID.ResetItemOwner` -> `MessageID.ReleaseItemOwnership`
* `MessageID.PlayerTalkingNPC` -> `MessageID.SyncTalkNPC`
* `MessageID.ItemAnimation` -> `MessageID.ShotAnimationAndSound`
* `MessageID.MurderSomeoneElsesProjectile` -> `MessageID.MurderSomeoneElsesPortal`
* `Main.fastForwardTime` -> Removed, use `IsFastForwardingTime()`, `fastForwardTimeToDawn` or `fastForwardTimeToDusk`
* The following all change from `Terraria.WorldGen` to `Terraria.WorldBuilding.GenVars`: `configuration`, `structures`, `copper`, `iron`, `silver`, `gold`, `copperBar`, `ironBar`, `silverBar`, `goldBar`, `mossTile`, `mossWall`, `lavaLine`, `waterLine`, `worldSurfaceLow`, `worldSurface`, `worldSurfaceHigh`, `rockLayerLow`, `rockLayer`, `rockLayerHigh`, `snowTop`, `snowBottom`, `snowOriginLeft`, `snowOriginRight`, `snowMinX`, `snowMaxX`, `leftBeachEnd`, `rightBeachStart`, `beachBordersWidth`, `beachSandRandomCenter`, `beachSandRandomWidthRange`, `beachSandDungeonExtraWidth`, `beachSandJungleExtraWidth`, `shellStartXLeft`, `shellStartYLeft`, `shellStartXRight`, `shellStartYRight`, `oceanWaterStartRandomMin`, `oceanWaterStartRandomMax`, `oceanWaterForcedJungleLength`, `evilBiomeBeachAvoidance`, `evilBiomeAvoidanceMidFixer`, `lakesBeachAvoidance`, `smallHolesBeachAvoidance`, `surfaceCavesBeachAvoidance2`, `maxOceanCaveTreasure`, `numOceanCaveTreasure`, `oceanCaveTreasure`, `skipDesertTileCheck`, `UndergroundDesertLocation`, `UndergroundDesertHiveLocation`, `desertHiveHigh`, `desertHiveLow`, `desertHiveLeft`, `desertHiveRight`, `numLarva`, `larvaY`, `larvaX`, `numPyr`, `PyrX`, `PyrY`, `jungleOriginX`, `jungleMinX`, `jungleMaxX`, `JungleX`, `jungleHut`, `mudWall`, `JungleItemCount`, `JChestX`, `JChestY`, `numJChests`, `tLeft`, `tRight`, `tTop`, `tBottom`, `tRooms`, `lAltarX`, `lAltarY`, `dungeonSide`, `dungeonLocation`, `dungeonLake`, `crackedType`, `dungeonX`, `dungeonY`, `lastDungeonHall`, `maxDRooms`, `numDRooms`, `dRoomX`, `dRoomY`, `dRoomSize`, `dRoomTreasure`, `dRoomL`, `dRoomR`, `dRoomT`, `dRoomB`, `numDDoors`, `DDoorX`, `DDoorY`, `DDoorPos`, `numDungeonPlatforms`, `dungeonPlatformX`, `dungeonPlatformY`, `dEnteranceX`, `dSurface`, `dxStrength1`, `dyStrength1`, `dxStrength2`, `dyStrength2`, `dMinX`, `dMaxX`, `dMinY`, `dMaxY`, `skyLakes`, `generatedShadowKey`, `numIslandHouses`, `skyLake`, `floatingIslandHouseX`, `floatingIslandHouseY`, `floatingIslandStyle`, `numMCaves`, `mCaveX`, `mCaveY`, `maxTunnels`, `numTunnels`, `tunnelX`, `maxOrePatch`, `numOrePatch`, `orePatchX`, `maxMushroomBiomes`, `numMushroomBiomes`, `mushroomBiomesPosition`, `logX`, `logY`, `maxLakes`, `numLakes`, `LakeX`, `maxOasis`, `numOasis`, `oasisPosition`, `oasisWidth`, `oasisHeight`, `hellChest`, `hellChestItem`, `statueList`, `StatuesWithTraps`
* `WorldGen.houseCount` -> `WorldBuilding.GenVars.skyIslandHouseCount`

### Non-Static Methods
* `UI.UIElement.MouseDown` -> `UI.UIElement.LeftMouseDown`
* `UI.UIElement.MouseUp` -> `UI.UIElement.LeftMouseUp`
* `UI.UIElement.Click` -> `UI.UIElement.LeftClick`
* `UI.UIElement.DoubleClick` -> `UI.UIElement.LeftDoubleClick`
* `Player.VanillaUpdateEquip` -> Removed, use either `GrantPrefixBenefits` (if `Item.accessory`) or `GrantArmorBenefits` (for armor slots)
* `Player.IsAValidEquipmentSlotForIteration` -> `Player.IsItemSlotUnlockedAndUsable`
* `Item.DefaultToPlacableWall` -> `Item.DefaultToPlaceableWall`

### Non-Static Fields / Constants / Properties
* `UI.UIElement.OnMouseDown` -> `UI.UIElement.OnLeftMouseDown`
* `UI.UIElement.OnMouseUp` -> `UI.UIElement.OnLeftMouseUp`
* `UI.UIElement.OnClick` -> `UI.UIElement.OnLeftClick`
* `UI.UIElement.OnDoubleClick` -> `UI.UIElement.OnLeftDoubleClick`
* `Player.discount` -> `Player.discountAvailable`
* `Item.canBePlacedInVanityRegardlessOfConditions` -> `Item.hasVanityEffects`

### Misc changes

### tModLoader changes
The following contains smaller scale changes to tModLoader members. More elaborate changes are handled in separate categories below.

* `ModTile.OpenDoorID` removed, use `TileID.Sets.OpenDoorID` instead
* `ModTile.CloseDoorID` removed, use `TileID.Sets.CloseDoorID` instead
* `NPCSpawnInfo.PlanteraDefeated` removed, use `(NPC.downedPlantBoss && Main.hardMode)` instead
* `ModNPC.ScaleExpertStats` -> `ModNPC.ApplyDifficultyAndPlayerScaling`, parameters changed. `bossLifeScale` -> `balance` (`bossAdjustment` is different, see the docs for details) 
* `GlobalNPC.ScaleExpertStats` -> `GlobalNPC.ApplyDifficultyAndPlayerScaling`, parameters changed. `bossLifeScale` -> `balance` (`bossAdjustment` is different, see the docs for details) 
* `ModNPC.CanTownNPCSpawn` parameters changed, copy the implementation of `NPC.SpawnAllowed_Merchant` in vanilla if you to count money, and be sure to set a flag when unlocked, so you don't count every tick
* `ModItem.SacrificeTotal` -> `Item.ResearchUnlockCount`
* `ModItem.OnCreate` -> `ModItem.OnCreated`
* `GlobalItem.OnCreate` -> `GlobalItem.OnCreated`
* `ModItem.CanBurnInLava` -> Use `ItemID.Sets.IsLavaImmuneRegardlessOfRarity` or add a method hook to `On_Item.CheckLavaDeath`
* `GlobalItem.CanBurnInLava` -> Use `ItemID.Sets.IsLavaImmuneRegardlessOfRarity` or add a method hook to `On_Item.CheckLavaDeath`
* `ModItem.ExtractinatorUse` parameters changed
* `GlobalItem.ExtractinatorUse` parameters changed
* `Player.QuickSpawnClonedItem` -> `Player.QuickSpawnItem`
* `ModPlayer.clientClone` -> Renamed to `CopyClientState` and replace `Item.Clone` usages with `Item.CopyNetStateTo`
* `ModPlayer.PlayerConnect` parameters changed
* `ModPlayer.PlayerDisconnect` parameters changed
* `ModPlayer.OnEnterWorld` parameters changed
* `ModPlayer.OnRespawn` parameters changed
* `ModTree.GrowthFXGore` -> `ModTree.TreeLeaf`
* `Terraria.DataStructures.BossBarDrawParams.LifePercentToShow` removed, use `Life / LifeMax` instead
* `Terraria.DataStructures.BossBarDrawParams.ShieldPercentToShow` removed, use `Shield / ShieldMax` instead
* `ModBossBar.ModifyInfo` life and shield current and max values are now separate to allow for hp/shield number text draw
* `ModItem/GlobalItem.ModifyHitNPC/OnHitNPC/ModifyHitPvp/OnHitPvp` -> See Player/NPC damage hooks rework section below
* `ModNPC/GlobalNPC.HitEffect/ModifyHitPlayer/OnHitPlayer/ModifyHitNPC/OnHitNPC/ModifyHitByItem/OnHitByItem/ModifyHitByProjectile/OnHitByProjectile/ModifyIncomingHit/ModifyCollisionData/StrikeNPC` -> See Player/NPC damage hooks rework section below
* `ModProjectile/GlobalProjectile.ModifyHitNPC/OnHitNPC/ModifyHitPlayer/OnHitPlayer/ModifyDamageScaling` -> See Player/NPC damage hooks rework section below
* `ModPlayer.ModifyHurt/OnHurt/PostHurt/ModifyHitNPCWithItem/OnHitNPCWithItem/ModifyHitNPCWithProj/OnHitNPCWithProj/ModifyHitByNPC/OnHitByNPC/ModifyHitByProjectile/OnHitByProjectile/CanHitNPC/ModifyHitNPC/OnHitNPC/PreHurt/Hurt` -> See Player/NPC damage hooks rework section below
* `ModProjectile.SingleGrappleHook` -> in `SetStaticDefaults`, use `ProjectileID.Sets.SingleGrappleHook[Type] = true` if you previously had this method return true
* `GlobalProjectile.SingleGrappleHook` -> in `SetStaticDefaults`, use `ProjectileID.Sets.SingleGrappleHook[Type] = true` if you previously had this method return true
* `ModPrefix.AutoStaticDefaults` -> Nothing to override anymore. Use hjson files and/or override DisplayName to adjust localization
* `ModPrefix.ValidateItem` -> `ModPrefix.AllStatChangesHaveEffectOn`
* `ModSystem.SetLanguage` -> Use `OnLocalizationsLoaded`. New hook is called at slightly different times, so read the documentation
* `ModSystem.ModifyWorldGenTasks` parameters changed
* `ModLoader.ItemCreationContext` -> `DataStructures.ItemCreationContext`
* `ModLoader.RecipeCreationContext` -> `DataStructures.RecipeItemCreationContext`
* `ModLoader.InitializationContext` -> `ModLoader.InitializationItemCreationContext`
* `Terraria.Recipe.Condition` -> `Terraria.Condition`
* `Condition.InGraveyardBiome` -> `Condition.InGraveyard`
* `Item.IsCandidateForReforge` removed, use `maxStack == 1 || Item.AllowReforgeForStackableItem` or `Item.Prefix(-3)` to check whether an item is reforgeable
* `Item.CloneWithModdedDataFrom` removed, use `Clone`, `ResetPrefix` or `Refresh`
* `ModLoader.Mod.CreateTranslation` removed, use `Localization.Language.GetOrRegister`. See [Localization Changes Details](#localization-changes-details) below.
* `ModLoader.Mod.AddTranslation` removed, use `Localization.Language.GetOrRegister`. See [Localization Changes Details](#localization-changes-details) below.
* `ModLoader.ModTranslation` removed, use `Localization.LocalizedText` instead. See [Localization Changes Details](#localization-changes-details) below.
* `InfoDisplay.InfoName` -> `InfoDisplay.DisplayName`
* `InfoDisplay.DisplayValue` -> suggestion: Set displayColor to InactiveInfoTextColor if your display value is "zero" or shows no valuable information
* `DamageClass.ClassName` -> `DamageClass.DisplayName`
* `GlobalTile.Drop/CanDrop` and `ModTile.Drop/CanDrop` -> These methods changed drastically. See [Tile Drop Changes](#tile-drop-changes) for more information.
* `ModTile.ChestDrop` -> Now use `ItemDrop`, if needed. See [Tile Drop Changes](#tile-drop-changes) for more information.
* `ModTile.DresserDrop` -> Now use `ItemDrop`, if needed. See [Tile Drop Changes](#tile-drop-changes) for more information.
* `ModTile.ContainerName` -> Removed, override `DefaultContainerName` instead
* `TileLoader.ContainerName` -> `TileLoader.DefaultContainerName`, parameters changed
* `ModBuff.ModifyBuffTip` -> `ModBuff.ModifyBuffText`, parameters changed
* `GlobalBuff.ModifyBuffTip` -> `GlobalBuff.ModifyBuffText`, parameters changed
* `ModNPC/GlobalNPC.DrawTownAttackSwing` -> Parameters changed
* `ModNPC/GlobalNPC.DrawTownAttackGun` -> Parameters changed. `closeness` is now `horizontalHoldoutOffset`, use `horizontalHoldoutOffset = Main.DrawPlayerItemPos(1f, itemtype) - originalClosenessValue` to adjust to the change. See docs for how to use hook with an item type.
* `ModNPC/GlobalNPC.SetupShop` -> `ModifyActiveShop`. Shops have drastically changed, see [Shop Changes](#shop-changes-aka-declarative-shops) for more information.
* `ModNPC.OnChatButtonClicked` ->  Parameters changed
* `ModNPC.ModifyActiveShop` ->  Parameters changed. Shops have drastically changed, see [Shop Changes](#shop-changes-aka-declarative-shops) for more information.
* `GlobalNPC.ModifyActiveShop` ->  Parameters changed. Shops have drastically changed, see [Shop Changes](#shop-changes-aka-declarative-shops) for more information.
* `ModPylon.GetNPCShopEntry` ->  Parameters changed. Shops have drastically changed, see [Shop Changes](#shop-changes-aka-declarative-shops) for more information.
* `ModPylon.IsPylonForSale` ->  `ModPylon.GetNPCShopEntry`, see ExamplePylonTile for an example. To register to specific NPC shops, use the new shop system directly in ModNPC.AddShop, GlobalNPC.ModifyShop or ModSystem.PostAddRecipes
* `ModItem/GlobalItem.PreReforge` return type changed from `bool` to `void`, no longer used to prevent reforging. Use `CanReforge` for that purpose.
* `Player.CanBuyItem` removed, use `Player.CanAfford` instead. Note that the method will no longer mistakenly attempt to consume custom currencies.
* `Player.rocketDamage` -> `Player.specialistDamage`
* `AmmoID.Sets.IsRocket` -> `AmmoID.Sets.IsSpecialist`
* `ModPrefix.GetTooltipLines` added. Some modders might want to move prefix specific tooltip lines from `GlobalItem.ModifyTooltips` to it for better code maintainability.
* `Mods.{ModName}.TownNPCMood.{NPCName}.*` localization entries relocated to `Mods.{ModName}.NPCs.{NPCName}.TownNPCMood.*`. See the porting notes in [PR 3446](https://github.com/tModLoader/tModLoader/pull/3446) for more information.
* `ModItem.AutoLightSelect` removed. See the porting notes in [PR 3479](https://github.com/tModLoader/tModLoader/pull/3479) for more information on how to adapt to this change.
*  `Player.BiomeTorchPlaceStyle` and `Player.BiomeCampfirePlaceStyle` parameters changed

## Big change concepts

### Localization Changes Details
[Issue 3074](https://github.com/tModLoader/tModLoader/pull/3074) contains the proposed changes.    
[PR 3101](https://github.com/tModLoader/tModLoader/pull/3101/files) contains the actual changes, as well as ExampleMod changes.  
[PR 3302](https://github.com/tModLoader/tModLoader/pull/3302) contains additional changes specific to `ModConfig`.    
[Localization](https://github.com/tModLoader/tModLoader/wiki/Localization) explains localization and porting instructions for modders.    
[Contributing Localization](https://github.com/tModLoader/tModLoader/wiki/Contributing-Localization) contains instructions for translators and translation mod makers.

**Short Summary**:    
* Translations are now fully in localization files (.hjson files). `ModItem.DisplayName` and `ModItem.Tooltip`, for example, can no longer be assigned in code.
  * `ModConfig` is now fully localizable by default. (See [PR #3302](https://github.com/tModLoader/tModLoader/pull/3302) for more information)
* Localization files are automatically updated with entries for new content and managed by tModLoader. More organization options available.
  * New content will appear in localization files after loading. Edits to .hjson files will be detected by tModLoader and loaded into the game as soon as they are saved, allowing modders and translators to quickly test and update translations.
* All `ModTranslation` usages are now replaced with `LocalizedText`
* All translation keys now follow a more predictable pattern: `Mods.ModName.Category.ContentName.DataName`
* Contributing translations, directly or through translation mods, has been streamlined.

**Porting Notes**:    
* Modders **MUST** follow the **Migrating from 1.4.3 to 1.4.4** section in the [localization guide on the wiki](https://github.com/tModLoader/tModLoader/wiki/Localization#migrating-from-143-to-144) prior to attempting to update a mod on `1.4.4` tModLoader.
* Modders with hardcoded values in localization files, such as "10% increased melee damage", "5 armor penetration", etc should consider updating their code to have less duplication by following the [Binding Values to Localizations](https://github.com/tModLoader/tModLoader/wiki/Localization#binding-values-to-localizations) section on the wiki.
  * [ExampleStatBonusAccessory](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/Accessories/ExampleStatBonusAccessory.cs) showcases our recommended approach for writing clean and maintainable item tooltips. In the example, all the numbers denoting the effects of the accessory only exist in code, not in both code and translation files. Most notably with this new approach, there is no risk of the tooltip and actual behavior being out of sync. Previously a modder could update an accessory but forget to update the tooltip, or forget to update tooltips for other languages, resulting in items that behave differently than how they claim to behave.
  * [AbsorbTeamDamageBuff](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Buffs/AbsorbTeamDamageBuff.cs), [AbsorbTeamDamageAccessory](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/Accessories/AbsorbTeamDamageAccessory.cs), and [ExampleDamageModificationPlayer](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Common/Players/ExampleDamageModificationPlayer.cs) further build on this idea. In these examples, the actual damage absorption stat, `DamageAbsorptionPercent` (set to 30), only exists in `AbsorbTeamDamageAccessory`. `AbsorbTeamDamageBuff` references that value for the buff tooltip via `public override LocalizedText Description => base.Description.WithFormatArgs(AbsorbTeamDamageAccessory.DamageAbsorptionPercent);`. `AbsorbTeamDamageAccessory` also references the value in it's own tooltip. `ExampleDamageModificationPlayer` also references that value in `ModifyHurt` and `OnHurt` via the `DamageAbsorptionMultiplier` property. If the modder wished to change this accessory to absorb 35% of damage instead of 30% of damage, the modder would only need to change the value in 1 place, rather than several places in multiple `.cs` and `.hjson` files. This shows the power of properly using localization files and binding values to them.
* `ModConfig` is now localized by default, see the porting notes section of [PR #3302](https://github.com/tModLoader/tModLoader/pull/3302) for porting information specific to `ModConfig`.

### Player/NPC damage hooks rework. Hit/HurtModifiers and Hit/HurtInfo
[PR 3212](https://github.com/tModLoader/tModLoader/pull/3212), [PR 3355](https://github.com/tModLoader/tModLoader/pull/3355), and [PR 3359](https://github.com/tModLoader/tModLoader/pull/3359) drastically changes how player and npc hit hooks are structured.   

**Short Summary:**    
Player and NPC hit hooks (`OnHit`, `ModifyHit`, `OnHitBy`, etc) have been simplified with common architecture, and had many new features added.

The goal of this change is to improve mod compatibility by making the damage calculations an explicit equation, where mods contribute modifiers, and tModLoader calculates the result. 

Many examples of how to make hit/hurt modifying accessories and weapon effects have been added, demonstrating the new system.
* [ExampleDodgeBuff](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Buffs/ExampleDodgeBuff.cs)/ExampleDamageModificationPlayer: `ConsumableDodge` example, similar to 
* [ExampleDefenseDebuff](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Buffs/ExampleDefenseDebuff.cs): Multiplicative defense debuff, similar to Broken Armor
* [AbsorbTeamDamageAccessory](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/Accessories/AbsorbTeamDamageAccessory.cs)/AbsorbTeamDamageBuff/ExampleDamageModificationPlayer: Damage absorption example, similar to Paladins Shield item.
* [HitModifiersShowcase](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/Weapons/HitModifiersShowcase.cs): Extensive examples of new `ModifyHitNPC` and `OnHitNPC` hooks. Disable damage variation, modify knockback, modify crit bonus damage, flat armor penetration, percentage armor penetration, etc examples.
* [ExampleWhipDebuff](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Buffs/ExampleWhipDebuff.cs) and ExampleWhipAdvancedDebuff: Show proper tag damage, both flat and scaling varieties.
* [PartyZombie](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/NPCs/PartyZombie.cs): Shows an NPC that is "resistant" to a specific damage class, taking less damage
* [ExampleAdvancedFlailProjectile](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Projectiles/ExampleAdvancedFlailProjectile.cs): Shows ModifyDamageScaling replacement, as well as proper usage of various `HitModifiers` fields and properties to scale damage and knockback dynamically.
* [ExamplePaperAirplaneProjectile](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Projectiles/ExamplePaperAirplaneProjectile.cs): Shows a projectile dealing bonus damage to an npc that is weak to it.

tModPorter will be able to convert the hook signatures, but you will need to read the Porting Notes (in particular the FAQ), to figure out how to convert old damage modification code into the new system.

**Porting Notes:**    
Too many to write here, please read the PR descriptions if you have questions after running tModPorter.

### Shop Changes (aka Declarative Shops)
[PR 3219](https://github.com/tModLoader/tModLoader/pull/3219) has changed how NPC shops are done.

**Short Summary:**    
* NPC shops are now declarative, meaning they get registered, and items can be added to them with conditions, similarly to NPC drops (loot) and recipes    
* Adding items to shops, or hiding items from shops is now as easy as adding or disabling recipes    
* Info mods can traverse the NPCShopDatabase to show how to obtain an item. All the conditions for items appearing in shops have been localized.    
* Registering multiple shops per NPC is perfectly fine, and selecting the shop to be opened when chatting can now be done via the ref string shop parameter in OnChatButtonClicked

**Porting Notes:**    
* `ModPylon.IsPylonForSale` has been replaced by `ModPylon.GetNPCShopEntry`. Please see the documentation and [ExamplePylonTile](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Tiles/ExamplePylonTile.cs)    
* `Mod/GlobalNPC.SetupShop` is now `ModifyActiveShop`. This hook still exists to allow for custom shop modification, but you should consider moving to the new `ModNPC.AddShops` and `GlobalNPC.ModifyShop` hooks    
* The `Item[]` in `ModifyActiveShop` will now contain null entries. This distinguishes slots which have not been filled, from slots which are intentionally left empty (as in the case of DD2 Bartender)    
* Please take a look at the changes to Example Mod in the PR to more easily understand the new system.    

### Tile Drop Changes
[PR 3210](https://github.com/tModLoader/tModLoader/pull/3210) has changed how tiles drop items.

**Short Summary:**    
* Tiles and walls now automatically drop the items that place it. This process supports tiles with multiple styles.
* Block Swap feature now supports modded torches, chests, and drawers. 
* Other miscellaneous fixes. 

**Porting Notes:**    
* The vast majority of `ModTile.KillMultitile` code and `ModTile.Drop` code can be deleted or simplified by following the porting notes.
* All mods with any `ModTile` must follow the porting notes, failure to adjust your code for this major change will result in duplicate drops.
* There are too many changes to write here. Please read the Porting Notes section in the [Pull Request](https://github.com/tModLoader/tModLoader/pull/3210) after running tModPorter.

### Improve Player.clientClone performance
[PR 3174](https://github.com/tModLoader/tModLoader/pull/3174) has added new approaches to `Player.clientClone` to improve performance.

**Short Summary:**   
`Item.Clone` can become very performance expensive with many mods. Only type, stack and prefix are required to tell if an item has changed in the inventory and needs to be re-synced.

This PR replaces usages of `Item.Clone` in `Player.clientClone` with `Item.CopyNetStateTo`. Additionally, a single Player (and `ModPlayer`) instance is reused for all `clientClone`/`CopyClientState` calls, acting as a 'storage copy' rather than making a new one each frame.

Please note that tModPorter is not smart enough to identify `Item.Clone` usages in `ModPlayer.CopyClientState` calls automatically. You will need to replace these yourself or an exception will be thrown at runtime.

**Porting Notes:**    
* `ModPlayer.clientClone` -> `ModPlayer.CopyClientState`
* Use `Item.CopyNetStateTo` instead of `Item.Clone` in `ModPlayer.CopyClientState`
* Use `Item.IsNetStateDifferent` instead of `Item.IsNotSameTypePrefixAndStack` in `ModPlayer.SendClientChanges`
* Item instances altered by `CopyNetStateTo` are not initialized! Do not attempt to read properties or retrieve `ModItem` or `GlobalItem` instances from them! The only valid operation on an `Item` which was updated with `CopyNetStateTo` is `IsNetStateDifferent`

[HoldStyleShowcase](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/HoldStyleShowcase.cs), [HitModifiersShowcase](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/Weapons/HitModifiersShowcase.cs), and [UseStyleShowcase](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/UseStyleShowcase.cs) briefly show usage of `Item.NetStateChanged();` to trigger an item to sync.

### Max Health and Mana Manipulation API
[PR 2909](https://github.com/tModLoader/tModLoader/pull/2909) greatly changed the API for modifying the player's max health and mana, rendering custom sprites over the player's hearts and mana stars and even added an API for creating custom display sets.

**Short Summary:**
* Adds `ModPlayer.ModifyMaxStats` with `StatModifier` arguments for permanent adjustments to max health/mana
  * While this hook is intended to be used for permanent stat adjustments, it can also easily support temporary adjustments as well
  * However, do note that this hook runs very early in the player update logic.  It runs shortly after `ModPlayer.ResetEffects`
    * Temporary adjustments that rely on buffs or other player variables affected by armor, accessories, etc. should still use the old method of modifying `Player.statLifeMax2` in one of the update hooks in `ModPlayer`
* Adds `Player.ConsumedLifeCrystals`, `ConsumedLifeFruit` and `ConsumedManaCrystals` properties
  * These properties are directly tied to the vanilla stat increases and can also be manually set by modders
* Adds helper methods `Player.UseHealthMaxIncreasingItem` and `Player.UseManaMaxIncreasingItem` for displaying the visual effects
* Adds `ModResourceDisplaySet` allowing for custom life/mana draw styles (similar to boss bar styles) that can be selected in settings
* Adds `ModResourceOverlay` to allow for drawing custom hearts/mana/effects over the vanilla (or modded) life/mana UI elements

ExampleMod contains examples for a [custom display set](https://github.com/tModLoader/tModLoader/tree/1.4.4/ExampleMod/Common/UI/ExampleDisplaySets) and [custom resource overlays](https://github.com/tModLoader/tModLoader/tree/1.4.4/ExampleMod/Common/UI/ResourceOverlay).

[ExampleStatIncreasePlayer](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Common/Players/ExampleStatIncreasePlayer.cs), [ExampleLifeFruit](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/Consumables/ExampleLifeFruit.cs) and [ExampleManaCrystal](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Items/Consumables/ExampleManaCrystal.cs) showcase how to handle permanent stat increases.

**Porting Notes:**
* Refer to `ExampleStatIncreasePlayer`, `ExampleLifeFruit` and `ExampleManaCrystal` on how to properly set permanent stat increases
* Temporary stat increases to `Player.statLifeMax2` and `Player.statManaMax2` can still be performed as usual
  * Though they should not be changed in `ModPlayer.ModifyMaxStats`, since that runs too early for the changes to be kept
* Use `Player.ConsumedLifeCrystals`, `Player.ConsumedLifeFruit` and `Player.ConsumedManaCrystals` instead of checking `Player.statLifeMax` or `Player.statManaMax` due to the stat fields being adjustable by mods

## Smaller Changes
### [PR 3063](https://github.com/tModLoader/tModLoader/pull/3063): Fix Quick Heal and Quick Mana consuming non-consumables
**Short Summary:** Adds `item.consumable` as a check in Quick Heal and Quick Mana.     
**Porting Notes:** For Quick heal, Quick Mana non-consummables, it is recommended to use `Item.consumable` field instead of overriding `ConsumeItem()`

### [PR 3360](https://github.com/tModLoader/tModLoader/pull/3360): Add ModSystem.ClearWorld
**Short Summary:** Adds ModSystem.ClearWorld which runs on world clear. The new best place to clear/initialize world related data structures.    
**Porting Notes:** Consider replacing overrides of `OnWorldLoad` with `ClearWorld` to reset world related data. Generally no need to override `OnWorldUnload` anymore. Use Unload if you want to fully clean up all memory, but empty lists are nothing to worry about.

### [PR 3341](https://github.com/tModLoader/tModLoader/pull/3341): Unify Localized Conditions
**Short Summary:** `Terraria.Recipe.Condition` has been moved to `Terraria.Condition` and can now be applied to more things. Recipes, item variants, drops and shops. Added `SimpleItemDropRuleCondition` class to help make drop conditions more easily.    
**Porting Notes:** `Terraria.Recipe.Condition` -> `Terraria.Condition` (tModPorter). `Recipe` parameter removed from condition delegate, since it was almost always unused. Custom conditions will have to change from `_ => calculation` or `recipe => calculation` to `() => calculation`

### [Commit 56f6657](https://github.com/tModLoader/tModLoader/commit/56f66570219a66095120e64e7f0640d6ba0a6999): Change HookGen Namespace Style
**Short Summary:**     
* Hookgen namespaces (`IL.` and `On.`) have been removed in favor of `On_` and `IL_` prepended to the type name.
* No longer will you get 3 different namespace suggestions when you use VS to import a Terraria type name.
* Want On Item hooks? Just use `On_Item` it's in the same namespace as `Item`!    

**Porting Notes:**     
* `On.Terraria.Player` -> `Terraria.On_Player`
* `IL.Terraria.Player` -> `Terraria.IL_Player`
* As usual, tModPorter can convert your old code automatically.

### [PR 3242](https://github.com/tModLoader/tModLoader/pull/3242): Default Research Unlock Value changed to 1
**Short Summary:**     
* All items will now default to needing 1 item to research. 
* The previous value of 0 left items unresearchable since many modders don't bother to implement journey mode features
* Modders can clean up their code:
  * `ModItem.SacrificeTotal` has been removed and tModPorter should have changed it to `Item.ResearchUnlockCount` already.
  * `CreativeItemSacrificesCatalog.Instance.SacrificeCountNeededByItemId[Type] = #;` lines can be changed to `Item.ResearchUnlockCount = #;`
  * `ModItem`s with `Item.ResearchUnlockCount = 1;` or `CreativeItemSacrificesCatalog.Instance.SacrificeCountNeededByItemId[Type] = 1;` lines can be deleted, since the default is 1.

**Porting Notes:**    
* This is almost entirely optional. The only thing is `ModItem`s that should never exist in the inventory, or should otherwise not be researchable, now need `Item.ResearchUnlockCount = 0;` added where previously, they would be unsearchable by default. (Note: `CreativeItemSacrificesCatalog.Instance.SacrificeCountNeededByItemId[Type] = 0;` will result in bugs, use `Item.ResearchUnlockCount = 0;`)
* Modders might consider using this opportunity to add research values matching vanilla values to their `ModItem`: [Journey Mode Research wiki page](https://terraria.wiki.gg/wiki/Journey_Mode#Research).


