***
This Guide has been updated to 1.4. If you need to view the old 1.3 version of this wiki page, click [here](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ/8a86002d330cd4aa54d17012d31322c73bacd94a)
***

<!-- Generated with https://luciopaiva.com/markdown-toc/ -->
# Table of contents

- [Basic Troubleshooting Information](#basic-troubleshooting-information)
  - [Note on tModLoader 64 bit](#note-on-tmodloader-64-bit)
  - [Note on Piracy](#note-on-piracy)
- [General Troubleshooting Steps](#general-troubleshooting-steps)
  - [Switch to Stable tModLoader or to Preview tModLoader](#switch-to-stable-tmodloader-or-to-preview-tmodloader)
  - [Verify Game Integrity](#verify-game-integrity)
  - [Verify Game Integrity Terraria](#verify-game-integrity-terraria)
  - [Fresh Install](#fresh-install)
    - [Fresh Install Terraria](#fresh-install-terraria)
  - [Disable All Mods](#disable-all-mods)
  - [Disable All Resource Packs](#disable-all-resource-packs)
  - [Reset config.json](#reset-configjson)
  - [Flowchart](#flowchart)
  - [Reading client.log](#reading-clientlog)
    - [Simple Explanation](#simple-explanation)
    - [Complicated Explanation](#complicated-explanation)
- [Getting Support](#getting-support)
  - [tModLoader Support](#tmodloader-support)
    - [GitHub Issue Tracker](#github-issue-tracker)
    - [Discord Support](#discord-support)
  - [Mod Issues](#mod-issues)
    - [It has been detected that this mod was built for `tModLoader vX.Y`](#it-has-been-detected-that-this-mod-was-built-for-tmodloader-vxy)
    - [JITException](#jitexception)
- [Launch Issues](#launch-issues)
  - [hostpolicy.dll error](#hostpolicydll-error)
  - [Windows Version N and KN are missing some features / unable to load mfplat.dll](#windows-version-n-and-kn-are-missing-some-features--unable-to-load-mfplatdll)
  - [Black windows appears and closes but nothing else](#black-windows-appears-and-closes-but-nothing-else)
    - [Launch tModLoader Manually](#launch-tmodloader-manually)
    - [Fresh Install](#fresh-install)
    - [Delete `dotnet` folder](#delete-dotnet-folder)
    - [Check Natives.log](#check-nativeslog)
    - [Collect Minidump Instructions](#collect-minidump-instructions)
    - [Disable Proton](#disable-proton)
    - [Check launch.log](#check-launchlog)
    - [Disable RGB Keyboard Features](#disable-rgb-keyboard-features)
    - [Restart Computer](#restart-computer)
  - ["Terraria is out of date" or "Terraria is on a legacy version"](#terraria-is-out-of-date-or-terraria-is-on-a-legacy-version)
  - [An error occurred while updating tModLoader (missing executable)](#an-error-occurred-while-updating-tmodloader-missing-executable)
  - [Failed to start process for tModLoader: "The system cannot find the path specified"](#failed-to-start-process-for-tmodloader-the-system-cannot-find-the-path-specified)
  - [Failed to start process for tModLoader: "The operation completed successfully." 0x0](#failed-to-start-process-for-tmodloader-the-operation-completed-successfully-0x0)
  - [Failed to Load Asset (AssetLoadException)](#failed-to-load-asset-assetloadexception)
  - [Texture2D creation failed! Error Code: Not enough memory resources are available to complete this operation. (0x8007000E)](#texture2d-creation-failed-error-code-not-enough-memory-resources-are-available-to-complete-this-operation-0x8007000e)
  - [Texture2D creation failed! Error Code: The GPU will not respond to more commands, most likely because of an invalid command passed by the calling application. (0x887A0006)](#texture2d-creation-failed-error-code-the-gpu-will-not-respond-to-more-commands-most-likely-because-of-an-invalid-command-passed-by-the-calling-application-0x887a0006)
  - [NoSuitableGraphicsDeviceException: Could not find d3dcompiler_47.dll](#nosuitablegraphicsdeviceexception-could-not-find-d3dcompiler_47dll)
  - [NoSuitableGraphicsDeviceException: Could not create swapchain! Error Code: The parameter is incorrect. (0x80070057)](#nosuitablegraphicsdeviceexception-could-not-create-swapchain-error-code-the-parameter-is-incorrect-0x80070057)
  - [System.DllNotFoundException: Unable to load DLL 'vcruntime140.dll' or one of its dependencies: The specified module could not be found. (0x8007007E)](#systemdllnotfoundexception-unable-to-load-dll-vcruntime140dll-or-one-of-its-dependencies-the-specified-module-could-not-be-found-0x8007007e)
  - [System.BadImageFormatException: An attempt was made to load a program with an incorrect format. (0x8007000B)](#systembadimageformatexception-an-attempt-was-made-to-load-a-program-with-an-incorrect-format-0x8007000b)
  - [Multiple extensions for asset](#multiple-extensions-for-asset)
  - [System.Threading.SynchronizationLockException](#systemthreadingsynchronizationlockexception)
  - [Enabling mods freezes the game/Setting controls doesn't work properly.](#enabling-mods-freezes-the-gamesetting-controls-doesnt-work-properly)
  - [Disk Write Error](#disk-write-error)
  - [Controlled Folder Access](#controlled-folder-access)
  - [System.UnauthorizedAccessException: Access to the path is denied.](#systemunauthorizedaccessexception-access-to-the-path-is-denied)
  - [Unable to load shared library libSDL2-2.0.0.dylib or one of its dependencies on Mac](#unable-to-load-shared-library-libsdl2-200dylib-or-one-of-its-dependencies-on-mac)
  - [No Logs Folder](#no-logs-folder)
- [Audio Issues](#audio-issues)
    - [IAudioClient workaround](#iaudioclient-workaround)
  - [Audio Troubleshooting](#audio-troubleshooting)
- [Multiplayer](#multiplayer)
  - [General Multiplayer Troubleshooting Steps](#general-multiplayer-troubleshooting-steps)
  - [Lag](#lag)
- [Not Responding](#not-responding)
  - [Minidump Instructions](#minidump-instructions)
  - [Can't Click on Anything](#cant-click-on-anything)
- [Load Mod](#load-mod)
    - ["A Mod is crashing when I try to open tModLoader"](#a-mod-is-crashing-when-i-try-to-open-tmodloader)
    - [Begin cannot be called again until End has been successfully called](#begin-cannot-be-called-again-until-end-has-been-successfully-called)
    - [OutOfMemoryException](#outofmemoryexception)
- [Players/Worlds](#playersworlds)
    - [Load Failed!](#load-failed)
    - ["(LaterVersion)" on player or world](#laterversion-on-player-or-world)
    - ["(Unknown error)" on player](#unknown-error-on-player)
    - ["HELP, all my players and worlds are gone!"](#help-all-my-players-and-worlds-are-gone)
    - ["Cloud storage limit reached, unable to move to cloud"](#cloud-storage-limit-reached-unable-to-move-to-cloud)
- [Mod Browser](#mod-browser)
    - ["Mod Browser Offline", "I can't download mods"](#mod-browser-offline-i-cant-download-mods)
    - [Can't download mod, Mod download progress bar stuck at 0.0 bytes](#cant-download-mod-mod-download-progress-bar-stuck-at-00-bytes)
    - [Can't redownload mod](#cant-redownload-mod)
- [Save Data File Issues](#save-data-file-issues)
    - [Windows 10+ OneDrive](#windows-10-onedrive)
      - The Cloud File Provider is Not Running    
      - System.IO.IOException: The cloud operation was unsuccessful
      - System.IO.FileNotFoundException: Could not find the file ...tModLoader\Mods
    - [Unable to find my tModLoader 1.4.3 save data OR Auto-migration of files failed.](#unable-to-find-my-tmodloader-143-save-data-or-auto-migration-of-files-failed)
    - [Config.json Corrupted](#configjson-corrupted)
    - [Attempt to Port from X to Y aborted, the Z file is corrupted.](#attempt-to-port-from-x-to-y-aborted-the-z-file-is-corrupted)
  - [Migration Failed](#migration-failed)
    - [Try again](#try-again)
    - [Manually Port](#manually-port)
    - [Illegal Filenames](#illegal-filenames)
- [Linux / Steam Deck / Mac](#linux--steam-deck--mac)
    - [Compatibility Options](#compatibility-options)
    - [Fails to launch the native build - Click Start in Steam but does nothing](#fails-to-launch-the-native-build---click-start-in-steam-but-does-nothing)
    - [Flatpak, Steam Deck Steam, and related sandboxed applications](#flatpak-steam-deck-steam-and-related-sandboxed-applications)
    - [Arm64 Linux Workaround](#arm64-linux-workaround)
    - [System .NET SDK Could Not Be Found, No Sandboxing](#system-net-sdk-could-not-be-found-no-sandboxing)
- [Other Issues](#other-issues)
    - [Steam Game Recording](#steam-game-recording)
    - [RGB Keyboard Bug (Port 53664)](#rgb-keyboard-bug-port-53664)
    - [Low FPS](#low-fps)
    - [Ghost Mouse](#ghost-mouse)
    - [No mini-map](#no-mini-map)

# Basic Troubleshooting Information
This guide will attempt to help users fix many common issues. Please search through this document for the error you are experiencing. You can use `ctrl-F` to use your web browser to search this page for a word (such as an exception name or error message). If you can't find anything relevant, please try all the suggestions in [General Troubleshooting Steps](#general-troubleshooting-steps). If nothing there helps, you can pursue direct support in the [Getting Support section](#getting-support). Do note that this guide mostly concerns issues with tModLoader itself. If you have an issue with a specific Mod or combination of Mods, see [Mod Troubleshooting Steps](#mod-issues)

## Note on tModLoader 64 bit
Please do not attempt to install "tModLoader 64 bit" into tModLoader, it is no longer useful and will prevent the game from launching correctly. If you have previously installed it and are experiencing issues, your first troubleshooting step is to do a [fresh install](#fresh-install). You will also need to clear out the `Launch Options` by following [these instructions](#failed-to-start-process-for-tmodloader-the-system-cannot-find-the-path-specified).

## Note on Piracy
If you pirated Terraria, we can't help you. tModLoader won't work. Please don't bother us by asking how to get it to work.

# General Troubleshooting Steps
These steps should be followed if your specific issue is not found in the later sections of this guide.

## Switch to Stable tModLoader or to Preview tModLoader
If you are on a `preview` version of tModLoader, there is a greater possibility of tModLoader breaking, so you should switch back to `stable` tModLoader (The `None` beta branch) to see if that solves your problem. Conversely, sometimes bugs are fixed in `preview` versions, so you can switch to the `preview-v2024.X` from `None` to test and see if the upcoming monthly release has a fix for your issue.

<details><summary>Switching tModLoader branches</summary><blockquote>

In Steam, right click on `tModLoader`, select `Properties`, select `Betas`, then select `preview-v2024.X` or `None` in the dropdown. Ignore the access code section. Close the Properties window, you should see tModLoader downloading an update, once it finishes you can launch it.    
![image](https://i.imgur.com/aoy3HEp.png)     

Video instructions:

https://github.com/tModLoader/tModLoader/assets/4522492/bfcacae5-00e2-4488-a778-d2cf214299af    

If you switched to a `preview` version and your issue is resolved, remember that `preview` is mostly for mod makers and testers and you may find that some mods you use are now broken. The fixes being tested in `preview` versions will arrive in `stable` tModLoader near the start of each month (unless there is an extended preview window). If you can avoid the issue, waiting until the start of next month might be better than staying on a `preview` version.

</blockquote></details>

## Verify Game Integrity
Verifying game integrity will restore all files installed by tModLoader in the install folder to their original state. In Steam right click on `tModLoader` in the library, then click on `Properties` click on `Local Files`. Click on `Verify integrity of game files...`. This should start a download of the now missing files. Once that is done, try tModLoader again to see if you issue is resolved. If it isn't, or you are on GOG, follow the [Fresh Install](#fresh-install) instructions.

<details><summary>Verify integrity of game files video instructions</summary><blockquote>

https://github.com/tModLoader/tModLoader/assets/4522492/650c43d3-1bac-49e9-aa5e-32aa91f076cf

</blockquote></details>

## Verify Game Integrity Terraria
tModLoader loads files from the Terraria install folder. Do the same steps above but for Terraria. If you joined the `v1.0.6.1 - Undeluxe Edition` or `v1.1.2 - First Final Update` Terraria beta branch make sure to first switch back to the `None` beta branch.  

## Fresh Install
A fresh install solves many issues preventing the game from launching. After doing a fresh install, **do not** place any other files in the install directory. First, open up the [install location](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install).     

Make sure you opened the install folder, not the saves folder. The saves folder has folders named "Players" and "Worlds" while the install folder has folders such as "tModLoader-Logs" and "LaunchUtils". Now that the install folder is open select all the files and folders and **delete them all**. Next, reinstall tModLoader:
* Steam install: In Steam right click on `tModLoader` in the library, then click on `Properties` click on `Local Files`. Click on `Verify integrity of game files...`. This should start a download of the now missing files. In the install folder, you should see the files start to appear again. 
* GOG install: Install as normal, to the same folder as before.

### Fresh Install Terraria
tModLoader loads files from the Terraria install folder. Do the same steps above but for Terraria. If you joined the `v1.0.6.1 - Undeluxe Edition` or `v1.1.2 - First Final Update` Terraria beta branch make sure to first switch back to the `None` beta branch.

## Disable All Mods
If you are experiencing an issue, it is useful to confirm whether the issue is caused by a Mod or by tModLoader. Usually the cause of issues can be determined by reading the error messages in-game or by [Reading client.log](#reading-clientlog), but if not, disabling all mods and confirming that the issue still happens or doesn't happen is useful. 

First, visit the mods menu and click `disable all` (if your issue is preventing you from getting to the main menu, you can either hold the shift key while the game is launching to skip loading mods or find "enabled.json" in the Mods folder in the saves folder and delete it). Close tModLoader and launch it again. Attempt to replicate the error you experienced before. If the error still happens, it is a tModLoader issue and you should try [Getting Support](#getting-support). If the error doesn't happen, you will need to use the [Flowchart](#flowchart) to identify the mod causing the issue. After

## Disable All Resource Packs
Resource packs can cause issues, disabling all resource packs and then testing again can rule out the resource packs as being the issue. To disable resource packs, you can visit the `Workshop->Use Resource Packs` menu and disable all packs. If you can't get to that menu, close the game, open up `\Documents\My Games\Terraria\tModLoader\config.json` in a text editor, find the "ResourcePacks" section, then change all true to false, save the file. 

## Reset config.json
The `config.json` holds user preference information. Sometimes a buggy value in it can cause issues. You can delete or rename the file to reset preferences to default values to test if it was causing your issue. Open up [the saves folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves) and find `config.json`. Rename `config.json` to `configOld.json`. Renaming it lets you restore it later if you want. When you launch tModLoader, you should see the `Select Language` menu, if you don't, you might have edited the wrong file. If doing this doesn't change anything for your issue, you can close tModLoader and rename the file back to `config.json` after deleting the newly generated `config.json`.

You can do the same for the `input profiles.json` file if your issue is related to keyboard, mouse, or gamepad issues.

## Flowchart
Sometimes a mod is causing issues, but you can't tell which mod is the problem. Use this flowchart to diagnose and determine the bad mod:    
![ModIssueFlowchart](https://github.com/user-attachments/assets/0517bb4b-6b43-4035-b798-9f726ada2ae0)    

## Reading client.log
### Simple Explanation
Most bugs in tModLoader will appear as errors logged to the `client.log` file. Read the file to find mods that are potentially causing bugs.
* Close tModLoader, then reopen tModLoader and repeat the steps necessary to trigger the bug.
* Open the `client.log` file in a text editor, such as notepad. The `client.log` file is found in the [logs folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#logs)
  * To easily open the folder copy `%UserProfile%\Documents\My Games\Terraria\tModLoader\Logs\` to the clipboard with `ctrl-c` and paste it into the address bar in the file explorer with `ctrl-v`. Press enter and the file explorer will go to the folder.    
![](https://i.imgur.com/mdKWVXy.png)    
  * If a window pops up asking "How do you want to open this .log file?", find Notepad in the list, click it, click OK.    
![](https://i.imgur.com/Q7HPPLK.png)    
* Scroll down until you see the first exception in the file. It should look like the image below. Look for indentation followed by the word "at", these lines are the details of the exception. Each exception like this in the log is caused by a bug.
![](https://i.imgur.com/5rA3yR6.png)    
* Look through the exception to find the names of mods you have enabled. The first word after "at" on the lines and before the period is where the names of mods involved in the exception will be shown. Words like "Terraria", "Microsoft", and "MonoMod" can usually be ignored. In this example, the mod named "GadgetGalore" in the exception and is likely a broken mod.
  * If there are multiple mod names in a single stack trace, either mod could be at fault, or both, you'll have to do some testing.
* After finding a mod in an exception, disable it the next time you launch tModLoader and see if the same bug triggers. Repeat the above steps if there are additional mods that are causing bugs.
* If you need help reading your client.log, you can ask for help in the support-forum channel on the [tModLoader Discord chat](https://discord.gg/tmodloader).

### Complicated Explanation
Many errors you might experience while playing tModLoader can be identified by reading the `client.log` file. (If you are experiencing an error that only happens in multiplayer, you'll need to read both `client.log` and `server.log`). By properly reading the log file, you can identify if an issue is caused by a bug in tModLoader or a bug in a mod you are using. Since tModLoader updates to new versions every month, a mod that worked yesterday might be broken today. In any case, the logs are a good place to find the issue.

If you are experiencing a bug, first make sure all mods are up to date, then close tModLoader and reopen it. This will reset the log and make it easier to read. Once you experience the bug, close tModLoader and open the log file. The log file is the `client.log` file found in the [logs folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#logs). Open the file in a normal text editor like notepad if it doesn't have a file association already. 

Next, you'll want to look through the file looking for words like "error" or "exception". Using `ctrl-f` to use the Find feature of your text editor. You'll typically want to focus on the earliest error you can find in the log file. Errors that come after earlier errors might be caused by those earlier errors, so fixing the earlier errors might fix the later errors. Once you find the word "error" or "exception", you should see something similar to this:    
![](https://i.imgur.com/5rA3yR6.png)     
In the above excerpt from `client.log`, we can see an error is being logged. The error begins at line 41, with a brief summary on line 42 shown in blue. After the error summary, there will be a "stack trace" that shows where in the code the error is happening. Take note of the indentation of the lines of the stack trace, shown in green. This indentation is very useful for quickly finding errors logged in the log file rather than using `crtl-f`. Next, you'll want to look through the stack trace for the names of mods you have enabled. The first word after "at" on the lines and before the period is the key word you'll want to look at. Words like "Terraria", "Microsoft", and "MonoMod" can usually be ignored, you want to find the mod or mods that show in the error. In this example, we see a mod named "GadgetGalore" in the stack trace and can make the assumption that it is the cause of the error. If there are multiple mod names in a single stack trace, either mod could be at fault, or both, you'll have to do some testing. Now that we found a mod that is erroring, you can disable the mod and try again. Not every error logged in the logs will an actual bug, so some experimentation may be required. If you need help reading your client.log, you can ask for help in the support channels on the [tModLoader Discord chat](https://discord.gg/tmodloader).

# Getting Support
If everything in this guide fails to solve your issue, you may need direct support.   

Support issues fall into two categories: [Issues specific to a mod](#mod-issues) and [tModLoader Support](#tmodLoader-support)

## tModLoader Support
If you need basic support to get the game running, see [Discord Support](#discord-support), otherwise start at [GitHub Issue Tracker](#github-issue-tracker)
### GitHub Issue Tracker
If your issue is not solved by this guide and you still need help first check [the tModLoader Issue Tracker](https://github.com/tModLoader/tModLoader/issues) and search for your issue to see if it has already been reported. If you find your issue, please add a :thumbsup: reaction to the issue to help us prioritize issues. To add the :thumbsup: reaction, click on the smile icon on the top right, then click on :thumbsup:: 

![](https://i.imgur.com/EDBwXtc.png)

It might also be useful to add a comment to the issue with `client.log` and other useful information you can provide to help identify the cause of the issue. There might also be a workaround in the comments that you can follow to fix the issue on your end.

### Discord Support
If you do not find your issue in the issue tracker, you should visit the `#support-forum` channel on the [tModLoader discord](https://discord.gg/tmodloader). Discord is a free chat service you can access in your browser. We will not provide support for support issues here on GitHub. Once you find the `#support-forum` channel, make a new thread and describe your issue. You'll also need to post all your logs by opening up the [logs folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#logs) and dragging the files into the chat. Someone there should be able to help you.

<details><summary>Post logs to Discord video instructions</summary><blockquote>

https://github.com/tModLoader/tModLoader/assets/4522492/3f4efa43-753f-4733-b630-ba85e711340c

</blockquote></details>

## Mod Issues
If a specific mod is causing your issue, you should visit the [mod's workshop page](https://steamcommunity.com/app/1281930/workshop/). Read the `Description` and see if the mod maker has a preferred contact method for bugs, such as a `GitHub` or `Discord`. If there is one, use it. If not, making a comment on the workshop page with your issue should let the creator know. If the bug is game-breaking, you will have to disable the mod or wait for it to be fixed by the author.

### It has been detected that this mod was built for `tModLoader vX.Y`
This message is a boiler-plate message, it is purely informational. If the version starts with `v0.X`, then you are trying to load a legacy mod and it won't work, you need to delete the mod and find it or a replacement on the current mod browser. If the version starts with `v202X`, then you should look at the next paragraph in the error message for the real error. If multiple mod names show up in the error, it may be a mod incompatibility. The author will be able to figure it out.

### JITException 
If you see this, the mod might be out of date. tModLoader updates every month and sometimes those updates will break mods. If it is the start of a month, the author might just be slow in updating. You will have to disable this mod until it is fixed. If you manually installed a mod, the mod will be purple on the `Mods` menu and you should delete it and use the workshop version.

# Launch Issues
Some users have reported issues when Terraria or tModLoader are installed on an external drive. If you are having issues not mentioned below, please try installing on your normal hard drive. 

## hostpolicy.dll error
Follow the instructions in the [Black windows appears and closes but nothing else](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#black-windows-appears-and-closes-but-nothing-else) section.

## Windows Version N and KN are missing some features / unable to load mfplat.dll
You will need to download the Windows Media Pack, as it wasn't shipped with your Windows installation.
Follow this [guide](https://answers.microsoft.com/en-us/windows/forum/all/mfplatdll-is-missing-cant-install-media-feature/15964b8d-9e43-4ea9-b073-bd20794b6f4d). You'll need to expand the "Replies" section to see the 1st answer. Users have reported that if installing the feature doesn't solve the issue, following the "method 2" steps mentioned in the same post, the "Enabling Media Playback from an elevated Command Prompt" instructions, worked.

## Black windows appears and closes but nothing else
There are a variety of issues that can cause this issue. If none of these suggestions work, please come to the [tModLoader Discord Support](#discord-support)

### Launch tModLoader Manually    
Sometimes launching manually can bypass certain launch issues. Open up the [tModLoader install folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install) and double click on "start-tModLoader.bat". If this works, you should still try to fix the issue through other steps here or in [tModLoader Support](#tmodLoader-support) since launching this way is inconvenient.

If, when you try this, an error message shows "Windows cannot find '[InstallFolderHere]/start-tModLoader.bat'. Make sure you typed the name correctly, and then try again.", then somehow your Windows has been corrupted and has a bad file association for `.bat` files. This issue will prevent your computer from running any `.bat` file, which might affect other programs, so it would be good to fix. Users have reported that following the steps in [this article](https://www.winhelponline.com/blog/bat-files-do-not-run-when-double-clicked-fix-association/) have worked for them.

If the window immediately closes, one reported cause of this is the command prompt itself being broken. Try opening the command prompt from the start menu. If you can not do that, your computer is in a broken state and that will need to be fixed before attempting anything else. One user reported that their computer had a bad value in their registry, they followed [this stackoverflow answer](https://stackoverflow.com/questions/5373137/cmd-exe-closes-immediately-after-calling-win7-64/5374418#5374418) to remove the bad registry value. If this isn't the case, you'll need to google for some other fix to command prompt not launching.

### Fresh Install
Follow the [Fresh Install](#fresh-install) and [Fresh Install Terraria](#fresh-install-terraria) steps. This may seem like a lot of effort but it solves a large portion of issues.

### Delete `dotnet` folder    
Deleting the `dotnet` folder in the [tModLoader install folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install) might help. If the issue persists, check that your antivirus isn't quarantining any of the files. The `dotnet\shared\Microsoft.NETCore.App\8.0.0` folder should have `184` items in it. If it doesn't, ensure that your OS is 64 bit and install the [dependencies](https://learn.microsoft.com/en-us/dotnet/core/install/windows?tabs=net80#additional-deps) listed for your OS before deleting the `dotnet` folder and trying again.

Note: If your console window indicates that it is having trouble downloading dotnet on GOG, then you can manually download [dotnet 8.0.0](https://dotnetcli.azureedge.net/dotnet/Runtime/8.0.0/dotnet-runtime-8.0.0-win-x64.zip) and place it in the `LaunchUtils` folder in the [install folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install). The file should be named `dotnet-runtime-8.0.0-win-x64.zip`. Delete the `dotnet` folder once again and try launching again.

If you are still having issues, and `dotnet\dotnet.exe` or the mentioned `184` files are not all there, you can manually install the included dotnet. Delete the `dotnet` folder, then make the `dotnet` folder again and open it. In a separate file explorer window, open the `LaunchUtils\dotnet-runtime-8.0.0-win-x64.zip` file, you should see 2 folders and 3 files contained within. Drag all of those folders and files into the `dotnet` folder you created earlier.

If you are still having issues with dotnet, some users have reported that installing the [dotnet sdk](https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/sdk-8.0.204-windows-x64-installer) to their computer after deleting the `dotnet` folder fixed the issue. Our guess is that the full installer fixes some issues that were preventing our installer from working.

If you are still having issues after a reinstall, make sure "Run this program as an administrator" is not set on `dotnet.exe`.

<details><summary>Check "Run this program as an administrator" setting instructions</summary><blockquote>

Open the `dotnet` folder and right click on `dotnet.exe` and select `Properties`. Click on the `Compatibility` tab. Look for a `Run this program as an administrator` checkbox and make sure it is unchecked. Click `OK` and try running the game again.

![image](https://github.com/tModLoader/tModLoader/assets/4522492/7b557d5c-17ec-4e0b-b67d-1c93acfe436c)

</blockquote></details>

### Check Natives.log    
In the [logs folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#logs), open up `Natives.log`. 
* If it says "An assembly specified in the application dependencies manifest (Microsoft.NETCore.App.deps.json) was not found" or something similar, double check that you followed all the steps in **Delete `dotnet` folder** suggestion above.    
* If it says "System.AccessViolationException: Attempted to read or write protected memory.", follow the [Fresh Install](#fresh-install) and [Fresh Install Terraria](#fresh-install-terraria) steps.
* If it says "Assertion failed: !FAILED(hr) && "Failed to find supported audio format!"" or "Assertion failed: !FAILED(hr) && "Failed to activate audio client!"", follow the **Change audio devices** section of [Audio Troubleshooting](#audio-troubleshooting).
* If it says "./LaunchUtils/ScriptCaller.sh: exec: line 83: C:/Program Files (x86)/Steam/steamapps/common/tModLoader/dotnet/dotnet.exe: Invalid argument", follow the [Delete dotnet folder](#delete-dotnet-folder) steps.
* If it says "Fatal error. System.AccessViolationException: Attempted to read or write protected memory. This is often an indication that other memory is corrupt.
   at System.Globalization.CompareInfo.IcuCompareString(System.ReadOnlySpan'1<Char>, System.ReadOnlySpan'1<Char>, System.Globalization.CompareOptions)", then open up `tModLoader.runtimeconfig.json` in the install folder and add `"System.Globalization.UseNls": true,` before the `DEFAULT_STACK_SIZE` line and save.
* If it says "Could not load ICU data. UErrorCode: 2" follow the instructions in the bullet above.
* If it says "Assertion failed: 0 && "Effect output format not supported", file C:\Games\Terraria\tModLoader\FNA\lib\FAudio\src\FAudio.c" then disable the TerrariaAmbiance mod or adjust your selected output device output rate to be 48000 Hz or 44100 Hz.
* If the file is completely empty, you may have to try many different suggestions on this page. 
  * The most recent report of this issue was fixed by reinstalling or fixing the `Microsoft Visual C++ 2015 Redistributable Update 3` install as mentioned in the [vcruntime140.dll section above](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#systemdllnotfoundexception-unable-to-load-dll-vcruntime140dll-or-one-of-its-dependencies-the-specified-module-could-not-be-found-0x8007007e) and then restarting the computer. 
  * Another recent report of this issue was caused by an attached USB controller. In this user's specific case they had Xbox 360 Controller Emulator (x360ce) installed. The issue came from a related driver from mayflash, specifically a `EZFRD64.dll` driver located in `C:/Windows/USB Vibration/7906`. Disconnecting the controller fixed the issue. It may be possible to update this driver, but that was not tested.
  * If nothing else works, you might need to come to [our Discord support forum](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#discord-support) and ping jopojelly with a minidump file. The instructions for that are shown below.

### Collect Minidump Instructions
A minidump file can be generated to provide tModLoader developers more information about a bug causing a silent crash. A silent crash is a crash that has no errors in any of the log files. There is no need to follow these instructions for crashes that have errors reported in any of the log files.

<details><summary>Expand for Minidump Instructions</summary><blockquote>

To do this, download https://download.sysinternals.com/files/Procdump.zip and extract the zip into the tModLoader install folder. Make a folder called `dump` in the install folder. Open a command prompt in the tModLoader folder by typing `cmd` in the file explorer address bar and then pressing enter.      
![image](https://github.com/user-attachments/assets/4de9dadb-c71d-4fe2-8b6d-880a66de3f85)    
This will open a command prompt, make sure it's your install folder:      
![image](https://github.com/user-attachments/assets/f1ccdee8-23fe-4ec1-ae0f-e9687f15c05c)     
In the command prompt, type `procdump.exe -e -x .\dump dotnet\dotnet.exe tModLoader.dll -console` and then press enter:    
![image](https://github.com/user-attachments/assets/f31ff6a8-ad5d-4dcc-a814-f0d09238dbed)    
The game should start loading and then crash at the point where it crashes. Once it does, check the `dump` folder for a `.dmp` file. This is the file you'll need to upload to the Discord forum post (you can just drag and drop it into Discord). Make sure to also ping jopojelly, a tModLoader developer, for help for this particular issue. If you don't have a `.dmp` file, then we can investigate further on Discord.    
![image](https://github.com/user-attachments/assets/4b6a5600-9cd6-4e50-aa17-fec9f2d93172)    

</blockquote></details>

### Disable Proton    
Do not use Proton on Linux, it will not work. If you did, you'll have to [Delete dotnet folder](#delete-dotnet-folder) after disabling Proton for tModLoader.

If you made players and worlds while launched with Proton, you'll need to move them to the correct save directory to use them once again. To do this, find the Proton save location by opening up `/home/[username]/.local/share/Steam/steamapps/compatdata/1281930/pfx/drive_c/users/steamuser/Documents/My Games/Terraria/tModLoader`. You can take all of the files, or just the files you want, and copy them over to [the correct saves folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves).

### Check launch.log    
Open up `launch.log` found in the [logs folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#logs). If the word "FAudio" shows up in your log, you might want to try the [IAudioClient-workaround.zip](https://github.com/tModLoader/tModLoader/issues/2863#issuecomment-1221975856)

If after applying the workaround, you see "Unable to load DLL 'FAudio' or one of its dependencies: The specified module could not be found. (0x8007007E)", then one possibility is you didn't follow the instructions to replace all of the files with the files from the .zip and only replaced the FAudio.dll file. All the files need to be copied over.

### Disable RGB Keyboard Features    
Even if you don't think you have RGB keyboard, this can help. Follow the [RGB Keyboard Bug (Port 53664)](#rgb-keyboard-bug-port-53664) instructions.

### Restart Computer    
Restarting the computer solves many issues tModLoader users face. It may seem trite, but it works, give it a try.

## "Terraria is out of date" or "Terraria is on a legacy version"
![dotnet_2024-04-24_13-31-39](https://github.com/tModLoader/tModLoader/assets/4522492/f7b8d92a-1c81-4662-a13d-a597efbf8914)    

If you get a message saying "Terraria is out of date, you need to update Terraria in Steam", then follow the [Verify Game Integrity Terraria](#verify-game-integrity-terraria) steps.    

![dotnet_2024-04-24_13-33-41](https://github.com/tModLoader/tModLoader/assets/4522492/29e2e369-fcf5-4f3a-98f1-deb95c4c4ac7)    

If you get a message that "Terraria is on a legacy version, you need to switch back to the normal Terraria version in Steam for tModLoader to load", then follow the [Verify Game Integrity Terraria](#verify-game-integrity-terraria) steps after switching back to the normal Terraria beta branch. To do this, right click on Terraria in Steam and select `Properties...`, click on `Beta`, then select `None` in the `Beta Participation` dropdown menu.     

## An error occurred while updating tModLoader (missing executable)    
![image](https://user-images.githubusercontent.com/4522492/194225008-48810974-7292-4b5b-974a-e03363b4383f.png)    
This is usually solved by restarting the computer after confirming that you have switched to the `None` branch for tModLoader and verifying game integrity, and following the next section.

## Failed to start process for tModLoader: "The system cannot find the path specified"
![image](https://user-images.githubusercontent.com/4522492/194225054-b0d9cac7-10fd-4864-87e9-0d16c9418ed1.png)    
This is caused by previously installing `tModLoader 64 bit`. First do a [fresh install](#fresh-install) if you haven't already, then right click on `tModLoader` in `Steam` and select `Properties`. Make sure `Launch Options` is completely empty, then close the window.    
![image](https://user-images.githubusercontent.com/4522492/194367542-7f6d2700-542e-4a14-8074-68fb9a9c7677.png)     

## Failed to start process for tModLoader: "The operation completed successfully." 0x0
![failiuyre](https://github.com/tModLoader/tModLoader/assets/4522492/5b6c8c50-ec14-42d2-bc4c-32474b500e99)    
We've seen this reported when the file association for `.bat` files was broken. Open up the install folder and look at the `start-tModLoader.bat` file. The icon should look similar to this:    
![image](https://github.com/tModLoader/tModLoader/assets/4522492/0e2e487e-de0b-4214-af13-b6a4f09fcc66)    
If it doesn't, the file association for `.bat` files has been changed. This shouldn't happen, you might want to scan for viruses. After that, you'll want to use Google to figure out how to fix the `.bat` file association for your Windows version.

## Failed to Load Asset (AssetLoadException)
![image](https://user-images.githubusercontent.com/4522492/194373688-06a6aedc-ca27-4fe5-9587-7971a6e6c09e.png)    
This is usually caused by your Terraria install being out of date. First, launch Terraria and confirm that it is updated to the [latest version](https://terraria.fandom.com/wiki/PC_version_history) by looking in the bottom right corner. Next, follow the [Verify Game Integrity Terraria](#verify-game-integrity-terraria) instructions. If this doesn't solve the issue, it might be a mod causing this issue.

## Texture2D creation failed! Error Code: Not enough memory resources are available to complete this operation. (0x8007000E)
This means your computer has run out of video memory, or VRAM for short. This is not the same as free disk space or normal PC memory (RAM), with the exception of non-dedicated graphics accelerators in laptops being able to use the latter to compensate for small or non-existent amounts of VRAM.

Here's some tips that may help:
* Task Manager's `Performance -> GPU 0` tab can show you VRAM usage and other graphics information.
* Close programs like browsers, perhaps even Discord as an extreme measure, and try again.
* Skip loading mods by holding left shift while the game is opening.

## Texture2D creation failed! Error Code: The GPU will not respond to more commands, most likely because of an invalid command passed by the calling application. (0x887A0006)
This is the same as [above](#texture2d-creation-failed-error-code-not-enough-memory-resources-are-available-to-complete-this-operation-0x8007000e). It has been reported that using OpenGL or Vulkan by following the instructions in the [Low FPS section](#low-fps) has solved this issue for some users.

## NoSuitableGraphicsDeviceException: Could not find d3dcompiler_47.dll
If you are on Windows 7, you'll need to install the [directX package from Microsoft](https://support.microsoft.com/en-us/topic/update-for-the-d3dcompiler-47-dll-component-on-windows-server-2012-windows-7-and-windows-server-2008-r2-769c6690-ed30-4dee-8bf8-dfa30e2f8088). Restart your computer after running and finishing the installer.

## NoSuitableGraphicsDeviceException: Could not create swapchain! Error Code: The parameter is incorrect. (0x80070057)
This is related to the capability of your graphics card. You can try updating video drivers, or you can try using OpenGL or Vulkan instead by following the instructions in the [Low FPS section](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#low-fps).

## System.DllNotFoundException: Unable to load DLL 'vcruntime140.dll' or one of its dependencies: The specified module could not be found. (0x8007007E)
If you have this issue, the [Microsoft Visual C++ 2015 Redistributable Update 3](https://www.microsoft.com/en-us/download/details.aspx?id=53587) download site should open in your web browser automatically. Click `Download` to download the installer and run it to install these libraries. This should fix the issue, you may need to restart the computer. If it doesn't fix the issue, [download and install this updated version](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170#visual-studio-2015-2017-2019-and-2022) and try again. You'll want to click on the X64 download. ([Direct link](https://aka.ms/vs/17/release/vc_redist.x64.exe))

## System.BadImageFormatException: An attempt was made to load a program with an incorrect format. (0x8007000B)
Most reports of this issue have been solved by reinstalling or fixing the `Microsoft Visual C++ 2015 Redistributable Update 3` install as mentioned in the [vcruntime140.dll section above](#systemdllnotfoundexception-unable-to-load-dll-vcruntime140dll-or-one-of-its-dependencies-the-specified-module-could-not-be-found-0x8007007e). (WIP solution, investigate more.)

## Multiple extensions for asset
This is caused by an incompatible resource pack. Currently some resource packs are incompatible with tModLoader. To fix this, open up `\Documents\My Games\Terraria\tModLoader\config.json` in a text editor, find the "ResourcePacks" section, then change all `true` to `false`, save the file. Now tModLoader should launch again. The issue will be fixed eventually, thumbs up the [issue](https://github.com/tModLoader/tModLoader/issues/2913) to prioritize this issue being fixed.

## System.Threading.SynchronizationLockException
![](https://i.imgur.com/IkPqCo6.png)    
Solution. Disable BitDefender or disable the Safe Files feature of Bit Defender. Some more info has been collected [here](https://www.bitdefender.com/consumer/support/answer/2700/).

## Enabling mods freezes the game/Setting controls doesn't work properly.
This is most likely related to your antivirus blocking access to the `tModLoader` folder in the Documents directory. See the [below issue](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#systemunauthorizedaccessexception-access-to-the-path-is-denied) for the process (but do this with the folder instead of the exe)

## Disk Write Error
If you try to install tModLoader through Steam and it gives you a message with "Disk Write Error" in it, it is usually caused by Avast. Disable it temporarily and install tModLoader.

## Controlled Folder Access
![](https://i.imgur.com/Zn40Ohq.png)    

Controlled Folder Access is a Windows 10+ security feature intended to prevent ransomware. It is a useful feature, but it will get in the way of tModLoader saving files to the Documents folder where game save files are typically installed. If you have this feature enabled, you can add an exception to tModLoader to allow it to work. You can also just disable the feature completely, but don't do that unless you know what you are doing.

<details><summary>Adding an exception</summary><blockquote>

The easiest way to add an exception for tModLoader is to press `OK` on the error, then click on the notification that appears:  
* If the notification doesn't appear within 5 seconds, you can visit the action center at the bottom right corner of the screen and find it there. If it is not there, search "Controlled folder access" in the start menu, click it, then click "Block History"    
![image](https://user-images.githubusercontent.com/4522492/176323144-fa85ff75-8759-414c-aeff-22ac0be0bf69.png)    

Click on the first result:    
![image](https://user-images.githubusercontent.com/4522492/176323195-14185202-e1be-4cf8-a62e-08b2c9a84a96.png)    

Click `Yes` when asked "Do you want to allow this app to make changes to your device":    
![image](https://user-images.githubusercontent.com/4522492/176323236-8f69f573-78be-4335-af93-5cd05cc51d56.png)    

You should now see information explaining that "dotnet.exe" was blocked from accessing the [saves folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves) (The saves folder is typically `"My Games\Terraria\tModLoader"`):    
![image](https://user-images.githubusercontent.com/4522492/176323400-53b3235e-7be1-4e62-8733-2de967532eb2.png)    

Click `Actions` and then `Allow on Device`:    
![image](https://user-images.githubusercontent.com/4522492/176323452-28e6c171-796e-49a9-87d1-77cbf1579733.png)    

You will once again be asked "Do you want to allow this app to make changes to your device", click `Yes`:    
![image](https://user-images.githubusercontent.com/4522492/176323236-8f69f573-78be-4335-af93-5cd05cc51d56.png)    

tModLoader should now be able to create the save files it needs. Launch the game again.

</blockquote></details>

If you followed the directions and still can't solve the issue, a last resort is to tell tModLoader to save to the [install directory](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install) instead. You can do this by creating a `savehere.txt` file in the [install directory](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install). See the [savehere.txt save location workaround](#saveheretxt-save-location-workaround) instructions below.

## savehere.txt save location workaround

If you are unable to get the game to launch because of file access issues caused by OneDrive issues, Controlled Folder Access issues, or any other file system issue, there is a final workaround option available that will tell tModLoader to save to the [install directory](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install) instead of the `My Documents` folder. 

By saving in the install directory, all complications resulting from saving in `My Documents` can be avoided, but it should be known that this will mean that OneDrive will not sync and backup your files, if you were relying on that feature. Steam cloud saves will still work (players and worlds), but mod configurations and other miscellaneous files will not be backed up as they would if you were using OneDrive to do that.

To do the `savehere.txt save location workaround`, create a `savehere.txt` file in the [install directory](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install). The video below shows how.

<details><summary>savehere.txt video instructions</summary><blockquote>

https://github.com/tModLoader/tModLoader/assets/4522492/3c925905-0a4a-4a55-a664-6ddd8dddd995    

</blockquote></details>

## System.UnauthorizedAccessException: Access to the path is denied.  
![](https://i.imgur.com/ZjhIvNo.png)

This issue can be caused by your antivirus or windows security settings. If you're using Windows Security (formerly Windows Defender) and are getting this error, then you will need to add "dotnet.exe" to your whitelist, for further instructions on how to do this continue reading below.

First, follow the instructions in the [Controlled Folder Access](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#controlled-folder-access) section above, if that doesn't work then follow the steps below.

<details><summary>Adding "dotnet.exe" to your whitelist</summary>

![Right-Click and open security dashboard.](https://i.imgur.com/2Lj2Wrx.png)  
Right-Click Windows Security in your system tray and select "View Security Dashboard"

![Select "Virus & Threat protection"](https://i.imgur.com/Uc5a5WL.png)  
Left-Click "Virus & threat Protection"

![](https://i.imgur.com/OJNFSd5.png)  
From there, Left-Click "Manage settings" under "Virus & threat protection settings"

![Scroll down.](https://i.imgur.com/2nhsK3a.png)  
Scroll down until you find the "Controlled folder access" section, and then left-click "Manage Controlled folder access"

![](https://i.imgur.com/DnT3LLQ.png)  
Left-Click "Allow an app through controlled folder access"

![](https://i.imgur.com/Az03a4f.png)  
![](https://i.imgur.com/WLovfFc.png)  
Left-Click "Add an allowed app", and select "Recently blocked apps"

![image](https://github.com/tModLoader/tModLoader/assets/4522492/78d94913-578e-4fbb-94de-138720efef86)    

Scroll through the list until you find "dotnet.exe", and click the + and then close, after this you're done! (If you cannot find "dotnet.exe" on your list, then continue with the below steps)

![image](https://github.com/tModLoader/tModLoader/assets/4522492/0335069e-4058-4400-9ca9-0fdc61b50a14)    

Back in the "Add allowed app" selection, left-click "Browse all apps"

![image](https://github.com/tModLoader/tModLoader/assets/4522492/e2e5a8b0-738e-456f-af52-2e839979adef)    

Navigate to the [tModLoader install folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install) and then navigate to and select "dotnet/dotnet.exe", then press `Open`. This will add the file to your whitelist. Done!

</details>

## Unable to load shared library libSDL2-2.0.0.dylib or one of its dependencies on Mac
This has been reported to be an issue when manually downloading the tModLoader zip to install for a GOG user. When downloading files on Safari, the file is tagged by the OS as being from the internet. Users can use the `xattr -d com.apple.quarantine` command in a command prompt to clear the flag on the files mentioned. If you have more information about this particular fix, please update this section.

## No Logs Folder
If you are having a launch issue and can't find the logs folder, it has been reported that some antivirus like Comodo are the cause of the logs folder not being generated. This issue has been reported alongside "SteamAPI.Init failed. Try logging out of Steam and restarting it." errors. Another possibility is that you have 2 tModLoader install folders accidentally and are looking in the wrong place for the [logs folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#logs).

# Audio Issues
### IAudioClient workaround
Try the [IAudioClient workaround](https://github.com/tModLoader/tModLoader/issues/2863#issuecomment-1221975856).

## Audio Troubleshooting
Audio issues are particularly hard to identify, try these troubleshooting steps if your issue is not listed. For each of these make sure tModLoader is closed while you try these changes:

**Fresh Install**    
Manually installed wave banks can cause issues, following the [Fresh Install](#fresh-install) and [Fresh Install Terraria](#fresh-install-terraria) steps will ensure that those files are removed. You might not remember manually installing wavebanks, but other things like installing `tModLoader 64 bit` could do this incidentally.

**Disable All Resource Packs**    
Follow the [Disable All Resource Packs](#disable-all-resource-packs) instructions. 

**Change audio devices**    
For example if you are using headphones, switch to your speakers. If you don't have speakers, try plugging some in. Try launching tModLoader.

**Check audio output rate**    
Try changing your audio output rate to be less than or equal to 48000 Hz. The most common output rates are 44100 Hz and 48000 Hz. Rates greater than 48000 Hz may cause crashes while certain mods are enabled. To do this, right click on the speaker icon in the notification area, click "Sounds", navigate to the "Playback" tab, click on your current playback device and click properties, navigate to the "Advanced" tab, then adjust the output rate in the "Default Format" section.

**Voicemeeter**
If you have Voicemeeter installed and see "Failed to initialize audio client" or "WASAPI" errors, try changing your A1-A5 to different devices. Even if you change the Stereo Input to a different device, it will still cause device issues if the Default A1 is having issues.

**Unplug Controllers**    
Some controllers have speakers in them that might be causing issues with our audio playback code, try unplugging them and then launching tModLoader.

**Reset config.json**    
Follow the [Reset config.json](#reset-configjson) instructions. 

**Try the IAudioClient workaround**    
Windows: Try the [IAudioClient workaround](#iaudioclient-workaround).

**Mac No Audio Hardware - Try replacing Natives with vanilla Terraria files** 
Replace all files found in `Native/OSX` with their vanilla copies (libFAudio, libSDL2, libSDL2-2.0.0 at minimum)
From `~/Library/Application Support/Steam/steamapps/common/Terraria/Terraria.app/Contents/MacOS/osx`
To `~/Library/Application Support/Steam/steamapps/common/tModLoader/Libraries/Native/OSX`

**Set Volume to 0**    
If audio issues prevent the game from launching, open up [the saves folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves) and find `config.json`, open the file in a text editor. Find "VolumeMusic", "VolumeAmbient", and "VolumeSound". For each of these, change the number to `0`. Save the file. If this works, the issue is audio related, other steps in this guide might be able to restore audio so you can turn the volumes back up.

# Multiplayer

## General Multiplayer Troubleshooting Steps
Before looking here for support, first make sure multiplayer works in Terraria itself. If Terraria multiplayer doesn't work, then you'll need to first troubleshoot that issue. There are guides for both [LAN/Internet](https://terraria.wiki.gg/wiki/Guide:Setting_up_a_Terraria_server) and [Steam invite](https://terraria.wiki.gg/wiki/Guide:Setting_up_Steam_Multiplayer) multiplayer on the official Terraria wiki that go over port forwarding, IP addresses, and other necessary steps and terminology. This FAQ only lists multiplayer issues specific to tModLoader and expects that any general networking issues have already been resolved. 

Additionally, if you are looking for information on how to setup a multiplayer server, then read [this guide](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/release_extras/DedicatedServerUtils/README.md).

Finally, the [Debugging Multiplayer Usage Issues wiki page](https://github.com/tModLoader/tModLoader/wiki/Debugging-Multiplayer-Usage-Issues) has most of the multiplayer-specific instructions, read that page first and then come back here if your issue is not solved yet.

## Lag
TODO: Disable mods, verify where issue is coming from.

* One user reported that their anti-virus, "360 Security Guard", was causing extreme lag. They disabled it to fix the lag.

# Not Responding
When the game stops responding, that is indicative of the game logic being stuck in an infinite loop. This type of issue can be very hard to diagnose. A capable programmer can use a minidump file to investigate the cause of the issue. If the issue is in a mod, hopefully that modder will fix their mod, if it is in tModLoader we can work on fixing it.

## Minidump Instructions
If your tModLoader stops responding and goes white, you can provide us with a minidump file and it will help us debug the issue.    
![unknown (2)](https://user-images.githubusercontent.com/4522492/179609389-3eafa688-1039-4448-a35d-c1aef6f3d037.png)    

<details><summary>Expand for Minidump Instructions</summary><blockquote>

To do this, download https://download.sysinternals.com/files/Procdump.zip and extract the zip. Open a command prompt in that folder by typing `cmd` in the file explorer address bar and then pressing enter.    
![unknown (3)](https://user-images.githubusercontent.com/4522492/179609489-f7115dfc-1c27-4ec3-a945-1e1c5aa46f44.png)    
This will open a command prompt:    
![unknown (4)](https://user-images.githubusercontent.com/4522492/179609511-d507817b-8734-4db2-9b1e-77f71342758c.png)    
Next, open task manger by pressing ctrl-shift-escape. Click Details, then scroll down to the dotnet.exe that is Not Responding:    
![unknown (5)](https://user-images.githubusercontent.com/4522492/179609519-92cdfca1-0791-46ff-9bc2-9ae11d82325e.png)    
Take note of the PID. In this image, it is 20680, but yours will be different. Go back to the command prompt and type `procdump.exe -mm 20680`, except change 20680 to your number. After a few seconds it will be done:    
![unknown (6)](https://user-images.githubusercontent.com/4522492/179609528-13ab0f1e-eec9-4606-8f05-5f4966aa79eb.png)    
Back in the file explorer, you can see the .dmp file:    
![unknown (7)](https://user-images.githubusercontent.com/4522492/179609674-8ac1b5f4-27fd-48d6-a42d-1aad83e75de6.png)     
Find some way of uploading this file to us on the Discord support channel. We have nitro boosts so you should just be able to drag and drop the file into the support thread.

</blockquote></details>

## Can't Click on Anything
If you find that you can't click on anything, you might have a broken `input profiles.json`. Follow the [Reset config.json](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#reset-configjson) steps pertaining to `input profiles.json`.

# Load Mod
### "A Mod is crashing when I try to open tModLoader"
You can skip loading mods by holding shift while tModLoader is loading until it reaches the main menu. Visit the `Workshop->Mods` menu to disable or delete the mod. If you need to directly delete a mod, you can unsubscribe on the [workshop](https://steamcommunity.com/app/1281930/workshop/). If you need to delete a manually installed a mod, open up the tModLoader [mods folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#mods) and delete the offending .tmod file.

### Begin cannot be called again until End has been successfully called
(Also applies to "Cannot access a disposed object" errors)    
![](https://i.imgur.com/jzbyghT.png)    
This error is an error usually caused by an unhandled error in a mod. This makes it hard for users to know which mod is broken. Much of the time this error will only happen after reloading mods (improperly unloaded Texture2D references), but it can happen due to other errors (for example, dividing by zero.) As a user of mods, it can be hard to figure out which mod is causing the issue. To determine the broken mod, follow the steps in [Reading client.log](#reading-clientlog). The mod causing the error causing this crash should be in the last or second to last entry. If you find a mod mentioned in one of those errors, that is likely the mod causing the error. If in doubt, ask in #support-forum on the [tModLoader discord](https://discord.gg/tmodloader). As a last resort, use the [flowchart](#flowchart).

### OutOfMemoryException
This error means that tModLoader does not have enough RAM to load all the mods that you are trying to load. Large mods that add lots of items are the main culprit. You may have to cut down on the number of large mods you are trying to load at the same time. You can also try loading Small or Medium worlds instead of Large. Another possibility is that you have other large programs running. If you can close them, do so. Press `Ctrl+Shift+Escape` to bring up the Task Manager. In the Task Manager's Processes tab, look for processes that take up a large amount of memory. Anything taking more than 100,000 K is a good candidate. 

tModLoader lists 6 GB of RAM as the minimum system requirements, but that minimum will increases depending on the mods enabled.

Viewing Mods that use a lot of Memory:
If you are curious which mods are using your limited Ram, you can enable the "Show Mod Memory Estimates" option in `Settings->tModLoader Settings`. After enabling the setting, you will have to exit to the main menu and then close and reopen the game for the setting to take effect. Visit the Mods menu, make sure you enable and reload the mods you are curious about, and you should now see colorful graph at the top that shows how much memory each mod is using. Use this information to disable mods that take too much ram compared to how much you enjoy the content.

![](https://i.imgur.com/3Pl6tG2.png)

# Players/Worlds
### Load Failed!
When a world fails to load, usually this is caused by a buggy mod. To test this, disable all mods and see if the world loads. If that works, slowly add a few mods at a time and attempt to load the world. Eventually the world won't load again and you can reload mods once again to isolate the mod causing the world to not load. Once you figure out which mod is causing the world to not load properly, you'll want to seek out help from the mod creator, see [Mod Issues](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#mod-issues) for information on how to find mod-specific help.

### "(LaterVersion)" on player or world
![dotnet_2022-10-05_11-04-59](https://user-images.githubusercontent.com/4522492/194119673-44d0ad77-613b-4e6e-8198-20213d2b45c4.png)    
This means that you migrated a player or world from a version of Terraria newer than the version of Terraria your version of tModLoader was built for. When Terraria updates, it takes a while for tModLoader to update, you'll have to be patient and wait for tModLoader to update to use that player or world.

### "(Unknown error)" on player
![unknown (11)](https://user-images.githubusercontent.com/4522492/194117229-e0345d6f-7852-4f5d-916f-7a3a0e01b4d3.png)    
This means that tModLoader can't load the player for some reason. We are constantly looking into causes of this. To fix this issue, you'll need to [restore the player from a backup](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#world-and-player-backups). If you notice that your player consistently corrupts after restoring backups, it may be a broken mod. You can try [Getting Support](#getting-support), someone may be able to diagnose the issue.

### "HELP, all my players and worlds are gone!"
tModLoader saves are kept separate from vanilla Terraria saves. You can copy back and forth between save locations, but be aware that you will lose Modded Tile and Items if you use tModloader worlds/characters in vanilla.

Solutions: To copy from Terraria to tModLoader, use the `Migrate individual players...` button in the tModLoader player and world select menus. Note that if tModLoader is currently not up to date with Terraria, the players and worlds will be too new to open. Also note that files stored on the cloud will not show up, you'll need to take the file off the cloud first, see below.    
![](https://i.imgur.com/0CJ9FKM.png)    

To migrate a player or world from tModLoader to Terraria, you'll need to copy from the [tModLoader saves](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves) folder to the Terraria saves folder. (The Terraria saves folder should be the parent folder of the tModLoader folder.) For example, copy .wld files in `\Terraria\Worlds` to `\Terraria\tModLoader\Worlds`, and the same for the .plr files in the corresponding `Players` folders. For players you'll also want to grab the folder with the same name as well, since those are the maps.

<details><summary>Getting Players or Worlds from the Cloud</summary><blockquote>
    
You may notice that your player or world isn't in the folder, or maybe only .bak files are in the folder. This means that you have put that player or world onto the cloud. There are 2 ways to get the files. The first option is to open Terraria or tModLoader and simply click the `Move off cloud` button and then follow the above instructions. The second option is to copy the files from the local copy of cloud files steam keeps around and place them in their respective folder. These are found in the [local cloud saves folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#cloud)</blockquote>
    
</details>    

### "Cloud storage limit reached, unable to move to cloud"
tModLoader shares the cloud storage space with Terraria (the total quota is about 950 MB). Exceeding this limit on Terraria + tModLoader combined will make you unable to move players and worlds to the cloud until sufficient storage is available. Easiest way to free up room is to "un-cloud" worlds, they take up the most space. You can check how much storage is used in Steam: Right click `tModLoader` -> `Properties`, below the `Steam Cloud` section it says the amount of available storage. In the rare case where you used tModLoader cloud storage feature before steam release (0.11.7), you won't be able to get rid of these "orphaned" files the normal way. Try this method: [Video, Terraria App ID is 105600](https://youtu.be/JADsIv2RUSw). Another method to delete orphaned files is to download [Steam Cloud File Manager Lite](https://github.com/GMMan/SteamCloudFileManagerLite) and use it to delete files in the "ModLoader" folder.

# Mod Browser
### "Mod Browser Offline", "I can't download mods"
![](https://i.imgur.com/JTtOMbq.png)

Steam workshop sometimes goes offline for maintenance, try in a few hours or the next day.

### Can't download mod, Mod download progress bar stuck at 0.0 bytes
The reasons for such an error are varied, but there are a few things you can try. First, open up the `workshop_log.txt` file. This file will typically be located at: `C:/Program Files (x86)/Steam/logs/workshop_log.txt` (Windows), `~/Library/Application Support/Steam/logs/workshop_log.txt` (Mac), `/home/user/.local/share/Steam/logs/workshop_log.txt` (Linux). Once the file is open, scroll down to the bottom to see the most recent steam log messages. You'll likely see errors related to the mods that couldn't download. Try to make sense of the errors if possible and act on them if you know what they mean. For example, it might mention that you are out of hard drive space, in that case clean up some files or move the tModLoader install location. 

Another thing to try is repairing the Steam Library folder. To do this, navigate to `Steam->Settings->Storage` and then select the library location tModLoader is installed to in the drop down. Next, click the `...` icon and select `Repair Library`. This process will attempt to fix any permissions or other issues in the steam library folder and should take a minute or so. 

Some users have reported issues when tModLoader is installed on a portable hard-drive or even hard-drives other than the default drive. If you are in this situation, try moving tModLoader to the main hard-drive. To do this, right click on tModLoader in the Steam library and select `Properties`. Click on `Installed Files` and then `Move install folder` and select a different location.

### Can't redownload mod
If you find that you can't redownload a mod in-game, you'll need to close the game, then visit the [tModLoader workshop](https://steamcommunity.com/app/1281930/workshop/). There, find the mod you are interested in and subscribe. If you are already subscribed, unsubscribe and then subscribe again. Finally, restart steam by fully closing it (Steam->Exit), then launching it again. You may also need to follow the [Verify Game Integrity](#verify-game-integrity) steps to force steam to redownload mods you subscribed to.

If the previous steps don't resolve it, the following may:
if you get the **Item is/was already installed** message and/or a red `!` next to the mod name, do the following if the instructions provided by TML don't work:
1) Delete the mod in Mods Menu first. 
2) Close the game
3) Unsub, sub, and unsub in Steam
4) Close Steam fully
5) In SteamApps/Workshop, delete appworkshop_1281930.acf
6) start steam
7) start the game

# Save Data File Issues
### Windows 10+ OneDrive
By default, Microsoft has forced OneDrive on to the 'My Documents' folder, which can mess with some games when improperly configured.

Error Message: The Cloud File Provider is Not Running    
![252088854-2e17cd93-a44a-43f6-a169-c045d2c7f094](https://github.com/tModLoader/tModLoader/assets/4522492/add71bff-51ac-41d1-b2dd-bee57f9b68db)    

Also applies to error message: System.IO.IOException: The cloud operation was unsuccessful
![image](https://github.com/user-attachments/assets/5336c3d6-8e17-4779-8c0d-0d8e84937569)    

Also applies to error message: System.IO.FileNotFoundException: Could not find the file ...tModLoader\Mods
![image](https://github.com/user-attachments/assets/68001138-6894-4182-9c69-0a182d45c1e7)    

Basically, these errors mean that the game is unable to save the files because OneDrive is either misconfigured or offline. The solution is usually to fix OneDrive, but uninstalling OneDrive is also an option. Just be aware that disabling/uninstalling OneDrive means the automatic backups and file sync enabled by default will no longer be active. This is a drastic option and not recommended unless you know what you are doing. If enabling OneDrive is not fixing your issue and you don't want to uninstall OneDrive, the [savehere.txt save location workaround](#saveheretxt-save-location-workaround) is another option to get the game working.

<details>
<Summary>Solution 1: Uninstall OneDrive.</Summary>

**Note:** Only follow these instructions if you actually want to get rid of OneDrive from your computer. 

* On Windows Searchbar, search Programs, and select 'Add or Remove Programs'
* Uninstall OneDrive.
* Problem solved.

</details>

<details>
<summary>Solution 2: Get OneDrive up and running</summary>

* Follow the instructions in [Sync files with OneDrive in Windows](https://support.microsoft.com/en-gb/office/sync-files-with-onedrive-in-windows-615391c4-2bd3-4aae-a42a-858262e42a49) to turn on OneDrive. 
* Then turn off 'Documents' syncing in Manage Access menu    
![image](https://github.com/tModLoader/tModLoader/assets/59670736/bc96bafd-4f03-450a-9797-5fd322e8a4bf)    
* And/or turn on 'Always keep on this device:    
![image](https://github.com/tModLoader/tModLoader/assets/59670736/e2a24cec-5ec2-4a7b-adf5-cf638c720b5d)    

</details>

### Unable to find my tModLoader 1.4.3 save data OR Auto-migration of files failed.
Do this for files on your computer, referencing example of copying files from 'default' to 1.4.3:
![image](https://github.com/tModLoader/tModLoader/assets/59670736/aced141b-3e5e-4df1-aff3-b6e8f097fa52)

For Steam Cloud related files, unfortunately, there isn't a quick fix.
Please download your files manually per https://www.howtogeek.com/428491/how-to-download-your-save-games-from-steam-cloud/

### Config.json Corrupted
### Attempt to Port from X to Y aborted, the Z file is corrupted.
![dotnet_2024-03-11_13-36-22](https://github.com/tModLoader/tModLoader/assets/4522492/8dab3fe7-fb53-4d43-96a8-0af4c0747156)

You basically have a corrupted `config.json` file, which is preventing tModLoader from knowing which version of tModLoader was last launched.    

If you are new to tModLoader or have played tModLoader 1.4.4 (anytime since August 2023), simply delete the `config.json` file in the [saves folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves).

Otherwise, if you know the last tModLoader you played was the 1.4.3 version, replace `config.json` in the [saves folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves) with the one provided here:    
[config.zip](https://github.com/tModLoader/tModLoader/files/11992590/config.zip).

After doing one or the other, relaunch the game. If you get the same error, you deleted or replaced the wrong file. Double check the folder paths to make sure you are modifying the correct `config.json` file mentioned in your error, not the one found in the Terraria folder.  

Example of File Location    
![image](https://github.com/tModLoader/tModLoader/assets/59670736/dbe1c30b-09eb-4776-a5a1-943984735d4f)    

## Migration Failed
As tModLoader updates to new major versions, sometimes players saves are moved from one folder to another to ensure a smooth transition to the next major version of tModLoader. Sometimes this process fails for one of a variety of reasons. In these cases, it is up to the user to move the files or fix the issue and try again.

When launching 1.4.4 for the first time, tModLoader will move files from `tModLoader` (`source folder`) to `tModLoader-1.4.3` (`destination folder`), preserving 1.4.3 saves. tModLoader will then move files from `tModLoader-preview` (`source folder`) to `tModLoader` (`destination folder`), allowing users previously on the preview version of 1.4.4 to continue using their players and worlds on the stable version of 1.4.4.

### Try again
The most common issues relate to OneDrive. If your `My Documents` folder is in OneDrive, follow steps in the [Windows 10+ Onedrive](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#windows-10-onedrive) section to ensure OneDrive is properly setup and running. After that is all working, try launching tModLoader again, this time the migration should succeed. 

### Manually Port
If tModLoader is still unable to migrate files, then a user can do it manually. First, create the `destination folder`, this will be the `tModLoader-1.4.3` or `tModLoader` [saves folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves) depending on the file path shown in the error message. Next, copy the files and folders from the `source folder` saves folder to the `destination folder`. The `source folder` can be determined by checking the [Migration Failed](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#migration-failed) section to see which `source folder` should be copied into the `destination folder` you just created. If this fails, you might have some corrupted files that need to be deleted first.

### Illegal Filenames
Rarely, the tModLoader saves folders might contain files or folders that can't be deleted or moved by normal means. First, restart the computer and try again. If the file or folder still can't be moved or deleted, it might have an illegal filename. Examples of illegal filenames are files ending with `.` or folders ending with a space. Due to bugs in mods or tModLoader, these files can rarely be created. The instructions in [the answers for this stackoverflow post](https://stackoverflow.com/questions/4075753/how-to-delete-a-folder-that-name-ended-with-a-dot) are all options for deleting these files and folders. If the issue was a folder in the Players folder ended with a space, take the opportunity to rename the corresponding `.plr` and `.tplr` files to remove the space from those files. Feel free to come to [our Discord Support](#discord-support) if you need help with this issue.

# Linux / Steam Deck / Mac
tModLoader is designed to run as a native Linux application. It is fully featured as a native program, and as such, does not require Proton.
Unfortunately, due to unknown causes, tModLoader doesn't work with Proton.

### Compatibility Options
This is one of the rare applications where you will need to set Compatibility Options to 'None'.
STEAM DECK: If you don't see the None option, you can install 'Steam Play None' to forcibly add the option.

### Fails to launch the native build - Click Start in Steam but does nothing
If the section of deleting 'dotnet' folder in this FAQ does not fix the issue, it has been reported that the following might, via #3612:
Install `dotnet-sdk` from nixpkgs and create a symlink from the store binary to your TML installation. Ex: `ln -s /run/current-system/sw/bin/dotnet /home/<user>/.local/share/Steam/steamapps/common/tModLoader/dotnet/dotnet`

### Flatpak, Steam Deck Steam, and related sandboxed applications
If you want to develop mods, these will conflict with doing so.
You will need to launch the game outside of Steam, using either 'Non-Steam Game' library option or launching it from the terminal.

<details><summary>Building Mods on Steam Deck</summary><blockquote>

Due to how the Steam Deck is setup, the setup to build mods requires a bit of additional effort. You'll need to follow the following instructions to install the dotnet 8 SDK to your system. These instructions differ from typical Linux dotnet SDK install instructions. These instructions have been lightly tested and are subject to updates and revisions as we learn more about how to properly use the Steam Deck. Steam OS updates could potentially revert this install, requiring the user to revisit these instructions after an OS update if mod building no longer works. 

**Install dotnet SDK via dotnet-install script:**

Note: This approach will install the `dotnet 8.0 SDK` in the user's home directory. This method should persist through Steam Deck OS updates, but it might not persist.

1. Make sure you have launched tModLoader at least once on this Steam Deck recently.
2. On the Steam Deck, switch to Desktop Mode (Steam->Power->Switch to Desktop). You should now be in the desktop environment. Plugging in a USB keyboard now will help in the coming steps.
3. Open up Steam and right click on tModLoader, then select "Manage", then "Browse Local Files". This will open up the tModLoader install folder in the file manager.    
![Screenshot_20231116_130439](https://github.com/tModLoader/tModLoader/assets/4522492/ac152bb9-0660-4324-9410-ebfa043cba06)    
4. Navigate into the `LaunchUtils` folder. Right click anywhere in the file manager and click "Open Terminal Here". This will open up `Konsole`, the default terminal program.     
![Screenshot_20231116_130644](https://github.com/tModLoader/tModLoader/assets/4522492/8d8ee052-f5df-4675-94a4-52c1f2877d47)    
5. Next, we will install `dotnet` to the system. Do this by running the `./dotnet-install.sh -channel 8.0` command in the terminal we just opened. This should run for a bit and then display "Installation finished successfully".    
![Screenshot_20231116_130858](https://github.com/tModLoader/tModLoader/assets/4522492/911672a0-7130-4aa8-b20f-08ad5ff19eca)    
6. Having installed `dotnet`, it is not yet accessible by tModLoader. To do this, we need to make sure it is added to our `PATH`. We do this by editing our bash configuration files. Open up `/home/deck/.bashrc` in a text editor (by default this is a program called `Kate`) and add the following 2 lines to the middle of the file and then save the file:    
    > export DOTNET_ROOT=$HOME/.dotnet    
    > export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools    
    ![Screenshot_20231120_181643](https://github.com/tModLoader/tModLoader/assets/4522492/24505bf3-e50b-45de-b01a-cc2a596a233c)   
    
    If you can't find the `.bashrc` file, open up the Dolphin file manager and click on `Home`. `Home` is the same as `/home/deck/`. Next, look for greyed out files beginning with a `.`, these are hidden files. If you do not see any, you'll need to click the options dropdown in the top right and check `Show Hidden Files`. You should now see the hidden files.   
7. Next visit the Steam properties for tModLoader. To do this, right click on tModLoader in Steam, select "Properties", and then find the "Launch Options" box in the "General" tab. Type in the following for the launch options and close the window: `DOTNET_ROOT=/home/deck/.dotnet %command%` (This step is technically only necessary for supporting tModPorter in Game Mode and can be skipped if desired. This will be unnecessary in 2025.01 and later.)    
![20231120143425_1](https://github.com/tModLoader/tModLoader/assets/4522492/ee0fe72e-dc38-4593-9bcc-95c10b0998d2)    
8. Launch the game and visit the `Develop Mods` menu, you should now see a listing of your mods, if any, rather than the note mentioning installing the `dotnet SDK`. 

This approach should allow you to mod when launched in Game Mode, Desktop Mode, or even when manually launched through `start-tModLoader.sh`.

**Install dotnet SDK via pacman:**

For the sake of completeness, it should also be mentioned that the dotnet sdk can technically be installed at a system level via `pacman`. This approach requires disabling the read-only nature of the operating system. This is a bit dangerous. Additionally, the `pacman` install results in an outdated SDK version that is incompatible with building mods. The steps to do this are not listed here because they do not result in a working solution at this time. 

</blockquote></details>

### Arm64 Linux Workaround
(This workaround is 1.4.3 only, it will not work on 1.4.4) At this time, the Steamworks.NET library used by tModLoader doesn't support ARM in it's managed code.
Please use the 20.1.0 Release build on [this fork](https://github.com/MikolajKolek/Steamworks.NET-arm64/releases/tag/20.1.0) by [MikolajKolek](https://github.com/MikolajKolek) to download a replacement Steamworks.NET.dll.
Please install the ARM64 Linux Steamworks.NET.dll by replacing the existing .dll in Libraries/Steamworks.net/20.1.0/lib/netstandard2.1

### System .NET SDK Could Not Be Found, No Sandboxing
If the application is sandboxed, see the appropriate section here.
If not, attempt the following steps:
1) In a terminal check "which dotnet" command result. You should see information on what the system dotnet install is, and a path of "/my/path/dotnet"
2) Create a text file at path /etc/paths.d/dotnet with contents "/my/path/dotnet"
Try running again. 
If this doesn't work, reach out in the Discord for further guidance

# Other Issues
### Steam Game Recording
[Steam Game Recording](https://store.steampowered.com/gamerecording) is a feature that won't work with tModLoader out of the box due to its unique launch sequence. As a workaround, you can manually use the "Record Manually" setting and the Start/Stop recording shortcut keys. Monitor [this issue](https://github.com/tModLoader/tModLoader/issues/4324) for any progress on the matter.

### RGB Keyboard Bug (Port 53664)
Networking issues (`SocketExceptionFactory`, `WebException`, `HttpRequestException`) addressed to port `53664` are caused by RGB keyboard support bugs. You can attempt to repair the installation of your keyboard software, or disable the feature. Even if you don't think you have RGB keyboard, this can help. Close tModLoader. Open up [the saves folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves) and find `config.json`, open the file in a text editor. Find the "UseRazerRGB", "UseCorsairRGB", "UseLogitechRGB", and "UseSteelSeriesRGB" entries and change "true" to "false" for each of them, then save the file and finally attempt to open tModLoader.

### Low FPS
There are many things you should try:
1. First, make sure none of your mods are throwing errors in the log. See [Reading client.log](#reading-clientlog) to see how to check logs for error messages from mods.
2. Second, Check that the game is running on your Dedicated Graphics Card. For some reason, Windows like to try to run tModLoader on the integrated GPU.
3. Next, confirm that the issue happens even with 0 mods enabled.
4. Try changing "Frame Skip" settings
5. You can try a different graphics options. To do this, close the game and then in Steam, right click on `tModLoader`, select `Properties`, and then find the `Launch Options` box. Type `/gldevice:OpenGL` or `/gldevice:Vulkan` into the box and close the window. Launch the game and check your frame rate. Do these same steps to try the other option. If these have no effect, remove them in the same manner. Having issues where OpenGL worked previously? Try removing it and seeing if the default runs better now.     
![image](https://user-images.githubusercontent.com/4522492/194379953-0392ca08-8ac3-4610-8486-595620e3d1d7.png)    
    1. If you are using the GOG version of the game, you can edit `start-tModLoader.bat` and change the 3rd line to `LaunchUtils/busybox-sh.bat ./LaunchUtils/ScriptCaller.sh /gldevice:Vulkan %*`, save, then test by launching the file.
6. If using Steam, you can try the following:
    * Disable animated avatars in Friends List settings
    * Disable the steam overlay in In-Game settings
    * Launch Steam in "compact mode" [(Tutorial here)](https://techverse.net/how-to-enable-small-mode-on-steam/)
7. Try Host&Play instead of singleplayer. 
8. Try Lighting overhaul mods to see if one better uses your computer resources.
9. Try Optimizerarria resource pack from Terraria Workshop
10. Try reducing Graphics: Disable waves, Disable Backgrounds, quality Low
11. If using Retro or Trippy lighting modes, try zooming in from 100% to something like 102%. At 100% zoom Retro and Trippy lighting modes counterintuitively need to do a lot more work due to how the code is organized, any greater value than 100% works.
12. Come to [tModLoader Discord Support](#discord-support).

### Ghost Mouse 
If your mouse is invisible and still highlights buttons, you might be running into an issue with "Monect Virtual Controller". If your `client.log` has "Monect Virtual Controller" in it, follow [these steps](https://community.monect.com/d/39-fuk-monect-hid-device) to uninstall that. Plugging in a separate controller has also been reported to fix this problem if you don't have "Monect Virtual Controller".

Another solution is to close the game, then edit `config.json`, found in [the saves folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#saves), in a text editor and change the "InvisibleCursorForGamepad" and "SettingBlockGamepadsEntirely" settings to `false` and then save the file.

### Game not launching, Webroot antivirus
The Webroot antivirus has a false positive on the `Mono.Cecil.Rocks.dll` file included in tModLoader, you'll need to remove it from the Webroot antivirus quarantine.

### Keyboard delay
Reported to be fixed by disabling "Game Optimization" in their Norton antivirus.

### Console stays open on Windows 11
If the console stays open even after you've reached the main menu: Open up Windows Settings > System > For developers > Terminal > Set it to Windows Console Host.

### No mini-map
The game will disable the mini-map when it detects a mini-map related error. This may be caused by a mod throwing errors. To revert this, go to `Settings->General` and toggle the map option to `Map Enabled`. If the issue happens frequently, it may be worthwhile to investigate your `client.log` and try to identify which mod is causing the errors.