---
title: 第一个武器
author: 小天使
date: 2026-01-17
last_updated: 2026-01-17
difficulty: beginner
time: 15分钟
description: 包括C#最基础的教程
prev_chapter: DPapyru-快速开始构建Mod.md
next_chapter: null
topic: mod-basics
order: 2
colors:
  Mad: "#f00"
---

# 通过tModLoader生成的Mod——tModLoader初始武器

下面是tModLoader生成的默认的物品内容:

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace GreenHomeMod.Content.Items
{ 
	// This is a basic item template.
	// Please see tModLoader's ExampleMod for every other example:
	// https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod
	public class FristSword : ModItem
	{
		// The Display Name and Tooltip of this item can be edited in the 'Localization/en-US_Mods.GreenHomeMod.hjson' file.
		public override void SetDefaults()
		{
			Item.damage = 50;
			Item.DamageType = DamageClass.Melee;
			Item.width = 40;
			Item.height = 40;
			Item.useTime = 20;
			Item.useAnimation = 20;
			Item.useStyle = ItemUseStyleID.Swing;
			Item.knockBack = 6;
			Item.value = Item.buyPrice(silver: 1);
			Item.rare = ItemRarityID.Blue;
			Item.UseSound = SoundID.Item1;
			Item.autoReuse = true;
		}

		public override void AddRecipes()
		{
			Recipe recipe = CreateRecipe();
			recipe.AddIngredient(ItemID.DirtBlock, 10);
			recipe.AddTile(TileID.WorkBenches);
			recipe.Register();
		}
	}
}
```
