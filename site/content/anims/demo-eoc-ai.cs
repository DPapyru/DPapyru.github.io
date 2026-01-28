using System;
using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("demo-eoc-ai")]
public sealed class DemoEocAi : IAnimScript
{
    private AnimContext? _ctx;
    private Vec2 _position;
    private Vec2 _velocity;
    private float _stateTimer;
    private bool _isDashing;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
        _position = new Vec2(ctx.Width * 0.5f, ctx.Height * 0.4f);
        _velocity = new Vec2(0f, 0f);
        _stateTimer = 0f;
        _isDashing = false;
    }

    public void OnUpdate(float dt)
    {
        if (_ctx is null)
        {
            return;
        }

        _stateTimer += dt;

        var target = GetTargetPoint(_ctx.Time, _ctx.Width, _ctx.Height);
        if (_ctx.Input.IsInside)
        {
            target = new Vec2(_ctx.Input.X, _ctx.Input.Y);
        }
        var toTarget = new Vec2(target.X - _position.X, target.Y - _position.Y);
        var distance = Length(toTarget);

        if (_isDashing)
        {
            if (_stateTimer < 0.12f)
            {
                _velocity = Scale(Normalize(toTarget), 320f);
            }

            if (_stateTimer > 0.45f)
            {
                _isDashing = false;
                _stateTimer = 0f;
            }
        }
        else
        {
            var desiredSpeed = distance > 10f ? 120f : 40f;
            var desiredVelocity = Scale(Normalize(toTarget), desiredSpeed);
            _velocity = Lerp(_velocity, desiredVelocity, 0.08f);

            if (_stateTimer > 2.2f)
            {
                _isDashing = true;
                _stateTimer = 0f;
            }
        }

        _position = new Vec2(_position.X + _velocity.X * dt, _position.Y + _velocity.Y * dt);
        _position = ClampToArena(_position, _ctx.Width, _ctx.Height, 50f);
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
        {
            return;
        }

        g.Clear(new Color(10, 12, 18));

        var target = GetTargetPoint(_ctx.Time, _ctx.Width, _ctx.Height);
        if (_ctx.Input.IsInside)
        {
            target = new Vec2(_ctx.Input.X, _ctx.Input.Y);
        }
        DrawArena(g, _ctx.Width, _ctx.Height);
        DrawTarget(g, target);
        DrawEye(g, _position, target, _isDashing, _ctx.Time);
    }
    public void OnDispose()
    {
    }

    private static Vec2 GetTargetPoint(float time, int width, int height)
    {
        var cx = width * 0.5f;
        var cy = height * 0.55f;
        var orbitX = MathF.Cos(time * 0.7f) * 140f;
        var orbitY = MathF.Sin(time * 1.1f) * 90f;
        return new Vec2(cx + orbitX, cy + orbitY);
    }

    private static void DrawArena(ICanvas2D g, int width, int height)
    {
        var frameColor = new Color(45, 60, 80, 160);
        var border = 20f;

        g.Line(new Vec2(border, border), new Vec2(width - border, border), frameColor, 1f);
        g.Line(new Vec2(width - border, border), new Vec2(width - border, height - border), frameColor, 1f);
        g.Line(new Vec2(width - border, height - border), new Vec2(border, height - border), frameColor, 1f);
        g.Line(new Vec2(border, height - border), new Vec2(border, border), frameColor, 1f);
    }

    private static void DrawTarget(ICanvas2D g, Vec2 target)
    {
        g.FillCircle(target, 4f, new Color(100, 220, 255));
        g.Circle(target, 10f, new Color(80, 140, 200, 160), 1f);
    }

    private static void DrawEye(ICanvas2D g, Vec2 center, Vec2 target, bool isDashing, float time)
    {
        var bodyRadius = 34f;
        var outline = isDashing ? new Color(255, 80, 80) : new Color(220, 80, 80);
        var bodyColor = isDashing ? new Color(130, 30, 30) : new Color(90, 24, 24);
        var irisColor = new Color(230, 170, 70);
        var pupilColor = new Color(30, 12, 12);

        var gaze = Normalize(new Vec2(target.X - center.X, target.Y - center.Y));
        var irisCenter = new Vec2(center.X + gaze.X * bodyRadius * 0.35f, center.Y + gaze.Y * bodyRadius * 0.35f);
        var pupilCenter = new Vec2(irisCenter.X + gaze.X * 5f, irisCenter.Y + gaze.Y * 5f);

        for (int i = 0; i < 8; i++)
        {
            var angle = time * 0.9f + i * 0.78f;
            var dir = new Vec2(MathF.Cos(angle), MathF.Sin(angle));
            var start = new Vec2(center.X + dir.X * bodyRadius * 0.9f, center.Y + dir.Y * bodyRadius * 0.9f);
            var end = new Vec2(center.X + dir.X * (bodyRadius + 10f + 6f * MathF.Sin(time + i)),
                center.Y + dir.Y * (bodyRadius + 10f + 6f * MathF.Sin(time + i))
            );
            g.Line(start, end, new Color(120, 40, 40, 160), 1f);
        }

        g.FillCircle(center, bodyRadius, bodyColor);
        g.Circle(center, bodyRadius, outline, 2f);
        g.FillCircle(irisCenter, bodyRadius * 0.45f, irisColor);
        g.FillCircle(pupilCenter, bodyRadius * 0.18f, pupilColor);
        g.Circle(irisCenter, bodyRadius * 0.45f, new Color(255, 220, 150, 200), 1f);
    }
    private static Vec2 ClampToArena(Vec2 pos, int width, int height, float padding)
    {
        var x = MathF.Max(padding, MathF.Min(width - padding, pos.X));
        var y = MathF.Max(padding, MathF.Min(height - padding, pos.Y));
        return new Vec2(x, y);
    }

    private static Vec2 Scale(Vec2 v, float s) => new Vec2(v.X * s, v.Y * s);

    private static Vec2 Lerp(Vec2 a, Vec2 b, float t)
    {
        return new Vec2(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t);
    }

    private static float Length(Vec2 v) => MathF.Sqrt(v.X * v.X + v.Y * v.Y);

    private static Vec2 Normalize(Vec2 v)
    {
        var len = Length(v);
        if (len <= 0.0001f)
        {
            return new Vec2(0f, 0f);
        }
        return new Vec2(v.X / len, v.Y / len);
    }
}
