namespace AnimRuntime.Math;

public readonly struct Vec3 : IEquatable<Vec3>
{
    public float X { get; }
    public float Y { get; }
    public float Z { get; }

    public Vec3(float x, float y, float z)
    {
        X = x;
        Y = y;
        Z = z;
    }

    public static Vec3 operator +(Vec3 a, Vec3 b) => new Vec3(a.X + b.X, a.Y + b.Y, a.Z + b.Z);
    public static Vec3 operator -(Vec3 a, Vec3 b) => new Vec3(a.X - b.X, a.Y - b.Y, a.Z - b.Z);
    public static Vec3 operator *(Vec3 a, float scalar) => new Vec3(a.X * scalar, a.Y * scalar, a.Z * scalar);
    public static Vec3 operator *(float scalar, Vec3 a) => a * scalar;
    public static Vec3 operator /(Vec3 a, float scalar) => new Vec3(a.X / scalar, a.Y / scalar, a.Z / scalar);

    public float Length() => MathF.Sqrt(X * X + Y * Y + Z * Z);

    public Vec3 Normalize()
    {
        var len = Length();
        if (len <= 0.000001f)
        {
            return new Vec3(0f, 0f, 0f);
        }

        return this / len;
    }

    public static float Length(Vec3 v) => v.Length();

    public static Vec3 Normalize(Vec3 v) => v.Normalize();

    public bool Equals(Vec3 other) => X.Equals(other.X) && Y.Equals(other.Y) && Z.Equals(other.Z);

    public override bool Equals(object? obj) => obj is Vec3 other && Equals(other);

    public override int GetHashCode() => HashCode.Combine(X, Y, Z);

    public static bool operator ==(Vec3 left, Vec3 right) => left.Equals(right);

    public static bool operator !=(Vec3 left, Vec3 right) => !left.Equals(right);
}
