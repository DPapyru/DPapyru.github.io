namespace AnimRuntime.Math;

public readonly struct Mat4 : IEquatable<Mat4>
{
    public float M00 { get; }
    public float M01 { get; }
    public float M02 { get; }
    public float M03 { get; }
    public float M10 { get; }
    public float M11 { get; }
    public float M12 { get; }
    public float M13 { get; }
    public float M20 { get; }
    public float M21 { get; }
    public float M22 { get; }
    public float M23 { get; }
    public float M30 { get; }
    public float M31 { get; }
    public float M32 { get; }
    public float M33 { get; }

    public Mat4(
        float m00, float m01, float m02, float m03,
        float m10, float m11, float m12, float m13,
        float m20, float m21, float m22, float m23,
        float m30, float m31, float m32, float m33)
    {
        M00 = m00; M01 = m01; M02 = m02; M03 = m03;
        M10 = m10; M11 = m11; M12 = m12; M13 = m13;
        M20 = m20; M21 = m21; M22 = m22; M23 = m23;
        M30 = m30; M31 = m31; M32 = m32; M33 = m33;
    }

    public static Mat4 Identity() => new Mat4(
        1f, 0f, 0f, 0f,
        0f, 1f, 0f, 0f,
        0f, 0f, 1f, 0f,
        0f, 0f, 0f, 1f
    );

    public static Mat4 Translation(float x, float y, float z) => new Mat4(
        1f, 0f, 0f, x,
        0f, 1f, 0f, y,
        0f, 0f, 1f, z,
        0f, 0f, 0f, 1f
    );

    public static Mat4 Scale(float x, float y, float z) => new Mat4(
        x, 0f, 0f, 0f,
        0f, y, 0f, 0f,
        0f, 0f, z, 0f,
        0f, 0f, 0f, 1f
    );

    public static Mat4 RotationX(float radians)
    {
        var c = MathF.Cos(radians);
        var s = MathF.Sin(radians);
        return new Mat4(
            1f, 0f, 0f, 0f,
            0f, c, -s, 0f,
            0f, s, c, 0f,
            0f, 0f, 0f, 1f
        );
    }

    public static Mat4 RotationY(float radians)
    {
        var c = MathF.Cos(radians);
        var s = MathF.Sin(radians);
        return new Mat4(
            c, 0f, s, 0f,
            0f, 1f, 0f, 0f,
            -s, 0f, c, 0f,
            0f, 0f, 0f, 1f
        );
    }

    public static Mat4 RotationZ(float radians)
    {
        var c = MathF.Cos(radians);
        var s = MathF.Sin(radians);
        return new Mat4(
            c, -s, 0f, 0f,
            s, c, 0f, 0f,
            0f, 0f, 1f, 0f,
            0f, 0f, 0f, 1f
        );
    }

    public static Mat4 PerspectiveFovRh(float fov, float aspect, float near, float far)
    {
        var f = 1f / MathF.Tan(fov * 0.5f);
        return new Mat4(
            f / aspect, 0f, 0f, 0f,
            0f, f, 0f, 0f,
            0f, 0f, far / (near - far), (far * near) / (near - far),
            0f, 0f, -1f, 0f
        );
    }

    public static Mat4 operator *(Mat4 a, Mat4 b)
    {
        return new Mat4(
            a.M00 * b.M00 + a.M01 * b.M10 + a.M02 * b.M20 + a.M03 * b.M30,
            a.M00 * b.M01 + a.M01 * b.M11 + a.M02 * b.M21 + a.M03 * b.M31,
            a.M00 * b.M02 + a.M01 * b.M12 + a.M02 * b.M22 + a.M03 * b.M32,
            a.M00 * b.M03 + a.M01 * b.M13 + a.M02 * b.M23 + a.M03 * b.M33,

            a.M10 * b.M00 + a.M11 * b.M10 + a.M12 * b.M20 + a.M13 * b.M30,
            a.M10 * b.M01 + a.M11 * b.M11 + a.M12 * b.M21 + a.M13 * b.M31,
            a.M10 * b.M02 + a.M11 * b.M12 + a.M12 * b.M22 + a.M13 * b.M32,
            a.M10 * b.M03 + a.M11 * b.M13 + a.M12 * b.M23 + a.M13 * b.M33,

            a.M20 * b.M00 + a.M21 * b.M10 + a.M22 * b.M20 + a.M23 * b.M30,
            a.M20 * b.M01 + a.M21 * b.M11 + a.M22 * b.M21 + a.M23 * b.M31,
            a.M20 * b.M02 + a.M21 * b.M12 + a.M22 * b.M22 + a.M23 * b.M32,
            a.M20 * b.M03 + a.M21 * b.M13 + a.M22 * b.M23 + a.M23 * b.M33,

            a.M30 * b.M00 + a.M31 * b.M10 + a.M32 * b.M20 + a.M33 * b.M30,
            a.M30 * b.M01 + a.M31 * b.M11 + a.M32 * b.M21 + a.M33 * b.M31,
            a.M30 * b.M02 + a.M31 * b.M12 + a.M32 * b.M22 + a.M33 * b.M32,
            a.M30 * b.M03 + a.M31 * b.M13 + a.M32 * b.M23 + a.M33 * b.M33
        );
    }

    public static Vec3 operator *(Mat4 m, Vec3 v)
    {
        var x = m.M00 * v.X + m.M01 * v.Y + m.M02 * v.Z + m.M03;
        var y = m.M10 * v.X + m.M11 * v.Y + m.M12 * v.Z + m.M13;
        var z = m.M20 * v.X + m.M21 * v.Y + m.M22 * v.Z + m.M23;
        var w = m.M30 * v.X + m.M31 * v.Y + m.M32 * v.Z + m.M33;

        if (MathF.Abs(w) > 0.000001f && MathF.Abs(w - 1f) > 0.000001f)
        {
            return new Vec3(x / w, y / w, z / w);
        }

        return new Vec3(x, y, z);
    }

    public bool Equals(Mat4 other)
    {
        return
            M00.Equals(other.M00) && M01.Equals(other.M01) && M02.Equals(other.M02) && M03.Equals(other.M03) &&
            M10.Equals(other.M10) && M11.Equals(other.M11) && M12.Equals(other.M12) && M13.Equals(other.M13) &&
            M20.Equals(other.M20) && M21.Equals(other.M21) && M22.Equals(other.M22) && M23.Equals(other.M23) &&
            M30.Equals(other.M30) && M31.Equals(other.M31) && M32.Equals(other.M32) && M33.Equals(other.M33);
    }

    public override bool Equals(object? obj) => obj is Mat4 other && Equals(other);

    public override int GetHashCode()
    {
        var hash = new HashCode();
        hash.Add(M00); hash.Add(M01); hash.Add(M02); hash.Add(M03);
        hash.Add(M10); hash.Add(M11); hash.Add(M12); hash.Add(M13);
        hash.Add(M20); hash.Add(M21); hash.Add(M22); hash.Add(M23);
        hash.Add(M30); hash.Add(M31); hash.Add(M32); hash.Add(M33);
        return hash.ToHashCode();
    }

    public static bool operator ==(Mat4 left, Mat4 right) => left.Equals(right);

    public static bool operator !=(Mat4 left, Mat4 right) => !left.Equals(right);
}
