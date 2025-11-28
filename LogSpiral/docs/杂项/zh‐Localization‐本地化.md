<!--
Note to wiki editors:
This page is NOT an exact translation of the original page. 
There are additions, deletions or modifications based on nature the target language. 
If you want to translate this page, you are suggested to refer to the original page. 
-->

<!--
Contact translators:
- Lacewing (lace.wing on Discord)
-->

***
此指南是为 1.4.4 版 tModLoader 而作。在 1.4.3 版本的 tModLoader 中，本地化文件不会自动更新，此指南中的一些方法也不存在。但基本概念是一样的。
***

[Original Page (English) | 原页面（英文）](https://github.com/tModLoader/tModLoader/wiki/Localization)<br />
[Русская версия страницы | 俄文](https://github.com/tModLoader/tModLoader/wiki/ru-Localization-Локализация)

---

<!-- Generated with https://md-toc-generator.as93.net/ since it supprts CJK text -->
## 目录

- [什么是本地化?](#什么是本地化?)
- [语言支持](#语言支持)
- [从1.4.3迁移到1.4.4](#从1.4.3迁移到1.4.4)
 - [在1.4.3生成本地化文件](#在1.4.3生成本地化文件)
  - [本地化键改动](#本地化键改动)
 - [切换至1.4.4并生成模组](#切换至1.4.4并生成模组)
- [本地化流程](#本地化流程)
 - [热更新](#热更新)
- [本地化如何运作](#本地化如何运作)
 - [本地化键](#本地化键)
  - [自定义键](#自定义键)
 - [文本换元](#文本换元)
  - [已有的物品描述（Tooltip)](#已有的物品描述（tooltip))
  - [其它已有描述](#其它已有描述)
  - [简化作用域声明](#简化作用域声明)
 - [格式化字符串](#格式化字符串)
  - [占位符](#占位符)
  - [往本地化中传入值](#往本地化中传入值)
  - [多个占位替换](#多个占位替换)
  - [为动态内容组合翻译](#为动态内容组合翻译)
  - [在ModConfig中的使用](#在modconfig中的使用)
 - [复数化](#复数化)
 - [聊天标签（Chat tag)](#聊天标签（chat-tag))
 - [NetworkText](#networktext)
 - [获取本地化的时机](#获取本地化的时机)
- [自动更新本地化](#自动更新本地化)
 - [加入新内容](#加入新内容)
 - [HJSON语法](#hjson语法)
  - [多行文本](#多行文本)
  - [特殊字符](#特殊字符)
  - [tModLoader的HJSON特性](#tmodloader的hjson特性)
   - [颜色](#颜色)
   - [物品](#物品)
   - [键位](#键位)
 - [注释](#注释)
 - [本地化文件名](#本地化文件名)
  - [文化（语言）](#文化（语言）)
  - [前缀](#前缀)
  - [非本地化 `.hjson` 文件](#非本地化-`.hjson`-文件)
 - [多个同语言文件](#多个同语言文件)
- [添加翻译键](#添加翻译键)
 - [手动添加键](#手动添加键)
 - [添加可本地化的属性](#添加可本地化的属性)
  - [从LocalizedText属性中提取文本](#从localizedtext属性中提取文本)
  - [可继承的本地化属性](#可继承的本地化属性)
  - [另一个示例](#另一个示例)
- [`ModType` 与 `ILocalizedModType`](#`modtype`-与-`ilocalizedmodtype`)
- [添加新语言](#添加新语言)

# 什么是本地化?
本地化让使用各种语言的玩家都能畅玩模组。每一条游玩过程中可见的文本都被储存在一种叫做“本地化文件”的文本文件里。举个例子，ExampleMod 里有个物品叫做“纸飞机”，但在英语中叫“Paper Airplane”。通过本地化，无论是汉语还是英语的使用者都可以看懂，而不需要先去学一门语言。

这些本地化文件很容易制作，使得不懂编程的人也能翻译模组。然后作者便可以将这些翻译加入模组中，允许更多人游玩。（译注：而无需加载翻译补丁）

**即使你只想支持一种语言，你也需要使用本地化文件**

此指南将涵盖模组作者需要知道的本地化专题教程。如果你想要翻译一个已有的模组，或者是翻译tModLoader本身，请参阅[贡献本地化](https://github.com/tModLoader/tModLoader/wiki/Contributing-Localization)。

# 语言支持

tModLoader 目前支持下列文字：

| 语言 | 缩写 | 文件名 |
|---:|:---|---|
| 英文 | en-US | en-US.hjson |
| 德文 | de-DE | de-DE.hjson |
| 意大利文 | it-IT | it-IT.hjson |
| 法文 | fr-FR | fr-FR.hjson |
| 简体中文   | zh-Hans | zh-Hans.hjson |
| 西班牙文 | es-ES | es-ES.hjson |
| 俄文 | ru-RU | ru-RU.hjson |
| 巴西葡萄牙文 | pt-BR | pt-BR.hjson |
| 波兰文 | pl-PL | pl-PL.hjson |

# 从1.4.3迁移到1.4.4
如果你是要将模组从 1.4.3 迁移到 1.4.4，展开这一节并仔细阅读。

<details><summary>Migrating from 1.4.3 to 1.4.4 details</summary>

从tModLoader v2023.01开始，所有的本地化都在 `.hjson` 文件中完成。不再支持在代码中声明翻译（译注：然而可以硬写文本）. 这项改动将大幅精简改良本地化管理并使翻译模组更简单。如果你对逻辑层面的改动更感兴趣的话，参阅[重大本地化改动建议](https://github.com/tModLoader/tModLoader/issues/3074). 

**如果你没在使用Git或其它形式的版本控制的话，建议在迁移之前备份好你的模组。**

## 在1.4.3生成本地化文件
首先，我们需要一个较“老”的tModLoader来导出本地化文件。用Steam将tModLoader的测试版调至 `1.4.3-legacy`。（[切换tModLoader版本的教程](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#switch-to-stable-tmodloader-or-to-preview-tmodloader))

切换至正确的版本后，启动游戏，启用模组，然后进入 `开发模组` 菜单。在模组列表里找到你的模组。你会看到一个绿色箭头按钮，鼠标停留于其上时显示“Export 1.4.4+ localization files”，点它。  
![image](https://user-images.githubusercontent.com/4522492/210681409-a659670d-5908-4e5d-bd45-74c0545f4666.png)  
现在去到 `ModSources` 文件夹，然后是你模组里的本地化文件夹。如果之前没有本地化文件夹，那就到你模组的根目录。你将会看到新生成的 `.hjson.new` 文件： 
![image](https://user-images.githubusercontent.com/4522492/210681629-8aad2234-bd56-40c8-b03f-7e36b98d4486.png)  
在文本编辑器里打开上述文件，确认一下它们都是好的。原有 `.hjson` 里的条目和新生成的条目都应该在新文件里。如果一切正常，下一步。

### 本地化键改动
从1.4.3到1.4.4，许多键的格式都改变了。在导出新版本地化文件时，它们会自动调整，但自定义的键或者代码中使用的旧版键不会自动调整，需要你手动修改。比如，`Mods.{模组名}.ItemName.{内容名}` 在1.4.4变成了 `Mods.{模组名}.Items.{内容名}.DisplayName`

<details><summary>格式改动</summary>

```
Mods.{ModName}.DamageClassName.{ContentName}	-->	Mods.{ModName}.DamageClasses.{ContentName}.DisplayName
Mods.{ModName}.InfoDisplayName.{ContentName}	-->	Mods.{ModName}.InfoDisplays.{ContentName}.DisplayName
Mods.{ModName}.BiomeName.{ContentName}		-->	Mods.{ModName}.Biomes.{ContentName}.DisplayName
Mods.{ModName}.BuffName.{ContentName}		-->	Mods.{ModName}.Buffs.{ContentName}.DisplayName
Mods.{ModName}.BuffDescription.{ContentName}	-->	Mods.{ModName}.Buffs.{ContentName}.Description
Mods.{ModName}.ItemName.{ContentName}		-->	Mods.{ModName}.Items.{ContentName}.DisplayName
Mods.{ModName}.ItemTooltip.{ContentName}	-->	Mods.{ModName}.Items.{ContentName}.Tooltip
Mods.{ModName}.NPCName.{ContentName}		-->	Mods.{ModName}.NPCs.{ContentName}.DisplayName
Mods.{ModName}.Prefix.{ContentName}		-->	Mods.{ModName}.Prefixes.{ContentName}.DisplayName
Mods.{ModName}.ProjectileName.{ContentName}	-->	Mods.{ModName}.Projectiles.{ContentName}.DisplayName
Mods.{ModName}.ResourceDisplaySet.{ContentName}	-->	Mods.{ModName}.ResourceDisplaySets.{ContentName}.DisplayName
Mods.{ModName}.Containers.{ContentName}		-->	Mods.{ModName}.Tiles.{ContentName}.ContainerName
Mods.{ModName}.MapObject.{ContentName}		-->	Mods.{ModName}.Tiles.{ContentName}.MapEntry
Mods.{ModName}.Keybind.{ContentName}		-->	Mods.{ModName}.Keybinds.{ContentName}.DisplayName
```

</details>

## 切换至1.4.4并生成模组
用Steam将tModLoader的测试版调至 `无`。（[切换tModLoader版本的教程](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#switch-to-stable-tmodloader-or-to-preview-tmodloader))

启动tModLoader后，你会发现你的模组（大概你启用的其它模组也会）加载失败，这是正常现象。进入 `开发模组` 菜单并点击“Run tModPorter”按钮。这会将过时的本地化方法连同其它过时内容一起移除（译注：但这并不能解决所有问题，该手动改的还是逃不过的）。  
![image](https://user-images.githubusercontent.com/4522492/210683375-43816104-2812-4db2-bac6-813ebb47a089.png)  
在此之后，你应该用 `hjson.new` 文件替换现有的 `.hjson` 文件。首先，删除 `.hjson` 文件（若有），再将 `.hjson.new` 重命名为 `.hjson` 文件（如果你不能修改文件扩展名，你需要先[启用“文件扩展名”](https://github.com/tModLoader/tModLoader/assets/4522492/2f901fe9-db01-4bff-b930-449220419ae7)）

现在，你可能需要打开Visual Studio, 修复剩下的问题。完成后你就可以重新生成你的模组。确保一切正常后，你可以在模组源码里搜索 `// Tooltip.SetDefault("这是一个模组物品。");` 和 `// DisplayName.SetDefault("示例剑");` 之类的东西，删掉，因为它们没用了。（你可以在项目中的所有文件搜索 `.SetDefault(` 找到这些该删的代码）

你也可以使用以下正则帮助你查找 `SetDefault()` 调用（然后用空字符串替换它们）。
- 单行注释：`\s+// [\w.]+SetDefault\(".+;`
- 多行注释：`\s+/\*[\s\w.]+SetDefault\(".+\*/`，需要用类似Notepad++的工具并开启“.匹配新行”的功能

</details>

# 本地化流程
本地化文件再模组加载过程的最后更新。这意味着模组作者需要在添加内容后生成并加载模组以更新本地化文件。更新后即可修改 `.hjson` 文件以添加翻译。翻译完以后，需要重新生成并加载模组来使翻译出现在游戏中。

为了避免丢失翻译，请遵循这一工作流程：

1. 向模组添加内容，比如一个 `ModItem`
2. 生成并加载模组
3. 完成上一步后，`hjson` 文件就会自动更新并生成新内容的条目。编辑英语的 `.hjson` 文件，给上述内容一个英语翻译
4. 生成并加载模组
5. 非英语 `.hjson` 文件自动根据英语文件更新并生成合适的占位条目以供译者翻译，**请不要在英语文件之前编辑非英语的文件，否则对非英语文件的更改会丢失**

译注：目前tModLoader不支持自定义“第一语言”，但你可以将中文内容填入英语的本地化文件中。

如果译者发给你翻译好的 `.hjson` 文件，要小心，如果tModLoader检测到 `.tmod` 文件新于 `.hjson` 文件，`.hjson` 文件可能被覆盖。在这种情况下，最好的办法是在模组加载前生成一遍。你可以在tModLoader未开启时用Visual Studio生成，也可以在启动tModLoader时按住Shift键跳过模组加载再进入模组源码页面生成模组。如果你忘了这一步，发现tModLoader把新翻译重置成旧的了，那就得重新来过了。

## 热更新
tModLoader会在ModSources里的 `.hjson` 文件保存时检测并自动重载它们。这样模组作者就不需要重新生成并加载模组来测试本地化了。如果你用了热更新，记得一定要在发布模组前重新生成一次。（译注：对于代码的热更新也是如此）

让我们来看一个例子。为了修物品 `ExampleWings` 的英语名称和描述，一个模组制作者修改并保存了 `en-US.hjson` 文件。几秒后，改动就出现在游戏内了:

https://user-images.githubusercontent.com/4522492/229942438-26604fd7-9073-436c-b2ab-d99b4f2efeb7.mp4

# 本地化如何运作
从物品名字到主菜单文字，每一条文本都使用本地化。游戏里的每一条文本实际上是一对数据：一个“键（key）”和一个“值（value）”。举个例子，当玩家创建一个小世界时，游戏用键 `UI.WorldSizeSmall` 来寻找当前语言的对应翻译，若为汉语则显示“小”，若为英语，游戏依然会寻找键 `UI.WorldSizeSmall`，但此时它的值就不一样了：是“Small”。由于泰拉瑞亚的作者们用英语写代码，大部分原版的本地化键很接近它们在英语下的值。

在tModLoader中，模组使用 `.hjson` 文件整齐地存放本地化的键与值。每一种语言有它自己的 `.hjson` 文件。如果你熟悉JSON, 那么[HJSON](https://hjson.github.io)用起来也不会陌生。

下面是一个简单的示例：

文件名：**tModLoader/ModSources/ExampleMod/zh-Hans.hjson**
```
Mods: {
	ExampleMod: {
		Items: {
			ExampleItem: {
				DisplayName: 示例物品
				Tooltip: 这是一个模组物品。
			}
		}
	}
}
```

在上面这个例子中，我们可以找到两个概念：（本地化）键和（本地化）值。键从 `:` 号左侧每一级的文本组合而来。`:` 号右侧则是值。这个例子包含两个键和它们对应的值：`Mods.ExampleMod.Items.ExampleItem.Displayname` 对应 `示例物品`，`Mods.ExampleMod.Items.ExampleItem.Tooltip` 对应 `这是一个模组物品。`。如果这些语法看起来很复杂，别担心，tModLoader会帮你更新这些文件的。

当模组被加载时，tModLoader会寻找当前语言下的所有本地化文件并将它们储存在内存中。需要向玩家显示文本时，就用一个键去储存的数据里查询并检索出正确的文本。翻译以 `LocalizedText` 对象的形式存储于内存中。模组作者可以用方法 `Language.GetText` 以键获取 `LocalizedText` 对象。`LocalizedText` 的 `Value` 属性可取出它的文本值。另外，方法 `Language.GetTextValue` 直接由键获取文本值：

```cs
string hivePackDialogue = Language.GetTextValue("Mods.ExampleMod.Dialogue.ExampleTravelingMerchant.HiveBackpackDialogue"); // 直接返回要显示的文本，string
或
string hivePackDialogue = Language.GetText("Mods.ExampleMod.Dialogue.ExampleTravelingMerchant.HiveBackpackDialogue").Value; // 返回LocalizedText，使用其Value属性获取string
或
LocalizedText hivePackDialogueLocalizedText = Language.GetText("Mods.ExampleMod.Dialogue.ExampleTravelingMerchant.HiveBackpackDialogue"); // 返回LocalizedText
string hivePackDialogue = hivePackDialogueLocalizedText.Value; // 将其Value赋值给新声明的string
```

## 本地化键
tModLoader会自动为大多数内容分配键。这些键的模板是 `Mods.{模组名}.{类别}.{内容名}.{数据名}`，`模组名` 是是模组的内部名称（类名），`类别` 依内容的类型而定，`内容名` 是内容的内部名（一般是类名），`数据名` 指明了该类中的键。

例如 `ModItem` 有叫 `Items` 的 `类别`。它也有两条数据，分别是 `DisplayName` 和 `Tooltip`。如果一个叫 `ExampleMod` 的模组加入了一个类名为 `ExampleItem` 的 `ModItem`，上述两个键会生成在 `.hjson` 文件里：`Mods.ExampleMod.Items.ExampleItem.DisplayName` 和 `Mods.ExampleMod.Items.ExampleItem.Tooltip`。

**注意**：请不要在本地化键中使用空格或其他特殊字符。

### 自定义键
如果你有许多描述相同的物品，你可以令它们的描述指向同一个键。要这么做，重写描述属性并返回你要的 `LocalizedText`：
```cs
public override LocalizedText Tooltip => Language.GetOrRegister("Mods.ExampleMod.Common.SomeSharedTooltip"); // 将该类的Tooltip属性重写为你需要的LocalizedText
```
如果你有其它的物品继承此类，你只需要在此基类中重写描述。当然，如果有需要，你还可以在子类中继续重写。

模组制作者可以用 `public override LocalizedText Tooltip => LocalizedText.Empty;` 代表“不应生成本地化键”，让本地化文件更干净。

## 文本换元
如果你的本地化文件里有重复出现的文本，或你想要使用游戏里已有的文本，你可以使用换元来保持文件整洁。在值中使用 `{$Key}` 来换元。当游戏加载时，这一段将会被替换为其 `Key` 所指的文本。

比如说，游戏里已经有“右键以打开”的翻译，储存在键 `CommonItemTooltip.RightClickToOpen` 中。模组可以使用换元复用它的值。HJSON条目 `Tooltip:"{$CommonItemTooltip.RightClickToOpen}"` 将被展示为用户语言的“右键以打开”翻译。其它已有翻译，诸如物品名称和常用描述也都可以这样使用。

模组内的翻译也可以换元。比如[示例模组本地化文件](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Localization/en-US.hjson)中的例子，`MapObject.ExamplePylonTile:"{$Mods.ExampleMod.ItemName.ExamplePylonItem}"` 就复用了键 `Mods.ExampleMod.ItemName.ExamplePylonItem` 对应的翻译。

许多替换里有 `{0}` 或 `{1}`，它们是可供模组作者传值的占位符。这一点在[格式化字符串](#格式化字符串)有解释。

### 已有的物品描述（Tooltip)
在你的模组中使用游戏提供的描述是个好主意。使用统一的语言和既有的翻译能提升你模组的吸引力。仔细看看下面这个常见物品描述列表。所有这些的键都以 `CommonItemTooltip.` 开头。

<details>

<summary>CommonItemTooltip包含的键</summary>

```
// 由泰拉瑞亚添加
"SpecialCrafting":"用于特殊制作",
"DevItem":"“非常适合冒充开发者！”",
"FlightAndSlowfall":"可飞行和缓慢坠落",
"RightClickToOpen":"<right>可打开",
"MinorStats":"所有属性小幅提升",
"BannerBonus":"附近的玩家针对以下情况获得奖励：",
"Counterweight":"用悠悠球击中一个敌人后，投掷平衡锤",
"EtherianManaCost10":"在保卫埃特尼亚水晶时消耗10点天国魔力",
"MinuteDuration":"{0}分钟持续时间",
"PlaceableOnXmasTree":"可放置在圣诞树上",
"RestoresLife":"恢复{0}生命值",
"RestoresMana":"恢复{0}魔力",
"SecondDuration":"{0}秒持续时间",
"String":"扩大悠悠球效力范围",
"UsesLife":"使用{0}生命值",
"UsesMana":"使用{0}魔力",
"CreativeSacrificeComplete":"复制功能已解锁",
"CreativeSacrificeNeeded":"再研究{0}个即可解锁复制功能",
"GolfBall":"会被高尔夫球杆击中",
"GolfDriver":"一种适合远距离的强大高尔夫球杆\n高尔夫球会飞得很远，垂直倾角很小",
"GolfIron":"一种最适合中等距离的圆润高尔夫球杆\n高尔夫球会飞出一段中等距离，垂直倾角适当",
"GolfPutter":"一种专门用于最后进洞球的高尔夫球杆\n高尔夫球将在短距离内贴近地面，以达到精确击球的目的",
"GolfWedge":"一种专门用于沙坑或高障碍物的高尔夫球杆\n高尔夫球将获得很大的垂直倾角，但不会飞得很远",
"Kite":"有风的日子可以放风筝\n使用<right>收卷风筝线",
"LavaFishing":"可以在熔岩中钓鱼",
"MajorStats":"所有属性大幅提升",
"MediumStats":"所有属性中幅提升",
"PressDownToHover":"按DOWN可切换悬停\n按UP可停用悬停",
"PressUpToBooster":"按住UP可以加快强化！",
"Sentry":"召唤哨兵",
"TeleportationPylon":"当附近有2个村民时，传送至另一个晶塔\n在匹配的生物群落中，每个类型只能放置一个",
"TipsyStats":"近战属性小幅提升，防御力降低",
"Whips":"你召唤的仆从将集中打击被击中的敌人",
"WizardHatDuringAnniversary":"仆从数量上限提高1个"
// 由tModLoader加入
"IncreasesDefenseBy":"防御力增加{0}点",
"IncreasesArmorPenBy":"增加{0}点盔甲穿透力",
"IncreasesMaxLifeBy":"最大生命值增加{0}",
"IncreasesMaxManaBy":"最大魔力值增加{0}",
"IncreasesMaxLifeByPercent":"最大生命值增加{0}%",
"IncreasesMaxManaByPercent":"最大魔力值增加{0}%",
"IncreasesBowDamageByPercent":"弓的伤害增加{0}%",
"IncreasesGunDamageByPercent":"枪的伤害增加{0}%",
"IncreasesSpecialistDamageByPercent":"专业远程武器伤害增加{0}%",
"IncreasesWhipRangeByPercent":"鞭子范围增加{0}%",
"IncreasesMaxMinionsBy":"仆从数量上限增加{0}个",
"IncreasesMaxSentriesBy":"哨兵数量上限增加{0}个",
"IncreasesFishingPowerBy":"渔力增加{0}点",
"PermanentlyIncreasesMaxLifeBy":"最大生命值永久增加{0}",
"PermanentlyIncreasesMaxManaBy":"最大魔力值永久增加{0}",
"ReducesDamageTakenByPercent":"所受伤害减少{0}%",
"PercentChanceToSaveAmmo":"{0}%的几率节省弹药",
"PercentReducedManaCost":"魔力值消耗减少{0}%",
"PercentIncreasedMiningSpeed":"采矿速度增加{0}%",
"PercentIncreasedMovementSpeed":"移动速度提高{0}%",
"ArmorPenetration":"{0}盔甲穿透",
"PercentIncreasedDamage":"伤害增加{0}%",
"PercentIncreasedCritChance":"暴击率增加{0}%",
"PercentIncreasedDamageCritChance":"伤害和暴击率各增加{0}%",
"PercentIncreasedMagicDamage":"魔法伤害增加{0}%",
"PercentIncreasedMagicCritChance":"魔法暴击率增加{0}%",
"PercentIncreasedMagicDamageCritChance":"魔法伤害和暴击率各增加{0}%",
"PercentIncreasedMeleeDamage":"近战伤害增加{0}%",
"PercentIncreasedMeleeCritChance":"近战暴击率增加{0}%",
"PercentIncreasedMeleeDamageCritChance":"近战伤害和暴击率各增加{0}%",
"PercentIncreasedMeleeSpeed":"近战速度提高{0}%",
"PercentIncreasedRangedDamage":"远程伤害增加{0}%",
"PercentIncreasedRangedCritChance":"远程暴击率增加{0}%",
"PercentIncreasedRangedDamageCritChance":"远程伤害和暴击率各增加{0}%",
"PercentIncreasedSummonDamage":"召唤伤害增加{0}%",
"SummonTagDamage":"{0}点召唤标记伤害",
"PercentSummonTagCritChance":"{0}%的召唤标记暴击率"
```

</details>

### 其它已有描述
除了 `CommonItemTooltip`，模组制作者还可以引用其它本地化键。举个例子，`NPCName.BlueSlime` 是用于获取蓝史莱姆本地化名称的键。模组制作者可以下载[泰拉瑞亚创意工坊语言包进阶指南](https://forums.terraria.org/index.php?threads/the-ultimate-guide-to-content-creation-and-use-for-the-terraria-workshop.100652/#advancedlanguagepack)中提到的 `.csv` 文件，查看所有的本地化键。

请注意，模组本地化键与原版格式不同。如示例模组中的 `PartyZombie` 有本地化键 `Mods.ExampleMod.NPCs.PartyZombie.DisplayName`。写码时要注意，模组内容的键名不一定遵守默认的格式。

### 简化作用域声明
如果用于换元的键与其所在的值有重合的作用域，相同的部分可以被省去。例如，在[示例模组本地化文件](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Localization/en-US.hjson)中，`Mods.ExampleMod.ExamplePetItem.DisplayName` 的值是 `"{$Common.PaperAirplane}"`。在这个例子中，tModLoader知道在当前作用域检索，结果是键 `Mods.ExampleMod.ExamplePetItem.DisplayName` 的值被检索到并且被替换进去。在此情况下，`Mods.模组名` 可以被省去。

## 格式化字符串
模组作者可以使用[字符串格式化](https://learn.microsoft.com/en-us/dotnet/api/system.string.format?view=net-7.0#insert-a-string)在翻译中给要填的文本留出空位。这是C#的功能。你可以用方法 `string.Format` 或 `Language.GetTextValue` 来格式化字符串。章节[占位符](https://github.com/tModLoader/tModLoader/wiki/Contributing-Localization#placeholders)有关于此特性的更多信息。

### 占位符
你也许已经见过像 `Missing mod: {0} required by {1}` 这样的条目。其中的 `{0}` 和 `{1}` 就是应该根据代码填入文本的占位符，跟 C# 里常规的 `string.Format` 很像。写完翻译条目后，你可能需要打开游戏看看占位符有没有放在正确的地方。

### 往本地化中传入值
许多翻译条目中有类似于 `{0}`，`{1}` 或 `{MyParam}` 的占位符，表示模组作者可以往这些地方传值。比如，键 `CommonItemTooltips.IncreasesMaxMinionsBy` 对应这个值 `Increases your max number of minions by {0}`。为了在饰品中使用它，我们要提供一个填入 `{0}` 的数值。

首先，在 `hjson` 文件中，把这条翻译放进我们的物品描述中：
```
ExampleMinionBoostAccessory: {
	DisplayName: 仆从增幅器
	Tooltip:"{$CommonItemTooltip.IncreasesMaxMinionsBy}"
}
```

接下来，我们需要将要传入的值与这条描述“绑定”。这个饰品提高3仆从上限。为了传入这个数值，我们重写属性 `Tooltip` 并调用方法 `WithFormatArgs`；这会将占位符替换成你输入的值。推荐使用一个 `static readonly` 的字段来储存此类数据。在下面这个例子中，`MaxMinionIncrease` 被用在了两个不同的地方。用字段储存数据允许模组作者同步更改实际效果与描述，避免打错字或者描述与效果不一致。用 `readonly` 则是为了防止在运行时以外修改其值，进而打乱 `WithFormatArgs`。

```cs
public class ExampleMinionBoostAccessory ：ModItem
{
	public static readonly int MaxMinionIncrease = 3; // 以一个静态字段储存数值
	public override LocalizedText Tooltip => base.Tooltip.WithFormatArgs(MaxMinionIncrease); // 重写Tooltip并传入数值
	public override void UpdateEquip(Player player) {
		player.maxMinions += MaxMinionIncrease; // 将玩家的仆从上限提高3
	}
	
	// 其它代码...
}
```

### 多个占位替换
当一个本地化条目中包含多个替换引用时，可能会有替换名重复的问题。例如，一个描述用了 `CommonItemTooltip.IncreasesMaxManaBy` 和 `CommonItemTooltip.IncreasesMaxMinionsBy` 的饰品会有两个占位符 `{0}`。直接传值是无效的。模组作者可以使用特殊语法修改特定替换中的占位符。在一个换元键后加上 `@数值` 可以使其中的占位符增加其所声明的 `数值`。简单来说，就是 `{$键@增加的数值}`。[示例胸甲](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Armor/ExampleBreastplate.cs)是个好例子：

**已有的CommonItemTooltip条目**
```
"CommonItemTooltip": {
	"IncreasesMaxManaBy":"Increases maximum mana by {0}",
	"IncreasesMaxMinionsBy":"Increases your max number of minions by {0}",
	// 其他条目
```

**ExampleMod/Localization/en-US.hjson**
```
ExampleBreastplate: {
	DisplayName: Example Breastplate
	Tooltip:
		'''
		This is a modded body armor.
		Immunity to 'On Fire!'
		{$CommonItemTooltip.IncreasesMaxManaBy}
		{$CommonItemTooltip.IncreasesMaxMinionsBy@1}
		'''
}
```

**ExampleMod/Content/Items/Armor/ExampleBreastplate.cs**
```cs
public class ExampleBreastplate ：ModItem
{
	public static readonly int MaxManaIncrease = 20;
	public static readonly int MaxMinionIncrease = 1;
	public override LocalizedText Tooltip => base.Tooltip.WithFormatArgs(MaxManaIncrease, MaxMinionIncrease);
	public override void UpdateEquip(Player player) {
		player.buffImmune[BuffID.OnFire] = true; // 使玩家免疫“着火了!”
		player.statManaMax2 += MaxManaIncrease; // 使魔力上限增加20
		player.maxMinions += MaxMinionIncrease; // 使仆从上限增加1
	}
}
```

我们可以看出 `Tooltip.WithFormatArgs(MaxManaIncrease, MaxMinionIncrease)` 尝试将 `MaxManaIncrease` 同 `{0}` 绑定，并将 `MaxMinionIncrease` 同 `{1}` 绑定。这是因为 `{$CommonItemTooltip.IncreasesMaxMinionsBy@1}` 里加入了 `@1`，原本的占位符 `{0}` 被视为了 `{1}`，允许游戏将 `MaxMinionIncrease` 的值绑定到正确的位置，显示出物品描述。

或许这看着有点复杂，你可能觉得“我不管什么替换，直接写出描述不是更简单吗?”，若使用得当，替换是大有优势的。有了这些已有的条目，模组的许多文本将自动完成本地化。这还能显著减少人工失误。

更复杂的示例参见[ExampleStatBonusAccessory.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Accessories/ExampleStatBonusAccessory.cs)和与之对应的[en-US.hjson](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Localization/en-US.hjson#L164)

### 为动态内容组合翻译

少数情况下，你需要引用其它模组的翻译，却无法创建指向特定内容的翻译，因为需要翻译的内容是在运行时生成的。

**建议：**
> 避免用某种语言的语法来组合翻译，因为在其它语言中可能就会出错。相反，你应该尽可能使用独特且详尽的翻译。比如说，你也许会用 `你`，`是` 和 `谁` 三条文本拼成一句话 `你是谁?`，但翻译成英语时，这句话会被组合成 `youarewho?` 而不是正确的 `Who are you?`，因为你是逐字拼接的。更合适的做法是为这句话添加一条独有的翻译 `SomeKey:"你是谁？"`，这样它可以被翻译为 `SomeKey:"Who are you?"`

一个典例是“为所有弹药添加对应的无限弹药”。`WithFormatArgs` 能接受 `LocalizedText` 作为参数。你也可以重写一个 `LocalizedText` 属性以返回一个完全不同的 `LocalizedText`。（见下）

```
InfiniteAmmoItem.DisplayName:"Infinite {0}"
```
```cs
public class InfiniteAmmoItem ：ModItem
{
    Item baseAmmoItem;
    
    public override LocalizedText DisplayName => base.DisplayName.WithFormatArgs(baseAmmoItem.DisplayName);
    public override LocalizedText Tooltip => baseAmmoItem.Tooltip;
}
```

### 在ModConfig中的使用
`ModConfig` 的元素的 `Label` 和 `Tooltip` 也可以利用文本换元。它们的值可以通过特性 `LabelArgs` 和 `TooltipArgs` 分配给对应的翻译。注意，以“$”开头的文本会被当作本地化键。[ModConfigShowcaseLabels.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/Configs/ModConfigShowcases/ModConfigShowcaseLabels.cs)中的 `InterpolatedTextA`、`InterpolatedTextB` 和 `InterpolatedTextC` 展示了这一用法。

## 复数化
现代汉语采用词汇手段（名词前加数词和量词）和语法手段（名词后加“们”）表示名词的复数，故不存在复数化问题，删除其格式即可。

由汉语翻译成其它语言时则要注意这一点。比如：汉语的“{0} 分钟前”翻译成英语是“{0} minutes ago”；这样能适配大多数情况，但如果传入的“分钟”值是 `1`（单数），“minutes”就错了，需要改成“minute”。

除了常规占位符换元，tModLoader 还支持基于语言的基础复数化。回到上面的例子，其英语的复数化可以写成 `{0} {^0:minute;minutes} ago`，其中 `{0}` 是分钟数，`{^0:minute;minutes}` 就告诉游戏去检查 0 号占位符接受的值，再根据语言规则从 `minute` 和 `minutes` 中选一个。

对于英语、德语、意大利语、西班牙语和葡萄牙语，值为 `1` 时用第一形态，其他时候用第二形态；对于法语，值为 `0` 或 `1` 时都用第一形态，其他时候用第二形态。波兰语和俄语的规则比较复杂，参见[ Unicode 语言复数化规则](https://www.unicode.org/cldr/charts/43/supplemental/language_plural_rules.html)。tModLoader 根据这个表中“cardinal”规则的顺序选择形态。

## 聊天标签（Chat tag)
本地化值中可以加入颜色和物品图标等（译注：可以参考[泰拉瑞亚中文维基](https://terraria.wiki.gg/zh/wiki/%E8%81%8A%E5%A4%A9)）聊天标签。参考[示例模组的本地化文件](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Localization/en-US.hjson)中的 `ExampleTooltipsItem`。

## NetworkText
多人模式下，每个客户端显示的文本应该同客户端选择的语言相同，而不是按照服务端语言来。类 `NetworkText` 就可实现这一目标。处理网络消息的方法需要文本时会接受一个 `NetworkText` 参数，可以用本地化键或 `LocalizedText` 构造。具体使用方法参见其文档和示例模组。

## 获取本地化的时机
在模组加载的初期是无法获取本地化值的。举个例子，如果很早就 `string text = Language.GetTextValue("某个.本地化.键");`，只会获取到“某个.本地化.键”，而不是它对应的值。此时 `Language.GetText` 也只能返回默认值。

根据经验，`SetupContent` 及以后提取本地化值是比较稳妥的，也就意味着 `SetStaticDefaults` 和 `PostSetupContent` 是获取 `LocalizedText` 实例的好时机。在 UI 代码中尤为重要——这就是为什么模组一般在 `PostSetupContent` 时初始化 `UIState`。

# 自动更新本地化
tModLoader会在有新内容或本地化键加入时自动更新 `.hjson` 文件。英语的文件 `en-US.hjson` 会被用作其它语言的模板，注释和排版将会自动继承。

注意，为了效率，游戏只会在它认为合适的时候更新本地化文件。例如，模组必须被放在 `ModSources`文件夹里且在本地生成；本地化文件只会在其修改时间早于其模组或其模组引用的模组时更新。当心，如果你加载旧版的 `.tmod` 文件，你的 `.hjson` 文件的内容也可能会被换成旧版的，推荐使用Git或手动备份进行版本控制。

## 加入新内容
当模组作者向模组中添加内容时，就拿一个 `ModItem` 来说，一开始并没有被本地化。模组作者应该生成并重载模组。一旦重载完成，`.hjson` 文件将会自动更新。英语的文件 `en-US.hjson` 会包含所有新内容的默认本地化条目。非英语的文件也会包含一样的条目，但都是注释。译者需要修改 `.hjson` 文件，填入翻译，保存（记得以 `UTF-8` 编码保存），重新生成并加载模组。

## HJSON语法
`.hjson` 文件包含HJSON数据。与JSON相似，但是可读性更高。详细语法参见[Hjson官网](https://hjson.github.io/)，你也可以看下面的示例初步了解一下。

### 多行文本

如果文本需要换行，使用下面的语法。确保缩进一致：

```
			SomeKey: 
			'''
			这条翻译有两行。
			这是第二行!
			'''
```
你也可以使用 `\n` 作为备选方案，但从可读性考虑，并不推荐使用此方法。使用 `\n` 换行时也需要双引号。tModLoader会在自动更新本地化文件时将这种方案转换为上面那一种。
```
			SomeKey:"这条翻译有五行，可读性低。\n 这是第二行!\n 这是第三行!\n 这是第四行!\n 这是第五行!"
```

### 特殊字符

如果一条翻译要以 `{}[],:` 或空格开头，需要将其以双引号包裹。其它情况下双引号可以省略。如果你需要显示 `"`，可以使用 `\` 转义或多行文本的语法：
```
ExamplePetBuff: {
	DisplayName:"{$Mods.ExampleMod.Common.PaperAirplane}"
	Description: '''"让它成为你的示例宠物！"'''
}
```

### tModLoader的HJSON特性

#### 颜色

`[c/color:text]` 可显示带颜色的文本。  
`color` 是16进制颜色代码。  

例：

```
		Yes:"[c/008000:yes]"
		No:"[c/FF0000:no]"
```
显示时，“yes”是绿色的而“no”是红色的。

#### 物品

`[i:ItemID]` 和 `[i:ItemClassName]` 可以在消息中显示物品。  
`ItemID`是物品的 `type`。由于模组物品没有固定的 `type`，你可以用 `[i:ModName/ItemName]`。  
`ModName` 是模组的类名，`ItemName` 是物品的类名。

`[i/pPrefixID:ItemID]` 可以显示带前缀的物品。  
`PrefixID` 是前缀的 `type`。  

`[i/sStack:ItemID]` 可以显示特定堆叠的物品。  
`Stack` 是物品的堆叠数。

例：
```
		Label:"[i:ImproveGame/StarburstWand] 超模启动！"
		Tooltip:"[i/p57:HiveBackpack]是个有趣的饰品但[i/s1145:2]只是土块"
```
在这个例子中，`Label` 将会显示成 `（星爆魔杖的物品图标）超模启动！`，`StarburstWand` 是*更好的体验*中一个 `ModItem` 的类名。  
`Tooltip` 中会有一个 `无情的 蜂巢背包` 和一个堆叠到1145的 `土块`。

#### 键位

`<键位名称>` 可以显示该按键在目标语言中的名称，仅支持`<left>`左键和`<right>`右键。  
`键位名称` 是键位的内部名称。

例：
```
		Tip:"<right>使用特殊攻击"
```
`<right>` 会被显示为目标语言中的“右键点击”。

## 注释
`.hjson` 文件可以包含多种注释。tModLoader用两种HJSON注释表达不同的含义。

以 `#` 开头的注释可被用做提示。它们需要被置于对应键的上一行。否则就有可能在本地化文件自动更新后消失或错位。

例：
```
...
			ExampleCanStackItem: {
				DisplayName: Example CanStack Item: 礼物袋
				# 引用一个指向游戏语言对应的“右键以打开”文本的键
				Tooltip:"{$CommonItemTooltip.RightClickToOpen}"
			}
...
```

英语文件中的此类注释会被自动复制进其它语言的文件，可以用于向译者说明情况。

以 `/* */` 包裹或以 `//` 开头的注释被tModLoader用于指示非英语文件中未翻译的键。译者可以将标出的值翻译并移除注释。模组作者**不应该**将它们作为常规注释，因为它们可能在自动更新时丢失。

## 本地化文件名
tModLoader会尝试将模组里的所有 `.hjson` 文件加载为本地化文件。如此一来，本地化文件可以被放在任何路径下。但我们习惯将它们放在模组的根目录下一个叫做“Localization”的文件夹里。模组生成器遵循此习惯生成 `Localization/en-US.hjson`。

文件名的开头或包含此文件的文件夹名必须是一个有效的文化编码（culture code) 以指明其语言。

### 文化（语言）
tModLoader支持以下被称之为文化（culture）的语言：英语（en-US）、德语（de-DE）、意大利语（it-IT）、法语（fr-FR）、西班牙语（es-ES）、俄语（ru-RU）、汉语（zh-Hans）、葡萄牙语（pt-BR）、或波兰语（pl-PL）。这些代号用于指明 `.hjson` 文件所属的语言。要添加语言支持，参见[添加新语言](#添加新语言）。

### 前缀
模组作者可以使用一种特殊文件名格式让文件中所有的本地化条目共享同一个前缀。此特性最常见的用途是省去 `Mod.模组名` 条目。这样该文件就少了几层缩进也更容易编辑了。绝大部分模组不会用到它们本模组前缀以外的值。

比如说，一个名为 `Localization/en-US_Mods.ExampleMod.hjson` 的文件会继承 `Mods.ExampleMod`，意味着此文件里的所有条目可以省去 `Mods` 和 `ExampleMod`，直接从下一级开始。

前缀的格式遵循以下规则：首先以文件夹，再是以下划线分隔。语言确定以后，剩下的部分将被作为前缀。下面的这些例子都是用于汉语且以 `Mods.ExampleMod` 作为前缀的文件名。

```
Localization/zh-Hans_Mods.ExampleMod.hjson
Localization/zh-Hans/Mods.ExampleMod.hjson
zh-Hans_Mods.ExampleMod.hjson
zh-Hans/Mods.ExampleMod.hjson
Localization/CoolBoss/zh-Hans_Mods.ExampleMod.hjson
```

### 非本地化 `.hjson` 文件
文件名中不含语言代码的 `.hjson` 文件不被视为本地化文件。同时，文件名含有语言代码，但格式不对应英语文件的 `.hjson` 文件也不会作为本地化文件加载，还会被重命名为 `原文件名.legacy`。如果你发现 tModLoader 这样重命名了文件，请检查本地化格式是否符合标准。

## 多个同语言文件
模组作者可以用多个 `.hjson` 文件来管理翻译（尤其是当本地化条目非常多时）。假设有一个内含 `en-US_Mods.ExampleMod.Items.hjson` 和 `en-US_Mods.ExampleMod.hjson` 的模组，文件 `en-US_Mods.ExampleMod.Items.hjson` 可以存放所有物品的本地化条目，其它文件放剩下的本地化条目。新增内容的本地化条目会被自动添加进*含有与其最相似条目的* `.hjson` 文件。

如果你要分割本地化文件，仅需编辑英语的文件再重新生成并加载模组。其它语言的文件将会自动调整为相同的格式。

# 添加翻译键
新内容的本地化条目会自动添加进 `.hjson` 文件里，但也可以添加自定义的键。

**注意**：请不要在本地化键中使用空格或其他特殊字符。

## 手动添加键
要添加自定义的键，遵循HJSON语法即可直接向（英语的）本地化文件中添加。比如，ExampleMod有一个叫做“Common”的类别，因为没有被tModLoader的类型所使用，其中的条目都是被手动添加的。

例如，这是原本的 `.hjson` 文件：
```
Mods: {
	ExampleMod: {
    		Common: {
			PaperAirplane: 纸飞机
		}
        
		Currencies.ExampleCustomCurrency: 示例货币
   	 }
}
```

我们可以在 `PaperAirplane` 下新起一行，添加另一个 `Mods.ExampleMod.Common.名称` 条目。也可以用和类别 `Common` 一样的语法添加一个 `Uncommon` 类别。还可以像 `Currencies.ExampleCustomCurrency` 一样，不单独声明类别。下面展示了这些方法：
```
Mods: {
	ExampleMod: {
    		Common: {
			PaperAirplane: 纸飞机
        		HotDog: 热狗
		}
        
 		Uncommon: {
            		Helicopter: 示例直升机
       		}
        
		Currencies.ExampleCustomCurrency: 示例货币
        	Currencies.DirtCurrency: 土堆
    	}
}
```

请注意，当本地化文件被自动更新时，tModLoader会决定如何排版，导致条目的位置发生变化，但不会丢失。

## 添加可本地化的属性
模组作者可以向他们的类中添加 `LocalizedText` 属性以达到多种目的。正确地实现之后，这些属性会被自动添加进 `.hjson` 文件里且可以被本地化。

[示例治疗药水](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Consumables/ExampleHealingPotion.cs)展示了一种用法。`ExampleHealingPotion` 把一个叫做 `RestoreLifeText` 的 `LocalizedText` 属性用于动态物品描述。

基本操作是：

1. 向你的类中添加一个静态 `LocalizedText` 属性
2. 在 `SetStaticDefaults` 中用 `this.GetLocalization` 为那个属性分配一个值
3. 在需要的地方用那个属性获取翻译

例：
```cs
public class ExampleHealingPotion ：ModItem
{
	// 第一步：创建一个静态LocalizedText属性
	public static LocalizedText RestoreLifeText { get; private set; }
	public override void SetStaticDefaults() {
		// 第二步：将RestoreLifeText的值设为GetLocalization的结果
		RestoreLifeText = this.GetLocalization(nameof(RestoreLifeText));
	}
	public override void ModifyTooltips(List<TooltipLine> tooltips) {
		TooltipLine line = tooltips.FirstOrDefault(x => x.Mod == "Terraria"&& x.Name == "HealLife");
		if （line != null) {
			// 将文本改为“回复生命上限一半（快速治疗时为四分之一）的生命”
			// 第三步：获取翻译。因为要替换占位符，这里用了方法Format, 但其属性Value也是可以用的
			line.Text = Language.GetTextValue("CommonItemTooltip.RestoresLife", RestoreLifeText.Format(Main.LocalPlayer.statLifeMax2 / 2, Main.LocalPlayer.statLifeMax2 / 4));
		}
	}
}
```

在上面的例子中，除了 `DisplayName` 和 `Tooltip`，`.hjson` 文件里还会自动生成 `RestoreLifeText` 的条目。然后模组作者就能更新这些条目：

```
ExampleHealingPotion: {
	DisplayName: Example Healing Potion
	Tooltip:""
	RestoreLifeText:"{0} （{1} when quick healing)"
}
```

**注意**

`LocalizedText` 实例从设计上来说要以静态储存。理想情况下你应该在加载时注册并获取它。`ExampleHealingPotion` 的例子中，`LocalizedText` 在 `SetStaticDefaults` 里注册并缓存进属性 `RestoreLifeText`。如果缓存不了，也可以以一点性能作为代价，每当需要时就提取一次。

为了自动在 `.hjson` 里生成与 `LocalizedText` 属性对应的条目，至少要在加载期间访问一次对应的属性。

### 从LocalizedText属性中提取文本

在类中，`LocalizedText` 属性可被用于向玩家显示文本：

```cs
Main.NewText(SomeLocalizedTextProperty.Value);
```

如果要显示的文本中有占位符，可以用方法 `Format` 填入值，该方法接受与文本中占位符数量相同的参数：


```cs
Main.NewText(SomeLocalizedTextPropertyWithPlaceholders.Format(Main.LocalPlayer.statLifeMax2, Main.LocalPlayer.statManaMax2));
```

### 可继承的本地化属性

使用继承时，可以在子类中用仅可 `get` 的属性或非静态属性达到与静态属性一样的效果（子类不会继承父类的静态属性）. 继承的性质允许你复用逻辑和翻译，保持代码与 `.hjson` 文件整洁，减少不必要的重复。

以物品为例，想象一下，一个模组里的数个物品共用一个基类。基类中可以有一个 `LocalizedText` 属性给每一个子类。这个属性得在 `SetStaticDefaults` 时被访问以自动添加进 `.hjson` 文件里。

**基类：MyBaseClass** 
```cs
public LocalizedText SpecialMessage => this.GetLocalization(nameof(SpecialMessage));
public override void SetStaticDefaults() {
	_ = SpecialMessage;
}
```

如果类 `ClassA` 和 `ClassB` 都继承自 `MyBaseClass`，`.hjson` 文件中会自动填入键 `SpecialMessage` 的条目：

```
ClassA: {
	DisplayName: Class A 
	Tooltip:""
	SpecialMessage: Mods.ExampleMod.Items.ClassA.SpecialMessage
}
ClassB: {
	DisplayName: Class B
	Tooltip:""
	SpecialMessage: Mods.ExampleMod.Items.ClassB.SpecialMessage
}
```

如果子类重写了 `SetStaticDefaults`，记得保留 `base.SetStaticDefaults()` 来执行父类的代码（以访问LocalizedText属性）。

`GetLocalization` 生成的键的格式是：`Mods.{模组名}.{类别名}.{内容名}.{后缀}`。如果需要一个不符合此格式的键，应当改用 `Language.GetOrRegister("完整的键");`。注意，由于C#的设计，`GetLocalization` 必须以 `this.` 调用，不可省略。通过在被继承的属性中使用完整的键，该属性的翻译可以用单个键保存（而不是为每个子类创建一个键），需要不同翻译的子类仍可以重写该属性，通过 `this.GetLocalization` 使用它们自己的键。

### 另一个示例

[示例箱子](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleChest.cs)是一个使用自定义键的例子。默认情况下，tModLoader会为每个 `ModTile` 注册一个 `Mods.{模组名}.Tiles.{内容名}.MapEntry` 格式的键。这使得为物块添加地图条目变得简单。（地图条目控制大地图中鼠标停留在物块上时显示的文字。）然而，`ExampleChest` 需要两个地图条目。新的键可以被轻易地添加进本地化文件中：

```cs
AddMapEntry(new Color(200, 200, 200), this.GetLocalization("MapEntry0"), MapChestName);
AddMapEntry(new Color(0, 141, 63), this.GetLocalization("MapEntry1"), MapChestName);
```

这样做的结果就是本地化文件中多出了这些键，可以被翻译成其它语言：
```
ExampleChest: {
	MapEntry0: Example Chest
	MapEntry1: Locked Example Chest
}
```

在这个文件的另一个地方，这些键以 `GetLocalization` 被动态获取：
```cs
public override LocalizedText DefaultContainerName(int frameX, int frameY) {
	int option = frameX / 36; // 用 frameY 判断箱子处于第几帧，对应不同的状态
	return this.GetLocalization("MapEntry" + option);
}
```

这种方法对动态的键很有用。

# `ModType` 与 `ILocalizedModType`
有实现自定义 `ModType` 的模组可以实现 `ILocalizedModType` 来轻松地推行本地化。仅需在类继承后面加上 `，ILocalizedModType` 并添加 `public string LocalizationCategory =>“自定义类别名称";` 以实现属性 `LocalizationCategory`。对于你自定义的 `ModType` 中的每一个 `LocalizedText`，你可以使用 `public virtual LocalizedText 随便什么名字 => this.GetOrAddLocalization(nameof(随便什么名字), 默认显示的随便什么名字);` 以允许它们像已有 `ModType` 里的 `Localizedtext` 属性一样成为 `.hjson` 文件中分好类的属性。

跟前面一样，在模组加载时访问自定义的 `LocalizedText` 才能使它们自动填入 `.hjson` 文件。如果本来没有实现，在 `ModType.SetupContent` 里 `_ = Sometext;` 即可，其中 `SomeText` 是需要填写的 `LocalizedText`。

**深入解析：**`GetLocalization` 是一个用于简化代码和防止打错字的helper方法。其等同于传入了完整键的方法 `Language.GetOrRegister`。相似的，`GetLocalizedValue` 等同于对应写法的 `Language.GetTextValue`。若要获取生成的键，可以使用 `GetLocalizationKey`。

`GetLocalization` 和 `Language.GetOrRegister` 有一个可选的 `makeDefaultValue` 参数，决定了键不存在时默认生成的值。例如，传入 `() =>""` 会导致默认值变为一个空字符串而不是键本身。若不必进行本地化或内部名已经写得很清楚，模组作者可以传入 `PrettyPrintName` 以显示加了空格的内部名（`MyItem` -> "My Item"）。

# 添加新语言
默认情况下，tModLoader仅会为模组更新已有的 `.hjson` 文件。要添加新的语言，仅需新建一个文本文档，复制现有的本地化文件名称并修改语言代号。文件名或其路径中需要包含对应的语言代号：英语（en-US）、德语（de-DE）、意大利语（it-IT）、法语（fr-FR）、西班牙语（es-ES）、俄语（ru-RU）、汉语（zh-Hans）、葡萄牙语（pt-BR）、或波兰语（pl-PL）。创建好文件并确保其有正确的文件扩展名 `.hjson` 之后，重新生成模组。这样该文件就会更新出可供翻译的条目，其它文件也会依据英语的 `.hjson` 文件的结构一并生成。

非英语本地化文件的注释和结构都从英语的文件继承。如果你要向译者致谢，将他们写进英语文件顶部的一条注释中，这样那条注释会被传到其它语言的文件里。

如果你分割了本地化文件，也仅需编辑英语文件。相似地，从英语文件中移除的键也会从其它文件中移除。总的来说，模组作者一般仅需对英语文件进行操作，其它语言文件将会自动调整。