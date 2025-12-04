When you use the sorting feature in storage (for example, sorting a chest), the items will be sorted based on their sorting priority in `ItemID.Sets.SortingPriorityMaterials[]`. When making a custom item, this value is set inside of `SetStaticDefaults()`, using `ItemID.Sets.SortingPriorityMaterials[item.type] = XX` (requires `using Terraria.ID;`).

For example, if you wanted your item to have the same sorting priority as a platinum bar (Item ID: 706), which has a sorting priority of 59, you would write this in `SetStaticDefaults()`:

`ItemID.Sets.SortingPriorityMaterials[item.type] = 59;`

Here is a full list of vanilla sorting priorities, according to item ID **(anything not on the list has a value of -1**):

* (Item ID: Sorting Priority)
* 11: 48
* 12: 44
* 13: 56
* 14: 52
* 19: 57
* 20: 45
* 21: 53
* 22: 49
* 56: 62
* 57: 63
* 86: 64
* 116: 60
* 117: 61
* 174: 69
* 175: 70
* 177: 39
* 178: 41
* 179: 40
* 180: 38
* 181: 37
* 182: 42
* 364: 77
* 365: 81
* 366: 85
* 381: 78
* 382: 82
* 391: 86
* 520: 71
* 521: 72
* 547: 75
* 548: 76
* 549: 74
* 575: 73
* 699: 46
* 700: 50
* 701: 54
* 702: 58
* 703: 47
* 704: 51
* 705: 55
* 706: 59
* 880: 65
* 947: 90
* 999: 43
* 1006: 91
* 1104: 79
* 1105: 83
* 1106: 87
* 1184: 80
* 1191: 84
* 1198: 88
* 1225: 89
* 1257: 66
* 1329: 67
* 1508: 93
* 1552: 92
* 3261: 94
* 3380: 68
* 3456: 97
* 3457: 96
* 3458: 98
* 3459: 95
* 3460: 99
* 3467: 100