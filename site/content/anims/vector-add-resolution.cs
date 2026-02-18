using AnimRuntime;
using AnimRuntime.Math;

namespace AnimScripts.Dev;

// 向量的加法和分解说明
[AnimEntry("vector_add_resolution")]
[AnimProfile(HeightScale = 3f)]
public sealed class vector_add_resolution : IAnimScript
{
    private AnimContext? _ctx;
    private Vec2 _mousePos;
    private Vec2 _center;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
    }

    public void OnUpdate(float dt)
    {
        if (_ctx is null)
            return;

        // 如果在范围内按下左键
        if (_ctx.Input.IsInside && _ctx.Input.WasPressed)
            _mousePos = new Vec2(_ctx.Input.X, _ctx.Input.Y);
        
        if (_mousePos.X != 0 || _mousePos.Y != 0)
            _center = new Vec2((_mousePos.X * 0.2f + _center.X * 1.8f) * 0.5f,(_mousePos.Y * 0.2f + _center.Y * 1.8f) * 0.5f); 
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
            return;
        // 定义内容 
        g.Clear(new Color(8, 12, 16));
        var width = _ctx.Width;
        var height = _ctx.Height;
        var center = new Vec2(width * 0.5f, height * 0.5f);
        var scale = MathF.Min(width, height) * 0.52f;
        var vec2 = new Vec2(0.3f, 0.5f);

        if (_center.X != 0 || _center.Y != 0)
            vec2 = new Vec2((_center.X - center.X) / width * 4, -(_center.Y - center.Y) / height * 2);
        // 绘制坐标系
        DrawAxes(g, center, scale);

        var center_x = new Vec2(center.X, center.Y - vec2.Y * height / 2);
        var center_y = new Vec2(center.X + vec2.X * width / 4, center.Y);
        
        // 绘制X轴
        DrawArrow(g,center,ToScreen(new Vec2(vec2.X,0),center, scale),new Color(231,234,20,255),1.5f,8f);
        DrawArrow(g,center_x,ToScreen(new Vec2(vec2.X,0),center_x, scale),new Color(231,234,20,150),1.5f,8f);
        // 绘制Y轴
        DrawArrow(g,center,ToScreen(new Vec2(0,vec2.Y),center, scale),new Color(231,24,230,255),1.5f,8f);
        DrawArrow(g,center_y,ToScreen(new Vec2(0,vec2.Y),center_y, scale),new Color(231,24,230,150),1.5f,8f);
        // 绘制原向量
        DrawArrow(g,center,ToScreen(vec2,center, scale),new Color(231,234,220,255),1.5f,8f);
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