using AnimRuntime;
using Microsoft.Xna.Framework;

namespace AnimScripts.Dev;

// 向量的加法和分解说明
[AnimEntry("arrow-easy-ai")]
[AnimProfile(HeightScale = 3f)]
public sealed class ArrowEasyAI : IAnimScript
{
    private AnimContext? _ctx;
    private float _time;
    private Vector2 _vel;
    private Vector2 _center;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
        _time = 0;

        if (_ctx is null)
            return;

        var width = _ctx.Width;
        var height = _ctx.Height;

        _vel = new Vector2(6f,-2f);
        _center = new Vector2(0,height * 0.2f);
    }

    public void OnUpdate(float dt)
    {
        if (_ctx is null)
            return;

        var width = _ctx.Width;
        var height = _ctx.Height;
        
        if(_time++ > 120)
        {
            _vel = new Vector2(6f,-2f);
            _center = new Vector2(0,height * 0.2f);
            _time = 0;
        }

        _center.X += _vel.X;
        _center.Y += _vel.Y;

        if(_vel.Y < 6)
            _vel.Y += 0.1f;
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
            return;
        g.Clear(new Color(8, 12, 16));
        var width = _ctx.Width;
        var height = _ctx.Height;
        var center = new Vector2(0.5f * width,0.5f * height);
        var scale = MathF.Min(width, height) * 0.52f;
        var vec2 = new Vector2(_vel.X * 0.02f,- _vel.Y * 0.02f);

        AnimGeom.DrawAxes(g, center, scale); // 绘制坐标系

        AnimGeom.DrawArrow(g, _center, AnimGeom.ToScreen(vec2,_center,scale), new Color(255, 255, 255, 255), 3f, 15f);
    }

    public void OnDispose()
    {
    }

}