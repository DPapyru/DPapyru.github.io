***
This Guide is for 1.4.4, the current version of tModLoader. If you need to view the 1.4 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Contributing-Localization/5c2723d318427b2ed8ac35ef0ce4d8f9cc3f450f)
***

- **Learn how to contribute localization (translations) to your favorite mod or even to [tModLoader itself](#localizing-tmodloader)**
- **This guide also covers a brief introduction for the [Git version control](https://en.wikipedia.org/wiki/Git) system, but if you want a full guide you should read the [Git & mod management](Intermediate-Git-&-mod-management)**

# Localization Workflow
1. [Choose an approach](#Localization-Approaches)
2. [Get a template](#Localization-Template-Files)
3. [Translate](#Editing-Localization-Files)
   * [Placeholders and Substitutions](#placeholders-and-substitutions)
   * [Pluralization](#pluralization)
4. [Publish translation](#Publishing-Localization-Files)
5. [Maintain translation](#Maintaining-Localization-Files)

For information on using GitHub to contribute localizations, see the [GitHub for Localizers](#github-for-localizers) section.

If you wish to localize tModLoader, see the [Localizing tModLoader](#localizing-tmodloader) section.

# Localization Approaches
There are a few approaches to localize a mod. Some mod developers welcome translators to contribute translations directly to their project, either through GitHub or in some other manner. Other mod developers would prefer that translations are done as separate mods dependent on the original mod. Whatever the approach, this guide will cover how to localize a mod and how to get your localizations available to other users.

### GitHub
Mods that host their code on GitHub are the easiest to contribute translations to. A translator can download the mods source code and work directly in it. 

### Contact Mod Developer
If a mod does not have a public GitHub, you might want to consider contacting the mod developer. They might be happy to accept translations directly from the community and integrate them into their mod.

### New Translation Mod
If a mod developer can't be contacted or doesn't want to deal with translations, a last resort is making a new mod that contains the translations for the mod. This approach is less convenient for users and more work for the translators, but it is an option. (In the future, we plan to support localizations in resource packs.)

# Localization Template Files
The first step to localizing a mod is to obtain the localization files. These files have the file extension `.hjson` and can be edited in any normal text editor.

***

### GitHub
If you are working via GitHub, look for the `hjson` files belonging to the language you wish to use. If no files exist for the language, see the [Adding a new Language](https://github.com/tModLoader/tModLoader/wiki/Localization#adding-a-new-language) section to learn how to generate the files.

### Contact Mod Developer or New Translation Mod
If you are working without the source code, the easiest method is to make a new translation mod. Follow the [Basic tModLoader Modding Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-Guide#your-first-mod) to generate a mod skeleton. I'd recommend that the mod be named: `{OriginalModInternalNameHere}{LanguageCodeHere}`. For example, a French translation of `ExampleMod` might be named `ExampleModFr`. The display name should follow a similar pattern, maybe `Example Mod Traduction française`. While making the mod skeleton, don't generate the template sword item by leaving the entry for `BasicSword` blank.

Now, find `build.txt` in your mod's ModSources folder and open it in a text editor. Add the following line: `modReferences = OriginalModInternalNameHere`, replacing `OriginalModInternalNameHere` with the appropriate internal mod name (A mods internal mod name can be seen by finding the mod in `enabled.json` in the [Mods folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#mods)). Next, add another line with `translationMod = true`. Save `build.txt`. Next, find `en-US.hjson` in `ModSources\YourModNameHere\Localization` and delete it, then make a `.hjson` file for the language you wish to support using the [culture abbreviation](https://github.com/tModLoader/tModLoader/wiki/Localization#culture). 

You can now build the mod in game. Make sure the mod you wish to translate is also enabled and reload mods. Your mods source code folder will now be populated with `.hjson` files. Note that the files will be organized according to the original mods layout, so you might need to look around for the `.hjson` files. If you take this approach, follow the `New Translation Mod` steps in the `Testing Localization Files` section.

**An alternate approach** to generating a new mod if you intend to contribute the translations to the original mod developer is extracting the localization files directly. This approach is simple but will require more work later on. First, open up tModLoader and switch the game language to the language you wish to contribute. Next, navigate to the Mods menu and make sure the mod is enabled. Reload mods if necessary. In the Mods menu, click the `More Info` button. On the bottom right is a button for `Extract Localization`, press it. Once you press the button, the file explorer should appear opened to `Terraria\tModLoader\ModLocalization\ModNameHere`. This folder now contains all localization files in the same layout as the original mod. Do not move or rename files within this folder, that would make it harder for the original mod developer to integrate your changes. You'll likely only find a single `.hjson` file, this is typical. If you take this approach, follow the `Contact Mod Developer` steps in the `Testing Localization Files` section.

***

# Editing Localization Files

Now that you have the `.hjson` file or files for your language, open it in a text editor. You should see entries for content in the mod. As a translator, you only need to edit the right side of lines with the format `key: translation`. Leave category names and keys untouched (text to the left of `:`). For example:

```
Mods: {
	ExampleMod: {
		Config: {
			# This is a comment
			ExampleWingsToggle: {
				// Label: ExampleWings Toggle
				/* Tooltip: 
					'''
					Enables or disables the ExampleWings item 
					2nd Line of text
					''' */
			}
		}

		Keybinds.RandomBuff.DisplayName: 随机增益
	}
}
```
This example shows 3 translation entries: `Mods.ExampleMod.Config.ExampleWingsToggle.Label`, `Mods.ExampleMod.Config.ExampleWingsToggle.Tooltip`, and `Mods.ExampleMod.Keybinds.RandomBuff.DisplayName`. The `Label` and `Tooltip` entries are "commented out", while the `Keybinds.RandomBuff.DisplayName` entry has already been translated into Chinese. The `Label` entry uses the single line `//` comment style, while the `Tooltip` entry uses the multiline `/* */` comment style. After translating the right side of the `Label` and `Tooltip` entries, the translator should un-comment the entry by deleting the `//` at the start of the line or the `/*` and `*/` surrounding the entry. 

You will also see lines with comments in the form `# Comment here`. These lines should not be translated, they are simply there for context and other notes the original author wrote down. 

After translating, make sure to save the file.

## Placeholders and Substitutions
You may come across special text like `{0}` or `{$KeyHere}` in localization files. These are advanced usages of the localization system meant to streamline translations and reduce text repetition. See [here](https://github.com/tModLoader/tModLoader/wiki/Localization#substitutions) for information about `{$KeyHere}` and [here](https://github.com/tModLoader/tModLoader/wiki/Localization#placeholders) for information about `{0}` or other numbers. 

## Pluralization
In many languages, plural nouns take different forms depending on the count. See [the pluralization section](https://github.com/tModLoader/tModLoader/wiki/Localization#pluralization) for information on this feature.

# Testing Localization Files
If there are any localization keys that are complicated or seem ambiguous, you may want to test your edits.

***

### GitHub
If you are working on the source code directly, you simply need to build and reload your mod in game. The [Learn how to Build the Mod](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-Guide#learn-how-to-build-the-mod) section can teach you how to do that. The [Live Updating feature](https://github.com/tModLoader/tModLoader/wiki/Localization#live-updating) can be used to test changes further while in-game without requiring a rebuild and reload. 

### Contact Mod Developer
Since you don't have the mod code, you'll have to leave this step up to the mod author, or follow the `New Translation Mod` steps below to make a temporary mod to test your changes. If you do, remember not to publish the mod.

### New Translation Mod
To test a translation mod, first make sure the original mod is enabled, then build and reload your mod in game. You should see your translations working.  The [Live Updating feature](https://github.com/tModLoader/tModLoader/wiki/Localization#live-updating) can be used to test further changes while in-game without requiring a rebuild and reload.  

***

# Publishing Localization Files
Once you have checked over everything and made necessary changes, you'll want to publish your localization. This step also depends on which localization approach you are using. 

### GitHub
If you are familiar with GitHub, or want to learn how, you can make a pull request. More info on how to work with GitHub is found in the []() section below. If learning to use GitHub is too much work, there are other ways to contact the author with your translations. One simple way is to make an Issue on their GitHub page and post the files there. If you intend to localize many mods, it may be worth it to learn the basics of GitHub. 

### Contact Mod Developer
Send the finished files to the mod developer. The mod developer will then use your files in their code. The mod developer might want to track translation credits in a comment at the top of their English translation file, and also on their workshop homepage.

### New Translation Mod
If you would like, make an icon for your translation mod. With permission, you might be able to modify the original mods icon. [Mod Skeleton Contents](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-Guide#mod-skeleton-contents) has info on the dimensions of the icon files. You'll also want to edit `description.txt` with information about the translation mod. Once everything is ready, should build the mod once more and then publish the mod. This is done in the Mod Sources menu.

# Maintaining Localization Files
The mod you localized might update with new content. If that happens, you might want to update the translations.

### GitHub
Pull or download the latest code. The template file should be updated already with missing translations. If it isn't, build and reload the mod.

### Contact Mod Developer
If you made a translation mod, reload the mods to update the localization files. Find new untranslated entries, translate them, and get the new files to the mod developer once again.

If you extracted the localization files instead, follow the same steps as before with the updated mod downloaded. If the author integrated your translations from earlier into the latest release, those entries should already be translated in the newly extracted localization files.

### New Translation Mod
Reloading the mods should update the localization files. Find new untranslated entries, translate them, and publish.

# GitHub for Localizers
This section is a simplified guide to GitHub and Git containing only information necessary for contributing localizations to mods.

## Terminology 
### Git and GitHub
Most mods will publish their source using the git version control system. GitHub, the site you're on, provides a nice global place for everyone to contribute to projects using git.

### Repository
A repository is a specific GitHub project. This typically corresponds to the source code of a single mod.

### Commit
A commit in git is a push of changes to the project. Every commit made has changed certain files in the project. When you have created translations for a mod, those will be pushed to the project via a commit.

### Fork
Since you are likely not an official contributor to the project, you cannot push commits to the official project. That is why you must fork the project. A fork is a copy of the project under your own account. This lets you modify files and show them to the world, but not under the official project.

### Pull request
When you've created your translations and committed them to your fork, they are not yet in the official project. In order to do this, you must create a pull request to the official project. On the page of your fork GitHub should provide you with a button to submit a pull request.

## Basic Step Overview
1. Login to your GitHub account
    1. If you do not have an account, you can register yourself for free on GitHub [here](https://github.com/join).
1. Go to the official project, fork the project to your account:    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/22ef73fa-3146-4fe2-a94f-c8f12644d066)    
1. Create the translations and commit them to your fork
1. Submit a pull request

## Contributing Localization Step-by-Step Example
In this example we will be localizing the [Recipe Browser](https://github.com/JavidPack/RecipeBrowser) mod.

First, log into GitHub. Next, open up the GitHub homepage for the mod you wish to localize. Find the `Fork` button near the top of the page to create your own copy of the GitHub repository:    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/5072a123-1480-4ef7-af02-e021762be9a8)    

On the next page, simply click `Create fork`. Wait for the page to refresh. 

Next, we need to find the localization files. Navigate to the "Localization" folder by clicking on it in the file view section:    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/1ac87917-a774-478f-9ac5-025dd1ff9f6b)    

You should be able to find a listing of `.hjson` files. Note that file organization might be different for different mods, so you may need to look around. Find a `.hjson` file corresponding to the language you with to contribute to and click it. (If there is no file, you'll have to clone the mod's repository to your computer and work locally instead.)

Once you've opened the file, first check to see if there are any missing translations. If there are, then there is work to be done. Click the `Edit this file` button:    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/47c9f95e-e1a3-4996-a38a-9f88af24ab5e)    

You can now edit the file. Remember to remove `// ` from untranslated entries that you translate. Once you are done, click `Commit changes...`:    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/f3b842c3-0be7-49ea-8585-c5b706a2bca9)    

A window will pop up, click `Commit changes` after optionally editing the commit message and description.

Next, navigate to the `Code` tab:    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/4ef0c202-1928-4ceb-89dc-e78b0166d747)    

Click `Contribute` and then `Open pull request`:      
![image](https://github.com/tModLoader/tModLoader/assets/4522492/bc081b14-1d2d-4683-98c3-0c015adb8e63)    

You should now see a list of changes you have made. Double check that they look correct. Click `Create pull request` if everything looks correct:    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/8d944a88-24c9-452d-bccf-28827376a134)    

This next page allows you to edit the title and description of the pull request. Click `Create pull request`. 

After clicking, your pull request is created. The mod owner will be notified and will review and merge your pull request when they have time.

Congratulations! You have now contributed translations to a mod. If the mod owners accept your pull request the translations will be in the next release of the mod.

# Localizing tModLoader
If you wish to contribute translations to tModLoader itself, there are a few differences from contributing to a mod.

tModLoader doesn't use `.hjson` files seen in mods, but `.json` files, so the syntax is slightly different. The process is roughly the same, except for the structure of the files. Navigate to the [tModLoader source folder](https://github.com/tModLoader/tModLoader/tree/1.4.4/patches/tModLoader/Terraria/Localization/Content) and find the `.json` file you want to edit. Open the file and look for entries that have `//` before them. These are missing translations. Follow the same procedure as translating a mod with a GitHub. Fork, edit, and create a pull request. You should be able to do all of these steps directly on GitHub.com if you are logged in. Remember to only change the right side and remove the `//` from the lines you localize. Unlike with `.hjson` files, the quotes (`"`) are needed, so don't delete them.

If you wish to test your changes in-game, you would need to follow [this guide](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-contributors) to build tModLoader. For many non-technical users, this is an involved process, so it is not necessary.

If you need guidance on any of these instructions we are always willing to help on the [tModloader Discord Server](http://discord.gg/tmodloader). 

### Localizing tModLoader Steam Store Page
In addition to the in-game text, we also localize the [tModLoader store page](https://store.steampowered.com/app/1281930/tModLoader/) itself. These files are found in the [SteamPageLocalization](https://github.com/tModLoader/tModLoader/tree/1.4.4/solutions/SteamWorkshopLocalization/SteamPageLocalization) folder and missing languages can be supplied through creating the files in a pull request.

### Localizing tModLoader Steam Workshop Page
The mod "tags" that the user can click while visiting the [tModLoader Steam Workshop page](https://steamcommunity.com/app/1281930/workshop/) are derived from the `.hjson` files mentioned above. If those files have been updated but they do not yet show on the workshop page, please let a tModLoader developer know and we will upload them.

### Localizing tModLoader News Announcements
If you would like to help translate the monthly release announcements posted on Steam, please come to the [Steam Announcement Localization Thread](https://discord.com/channels/103110554649894912/1163229998614855740) on Discord and let us know.

### Localizing ExampleMod
We do not localized [`ExampleMod`](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Localization) at this time, the other languages present are there simply to demonstrate how the mod localization process works.

### Localizing tModCodeAssist
The [tModCodeAssist](https://github.com/tModLoader/tModLoader/wiki/tModCodeAssist) messages can also be localized. Editing these requires setting up the [tModLoader project](https://github.com/tModLoader/tModLoader/wiki/tModLoader-guide-for-contributors), and since there are only a few messages to localize, it is usually easier to just ping a tModLoader team member on Discord with the translations. 

If you want to contribute it directly, read the following:

<details><summary>Localizing tModCodeAssist details</summary><blockquote>

First, open up the `tModLoader.sln` and then open up the `Resources.resx` files in the `tModCodeAssist` and the `tModCoseAssist.CodeFixes` projects. 

![](https://github.com/user-attachments/assets/421ed1d5-e171-41e3-8276-fb82303445de)    

In the "Neutral Value" column you'll find the English values. Scroll to the right to find your language, then type in the translations. After you are done editing both files, make a commit and pull request as usual.    

![](https://github.com/user-attachments/assets/997b1197-31c4-4adf-848d-e91c2868e800)    

This screenshot shows where the description, title, and message text are shown to the user, for reference.    
![](https://github.com/user-attachments/assets/507dd9af-9633-400f-a29f-8061bf2c32aa)    

</blockquote></details>
