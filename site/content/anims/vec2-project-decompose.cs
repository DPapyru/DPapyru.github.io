using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("vec2-project-decompose")]
[AnimProfile(Controls = "mode-select", HeightScale = 1.55f, ModeOptions = "0:投影|1:分解")]
public sealed class Vec2ProjectDecompose : IAnimScript
{
    private AnimContext? _ctx;
    private Vec2 _vector;
    private int _mode;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
        _vector = new Vec2(0.95f, 0.6f);
        _mode = 0;
    }

    public void OnUpdate(float dt)
    {
        if (_ctx is null)
        {
            return;
        }

        if (_ctx.Input.IsInside)
        {
            var centerX = _ctx.Width * 0.5f;
            var centerY = _ctx.Height * 0.58f;
            _vector = new Vec2(
                (_ctx.Input.X - centerX) / (_ctx.Width * 0.25f),
                (centerY - _ctx.Input.Y) / (_ctx.Height * 0.25f)
            );
        }

        _mode = _ctx.Input.ModeLocked ? _ctx.Input.Mode : 0;
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
        {
            return;
        }

        g.Clear(new Color(8, 12, 18));

        var center = new Vec2(_ctx.Width * 0.5f, _ctx.Height * 0.58f);
        var scale = MathF.Min(_ctx.Width, _ctx.Height) * 0.33f;
        var axis = new Vec2(MathF.Cos(_ctx.Time * 0.55f), MathF.Sin(_ctx.Time * 0.55f));
        var axisLen = MathF.Sqrt(axis.X * axis.X + axis.Y * axis.Y);
        if (axisLen > 0.0001f)
        {
            axis = axis / axisLen;
        }

        var dot = _vector.X * axis.X + _vector.Y * axis.Y;
        var proj = axis * dot;
        var rej = _vector - proj;

        AnimGeom.DrawAxes(g, center, scale, new Color(88, 104, 130, 220), new Color(45, 58, 82, 130));

        var axisTipA = AnimGeom.ToScreen(axis * 1.4f, center, scale);
        var axisTipB = AnimGeom.ToScreen(axis * -1.4f, center, scale);
        g.Line(axisTipA, axisTipB, new Color(150, 175, 220, 190), 1.6f);

        AnimGeom.DrawArrow(g, center, AnimGeom.ToScreen(_vector, center, scale), new Color(118, 225, 255, 230), 2.2f, 10f);
        AnimGeom.DrawArrow(g, center, AnimGeom.ToScreen(proj, center, scale), new Color(255, 205, 120, 230), 2f, 9f);

        if (_mode == 1)
        {
            AnimGeom.DrawArrow(g, AnimGeom.ToScreen(proj, center, scale), AnimGeom.ToScreen(_vector, center, scale), new Color(255, 132, 132, 230), 2f, 9f);
        }

        g.Text("Vec2 Projection & Decompose", new Vec2(12f, 12f), new Color(225, 235, 245, 240), 13f);
        g.Text(_mode == 1 ? "分解: v = proj + rej" : "投影: proj(v, axis)", new Vec2(12f, 30f), new Color(155, 190, 225, 220), 12f);
        g.Text("白线: axis  蓝: v  黄: proj" + (_mode == 1 ? "  红: rej" : ""), new Vec2(12f, 48f), new Color(130, 150, 175, 220), 12f);
    }

    public void OnDispose()
    {
    }
}
