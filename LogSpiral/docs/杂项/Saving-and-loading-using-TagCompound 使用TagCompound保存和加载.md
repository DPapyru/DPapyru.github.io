***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Saving-and-loading-using-TagCompound/a03f9a9c9530ff209853233efd9e6dbbfea879d7)
***

# What is TagCompound

`TagCompound` is the data format for custom data saved using tModLoader. We use `TagCompound` in `ModSystem`, `ModItem`, `ModPlayer`, `ModNPC`, `GlobalItem`, `GlobalNPC`, and `ModTileEntity`. If you are familiar with the concepts, thinking of `TagCompound` as a nestable dictionary or JSON comes pretty close. Like a dictionary, we provide string keys and values of any supported type.

Please use [NBTExplorer](https://github.com/jaquadro/NBTExplorer/releases/tag/v2.8.0-win) to visualize TagCompounds by opening .twld or .tplr files with it. It can be very helpful to view the data in this manner to verify that data is being saved in a manner that makes sense.

# Key Ideas
Below are some things to keep in mind as you use `TagCompound`.

## Where to use `TagCompound`
We use `TagCompound` in `ModSystem`, `ModItem`, `ModPlayer`, `ModNPC`, `GlobalItem`, `GlobalNPC`, and `ModTileEntity`. We save data in the `SaveData` method and load data in the `LoadData` method (except in `ModSystem` where we save in `SaveWorldData` and load in `LoadWorldData` instead). Do not store `TagCompound` in fields, they are not intended to exist beyond the loading and saving processes.

## Compatible Data Types
All primitive data types are supported as well as `byte[]`, `int[]` and `List`s of other supported data types. Usually we use the methods like `GetInt` or `GetBool`, but we can use `Get<Type>` for Types without specific methods defined. See the [TagCompound documentation](http://docs.tmodloader.net/docs/stable/class_tag_compound.html) or rely on your IDEs [autocomplete](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#autocomplete--intellisense) to find the method you want. In addition to the types suggested by the method names, `ushort`, `uint`, `ulong`, `Vector2`, `Vector3`, `Item`, `Color`, `Point16`, `Rectangle`, and `EntityDefinition` are also supported. Additional support can be implemented by implementing the `TagSerializable` interface, creating a class that inherits from `TagSerializer`, or by nesting `TagCompound`s manually.

## Mod Version Updates
Using `TagCompound` helps modders update mods smoothly. For example, if v1.0 of a mod saves only `a`, but v2.0 saves both `a` and `b`, the modder doesn't need to make extra checks validating the value or presence of `b` for most situations. They'd only need to do extra effort if `b` has a non-default value. For example, `b = tag.GetInt("b");` will return the default value of int if the value does not exist in the `TagCompound`, and the default value of int is 0. If 0 is the value the mod would expect for a missing entry, this works out well. If a non-default value is what the mod expects for a missing entry, the following approach can be used:

```cs
public override void Initialize()
{
	QuestsLeft = 10;
}

public override void LoadData(TagCompound tag)
{
	if (tag.ContainsKey("QuestsLeft"))
		QuestsLeft = tag.GetInt("QuestsLeft");
}
```

Notice how `Initialize` sets the value to 10, the default value our mod expects. We then check that the tag has an entry for "QuestsLeft", and if it does, we retrieve that value. Without this check, `tag.GetInt` would return 0 if the key did not exist. Designing your variables such that the default values correspond to the expected default values might be useful if you wish to avoid checking `ContainsKey`. This example used the `Initialize` method in `ModPlayer` to show this concept, but other classes have similar methods that are suitable for initializing data. For `ModItem`, for example, initial values can be set in `SetDefaults`. 

### Updates to data Type
If in a version update a saved value changes `Type`, such as from `float` to `int`, extra care must be taken to not run into exceptions.

<details><summary>Updates to data Type details</summary><blockquote>

Attempting to use `tag.GetInt(key)`, `tag.Get<int>(key)`, or `tag.TryGet<int>(key, out int value))` when the value in the `TagCompound` for that key is a `float` will throw an exception. Using a new key will result in existing users losing their data when they update to the latest version of the mod. If unavoidable, the following code shows an example of preserving the old data when the data changes `Type`:

```cs
if (tag.ContainsKey("MyKey")) { 
	object MyKeyData = tag["MyKey"];

	if (MyKeyData is float MyKeyFloat)
		MyKey = (int)MyKeyFloat;

	if (MyKeyData is int MyKeyInt)
		MyKey = MyKeyInt;
}
```

</blockquote></details>

### Renaming the class
If in a version update you change the name of the class, such as from `MyWorldModSystem` to `BossDownedModSystem`, it gets treated as a new thing and from the player's perspective it looks like the data got reset. To make it carry over the old data, you need to add the `[LegacyName("OldNameOfClass")]` attribute above the class. For things like `ModItem`, this has the benefit of not turning the old item into an "Unloaded Item". Here is an example:

```cs
[LegacyName("MyWorldModSystem")]
internal class BossDownedModSystem : ModSystem
{
//...
```

## Initialize
Make sure to initialize values in appropriate methods, constructors, or field initializers. This includes creating data structures and populating them with default values if appropriate. This is because `LoadData` will not be called if no `TagCompound` has previously been saved for this entity. For example, always make sure to reset `ModSystem` values in `ModSystem.ClearWorld`, if you don't data from worlds will cross over into other worlds as the player goes in and out of worlds. Similarly, make sure to do the same in `ModPlayer.Initialize` for `ModPlayer` data. Here is an example:

```cs
internal class MyWorldModSystem : ModSystem
{
	public static bool MySpecialBool;

	public override void ClearWorld()
	{
		MySpecialBool = false;
	}

	public override void LoadWorldData(TagCompound tag)
	{
		MySpecialBool = tag.GetBool("MySpecialBool");
	}

	public override void SaveWorldData(TagCompound tag)
	{
		tag["MySpecialBool"] = MySpecialBool;
	}
}
```

In the above example, we make sure to set `MySpecialBool` to false in `ModSystem.ClearWorld`. If we forgot to do this, the following could happen: Player enters World A, `MySpecialBool` is set to true because of some event (such as defeating a boss), player exits World A and enters World B, World B doesn't have `TagCompound` data yet, so `LoadWorldData` is not called, `MySpecialBool` is still true despite the fact that what `MySpecialBool` represents has never happened in World B. Always remember to set values to default values in the appropriate method, constructor, or field initializer. 

# Examples
Here are links to various examples in ExampleMod and other mods, in order of complexity:
* [ExampleStatIncreasePlayer](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/Players/ExampleStatIncreasePlayer.cs#L53) - ModPlayer - Simple Example, 1 number indicating life boost item consumption and 1 number indicating mana boss item consuption.
* [DownedBossSystem](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/Systems/DownedBossSystem.cs#L25) - ModSystem - Saves bools indicating which bosses from ExampleMod have been defeated in the world
* [ExamplePerson](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/ExamplePerson.cs#L382) - ModNPC - Saves an int to this town NPC to indicate talk activity
* [ExampleInstancedItem](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/ExampleInstancedItem.cs#L62) - ModItem - Saves an array of Color pertaining solely to the specific instance of the item
* [ExampleCanStackItem](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Consumables/ExampleCanStackItem.cs#L73) - ModItem Saves a string
* [ExampleGlobalNPC](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/ExampleGlobalNPC.cs#L41) - GlobalNPC - Saves a bool (optionally, for efficiency)
* [DisableCorruptionSpreadModWorld](https://github.com/JavidPack/DisableCorruptionSpread/blob/1.4/DisableCorruptionSpreadModWorld.cs#L193) - ModSystem - Shows `nameof` and `tag.ContainsKey` usage.
* [AutoTrashPlayer](https://github.com/JavidPack/AutoTrash/blob/1.4/AutoTrashPlayer.cs#L31) - ModPlayer - Saving and Loading a list of `Item`s.
* [BossChecklist](https://github.com/JavidPack/BossChecklist/blob/1.4.4/DataManager.cs) - TagSerializable - Shows several examples of implementing TagSerializable, including nesting
* [Item](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/Item.TML.cs) (and [ItemIO](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/ModLoader/IO/ItemIO.cs) - TagSerializable - Shows implementing TagSerializable
* [TagSerializer](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/ModLoader/IO/TagSerializer.cs#L186) - TagSerializer - Shows inheriting from TagSerializer to facilitate serializing existing classes

# Simple Example

Lets start with ExampleLifeFruitPlayer from ExampleLifeFruit.cs:

```cs
public override void SaveData(TagCompound tag) {
	tag["exampleLifeFruits"] = exampleLifeFruits;
}

public override void LoadData(TagCompound tag) {
	exampleLifeFruits = tag.GetInt("exampleLifeFruits");
}
```

Here we see a very simple example of saving and loading an int variable. In `SaveData`, we add data to the `TagCompound` provided. In `LoadData` we are provided a `TagCompound` named tag and retrieve values from it. We must use the appropriate methods in Load that match the data type of the data stored. 

# List Example
A common mistake that modders make with `TagCompound` is saving lists of data as individual entries in a `TagCompound`. For example, the following is a bad approach:

```cs
for (int i = 0; i < stats.Count; i++)
{
	tag.Add("stats_" + i, stats[i]); // BAD EXAMPLE, DO NOT USE!
}
```

Saving individual entries like this is not how we should be using `TagCompound`. Here is what this approach looks like in NBTExplorer:    
![](https://i.imgur.com/puTAMHM.png)    

`TagCompound` supports Lists of compatible data types, here is a proper approach:

```cs
// SaveData
tag.Add("stats", stats);

// LoadData
stats = tag.GetList<int>("stats");
// or
stats = tag.Get<List<int>>("stats");
```    
![](https://i.imgur.com/dBLlbVu.png)    

Note: If an entry is missing, an empty list rather than null will be returned from `GetList<>` or `Get<List<>>`.

# Dictionary Example
Saving and loading a dictionary can be done, but take a little effort. One approach is to save the keys and values as lists and then reconstruct the `Dictionary` by using the `Zip` method:

```cs
// This code can be found in TEScoreBoard in ExampleMod: https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/Tiles/TEScoreBoard.cs
// NOTE: TEScoreBoard hasn't been updated to 1.4.4 yet, the linked example is 1.3 code.
using System.Linq;

internal Dictionary<string, int> scores = new Dictionary<string, int>();

public override void SaveData(TagCompound tag)
{
	tag["scoreNames"] = scores.Keys.ToList();
	tag["scoreValues"] = scores.Values.ToList();
}

public override void LoadData(TagCompound tag)
{
	var names = tag.Get<List<string>>("scoreNames");
	var values = tag.Get<List<int>>("scoreValues");
	scores = names.Zip(values, (k, v) => new { Key = k, Value = v }).ToDictionary(x => x.Key, x => x.Value);
}
```
If you are specifically saving a `Dictionary` keyed by `string`, there is another approach. Using a `Dictionary` keyed by `string` is very typical, so this approach is useful to learn. This approach capitalizes on the fact that `TagCompound` acts like a `Dictionary` keyed by `string` internally in the first place, so we can save the keys and values directly to the `TagCompound` rather than reconstruct the `Dictionary` later from two separate lists.
```cs
internal Dictionary<string, int> scoresAlternate = new Dictionary<string, int>();

public override void SaveData(TagCompound tag) {
	TagCompound scoresAlternateTag = new TagCompound();
	foreach (var scoreAlternate in scoresAlternate) {
		scoresAlternateTag[scoreAlternate.Key] = scoreAlternate.Value;
	}
	tag["scoresAlternate"] = scoresAlternateTag;
}

public override void LoadData(TagCompound tag) {
	foreach (var item in tag.GetCompound("scoresAlternate")) {
		scoresAlternate[item.Key] = (int)item.Value;
	}
}

```
Both options work, but the resulting data is stored differently. It may be useful to use the alternate approach (if indexing by `string`) so that it is easier for a user to modify their save in case anything goes wrong. It is also easier to read and debug issues if stored directly like this. The blue highlighted section in the screenshot below corresponds to the alternate approach while the yellow section corresponds to the approach saving 2 separate lists.     

![NBTExplorer_2024-04-04_11-58-07](https://github.com/tModLoader/tModLoader/assets/4522492/7bc48c73-162a-4972-9720-22cd3e33501b)    

Here is a more complex example of a `Dictionary<ulong, Tuple<string, int>>`. Using `Zip` to do this would be a little hard, so we take an alternate approach here. Rather than store keys and values as lists separately, we construct a list of `TagCompound`, each `TagCompound` in that list representing an entry in the `Dictionary`:

```cs
public Dictionary<ulong, Tuple<string, int>> complexDictionary;

public override void Initialize()
{
	complexDictionary = new Dictionary<ulong, Tuple<string, int>>();
}

public override void SaveData(TagCompound tag)
{
	var list = new List<TagCompound>();
	foreach (var item in complexDictionary)
	{
		list.Add(new TagCompound() {
			{ "pid", item.Key },
			{ "name", item.Value.Item1 },
			{ "deaths", item.Value.Item2 },
		});
	}
	tag["complexDictionary"] = list;
}

public override void LoadData(TagCompound tag)
{
	var list = tag.GetList<TagCompound>("complexDictionary");
	foreach (var item in list)
	{
		ulong pid = item.Get<ulong>("pid");
		string name = item.GetString("name");
		int deaths = item.GetInt("deaths");
		complexDictionary[pid] = new Tuple<string, int>(name, deaths);
	}
}
```

![](https://i.imgur.com/Ecu3gc3.png)

# Nested Example

**TODO: Finish this section with an example.**

# Item Example
A common task for modders is saving an `Item`. Don't attempt to hack out your own approach by saving the itemid or name of the item and then attempting to restore it during `LoadData`. The `Item` class is natively supported by `TagCompound`. Unloaded items will persist through mods unloading and loading as expected.

Do note that saving `null` entries in a List or array of `Item` is not supported. Each entry must be an instantiated `Item`. Missing tags will be loaded as a `new Item()` as well.

```
public Item SingleItem = new Item();
public List<Item> ItemsToSave = new List<Item>();

public override void SaveData(TagCompound tag) {
	tag[nameof(SingleItem)] = SingleItem;
	tag[nameof(ItemsToSave)] = ItemsToSave;
}

public override void LoadData(TagCompound tag) {
	SingleItem = tag.Get<Item>(nameof(SingleItem));
	ItemsToSave = tag.Get<List<Item>>(nameof(ItemsToSave));
}
```

If you only need to save the identity of items, it might be better (more efficient and easier to work with) to save and load an `ItemDefinition` instead. `ItemDefinition` is a special class that can be used to safely store and restore an item type. Do not store `Item.type` values directly, that will not work for modded item types which can change if a mod or the mod list is changed or updated. `ItemDefinition` also works to preserve item identities even when a mod is unloaded. 

# Custom TagCompound Example

**TODO: Finish this section with an example.**

# TagSerializer and TagSerializable Examples
Creating a class that inherits from `TagSerializer` or a class that implements the `TagSerializable` interface is another approach to simplifying saving and loading custom data to `TagCompound`s. We can create a `TagSerializer` for classes that are not a part of our mod, while implementing `TagSerializable` is preferable for classes defined in our mod.

## TagSerializer Examples
We create `TagSerializer`s for classes not under the control of our mod. Adding `TagSerializer`s allows us to save and load the class directly in `TagCompound`. Here is an example:

```cs
public class RectangleSerializer : TagSerializer<Rectangle, TagCompound>
{
	public override TagCompound Serialize(Rectangle value) => new TagCompound
	{
		["x"] = value.X,
		["y"] = value.Y,
		["width"] = value.Width,
		["height"] = value.Height
	};

	public override Rectangle Deserialize(TagCompound tag) => new Rectangle(tag.GetInt("x"), tag.GetInt("y"), tag.GetInt("width"), tag.GetInt("height"));
}
```

We can now freely use `Rectangle` as if it were a natively supported data type:
```cs
public override void SaveData(TagCompound tag)
{
	tag["rectangle"] = rectangle;
	tag["rectangles"] = rectangles;
}

public override void LoadData(TagCompound tag)
{
	rectangle = tag.Get<Rectangle>("rectangle");
	rectangles = (List<Rectangle>)tag.GetList<Rectangle>("rectangles");
}
```
![](https://i.imgur.com/dBpWSf0.png)    

Please be aware that `RectangleSerializer` is already implemented in tModLoader natively, and any attempt to register a `TagSerializer` for `Rectangle` will cause your mod to fail to load. Several other common classes already have `TagSerializer`s made for them such as `Vector2`, `Vector3`, `Color`, `Point16`, and `Rectangle`. Since multiple `TagSerializer`s for the same class will cause errors, if you implement a `TagSerializer` for a class that might be useful for other modders, please reach out to us with your implementation and we can add it in directly to the next tModLoader release.

## TagSerializable Examples
If a class is defined in your mod, it is better to implement `TagSerializable` directly on the class. To do this, add ` : TagSerializable` to the class and add `public static readonly Func<TagCompound, ClassName> DESERIALIZER = LoadMethodNameHere;` to the class. Below is a complete example that utilizes `TagSerializable` for clear and concise code. This example also shows saving `List`s and how saving objects with other objects contained in that object can easily be done. The example also shows compact syntax in the `NestedData` class as well as usage of the `nameof` operator ([see below](#nameof-operator)). You'll also notice that `MyData` has a `Rectangle` contained within, showing how the already implemented `TagSerializer` for that class is automatically utilized. In short, this example goes over much of this guide.

```cs
using Microsoft.Xna.Framework;
using System;
using System.Collections.Generic;
using Terraria.ModLoader;
using Terraria.ModLoader.IO;

namespace ExampleMod
{
	class MyModPlayer : ModPlayer
	{
		List<MyData> listOfMyData;
		MyData specialMyData;

		public override void Initialize()
		{
			listOfMyData = new List<MyData>();
			specialMyData = new MyData();

			// Test Data. In reality you would change this data in your mod somewhere where appropriate.
			/*
			specialMyData.number = 1;
			specialMyData.rectangle = new Rectangle(1, 2, 3, 4);

			var listItem = new MyData();
			listItem.nested = new NestedData();
			listItem.nested.A = 55;
			listItem.nested.B = 66;
			listItem.number = 77;
			listOfMyData.Add(listItem);
			*/
		}

		public override void SaveData(TagCompound tag)
		{
			tag[nameof(listOfMyData)] = listOfMyData;
			tag[nameof(specialMyData)] = specialMyData;
		}

		public override void LoadData(TagCompound tag)
		{
			listOfMyData = tag.Get<List<MyData>>(nameof(listOfMyData));
			specialMyData = tag.Get<MyData>(nameof(specialMyData));
		}
	}

	class MyData : TagSerializable
	{
		public static readonly Func<TagCompound, MyData> DESERIALIZER = Load;

		public int number;
		public Rectangle rectangle;
		public NestedData nested = new NestedData();

		public TagCompound SerializeData()
		{
			return new TagCompound
			{
				["number"] = number,
				["rectangle"] = rectangle,
				["nested"] = nested,
			};
		}

		public static MyData Load(TagCompound tag)
		{
			var myData = new MyData();
			myData.number = tag.GetInt("number");
			myData.rectangle = tag.Get<Rectangle>("rectangle");
			myData.nested = tag.Get<NestedData>("nested");
			return myData;
		}
	}

	class NestedData : TagSerializable
	{
		public static readonly Func<TagCompound, NestedData> DESERIALIZER = Load;
		public int A;
		public int B;
		public TagCompound SerializeData() => new TagCompound { [nameof(A)] = A, [nameof(B)] = B };
		// object initializers syntax
		public static NestedData Load(TagCompound tag) => new NestedData() { A = tag.GetInt(nameof(A)), B = tag.GetInt(nameof(B)) };
	}
}
```
Here is the data that is saved for this example:    
![](https://i.imgur.com/ZcUDRuO.png)    

# Other Topics
## GlobalItem Optimization
Saving data in `GlobalItem` will quickly explode the filesize of player and world saves. Make sure to only assign values to the `TagCompound` if there is non-default data to save. For example, if you are tracking how many times an item has been reforged, if the reforge count for the item is 0, don't save the value at all.

## nameof operator
The `nameof` operator can simplify some things, but be careful. (See [nameof documentation](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/nameof)) The `nameof` operator can help avoid spelling mistakes between `LoadData` and `SaveData` (or between `LoadWorldData` and `SaveWorldData` if in a `ModSystem` class). Be careful, however, of refactor-renaming variables in your mod (the F2 command in Visual Studio). If you rename a `ModPlayer` variable that is saved using `nameof`, for example, your mod will lose data when your users update the mod. See below for an example. Notice how we don't need to write `"CorruptionSpreadDisabled"` to specify the key, risking a spelling error that would be hard to catch. 

```cs
public override void LoadWorldData(TagCompound tag)
{
	CorruptionSpreadDisabled = tag.GetBool(nameof(CorruptionSpreadDisabled));
}

public override void SaveWorldData(TagCompound tag)
{
	tag[nameof(CorruptionSpreadDisabled)] = CorruptionSpreadDisabled;
}
```
