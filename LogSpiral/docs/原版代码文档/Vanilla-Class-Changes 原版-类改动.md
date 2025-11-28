# Item

## Properties

### public ModItem modItem

The ModItem instance that controls the behavior of this item. This property is null if this is not a modded item.

## Methods

### public ItemInfo GetModInfo(Mod mod, string name)

Gets the ItemInfo instance (with the given name and added by the given mod) associated with this item instance.

### public T GetModInfo\<T\>(Mod mod) where T : ItemInfo

Same as the other GetModInfo, but assumes that the class name and internal name are the same.

### public void CloneDefaults(int type)

Allows you to copy the defaults of a different type of item.

# Projectile

## Properties

### public ModProjectile modProjectile

The ModProjectile instance that controls the behavior of this projectile. This property is null if this is not a modded projectile.

## Methods

### public ProjectileInfo GetModInfo(Mod mod, string name)

Gets the ProjectileInfo instance (with the given name and added by the given mod) associated with this projectile instance.

### public T GetModInfo\<T\>(Mod mod) where T : ProjectileInfo

Same as the other GetModInfo, but assumes that the class name and internal name are the same.

### public void CloneDefaults(int type)

Allows you to copy the defaults of another type of projectile.

# NPC

## Properties

### public ModNPC modNPC

The ModNPC instance that controls the behavior of this NPC. This property is null if this is not a modded NPC.

## Methods

### public NPCInfo GetModInfo(Mod mod, string name)

Gets the NPCInfo instance (with the given name and added by the given mod) associated with this NPC instance.

### public T GetModInfo\<T\>(Mod mod) where T : NPCInfo

Same as the other GetModInfo, but assumes that the class name and internal name are the same.

### public void CloneDefaults(int type)

Allows you to copy the defaults of another type of NPC.

# Player

## Methods

### public ModPlayer GetModPlayer(Mod mod, string name)

Gets the ModPlayer instance (with the given name and added by the given mod) associated with this player instance.

### public T GetModPlayer\<T\>(Mod mod) where T : ModPlayer

Same as the other GetModPlayer, but assumes that the class name and internal name are the same.

### public void VanillaUpdateInventory(Item item)

Gives the item's effects to the player as if it were in the player's inventory. This works for both vanilla and modded items.

### public void VanillaUpdateEquip(Item item)

Gives the item's effects to the player as if the player has it equipped. Note that for accessories, you must call both VanillaUpdateEquip and VanillaUpdateAccessory. This works for both vanilla and modded items.

### public void VanillaUpdateAccessory(Item item, bool hideVisual, ref bool flag, ref bool flag2, ref bool flag3)

Gives the item's effects to the player as if the player has it equipped in an accessory slot. Note that for accessories, you must call both VanillaUpdateEquip and VanillaUpdateAccessory. This works for both vanilla and modded items.

### public void VanillaUpdateVanityAccessory(Item item)

Gives the item's effects to the player as if the player has it equipped in a vanity accessory slot.