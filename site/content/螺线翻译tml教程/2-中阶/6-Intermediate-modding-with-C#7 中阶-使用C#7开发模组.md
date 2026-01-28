`WIP`
# What is C# 7?
C# 7 is the seventh version of the c-sharp language. It builds on the C# 6 version of the Roslyn compiler. To learn more about C# 6, see [its specific page](Intermediate-modding-with-c%236).

# How to build with C# 7?
**tML version 0.10.1.5 or above is required.**,
As of v0.11, C# 7 is the default, you can otherwise set your `languageVersion` to `6` because internally there are no changes in compiler between C# 6 and 7.

# Most useful features
Below is a list of features C# 7 has to offer that are most useful when modding.

## Nested functions (Local functions)
```c#
public void MyMethod() {
    void MyLocalFunc() {
        // I do something
    }

    MyLocalFunc(); // calling my nested function
}
```
This is an awesome feature that allows you to break up larger methods into smaller chunks. Nested functions can be reused within the same method as well. These functions are in scope in the enclosing block.

## Inline out variables
```cs
public void PrintCoordinates(Point p) {
    p.GetCoordinates(out int x, out int y);
    mod.Logger.InfoFormat("({0}, {1})", x, y);
}
```
Note that the variables are in scope in the enclosing block, so that the subsequent line can use them. Many kinds of statements do not establish their own scope, so out variables declared in them are often introduced into the enclosing scope.

This also allows "discards" as out parameters as well, in the form of a _, to let you ignore out parameters you don’t care about:
```cs
p.GetCoordinates(out var x, out _); // I only care about x
```

## Pattern Matching
Pattern matching is especially useful with [polymorphism](Polymorphism). You can identify objects using their inheritance-tree, this means you can identify them by parent-types as well.
### Constant patterns
E.g:
```cs
if (obj is ModItem) {
    // obj is a ModItem!
} else {
    // obj is not a ModItem!
}
```

### Type patterns
E.g:
```cs
if (obj is ModItem modItem) {
    // I can use modItem here!
    modItem.item.damage = ....
}
```
or: (reduced nesting like this is often favorable)
```cs
if (!(obj is ModItem modItem)) return;
// I can use modItem here!
modItem.item.damage = ....
```

### Patterns in switch statements
More information is available [here](https://visualstudiomagazine.com/articles/2017/02/01/pattern-matching.aspx).
```cs
switch(modItem)
{
    case ModItem a:
        // I got a ModItem!
        break;
    case ModItem b when (b.damage == 10):
        // I got a ModItem with a damage of 10!
        break;
    case MyModItem c when (b.MyCustomType == MyCustomType.Something):
        // ....
        break;
    default:
        // ...
        break;
    case null:
        throw new ArgumentNullException(nameof(modItem));
}
```

## Tuple types and literals
New tuple types and literals are extremely useful and have you avoid defining your own tuples (in the form of Tuple<x,y,z> and accessing by myType.Item1... Item2... etc.) or structs and instead use literals that are easily defined and can be deconstructed.
```cs
(int, float, int) GetItemInfo(Item item) // tuple return type
{
    return (dmg: item.damage, kb: item.knockBack, proj: item.shoot); // tuple literal
}
.....

// deconstruction
var itemInfo = GetItemInfo(myItem);
mod.Logger.Info(itemInfo.dmg.ToString());
// itemInfo.kb .... itemInfo.proj
```

Allows discarding too:

```cs
var (dmg, kb, _) = GetItemInfo(myItem);
// I can use dmg, kb (variables)
// Same as:
int dmg;
float kb;
(dmg, kb, _) = GetItemInfo(myItem);
// or:
(int dmg, float kb, _) = GetItemInfo(myItem);
```