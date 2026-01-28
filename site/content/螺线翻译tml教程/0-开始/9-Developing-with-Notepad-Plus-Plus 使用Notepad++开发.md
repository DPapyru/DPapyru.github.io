* **Warning: This guide was written long ago and is no longer relevant to current tModLoader. Please do NOT follow this guide.**
* **We recommend [Visual Studio](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio), [Rider](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Rider) or [Visual Studio Code](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio-Code) instead.**

# Introductory

Notepad++ is a lightweight rich text editor. It features syntax highlighting, amongst other features such as being able to open really large files if you have the 64 bit edition. You can download notepad++ on [their website](https://notepad-plus-plus.org/download/)

**First and foremost, debugging using notepad++ is not possible at this time. However, you can get auto completion as shown:**

![](https://i.imgur.com/G7wG7xe.png)

**You can also get an 'easy' build mod script, however it is only supported on Windows at this time.**

## Table of contents
- [Introductory](#introductory)
  * [Setup](#setup)
  * [Compile scripts](#compile-scripts)
  * [Acquiring auto completion](#acquiring-auto-completion)

## Setup
First, have np++ installed. I recommend 64 bit if your computer can handle it. Next, you'll want to be able to open  a folder as directory tree like in other IDEs. Navigate to `File -> Open folder as workspace` and open your mod source. This will open a nice directory tree as shown:

![](https://i.imgur.com/foojkR8.png)

[Back to TOC](#table-of-contents)

## Compile scripts
I've written a few batch scripts that can compile your mod source against the server similarly in Rider and Visual studio. You will have two files: `COMPILE_run_build.bat` and `COMPILE_do_build.bat`. Both rely on each other, so you need both. Don't worry though, you'll only ever be manually calling run_build.

Download a .zip of the files [here](https://cdn.discordapp.com/attachments/426125688148328469/445603458951806986/NP_CompileFiles.zip). (**Note: In `COMPILE_run_build.bat` change line 36 to: `set server_path=^"%server_path^"` if the script does not work initially**)
As shown above, it contains two files. Place these files wherever you want, but inside your mod source is preferred.

You'll need to change settings inside the run_build script once. Open up `COMPILE_run_build.bat` in np++ and see the first setup sections. It comes with 5 settings that can be configured. Read the instructions thoroughly and change the settings accordingly. The settings include:
* **server_path** --- the path to your tModLoaderServer.exe
* **mod_sources_path** --- the path to your mod sources folder
* **mod_name** --- the name of your mod (internal name)
* **compile_with_eac** --- whether to compile with eac instructions
* **make_logs** --- whether to write info to log files

Note: an easier setup is possible having 1 superscript and calling it from within your mod source folder. However, this requires that the user knows batch scripting so I didn't opt for it. 

To run the compile script and build the mod, right click the `COMPILE_run_build.bat` script in the directory tree and click 'Run by system' as shown:

![](https://i.imgur.com/oloCqhd.png)

Note: do not ever run the `COMPILE_do_run.bat` script manually, it requires information from the run_build script.
It is recommended to add the following lines to your buildIgnore: `COMPILE_*.bat, COMPILE_*.txt`

If all works well, you should get an output similar to this:

![](https://i.imgur.com/G26fVyr.png)

**Note that, when a compile error happens, likely is that the error doesn't display well in the console. For this reason, it is recommended to enable logging if your mod fails to compile.**

[Back to TOC](#table-of-contents)

## Acquiring auto completion
To get auto completion, you will need a plugin called cs-script for notepad++. It is recommended to __not use__ the np++ plugin managers as it has bugs when installing cs-script. A manual install is required.

To get cs-script, go to [their repository](https://github.com/oleg-shilo/cs-script.npp) and download the latest release. To install, you will need to know where notepad++ install is located. If you don't know, it's usually in Program Files or Program Files (x86). Alternatively, you can run this command in shell: `where /R C:\ notepad++` (change C:\ drive if you use a different drive) which will output the path to the exe it finds. Navigate to the top level of that path, e.g: `C:\Program Files\Notepad++\`. Whilst in there, move the folders 'plugins' and 'updater' into it. You might need administrator privileges. Now reopen notepad++, you are likely greeted by a welcome popup.

Now to actually acquire auto completion, you will need to add Terraria as a reference. However, cs-script only support top-level .dll files as references. Go to your Terraria install directory and copy over Terraria.exe (tModLoader) to your mod source folder. Then rename it to have the .dll extension. Verify that it shows in your directory tree in notepad++. Add the following line at the top of your file: `//css_ref Terraria.dll`

You should now have auto completion as shown:

![](https://i.imgur.com/vSfKiub.png)

Without having to compile your mod, you can look for syntax errors by cs-script build, using the command shortcut: `Ctrl + Shift + B`. If you have any syntax errors, they will display as shown:

![](https://i.imgur.com/CkVEJwR.png)

[Back to TOC](#table-of-contents)