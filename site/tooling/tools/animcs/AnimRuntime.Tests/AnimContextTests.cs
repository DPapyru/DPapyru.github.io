using AnimRuntime;
using Xunit;

public sealed class AnimContextTests
{
    [Fact]
    public void Update_ShouldAdvanceTime_AndApplySize()
    {
        var ctx = new AnimContext();
        ctx.Update(0.5f, 320, 200);
        Assert.Equal(0.5f, ctx.Time);
        Assert.Equal(320, ctx.Width);
        Assert.Equal(200, ctx.Height);
    }
}
