# Introduction
tModPorter allows modders to easily port their existing code to the latest tModLoader API. tModPorter is updated alongside tModLoader. Whenever changes are made to the tModLoader API that would break the source code of existing mods, we attempt to write tModPorter code that would fix the code for the modder. In rare cases where an automatic fix is not possible, we add comments to instruct the modder on how to fix their code to accommodate the changes.

# Pull Requests
Writing tModPorter tests and code refactors is a slightly different skill set than making changes to the tModLoader source code itself. When a contributor makes a pull request, it is **not expected** that they write the tModPorter code. Frequent contributors, however, are **encouraged to try** writing tModPorter code for their pull requests. 

This guide will help interested contributors write tModPorter code. We encourage contributors to give it an attempt, as it will speed up tModLoader development. Remember that tModPorter code is not required for a pull request to be reviewed. The tModLoader maintainers will be able to write the tModPorter code when reviewing the pull request if needed.

# When is tModPorter Needed
Not all changes to tModLoader require tModPorter changes. New hooks, new functionality, and newly public variables are all examples of pull requests that wouldn't need any tModPorter consideration. 

tModPorter is needed when existing modder's code would have compile errors if the changes in your pull request were published. For example, changing the parameters to a hook is a typical change that would necessitate tModPorter code.

# Basics
There are 2 main parts to tModPorter, the "Tests" and the "Refactors". We'll first create a failing test, then add refactors to fix those failing tests.

> Note that the instructions in this guide will be demonstrated in screenshots using a contrived example that adds a `bool newParameter` to the `ModBuff.RightClick` method.

## Run Tests
Fist, let's make sure the tests run correctly before any changes. This is a sanity check. Follow these steps:

* Open up `tModLoader.sln`
* Build the `Terraria` project
* In the solution explorer, right click on the `tModPorter.Tests` project and select "Run Tests"   
 
![image](https://github.com/tModLoader/tModLoader/assets/4522492/d5b7a4c9-840e-4491-b1a7-580088c525de)

* This will build the `tModPorter` and `tModPorter.Tests` projects and will bring up the "Test Explorer" panel. After a few moments the tests should run and they should all pass.    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/06e77f8d-29f1-4bbf-ad3f-9edd178f2d15)

If something doesn't pass, either you forgot to build the Terraria project or something else is wrong. Seek help from a tModLoader maintainer.

It everything passes, you are ready for the next step.

## Write Failing Tests
In the solution explorer, open up the `tModPorter.Tests` project and the `TestData` folder, you should see a collection of `.cs` files. These files come in pairs, both the regular file and an ".Expected." file. The regular file is the input given to tModPorter and the other is the expected output of tModPorter:     

