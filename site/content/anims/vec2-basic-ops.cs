using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("vec2-basic-ops")]
[AnimProfile(Controls = "mode-select", HeightScale = 1.5f, ModeOptions = "0:加法|1:减法|2:缩放")]
public sealed class Vec2BasicOps : IAnimScript
{
    private AnimContext? _ctx;
    private Vec2 _cursor;
    private int _mode;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
        _cursor = new Vec2(0.45f, 0.2f);
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
            _cursor = new Vec2(
                (_ctx.Input.X - centerX) / (_ctx.Width * 0.25f),
                (centerY - _ctx.Input.Y) / (_ctx.Height * 0.25f)
            );
        }

        if (_ctx.Input.ModeLocked)
        {
            _mode = _ctx.Input.Mode;
        }
        else
        {
            var phase = _ctx.Time % 9f;
            if (phase < 3f)
            {
                _mode = 0;
            }
            else if (phase < 6f)
            {
                _mode = 1;
            }
            else
            {
                _mode = 2;
            }
        }
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
        {
            return;
        }

        g.Clear(new Color(10, 13, 19));

        var center = new Vec2(_ctx.Width * 0.5f, _ctx.Height * 0.58f);
        var scale = MathF.Min(_ctx.Width, _ctx.Height) * 0.32f;
        var a = new Vec2(0.9f, 0.35f);
        var b = _cursor;
        var result = a;
        var label = "a + b";

        switch (_mode)
        {
            case 1:
                result = a - b;
                label = "a - b";
                break;
            case 2:
                result = a * 1.45f;
                label = "a * 1.45";
                break;
            default:
                result = a + b;
                label = "a + b";
                break;
        }

        AnimGeom.DrawAxes(g, center, scale, new Color(90, 110, 140, 210), new Color(45, 62, 88, 120));

        var aTip = AnimGeom.ToScreen(a, center, scale);
        var bTip = AnimGeom.ToScreen(b, center, scale);
        var rTip = AnimGeom.ToScreen(result, center, scale);

        AnimGeom.DrawArrow(g, center, aTip, new Color(110, 220, 255, 240), 2f, 10f);
        AnimGeom.DrawArrow(g, center, bTip, new Color(255, 150, 110, 240), 2f, 10f);
        AnimGeom.DrawArrow(g, center, rTip, new Color(150, 255, 130, 240), 2.6f, 11f);

        g.Text("Vec2 Basic Ops", new Vec2(12f, 12f), new Color(225, 235, 245, 240), 13f);
        g.Text("模式: " + label, new Vec2(12f, 30f), new Color(160, 198, 230, 220), 12f);
        g.Text("蓝: a  橙: b  绿: result", new Vec2(12f, 48f), new Color(130, 150, 175, 220), 12f);
    }

    public void OnDispose()
    {
    }
}
