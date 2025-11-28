# Introduction
tModLoader logs useful information to log files. Users can use logs to identify buggy mods to disable. Users can see the [Reading client.log section in the User FAQ](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#reading-clientlog) to learn about how to read their own logs to identify buggy mods.

tModLoader use the [log4net library](https://logging.apache.org/log4net/) to facilitate logging functionality to modders. Modders can use logs from their users to diagnose and identify bugs and incompatibilities of the mods they develop. Modders can read below to learn how to properly utilize logging.

# Features
## Detailed logs
Logs are split between files, e.g: `client.log` and `server.log`. If there is an issue that happens in multiplayer, the issue might be logged in the server log or the client log, depending on where the code is running. If you see `client2.log` or `server2.log`, those are logs from a 2nd instance of the client or server running at the same time.
Every log output provides at least generic log info: time, loglevel and source.
![image](https://user-images.githubusercontent.com/4522492/192859549-6cb6fce2-f0c2-4d9e-96f1-8540eea44483.png)    

In addition to the normal logs, there are special logs that can be consulted for diagnosing more unique issues:
* `environment.log` is a log of the environment variables
* `Launch.log` is a log of the events that happen before the game actually launches
* `Natives.log` is a log of native dll issues and messages
* `terrariasteamclient.log` is a log of the process handling the Terraria playtime tracking feature

## Archiving
Old logs are archived in a compressed format so they can be revisited at a later date. These are contained in the `Old` subfolder. These old logs can be consulted for an issue that happened in a previous game session.    
![image](https://user-images.githubusercontent.com/4522492/192860671-fb01a278-2d68-43c0-afac-dcdb836001c6.png)

# Usage
Provided in your `Mod` class comes your own `Logger` object. You can use this to log things on behalf of your mod. Inside the log file, your mod will be marked as said source of the log.

There are a few different levels of logging:

**INFO** : Should be used for generic informational messages <br/>
**WARN** : Should be used as a warning, for example when something went wrong but didn't cause critical problems <br/>
**ERROR** : Should be used for critical problems, such as a mod breaking, potential crashing or malfunction of systems <br/>
**FATAL**: Should be used when the application can no longer do useful work due to a critical problem <br/>
**DEBUG** : Should be used for additional debugging information (verbose) <br/>

Knowing the difference between error and fatal logging can be difficult, but generally you can follow this rule of thumb: \`\`an error is fatal if the application can simply not continue due to the problem causing the error´´

Examples:
```cs
Mod.Logger.Info("This is an informational log"); // at log-level INFO
Mod.Logger.InfoFormat("This is a formatted informational log from {0}", Mod.Name);

Mod.Logger.Warn("This is a warning"); // at log-level WARN
Mod.Logger.WarnFormat("This is a warning from {0}", Mod.Name);

Mod.Logger.Error("An error occurred"); // at log-level ERROR
Mod.Logger.ErrorFormat("An error occurred: {0}", e.StackTrace);

Mod.Logger.Fatal("Something fatal happened"); // at log-level FATAL
Mod.Logger.FatalFormat("Something fatal happened: {0}", e.StackTrace);

Mod.Logger.Debug("Some debug info"); // at log-level DEBUG
Mod.Logger.DebugFormat("Some debug info: ({0}, {1})", x, y);
```

The above examples all assume the logging is taking place in any `ModX`-inheriting class, such as `ModItem`, `ModSystem`, etc. If you are logging from the `Mod` class directly, you can just write `Logger.Info("Example Text");`. If you are logging from some other class, you can use `ModContent.GetInstance<ModNameHere>().Logger.Info("Example Text");` to access the `Logger` of your `Mod` class.

# What should I log?
It can be hard to determine what should be logged. In general, you should try to avoid bloating log files with useless items. Ask yourself: \`\`what purpose does this item have if logged?´´. You want your logs to be useful, so they need a _purpose_. The purpose of a log is usually to identify issues (or to ensure there are none!) Ideally, you only log items that are required for this purpose. For example, you should push an informational log if a system in your mod completed a particular task successfully (e.g. setting up). In case it failed, it would push a warning or error instead. This way, when inspecting logs, you could identify an issue with the initialization of this system if it occurred.

## Optional Logging
You can use a `ModConfig` option to allow a user to determine if something should be logged. This can be useful for rare situations that would bloat the log files of the majority of users. An example of this approach can be seen in [BossChecklist](https://github.com/JavidPack/BossChecklist/search?q=ModCallLogVerbose). In this example, logging that would only be useful for modders is provided as an option that can be toggled on, keeping bloat from normal users log files. 