using AnimRuntime;
using AnimRuntime.Math;

namespace AnimScripts.Dev;

[AnimEntry("vector-basic")]
public sealed class VectorBasic : IAnimScript
{
    private AnimContext? _ctx;
    private Vec2 _mousePos;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
    }

    public void OnUpdate(float dt)
    {
        if (_ctx is null)
            return;

        if (_ctx.Input.IsInside)
            _mousePos = new Vec2(_ctx.Input.X, _ctx.Input.Y);
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
            return;
        g.Clear(new Color(8, 12, 16));
        var width = _ctx.Width;
        var height = _ctx.Height;
        var center = new Vec2(width * 0.5f, height * 0.5f);
        var scale = MathF.Min(width, height) * 0.52f;
        var vec2 = new Vec2(0.3f, 0.5f);

        if (_mousePos.X != 0 || _mousePos.Y != 0)
            vec2 = new Vec2((_mousePos.X - center.X) / width * 4, -(_mousePos.Y - center.Y) / height * 2);

        DrawAxes(g, center, scale);

        DrawArrow(g, center, ToScreen(vec2, center, scale), new Color(255, 255, 255, 200), 2f, 10);
    }

    public void OnDispose()
    {
    }

    private static Vec2 ToScreen(Vec2 v, Vec2 center, float scale)
    {
        return new Vec2(center.X + v.X * scale, center.Y - v.Y * scale);
    }

    private static void DrawAxes(ICanvas2D g, Vec2 center, float scale)
    {
        var axisColor = new Color(90, 100, 120, 200);
        var gridColor = new Color(40, 50, 70, 120);
        var axisLength = scale * 1.2f;

        g.Line(new Vec2(center.X - axisLength, center.Y), new Vec2(center.X + axisLength, center.Y), axisColor, 1.5f
        );
        g.Line(new Vec2(center.X, center.Y - axisLength), new Vec2(center.X, center.Y + axisLength), axisColor, 1.5f
        );

        for (int i = 1; i <= 4; i++)
        {
            var offset = i * scale * 0.25f;
            g.Line(new Vec2(center.X - axisLength, center.Y - offset),
                new Vec2(center.X + axisLength, center.Y - offset), gridColor, 1f
            );
            g.Line(new Vec2(center.X - axisLength, center.Y + offset),
                new Vec2(center.X + axisLength, center.Y + offset), gridColor, 1f
            );
            g.Line(new Vec2(center.X - offset, center.Y - axisLength),
                new Vec2(center.X - offset, center.Y + axisLength), gridColor, 1f
            );
            g.Line(new Vec2(center.X + offset, center.Y - axisLength),
                new Vec2(center.X + offset, center.Y + axisLength), gridColor, 1f
            );
        }
    }

    private static void DrawArrow(ICanvas2D g, Vec2 from, Vec2 to, Color color, float width, float headSize)
    {
        g.Line(from, to, color, width);

        var dir = new Vec2(to.X - from.X, to.Y - from.Y);
        var len = MathF.Sqrt(dir.X * dir.X + dir.Y * dir.Y);
        if (len <= 0.001f)
        {
            return;
        }

        var ux = dir.X / len;
        var uy = dir.Y / len;
        var left = new Vec2(-uy, ux);

        var basePoint = new Vec2(to.X - ux * headSize, to.Y - uy * headSize);
        var leftPoint = new Vec2(basePoint.X + left.X * headSize * 0.55f, basePoint.Y + left.Y * headSize * 0.55f);
        var rightPoint = new Vec2(basePoint.X - left.X * headSize * 0.55f, basePoint.Y - left.Y * headSize * 0.55f);

        g.Line(to, leftPoint, color, width);
        g.Line(to, rightPoint, color, width);
    }
}