namespace AnimRuntime;

public sealed class InputState
{
    public float X { get; set; }
    public float Y { get; set; }
    public float DeltaX { get; set; }
    public float DeltaY { get; set; }
    public bool IsDown { get; set; }
    public bool WasPressed { get; set; }
    public bool WasReleased { get; set; }
    public bool IsInside { get; set; }
}
