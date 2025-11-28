*** 
This Page Has Been Updated for 1.4. For 1.3 Instructions, Click [Here](https://github.com/tModLoader/tModLoader/wiki/Starting-a-modded-server/dac6879dd891bfc74695d51a822379189d69f189)
***

***
This page is outdated for 1.4.4 dedicated servers. 
Please refer to our [DedicatedServerUtils Readme](https://github.com/tModLoader/tModLoader/tree/stable/patches/tModLoader/Terraria/release_extras/DedicatedServerUtils)
***

-------

## Dedicated Host
### If you have your own hardware, skip this section and proceed to the self-hosted walkthrough.

A Dedicated Host is a company that provides server hosting for a fee.

Edit the server config file that the dedicated host is using. Not every host is the same. You'll need to make sure that tModLoaderServer is being launched with either the command line argument or the server config line for the path to Mods folder. If you wish to use a Mods folder in the same folder as the tModLoaderServer executable, I believe you can use a relative path like "modpath=./Mods". You'll also need to set savedirectory since some mods store mod specific data in the save directory. (savedirectory is a command line only parameter.) Add `-savedirectory ./` to the command that launches the server, which can be found usually on the website for your host.

### Dedicated Hosts known to work
NodeCraft - Follow the [instructions](https://nodecraft.com/support/games/terraria/tmodloader-server-guide)
    
GameServers - Add `-savedirectory ./` to server command line 

[Akliz Hosting](https://www.akliz.net/games/terraria) - Works as is. 

[Citadel Servers Hosting Company](https://citadelservers.com/en-us/game-servers/terraria)

[AleForge](https://aleforge.net/games/terraria.html)

-----

# Dedicated Server Setup Pre-word

There are a few options for establishing a Dedicated Server on 1.4 tModLoader.
We will cover just one of these options for simplicity, but do not be discouraged to experiment!

All of this information is included in the DedicatedServerUtils folder in any tmodloader install.

## Setting Up a Dedicated Server on Linux

If you have an extra old computer sitting around or leave your computer on all the time, you can use that computer to host a dedicated server.

## Docker vs Management Script
While both the Docker container and the management script can install and update tModLoader and any mods, there are a few key differences. Docker isolates tModLoader from your host system and increases security. The management script allows for direct access to your server and increased control as a result. If you are a public server operator or just prefer Docker, then go with the [Docker Container](#using-the-docker-container), otherwise make use of the [management script](#using-the-management-script).

## Using The Management Script
The `manage-tModLoaderServer.sh` script can be used to install tModLoader either directly from the GitHub release or from SteamCMD. The script is made to run fully standalone, so just download it to your server and run it. No other files from the repo are needed.

### Installing tModLoader
#### Via SteamCMD (recommended)
* Ensure SteamCMD is installed and on your PATH. You can install SteamCMD from your package manager or [Valve's Wiki](https://developer.valvesoftware.com/wiki/SteamCMD).
* Run `./manage-tModLoaderServer.sh install --username your_steam_username`.
* You will be prompted for your password (and your 2fa code if applicable).
* By default, tModLoader will be installed to `~/Steam/steamapps/common/tModLoader`. To specify an installation directory, use `--folder /full/path/from/root`

#### From GitHub
* Run `./manage-tModLoaderServer.sh install --github`.
* By default, tModLoader will be installed to `~/tModLoader`. To specify an installation directory, use `--folder /path/to/install`.
* This will install the latest GitHub release, which is the same version as released on Steam.

### Installing Mods
Mods will be automatically installed during the tModLoader installation step, but can also be installed separately using the `--mods-only` argument. Simply place any `.tmod` files, `install.txt` for workshop mods, and `enabled.json` into the same directory as the script. Additionally, you can avoid updating or installing mods with the `--no-mods` argument.

#### Obtaining install.txt
Because the steam workshop does not use mod names to identify mods, you must create a modpack to install mods from the workshop. To get an `install.txt` file and its accompanying `enabled.json`:
* Go to Workshop
* Go to Mod Packs
* Click `Save Enabled as New Mod Pack`
* Click `Open Mod Pack Folder`.
* Enter the folder with the name of your modpack

You can copy `Mods/enabled.json` and `Mods/install.txt` to your script directory and they will be used next time the script is run (run `./manage-tModLoaderServer.sh --mods-only` to install mods immediately).
**You will need a Mods/enabled.json to contain all Mods that you want enabled.**

### Launching
To run tModLoader, you just need to navigate to your install directory (`~/tModLoader` for GitHub, `~/Steam/steamapps/common/tModLoader` for SteamCMD, by default), and run `./start-tModLoaderServer.sh`. There is also a `--start` argument that will launch the game.

#### Automatically Selecting A World
If you want to run tModLoader without needing any input on startup (such as from an init system), then all you need to do is copy the example [serverconfig.txt](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/release_extras/serverconfig.txt) and change the settings how you like. Additional options can be found [on the Terraria wiki](https://terraria.wiki.gg/wiki/Server#Server_config_file)

## Updating
If an update for `manage-tModLoaderServer.sh` is available, a message will be printed letting you know one is available. It can be updated using `./manage-tModLoaderServer.sh --update-script`. An outdated script may contain bugs or lack features, so it is usually a good idea to update.

When using `manage-tModLoaderServer.sh`, tModLoader updates can be performed with `./manage-tModLoaderServer.sh update`. When using a GitHub install, use `--github`. Use`--folder` if your install is in a non-standard location. Mods will be updated as well.

When using the Docker container, simply rebuild the container using `docker-compose build` to update tModLoader. Mods will be updated as well.

## Using The Docker Container
To install and run the container:
* Ensure `docker` and `docker-compose` are installed. They can be installed from your package manager or [Docker's Documentation](https://docs.docker.com/engine/install/)

* Download [docker-compose.yml](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/release_extras/DedicatedServerUtils/docker-compose.yml) and the [Dockerfile](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/release_extras/DedicatedServerUtils/Dockerfile).
* Next to those docker files, create a folder named `Terraria`, and place `enabled.json`, [install.txt](#obtaining-install.txt), [serverconfig.txt](#automatically-selecting-a-world), your worlds, and any `.tmod` files inside.
* Edit `docker-compose.yml` with your GID and UID. These can be found by running `id`.
* Run `docker-compose build`
* Run `docker-compose up`

The server will be available on port 7777.

To run without any interactivity, use `docker-compose up -d`, and include [serverconfig.txt](#automatically-selecting-a-world) in the `Terraria` directory.

## Autostarting On Boot
When using `manage-tModLoaderServer.sh`, refer to your distro's documentation. You can likely use a startup script with your init system.

When using the Docker container, add `restart: always` within `services.tml` inside of `docker-compose.yml`, then rebuild with `docker-compose build`.

## Server Configuration

If you are missing `serverconfig.txt`, you have to create one manually. You can use config preset from the internet or make one yourself.

Some recommended parameters to have there:

Load the world automatically when you run `./tModLoaderServer -config *configname*.txt`, this one is required for some other arguments to take effect

##### Set the world loaded on the server

`world=path/to/WorldFile`

For example, `world=/home/<user>/.local/share/Terraria/ModLoader/Worlds/<worldname>.wld` **(it must be `.wld` and not `.twld`!)**

##### Set the max number of players allowed on a server. The value must be between 1 and 255. (default=8)

`maxplayers=<number>`

##### Set the port number (default=7777)

`port=<number>`

##### Set the server password

`password=<password>`

##### Reduces enemy skipping but increases bandwidth usage. The lower the number the less skipping will happen, but more data is sent. 0 is off.

`npcstream=<number>` (recommended around 2-6, increases required bandwidth but reduces teleporting)

##### Link the mods folder (might default to that so could be irrelevant)

`modpath=/home/<user>/.local/share/Terraria/ModLoader/Mods`

##### Select the modpack to load for the specific world. The `.json` is optional

`modpack=/home/<user>/.local/share/Terraria/ModLoader/Mods/ModPacks/<modpack name>/mods/enabled.json>`

For full list go to: https://terraria.wiki.gg/Server#Server_config_file

**Note**: Journey's End config commands are NOT going to work because tModLoader runs on an older version of terraria!

### Portforwarding

If you want other people to connect to your server from another network, you must open up the port your server will run on.

#### What is a port?

Your computer has access to many ports. When an incoming network packet is received by your internet router, it will come bundled with an associated IP-address and port number. If the IP matches your server IP, it will be sent to your server machine. The port number tells the computer _exactly_ to which application the packet should be sent. This allows computers to run many applications simultaneously and communicate between networks. You can read more [here](https://en.wikipedia.org/wiki/Port_(computer_networking))

#### How do I portforward?

In order to open a port to other networks, it must be explicitly told to open inside your network router. If you live at home, you'll have to discuss with your parents and have them allow you to do so. Opening the specific port for a terraria server will allow other computers to communicate with yours through the terraria application, _but nothing else because the terraria server application will 'consume' the port: no other application can then use this port._

#### How to access the router

Your typical home IP starts with 192.168, the router is often located on 192.168.1.1
You can type this number in your internet browser to navigate to the router webpage. You'll need the password to login, which is typically displayed on a sticker somewhere on the physical router device. It is recommended to change this password if possible to increase security. It is possible your internet provider did this for you, if you do not know the password you'll have to call them and discuss how you can retrieve it. You'll likely have to reset the router, so make sure to remember the password next time.

### Starting server on Windows

The [tModLoader installation](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install) contains a script called `start-tModLoaderServer.bat`. This script will start an instance of a server on Windows. There are several ways this file can be used.

1. Launch `start-tModLoaderServer.bat` directly
    1. Launches a server with `serverconfig.txt`
    2. Will prompt if the server should have Steam support enabled or not
    3. If `serverconfig.txt` does not set the `world` property, will also prompt for which world to load
2. [Make a shortcut](https://github.com/tModLoader/tModLoader/wiki/Command-Line#windows-shortcut) to `start-tModLoaderServer.bat`
    1. Additional parameters can be added to the `Target` to customize the game launch, such as setting `-world` to automatically load a specific world, `-config` to use a specific config file, `-nosteam` to skip prompting for Steam support, or any other supported command line argument.
3. Make a copy of `start-tModLoaderServer.bat` and edit the copy with the same command line arguments mentioned above
    1. Edit the `LaunchUtils/busybox-sh.bat ./start-tModLoaderServer.sh %*` line, adding command line arguments before `%*`. For example `LaunchUtils/busybox-sh.bat ./start-tModLoaderServer.sh -nosteam %*` will behave exactly the same as normal except it will skip the prompt to enable Steam multiplayer support. You can create a desktop shortcut to this .bat file for convenience.
4. Make a new `.bat` file
    1. In the file type `start-tModLoaderServer.bat` and then add any command line arguments. For example `start-tModLoaderServer.bat -nosteam -world "C:\Documents\My Games\Terraria\tModLoader\Worlds\MyWorld.wld"` would start a server loading `MyWorld.wld` with no Steam multiplayer support. You can create a desktop shortcut to this .bat file for convenience.

### Starting server on Linux or Mac

The [tModLoader installation](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install) contains a script called `start-tModLoaderServer.sh`. This script will start an instance of a server on Linux or Mac. This script can be launched and customized in the same manner as the Windows script in the section above, just replace `.bat` with `.sh` in those instructions and add command line arguments to the `launch_args="-server"` line instead if using the 3rd approach. You may also need to make the new `.sh` file executable as well.

Optional: it is recommended running the server inside of a screen or tmux session. This way, when you need to close the terminal, you don't have to close the server. This is especially useful for headless servers where the owner will only be connecting via SSH.

### Starting server headless

By default, the server will ask several questions before actually launching. The first question is if Steam multiplayer support should be enabled. If yes, it will then ask if the server should be open to friends, friends of friends, or be private. After this, mods will load and the server will ask which world to load. Once a world is selected, additional prompts for max players, server port, port forwarding, and password will be shown to the user.

With some configuration, these prompts can be skipped and the server can start "headless", or in other words it will start hosting a specific world directly with no interaction required. To start the server headless, we need to specify at least 2 things, the Steam multiplayer server support choice and the world to load.

To set the Steam multiplayer server mode, we can set one of the following command line arguments:
1. `-nosteam` - Steam multiplayer support disabled
2. `-steam -lobby friends` - Steam multiplayer support enabled, friends allowed to join directly.
3. `-steam -lobby friends -friendsoffriends` - Steam multiplayer support enabled, friends and friends of friends allowed to join directly.
4. `-steam -lobby private` - Steam multiplayer support enabled, invite only.

To specify a specific world to load:
1. The `-world ".wld file path here"` command line argument can be provided. Make sure this is the full file path to the `.wld` file, not the `.twld` file. For example, `-world "C:\Documents\My Games\Terraria\tModLoader\Worlds\MyWorld.wld"`.
2. The `world=` entry in `serverconfig.txt` or whatever `-config` file is being used can be set. Make sure this is the full file path to the `.wld` file, not the `.twld` file. For example, `world=C:\Documents\My Games\Terraria\tModLoader\Worlds\MyWorld.wld`. Make sure to save the config file. Quotes should not be used in this case and make sure to delete the preceding `#`. 

These custom command line arguments can be added to a copy of `start-tModLoaderServer.bat/sh` as shown in the [Starting server on Windows section](#starting-server-on-windows) or [Starting server on Linux or Mac section](#starting-server-on-windows). At this point launching the new script file should start a server directly with the specified world. Further edits can be done to customize port, mods, modpack, and many other settings if desired. These changes will either be command line arguments or changes to `serverconfig.txt` or whatever `-config` file is being used.

#### Additional server arguments
##### Set the Steam workshop content directory, useful for using SteamCMD to install workshop items to a custom directory
`-steamworkshopfolder /home/<user>/<Custom Workshop Mod Folder>/steamapps/workshop/`
