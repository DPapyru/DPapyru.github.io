// Generated from anims/demo-eoc-ai.cs
export function create(runtime) {
    const { Vec2, Color, MathF } = runtime;
    class DemoEocAi {
        constructor() {
            this._ctx = null;
            this._position = new Vec2(0, 0);
            this._velocity = new Vec2(0, 0);
            this._stateTimer = 0;
            this._isDashing = false;
        }
        OnInit(ctx) {
            
                    this._ctx = ctx;
                    this._position = new Vec2(ctx.Width * 0.5, ctx.Height * 0.4);
                    this._velocity = new Vec2(0, 0);
                    this._stateTimer = 0;
                    this._isDashing = false;
            
        }
        OnUpdate(dt) {
            
                    if (this._ctx == null)
                    {
                        return;
                    }
            
                    this._stateTimer += dt;
            
                    let target = DemoEocAi.GetTargetPoint(this._ctx.Time, this._ctx.Width, this._ctx.Height);
                    if (this._ctx.Input.IsInside)
                    {
                        target = new Vec2(this._ctx.Input.X, this._ctx.Input.Y);
                    }
                    let toTarget = new Vec2(target.X - this._position.X, target.Y - this._position.Y);
                    let distance = DemoEocAi.Length(toTarget);
            
                    if (this._isDashing)
                    {
                        if (this._stateTimer < 0.12)
                        {
                            this._velocity = DemoEocAi.Scale(DemoEocAi.Normalize(toTarget), 320);
                        }
            
                        if (this._stateTimer > 0.45)
                        {
                            this._isDashing = false;
                            this._stateTimer = 0;
                        }
                    }
                    else
                    {
                        let desiredSpeed = distance > 10 ? 120 : 40;
                        let desiredVelocity = DemoEocAi.Scale(DemoEocAi.Normalize(toTarget), desiredSpeed);
                        this._velocity = DemoEocAi.Lerp(this._velocity, desiredVelocity, 0.08);
            
                        if (this._stateTimer > 2.2)
                        {
                            this._isDashing = true;
                            this._stateTimer = 0;
                        }
                    }
            
                    this._position = new Vec2(this._position.X + this._velocity.X * dt, this._position.Y + this._velocity.Y * dt);
                    this._position = DemoEocAi.ClampToArena(this._position, this._ctx.Width, this._ctx.Height, 50);
            
        }
        OnRender(g) {
            
                    if (this._ctx == null)
                    {
                        return;
                    }
            
                    g.Clear(new Color(10, 12, 18));
            
                    let target = DemoEocAi.GetTargetPoint(this._ctx.Time, this._ctx.Width, this._ctx.Height);
                    if (this._ctx.Input.IsInside)
                    {
                        target = new Vec2(this._ctx.Input.X, this._ctx.Input.Y);
                    }
                    DemoEocAi.DrawArena(g, this._ctx.Width, this._ctx.Height);
                    DemoEocAi.DrawTarget(g, target);
                    DemoEocAi.DrawEye(g, this._position, target, this._isDashing, this._ctx.Time);
            
                    DemoEocAi.DrawArrow(g, this._position, this._position + this._velocity, new Color(255, 255, 255, 160), 2, 10);
            
        }
        OnDispose() {
        }
        static GetTargetPoint(time, width, height) {
            
                    let cx = width * 0.5;
                    let cy = height * 0.55;
                    let orbitX = MathF.Cos(time * 0.7) * 140;
                    let orbitY = MathF.Sin(time * 1.1) * 90;
                    return new Vec2(cx + orbitX, cy + orbitY);
            
        }
        static DrawArena(g, width, height) {
            
                    let frameColor = new Color(45, 60, 80, 160);
                    let border = 20;
            
                    g.Line(new Vec2(border, border), new Vec2(width - border, border), frameColor, 1);
                    g.Line(new Vec2(width - border, border), new Vec2(width - border, height - border), frameColor, 1);
                    g.Line(new Vec2(width - border, height - border), new Vec2(border, height - border), frameColor, 1);
                    g.Line(new Vec2(border, height - border), new Vec2(border, border), frameColor, 1);
            
        }
        static DrawTarget(g, target) {
            
                    g.FillCircle(target, 4, new Color(100, 220, 255));
                    g.Circle(target, 10, new Color(80, 140, 200, 160), 1);
            
        }
        static DrawEye(g, center, target, isDashing, time) {
            
                    let bodyRadius = 34;
                    let outline = isDashing ? new Color(255, 80, 80) : new Color(220, 80, 80);
                    let bodyColor = isDashing ? new Color(130, 30, 30) : new Color(90, 24, 24);
                    let irisColor = new Color(230, 170, 70);
                    let pupilColor = new Color(30, 12, 12);
            
                    let gaze = DemoEocAi.Normalize(new Vec2(target.X - center.X, target.Y - center.Y));
                    let irisCenter = new Vec2(center.X + gaze.X * bodyRadius * 0.35, center.Y + gaze.Y * bodyRadius * 0.35);
                    let pupilCenter = new Vec2(irisCenter.X + gaze.X * 5, irisCenter.Y + gaze.Y * 5);
            
                    for (let i = 0; i < 8; i++)
                    {
                        let angle = time * 0.9 + i * 0.78;
                        let dir = new Vec2(MathF.Cos(angle), MathF.Sin(angle));
                        let start = new Vec2(center.X + dir.X * bodyRadius * 0.9, center.Y + dir.Y * bodyRadius * 0.9);
                        let end = new Vec2(center.X + dir.X * (bodyRadius + 10 + 6 * MathF.Sin(time + i)),
                            center.Y + dir.Y * (bodyRadius + 10 + 6 * MathF.Sin(time + i)));
                        g.Line(start, end, new Color(120, 40, 40, 160), 1);
                    }
            
                    g.FillCircle(center, bodyRadius, bodyColor);
                    g.Circle(center, bodyRadius, outline, 2);
                    g.FillCircle(irisCenter, bodyRadius * 0.45, irisColor);
                    g.FillCircle(pupilCenter, bodyRadius * 0.18, pupilColor);
                    g.Circle(irisCenter, bodyRadius * 0.45, new Color(255, 220, 150, 200), 1);
            
        }
        static DrawArrow(g, from, to, color, width, headSize) {
            
                    g.Line(from, to, color, width);
            
                    let dir = new Vec2(to.X - from.X, to.Y - from.Y);
                    let len = MathF.Sqrt(dir.X * dir.X + dir.Y * dir.Y);
                    if (len <= 0.001)
                    {
                        return;
                    }
            
                    let ux = dir.X / len;
                    let uy = dir.Y / len;
                    let left = new Vec2(-uy, ux);
            
                    let basePoint = new Vec2(to.X - ux * headSize, to.Y - uy * headSize);
                    let leftPoint = new Vec2(basePoint.X + left.X * headSize * 0.55, basePoint.Y + left.Y * headSize * 0.55);
                    let rightPoint = new Vec2(basePoint.X - left.X * headSize * 0.55, basePoint.Y - left.Y * headSize * 0.55);
            
                    g.Line(to, leftPoint, color, width);
                    g.Line(to, rightPoint, color, width);
            
        }
        static ClampToArena(pos, width, height, padding) {
            
                    let x = MathF.Max(padding, MathF.Min(width - padding, pos.X));
                    let y = MathF.Max(padding, MathF.Min(height - padding, pos.Y));
                    return new Vec2(x, y);
            
        }
        static Lerp(a, b, t) {
            
                    return new Vec2(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t);
            
        }
        static Normalize(v) {
            
                    let len = DemoEocAi.Length(v);
                    if (len <= 0.0001)
                    {
                        return new Vec2(0, 0);
                    }
                    return new Vec2(v.X / len, v.Y / len);
            
        }
        static Scale(v, s) {
             return new Vec2(v.X * s, v.Y * s);
        }
        static Length(v) {
             return MathF.Sqrt(v.X * v.X + v.Y * v.Y);
        }
    }
    return new DemoEocAi();
}
