This guide is to help those who are having troubles with playing multiplayer with tModLoader.

# I can't join my own server using Host and Play
## Verify that you are connecting to the correct server
### "You are not using the same version as this server"

You are trying to connect to a server that is not the correct version. You might be trying to connect to an un-modded server, or you might be connecting to an outdated tModLoader server. 

1. Open tModLoader
2. Open `start-tModLoaderServer.bat` directly by opening the [install folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install) and double clicking on the `start-tModLoaderServer.bat` file.
3. Verify that the tModLoader version of the Client and the Server match exactly. If not, reinstall the latest tModLoader.
4. You can also verify the filesizes

## Version is fine
If version is the same, but the client still reports it's not the same version, check that the host doesn't also have a vanilla/unmodded server running on the same port (usually 7777).
If version isn't the issue, read [My connection is fine but my friend or I am stuck on "Connecting..."](#my-connection-is-fine-but-my-friend-or-i-am-stuck-on-connecting) below

## Stuck on "Found Server"
If you have an ASUS computer, there seems to be a program called Armory Crate running that prevents running the server on the normal 7777 port. You can close that program, or launch the server manually with a different port to bypass this issue. Make sure when you connect to the server to specify the new port as well.

If you do not have that you can check for other programs taking the ports by opening up Resource Monitor, going to the Network tab, then expand TCP Connections and Listening Ports, then sort them both by Port. Look for any program using the default 7777 port.

# When I join my own server, mods get disabled
This is caused by bad mods. You must view the `server.log` file or start the server with the console visible to identify the issue. 
* (Note: Option currently broken, see next option instead) Set Show Server Console to On: [image](https://i.imgur.com/nfhC1GH.png)
  * When the console shows up, look for red text or anything that looks out of place. Reading the exception messages, you should see mod names mentioned, disable those mods.
* View `server.log` by opening the `server.log` file from the [logs folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#logs) in a text editor. Look for exception messages and stop using the mods that are causing the errors.

If you are the developer of the mod that is being disabled, the most common reason for this is code accessing fields that are only assigned on the client but are `null` on the server. Another common issue is attempting to access or initialize UI fields, which also aren't initialized on the server. The error message in `server.log` should contain the file and line number of the error, but the easiest way to located and fix these issues is to [debug the server directly in the debugger](https://github.com/tModLoader/tModLoader/wiki/Learn-How-To-Debug#debugging-the-server).

# I can join my server, but my friend can't
## Make sure you have the correct IP address
1. If you are giving your friends an IP address that looks like `192.168.x.x`, then you have the wrong IP address. IP addresses that start with `192.168` are local IP addresses and will only work for playing with friends that are physically at your house connected to the same router as you.
2. To find your internet IP address, you can google "what is my ip address" or visit a site like [canyouseeme.org](https://www.canyouseeme.org/). This number is the address you need to give to your friends. This number can change every once in a while, depending on your internet service provider.
## Verify that your server is visible to the internet
1. Open `start-tModLoaderServer.bat` directly by opening the [install folder](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-Guide#install) and double clicking on the `start-tModLoaderServer.bat` file. (You can do this in Host and Play by setting Show Server Console to On: [image](https://i.imgur.com/nfhC1GH.png))
2. Select a world and start the server
3. Go to [canyouseeme.org](http://canyouseeme.org/) on the computer with the server running and type in 7777 as the port (adjust this if you changed it.)
4. Click Check Port
    * If the website says error, your ports are not open. You may need to enable UPnP on your router, unblock the `[install folder]/dotnet/dotnet.exe` file on the Windows Firewall, or manually port forward on the router. With the firewall, you'll want to click details and make sure the path matches the modded server path. There might be 4 separate entries depending on how you installed tModLoader, so you'll need to check all of them. You'll want to make sure both check boxes are checked. For router issues you'll just have to Google that and learn how to do that.
![](https://i.imgur.com/Ds6brPn.png)
    * If the website says Success, you should see a message like "Exception normal: Tried to send data to a client after losing connection" on the server console. This is fine. We now know that the server is visible to the internet, so the problem might be on your friends computer.  
![](https://i.imgur.com/xxPNTBN.png)
![](https://i.imgur.com/4Eo66NN.png)

## My connection is fine but my friend or I am stuck on "Connecting..."
This is where things get complicated. There could be many reasons for this error, and most of them are likely caused by poorly programmed mods. The best approach is to launch the server manually (NOT Host and Play) and watch for messages that appear to be errors in the output. (You can do this in Host and Play by setting Show Server Console to On: [image](https://i.imgur.com/nfhC1GH.png))

First, I would suggest using fresh player and world files and attempting to connect to the server. If this works, the problem might be a mod that has trouble saving or loading its custom data correctly.

To figure out which mod is causing issues, you'll need to start the server many different times either adding or removing mods from your list of mods until you discover that you can join the server again. I'd start with no mods and then work my way up, adding a few mods at a time. Once you discover that you can't connect anymore, you have found a problem mod by the process of elimination. Unfortunately, the solution is to just not use that mod unless the modder who made the mod can diagnose the problem using your modlist, or world and player files.

The process:  
![](http://i.imgur.com/5nGP6Qi.png)