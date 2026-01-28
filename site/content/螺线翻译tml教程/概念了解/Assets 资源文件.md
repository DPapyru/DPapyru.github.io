# Overview
In tModLoader, we use the `Asset` class to work with assets such as textures (`Texture2D`), shaders (`Effect`), fonts (`DynamicSpriteFont`), and sounds (`SoundEffect`). The `Asset` and `AssetRepository` classes provide on-demand (asynchronous) loading and resource pack support.

This guide shows how to work with the asset system for optimal performance and compatibility.

# General Guidelines
This section is a quick overview of various best practices. See the later sections for more details on each of these topics.    

### Store the Asset reference, not the contained data class
You should always be working with the `Asset` class directly up until the contained data needs to be used. For example, instead of storing a `Texture2D sprite` and calling `spriteBatch.Draw(sprite)`, store an `Asset<Texture2D> sprite` and call `spriteBatch.Draw(sprite.Value)`.

### Preload Textures
tModLoader will request and load textures for most modded content during mod loading. This preloading reduces the need to request textures on demand at the cost of loading time and RAM utilization. 
* These assets are usually accessible in arrays found in the `Terraria.GameContent` static classes, such as `TextureAssets`, if needed.
* If you have extra textures, such as special effects for an NPC or Projectile, you can request them in `SetStaticDefaults` or one of the other Load hooks.
* Vanilla doesn't preload all textures. For Item, NPC, Projectile, Background, and some other types of content unloaded Assets are populated into the fields of the `TextureAssets` class. Using these textures require first calling the respective `Main.instance.LoadX` method to ensure that they are loaded. Vanilla textures without a corresponding `Main.instance.LoadX` are most likely preloaded.

After `PostSetupContent`, tModLoader will make sure all requested assets for the mod are fully loaded, so there is no need to `.Wait()` for them during gameplay.
* This also means there is no need to use `AssetRequestMode.ImmediateLoad` when requesting textures during loading. Doing so will only slow down the load process dramatically.

If you don't want to preload extra assets, either because it's inconvenient or because you'd like to save RAM or load time, you can `Request` them on demand at any time during the game.
* It is still recommended to use `AssetRequestMode.AsyncLoad` when requesting assets in-game to avoid reducing frame-rate. 

### Avoid requesting assets every frame
You should strive to only request an asset once and then store the reference in a field for usage. It is more efficient to access the field than it is to call the `Request` method. This can be done during mod loading or on demand via a null check. For singleton classes, storing the asset in a instance field is sufficient. For classes with multiple instances such as `ModItem`, `ModProjectile`, and `ModNPC`, the asset will need to be stored in a static field and requested during `Load`. There is no need to set the reference to `null` in `Unload` or manually `Dispose` of the `Asset`.

### Avoid using `AssetRequestMode.ImmediateLoad`
Loading assets with `AssetRequestMode.ImmediateLoad` (or calling `.Wait()`) is inefficient and unnecessary in most situations. Read the sections below to learn when it might be needed. 

# Retrieving/Requesting Assets
The `ModContent.Request` method can be used to request any asset from any mod or Terraria, but there are other options that might slightly reduce code repetition. When using the `Request` method, the `Type` of the asset is passed in as a generic argument. For example, `ModContent.Request<Texture2D>(pathHere)` requests a texture (`Texture2D`) with the path specified. `ModContent.Request<Effect>(pathHere)` would do the same but for a shader (`Effect`) asset.

## Assets contained in the Mod
To load an asset contained in the current mod, simply call the `Assets.Request` method on the `Mod` class. Any `ModType` class will have access to the `Mod` instance via the `Mod` property, so `Mod.Assets.Request` would be written. Other classes not inheriting from `ModType` can use `ModContent.GetInstance<ModClass>()` to access the `Mod` instance. Alternatively, the `ModContent.Request` method can be used if the modder provides the `ModName` as part of the asset path. 

Requesting an asset during mod loading, such as in a `ModType.Load` or `SetStaticDefaults` method, is a good idea as it will cause errors to be thrown right away rather than during gameplay. This allows the mod maker to fix typos and other asset related errors more quickly.

