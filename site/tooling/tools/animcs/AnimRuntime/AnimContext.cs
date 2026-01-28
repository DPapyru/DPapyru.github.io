namespace AnimRuntime;

public sealed class AnimContext
{
    public int Width { get; private set; }
    public int Height { get; private set; }
    public float Time { get; private set; }
    public InputState Input { get; } = new();

    public void Update(float dt, int width, int height)
    {
        Time += dt;
        Width = width;
        Height = height;
    }
}
