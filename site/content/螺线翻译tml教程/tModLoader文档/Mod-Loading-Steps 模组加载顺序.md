The following page lists the order in which tModLoader loads mods and their content.

This page may become outdated if tModLoader updates. As such, every section of this page will contain a link to the file(s) the information came from.
Additionally, this page is not comprehensive. Your best resource for a specific load-time issue is looking around in tModLoader's source yourself, specifically [`ModContent::Load()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ModContent.cs#L289).

## tl;dr
The most important load order steps.

1. Call `Mod` subclass constructor.
2. Load mod configs (if content autoloading enabled).
3. Load mod content (if content autoloading enabled). This also calls `ILoadable::Load()` on all autoloaded content.
4. Load gores, music, backgrounds, clouds (if respective autoloading enabled).
5. Call `Mod::Load()`, then `ModSystem::OnModLoad()`.
6. Call `ModType::SetupContent()` (and by extension, `ModType::SetStaticDefaults())`.
7. Initialize `ContentSamples`.
8. Call `Mod::PostSetupContent()`, then `ModSystem::PostSetupContent()`.
9. Set up the bestiary.
10. Set up NPC and item drop tables.
11. Set up recipes groups.
12. Add recipes.
13. Call `ModSystem::PostAddRecipes()`.
14. Call `ModSystem::PostSetupRecipes()`.

## Mod Load Order
Sources:
- [`Terraria.ModLoader.Core.ModOrganizer::SelectAndSortMods()`]( https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Core/ModOrganizer.cs#L341)
- [`Terraria.ModLoader.Core.BuildProperties::ReadBuildFile()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Core/BuildProperties.cs#L96)

See also:
- [build.txt](https://github.com/tModLoader/tModLoader/wiki/build.txt)

When tModLoader loads mods, it sorts them by internal name, and then resorts them such that the following conditions are satisfied for each mod MOD:
- MOD will load *before* any mod included in the `sortBefore` field of MOD's `build.txt`.
- MOD will load *after* any mod included in the `sortAfter` field of MOD's `build.txt`.
- MOD will load *after* any mod included in the `modReferences` or `weakReferences` fields of MOD's `build.txt` *as long as those mods aren't included in `sortBefore`*.

Before these conditions are fulfilled, mods are sorted by internal name. Do **NOT** rely on the initial name-based sorting: Mods may be moved around arbitrarily to fulfill the conditions above. If you need your mod to load before/after another mod, use `sortBefore`/`sortAfter`.

For an example, take the following `build.txt` snippet for the mod MOD:
```
modReferences = ModA
weakReferences = ModB
sortBefore = ModB, ModC
sortAfter = ModD
```
- MOD will load *before* `ModC` because it's included in `sortBefore`.
- MOD will load *before* `ModB` because it's included in `sortBefore`, even though `ModB` is *also* in `weakReferences`.
- MOD will load *after* `ModA` because it's included in `modReferences` *and* not in `sortBefore`.
- MOD will load *after* `ModD` because it's included in `sortAfter`.

As a special exception, tModLoader's internal `ModLoaderMod` (which handles unloaded content, among other things) is *always* loaded first, and is inserted into the mod load order after mods are [instantiated](#1-instantiation).

## Content Load Order
After mods are sorted, all mods are loaded.

Several steps happen _atomically_ using [`Terraria.ModLoader.ModContent::LoadModContent()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ModContent.cs#L398): All substeps are performed for one mod before moving onto the next mod. Steps that occur like this will be marked as such.

### Loadable Types
Sources:
- [`Terraria.ModLoader.Core.AssemblyManager::IsLoadable()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Core/AssemblyManager.cs#L344)

Several sections below mention "loadable" types.
A type is considered *loadable* if it passes the following checks:
1. If the type has the [`ExtendsFromMod`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ExtendsFromModAttribute.cs) attribute, it is considered *not* loadable if any of the mods listed in said attribute are not loaded.
2. If the type extends from a type that is *not* loadable, then it is also considered *not* loadable.
3. If a type is nested inside of a type that is *not* loadable, or if it is constructed from a generic type definition that is *not* loadable, then it is also considered *not* loadable.
4. If a type implements any interfaces that are *not* loadable, then it is also considered *not* loadable.
5. Passing all these checks, the type is considered loadable.

### 1. Instantiation
Sources:
- [`Terraria.ModLoader.Core.AssemblyManager::InstantiateMods()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Core/AssemblyManager.cs#L243)
- [`Terraria.ModLoader.Core.AssemblyManager::Instantiate()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Core/AssemblyManager.cs#L201)
- [`Terraria.ModLoader.Core.AssemblyManager::VerifyMod()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Core/AssemblyManager.cs#L224)

The first step is **instantiation**, wherein all enabled mods' assemblies are loaded into memory. This step happens _atomically_.

In order:
1. The mod is *verified*: The mod's assembly name must match its internal name, the mod must have at least one loadable type whose namespace begins with the internal name, and the mod must have at most one loadable subclass of [`Terraria.ModLoader.Mod`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Mod.cs).
2. An instance of the mod's `Mod` subclass (or of `Mod` if no subclass exists) is created.
3. The following fields on `Mod` are filled: `File`; `Code`; `Logger`; `Side`; `DisplayName`; `TModLoaderVersion`; `TranslationForMods`.

This step is where your `Mod` subclass's constructor is called, and is a good spot to assign any field on `Mod` that isn't autofilled in substep 3 (e.g. [`PreJITFilter`](#jitting), `ContentAutoLoadingEnabled`, etc.).

### 2. Content Loading and JITting
The next step is **content loading**, wherein all of a mod's content and systems load.
This is also the step in which the mod's assembly is **JITted**. These two steps happen at the same time: JITting begins before the first mod begins loading, and must finish before moving onto pre-setup.

#### Content Loading
Sources:
- [`Terraria.ModLoader.ModContent::Load()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ModContent.cs#L289)
- [`Terraria.ModLoader.ModType::Load()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ModType.cs#L27)

This step happens _atomically_.

In order:
1. `Mod::loading` is set to `true`, allowing content to be added to the mod.
2. The mod autoloads all loadable subclasses of [`Terraria.ModLoader.Config::ModConfig`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Config/ModConfig.cs) (ordered by internal name) that return `true` in [`ModConfig::Autoload()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Config/ModConfig.cs#L38).
3. The mod prepares to load assets by calling [`Mod::CreateDefaultContentSource()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Mod.Hooks.cs#L11).
4. The mod attempts to autoload all content:
	1. The mod loads all localization files and registers all found localization keys.
	2. All localization keys starting with `Mods.MODNAME.GameTips.` are added to the game tips list.
	3. `Mod::ModSourceBestiaryInfoElement` is auto-assigned.
	4. If `Mod::ContentAutoloadingEnabled` is `true`: Load all [autoloadable](#autoloadable-content) content by calling [`Mod::AddContent()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Mod.cs#L152) on a new instance of the content's type.
		- This is where [`ILoadable::IsLoadingEnabled()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ILoadable.cs) and `Load()` are called!
		- By extension, this is where `ModType::ValidateType()`, `InitTemplateInstance()`, `Load()`, and `Register()` are called (in that order).
	5. If not on a dedicated server: Load all asset-only gores, music, backgrounds, and clouds if `Mod::GoreAutoloadingEnabled`, `MusicAutoLoadingEnabled`, `BackgroundAutoloadingEnabled`, and `CloudAutoloadingEnabled` (respectively) are `true`.
5. [`Mod::Load()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Mod.Hooks.cs#L20) is called.
6. [`ModSystem::OnModLoad()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ModSystem.cs#L48) is called for every known `ModSystem` in the mod. **If you try to add a new `ModSystem` during this step, tModLoader won't call `OnModLoad()` on it!**
7. `Mod::loading` is set to `false`. **At this point, no more content can be added to a mod.**

#### Autoloadable Content
Sources:
- [`Terraria.ModLoader.Mod::Autoload()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Mod.Internals.cs#L45)

A type is *autoloadable* if:
- The type is loadable.
- The type implements the `ILoadable` interface (`ModType` does this, so any subclasses also do it).
- The type is not abstract.
- The type contains no unbound generic parameters (e.g. `public class MyItem<T> : ModItem` is *not* autoloadable).
- The type has a parameterless constructor (even if it's private).
- The type either doesn't have the [`Autoload` attribute](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/AutoloadAttribute.cs), or the attribute allows loading.

#### JITting
Sources:
- [`Terraria.ModLoader.Core.AssemblyManager::JITModAsync()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Core/AssemblyManager.cs#L369)
- [`Terraria.ModLoader.JITFilters`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/JITFilters.cs)

See also:
- [JIT Exception - Weak References](https://github.com/tModLoader/tModLoader/wiki/JIT-Exception#weak-references)
- [Expert Cross Mod Content - JIT Considerations](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content#jit-considerations)

JITting occurs on a set of *methods* from all of a mod's loadable types. Specifically, a method is JITted if all of the following conditions are true:
1. The method's containing type is [loadable](#loadable-types).
2. The method's containing type passes the mod's [`PreJITFilter`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Mod.cs#L104).
3. If the method's containing type is nested or generic, the parent type / generic type definition also must pass the mod's `PreJITFilter`.
4. The method must not be abstract, must not contain generic parameters, and must be declared on the type it is being JITted on (i.e. don't JIT a non-overridden virtual method on a subclass).

By default, a type or method passed a mod's `PreJITFilter` if all `MemberJit` attributes on that type/method return `true` in `MemberJitAttribute::ShouldJIT()`, or if the type/emthod has no `MemberJit` attributes. tModLoader provides the following subclasses of `MemberJITAttribute` for use:
- `NoJITAttribute`: Member is never JITted.
- `JITWhenModsEnabledAttribute`: Member is only JITted if the specified mods are also enabled.

Be aware that you can make your own subclasses of `PreJITFilter` and `MemberJITAttribute` if you need more control.

### 3. Before Setup
Sources:
- [`Terraria.ModLoader.ModContent::ResizeArrays()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ModContent.cs#L560)

Some steps are taken between loading content and setting it up. Namely:
1. All content arrays are resized. This includes all ID sets.
2. If the player was using a modded resource set, it is restored here.

### 4. Setup Content
Sources:
- [`Terraria.ModLoader.Mod::SetupContent()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Mod.Internals.cs#L23)

The next step is **setup**. This is an incredibly simple step: `ModType::SetupContent()` is called for every loaded `ModType` in the mod. In most cases, the `ModType` subclass will call `ModType::SetStaticDefaults()` here, alongside some extra work specific to each `ModType`. Check out each `ModType` if you need to see what specific extra work it does.

This step happens _atomically_.

### 5. Extra Setup
Some extra work done after `SetupContent()` is called, but before `PostSetupContent()`. In order:
1. `ContentSamples` is re-initialized. After this step, it will now contain all modded data, as well as any changes made to vanilla content in `SetDefaults()`.
	- `ContentSamples` loads NPC instances first, then projectiles, then items, then NPC bestiary rarity stars.
2. Some tile merging data is setup (see `Terraria.Main::SetupAllBlockMerge()` and `ModTile::PostSetupTileMerge()`\).
3. Mount-based buff data is setup (see `Terraria.Main::Initialize_BuffDataFromMountData()`\).

### 6. Post Setup Content
The final step performed on all mods is **post setup content**. This is the step often used for cross-mod compatibility. This step happens _atomically_.

In order:
1. [`Mod::PostSetupContent()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Mod.Hooks.cs#L27) is called.
2. `ModSystem::PostSetupContent()` is called for every known `ModSystem` in the mod.
3. All requested mod assets (`ModContent::Request<T>()`\) are loaded (see [`Mod::TransferAllAssets()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/Mod.Internals.cs#L88)).

### 7. Final Setup
Sources:
- [`Terraria.ModLoader.ModContent::SetupBestiary()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ModContent.cs#L420)
- [`Terraria.ModLoader.ModContent::SetupRecipes()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ModContent.cs#L445)
- [`Terraria.ModLoader.RecipeLoader::AddRecipes()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/RecipeLoader.cs#L39)

Many things happen after `PostSetupContent()` is called, including (in order):
1. Many `ModType`s have a "final setup" phase that is called here. This includes caching localized text, setting up globals, setting up hooks added by mods, etc.
2. `ModSystem::ModifyGameTipVisibility()` is called.
3. The bestiary is set up. This is where `NPCLoader::SetBestiary()` is called.
4. Item drop rules are set up. This is where `NPCLoader::ModifyGlobalLoot()`, `NPCLoader::ModifyNPCLoot()`, and `ItemLoader::ModifyItemLoot()` are called.
5. Recipes are set up. This is the "Adding recipes…" step in loading, and is where the following methods are called (in order): `Mod::AddRecipeGroups()`, `ModSystem::AddRecipeGroups()`, `Mod::AddRecipes()`, `ModSystem::AddRecipes()`, `ModItem::AddRecipes()`, `GlobalItem::AddRecipes()`, `Mod::PostAddRecipes()`, `ModSystem::PostAddRecipes()`, `ModSystem::PostSetupRecipes()`.
6. If the player was using a modded menu or boss bar style, it is restored.

The few steps above are only highlights; please see the end of `ModContent::Load()` for the full list.

## Final Notes
Once again, this guide may become outdated as tModLoader updates; the best way to check load order is to read through [`ModContent::Load()`](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/ModLoader/ModContent.cs#L289) yourself (preferably in an environment that lets you jump to method definitions).