When learning to create mod NPCs, it is beneficial learn the effect of various NPC properties by seeing how vanilla items achieve their desired effects. Below is a listing of the properties set for each vanilla Terraria NPC. 

For example. If you wanted your mod NPC to use the sound that the Vultures makes when hit, you would find the entry on the spreadsheet below and see that "Vulture" has a "soundHit" of 28. Now, you can write "npc.HitSound = SoundID.NPCHit28" in the SetDefaults method of your mod NPC and it should make the same sound when hit by a player.

- [Vanilla NPC Field Values Spreadsheet](https://terraria.wiki.gg/wiki/NPC_IDs)