namespace AnimRuntime;

[AttributeUsage(AttributeTargets.Class)]
public sealed class AnimEntryAttribute : Attribute
{
    public string Name { get; }

    public AnimEntryAttribute(string name)
    {
        Name = name ?? string.Empty;
    }
}
