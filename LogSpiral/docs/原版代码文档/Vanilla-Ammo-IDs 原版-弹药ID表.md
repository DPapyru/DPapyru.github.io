The following is a list of constants found in the `Terraria.ID.AmmoID` class.

`AmmoID`s are used to define ammo classes, groups of items that all work with the same weapons. `AmmoID`s are based off of the `ItemID` of the first ammo item in that class. For example, the `ItemID` `MusketBall` has a value of 97 and the `AmmoID` for Bullet also has a value of 97. All other Bullets in the game set their `item.ammo` to `AmmoID.Bullet`, and all weapons that use Bullet ammo set their `item.useAmmo` to `AmmoID.Bullet`. For ModItems, please follow this numbering convention as well to avoid ID overlap.

| Ammo	| ID/Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
| :-- 	| :--                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
| None | 0 |   
| Gel | 23 |   
| Arrow | 40 |   
| Coin | 71 |   
| FallenStar | 75 |   
| Bullet | 97 |   
| Sand | 169 |   
| Dart | 283 |   
| Rocket | 771 |   
| Solution | 780 |   
| Flare | 931 |   
| Snowball | 949 |   
| StyngerBolt | 1261 |   
| CandyCorn | 1783 |   
| JackOLantern | 1785 |   
| Stake | 1836 |   
| NailFriendly | 3108 |   