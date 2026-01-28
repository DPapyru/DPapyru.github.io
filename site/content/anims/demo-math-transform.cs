using System;
using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("demo-math-transform")]
public sealed class DemoMathTransform : IAnimScript
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

        g.Clear(new Color(8, 12, 16));

        var width = _ctx.Width;
        var height = _ctx.Height;
        var center = new Vec2(width * 0.5f, height * 0.55f);
        var scale = MathF.Min(width, height) * 0.32f;

        DrawAxes(g, center, scale);

        var time = _ctx.Time;
        var angle = time * 0.7f;
        var shear = 0.35f * MathF.Sin(time * 0.6f);
        var scaleX = 1.0f + 0.18f * MathF.Sin(time * 0.4f);
        var scaleY = 1.0f - 0.16f * MathF.Sin(time * 0.55f);
        var cos = MathF.Cos(angle);
        var sin = MathF.Sin(angle);

        var m00 = cos * scaleX;
        var m01 = -sin + shear;
        var m10 = sin;
        var m11 = cos * scaleY;

        var basisX = new Vec2(m00, m10);
        var basisY = new Vec2(m01, m11);
        var vector = new Vec2(1.1f, 0.6f);
        var transformed = Mul(m00, m01, m10, m11, vector);

        DrawArrow(g, center, ToScreen(vector, center, scale), new Color(120, 200, 255), 2f, 10f);
        DrawArrow(g, center, ToScreen(transformed, center, scale), new Color(255, 150, 110), 2f, 10f);

        DrawArrow(g, center, ToScreen(basisX, center, scale), new Color(120, 255, 180), 2f, 10f);
        DrawArrow(g, center, ToScreen(basisY, center, scale), new Color(210, 180, 255), 2f, 10f);

        DrawUnitSquare(g, center, scale, m00, m01, m10, m11);
    }

    public void OnDispose()
    {
    }

    private static Vec2 ToScreen(Vec2 v, Vec2 center, float scale)
    {
        return new Vec2(center.X + v.X * scale, center.Y - v.Y * scale);
    }

    private static Vec2 Mul(float m00, float m01, float m10, float m11, Vec2 v)
    {
        return new Vec2(m00 * v.X + m01 * v.Y, m10 * v.X + m11 * v.Y);
    }

    private static void DrawAxes(ICanvas2D g, Vec2 center, float scale)
    {
        var axisColor = new Color(90, 100, 120, 200);
        var gridColor = new Color(40, 50, 70, 120);
        var axisLength = scale * 1.2f;

        g.Line(new Vec2(center.X - axisLength, center.Y), new Vec2(center.X + axisLength, center.Y), axisColor, 1.5f);
        g.Line(new Vec2(center.X, center.Y - axisLength), new Vec2(center.X, center.Y + axisLength), axisColor, 1.5f);

        for (int i = 1; i <= 4; i++)
        {
            var offset = i * scale * 0.25f;
            g.Line(new Vec2(center.X - axisLength, center.Y - offset), new Vec2(center.X + axisLength, center.Y - offset), gridColor, 1f);
            g.Line(new Vec2(center.X - axisLength, center.Y + offset), new Vec2(center.X + axisLength, center.Y + offset), gridColor, 1f);
            g.Line(new Vec2(center.X - offset, center.Y - axisLength), new Vec2(center.X - offset, center.Y + axisLength), gridColor, 1f);
            g.Line(new Vec2(center.X + offset, center.Y - axisLength), new Vec2(center.X + offset, center.Y + axisLength), gridColor, 1f);
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

    private static void DrawUnitSquare(ICanvas2D g, Vec2 center, float scale, float m00, float m01, float m10, float m11)
    {
        var edgeColor = new Color(90, 170, 255, 150);
        var points = new[]
        {
            new Vec2(0f, 0f),
            new Vec2(1f, 0f),
            new Vec2(1f, 1f),
            new Vec2(0f, 1f)
        };

        var transformed = new Vec2[points.Length];
        for (int i = 0; i < points.Length; i++)
        {
            transformed[i] = Mul(m00, m01, m10, m11, points[i]);
        }

        for (int i = 0; i < transformed.Length; i++)
        {
            var a = ToScreen(transformed[i], center, scale);
            var b = ToScreen(transformed[(i + 1) % transformed.Length], center, scale);
            g.Line(a, b, edgeColor, 1.3f);
        }
    }
}
