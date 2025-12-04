***
这篇教程已经更新至1.4  
如果你需要1.3版本的老教程, 请点击[这里](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-Guide/9c8ec569fb957e9ad34edb565e653a805811b5a6)  
**译注:这篇不提供翻译**
***

你需要做的第一件事情是决定你希望用哪款程序写代码  
基本上是两个选择，**文本编辑器**或者**IDE**  
如果你对二进制逻辑和设计的概念完全陌生，你可能想先从文本编辑器开始，这样可以掌握基础知识，并能够处理简单的代码，而不会被IDE的界面和工具弄得手忙脚乱。  
对于其它更多的情况，你会更想使用**集成开发环境IDE**  
集成开发环境（IDE）是一种软件，它为特定编程语言提供了一个便利的界面，而我们需要用到的编程语言是C#  
一款IDE可以做文本编辑器能作到的任何事情，因为文本编辑器是IDE的一个部分

你还需要按照[这些操作指引](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-developers#net-sdk)安装".NET 8.0 SDK"  
[译注-此处原文](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-developers#net-sdk)

这篇教程会让你熟悉tModLoader模组开发，并帮助你制作第一个模组  
在此之前，请先阅读参考[基础-先决条件](https://dpapyru.github.io/LogSpiral/viewer.html?file=1-%E5%9F%BA%E7%A1%80/0-Basic-Prerequisites%20%E5%9F%BA%E7%A1%80-%E5%85%88%E5%86%B3%E6%9D%A1%E4%BB%B6.md)   
[译注-此处原文](https://github.com/tModLoader/tModLoader/wiki/Basic-Prerequisites)

# 你的第一个模组
为了入门，我们会先制作一个非常简单的模组，让你熟悉tModLoader的模组是怎么创造的。

## 生成一个模组框架
首先，我们会用tModLoader来创建一个基础模组框架  
打开tModLoader，然后打开"创意工坊"目录，打开"开发模组"目录  
点击"创建模组"按钮，然后填充那些输入框  

比如，`TutorialMod`，`教程模组`，`新人开发者`  
以及 `TutorialSword` (可选)  
(译注：依次是**模组内部名**、模组显示名、模组作者署名  
以及默认的模板剑**类名**(如果不填写就不会生成模板剑))  

最后，点击"生成"  
如果有报错信息弹出就照着提示信息修改  
否则你会回到模组源码目录

> [!注意]
> 如果你想制作一个后续发布到创意工坊的模组  
它需要一个独特的 **模组内部名** 而不是 `TutorialMod`.  
 这需要一个和创意工坊上已有模组都不一样的内部模组名  
 否则你将无法发布  
 如果你需要给一个已经存在的模组重命名的话，可以参考  
 [重命名一个模组](https://github.com/tModLoader/tModLoader/wiki/Workshop#renaming-a-mod)   
[译注-此处原文](https://github.com/tModLoader/tModLoader/wiki/Workshop#renaming-a-mod)

![](https://i.imgur.com/X5x90vD.png)    

## 模组框架内容
点击"开发模组"中的"打开源码文件夹"按钮以打开`ModSources`文件夹  
你也可以在你的文件浏览器中导航到`Documents\My Games\Terraria\tModLoader\ModSources\`以打开`ModSources`文件夹  
接下来打开你的模组所在的文件夹，如果你照着教程填写信息，那里会有个叫作`TutorialMod`的文件夹  
这个文件夹包含了所有和这个模组相关的代码  
目前，这里应该会有由模组框架生成器添加的9个基础文件。  
以下是对这些基础文件的解释：    
1. **[模组内部名].cs** - 这个就是 `Mod` 类  
 它是对于所有模组的核心文件， 在每个模组中有且仅有一个`Mod`类
 对于简单的模组，这里面可能没多少内容，但是这个类里可以发生许多全局性的事件(译注：我没太看懂，后续再改()) 
2. **description.txt** - 包含了模组的描述文本，在游戏的模组目录里点击`更多信息`按钮以查看
3. **description_workshop.txt** - 这包含了会显示在[Steam 创意工坊](https://steamcommunity.com/app/1281930/workshop/)上的模组描述内容
这个文件的内容可以以[BBCode 格式](https://steamcommunity.com/comment/ForumTopic/formattinghelp)编写，以给你的模组制作一个更令人印象深刻的主页来让用户对它更感兴趣  
一个展现BBCode 格式有哪些可能的例子是[星海苍穹](https://steamcommunity.com/sharedfiles/filedetails/?id=2563862309)模组的创意工坊页面   
4. **build.txt** - 包含 版本, 作者, 以及模组的显示名  
也可以包含一些其它的[内容](https://github.com/tModLoader/tModLoader/wiki/build.txt)  
是必要的  
[译注-此处原文](https://github.com/tModLoader/tModLoader/wiki/build.txt)  
5. **icon.png** - 在游戏中显示的80x80图标  
你可以制作一个更详细或者更高分辨率的`icon_workshop.png`图标版本在Steam 创意工坊页面中使用  
这个文件最大会是512x512
6. **icon_small.png** - 在图鉴的模组筛选器以及模组配置列表中会使用到的30x30小图标  
 为了和已有图鉴图标的风格融洽，你可以添加一个40%不透明度的黑影在图标右下方  
  可以参考 [ExampleMod的小图标](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/icon_small.png) 作为示例  
   如果你不修改这个文件，这个现有的文件不会使用，在图鉴中会显示一个"?"
7. **[模组内部名].csproj** - 一个给Visual Studio调试你的项目的项目文件  
调试是一个极其有用的手段，需要一定的学习成本  
不要删掉这个文件
8. **Properties/launchSettings.json** - 和`[模组内部名].csproj`相关联，包含了到tModLoader文件的路径，用于调试  
不要删掉这个文件，你后续会用到它
9. **Content/Items/[物品名].cs** - 一个简单的剑类物品  
 这是一个示例，教你怎么制作 `ModItem` 类 
10. **Content/Items/[物品名].png** - 相应的贴图  
11. **Localization/en-US_Mods.[ModName].hjson** - 包含了你的模组内容的英文本地化文本  
它目前包含了那把示例剑的显示名和物品描述，这个文件会随着你的新内容的添加字段添加一些条目. 参考 [本地化教程](https://github.com/tModLoader/tModLoader/wiki/Localization) 了解关于本地化的更多内容，以及如何给其它语言制作本地化  
[译注-此处原文](https://github.com/tModLoader/tModLoader/wiki/build.txt)

![](https://i.imgur.com/tTmp0bq.png)    

## 学习如何构建模组
我们现在有个准备好用于构建的模组  
启动tModLoader然后打开"创意工坊"目录  
打开"开发模组"目录  
你会看见你刚创建的模组的条目  
现在点击"构建并重新加载"按钮  
如果没有出现任何错误，你的模组会出现在模组目录当中！

![](https://i.imgur.com/unoLL8h.png)

现在在游戏中，造一个工作台，挖十块土u 
你就可以看见你能造一把新的剑了！

![](http://i.imgur.com/UQb3tXq.png)

 哇，简直是非常Amazing啊！但是50伤不是很够的样子.   
 我们现在开始我们第一次实打实地编程，打开 `ModSources\[模组内部名]\Content\Items\TutorialSword.cs` 文件  
 找到写着 `Item.damage = 50;` 的那一行，然后把50改成100  
 现在保存文件! 记住不要弄混你在基础-先决条件课里学的语法 

接着，打开 `ModSources\[模组内部名]\Localization\en-US_Mods.[模组内部名].hjson` 文件  
这是显示我们的英文物品名和物品描述给用户的地方  
将`DisplayName: Tutorial` 修改为 `DisplayName: My Tutorial Sword`, 然后修改 `Tooltip` 条目为 `Tooltip: My first sword`, 最后保存那个文件  
记住在default mod中使用的 `Tooltip` 条目是多行的 (在这里了解更多[多行内容语法](https://github.com/tModLoader/tModLoader/wiki/Localization#multiline))  
这就是为什么它看起来和 `DisplayName` 条目如此不同  
这里包含 `'''` 在开头和结尾的条目会被替换成`My first sword`  
因为我们只需要一行  
(译注：中文的可以**复制粘贴**(不要直接改)这里英文的文件，将en-US改为zh-Hans，记得去掉最后那个 - 副本，然后就可以写中文的内容了，如果在游戏中出现乱码就在vs的**高级保存选项**里保存为utf-8带签名编码，vs的高级保存选项参考[这篇](https://www.cnblogs.com/willingtolove/p/12121577.html)
还有就是记得确保你中文的条目在英文那边都有)

接着在游戏里，再次重新构建并加载然后获得那把剑，你应当看到它新的攻击值，新的物品名以及新的物品描述

最后，你的模组被打包为了一个 `.tmod` 文件叫作 `[模组内部名]`  
 在 `tModLoader\Mods`文件夹中  
 如果你想你的朋友玩你的模组，但是还不想发布它，就可以在这里找到你的模组发送给你的朋友，放到一样的目录下.  
 (或者你可以发布到创意工坊然后设置为 "仅朋友可见" 来确保它某种程度上还是私有的，这个方法可以在你发布更新的时候让你的朋友自动更新你的模组)

## 做点小实验

现在你可以修改其它物品的一些数值进行你的小实验  
记住，你需要保存你的改动然后点击 `构建并重新加载`  
以在游戏中看见你的改动

## 接下来的步骤

现在你有个拥有一把简单的剑的简单模组，是时候学点别的技术了  
可以慢慢了解你想做的东西并开展你的实验  
如果你需要其它模组开发者的帮助，可以打开论坛或者[Discord]
(https://discord.gg/tmodloader)  
(译注-以及[裙中世界](https://fs49.org)和相应的交流群921853970)  
(译注-以及[泰拉瑞亚Mod制作教程](https://dpapyru.github.io/)和相应的交流群960277607)  

你最好用原版已有的概念表达你的问题，比如，如果你好奇熔火之怒是怎么把木箭变成燃烧箭的，你应当提问"怎么像熔火之怒那样只在使用木箭为弹药的时候改变它的弹幕？"  
用这样的方式提问是最有效率的  

继续阅读以了解更多关于tModLoader以及如何进步的内容

# 我该怎么在我的模组里引用其它文件的内容？

其中一个模组开发者会问的第一个问题是如何让一个自定义武器发射一个自定义弹幕，或者其它类似的行为需要在你的模组中由一个类引用另一个类  
为了实现这个，我们需要使用`ModContent.SomethingType`函数
其中的"Something"可以是"Item", "Projectile", "NPC"等等  
比如，如果你想你的 `ModItem` 发射一个特定的 `ModProjectile`  
在你的`ModItem.SetDefaults`函数在写  
`Item.shoot = ModContent.ProjectileType<MyProjectileClassName>`  
相比之下，发射一个原版弹幕是这样写
`Item.shoot = ProjectileID.WoodenArrowFriendly`或者其它类似的

Note that when attempting to reference a modded class, you need to add a "using statement" referencing that classes namespace. For example, if you write `ModContent.ProjectileType<MyProjectile>()` in a class, and the `MyProjectile` class is in the `MyMod.Content.Projectiles` namespace, you need to add `using MyMod.Content.Projectiles;` to the top of the .cs file. A good IDE will [automate this process](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#show-potential-fixes) for you.

## More examples of referencing modded content
Here are more examples of referencing modded content. In all of these cases we are doing the same process, accessing a modded content ID through the appropriate method and using it where a content ID is expected. We use this values either is either as a method parameter or to assign a variable. In all of these cases there would also be appropriate using statements as well. You are not expected to understand the code below, it is just showing various examples of the pattern to give you a feel for how modded content is accessed and used in code.

```cs
Item.DefaultToStaff(ModContent.ProjectileType<Projectiles.SparklingBall>(), 16, 25, 12);
Item.shoot = ModContent.ProjectileType<ExamplePiercingProjectile>();
Projectile.NewProjectile(Projectile.GetSource_FromThis(), Projectile.Center, beamVelocity, ModContent.ProjectileType<ExampleLastPrismBeam>(), damage, knockback, Projectile.owner);
Banner = ModContent.NPCType<ExampleWormHead>();
itemLoot.Add(ItemDropRule.Common(ModContent.ItemType<ExampleItem>(), 1, 12, 16));
shop.Add<ExampleRocket>(Condition.NpcIsPresent(ModContent.NPCType<ExamplePerson>()));
Item.DefaultToPlaceableTile(ModContent.TileType<Tiles.ExampleBar>());
TileID.Sets.CloseDoorID[Type] = ModContent.TileType<ExampleDoorClosed>();
Item.createTile = ModContent.TileType<ExampleCritterCage>();
```

# How do tModLoader 'hooks' work?

Firstly, they are technically not hooks. We simply call them hooks because it is easy. A 'hook' is a function you can use as a modder. Which hooks are available depends on the class you're working in. For example your `Mod` class has a **[Load Hook](https://docs.tmodloader.net/docs/stable/class_mod.html#ae174f640b4281fa62e475400aad4dad6)**, which is a function special to the `Mod` class. Every one of these functions is `virtual`, this means the function has a basic implementation but can be overridden by the modder if desired. This means when you want to use a hook, you _override_ it, this is why the word `virtual` is replaced with `override`. Since the _virtual_ (partial) implementation is overridden, that implementation will be lost. To see the standard implementation of hooks you should see the **[source documentation](http://tmodloader.github.io/tModLoader/)**.

Hooks are basically opportunities for mods to run code. Each hook is "called" at an appropriate time in the update loop of the game. For example, there is a hook called `ModItem.Shoot`, this hook is called each time the game determines that the weapon item should shoot a projectile. The modder "overrides" the "hook" by writing code and that code will be executed when the weapon item shoots a projectile.

## Hook Usage Example
Let's imagine you want to do something while an item is in the inventory, similar to how the Cell Phone item works. First, we open up the source documentation and search for the [ModItem Documentation](https://docs.tmodloader.net/docs/stable/class_mod_item.html). Having found this page, use `ctrl-f` to search the page for something related to what we want. In this case, searching for `inventory` and reading the results, you might find the `UpdateInventory` method. The documentation tells us that this "hook" lets us make things happen when this item is in the inventory, which is what we want. To use this hook, we copy the method signature into our ModItem class.    
```cs
virtual void Terraria.ModLoader.ModItem.UpdateInventory	(Player player)	
```
If you remember from above, we must change "virtual" to "override". We also must remember to trim the method name down. This code is in the ModItem class, so we can get rid of "Terraria.ModLoader.ModItem.". Finally, make sure you tell the computer what this `Player` class is. We do that by adding `using Terraria;` to the top of our .cs file. After adding opening and closing curly braces, we finally have our hook ready to write code in:    
```cs
override void UpdateInventory (Player player)
{
    // We write code here.
}
```
We can greatly simplify the process of overriding hooks by using [Visual Studio](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#override).    
Now that we have a hook in our `ModItem` class, we can add code inside it. The code we write will depend on the effects we wish to achieve. ExampleMod and the [Advanced Vanilla Code Adaption](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption) guide can be helpful for finding similar snippets of code to experiment with.

# Index and Type
There are two big concepts that both correspond to integers. These two usages of integers can be inadvertently mixed up by new modders leading to code that compiles but is buggy. 

In Terraria, all content has a unique identifier called a `Type`. This is an integer that lets the game uniquely identify different bits of content. For example, the type of the `Shuriken` projectile is the number `3`. We can use a projectiles `Type` to run code that should affect only projectiles of that type. For example, if we use the `GlobalProjectile.OnHitNPC` hook, we can check `if(projectile.type == ProjectileID.Shuriken)` and then run some Shuriken specific code, such as applying a debuff to the npc. Item, NPC, Projectile, Dust, and many more varieties of content in Terraria all operate using a `Type` identifier to identify the various varieties of content.

The second concept is `Index`. In Terraria, the game uses various arrays to hold all the active content in the world. For example, the `Main.projectile[]` array holds all the instances of all the projectiles currently in the game world. Each `Projectile` knows it's own index within that array by the `whoAmI` field.

Both `Type` and `Index` are integers, leading to a situation where new modders can make a big mistake using one or the other incorrectly. For example, a modder might make the mistake of thinking `Projectile projectile = Main.projectile[ProjectileID.Shuriken]` would retrieve the active Shuriken projectile, but it won't, it'll return whatever projectile is at that index. As a modder goes through different guides and examples, they will see proper usage of `Type` and `Index`. 

This diagram illustrates this point, showing how `Type` and `Index` are separate concepts while showing how they are stored in an array:     
![ProjectileArrayExplaination](https://user-images.githubusercontent.com/4522492/184989136-c83e4bcf-18a1-4cb5-b798-60b190be5591.png)    


# How are modded classes setup?

tModLoader provides a number of classes you can use to create your own mod content. You will base your own classes off of these by using what's called `class derivation` or `class inheritance`. To keep this simple, it basically means your class will use one of ours as its base. For example, your items will be based on ModItem: `MyItemClass : ModItem`, where the `: ModItem` denotes it inherits from the ModItem class, which is present in the Terraria.ModLoader namespace. (if you come from Java, this is the same as `extends ModItem`) This means everything we made for `ModItem` becomes available to you in your class, such as the [SetDefaults](https://docs.tmodloader.net/docs/stable/class_mod_item.html#a10b52a61d301eca52d3b30c3c989d835) hook. Note that you can only derive from one class, so a `ModItem` cannot be a `ModProjectile` and so forth. 

# Learning from Example Mod

Example Mod is a mod made by the tModLoader developers to show off various modding capabilities. It would be wise to enable Example Mod and play around with it for a while. Use a mod like [Cheat Sheet](https://steamcommunity.com/sharedfiles/filedetails/?id=2563784437) to spawn in its various items and find something it does that you want to learn. 

![image](https://github.com/tModLoader/tModLoader/assets/4522492/432af918-22ad-4cf7-b13b-1b265c66b73b)

Next, download the Example Mod source code. To do this, download [stable.zip](https://github.com/tModLoader/tModLoader/archive/refs/heads/stable.zip) and then find the ExampleMod folder within. Take that folder and place it in the ModSources folder next to the TutorialMod folder. 

![image](https://github.com/tModLoader/tModLoader/assets/4522492/f6899568-4e3d-4cfe-b867-a2aa3cd2876f)

You can also quickly look something up by exploring [stable ExampleMod directly on GitHub](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod). The "Go To File" search field at the left of the screen can be used to quickly find a specific file. Try typing "sword" into the search and you can see how you can quickly find relevant files.

![image](https://github.com/tModLoader/tModLoader/assets/4522492/26f8f518-3744-4bac-b99e-f593106d89d8)    

Find the thing you are interested and try to understand it. Hopefully it is easy to understand. You can also change things in your copy of Example Mod and build Example Mod in game to experiment.

Once you can handle modifying simple things in Example Mod or Tutorial Mod, you should be comfortable with the mod building process. Feel free to explore other guides or help for the next steps.

## Learning in steps

If you are new to modding, you are probably also new to programming itself and possibly the C# language. It is recommended to start with easy things and work your way up the ladder of difficulty. One of the easiest things to do would be a sword that can be swung to deal damage as shown above, and one of the hardest would be to create a fully functional boss fight. Here is a few suggestions to get started:
* First, try to familiarize yourself with how tModLoader works. Read the section 'How do tModLoader 'hooks' work?'
* Next, try modifying the tutorial sword to deal more damage, have more knockback, faster speed etc. You can also make it shoot things by setting `Item.shoot`, and control the speed with `Item.shootSpeed`
* You need to understand that modding is programming, it is C# and it is being familiar with the vanilla code. This means you should definitely follow free online courses to get a better understanding of the C# language or programming itself. A useful resource might also be the [Quick Terraria-specific C# crash course](https://docs.google.com/document/d/1xRz3kFNbewb8DI29AKXuyi6O327IcxlgihZ7sdK_IuE/edit?usp=sharing) (Unfortunately, much of this guide is broken due to broken links.). To get more familiar with the vanilla code, use our [Advanced Vanilla Code Adaption](Advanced-Vanilla-Code-Adaption) guide.
* If you feel confident enough, try making your own projectile and having your sword interact with it.
* With more confidence, you can start trying other things, such as making an enemy NPC.

**Here is a few things that would be considered difficult for most modders, and it is advised you start with easier things before attempting these:**
* A fully functional boss
* Comprehensive UI
* Code abstraction
* Modding info for entities, and interacting with it
* Completely custom AI for a projectile, NPC, pet... etc.

## Slowly learning

There are many resources available so you can become a better modder. First of all, this wiki. On the right side of this page you can find the wiki menu, which houses links to various different tutorials and guides that you can use. These are all separated into their own difficulty level, from basic being the easiest and expert being the hardest. Another source of information is the [modding section on TCF](https://forums.terraria.org/index.php?forums/general-mod-discussion.121/), but it is not very active. Many modders collaborate and ask questions on the [tModLoader Discord](https://discord.gg/tmodloader), if you are struggling with anything or have any questions, please come by! And lastly, a variety of helpful tools and guides is available on the [homepage](Home) of this wiki.

## Modding tips and guidelines
### Naming convention
Internal names do not support whitespaces, this means you need to name `My Super Sword` without spaces. People commonly just omit the spaces: `MySuperSword` but sometimes you'll also see `My_Super_Sword`. The former is called `pascal case` and the latter is called `snake case`. `MySuperSword`/`pascal case` is preferred because of how tModLoader automatically populates localization entries. Remember to use short and descriptive names; if you are making a sword it is likely you should use 'Sword' in the name. Naming convention mostly depends on who your work with/for (if you are employed etc.), if you work on your own it is obviously down to your personal preference. Good to note that `camel case` is similar to `pascal case`, but often you'll find with camel case that the first letter may be lowercase or capitalized and each subsequent concatenated word is capitalized such as `backColor` and `timeUtc`. 

### Keeping code tidy and organized
Though this is a more advanced topic (part of design patterns, which might be covered in expert tutorials later), it is useful to make sure you abstract your code properly. More on this in the code abstraction guide. For beginners, take this tip: after you've programmed something and it is finished, look at your code and ask yourself what is happening in every place. Now you should ask if the code is tidy. Try to find repeating parts of code and give it a dedicated method. Next, try to separate parts of your code by their logic and give them their own method as well, providing a useful descriptive name (see the previous tip) so it becomes easy to identify what that part of code is doing. This is a brief summary of a part of code abstraction.

### 给你的代码写注释
并不是什么时候都能很容易看出你的代码在干什么  
又或者，你希望给你自己或者协作者写个笔记  
你可以像这样写个单行注释`// 这是个注释`  
或者你可以像这样添加一整个注释块：
```cs
/*
 * 这是一个注释块
 * 可以有很多行！
*/
```
对于初学者，相当建议添加尽可能多的注释  
甚至是对于哪些你认为你已经理解得很好的内容  
这会在长期来看帮助你  
你也许会隔几个月重新回到项目，但是忘记某处代码是怎么工作的  

对于富有经验的开发者，下一个挑战是使用尽可能少的注释  
你的代码应当在写得足够简明，让其它人能只读代码就理解它的行为

顺带一提，不同的语言使用不同的方式注释  
比如`::`和`#`，对于C#，它使用上面展示给你的方式

# 发布你的模组
一旦你的模组是在工作状态，你就可以将你的模组发布到Steam 创意工坊  
这能保证你的模组对其它订阅了你的模组的tModLoader用户可用  
 [创意工坊指引](https://github.com/tModLoader/tModLoader/wiki/Workshop) 有关于这的更多信息