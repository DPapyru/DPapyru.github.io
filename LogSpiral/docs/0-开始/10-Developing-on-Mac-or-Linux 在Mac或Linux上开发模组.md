* **Warning: This guide was written long ago and is no longer relevant to current tModLoader. Please do NOT follow this guide.**
* **We recommend [Visual Studio Code](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Visual-Studio-Code) or [Rider](https://github.com/tModLoader/tModLoader/wiki/Developing-with-Rider) for developing mods on Mac and Linux.**
* **Mac and Linux no longer require any OS-specific instructions.**

# These instructions do not apply yet

For now, the only instructions are here: [Xamarin/MonoDevelop instructions](https://forums.terraria.org/index.php?threads/1-3-tmodloader-a-modding-api.23726/post-1001200)

Everything below this possible relates to tModLoader v0.11, but the instructions do not work yet.

### Note: Work in Progress, instructions are not completely working or tested yet. Currently there is no implementation to decompile Terraria on Linux/Mac. This means that you need to run the `Setup` tool to decompile Terraria under Windows. This will hopefully soon be implemented on Linux and Mac as well.

# Developing on Mac or Linux
tModLoader requires the Microsoft C# Compiler (`mcs`) to be installed.
On Windows, it's bundled with the .NET installation itself. On Mac and Linux however, it requires a separate package which might not be pre-installed on your system.

You can check if it is present by opening a terminal and executing the command `mcs`, you should see something like this:
```
error CS2008: No files to compile were specified
Compilation failed: 1 error(s), 0 warnings
```

Or you can simply try compiling and look for `mcs not found` errors.

Instructions on how to install the required packages are in the following section.

# Building mods inside of tModLoader

tModLoader has the ability to build mods that have no external dependencies/references within Terraria itself.
If you are new to modding or have no idea what external dependencies are, this is most likely what you want.

If you want to use external dependencies which allow for more "fancy" features and you know what you are doing you can look into [building outside of tModLoader](#building-outside-of-tmodloader)

## Installing mono
Having the Mono framework installed allows you to build mods directly within tModLoader under the `Mod Sources` menu option.

### Linux

On most Linux distributions the package is called `mono-complete` or simply `mono`.

If you are having trouble installing the package you can go to the [installation instructions](https://www.mono-project.com/download/stable/#download-lin) page on the mono-projects website for further assistance.

### Mac

Visit the Mono website and follow the [installation instructions](https://www.mono-project.com/download/stable/#download-mac) for Mac.

Apparently this install doesn't add the appropriate tools to the Path, so you may need to follow these instructions if you still can't build in game. Please update this page with any relevant information if you have any.

Edit: Some further instructions can be found in the answers section of this [Stackoverflow question](https://stackoverflow.com/questions/32542535/how-to-install-mono-on-macos-so-mono-works-in-terminal)

Untested.

# Building outside of tModLoader

If you would like to have a more flexible and generally better development environment, you should probably look into building mods outside of tModLoader. This implies using an IDE such as Visual Studio Code (The regular Visual Studio is not supported on Linux, although it is on Mac).

MonoDevelop/Xamarin (on which Visual Studio for Mac is based on) is the easiest method to get started.

The following instructions can be followed for getting a simple environment going: [Xamarin/MonoDevelop instructions](https://forums.terraria.org/index.php?threads/1-3-tmodloader-a-modding-api.23726/page-525#post-1001200)

## Working Visual Studio for Mac instructions
Using the skeleton generator in-game, the following changes can be made to the generated .csproj to make it work on Visual Studio for Mac. These results are the results of one modders attempts at getting it working. We'll try to make the workflow better in further updates. In the meantime, here is the edited csproj:
```xml
<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
    <Import Project="..\..\references\tModLoader.targets" />
    <PropertyGroup>
        <AssemblyName>test</AssemblyName>
        <TargetFramework>net45</TargetFramework>
        <PlatformTarget>x86</PlatformTarget>
        <LangVersion>latest</LangVersion>
    </PropertyGroup>
    <Target Name="BuildMod" AfterTargets="Build">
        <Exec Command="&quot;$(tMLBuildServerPath)&quot; -build $(ProjectDir) -eac $(TargetPath)" />
    </Target>
    <PropertyGroup Condition=" '$(RunConfiguration)' == 'Terraria' ">
        <StartAction>Program</StartAction>
        <StartProgram>$(tMLPath)</StartProgram>
        <StartWorkingDirectory>$(TerrariaSteamPath)</StartWorkingDirectory>
        <EnvironmentVariables>
            <Variable name="DYLD_LIBRARY_PATH" value="$(TerrariaSteamPath)/osx" xmlns="" />
        </EnvironmentVariables>
    </PropertyGroup>
</Project>
```

## Tweaks to MonoDevelop Compilation on Debian
(2020-05-31, Debian 10/4.19.118, MonoDevelop 7.8.4, Mono 6.8.0.123, Steam tModLoader v0.11.7.4)

tModLoader looked to want

* `<projectname>.XNA.dll`
* `<projectname>.XNA.pdb`
* `<projectname>.FNA.dll`
* `<projectname>.FNA.pdb`

when building a mod.

Mostly following instructions in link above, using the supplied blank Linux csproj, with the following notable exceptions.

Prior to opening project:
* When installing MonoDevelop, added repository to apt cache, updated all mono* packages, then installed.
* Grabbed ModCompile zips from https://github.com/tModLoader/tModLoader/releases/tag/v0.11.4 and combined them both in a new ModCompile folder in the Terraria installation folder.
* Created symbolic links to tModLoader and Terraria installation near project for pathing ease.
* Changed `<Import Project="$(MSBuildToolsPath)/Microsoft.CSHARP.targets" />` to `<Import Project="$(MSBuildToolsPath)/Microsoft.CSharp.targets" />` in project file.

In MonoDevelop, after opening project:
* Removed all referenced assemblies, added back `FNA.dll` and `tModLoader.exe` from tModLoader folder.  Will likely need to add others as required by code and when someone can test the Windows half of the build, so wrote down the ones removed.
* Under project options / Configurations, renamed `Windows` to `MyMod.XNA`.
* Under project options / Configurations, renamed `Mono` to `MyMod.FNA`.
* Under project options / Compiler, changed Debug information from `None` to `Symbols only` in both configurations.
* Under project options / Custom Commands, added After Build step `cp bin/${ProjectConfigName}/${ProjectName}.pdb ${ProjectConfigName}.pdb` to both configurations.

Was then able to compile both configurations, run `tModLoaderServer -build <path_to_mymod>` successfully, and the simple mod (1 tile, 1 item) worked in game.  Need to test in Windows.

<details>
<summary>mymod.csproj</summary>

```
<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="4.0" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup>
    <Configuration Condition=" '$(Configuration)' == '' ">Debug</Configuration>
    <Platform Condition=" '$(Platform)' == '' ">AnyCPU</Platform>
    <ProjectGuid>{7773BDD8-037E-46DB-B842-B0EE41E74873}</ProjectGuid>
    <OutputType>Library</OutputType>
    <NoStandardLibraries>false</NoStandardLibraries>
    <AssemblyName>MyMod</AssemblyName>
    <TargetFrameworkVersion>v4.0</TargetFrameworkVersion>
    <FileAlignment>512</FileAlignment>
  </PropertyGroup>
  <PropertyGroup>
    <RootNamespace>MyMod</RootNamespace>
  </PropertyGroup>
  <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Debug|AnyCPU' ">
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
  </PropertyGroup>
  <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Release|AnyCPU' ">
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
  </PropertyGroup>
  <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'MyMod.FNA|AnyCPU' ">
    <DebugSymbols>true</DebugSymbols>
    <DebugType>pdbonly</DebugType>
    <Optimize>true</Optimize>
    <OutputPath>bin\MyMod.FNA</OutputPath>
    <DefineConstants>TRACE</DefineConstants>
    <ErrorReport>prompt</ErrorReport>
    <WarningLevel>4</WarningLevel>
    <CustomCommands>
      <CustomCommands>
        <Command>
          <type>AfterBuild</type>
          <command>cp bin/${ProjectConfigName}/${TargetName} ${ProjectConfigName}.dll</command>
        </Command>
        <Command>
          <type>AfterBuild</type>
          <command>cp bin/${ProjectConfigName}/${ProjectName}.pdb ${ProjectConfigName}.pdb</command>
        </Command>
      </CustomCommands>
    </CustomCommands>
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
  </PropertyGroup>
  <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'MyMod.XNA|AnyCPU' ">
    <DebugSymbols>true</DebugSymbols>
    <DebugType>pdbonly</DebugType>
    <Optimize>false</Optimize>
    <OutputPath>bin\MyMod.XNA</OutputPath>
    <WarningLevel>4</WarningLevel>
    <CustomCommands>
      <CustomCommands>
        <Command>
          <type>AfterBuild</type>
          <command>cp bin/${ProjectConfigName}/${TargetName} ${ProjectConfigName}.dll</command>
        </Command>
        <Command>
          <type>AfterBuild</type>
          <command>cp bin/${ProjectConfigName}/${ProjectName}.pdb ${ProjectConfigName}.pdb</command>
        </Command>
      </CustomCommands>
    </CustomCommands>
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
  </PropertyGroup>
  <ItemGroup>
  </ItemGroup>
  <ItemGroup>
    <Content Include="build.txt" />
    <Content Include="description.txt" />
  </ItemGroup>
  <ItemGroup />
  <ItemGroup>
    <Compile Include="Tiles\MyTile.cs" />
    <Compile Include="Items\MyItem.cs" />
    <Compile Include="MyMod.cs" />
  </ItemGroup>
  <ItemGroup>
    <Folder Include="Tiles\" />
    <Folder Include="Items\" />
  </ItemGroup>
  <ItemGroup>
    <Reference Include="FNA">
      <HintPath>..\..\tModLoader\FNA.dll</HintPath>
    </Reference>
    <Reference Include="tModLoader">
      <HintPath>..\..\tModLoader\tModLoader.exe</HintPath>
    </Reference>
  </ItemGroup>
  <Import Project="$(MSBuildToolsPath)/Microsoft.CSharp.targets" />
  <ProjectExtensions>
    <VisualStudio AllowExistingFolder="true" />
  </ProjectExtensions>
</Project>
```

</details>

# Known issues
## Mac
### The type initializer for 'System.Drawing.GDIPlus' threw an exception
On **Mac** after you've followed this guide you might find that you encounter this error when trying to build a mod that contains png files.

![](https://cdn.discordapp.com/attachments/103115427491610624/540334979343974410/Screen_Shot_2019-01-30_at_6.55.40_PM.png)

To fix this download [this zip file](https://cdn.discordapp.com/attachments/103115427491610624/540387967915655188/system.drawing_for_mac.zip) and extract the contents to where you installed tModLoader (usually it will be `Library/Application Support/Steam/steamapps/common/Terraria/Terraria.app/Contents/MacOS`), overwriting/merging any folders/files if asked.
