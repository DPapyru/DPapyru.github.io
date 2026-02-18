using AnimRuntime;
using AnimRuntime.Math;

[AnimEntry("demo-eoc-ai")]
[AnimProfile(Controls = "mode-select", HeightScale = 2.3f, ModeOptions = "0:自动|1:一阶-徘徊|2:一阶-冲刺|3:二阶-变形|4:二阶-徘徊|5:二阶-冲刺")]
public sealed class DemoEocAi : IAnimScript
{
    private AnimContext? _ctx;
    private Vec2 _position;
    private Vec2 _velocity;
    private float _stateTimer;
    private float _life;
    private float _maxLife;
    private float _spawnTimer;
    private int _state;
    private int _phase;
    private int _chargeCount;
    private bool _overrideActive;
    private int _overrideMode;

    private Vec2[] _minionPos;
    private Vec2[] _minionVel;
    private float[] _minionAge;
    private float[] _minionPhase;
    private bool[] _minionActive;

    public void OnInit(AnimContext ctx)
    {
        _ctx = ctx;
        _position = new Vec2(ctx.Width * 0.5f, ctx.Height * 0.4f);
        _velocity = new Vec2(0f, 0f);
        _stateTimer = 0f;
        _maxLife = 2800f;
        _life = _maxLife;
        _spawnTimer = 0f;
        _state = 0;
        _phase = 1;
        _chargeCount = 0;
        _overrideActive = false;
        _overrideMode = 0;
        _minionPos = new[]
        {
            new Vec2(0f, 0f), new Vec2(0f, 0f), new Vec2(0f, 0f),
            new Vec2(0f, 0f), new Vec2(0f, 0f), new Vec2(0f, 0f)
        };
        _minionVel = new[]
        {
            new Vec2(0f, 0f), new Vec2(0f, 0f), new Vec2(0f, 0f),
            new Vec2(0f, 0f), new Vec2(0f, 0f), new Vec2(0f, 0f)
        };
        _minionAge = new[] { 0f, 0f, 0f, 0f, 0f, 0f };
        _minionPhase = new[] { 0f, 0f, 0f, 0f, 0f, 0f };
        _minionActive = new[] { false, false, false, false, false, false };
        this.ResetMinions();
    }

    public void OnUpdate(float dt)
    {
        if (_ctx is null)
        {
            return;
        }

        if (_ctx.Input.IsInside && _ctx.Input.WasPressed)
        {
            _life = MathF.Max(0f, _life - _maxLife * 0.01f);
        }

        var target = GetTargetPoint(_ctx.Time, _ctx.Width, _ctx.Height);
        if (_ctx.Input.IsInside)
        {
            target = new Vec2(_ctx.Input.X, _ctx.Input.Y);
        }

        if (_ctx.Input.ModeLocked)
        {
            this.ApplyOverride(_ctx.Input.Mode);
            this.UpdateState(target, dt, false);
            this.UpdateMinions(target, dt);
            return;
        }

        if (_overrideActive)
        {
            _overrideActive = false;
            _overrideMode = 0;
            _stateTimer = 0f;
        }

        if (_phase == 1 && _life <= _maxLife * 0.5f)
        {
            _phase = 2;
            this.EnterState(2);
        }

        this.UpdateState(target, dt, true);
        this.UpdateMinions(target, dt);
    }

    public void OnRender(ICanvas2D g)
    {
        if (_ctx is null)
        {
            return;
        }

        g.Clear(new Color(10, 12, 18));

        DrawArena(g, _ctx.Width, _ctx.Height);
        this.DrawHealth(g);
        this.DrawMinions(g);

        var target = GetTargetPoint(_ctx.Time, _ctx.Width, _ctx.Height);
        if (_ctx.Input.IsInside)
        {
            target = new Vec2(_ctx.Input.X, _ctx.Input.Y);
        }

        DrawTarget(g, target);
        DrawEye(g, _position, target, _phase == 2, _ctx.Time);
    }

    public void OnDispose()
    {
    }

    private void ApplyOverride(int mode)
    {
        if (!_overrideActive || _overrideMode != mode)
        {
            _overrideActive = true;
            _overrideMode = mode;
            if (mode == 1)
            {
                _phase = 1;
                this.EnterState(0);
            }
            else if (mode == 2)
            {
                _phase = 1;
                this.EnterState(1);
            }
            else if (mode == 3)
            {
                _phase = 2;
                this.EnterState(2);
            }
            else if (mode == 4)
            {
                _phase = 2;
                this.EnterState(3);
            }
            else if (mode == 5)
            {
                _phase = 2;
                this.EnterState(4);
            }
        }
    }

