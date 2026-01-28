using System.Reflection;
using AnimHost;
using AnimRuntime;
using Xunit;

[AnimEntry("dummy")]
public sealed class DummyAnim : IAnimScript
{
    public void OnInit(AnimContext ctx) { }
    public void OnUpdate(float dt) { }
    public void OnRender(ICanvas2D g) { }
    public void OnDispose() { }
}

public sealed class AnimHostExportsTests
{
    [Fact]
    public void LoadAndCreate_CanInstantiateAnimEntry()
    {
        var bytes = File.ReadAllBytes(Assembly.GetExecutingAssembly().Location);
        var handle = AnimHostExports.LoadAndCreate("tests", bytes, "dummy", 100, 80, 1);
        Assert.True(handle > 0);
        AnimHostExports.Update(handle, 0.016f, 100, 80);
        AnimHostExports.Dispose(handle);
    }
}