```cs
public class ExampleHookProjectile : ModProjectile {
	private static Asset<Texture2D> chainTexture;

	public override void Load() {
		// Option 1: Load the asset directly from the Mod class. Mod name is NOT part of the asset path.
		chainTexture = Mod.Assets.Request<Texture2D>("Content/Items/Tools/ExampleHookChain");
		// Option 2: Load the asset directly from the Mod class retrieved via ModContent.GetInstance. ModName is NOT part of the asset path.
		chainTexture = ModContent.GetInstance<ExampleMod>().Assets.Request<Texture2D>("Content/Items/Tools/ExampleHookChain");
		// Option 3: Load the asset using ModContent.Request. ModName must be at the start of the asset path.
		chainTexture = ModContent.Request<Texture2D>("ExampleMod/Content/Items/Tools/ExampleHookChain");
	}
}
```

## Assets from Terraria or other mods
Loading assets from other mods or Terraria is the same process as loading from your own mod, it just requires retrieving the Mod instance or adding the mod name to `ModContent.Request` calls. It is usually simplest to just type out the full path for `ModContent.Request` rather than deal with accessing the `Mod` classes of other mods. For Terraria assets, `Terraria/` will be added to the path. Note that Terraria assets follow their path from the Contents folder in the install directory. 

Also note that most Terraria textures are already loaded into the `Terraria.GameContent.TextureAssets` class and can be used directly rather than loading a separate `Asset`. Many of these require calling special methods such as `Main.LoadItem` or `Main.LoadNPC` to fully load, however, as they might not yet be loaded.

```cs
public class AssetTest : ILoadable
{
	private static Asset<Texture2D> moddedTexture;
	private static Asset<Texture2D> terrariaTexture;

	void ILoadable.Load(Mod mod) {
		moddedTexture = ModContent.Request<Texture2D>("ExampleMod/Content/SomeTexture");
		moddedTexture = ModContent.GetInstance<ExampleMod>().Assets.Request<Texture2D>("Content/SomeTexture");

		terrariaTexture = Main.Assets.Request<Texture2D>("Images/UI/Settings_Toggle");
		terrariaTexture = ModContent.Request<Texture2D>("Images/UI/Settings_Toggle");
	}
}
```

# Asset Load Timing
Mods can load additional assets in 2 ways, during mod loading or on demand. It is recommended to load additional assets during mod loading.

Assets loaded during mod loading will be fully loaded by the end of the mod loading process, ensuring that they are available to use immediately when needed in-game. The asset loading process will also cause the mod to fail to load if any asset fails to load. This will allow modders to quickly notice typos or formatting issues that would otherwise only appear as error messages in the in-game chat. 

Assets loaded on demand in-game have the benefit of not being in RAM unless needed. They will never unload during a game session, but for some content it might be useful to only load assets when needed. Assets loaded on demand might require a little more effort by the modder to account for the asset load state.

## Preloading Assets
The most common approach would be to have a `Asset<T>` field in a `ModType` or `ILoadable` and to request the asset in `Load` or `SetStaticDefaults`. The field storing the `Asset` will need to be `static` for content that creates multiple instances of the same class, such as with `ModItem`, `ModProjectile`, and `ModNPC`. In either case there is no need to set the Asset reference to `null` in `Unload` or manually `Dispose` of the Asset.

```cs
public class ExampleHookProjectile : ModProjectile
{
	private static Asset<Texture2D> chainTexture;

	public override void Load() {
		chainTexture = Mod.Assets.Request<Texture2D>("Content/Items/Tools/ExampleHookChain");
	}
}
```

## On-Demand Asset Loading
When loading an asset on demand, modders should try to call `Request` once and store the resulting `Asset` in a field. This can be done with a null check.

```cs
public class ExamplePlayerDrawLayer : PlayerDrawLayer
{
	private Asset<Texture2D> exampleItemTexture;

	protected override void Draw(ref PlayerDrawSet drawInfo) {
		// Option A: Regular null check approach
		if (exampleItemTexture == null) {
			exampleItemTexture = Mod.Assets.Request<Texture2D>("Content/Items/ExampleItem");
		}
		// Option B: null-coalescing assignment operator approach
		exampleItemTexture ??= Mod.Assets.Request<Texture2D>("Content/Items/ExampleItem");
		
		// other code
		drawInfo.DrawDataCache.Add(new DrawData(
			exampleItemTexture.Value,
			// other code
		));
	}
}
```