    private void EnterState(int state)
    {
        _state = state;
        _stateTimer = 0f;
        if (state == 0 || state == 3)
        {
            _chargeCount = 0;
        }
    }

    private void UpdateState(Vec2 target, float dt, bool allowTransition)
    {
        _stateTimer += dt;
        if (_state == 0)
        {
            this.UpdateHover(target, dt, this.GetHoverOffset(), this.GetPhase1HoverTime(), 150f);
            if (allowTransition && _stateTimer > this.GetPhase1HoverTime())
            {
                this.EnterState(1);
            }
        }
        else if (_state == 1)
        {
            this.UpdateCharge(target, dt, this.GetPhase1ChargeSpeed(), this.GetPhase1ChargeTime());
            if (allowTransition && _stateTimer > this.GetPhase1ChargeTime())
            {
                _chargeCount += 1;
                if (_chargeCount >= 3)
                {
                    this.EnterState(0);
                }
                else
                {
                    _stateTimer = 0f;
                }
            }
        }
        else if (_state == 2)
        {
            this.UpdateTransform(target, dt);
            if (allowTransition && _stateTimer > 1.2f)
            {
                this.EnterState(3);
            }
        }
        else if (_state == 3)
        {
            this.UpdateHover(target, dt, this.GetHoverOffset(), this.GetPhase2HoverTime(), 190f);
            if (allowTransition && _stateTimer > this.GetPhase2HoverTime())
            {
                this.EnterState(4);
            }
        }
        else if (_state == 4)
        {
            this.UpdateCharge(target, dt, this.GetPhase2ChargeSpeed(), this.GetPhase2ChargeTime());
            if (allowTransition && _stateTimer > this.GetPhase2ChargeTime())
            {
                _chargeCount += 1;
                if (_chargeCount >= 4)
                {
                    this.EnterState(3);
                }
                else
                {
                    _stateTimer = 0f;
                }
            }
        }

        if (allowTransition)
        {
            this.TrySpawnMinions(target, dt);
        }
    }

    private void UpdateHover(Vec2 target, float dt, Vec2 offset, float hoverTime, float speed)
    {
        var desired = new Vec2(target.X + offset.X, target.Y + offset.Y);
        var desiredVelocity = Scale(Normalize(new Vec2(desired.X - _position.X, desired.Y - _position.Y)), speed);
        _velocity = Lerp(_velocity, desiredVelocity, 0.08f);
        _position = new Vec2(_position.X + _velocity.X * dt, _position.Y + _velocity.Y * dt);
        _position = ClampToArena(_position, _ctx.Width, _ctx.Height, 60f);
    }

    private void UpdateCharge(Vec2 target, float dt, float speed, float chargeTime)
    {
        if (_stateTimer <= 0.0001f)
        {
            _velocity = Scale(Normalize(new Vec2(target.X - _position.X, target.Y - _position.Y)), speed);
        }
        _position = new Vec2(_position.X + _velocity.X * dt, _position.Y + _velocity.Y * dt);
        _position = ClampToArena(_position, _ctx.Width, _ctx.Height, 40f);
    }

    private void UpdateTransform(Vec2 target, float dt)
    {
        var desiredVelocity = Scale(Normalize(new Vec2(target.X - _position.X, target.Y - _position.Y)), 80f);
        _velocity = Lerp(_velocity, desiredVelocity, 0.05f);
        _position = new Vec2(_position.X + _velocity.X * dt, _position.Y + _velocity.Y * dt);
        _position = ClampToArena(_position, _ctx.Width, _ctx.Height, 50f);
    }

    private void TrySpawnMinions(Vec2 target, float dt)
    {
        _spawnTimer += dt;
        if (_spawnTimer < 2.2f)
        {
            return;
        }

        if (_phase == 1 && _life > _maxLife * 0.75f)
        {
            return;
        }

        _spawnTimer = 0f;
        for (int i = 0; i < _minionActive.Length; i++)
        {
            if (!_minionActive[i])
            {
                _minionActive[i] = true;
                _minionAge[i] = 0f;
                _minionPhase[i] = _ctx.Time + i * 0.9f;
                _minionPos[i] = new Vec2(_position.X, _position.Y);
                _minionVel[i] = new Vec2(0f, 0f);
                break;
            }
        }
    }

