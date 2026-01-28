using AnimRuntime;
using Xunit;

namespace AnimRuntime.Tests;

public sealed class AnimEntryTests
{
    [Fact]
    public void AnimEntryAttribute_ShouldExposeName()
    {
        var attr = new AnimEntryAttribute("demo");
        Assert.Equal("demo", attr.Name);
    }
}
