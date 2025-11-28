The number one rule of collaborative development is _pick a style and stick to it_. The following style guidelines should apply to all future contributions to tModLoader. 

Please be mindful of past developers and don't reformat code just for the sake of it. Reformatting PRs will only be considered when there is an active need for change in the associated piece of code.

The following are useful resources for general C# design and style
* https://google.github.io/styleguide/csharp-style.html
* https://docs.microsoft.com/en-us/dotnet/standard/design-guidelines/
* https://github.com/ktaranov/naming-convention/blob/master/C%23%20Coding%20Standards%20and%20Naming%20Conventions.md

If something is not listed in this guide, use your best judgement to pick between matching existing code and the advice listed above.

## Identifier Names
Use `camelCase` for
* local variables
* method parameters
* private fields

Use `PascalCase` for everything else.

> _**Why: With the exception of method parameters, camelCase indicates a variable that is not part of any public APIs.**_

Use `_camelCase` for 'backing fields' on properties. Private fields may also optionally be prefixed with an _.

> _**Why: `_` indicates the field is an implementation detail of specific members, and not key to the overall function of the class.**_

Use properties instead of fields for classes (and structures that contain logic). Structures that do not contain logic and are only used as data should use fields.

> _**Why: API implementation details may change in the far future. Using properties and auto-properties allows getters and setters to be altered or added without forcing a recompile of dependencies. The JIT is very efficient at inlining auto-properties so there is little performance concern in Release mode. Because properties cannot be used with `ref` variables, simple data `struct`s should use fields instead. Terraria itself rarely uses properties. Microsoft guidelines recommend avoiding public fields entirely.**_

