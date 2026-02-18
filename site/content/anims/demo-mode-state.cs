using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("demo-mode-state")]
[AnimProfile(Controls = "mode-select", HeightScale = 1.25f, ModeOptions = "0:自动|1:静止|2:顺时针|3:逆时针")]
public sealed class DemoModeState : IAnimScript
{
    private AnimContext? _ctx;
    private float _angle;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
        _angle = 0f;
    }

    public void OnUpdate(float dt)
    {
        if (_ctx is null)
        {
            return;
        }

        var speed = MathF.Sin(_ctx.Time * 0.9f) * 1.4f;
        if (_ctx.Input.ModeLocked)
        {
            if (_ctx.Input.Mode == 1)
            {
                speed = 0f;
            }
            else if (_ctx.Input.Mode == 2)
            {
                speed = 1.8f;
            }
            else if (_ctx.Input.Mode == 3)
            {
                speed = -1.8f;
            }
        }

        _angle += speed * dt;
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
        {
            return;
        }

        g.Clear(new Color(8, 12, 16));

        var width = _ctx.Width;
        var height = _ctx.Height;
        var center = new Vec2(width * 0.5f, height * 0.58f);
        var scale = MathF.Min(width, height) * 0.32f;

        AnimGeom.DrawAxes(g, center, scale);

        var vector = new Vec2(MathF.Cos(_angle) * 0.95f, MathF.Sin(_angle) * 0.95f);
        var tip = AnimGeom.ToScreen(vector, center, scale);

        AnimGeom.DrawArrow(g, center, tip, new Color(120, 200, 255, 230), 2f, 11f);
        g.Circle(center, scale, new Color(90, 120, 150, 120), 1f);
        g.FillCircle(tip, 5f, new Color(255, 185, 115, 230));
    }

    public void OnDispose()
    {
    }
}
