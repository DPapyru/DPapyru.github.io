using AnimRuntime.Math;
using Xunit;

namespace AnimRuntime.Tests;

public sealed class Vec2Tests
{
    [Fact]
    public void Vec2_Add_Works()
    {
        var a = new Vec2(1, 2);
        var b = new Vec2(3, 4);
        var c = a + b;
        Assert.Equal(new Vec2(4, 6), c);
    }
}