## Braces
Use [K&R Style](https://en.wikipedia.org/wiki/Indentation_style#K&R_style). Braces on the same line for statements, method and property declarations. New line for all other declarations. This is mostly enforced by .editorconfig

Braces may be omitted on _single_ line `if/else/using` statements. For example:
```cs
if (canRestoreFlag) {
    for (int k = 0; k < canRestore.Count; k++) {
        if (canRestore[k] > 0)
            infos[k] = null;
    }
}
```

The following is **forbidden**

```cs
if (canRestoreFlag) // Body spans multiple lines
    for (int k = 0; k < canRestore.Count; k++) // Braces required on for loops
        if (canRestore[k] > 0) // Ok
            infos[k] = null;
```

**Do not** mix and match missing braces
```cs
if (ConfigManager.AnyModNeedsReload()) // Forbidden. Must have braces to match `else`
	needsReload = true;
else {
	foreach (NetConfig pendingConfig in pendingConfigs)
		ConfigManager.GetConfig(pendingConfig).OnChanged();
}
```

**Exception**: ExampleMod contributions; _single_ line statements and method bodies should receive braces. Only properties (i.e. `bool SomeProperty => true;`) can be kept as defined above.

_**Why: Balance between good visual separation and keeping code on-screen when Terraria is full of small control flow statements.**_

### File Scoped Namespaces
[File Scoped Namespaces](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-10.0/file-scoped-namespaces) is a relatively new C# language feature. As such, we will hold off on using it in learning resources until it's usage becomes more widespread. We use it in tModLoader, but do **not** use it in ExampleMod. 

## Comments
Short comments about a single line should go on the same line.
```cs
public override void SetDefaults() {
	item.damage = 12; // The damage for projectiles isn't actually 12, it actually is the damage combined with the projectile and the item together.
	item.DamageType = DamageClass.Ranged;
	...
}
```
**Do not** use block comments. Use multiple line comments instead
```cs
public override bool GetDefaultVisiblity(PlayerDrawSet drawInfo) {
	// The layer will be visible only if the player is holding an ExampleItem in their hands. Or if another modder forces this layer to be visible.
	return drawInfo.drawPlayer.HeldItem?.type == ModContent.ItemType<ExampleItem>();

	// If you'd like to reference another PlayerDrawLayer's visibility,
	// you can do so by getting its instance via ModContent.GetInstance<OtherDrawLayer>(), and calling GetDefaultVisiblity on it
}
```

## Member Order
Follow the general order: inner classes, static members, fields, properties, constructors, methods. Group fields and methods by function. Start with the largest/most used features and end with the smallest.

```cs
public class TmodFile : IEnumerable<TmodFile.FileEntry>
{
	public class FileEntry
	{
		...
	}

	public const float CompressionTradeoff = 0.9f;

	private static string Sanitize(string path) => path.Replace('\\', '/');

	public readonly string path;

	private FileStream fileStream;
	private IDictionary<string, FileEntry> files = new Dictionary<string, FileEntry>();
	private FileEntry[] fileTable;

	...
	
	private bool? _validModBrowserSignature;
	internal bool ValidModBrowserSignature {
		get { ... }
	}

	internal TmodFile(string path, string name = null, Version version = null) { ... }

	public bool HasFile(string fileName) {...}
	public byte[] GetBytes(FileEntry entry) {...}
	public byte[] GetBytes(string fileName) {...}
	
	...
	
	internal void AddFile(string fileName, byte[] data) {...}
	internal void RemoveFile(string fileName) {...}
	
	...
}
```

Backing fields may be declared right before the corresponding properties.
```cs
private readonly List<PlayerDrawLayer> _childrenBefore = new List<PlayerDrawLayer>();
public IReadOnlyList<PlayerDrawLayer> ChildrenBefore => _childrenBefore;

private readonly List<PlayerDrawLayer> _childrenAfter = new List<PlayerDrawLayer>();
public IReadOnlyList<PlayerDrawLayer> ChildrenAfter => _childrenAfter;
```

Supporting 'lookup fields' can go with the methods they serve.
```cs
private static readonly char[] nameSplitters = new char[] { '/', ' ', ':' };
public static void SplitName(string name, out string domain, out string subName) {
	int slash = name.IndexOfAny(nameSplitters); // slash is the canonical splitter, but we'll accept space and colon for backwards compatability, just in case
	if (slash < 0)
		throw new MissingResourceException("Missing mod qualifier: " + name);

	domain = name.Substring(0, slash);
	subName = name.Substring(slash + 1);
}
```

## Method Length
Keep methods short. When a method has multiple 'parts' consider splitting them into multiple smaller methods (and make them `static`/pure if possible). 

> _**Why: Good method names can take the place of comments which can rot over time. Method arguments and return values clearly show the flow of data between parts of a larger method. Smaller methods reduce the mental load for a reader, and reduce the programming errors by limiting the number of variables in scope.**_

## Control Flow Nesting
Try to avoid more than 3 levels of control flow nesting within a method. Avoid having `else` statements at the end of a long `if` block. Handle errors early, fail fast, and `return` rather than creating long `else if` chains. 

> _**Why: Improved readability. Highly nested control flow is easy to get lost in. Guard statements make the method easier to read by eliminating errors and cases from the implementation further down. See https://en.wikipedia.org/wiki/Guard_(computer_science)**_

## Visual Newlines
Use blank lines to break up long methods into logical blocks. Always put a blank line after any indented statement if the method continues. Do not put a space between every field or every line.
```cs
internal void AddFile(string fileName, byte[] data) {
	fileName = Sanitize(fileName);
	int size = data.Length;

	if (size > MIN_COMPRESS_SIZE && ShouldCompress(fileName)) {
		using (var ms = new MemoryStream(data.Length)) {
			using (var ds = new DeflateStream(ms, CompressionMode.Compress))
				ds.Write(data, 0, data.Length);

			var compressed = ms.ToArray();
			if (compressed.Length < size * COMPRESSION_TRADEOFF)
				data = compressed;
		}
	}

	lock (files) {
		files[fileName] = new FileEntry(fileName, -1, size, data.Length, data);
	}

	fileTable = null;
}
```

## Cast instead of using `as`

If the cast is meant to succeed, `ClassCastException` is more informative and will be thrown at a more useful line number than a corresponding `NullReferenceException` from `as`. 

For safe type checking, use pattern matching instead of `as` with a `!= null` check. 

```cs
var exampleItem = (ExampleItem)item.ModItem;

// with pattern matching
if (item.ModItem is ExampleItem exampleItem) {
    ...
}
```

❌ Avoid
```cs
var exampleItem = item.ModItem as ExampleItem;
if (exampleItem != null) {
    ...
}
```

## Comment out vanilla code, rather than removing it
Use `/*` and `*/` to comment multiple lines. They should each be on their own lines.
```cs
else if (buffType[j] == 117) {
	allDamage += 0.1f;
	/*
	meleeDamage += 0.1f;
	rangedDamage += 0.1f;
	magicDamage += 0.1f;
	minionDamage += 0.1f;
	*/
}
```

When modifying a single line. Leave a commented version of the vanilla code **only when** it is not obvious what has been added by tML and what is vanilla.

Also use a hashtag when multiple changes are part of the same fix/feature/refactor
```cs
//if (item.maxStack == 1 && item.Prefix(-3))
if (item.IsCandidateForReforge && item.Prefix(-3)) // TML: #StackablePrefixWeapons


//if (stack <= 0)
if (stack <= 0 && mouseItem.maxStack == 1) // TML: #StackablePrefixWeapons: Gameplay impact: stackable items will not get a prefix on craft


// TML attempts to make ApplyItemTime calls run on remote players, so this check is removed. #ItemTimeOnAllClients
// if (whoAmI == Main.myPlayer) {
if (true) {
	...
}
```

❌ Unnecessary comment
```cs
//if (Main.mouseItem.IsTheSameAs(inv[slot])) {
if (Main.mouseItem.IsTheSameAs(inv[slot]) && ItemLoader.CanStack(inv[slot], Main.mouseItem)) {
```


## Keep Patches Small
The source code of Terraria is not stored on git, instead tML changes are stored in .patch files in the patches/ directory. Keeping patches as small as possible makes handling Terraria updates and identifying the exact changes tML requires much easier. 

Use return/continue or goto to avoid changing indentation. **Only when 5+ lines would be indented**
```cs
if (!WallLoader.PreDraw(j, i, wall, spriteBatch))
	goto PostDraw;

...

PostDraw:
WallLoader.PostDraw(j, i, wall, spriteBatch);
```

```cs
private bool ItemCheck_CheckCanUse(Item sItem) {
	if(!CombinedHooks.CanUseItem(this, sItem))
		return false;

	...
}
```

Wrap a method to insert a hook at the end of a method with multiple return statements
```cs
public void HitEffect(int hitDirection = 0, double dmg = 10.0) {
	VanillaHitEffect(hitDirection, dmg);
	NPCLoader.PostHitEffect(this, hitDirection, dmg);
}

public void VanillaHitEffect(int hitDirection = 0, double dmg = 10.0) {
	if (!active)
		return;
	
	if (...) {
		return;
	}
	
	...
}
```

Always check your patches when committing and see if there's a way to minimize them.

## Be Aware of Breaking Changes
Some changes made to the tModLoader source code will cause issues for modders and players once they become part of an official release. For example, renaming a field used by mods will cause those mods to break when tModLoader updates. Because of this, we have various strategies for maintaining compatibility. Breaking changes come in 2 varieties, binary incompatibilities and source incompatibilities. When a change results in a binary incompatibility, mods built on an earlier version will either not load or not work properly. When a change results in a source incompatibility, the modder will have to change code the next time they build the mod, but the mod will continue to function otherwise.

The lengths we go to preserve compatibility and maintain functionality depends on how stable the release should be. Usually, this depends on updates to the vanilla game. Breaking changes in tModLoader are much more likely while it is still catching up to a vanilla update. If there hasn't been a big Terraria update in a while, tModLoader will attempt to make previously built mods work properly when introducing new features or bug fixes.

### New Hook
Adding a new hook is no issue.

### Adding a parameter to a hook
If `public virtual void SomeHook()` becomes `public virtual void SomeHook(int someParameter)`, mods using the old approach will find that their mod is limited in functionality since the old method is no longer being called. To preserve compatibility, sometimes we keep the old method and mark it as `Obsolete`

```cs
// New hook in ModItem.cs
public virtual void PickAmmo(Item weapon, Player player, ref int type, ref float speed, ref int damage, ref float knockback) {
}

// Old hook in ModItem.cs
[Obsolete("PickAmmo now has a weapon parameter that represents the item using the ammo.")]
public virtual void PickAmmo(Player player, ref int type, ref float speed, ref int damage, ref float knockback) {
}

// Calling site in ItemLoader.cs
public static void PickAmmo(Item weapon, Item ammo, Player player, ref int type, ref float speed, ref int damage, ref float knockback) {
	ammo.modItem?.PickAmmo(weapon, player, ref type, ref speed, ref damage, ref knockback);
	ammo.modItem?.PickAmmo(player, ref type, ref speed, ref damage, ref knockback); // deprecated

```


### Changing a return type
Changing a return type causes incompatibilities. TODO, more info.

### Adding a parameter to a vanilla method
We don't usually do this since it will break compatibility. Instead, we add a new overload and mark the current method as `Obsolete`. See below.

### Adding an overload to a vanilla method
When we add an overload to a vanilla method, this is usually because we need to add a new parameter to pass in additional context. If the intention is for all modders to use the new method, we mark the original method as `Obsolete` and make the original method a forwarder with some default value for the new parameters. 

If there was previously only one overload for a method, we also need to make sure to mark the original method with `[OriginalOverload]` to preserve MonoMod compatibility. (This is because the existing events have their parameters omitted from the event if they are the only overload, which will no longer be true.) The [Added PressurePlate set, HitSwitch and SwitchTiles hooks](https://github.com/tModLoader/tModLoader/pull/4774/files#top)](https://github.com/tModLoader/tModLoader/pull/4774/files) PR is an example of this, see how the original `Collision.SwitchTiles` method has been changed. See the [Preserve backwards compatibility for MonoMod hooks](https://github.com/tModLoader/tModLoader/pull/4795) PR for information on this process.

### Examples
- [Rename ModProjectile.Kill to ModProjectile.OnKill](https://github.com/tModLoader/tModLoader/pull/3770) - This example shows a typical hook renaming situation. We want the mods built to continue working, but want to move mods being built to the new approach immediately The old hook is set as `Obsolete` and the new hook is added with the new name. The PR makes sure to call the old hook to keep existing behavior. Note how `ProjectileLoader.Kill_Obsolete` is set as `Obsolete` while `ModProjectile.Kill` is set as `Obsolete` and flagged as a compile error. An `Obsolete` method can call a compile error flagged `Obsolete` method by design. `tModPorter` is used as well. The code ports to the new method name using `RenameMethod`, applies changes to ExampleMod, and has tests to verify their effect.
- [GlobalInfoDisplay.ModifyDisplayParameters refactor](https://github.com/tModLoader/tModLoader/commit/3ca9bf16a3722c35ea86377b7a28f4456b072743) - This example shows making several methods obsolete and replacing with a new combined method. This example showcases using tModPorter to both rename methods and change their signatures: `RenameMethod` and `ChangeHookSignature` 
- [Add parameter to InforDisplay.DisplayValue method](https://github.com/tModLoader/tModLoader/pull/3604) - This example showcases using `tModPorter`'s `ChangeHookSignature` to change a hook signature. This example doesn't preserve compatibility, which is fine in this case because the usage of the hook is so rare. 