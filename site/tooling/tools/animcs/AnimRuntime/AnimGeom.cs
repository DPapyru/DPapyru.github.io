using Microsoft.Xna.Framework;

namespace AnimRuntime;

public static class AnimGeom
{
    public static Vector2 ToScreen(Vector2 v, Vector2 center, float scale)
    {
        return new Vector2(center.X + v.X * scale, center.Y - v.Y * scale);
    }

    public static void DrawAxes(ICanvas2D g, Vector2 center, float scale, Color? axisColor = null, Color? gridColor = null)
    {
        var useAxis = axisColor ?? new Color(90, 100, 120, 200);
        var useGrid = gridColor ?? new Color(40, 50, 70, 120);
        var axisLength = scale * 1.2f;

        g.Line(new Vector2(center.X - axisLength, center.Y), new Vector2(center.X + axisLength, center.Y), useAxis, 1.5f);
        g.Line(new Vector2(center.X, center.Y - axisLength), new Vector2(center.X, center.Y + axisLength), useAxis, 1.5f);

        for (int i = 1; i <= 4; i++)
        {
            var offset = i * scale * 0.25f;
            g.Line(new Vector2(center.X - axisLength, center.Y - offset), new Vector2(center.X + axisLength, center.Y - offset), useGrid, 1f);
            g.Line(new Vector2(center.X - axisLength, center.Y + offset), new Vector2(center.X + axisLength, center.Y + offset), useGrid, 1f);
            g.Line(new Vector2(center.X - offset, center.Y - axisLength), new Vector2(center.X - offset, center.Y + axisLength), useGrid, 1f);
            g.Line(new Vector2(center.X + offset, center.Y - axisLength), new Vector2(center.X + offset, center.Y + axisLength), useGrid, 1f);
        }
    }

    public static void DrawArrow(ICanvas2D g, Vector2 from, Vector2 to, Color color, float width = 1f, float headSize = 8f)
    {
        g.Line(from, to, color, width);

        var dir = new Vector2(to.X - from.X, to.Y - from.Y);
        var len = MathF.Sqrt(dir.X * dir.X + dir.Y * dir.Y);
        if (len <= 0.001f)
        {
            return;
        }

        var ux = dir.X / len;
        var uy = dir.Y / len;
        var left = new Vector2(-uy, ux);

        var basePoint = new Vector2(to.X - ux * headSize, to.Y - uy * headSize);
        var leftPoint = new Vector2(basePoint.X + left.X * headSize * 0.55f, basePoint.Y + left.Y * headSize * 0.55f);
        var rightPoint = new Vector2(basePoint.X - left.X * headSize * 0.55f, basePoint.Y - left.Y * headSize * 0.55f);

        g.Line(to, leftPoint, color, width);
        g.Line(to, rightPoint, color, width);
    }
}
