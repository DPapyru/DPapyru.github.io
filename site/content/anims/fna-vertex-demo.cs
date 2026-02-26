using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("fna-vertex-demo")]
public sealed class FnaVertexDemo : IAnimScript
{
    private readonly VertexPositionColorTexture[] _vertices = new VertexPositionColorTexture[3];
    private readonly int[] _indices = new[] { 0, 1, 2 };
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

        g.Clear(new Color(8, 12, 18));

        var width = _ctx.Width;
        var height = _ctx.Height;
        var centerX = width * 0.5f;
        var centerY = height * 0.55f;
        var radius = MathF.Min(width, height) * 0.24f;
        var spin = _ctx.Time * 0.9f;

        _vertices[0] = BuildVertex(centerX, centerY, radius, spin + 0f, new Color(255, 120, 120, 235), new Vec2(0f, 0f));
        _vertices[1] = BuildVertex(centerX, centerY, radius, spin + 2.0943952f, new Color(120, 255, 170, 235), new Vec2(1f, 0f));
        _vertices[2] = BuildVertex(centerX, centerY, radius, spin + 4.1887903f, new Color(120, 170, 255, 235), new Vec2(0.5f, 1f));

        g.UseEffect("anims/shaders/fna-vertex-demo.fx");
        g.SetBlendMode(BlendMode.AlphaBlend);
        g.SetFloat("uPulse", 0.5f + 0.5f * MathF.Sin(_ctx.Time * 2f));
        g.SetVec2("uCenter", new Vec2(centerX, centerY));
        g.SetColor("uTint", new Color(130, 220, 255, 255));
        g.DrawUserIndexedPrimitives(
            PrimitiveType.TriangleList,
            _vertices,
            0,
            _vertices.Length,
            _indices,
            0,
            1
        );
        g.ClearEffect();

        g.Text("FNA Vertex + FX Demo", new Vec2(12f, 12f), new Color(224, 234, 248, 240), 13f);
    }

    public void OnDispose()
    {
    }

    private static VertexPositionColorTexture BuildVertex(float cx, float cy, float radius, float radians, Color color, Vec2 uv)
    {
        var x = cx + MathF.Cos(radians) * radius;
        var y = cy + MathF.Sin(radians) * radius;
        return new VertexPositionColorTexture(
            new Vec3(x, y, 0f),
            color,
            uv
        );
    }
}
