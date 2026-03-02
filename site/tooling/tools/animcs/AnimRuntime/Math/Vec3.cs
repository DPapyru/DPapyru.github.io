namespace Microsoft.Xna.Framework;

public readonly struct Vector3 : IEquatable<Vector3>
{
    public float X { get; }
    public float Y { get; }
    public float Z { get; }

    public Vector3(float x, float y, float z)
    {
        X = x;
        Y = y;
        Z = z;
    }

    public static Vector3 Add(Vector3 a, Vector3 b) => new(a.X + b.X, a.Y + b.Y, a.Z + b.Z);
    public static Vector3 Sub(Vector3 a, Vector3 b) => new(a.X - b.X, a.Y - b.Y, a.Z - b.Z);
    public static Vector3 MulScalar(Vector3 v, float scalar) => new(v.X * scalar, v.Y * scalar, v.Z * scalar);
    public static Vector3 DivScalar(Vector3 v, float scalar)
    {
        if (MathF.Abs(scalar) <= 0.000001f)
        {
            return new Vector3(0f, 0f, 0f);
        }

        return new Vector3(v.X / scalar, v.Y / scalar, v.Z / scalar);
    }

    public static float Length(Vector3 v) => MathF.Sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z);

    public static Vector3 Normalize(Vector3 v)
    {
        var len = Length(v);
        if (len <= 0.000001f)
        {
            return new Vector3(0f, 0f, 0f);
        }

        return DivScalar(v, len);
    }

    public float Length() => Length(this);

    public Vector3 Normalize() => Normalize(this);

    public static Vector3 operator +(Vector3 a, Vector3 b) => Add(a, b);
    public static Vector3 operator -(Vector3 a, Vector3 b) => Sub(a, b);
    public static Vector3 operator *(Vector3 v, float scalar) => MulScalar(v, scalar);
    public static Vector3 operator *(float scalar, Vector3 v) => MulScalar(v, scalar);
    public static Vector3 operator /(Vector3 v, float scalar) => DivScalar(v, scalar);

    public bool Equals(Vector3 other) => X.Equals(other.X) && Y.Equals(other.Y) && Z.Equals(other.Z);

    public override bool Equals(object? obj) => obj is Vector3 other && Equals(other);

    public override int GetHashCode() => HashCode.Combine(X, Y, Z);

    public static bool operator ==(Vector3 left, Vector3 right) => left.Equals(right);

    public static bool operator !=(Vector3 left, Vector3 right) => !left.Equals(right);
}
