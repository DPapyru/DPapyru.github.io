using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("demo-basic")]
public sealed class DemoBasic : IAnimScript
{
    public void OnInit(AnimContext ctx)
    {
    }

    public void OnUpdate(float dt)
    {
    }

    public void OnRender(ICanvas2D g)
    {
        g.Clear(new Color(8, 12, 16));
    }

    public void OnDispose()
    {
    }
}
