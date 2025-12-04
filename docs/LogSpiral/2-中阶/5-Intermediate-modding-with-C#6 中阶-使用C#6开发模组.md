Please check the [prerequisites](Intermediate-Prerequisites) before following this guide.

## What is C#6?
C#6 stands for version 6 of the c-sharp language. By default, you will be compiling your mod using c-sharp version 4. However, it is possible to compile your mod using c-sharp version 6. In this guide we will go over how to compile using version 6, and which benefits it may include.

## How to compile in C#6
To enable version 6 compile, set languageVersion to 6 in your build.txt file:
`languageVersion = 6`

### Ways to compile 
It is recommended to use your IDE to compile and debug your mod. You can view the [Developing with Visual Studio guide](Developing-with-Visual-Studio) on how to set this up. You can also compile using the in-game menu, but sometimes this can introduce additional problems you won't have when compiling from your IDE directly. We will go over these issues later on in the guide.

## Why should I use C#6?
In general, it is usually best to use the latest version of something. Our language version is not an exception, version 6 comes with many improvements over the old version. It is advised to check [the official Microsoft article covering c#6 notes](https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-6) to see all the goodies. In general, c#6 has some neat QoL improvements we will cover below. Here is a full list of what c#6 introduced:
* Read-only Auto-properties:
    * You can create read-only auto-properties that can be set only in constructors.
* Auto-Property Initializers:
    * You can write initialization expressions to set the initial value of an auto-property.
* Expression-bodied function members:
    * You can author one-line methods using lambda expressions.
* using static:
    * You can import all the methods of a single class into the current namespace.
* Null - conditional operators:
    * You can concisely and safely access members of an object while still checking for null with the null conditional operator.
* String Interpolation:
    * You can write string formatting expressions using inline expressions instead of positional arguments.
* Exception filters:
    * You can catch expressions based on properties of the exception or other program state.
* nameof Expressions:
    * You can let the compiler generate string representations of symbols.
* await in catch and finally blocks:
    * You can use await expressions in locations that previously disallowed them.
* index initializers:
    * You can author initialization expressions for associative containers as well as sequence containers.
* Extension methods for collection initializers:
    * Collection initializers can rely on accessible extension methods, in addition to member methods.
* Improved overload resolution:
    * Some constructs that previously generated ambiguous method calls now resolve correctly.

Please do check the linked article above which explains everything in great detail. Many of these QoL will shorten your code, and/or make it more readable (as well as easier to work with!)

## Is it possible to compile in C#7?
Compiling with C#7 is possible with releases _after version v0.10.1.5_. To learn more about it, see the [C#7 specific page](Intermediate-modding-with-c%237)

## Most notable code improvements with C#6 for modders
### Expression-bodied function members
Any method you have, for example an overridden hook that only returns some value, can now be shortened as an expression-bodied function members (pointer like functions) eg.
```csharp
public override bool SomeHook() 
{
   return something() ? true : somethingAgain() : false;
}
```
Can be shortened to
```csharp
public override bool SomeHook() => something() ? true : somethingAgain() : false
```

### String interpolation
You no longer have to use string.Format, instead use the new string interpolation:
```csharp
string s = string.Format("Hello {0}, how are you on {1}?", user.name, DateTime.Now);
```
Can be shortened to
```csharp
string s = $"Hello {user.name}, how are you on {DateTime.Now}?";
```
## Long list of issues when compiling with c#6

### !! IMPORTANT !! Possible issues
**Note: most, if not all, of these issues have been solved since [v0.10.1.2](https://github.com/tModLoader/tModLoader/releases/tag/v0.10.1.2). If for some reason you are still on an older version, you can see below for various issues and possible fixes.**

You need to include System.Core in some way or form in your code to avoid a bug.
```csharp
using System.Linq; // explicity use

public static void RedundantFunc() // try something like this if the using directive isn't enough
{
        var something = System.Linq.Enumerable.Range(1, 10);
}
```

### System.Reflection.TargetInvocationException: Exception has been thrown by the target of an invocation. ---> System.IO.FileNotFoundException: Could not load file or assembly 'System.Collections.Immutable, Version=1.1.37.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a' or one of its dependencies. The system cannot find the file specified.
If you run into this issue, you need to add [System.Collections.Immutable.dll](https://cdn.discordapp.com/attachments/103115427491610624/352120158439079936/System.Collections.Immutable.dll) to your \ModCompile\ folder. A newly distributed RoselynWrapper.dll needs to include this .dll for this issue to be resolved.

### Metadata file 'path\FNA.dll\ could not be found OR another error mentioning FNA.dll
To fix this issue, go to your \ModCompile\ folder and look for the `FNA.dll` file. _**Copy**_ this file one directory up (to the Terraria directory). You probably ran into this issue by compiling through the in-game menu. Make sure you also reference System.Core as mentioned above.

### An error mentioning something about ReLogic.dll not being found or able to be accessed
Go to your Terraria folder and look for `ReLogic.Native.dll` and _**copy**_ this file to your \ModCompile\ folder, then rename it to `ReLogic.dll` If it now starts mentioning Mac/Linux, copy the file twice more and name them to `ReLogicMac.dll` and `ReLogicLinux.dll`

### C#6 issues: "An attempt was made to load an assembly from a network location..."
[See this page](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-FAQ#c-6-issues-an-attempt-was-made-to-load-an-assembly-from-a-network-location).