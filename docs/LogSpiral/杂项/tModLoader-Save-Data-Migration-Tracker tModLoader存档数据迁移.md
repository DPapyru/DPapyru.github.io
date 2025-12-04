In the beginning of 2020, there was two. 
Games/ModLoader (1.3)
Games/ModLoader/Beta (1.4 dev)

Each contained:
- Mod Sources
- Mod Config
- Mod Reader
- Mods
- Logs
- Players
- Worlds
- Config.json
- Achievements.dat
- input profiles.json
And a lot of custom mod folders/files for their custom save data. 

We also had, in Steam Cloud, 
Steam/ModLoader
Steam/ModLoader/Beta

contained:
- Players
- Worlds
- Achievements.dat


(PortOldSaveDirectories)
At the onset of 1.4-Alpha release, we performed the following porting:
- Documents/ModLoader/Beta renamed to tModLoader
- in tModLoader folder, removed spaces from Mod Sources, Mod Reader, Mod Config folders to improve Linux compat

We did not include any porting of steam cloud at this stage

(New 1.4 era preview, dev folders)
In addition, we added two folders that depend on the 1.4-alpha porting to successfully complete first.
- tModLoader-preview
- tModLoader-dev
Both folders are created when launching tML with BuildPurpose.Preview and BuildPurpose.Dev respectfully. 

(PortCommonFiles)
Further, on first launch, preview/dev copy the following files for the new environment:
- config.json
- input profiles.json

(Port143FilesFromStable)
Prior to launching tMod 1.4.4 era, we needed to preserve 1.4.3 player data.
This requires step PortOldSaveDirectories to run first. 

The core goal is to safely backup everything but ModSources and temp publishing folder "Workshop". 
The backup will be added to a new folder, which will act same as ModLoader for 1.3
The new folder: Games/tModLoader-1.4.3 

This move is the most complicated thus far, involving the following:
1) If the Games/tModLoader-1.4.3 folder does not exist, then copy over all files as designated if and only if the save data corresponds to 1.4.3 or earlier
2) Perform the same as 1) for Steam/tModLoader-1.4.3

Given that we actually are touching all users data, it is critical we include recovery logic in the event of a partial file move. 
As such, if the tModLoader-1.4.3 folder does exist, we still have to copy over all files from tModLoader that are newer than or don't exist in tMod-1.4.3 if and only if those files are for 1.4.3 or older.
Finally, to avoid running this logic every time as it is expensive, we left a completion flag in the form of Ported143.txt to tell us tml completed fully previously. 

The tModLoader-1.4.3 was decided to share ModSources folder with tModLoader, like dev and preview, and unlike 1.3. 

(Maybe Port202306FilesFromPreview)
At the onset of 1.4.4 release, we will need to either 
Migrate existing tModLoader-preview data from preview to `tModLoader` 
Or
Establish functionality to scan all folders for data, and prompt the user to select which to use. 

Regardless, the tModLoader directory, if it exists at launch of 1.4.4-stable, can't be used until step Port143FilesFromStable has fully completed.

The logic involved in migration replicates that of Port143 step, swapping the folders involved and version for 2023.06 instead of 2022.09

(More to be added)