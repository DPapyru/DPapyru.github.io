namespace AnimRuntime;

[AttributeUsage(AttributeTargets.Class)]
public sealed class AnimProfileAttribute : Attribute
{
    public string Controls { get; set; } = string.Empty;
    public float HeightScale { get; set; } = 0f;
    public string ModeOptions { get; set; } = string.Empty;
}
