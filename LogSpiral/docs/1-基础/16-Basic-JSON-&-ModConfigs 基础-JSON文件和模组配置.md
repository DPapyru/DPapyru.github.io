## Introduction
Before we begin, it's important that you understand what a config is and how a 'ModConfig' is handled. First of all, config stands for 'configuration' and with that we often mean a 'configuration file'. There are many formats for configuration files, in tModLoader we use a language called JSON for ModConfigs.

## What is JSON?
JSON stands for JavaScript-Object-Notation and we will delve a bit deeper into the meaning and heritance of this name. JSON is a language used to store data in a specific format and it is used for data interchanging. JSON is often preferred over other languages because it is lightweight, flexible, and unstructured (meaning it supports _any_ structure!) Although certain other languages like XML (.xml) or YAML (.yml) provide more features they are not as lightweight. JSON was derived from JavaScript, although it has adapted into many languages by now. In fact, all JSON really is, is JavaScript objects. JSON is the official internet media type (`application/json`) and files use the `.json` file extension.

## How does JSON work?
JSON is comprised of data objects consisting of attribute-value pairs and array data types. If you know how a [Javascript object](https://www.w3schools.com/js/js_objects.asp) is built, JSON files will be very simple for you. Let's get right to it, here is a JSON sample showcasing its basic data types:
```json
{
	"key:": "value",
	"number": 420.7335,
	"string": "this is a string!",
	"boolean": true,
	
	"array": [
		10.20,
		"an array can hold many data types",
		false, 
		[
			"even arrays inside arrays!",
			42
		]
	],
	
	"object": {
		"name": "another object",
		"description": "we can also make objects within objects, the sky is the limit",
		"remarks": "note the JSON notation: key: value",
		"anotherObject": {
			"array": [
				"arrays inside an object inside an object? this is madness!",
				null
			]
		}
	},
	
	"arrayWithObjects": [
		{
			"name": "01001000 01100101 01101100",
			"description": "01101100 01101111" 
		},
		{
			"name": "01110111 01101111 01110010",
			"description": "01101100 01100100 00100001"
		}
	]
}
```
As you can see, the sky is the limit!
In JSON you'll be storing basic data types: strings, numbers, booleans, arrays, booleans and also null values. The above example showcases all basic data types and also in ways they can be combined. Next we will go over important remarks.

### Important remarks
Take a good look at the above example. The most important aspect of JSON is its key-value (or: name-value) pairs. It boils down to: a specific key matches a certain value. (notation: `"key": value`) Unlike a language such as C# (which uses a compiler), you do not specify the data type, it is parsed automatically. What is also important is that each element should be separated with a comma, apart from every last element. You are free to include a comma for last elements, but it is not required. To familiarize yourself with JSON it is recommended to fiddle a bit with it using [JSONLint](https://jsonlint.com/) which is a JSON validator. JSONLint will tell you if your JSON is valid, and if not it will tell you where it went wrong and why it went wrong. 

## How do modders utilize JSON for Terraria modding?
With tModLoader mods, modders don't directly use JSON. Modders can make ModConfig classes which use JSON to store configuration info. See ExampleConfig.cs for more information on ModConfig. If you'd like to inspect JSON files from ModConfig added by mods you use, these can be found in the `\Terraria\ModLoader\Mod Configs` (Windows: `%userprofile%\Documents\My Games\Terraria\ModLoader\Mod Configs`) folder as a `<ModName>_<ConfigName>.json` file. This file will only show deviations from the default values, so it might just be an empty file with only `{}` as its contents. It isn't usually useful to look at the files directly, but you could get some insight from them.