    private void UpdateMinions(Vec2 target, float dt)
    {
        for (int i = 0; i < _minionActive.Length; i++)
        {
            if (!_minionActive[i])
            {
                continue;
            }

            _minionAge[i] += dt;
            if (_minionAge[i] > 2f)
            {
                _minionActive[i] = false;
                continue;
            }

            var orbitAngle = _minionAge[i] * 2.4f + _minionPhase[i];
            var orbitRadius = 50f + 12f * MathF.Sin(_minionAge[i] * 3f + _minionPhase[i]);
            var desired = new Vec2(
                target.X + MathF.Cos(orbitAngle) * orbitRadius,
                target.Y + MathF.Sin(orbitAngle) * orbitRadius
            );
            var desiredVelocity = Scale(Normalize(new Vec2(desired.X - _minionPos[i].X, desired.Y - _minionPos[i].Y)), 140f);
            _minionVel[i] = Lerp(_minionVel[i], desiredVelocity, 0.2f);
            _minionPos[i] = new Vec2(_minionPos[i].X + _minionVel[i].X * dt, _minionPos[i].Y + _minionVel[i].Y * dt);
        }
    }

    private void ResetMinions()
    {
        for (int i = 0; i < _minionActive.Length; i++)
        {
            _minionActive[i] = false;
            _minionAge[i] = 0f;
            _minionPhase[i] = 0f;
            _minionPos[i] = new Vec2(0f, 0f);
            _minionVel[i] = new Vec2(0f, 0f);
        }
    }

    private void DrawHealth(ICanvas2D g)
    {
        var barStart = new Vec2(18f, 18f);
        var barWidth = 220f;
        var barEnd = new Vec2(barStart.X + barWidth, barStart.Y);
        var ratio = _maxLife <= 0f ? 0f : _life / _maxLife;
        var filled = new Vec2(barStart.X + barWidth * ratio, barStart.Y);

        g.Line(barStart, barEnd, new Color(40, 40, 50, 200), 6f);
        g.Line(barStart, filled, new Color(220, 70, 70, 220), 6f);
        g.Circle(barStart, 4f, new Color(255, 180, 180, 200), 2f);
    }

    private void DrawMinions(ICanvas2D g)
    {
        for (int i = 0; i < _minionActive.Length; i++)
        {
            if (!_minionActive[i])
            {
                continue;
            }
            var pos = _minionPos[i];
            g.FillCircle(pos, 8f, new Color(120, 30, 30));
            g.Circle(pos, 8f, new Color(200, 80, 80), 2f);
            var pupil = new Vec2(pos.X + 2f, pos.Y + 2f);
            g.FillCircle(pupil, 3f, new Color(30, 10, 10));
        }
    }

    private Vec2 GetHoverOffset()
    {
        if (_ctx is null)
        {
            return new Vec2(0f, -120f);
        }
        var bob = MathF.Sin(_ctx.Time * 1.3f) * 24f;
        return new Vec2(MathF.Cos(_ctx.Time * 0.9f) * 80f, -120f + bob);
    }

    private float GetPhase1HoverTime()
    {
        return 1.05f;
    }

    private float GetPhase2HoverTime()
    {
        return 0.6f;
    }

    private float GetPhase1ChargeSpeed()
    {
        var ratio = _maxLife <= 0f ? 0f : 1f - _life / _maxLife;
        return 180f + 60f * ratio;
    }

    private float GetPhase2ChargeSpeed()
    {
        var ratio = _maxLife <= 0f ? 0f : 1f - _life / _maxLife;
        return 230f + 80f * ratio;
    }

    private float GetPhase1ChargeTime()
    {
        return 0.42f;
    }

    private float GetPhase2ChargeTime()
    {
        return 0.32f;
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

    private static void DrawEye(ICanvas2D g, Vec2 center, Vec2 target, bool isPhase2, float time)
    {
        var bodyRadius = 34f;
        var outline = isPhase2 ? new Color(255, 120, 120) : new Color(220, 80, 80);
        var bodyColor = isPhase2 ? new Color(150, 35, 35) : new Color(90, 24, 24);
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
                center.Y + dir.Y * (bodyRadius + 10f + 6f * MathF.Sin(time + i)));
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
