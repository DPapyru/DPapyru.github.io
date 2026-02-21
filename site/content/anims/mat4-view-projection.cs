using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("mat4-view-projection")]
[AnimProfile(Controls = "mode-select", HeightScale = 2.0f, ModeOptions = "0:透视+视图|1:仅视图")]
public sealed class Mat4ViewProjection : IAnimScript
{
    private AnimContext? _ctx;
    private float _yaw;
    private float _pitch;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
        _yaw = 0.55f;
        _pitch = 0.25f;
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
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
        {
            return;
        }

        g.Clear(new Color(9, 12, 18));

        var center = new Vec2(_ctx.Width * 0.5f, _ctx.Height * 0.58f);
        var scale = MathF.Min(_ctx.Width, _ctx.Height) * 0.34f;
        var aspect = _ctx.Width / MathF.Max(1f, _ctx.Height);

        var view = Mat4.RotationY(_yaw) * Mat4.RotationX(_pitch) * Mat4.Translation(0f, 0f, 2.8f);
        var projection = Mat4.PerspectiveFovRh(1.05f, aspect, 0.1f, 10f);
        var vp = projection * view;

        var useProjection = !_ctx.Input.ModeLocked || _ctx.Input.Mode != 1;
        var m = useProjection ? vp : view;

        DrawGrid(g, m, center, scale);
        DrawCube(g, m, center, scale, new Color(255, 180, 110, 220), 1.9f);
        DrawAxis(g, m, center, scale);

        g.Text("Mat4 View + Projection", new Vec2(12f, 12f), new Color(225, 235, 245, 220), 13f);
        g.Text(useProjection ? "模式: 透视+视图" : "模式: 仅视图", new Vec2(12f, 30f), new Color(150, 188, 224, 220), 12f);
        g.Text("拖拽旋转视角，mode-select 可切换", new Vec2(12f, 48f), new Color(130, 150, 175, 220), 12f);
    }

    public void OnDispose()
    {
    }

    private static void DrawGrid(ICanvas2D g, Mat4 m, Vec2 center, float scale)
    {
        var i = -4;
        while (i <= 4)
        {
            var t = i * 0.25f;
            DrawSegment(g, m * new Vec3(t, 0f, -1f), m * new Vec3(t, 0f, 1f), center, scale, new Color(52, 70, 95, 120), 1f);
            DrawSegment(g, m * new Vec3(-1f, 0f, t), m * new Vec3(1f, 0f, t), center, scale, new Color(52, 70, 95, 120), 1f);
            i += 1;
        }
    }

    private static void DrawAxis(ICanvas2D g, Mat4 m, Vec2 center, float scale)
    {
        DrawArrow(g, m * new Vec3(0f, 0f, 0f), m * new Vec3(1.1f, 0f, 0f), center, scale, new Color(255, 112, 112, 230), 2f);
        DrawArrow(g, m * new Vec3(0f, 0f, 0f), m * new Vec3(0f, 1.1f, 0f), center, scale, new Color(125, 255, 145, 230), 2f);
        DrawArrow(g, m * new Vec3(0f, 0f, 0f), m * new Vec3(0f, 0f, 1.1f), center, scale, new Color(130, 176, 255, 230), 2f);
    }

    private static void DrawCube(ICanvas2D g, Mat4 m, Vec2 center, float scale, Color color, float width)
    {
        var p000 = m * new Vec3(-0.5f, -0.5f, -0.5f);
        var p001 = m * new Vec3(-0.5f, -0.5f, 0.5f);
        var p010 = m * new Vec3(-0.5f, 0.5f, -0.5f);
        var p011 = m * new Vec3(-0.5f, 0.5f, 0.5f);
        var p100 = m * new Vec3(0.5f, -0.5f, -0.5f);
        var p101 = m * new Vec3(0.5f, -0.5f, 0.5f);
        var p110 = m * new Vec3(0.5f, 0.5f, -0.5f);
        var p111 = m * new Vec3(0.5f, 0.5f, 0.5f);

        var edges = new[]
        {
            new[] { p000, p001 },
            new[] { p000, p010 },
            new[] { p000, p100 },
            new[] { p111, p110 },
            new[] { p111, p101 },
            new[] { p111, p011 },
            new[] { p001, p011 },
            new[] { p001, p101 },
            new[] { p010, p011 },
            new[] { p010, p110 },
            new[] { p100, p101 },
            new[] { p100, p110 }
        };

        foreach (var edge in edges)
        {
            DrawSegment(g, edge[0], edge[1], center, scale, color, width);
        }
    }

    private static void DrawSegment(ICanvas2D g, Vec3 from, Vec3 to, Vec2 center, float scale, Color color, float width)
    {
        g.Line(Project(from, center, scale), Project(to, center, scale), color, width);
    }

    private static void DrawArrow(ICanvas2D g, Vec3 from, Vec3 to, Vec2 center, float scale, Color color, float width)
    {
        var from2 = Project(from, center, scale);
        var to2 = Project(to, center, scale);
        AnimGeom.DrawArrow(g, from2, to2, color, width, 10f);
    }

    private static Vec2 Project(Vec3 v, Vec2 center, float scale)
    {
        var depth = 2.8f + v.Z;
        if (depth < 0.2f)
        {
            depth = 0.2f;
        }

        return new Vec2(
            center.X + v.X * scale / depth,
            center.Y - v.Y * scale / depth
        );
    }
}
