using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("animgeom-toolkit-recipes")]
[AnimProfile(Controls = "mode-select", HeightScale = 1.55f, ModeOptions = "0:坐标轴+箭头|1:轨迹采样")]
public sealed class AnimgeomToolkitRecipes : IAnimScript
{
    private AnimContext? _ctx;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
    }

    public void OnUpdate(float dt)
    {
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
        {
            return;
        }

        g.Clear(new Color(10, 13, 19));

        var center = new Vec2(_ctx.Width * 0.5f, _ctx.Height * 0.58f);
        var scale = MathF.Min(_ctx.Width, _ctx.Height) * 0.33f;

        AnimGeom.DrawAxes(g, center, scale, new Color(90, 110, 140, 210), new Color(48, 64, 90, 130));

        var mode = _ctx.Input.ModeLocked ? _ctx.Input.Mode : 0;
        if (mode == 1)
        {
            DrawOrbitSamples(g, center, scale);
        }
        else
        {
            DrawArrowRecipes(g, center, scale);
        }

        g.Text("AnimGeom Toolkit Recipes", new Vec2(12f, 12f), new Color(225, 235, 245, 235), 13f);
        g.Text(mode == 1 ? "模式: 轨迹采样" : "模式: 坐标轴+箭头", new Vec2(12f, 30f), new Color(155, 190, 225, 220), 12f);
        g.Text("演示 ToScreen / DrawAxes / DrawArrow 常见组合", new Vec2(12f, 48f), new Color(130, 150, 175, 220), 12f);
    }

    public void OnDispose()
    {
    }

    private void DrawArrowRecipes(ICanvas2D g, Vec2 center, float scale)
    {
        var t = _ctx is null ? 0f : _ctx.Time;
        var vectors = new[]
        {
            new Vec2(MathF.Cos(t * 0.8f) * 1.1f, MathF.Sin(t * 0.8f) * 0.7f),
            new Vec2(MathF.Cos(t * 1.1f + 1.3f) * 0.8f, MathF.Sin(t * 1.1f + 1.3f) * 1.0f),
            new Vec2(MathF.Cos(t * 1.5f + 2.4f) * 0.6f, MathF.Sin(t * 1.5f + 2.4f) * 0.55f)
        };
        var colors = new[]
        {
            new Color(115, 220, 255, 240),
            new Color(255, 170, 115, 230),
            new Color(145, 255, 140, 230)
        };

        var index = 0;
        foreach (var v in vectors)
        {
            var tip = AnimGeom.ToScreen(v, center, scale);
            AnimGeom.DrawArrow(g, center, tip, colors[index], 2f, 10f);
            index += 1;
        }
    }

    private void DrawOrbitSamples(ICanvas2D g, Vec2 center, float scale)
    {
        if (_ctx is null)
        {
            return;
        }

        var i = 0;
        while (i < 20)
        {
            var t = _ctx.Time - i * 0.12f;
            var p = new Vec2(MathF.Cos(t) * 1.1f, MathF.Sin(t * 1.4f) * 0.6f);
            var screen = AnimGeom.ToScreen(p, center, scale);
            var alpha = MathF.Max(60f, 240f - i * 9f);
            g.FillCircle(screen, 3.2f, new Color(120, 200, 255, (int)alpha));
            i += 1;
        }

        var current = new Vec2(MathF.Cos(_ctx.Time) * 1.1f, MathF.Sin(_ctx.Time * 1.4f) * 0.6f);
        var currentScreen = AnimGeom.ToScreen(current, center, scale);
        AnimGeom.DrawArrow(g, center, currentScreen, new Color(255, 190, 120, 240), 2.1f, 10f);
    }
}
