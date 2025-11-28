# Introductory

Rider is a lightweight IDE, developed by JetBrains. It is similar to [Visual Studio](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio) but has a different layout more similar to those found in Intellij and PyCharm. If you have previously used other JetBrains IDEs you may have a significantly easier time using Rider than you would Visual Studio. Rider is easier to run than Visual Studio, while still having IntelliSense and code debugging.

Importantly, it runs on Windows, Mac, and Linux while [Visual Studio](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio) is Windows only. It is free for non-commercial use, and Students can get a [free educational licence](https://www.jetbrains.com/community/education/#students).

## Table of Contents
- [Introductory](#introductory)
  * [Start](#start)
  * [Opening an existing VS project](#opening-an-existing-vs-project)
  * [Creating a new Rider project](#creating-a-new-rider-project)
  * [Features of Rider](#features-of-rider)
  * [Adding project references](#adding-project-references)
  * [Viewing file structure](#viewing-file-structure)
  * [Optimal view setup](#optimal-view-setup)
  * [Keeping track of TODOs](#keeping-track-of-todos)
  * [No distraction mode](#no-distraction-mode)
  * [Code analysis, inspection settings](#code-analysis-inspection-settings)
  * [Split view: working on multiple files simultaneously](#split-view-working-on-multiple-files-simultaneously)
  * [Debugging](#debugging)

## Start
First, install Rider. Rider is free to use non-commercially, and can be downloaded here: https://www.jetbrains.com/rider/

JetBrains' entire suite of IDEs is also avaliable through [Github's education pack](https://education.github.com/pack) requiring only a recognized school email. Sign up [here](https://education.github.com/benefits?type=student).

[Back to TOC](#table-of-contents)

## Opening an existing VS project
After launching Rider, simply select "Open Solution or Project". Then navigate to your project's `.csproj` or `.sln` file and open it. Rider will open a new window and load the project.

[Back to TOC](#table-of-contents)

## Creating a new Rider project
It is recommended that you create your project files through tModLoader itself. This can be done by following the steps laid out in the [Basic tModLoader Modding Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-Guide). After creating a new mod skeleton through tModLoader, your mod folder will be located in your Mod Sources directory found here: `%userprofile%/Documents/My Games/Terraria/tModLoader/ModSources` follow the steps above and paste this path into your file explorer to find the mod folder. Your project will be generated with the proper build settings so there is no need to change them.

You can now follow [open an existing VS project](#opening-an-existing-vs-project) to begin working on your mod.

[Back to TOC](#table-of-contents)

## Features of Rider
Modders use an IDE like Rider because it helps identify and fix programming errors. See [Why Use an IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE) for basic information on how an IDE benefits a modder.

[Back to TOC](#table-of-contents)

## Adding project references
The generated project file will automatically have all the appropriate settings and references applied. If you need to reference a unique .dll, such as [referencing a mod for cross mod content](https://github.com/tModLoader/tModLoader/wiki/Expert-Cross-Mod-Content), follow the instructions below. 

On the left side of the window will be a panel labeled explorer, this is your Solutions Explorer. Near the top will be a drop down menu. By default it will be set to Solution, if it is not click it and select Solution from the drop down menu. Now the explorer should show your solution. From the explorer, right click the main tab with a green C# on it, and your mods name written to its right. A menu should appear. Click Add, and then Add Reference.

![](https://i.imgur.com/E9Ky5nJ.png)

A new window will appear, select 'Add From...' a file explorer should appear. Find the .dll file and double click on it to add it as a project reference. 

[Back to TOC](#table-of-contents)

## Viewing file structure
To view file structure like in VS studio (dropdowns for methods etc.)
Go to `View -> Tool Windows -> Structure`
This opens a structure view window as shown:

![](https://i.imgur.com/hrNR8X3.png)

Clicking on any method or field will make your editor scroll to it.

To return the regular file explorer simply select the Explorer tab on the left side.

[Back to TOC](#table-of-contents)

## Optimal view setup
If you plan on working on large code, like tMLs, it is recommended to enable the 'View whitespaces' and 'Use soft wrap' options. Go to `View -> Active Editor`  and enable these options. Viewing whitespaces (indents) is important to ensure you don't use whitespaces but tabs of width 4.

[Back to TOC](#table-of-contents)

## Keeping track of TODOs
Rider has a useful window that can find things marked TODO in comments or throwing NotImplementedException()
To open this window, go to `View -> Tool Windows -> TODO`
This opens a new window as shown:

![](https://i.imgur.com/JU5DiOX.png)

[Back to TOC](#table-of-contents)

## No distraction mode
This is a useful tip when you want to write code without being distracted.
To use this mode, navigate to `View -> Enter Distraction Free Mode`
This gets rid of pretty much any side windows as shown:

![](https://i.imgur.com/JMLXqOx.png)

[Back to TOC](#table-of-contents)

## Code analysis, inspection settings
For your own benefits, it is recommend to enable code analysis and propagate code annotations.

Open the settings, by going to `File -> Settings` or using the `CTRL + ALT + S` shortcut.

Navigate to `Editor -> Inspection Settings`

On Inspection Settings, tick to enable `'Enable code analysis'` and `'Enable solution-wide analysis'`

![](https://i.imgur.com/9UXxkvH.png)

Next, to enable code annotations propagation navigate to `'Code Annotations'` in the same dropdown, and tick `'Automatically propagate annotations'` as shown:

![](https://i.imgur.com/zeaXVWe.png)

You probably also want to disable the `'use 'var' (builtin types)'` hint, which can be annoying.

Navigate to `Inspection Severity -> C#`

Type in the search bar `Use preferred 'var'` and uncheck it as shown:

![](https://i.imgur.com/XxnqDJG.png)

If you are also annoyed by the `'Invert if to reduce nesting'`, it can be disabled as well:

![](https://i.imgur.com/537R8dV.png)

[Back to TOC](#table-of-contents)

## Split view: working on multiple files simultaneously
Another useful feature in Rider is split views.

It can look something like the following:

![](https://i.imgur.com/gKgf9aa.png) 

To do this, right click the tab you wish to split and then select "Split Vertically" or "Split Horizontally", you can do this multiple times however readability quicky declines.

[Back to TOC](#table-of-contents)

# Debugging
To debug your mod, make sure tModLoader is closed and then click the green arrow button to build and launch your mod. Debugging should work similarly to how it does in Visual Studio. The guides on this wiki show screenshots and examples using Visual Studio, but the same options are all present in Rider. See the [Learn How To Debug guide](https://github.com/tModLoader/tModLoader/wiki/Learn-How-To-Debug#debugger-debugging) for more information.

[Back to TOC](#table-of-contents)