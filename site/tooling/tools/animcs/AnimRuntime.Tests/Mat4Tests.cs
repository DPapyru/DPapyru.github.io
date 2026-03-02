using Microsoft.Xna.Framework;
using Xunit;

namespace AnimRuntime.Tests;

public sealed class Mat4Tests
{
    [Fact]
    public void Mat4_Identity_And_Translation_Works()
    {
        var v = new Vector3(1, 2, 3);
        Assert.Equal(v, Matrix.Identity * v);
        Assert.Equal(new Vector3(6, -1, 13), Matrix.CreateTranslation(5, -3, 10) * v);
    }

    [Fact]
    public void Mat4_Mul_Order_For_ColumnVector_Works()
    {
        var scale = Matrix.CreateScale(2, 3, 4);
        var translate = Matrix.CreateTranslation(1, 2, 3);
        var combined = translate * scale;
        var result = combined * new Vector3(1, 1, 1);
        Assert.Equal(new Vector3(3, 5, 7), result);
    }

    [Fact]
    public void Mat4_RotationZ_Works()
    {
        var rotated = Matrix.CreateRotationZ(MathF.PI * 0.5f) * new Vector3(1, 0, 0);
        Assert.InRange(rotated.X, -0.0001f, 0.0001f);
        Assert.InRange(rotated.Y, 0.9999f, 1.0001f);
        Assert.InRange(rotated.Z, -0.0001f, 0.0001f);
    }

    [Fact]
    public void Mat4_Transforms_Vec2_Point_Works()
    {
        var translated = Matrix.CreateTranslation(3f, -2f, 0f) * new Vector2(1f, 2f);
        Assert.Equal(new Vector2(4f, 0f), translated);

        var scaled = Matrix.CreateScale(2f, 3f, 1f) * new Vector2(1f, 2f);
        Assert.Equal(new Vector2(2f, 6f), scaled);
    }
}
