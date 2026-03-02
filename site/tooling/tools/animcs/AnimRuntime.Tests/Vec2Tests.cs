using Microsoft.Xna.Framework;
using Xunit;

namespace AnimRuntime.Tests;

public sealed class Vec2Tests
{
    [Fact]
    public void Vec2_Add_Works()
    {
        var a = new Vector2(1, 2);
        var b = new Vector2(3, 4);
        var c = a + b;
        Assert.Equal(new Vector2(4, 6), c);
    }
}
