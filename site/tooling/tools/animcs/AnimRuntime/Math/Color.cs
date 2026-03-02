namespace Microsoft.Xna.Framework;

public readonly struct Color : IEquatable<Color>
{
    public byte R { get; }
    public byte G { get; }
    public byte B { get; }
    public byte A { get; }

    public Color(int r, int g, int b, int a = 255)
    {
        R = (byte)Math.Clamp(r, 0, 255);
        G = (byte)Math.Clamp(g, 0, 255);
        B = (byte)Math.Clamp(b, 0, 255);
        A = (byte)Math.Clamp(a, 0, 255);
    }

    public bool Equals(Color other) => R == other.R && G == other.G && B == other.B && A == other.A;

    public override bool Equals(object? obj) => obj is Color other && Equals(other);

    public override int GetHashCode() => HashCode.Combine(R, G, B, A);

    public static bool operator ==(Color left, Color right) => left.Equals(right);
    public static bool operator !=(Color left, Color right) => !left.Equals(right);
}
