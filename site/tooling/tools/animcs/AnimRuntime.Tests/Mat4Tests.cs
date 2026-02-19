using AnimRuntime.Math;
using Xunit;

namespace AnimRuntime.Tests;

public sealed class Mat4Tests
{
    [Fact]
    public void Mat4_Identity_And_Translation_Works()
    {
        var v = new Vec3(1, 2, 3);
        Assert.Equal(v, Mat4.Identity() * v);
        Assert.Equal(new Vec3(6, -1, 13), Mat4.Translation(5, -3, 10) * v);
    }

    [Fact]
    public void Mat4_Mul_Order_For_ColumnVector_Works()
    {
        var scale = Mat4.Scale(2, 3, 4);
        var translate = Mat4.Translation(1, 2, 3);
        var combined = translate * scale;
        var result = combined * new Vec3(1, 1, 1);
        Assert.Equal(new Vec3(3, 5, 7), result);
    }

    [Fact]
    public void Mat4_RotationZ_Works()
    {
        var rotated = Mat4.RotationZ(MathF.PI * 0.5f) * new Vec3(1, 0, 0);
        Assert.InRange(rotated.X, -0.0001f, 0.0001f);
        Assert.InRange(rotated.Y, 0.9999f, 1.0001f);
        Assert.InRange(rotated.Z, -0.0001f, 0.0001f);
    }

    [Fact]
    public void Mat4_Transforms_Vec2_Point_Works()
    {
        var translated = Mat4.Translation(3f, -2f, 0f) * new Vec2(1f, 2f);
        Assert.Equal(new Vec2(4f, 0f), translated);

        var scaled = Mat4.Scale(2f, 3f, 1f) * new Vec2(1f, 2f);
        Assert.Equal(new Vec2(2f, 6f), scaled);
    }
}
