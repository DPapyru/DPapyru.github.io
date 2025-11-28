When learning to create mod items, it is beneficial learn the effect of various item properties by seeing how vanilla items achieve their desired effects. Below is a listing of the properties set for each vanilla Terraria item. Be sure to check out [Item Class Documentation](https://github.com/tModLoader/tModLoader/wiki/Item-Class-Documentation) to learn what each field represents.

For example. If you wanted your mod item to use the sound that the "Flower of Fire" makes when used, you would find the entry in the pages below and see that "Flower of Fire" has a use sound of 20. Now, you can say "item.UseSound = SoundID.Item20" in the SetDefaults method of your mod item and it should make the same sound.

- [Vanilla Item Field Values Spreadsheet](https://terraria.wiki.gg/wiki/Item_IDs)