![image](https://github.com/tModLoader/tModLoader/assets/4522492/4d8a8f65-056e-4237-b623-d24815e64cb4)

Let's look at an example, open up `ModBuffTest.cs` and `ModBuffTest.Expected.cs`. In `ModBuffTest.cs`, the input file, you'll see code from various previous versions of tModLoader. For example, the parameters for `ModifyBuffTip` used to be `ref string tip, ref int rare`. In `ModBuffTest.Expected.cs`, the expected output file, you'll see the expected result from running tModPorter. Here we see that `ModifyBuffTip` now has the current parameters `ref string buffName, ref string tip, ref int rare`.     

![image](https://github.com/tModLoader/tModLoader/assets/4522492/368665d9-6ea2-4579-a331-b7c3804f67ae)

Now that we know about the input and expected files, it is time to write the tests. Find the file that most suits the changes in your PR. If no file exists, they can be created, but there should be existing tests for most of the tModLoader API classes. Add code to the input file that shows what modders might be using currently. Keep the code simple, just the changed method or field, no need to write actual mod content. Next, add the new code to the expected file.    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/bb43636e-a542-439e-91dc-1491067c81d2)

Run the tests again. You should see one or two failures. 

If the `ExpectedModCompiles` test fails, that means that the expected files do not build correctly. Click on the test entry to view the error message. This might just be a missing using statement, add the using statement to **both** the input and expected files and try running the tests again. If you see "no suitable method found to override", you likely forgot to build the `Terraria` project or made a typo. (In the rare case that tModPorter will not be able to fully port code to the new approach, see the [#if COMPILE_ERROR](https://github.com/tModLoader/tModLoader/wiki/Contributing-to-tModPorter#if-compile_error) section below for how to tell the tests to ignore compilation errors in the expected output.)

You should see an error for the input file you edited in the `RewriteCode` section. If you do not, then something is wrong. The error details will show a diff between the expected file and the output file. At this point we want this test to fail, we will be fixing this in the next section. Ensure that the diff looks correct. There should only be a diff shown for the changes that tModPorter will be expected to fix.     

![image](https://github.com/tModLoader/tModLoader/assets/4522492/80ca328e-0a78-46a9-b73c-01a429411851)

## Write Refactors
Now we are ready to write the actual tModPorter code. Open up the `Config.ModLoader.cs` file in the `tModPorter` project. This is where most of the refactors are implemented. Each statement in this file represents an automatic refactor that tModPorter will apply to the mod's source code. 

For example, the first line, `RenameInstanceField("Terraria.ModLoader.ModType", from: "mod", to: "Mod");`, will change all usage of the instance field `mod` in the `ModType` class to `Mod`. If you remember, this change happened in the 1.4.3 release. This code is still present so that tModPorter can help port even 1.3 mods to current tModLoader.

Take an opportunity to find a refactor that is similar to the changes you are implementing, there should be examples of all of the tModPorter functionality. Use the existing refactors as a guide. Now find a suitable place for your refactor. Try to follow the existing file organization. Follow the patterns shown in the examples to implement the refactor:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/2a7301cb-ddc5-48c4-9478-f232d2362e6b)

## Run Tests Again
Now run the tests again (right click on the `tModPorter.Tests` project and select "Run Tests"). If all goes well, you should see that the test has passed:    

![image](https://github.com/tModLoader/tModLoader/assets/4522492/e2089eef-caf2-4e29-ba5b-0ef0ae3a01b3)

If the test failed because of code formatting or whitespace, fix the issue in the expected or input file and run again. If the refactor doesn't seem to be applying at all, double check your code. If it is still failing, seek help from a tModLoader maintainer.

Once it is all working, commit your code changes to GitHub.

## Update Pull Request
Please update your pull request with a `Porting Notes` section. The section should detail the manual steps a modder would need to take to replicate the automatic refactors done by tModPorter. It should also mention other changes modders will need to adapt to. We will use this information to show in the `#preview-update-log` channel on the [tModLoader Discord](https://discord.gg/tmodloader), the [release announcements on Steam](https://steamcommunity.com/app/1281930/allnews/), and the [Update Migration Guide](https://github.com/tModLoader/tModLoader/wiki/Update-Migration-Guide) on our wiki. Do not update the migration guide wiki page, the tModLoader maintainers will do that.

# Workflow
To recap, this is the basic workflow:

* Open up `tModLoader.sln`
* Build the `Terraria` project
* Make failing test
* Write refactor code
* Ensure test succeeds
* Commit changes and update pull request description

# Advanced
## #if COMPILE_ERROR
Sometimes the functionality of tModPorter is insufficient to do all the changes for the modder. For example, the `ModBuffTest.Expected.cs` example has a section "commented out" by using `#if COMPILE_ERROR...#endif`. This section of code will not compile. Leaving in compiler errors is unavoidable in more advanced situations. In this case, the comments instruct the modder on how to fix the issue. We use the `#if COMPILE_ERROR...#endif` pattern to allow the tests to skip attempting to build those lines of code, allowing the `ExpectedModCompiles` test to continue succeeding. Don't use `#if COMPILE_ERROR...#endif` unless the actual result should result in a compile error. 