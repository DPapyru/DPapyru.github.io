using Microsoft.Xna.Framework;
using Xunit;

namespace AnimRuntime.Tests;

public sealed class Vec3Tests
{
    [Fact]
    public void Vec3_Add_Sub_Mul_Div_Works()
    {
        var a = new Vector3(1, 2, 3);
        var b = new Vector3(4, 5, 6);

        Assert.Equal(new Vector3(5, 7, 9), a + b);
        Assert.Equal(new Vector3(-3, -3, -3), a - b);
        Assert.Equal(new Vector3(2, 4, 6), a * 2f);
        Assert.Equal(new Vector3(2, 4, 6), 2f * a);
        Assert.Equal(new Vector3(0.5f, 1f, 1.5f), a / 2f);
    }

    [Fact]
    public void Vec3_Length_Normalize_Works()
    {
        var v = new Vector3(3, 4, 0);
        Assert.Equal(5f, v.Length(), 3);

        var unit = v.Normalize();
        Assert.Equal(1f, unit.Length(), 3);
        Assert.Equal(new Vector3(0.6f, 0.8f, 0f), unit);
    }
}
