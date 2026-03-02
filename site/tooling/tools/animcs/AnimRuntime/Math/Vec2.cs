namespace Microsoft.Xna.Framework;

public readonly struct Vector2 : IEquatable<Vector2>
{
    public float X { get; }
    public float Y { get; }

    public Vector2(float x, float y)
    {
        X = x;
        Y = y;
    }

    public static Vector2 Add(Vector2 a, Vector2 b) => new(a.X + b.X, a.Y + b.Y);
    public static Vector2 Sub(Vector2 a, Vector2 b) => new(a.X - b.X, a.Y - b.Y);
    public static Vector2 MulScalar(Vector2 v, float scalar) => new(v.X * scalar, v.Y * scalar);
    public static Vector2 DivScalar(Vector2 v, float scalar) => MathF.Abs(scalar) <= 0.000001f ? new Vector2(0f, 0f) : new Vector2(v.X / scalar, v.Y / scalar);

    public static Vector2 operator +(Vector2 a, Vector2 b) => Add(a, b);
    public static Vector2 operator -(Vector2 a, Vector2 b) => Sub(a, b);
    public static Vector2 operator *(Vector2 v, float scalar) => MulScalar(v, scalar);
    public static Vector2 operator *(float scalar, Vector2 v) => MulScalar(v, scalar);
    public static Vector2 operator /(Vector2 v, float scalar) => DivScalar(v, scalar);

    public bool Equals(Vector2 other) => X.Equals(other.X) && Y.Equals(other.Y);

    public override bool Equals(object? obj) => obj is Vector2 other && Equals(other);

    public override int GetHashCode() => HashCode.Combine(X, Y);

    public static bool operator ==(Vector2 left, Vector2 right) => left.Equals(right);
    public static bool operator !=(Vector2 left, Vector2 right) => !left.Equals(right);
}
