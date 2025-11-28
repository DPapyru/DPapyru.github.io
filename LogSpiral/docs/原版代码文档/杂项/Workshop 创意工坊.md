***
This Guide is only relevant for 1.4. The [Mod Browser](https://github.com/tModLoader/tModLoader/wiki/Mod-Browser) page is where you will find information relating to publishing mods for the 1.3 version of tModLoader.
***

The Workshop is an online component of tModLoader where Mod Makers can publish their mods. Users are able to easily find, download, and install mods they are interested through the workshop. Users can browse the workshop directly in-game by visiting `Workshop->Download Mods` on the main menu. Users can also visit the [Workshop](https://steamcommunity.com/app/1281930/workshop/) in their web browser or in Steam.

tModLoader will also load workshop items the user has subscribed to from the [Terraria Workshop](https://steamcommunity.com/app/105600/workshop/). Workshop items on the Terraria Workshop are not mods. Worlds and Resource Packs are the only types of content found on the Terraria workshop.

***
**Modders wishing to publish their mod to the Mod Browser should continue reading.**
***

## Getting Started
Once your mod is working and functional, you may wish to share it with other users. You'll need a Steam Account and a working mod. 

### Steam Account
Modders wishing to publish their mod must have the Steam version of tModLoader. Additionally, the steam account must not be [a limited user account](https://help.steampowered.com/en/faqs/view/71D3-35C2-AD96-AA3A). Usually, this just means that the account must have spent at least $5 on Steam.

// TODO: Can Family Share publish?

### Steam Subscriber Agreement
Modders must accept the [Steam Subscriber Agreement](https://steamcommunity.com/sharedfiles/workshoplegalagreement). There is a link to this page on the publish mod menu as well.

### Rules
In addition, the modder should read the rules. Mods violating rules will be removed:
* [Terraria Player-Created Game Enhancements: Rules & Guidelines](https://forums.terraria.org/index.php?threads/player-created-game-enhancements-rules-guidelines.286/)
* tModLoader Rules (TBD)

## Publishing Mods
After making sure your mod is ready for release, visit `Workshop->Develop Mods`. You should see a `Publish` button, if you don't, build and reload your mod and it should appear. After pressing `Publish`, a menu will appear with some additional options. After selecting those options, click `Publish` and the mod will be published to the workshop. Before publishing, however, do the following:

### Set a Version
Set a version in your build.txt. Something like `0.1` is good for an initial release. Please use semantic versioning: `major.minor.patch` You are not allowed to use letters for the version

### Fill out description.txt
This is the description that potential users will read when deciding if they will download, make it good. 

This is what modders will see if they click the `More Info` button in-game. It doesn't support as many formatting options as `description_workshop.txt`, but it does support chat tags and colored text.

### Fill out description_workshop.txt
This is the description that potential users will read when deciding if they will download, make it good. 

The contents of this file will populate the steam workshop page description for your mod. You can use [`bbcode` markup code](https://steamcommunity.com/comment/ForumTopic/formattinghelp) to add headings, links, and images. Modders can use the `Edit title & description` button on the workshop page of their mod to quickly edit and test formatting. If you do this, make sure to copy changes made directly on the workshop to `description_workshop.txt` so that the next time you publish an update to your mod the changes aren't reverted.

### Test
A lot. You don't want your mod to be quickly judged to be bad because of a poor first release. 

### Make a Homepage
Every mod can have a homepage in addition to their Steam Workshop page. This could be a thread on the [Terraria Community Forums](https://forums.terraria.org/index.php?forums/client-server-mods-tools.116/), a wiki, a GitHub, or even a Discord link (Not recommended). It is up to you. A homepage should provide a way to interact with your users so they can give bug reports, criticism, or praise. 

Once you have a homepage, copy the URL and paste it into your [build.txt on the `homepage` property](https://github.com/tModLoader/tModLoader/wiki/build.txt). Save build.txt.

### Build
Save all your files and Build the mod in the Mod Sources menu.

### Github
If you have a Github repository for your Mod, push all changes.

### Visibility and Tags
On the publish menu, set tags for your mod that match the features of your mod. Set the visibility to public if your mod is ready for anyone to use it. Modders can use Private or Friends Only to facilitate beta testing prior to publishing.

### Publish
You can now click the Publish button. Within a few minutes, your users will automatically have the updated mod.

## Updating Mods
To update a mod you have published, first do the following:

### Update Version
Increment the version in your build.txt. Your Version should be 2 to 4 numbers separated by periods. Do not add letters such as "v" or "beta" to your version. [Read about versions](https://msdn.microsoft.com/en-us/library/system.version(v=vs.110).aspx#Anchor_6). Note: Some examples: 0.1 is the same as 0.001, and 0.0.0.10 comes right after 0.0.0.9. 

### Update Descriptions
Update your `description.txt` and `description_workshop.txt` with any new info you'd like potential users to know about. A brief recent changelog might be nice here.

### Update changelog.txt
If a file named `changelog.txt` is found, it will be used to populate the `Change Notes` section of a mod's workshop page. Before publishing an update, clear out exiting text and type up the changes made since the last version published.

### Update Mod Icon
A Mod icon can be added to a mod by adding an 80x80 `icon.png` to the root of the Mod's source folder. This is the icon shown to the user in-game. In addition, the workshop website also supports a higher resolution `icon_workshop.png`. This file can be up to 512x512 pixels. If you want to keep the pixel art of the 80x80 icon consistent, you can upscale to 480x480 by scaling up by 600% and using the nearest neighbor upscaling option.

Here is a template if you wish to use it:  
![](https://i.imgur.com/uluOTmD.png)

### Test
Test your changes a lot. Test the Save and Load code in your `ModPlayer` and `ModSystem` classes by loading old saves from previous versions of your mod.

### Build
Save all your files and Build the mod in the `Workshop->Develop Mods` menu.

### Github
If you have a Github repository for your Mod, push all changes now so your releases stay in line with the source code.

### Publish
Click Publish in the Mod Sources Menu. Within a few minutes, your users will now see that an update to their favorite mod is now available for download.

### Update Website
If you have a website, now would be a good time to advertise the update and changelog.

## Multiple Versions
Mods can publish different builds of their mods for stable and preview simultaneously. tModLoader will enable the appropriate version of the mod depending on the version of tModLoader the user is running, nothing needs to be done by the modder. 

## Unpublishing Mods
You can unpublish a mod by visiting the steam workshop page for your mod and selecting delete.

## Collaborators
On the steam workshop page for your mod, use the `Add/remove Contributors` to add collaborators to your mod. The users must be your friend. Collaborators can publish updates to the mod to the workshop so it is extremely important that you only add collaborators that are trustworthy. To actually collaborate on the code, modders usually use GitHub to work on code together.

## .tmod File size
If you find that your `.tmod` file is unnaturally big, check your Mod's source folder for large files that shouldn't be there. By default, all files in the folder will be packaged into the `.tmod` file. Use [`buildIgnore` in build.txt](https://github.com/tModLoader/tModLoader/wiki/build.txt) to specify folders or files to ignore, or delete the files in question. Common culprits include photoshop or other image editing project files.

## GitHub integration
Modders can use Github Actions to build their mod with each commit. This can be useful to make sure the mod doesn't break.

Modders can also use GitHub actions to publish a mod update whenever build.txt is updated, but that is not something we have a working example of and is left up to the user. Modders using this approach will need to be EXTREMELY careful with their Steam credentials.

## Renaming a Mod
The `displayName` in [build.txt](https://github.com/tModLoader/tModLoader/wiki/build.txt) dictates the name users will see when interacting with mods. This name can change and updated as the mod changes. Feel free to edit this as you like, your changes will take effect next time you publish. Read on if you need to change the internal name of a mod.

Aside from the `displayName`, there is an `internal name`. The `internal name` is another name pertaining to a mod, this name has no spaces or special characters and will not change as the mod is updated. For example, the [Begone, Evil! (Disable Evil Biome Spread)](https://steamcommunity.com/sharedfiles/filedetails/?id=2669670918) mod's `internal name` is "DisableCorruptionSpread". tModLoader and other mods can interact with this mod within code using "DisableCorruptionSpread" and the connection won't be broken if the `displayName` changes. 

The `internal name` must be unique on the workshop, so you might find that the `internal name` you have chosen for your mod is already taken when publishing. Or, you might want to rename the `internal name` for other reasons. Due to various factors, it is not recommend to change the `internal name` of a mod that has already been published, but it can be done. If your mod is small, it might be easier to make a new mod and copy over the changes rather than following the steps below to rename an existing mod.

### Renaming a Mod Steps
Use the [workshop search](https://steamcommunity.com/app/1281930/workshop/) to find a new unique `internal name`. The search doesn't search by internal names, but it should give you an idea of what might be taken already. If you are on the [tModLoader Discord](https://discord.gg/tmodloader), you can type the `.mod ModNameHere` command in the `#botworld` channel. Our bot will then reply with information about that mod if it exists or "Mod with that name doesn't exist" if a mod with that `internal name` has not been published. Repeat until you find a name suitable for your mod that is unused.

After deciding on a new `internal name`, first rename your mod's source folder. Open up the `ModSources` folder and rename the folder for your mod. 

Next open up your mod's source folder and rename `ModName.cs`, `ModName.csproj`, and `ModName.csproj.user` if it exists. Open up `ModName.cs` and rename the `Mod` class. Open `ModName.csproj` in a text editor and rename the `AssemblyName` entry.

Next we'll need to update all the `namespace` entries on every `.cs` file in your mod. Open up each and rename each `namespace ModName` entry.

Make sure you saved all your changes on each file and try to build the mod in game. If the mod doesn't load or doesn't build, you likely missed something. The error message should help you find and fix the remaining issues. 

Using the "Find in files" feature can streamline this process. In notepad++, for example, the "Find in files" tool can be used to search all files in a specific directory. From there each result can be fixed easily. 

## Limitations
### Terraria Community Forum Rules
Mods published to the Mod Browser must abide by the [TCF Modding rules](https://forums.terraria.org/index.php?threads/player-created-game-enhancements-rules-guidelines.286/) Rules of note include the rule against porting content from non-PC versions of Terraria and the rules against plagiarism. Violating these will result in revoked Mod Browser privileges.

### Mod Icon Guidelines
Any nudity or inappropriate content in a Mod Icon will result in especially severe response.
What will be deemed inappropriate? You can probably guess it, but still here's a few examples: nudity/porno, swearing, violence/harm to other humans or animals, and also icons that encourage vandalism, crime, terrorism, racism, eating disorders, or suicide.. The list can go on.. just use an appropriate icon please.

### Malicious Code
Don't do it. The mods you upload are tagged with your Steam identity. You will be **permanently banned** from the browser and all of your mods will be removed. We will also notify Terraria and Steam staff about you and your malicious code.

# Common Issues
// TODO: decription.txt too long error

### The content folder for the published item is missing?!
Unconfirmed: If there is a Workshop folder in the saves directory, delete it. Try to publish again.
