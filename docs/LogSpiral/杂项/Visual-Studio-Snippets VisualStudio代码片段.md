**When you've figured out the basics of modding, it can be annoying to constantly go to ExampleMod just to copy code that you're too lazy to manually write (believe me, I used to do this all the time). Fortunately, Visual Studio supports the use of custom snippets, which allow you to paste premade code with a few key-presses.**

***

# First VS Snippet
To create your first snippet, create a file with the `snippet` extension.

![image](https://user-images.githubusercontent.com/68346263/156292238-8e6b0c53-d83f-4128-813c-adf346191dc7.png)

Open the file in any text editor and paste this:
```xml
<?xml version="1.0" encoding="utf-8"?>
<CodeSnippets xmlns="http://schemas.microsoft.com/VisualStudio/2005/CodeSnippet">
    <CodeSnippet Format="1.0.0">
        <Header>
            <Title>Snippet Title</Title>
        </Header>
        <Snippet>
            <Code Language="CSharp">
                <![CDATA[]]>
            </Code>
            <Declarations></Declarations>
        </Snippet>
    </CodeSnippet>
</CodeSnippets>
```

If you've never worked with HTML or XML this might look intimidating, so here's a simplified breakdown of all the important bits:
- Everything in the `Header` tag is the snippet's information, which is displayed in the Snippet Manager. For now, title the snippet however you want.
- The actual code that this snippet will provide should go in the `Code` tag, inside the `CDATA` bracket pair. In short: `<![CDATA[your code goes here]]>`. You can format the code however you want, but Visual Studio's C# language features will automatically format it when the snippet is used.
- The `Declarations` tag is where you put your parameters. These are the parts of the snippet that you are able to customise when you use it (more on this later).

***

# Snippet Parameters
Parameters are a great way to add flexibility to your snippets, allowing you to customise the boilerplate code that the snippet provides. Parameters can be used in place of variable names, function parameters, and other areas of your code wherein you want to include customisability. For example, you could add a parameter in place of a class name to allow the user to use his / her own.

To create a parameter, in place of a value of your choice, add any name, and surround the name with `$` characters (example: `private void FindSqrt(16)` → `private void FindSqrt($Value$)`).

Here's one of the parameters in the Mod Item snippet that I use. Notice how the content of the string is removed and replaced with a `Literal`:

![image](https://user-images.githubusercontent.com/68346263/156295293-0e317d1c-aecd-4924-a848-0fe9183c6874.png)

Now that you set up your `Literal`, you need to give it some properties. Remember the `Declarations` tag in your snippet's code? Within it, write code as shown here
```xml
<Declarations>
    <Literal>
        <ID>Value</ID>
        <ToolTip>Value of parameter</ToolTip>
        <Default>16</Default>
    </Literal>
</Declarations>
```

- The `Literal` tag defines a new replaceable value
- The `ID` is what's within the `$` in the code
- The `Tooltip` is a helpful bit of information about the value. While not required, it is recommended
- The `Default` tag defines the default value of this parameter. This is just what's shown when the snippet is first used

Here's how the declaration looks for the tooltip parameter of my snippet:

![image](https://user-images.githubusercontent.com/68346263/156295774-0ba8ce9f-9fca-469c-9de3-99ee9f327e46.png)

And here's how the parameter will look when the snippet is used.

![image](https://user-images.githubusercontent.com/68346263/156295840-03f66ffb-d586-41a6-b19e-25e7bef3436d.png)

***

# Importing your snippet

Once you've finished writing the code for your snippet, save the file and open Visual Studio (if it isn't already open). Press `Control K` followed by `Control B` to open up the snippet Manager; this is where you can manage snippets added by Visual Studio or yourself. Select `CSharp` in the Language dropdown, click the Import button, and select your file. You'll see a new window, wherein you're asked where you want to import your snippet file. You should see a folder named `My Code Snippets` on the right; select that.

Now that your snippet is in Visual Studio, you're ready to use it. Press `Control K` followed by `Control X`, click `My Code Snippets`, and select your snippet. The code that you put in the `<![CDATA[]]>` part of your snippet file should appear, and if it does, congratulations! You've completed your first Visual Studio snippet. You can repeat this process for all of your boilerplate code needs.

Here's a demonstration of snippets using my example | [Snippet Code](https://gist.github.com/Arnimox/8c09aa22768f958333d15a089529d465)

![](https://cdn.discordapp.com/attachments/886315368027676702/948421370331689030/SnippetsShowcase.gif?size=4096)