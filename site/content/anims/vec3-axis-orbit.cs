using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("vec3-axis-orbit")]
[AnimProfile(HeightScale = 1.9f)]
public sealed class Vec3AxisOrbit : IAnimScript
{
    private AnimContext? _ctx;
    private float _yaw;
    private float _pitch;
    private float _zoom;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
        _yaw = 0.7f;
        _pitch = 0.35f;
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
            _yaw += _ctx.Input.DeltaX * 0.012f;
            _pitch -= _ctx.Input.DeltaY * 0.012f;
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
        var center = new Vec2(width * 0.5f, height * 0.56f);
        var scale = MathF.Min(width, height) * 0.34f * _zoom;
        var view = Mat4.RotationY(_yaw) * Mat4.RotationX(_pitch);

        var gridColor = new Color(48, 70, 94, 120);
        for (int i = -4; i <= 4; i++)
        {
            var t = i * 0.25f;
            DrawSegment3(g, view * new Vec3(t, 0f, -1f), view * new Vec3(t, 0f, 1f), gridColor, 1f, center, scale);
            DrawSegment3(g, view * new Vec3(-1f, 0f, t), view * new Vec3(1f, 0f, t), gridColor, 1f, center, scale);
        }

        DrawArrow3(g, view * new Vec3(0f, 0f, 0f), view * new Vec3(1.2f, 0f, 0f), new Color(255, 110, 110, 240), 2f, center, scale);
        DrawArrow3(g, view * new Vec3(0f, 0f, 0f), view * new Vec3(0f, 1.2f, 0f), new Color(120, 255, 140, 240), 2f, center, scale);
        DrawArrow3(g, view * new Vec3(0f, 0f, 0f), view * new Vec3(0f, 0f, 1.2f), new Color(120, 170, 255, 240), 2f, center, scale);

        g.Text("X", Project(view * new Vec3(1.35f, 0f, 0f), center, scale), new Color(255, 140, 140), 14f);
        g.Text("Y", Project(view * new Vec3(0f, 1.35f, 0f), center, scale), new Color(150, 255, 170), 14f);
        g.Text("Z", Project(view * new Vec3(0f, 0f, 1.35f), center, scale), new Color(150, 190, 255), 14f);

        g.Text("右手系 3D 坐标轴（拖拽旋转，滚轮缩放）", new Vec2(12f, 12f), new Color(220, 230, 240, 220), 13f);
        g.Text("yaw=" + Fmt(_yaw) + "  pitch=" + Fmt(_pitch) + "  zoom=" + Fmt(_zoom), new Vec2(12f, 30f), new Color(155, 195, 230, 210), 12f);
    }

    public void OnDispose()
    {
    }

    private static string Fmt(float value)
    {
        return (MathF.Round(value * 100f) / 100f).ToString();
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
