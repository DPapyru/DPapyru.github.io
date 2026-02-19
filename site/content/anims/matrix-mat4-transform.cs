using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("matrix-mat4-transform")]
[AnimProfile(Controls = "mode-select", HeightScale = 2.05f, ModeOptions = "0:复合|1:平移|2:旋转|3:缩放")]
public sealed class MatrixMat4Transform : IAnimScript
{
    private AnimContext? _ctx;
    private float _yaw;
    private float _pitch;
    private float _zoom;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
        _yaw = 0.85f;
        _pitch = 0.45f;
        _zoom = 1f;
    }

    public void OnUpdate(float dt)
    {
        if (_ctx is null)
        {
            return;
        }

        if (_ctx.Input.IsInside && _ctx.Input.IsDown)
        {
            _yaw += _ctx.Input.DeltaX * 0.011f;
            _pitch -= _ctx.Input.DeltaY * 0.011f;
            _pitch = MathF.Max(-1.2f, MathF.Min(1.2f, _pitch));
        }

        _zoom += _ctx.Input.WheelDelta * 0.08f;
        _zoom = MathF.Max(0.35f, MathF.Min(3f, _zoom));
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
        {
            return;
        }

        g.Clear(new Color(9, 13, 20));

        var width = _ctx.Width;
        var height = _ctx.Height;
        var center = new Vec2(width * 0.5f, height * 0.58f);
        var scale = MathF.Min(width, height) * 0.32f * _zoom;

        var mode = 0;
        if (_ctx.Input.ModeLocked)
        {
            mode = _ctx.Input.Mode;
        }

        var time = _ctx.Time;
        var translate = Mat4.Translation(0.35f + 0.25f * MathF.Sin(time * 0.8f), 0.18f * MathF.Cos(time * 0.65f), 0f);
        var rotate = Mat4.RotationZ(time * 0.9f) * Mat4.RotationX(0.55f);
        var scaling = Mat4.Scale(0.75f + 0.3f * MathF.Sin(time * 0.75f), 0.7f + 0.35f * MathF.Cos(time * 0.6f), 0.9f);

        var model = translate * rotate * scaling;
        if (mode == 1)
        {
            model = translate;
        }
        else if (mode == 2)
        {
            model = rotate;
        }
        else if (mode == 3)
        {
            model = scaling;
        }

        var view = Mat4.RotationY(_yaw) * Mat4.RotationX(_pitch);
        var world = view * model;

        DrawArrow3(g, view * new Vec3(0f, 0f, 0f), view * new Vec3(1.2f, 0f, 0f), new Color(255, 110, 110, 220), 1.8f, center, scale);
        DrawArrow3(g, view * new Vec3(0f, 0f, 0f), view * new Vec3(0f, 1.2f, 0f), new Color(120, 255, 140, 220), 1.8f, center, scale);
        DrawArrow3(g, view * new Vec3(0f, 0f, 0f), view * new Vec3(0f, 0f, 1.2f), new Color(120, 170, 255, 220), 1.8f, center, scale);

        DrawCube(g, view, new Color(85, 115, 145, 120), 1f, center, scale);
        DrawCube(g, world, new Color(255, 170, 105, 220), 1.8f, center, scale);

        var vecOrigin = view * new Vec3(0f, 0f, 0f);
        var vecTarget = world * new Vec3(0.7f, 0.35f, 0.25f);
        DrawArrow3(g, vecOrigin, vecTarget, new Color(255, 220, 120, 230), 2f, center, scale);

        DrawMatrixText(g, model, mode);
    }

    public void OnDispose()
    {
    }

    private static void DrawMatrixText(ICanvas2D g, Mat4 m, int mode)
    {
        g.Text("Mat4 变换（模式：" + ModeName(mode) + "）", new Vec2(12f, 12f), new Color(220, 230, 245, 220), 13f);
        g.Text("拖拽旋转视角，滚轮缩放；mode-select 可切换矩阵类型", new Vec2(12f, 30f), new Color(140, 185, 228, 210), 12f);

        g.Text("[" + Fmt(m.M00) + "  " + Fmt(m.M01) + "  " + Fmt(m.M02) + "  " + Fmt(m.M03) + "]", new Vec2(12f, 52f), new Color(255, 210, 150, 220), 12f);
        g.Text("[" + Fmt(m.M10) + "  " + Fmt(m.M11) + "  " + Fmt(m.M12) + "  " + Fmt(m.M13) + "]", new Vec2(12f, 68f), new Color(255, 210, 150, 220), 12f);
        g.Text("[" + Fmt(m.M20) + "  " + Fmt(m.M21) + "  " + Fmt(m.M22) + "  " + Fmt(m.M23) + "]", new Vec2(12f, 84f), new Color(255, 210, 150, 220), 12f);
        g.Text("[" + Fmt(m.M30) + "  " + Fmt(m.M31) + "  " + Fmt(m.M32) + "  " + Fmt(m.M33) + "]", new Vec2(12f, 100f), new Color(255, 210, 150, 220), 12f);
    }

    private static string ModeName(int mode)
    {
        if (mode == 1)
        {
            return "平移";
        }

        if (mode == 2)
        {
            return "旋转";
        }

        if (mode == 3)
        {
            return "缩放";
        }

        return "复合";
    }

    private static string Fmt(float value)
    {
        return (MathF.Round(value * 100f) / 100f).ToString();
    }

    private static void DrawCube(ICanvas2D g, Mat4 m, Color color, float width, Vec2 center, float scale)
    {
        var p000 = m * new Vec3(-0.5f, -0.5f, -0.5f);
        var p001 = m * new Vec3(-0.5f, -0.5f, 0.5f);
        var p010 = m * new Vec3(-0.5f, 0.5f, -0.5f);
        var p011 = m * new Vec3(-0.5f, 0.5f, 0.5f);
        var p100 = m * new Vec3(0.5f, -0.5f, -0.5f);
        var p101 = m * new Vec3(0.5f, -0.5f, 0.5f);
        var p110 = m * new Vec3(0.5f, 0.5f, -0.5f);
        var p111 = m * new Vec3(0.5f, 0.5f, 0.5f);

        DrawSegment3(g, p000, p001, color, width, center, scale);
        DrawSegment3(g, p000, p010, color, width, center, scale);
        DrawSegment3(g, p000, p100, color, width, center, scale);

        DrawSegment3(g, p111, p110, color, width, center, scale);
        DrawSegment3(g, p111, p101, color, width, center, scale);
        DrawSegment3(g, p111, p011, color, width, center, scale);

        DrawSegment3(g, p001, p011, color, width, center, scale);
        DrawSegment3(g, p001, p101, color, width, center, scale);

        DrawSegment3(g, p010, p011, color, width, center, scale);
        DrawSegment3(g, p010, p110, color, width, center, scale);

        DrawSegment3(g, p100, p101, color, width, center, scale);
        DrawSegment3(g, p100, p110, color, width, center, scale);
    }

    private static void DrawSegment3(ICanvas2D g, Vec3 from, Vec3 to, Color color, float width, Vec2 center, float scale)
    {
        g.Line(Project(from, center, scale), Project(to, center, scale), color, width);
    }

    private static void DrawArrow3(ICanvas2D g, Vec3 from, Vec3 to, Color color, float width, Vec2 center, float scale)
    {
        DrawArrow2(g, Project(from, center, scale), Project(to, center, scale), color, width, 10f);
    }

    private static void DrawArrow2(ICanvas2D g, Vec2 from, Vec2 to, Color color, float width, float headSize)
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

    private static Vec2 Project(Vec3 v, Vec2 center, float scale)
    {
        var depth = 2.8f + v.Z;
        if (depth < 0.25f)
        {
            depth = 0.25f;
        }

        return new Vec2(
            center.X + v.X * scale / depth,
            center.Y - v.Y * scale / depth
        );
    }
}
