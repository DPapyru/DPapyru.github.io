namespace AnimRuntime.Math;

public readonly struct Vec2 : IEquatable<Vec2>
{
    public float X { get; }
    public float Y { get; }

    public Vec2(float x, float y)
    {
        X = x;
        Y = y;
    }

    public static Vec2 operator +(Vec2 a, Vec2 b) => new Vec2(a.X + b.X, a.Y + b.Y);
    public static Vec2 operator -(Vec2 a, Vec2 b) => new Vec2(a.X - b.X, a.Y - b.Y);

    public bool Equals(Vec2 other) => X.Equals(other.X) && Y.Equals(other.Y);

    public override bool Equals(object? obj) => obj is Vec2 other && Equals(other);

    public override int GetHashCode() => HashCode.Combine(X, Y);

    public static bool operator ==(Vec2 left, Vec2 right) => left.Equals(right);
    public static bool operator !=(Vec2 left, Vec2 right) => !left.Equals(right);
}
