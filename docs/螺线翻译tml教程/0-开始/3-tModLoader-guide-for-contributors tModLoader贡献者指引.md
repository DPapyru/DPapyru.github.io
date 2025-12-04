___
- **[I don't want to contribute to tModLoader, I want to play mods](tModLoader-guide-for-players)**
- **[I don't want to contribute to tModLoader, I want to create mods](tModLoader-guide-for-developers)**
___

# Installation
If you still need to install tModLoader refer to the [tModLoader guide for players](tModLoader-guide-for-players).

### IDE
You will need an IDE (Integrated Development Environment) to help develop tModLoader.
- For Windows users, we recommend [Visual Studio 2022 Community Edition](https://visualstudio.microsoft.com/vs/community).
- A prevalent cross-platform alternative would be Jetbrains' [**Rider**](https://www.jetbrains.com/rider). Rider is free for non-commercial use such as this project.

### Git
If you've never used Git before, checkout our [guide on how to use it](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Git-&-mod-management). If you ever come across something in this guide you don't recognize, just Google it. You should be easily able to find something relevant to your problem. You can also checkout [this little snippet](#further-online-assistance).
Further, if command line inherently scares you, additional tools such as [GitHub desktop](https://desktop.github.com/) and [Github Extension for VisualStudio](https://marketplace.visualstudio.com/items?itemName=GitHub.GitHubExtensionforVisualStudio) can provide most of the functionality you need in a user friendly interface.

# Code patcher
tModLoader uses its own code patcher tool, which you will have to use if you want to contribute to tModLoader. We are required to use a patches system because we are not allowed to upload vanilla source code publicly. It also allows for relatively easy code maintenance.

![](https://i.imgur.com/k2lX3nt.png)

## Getting the tModLoader code for the first time
**Note:** The setup GUI (Graphical User Interface) is currently Windows-only, use CLI (Command-Line Interface) on other systems!
1. [Install .NET 8.0 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0);
2. Fork this repository, then clone your fork onto your PC. You HAVE to use Git for this, downloading source code as a zip file won't work;
3. **GUI:** Open `setup.bat` in the root folder;<br/>**CLI:** Open a terminal in the root folder; 
4. **GUI:** Click on 'Setup' (top left button);<br/>**CLI:** Run `./setup-cli setup`;
    * If asked, select your vanilla `Steam Windows 1.4.4.9` `Terraria.exe`.
    * If you want to work on the 1.4.3 or 1.3 version of tModLoader, you need `Terraria_1.4.3.6.exe` and `TerrariaServer_1.4.3.6.exe`, or `Terraria_1.3.5.3.exe` and `TerrariaServer_1.3.5.3.exe`.
5. When decompilation is complete, verify that you have these folders:
    * `src/decompiled/`
    * `src/Terraria/`
    * `src/TerrariaNetCore/`
    * `src/tModLoader/` (You will be primarily modifying files within this folder, through the patcher and `tModLoader.sln` file) 
6. To open up the tModLoader workspace, navigate to `solutions/` and open `tModLoader.sln` with your IDE.

## Recommended contribution/development cycle
**Start:**
1. Pull the `1.4.4` branch. You HAVE to use Git for this, downloading source code as a zip file won't work;
2. Create a new Git branch for the feature you're developing (i.e. `feature/something_new` or `fix/that_thing`);
3. Run **Setup** (`setup`) or **Regenerate Source** (`regen-source`) in the development GUI/CLI;

**Develop:**
1. Develop your contribution using `solutions/tModLoader.sln` and your IDE;
    * Please follow the established [tModLoader Style Guide](https://github.com/tModLoader/tModLoader/wiki/tModLoader-Style-Guide) when making changes.
2. `Diff <workspace>` (`diff <workspace>`) the workspace you developed it for to turn your code into patches;
    * **Your workspace is `tModLoader` 99% of the time.** If it isn't, we imply you know what you're doing.
3. Create a new commit to commit the patches/ folder
    * Before you push your commit, please check our [contribution article](https://github.com/tModLoader/tModLoader/blob/1.4.4/.github/CONTRIBUTING.md). Thanks!
4. If the branch was modified by someone else - pull the patches in Git and `Regen Source`(`regen-source`) in setup to apply them to your code.
5. Repeat.

**Open the pull request:**
* When you're done, PR your branch to `1.4.4`, and **not** to `master`, `preview`, or `stable`.
* If you're in need of early feedback - you can and should open pull requests before they're done! They can be marked as drafts if needed.

## Testing your Code
If you are testing bug fixes, simply debugging the `Debug` configuration is all that is required.

## Adding examples to Example Mod
As you add features to tModLoader, you'll want to add examples of using those features to Example Mod. 
* The Example Mod examples should be straightforward and minimize unrelated effects. 
* Examples should showcase at least the most common usage of the new feature, but a more advanced example can also be added if helpful. 
* Comments should focus on what is unique about the added example. There is no need to comment code that the reader should already have a basic understanding of, such as `SetDefaults` and `AddRecipes` methods. 
* The name of the example should hint at what can be learned from the example. 
* There are rare cases where multiple classes in a single file is acceptable, but for the most part each class should be in it's own file with the same name.
* Sprites should be simple. You can reuse existing sprites directly (such as overriding `Texture`), make a sprite in the style of other Example Mod sprites, or even desaturate an existing Terraria sprite in an image editor and use that. Do not let are get in the way of making a pull request, there are plenty of contributors willing to help. You can always make a placeholder sprite for the pull request and we can help with that as the pull request is reviewed.

Prior to v2025.01, the ExampleMod folder would need to have a symbolic link created in the ModSources folder to show up in the "Develop Mods" menu. This is no longer required and if you have this already it can be deleted if desired. You will, however, need to build ExampleMod at least once from `tModLoader.sln` before it will show up in-game in the "Develop Mods" menu. To do this, click the startup item dropdown and select "ExampleMod", then debug or build the ExampleMod project as normal. Make sure it builds successfully as part of your testing before making a pull request.

![image](https://github.com/user-attachments/assets/b12ea982-7ac4-4925-a65f-4dafdc4cbd25)

Before you're about to make a contribution, please check [this article](https://github.com/tModLoader/tModLoader/blob/stable/.github/CONTRIBUTING.md). Thanks in advance.

## Keeping your code up-to-date
**NOTE:** it is wise that you backup your edits before pulling latest patches, if you have any that you haven't committed yet. Applying the latest patches **will** delete any of your work not included in them.

**Setup** (do this if you're updating your code for the first time, it also requires that you have some kind of command line [git client](https://git-scm.com/downloads) installed)
1. Open a Git Bash window or whatever in the tML folder
2. Enter `git remote add upstream https://github.com/tModLoader/tModLoader/`
3. To ensure that it's been setup correctly, enter `git remote -v` and you should see something like this:
```
origin  https://github.com/*YOURUSERNAME*/tModLoader.git (fetch)
origin  https://github.com/*YOURUSERNAME*/tModLoader.git (push)
upstream        https://github.com/tModLoader/tModLoader (fetch)
upstream        https://github.com/tModLoader/tModLoader (push)
```

**Actually pulling**
1. Open up another shell window (if you want, enter `git remote -v` to make sure everything's as it should be)
2. Enter `git fetch upstream`
3. Then `git merge upstream/*branchtomerge*`
   * This will pull all the newest commits from *branchtomerge* into the branch that you have checked out
   * You should verify that you now have the latest patches, located in patches/
4. Open setup.bat in the root folder
5. Click on 'Regenerate Source' (bottom right corner)
   * After this process you can open solutions/tModLoader.sln as usual with the updated code

### HELP! I accidentally committed on a wrong branch!
Simply stash changes and checkout.
___
1. Open in git shell/bash or whatever
2. Run `git stash save` or `git stash` (should default to save)
3. Run `git checkout -b xxxx`
    * Replace xxxx by branch name
    * Omit -b if not creating a new branch
4. Run `git stash pop`

## Acquiring a specific Terraria version
TModLoader development *no longer* requires downloading specific Terraria versions, but if you need them for reference, then follow these steps:

- Download the [DepotDownloader](https://github.com/SteamRE/DepotDownloader/releases) utility.
- Head over to [this SteamDB page](https://steamdb.info/app/105600/depots/), pick and remember the depot (OS) you want, navigate to Manifests, select the `public` branch in filters, and grab the manifest ID of the version you need.
- Run `./DepotDownloader -app 105600 -depot <depot ID> -manifest <manifest ID> -username <steam login>` to download that version.

# Further online assistance
If you would like to contact us or tModLoader users, it's best to join our [Discord server](https://discord.gg/tmodloader). Discord is a chat and voice application.