As an alternative to the `if (texture == null)` check, modders can use `exampleItemTexture ??= Mod.Assets.Request<Texture2D>("Content/Items/ExampleItem");` if they are familiar with the [null-coalescing assignment operator](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/null-coalescing-operator) syntax.

## Server Considerations
Modders should remember that the server does not load any assets. Most hooks that would deal with assets are not called on the server. Requesting assets on the server will return a dummy `Asset` with a `null` `Value`. There is no need to gate code attempting to load assets with checks for `!Main.dedServ`.

# AssetRequestMode
The default request mode is `AsyncLoad`. Any assets requested during mod loading will be loaded completely by the time mod loading has completed. Asynchronous loading allows multiple assets to be loaded in parallel in the background, while the game continues to load mods or update/draw frames. 

Assets requested asynchronously during gameplay will take at least one frame to load, but potentially multiple frames if the asset is large or many assets are requested simultaneously. `Asset<Texture2D>` contains a `DefaultValue` with a transparent 1x1 texture that will be returned from `Asset.Value` while the asset is still loading. This allows mods to use the `Value` in rendering without needing to check whether the asset has finished loading yet.

> [!NOTE]
> As a demonstration, here is a mod loading hundreds of item textures during gameplay. When using `AsyncLoad`, the scrolling is smooth and item textures appear as they are loading. When using `ImmediateLoad` the scrolling is interrupted and the frame rate of the game suffers as the game spends time waiting for textures to load. This is an extreme example as it is loading hundreds of item textures at once, for normal modded content the textures loading in will be much less noticeable. 
>
> https://github.com/tModLoader/tModLoader/assets/4522492/ca66b2d0-37cc-4c0f-a565-1b2c5d384991

There are situations where an asset might need to be loaded immediately. The most common situation is when the dimensions of the texture are required for UI layout (such as in the `UIElement`/`UIState` classes). If the element is initialized with an asset which hasn't finished loading, the dimensions of the temporary transparent 1x1 texture will be used and the resulting user interface will be incorrectly laid out. It is recommended to load the texture asynchronously during mod loading, and initialize the `UIState` later, but `AssetRequestMode.ImmediateLoad` can be passed to `Request` or `Asset.Wait()` can be called to ensure the asset is loaded.

```cs
Asset<Texture2D> buttonTexture = ModContent.Request<Texture2D>("ExampleMod/UI/Button", AssetRequestMode.ImmediateLoad);
UIImageButton button = new UIImageButton(buttonTexture);
```

Modders should not use `AssetRequestMode.DoNotLoad` and instead follow the on-demand loading advice above. Terraria uses `DoNotLoad` to populate the `Terraria.GameContent.TextureAssets` fields with `Asset<Texture2D>` entries that will be loaded only when needed. This necessitates helper methods which check whether the asset is loaded and re-request it such as `Main.LoadItem/LoadNPC/LoadProjectile`.

# Other Asset Methods
### Asset.IsLoaded
Use `Asset.IsLoaded` to check if the asset has finished loading.

### Asset<Texture2D>.Size()
This helper method is a bit shorter than calling `Asset.Value.Size()` and will return `Vector2.Zero` for assets which have not yet been fully loaded.

### Asset.Wait()
The `Asset.Wait()` method can be used to force a texture previously requested to load immediately. 

### Creating Asset from bytes (AssetRepository.CreateUntracked)
Some mods need to generate assets from other sources, like loading icons from a web-service. Modders can use the `AssetRepository.CreateUntracked` method to create an `Asset` from a `Stream` containing a `png/xnb/fxc/ogg/wav` etc directly. The resulting `Asset` is "untracked" in the sense that it can not be retrieved by name via `Request`.

### Vanilla Code Adaption Considerations
If you copy code from Terraria that uses `AssetRepository.Request`, you might notice that the vanilla code behaves as if the asset is loaded immediately, even though the default request mode is `AsyncLoad`. This is because there is a special `internal` overload of `AssetRepository.Request` which uses `ImmediateLoad` by default that keeps the vanilla code working, while we changed the default for modders and `ModContent.Request`.