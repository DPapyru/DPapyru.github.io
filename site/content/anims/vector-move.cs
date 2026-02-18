using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("vector_move")]
[AnimProfile(Controls = "mode-select", HeightScale = 1.5f)]
public sealed class vector_move : IAnimScript
{
    private AnimContext? _ctx;
    public void OnDispose()
    {
    }

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
            return;

        g.Clear(new Color(8, 12, 16));

        var width = _ctx.Width;
        var height = _ctx.Height;
        var center = new Vec2(width * 0.5f, height * 0.55f);
        var scale = MathF.Min(width, height) * 0.32f;

        AnimGeom.DrawAxes(g,center,scale);
    }

    public void OnUpdate(float dt)
    {
        if (_ctx is null)
            return;
    }
}