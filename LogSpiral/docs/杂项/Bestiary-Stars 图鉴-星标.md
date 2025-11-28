The stars, or "rating", in the ingame Bestiary are controlled by a multitude of factors.  
Below is the general formula (found in `Terraria.ID.ContentSamples.GetNPCBestiaryRarityStarsCount()`) that the game uses to determine the stars for any given `npc`, with a few exceptions:

1. Start with a default stars rating of `1`.
2. Add `npc.rarity` to the rating.
3. Check the following conditions in order, adding to the rating only once:
    1. Is `npc.rarity == 1` true?  If so, add `1` to the rating.
    2. Is `npc.rarity == 2` true?  If so, add `1.5` to the rating.
    3. Is `npc.rarity == 3` true?  If so, add `2` to the rating.
    4. Is `npc.rarity == 4` true?  If so, add `2.5` to the rating.
    5. Is `npc.rarity == 5` true?  If so, add `3` to the rating.
    6. Is `npc.rarity > 0` true?  If so, add `3.5` to the rating. (This condition is true for any rarities above `5`)
4. Is `npc.boss` true?  If so, add `0.5` to the rating.
5. Calculate the sum of `npc.damage + npc.defense + npc.lifeMax / 4`.  The stats used here are the NPC's stats in **Normal Mode**.
6. Using that sum, check the following conditions in order, adding to the rating only once:
    1. Is the sum greater than `10000`?  If so, add `3.5` to the rating.
    2. Is the sum greater than `5000`?  If so, add `3` to the rating.
    3. Is the sum greater than `1000`?  If so, add `2.5` to the rating.
    4. Is the sum greater than `500`?  If so, add `2` to the rating.
    5. Is the sum greater than `150`?  If so, add `1.5` to the rating.
    6. Is the sum greater than `50`?  If so, add `1` to the rating.
7. Cap the rating to `5`, truncate it and then return it.

## How can I add a custom stars rating to my NPC?
The dictionary `ContentSamples.NpcBestiaryRarityStars` stores the stars rating for all NPCs, including modded ones.

To manually set the rating for an NPC, set `ContentSamples.NpcBestiaryRarityStars[Type] = stars;` in `ModNPC/GlobalNPC.SetStaticDefaults()`.  
**Example:**
```cs
public override void SetStaticDefaults() {
    // Sets the rarity of ExamplePerson to 5 stars
    ContentSamples.NpcBestiaryRarityStars[Type] = 5;
}
```
Setting an NPC's rating to less than `0` is treated as if the NPC's rating were `0`.  
Setting an NPC's rating to more than `5` is treated as if the NPC's rating were `5`.

## v2025.06 and earlier

To manually set the rating for an NPC, set `ContentSamples.NpcBestiaryRarityStars[type] = stars;` in `GlobalNPC.SetBestiary()`.  
**Example:**
```cs
public override void SetBestiary(NPC npc, BestiaryDatabase database, BestiaryEntry bestiaryEntry){
    //Sets the rarity of ExamplePerson to 5 stars
    ContentSamples.NpcBestiaryRarityStars[ModContent.NPCType<ExamplePerson>()] = 5;
}
```