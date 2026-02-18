// Generated from anims/demo-eoc-ai.cs
export function create(runtime) {
    const { Vec2, Color, MathF, AnimGeom } = runtime;
    class DemoEocAi {
        constructor() {
            this._ctx = null;
            this._position = new Vec2(0, 0);
            this._velocity = new Vec2(0, 0);
            this._stateTimer = 0;
            this._life = 0;
            this._maxLife = 0;
            this._spawnTimer = 0;
            this._state = 0;
            this._phase = 0;
            this._chargeCount = 0;
            this._overrideActive = false;
            this._overrideMode = 0;
            this._minionPos = null;
            this._minionVel = null;
            this._minionAge = null;
            this._minionPhase = null;
            this._minionActive = null;
        }
        OnInit(ctx) {
            
                    this._ctx = ctx;
                    this._position = new Vec2(ctx.Width * 0.5, ctx.Height * 0.4);
                    this._velocity = new Vec2(0, 0);
                    this._stateTimer = 0;
                    this._maxLife = 2800;
                    this._life = this._maxLife;
                    this._spawnTimer = 0;
                    this._state = 0;
                    this._phase = 1;
                    this._chargeCount = 0;
                    this._overrideActive = false;
                    this._overrideMode = 0;
                    this._minionPos =
                    [
                        new Vec2(0, 0), new Vec2(0, 0), new Vec2(0, 0),
                        new Vec2(0, 0), new Vec2(0, 0), new Vec2(0, 0)
                    ];
                    this._minionVel =
                    [
                        new Vec2(0, 0), new Vec2(0, 0), new Vec2(0, 0),
                        new Vec2(0, 0), new Vec2(0, 0), new Vec2(0, 0)
                    ];
                    this._minionAge = [ 0, 0, 0, 0, 0, 0 ];
                    this._minionPhase = [ 0, 0, 0, 0, 0, 0 ];
                    this._minionActive = [ false, false, false, false, false, false ];
                    this.ResetMinions();
            
        }
        OnUpdate(dt) {
            
                    if (this._ctx == null)
                    {
                        return;
                    }
            
                    if (this._ctx.Input.IsInside && this._ctx.Input.WasPressed)
                    {
                        this._life = MathF.Max(0, this._life - this._maxLife * 0.01);
                    }
            
                    let target = DemoEocAi.GetTargetPoint(this._ctx.Time, this._ctx.Width, this._ctx.Height);
                    if (this._ctx.Input.IsInside)
                    {
                        target = new Vec2(this._ctx.Input.X, this._ctx.Input.Y);
                    }
            
                    if (this._ctx.Input.ModeLocked)
                    {
                        this.ApplyOverride(this._ctx.Input.Mode);
                        this.UpdateState(target, dt, false);
                        this.UpdateMinions(target, dt);
                        return;
                    }
            
                    if (this._overrideActive)
                    {
                        this._overrideActive = false;
                        this._overrideMode = 0;
                        this._stateTimer = 0;
                    }
            
                    if (this._phase == 1 && this._life <= this._maxLife * 0.5)
                    {
                        this._phase = 2;
                        this.EnterState(2);
                    }
            
                    this.UpdateState(target, dt, true);
                    this.UpdateMinions(target, dt);
            
        }
        OnRender(g) {
            
                    if (this._ctx == null)
                    {
                        return;
                    }
            
                    g.Clear(new Color(10, 12, 18));
            
                    DemoEocAi.DrawArena(g, this._ctx.Width, this._ctx.Height);
                    this.DrawHealth(g);
                    this.DrawMinions(g);
            
                    let target = DemoEocAi.GetTargetPoint(this._ctx.Time, this._ctx.Width, this._ctx.Height);
                    if (this._ctx.Input.IsInside)
                    {
                        target = new Vec2(this._ctx.Input.X, this._ctx.Input.Y);
                    }
            
                    DemoEocAi.DrawTarget(g, target);
                    DemoEocAi.DrawEye(g, this._position, target, this._phase == 2, this._ctx.Time);
            
        }
        OnDispose() {
        }
        ApplyOverride(mode) {
            
                    if (!this._overrideActive || this._overrideMode != mode)
                    {
                        this._overrideActive = true;
                        this._overrideMode = mode;
                        if (mode == 1)
                        {
                            this._phase = 1;
                            this.EnterState(0);
                        }
                        else if (mode == 2)
                        {
                            this._phase = 1;
                            this.EnterState(1);
                        }
                        else if (mode == 3)
                        {
                            this._phase = 2;
                            this.EnterState(2);
                        }
                        else if (mode == 4)
                        {
                            this._phase = 2;
                            this.EnterState(3);
                        }
                        else if (mode == 5)
                        {
                            this._phase = 2;
                            this.EnterState(4);
                        }
                    }
            
        }
        EnterState(state) {
            
                    this._state = state;
                    this._stateTimer = 0;
                    if (state == 0 || state == 3)
                    {
                        this._chargeCount = 0;
                    }
            
        }
        UpdateState(target, dt, allowTransition) {
            
                    this._stateTimer += dt;
                    if (this._state == 0)
                    {
                        this.UpdateHover(target, dt, this.GetHoverOffset(), this.GetPhase1HoverTime(), 150);
                        if (allowTransition && this._stateTimer > this.GetPhase1HoverTime())
                        {
                            this.EnterState(1);
                        }
                    }
                    else if (this._state == 1)
                    {
                        this.UpdateCharge(target, dt, this.GetPhase1ChargeSpeed(), this.GetPhase1ChargeTime());
                        if (allowTransition && this._stateTimer > this.GetPhase1ChargeTime())
                        {
                            this._chargeCount += 1;
                            if (this._chargeCount >= 3)
                            {
                                this.EnterState(0);
                            }
                            else
                            {
                                this._stateTimer = 0;
                            }
                        }
                    }
                    else if (this._state == 2)
                    {
                        this.UpdateTransform(target, dt);
                        if (allowTransition && this._stateTimer > 1.2)
                        {
                            this.EnterState(3);
                        }
                    }
                    else if (this._state == 3)
                    {
                        this.UpdateHover(target, dt, this.GetHoverOffset(), this.GetPhase2HoverTime(), 190);
                        if (allowTransition && this._stateTimer > this.GetPhase2HoverTime())
                        {
                            this.EnterState(4);
                        }
                    }
                    else if (this._state == 4)
                    {
                        this.UpdateCharge(target, dt, this.GetPhase2ChargeSpeed(), this.GetPhase2ChargeTime());
                        if (allowTransition && this._stateTimer > this.GetPhase2ChargeTime())
                        {
                            this._chargeCount += 1;
                            if (this._chargeCount >= 4)
                            {
                                this.EnterState(3);
                            }
                            else
                            {
                                this._stateTimer = 0;
                            }
                        }
                    }
            
                    if (allowTransition)
                    {
                        this.TrySpawnMinions(target, dt);
                    }
            
        }
        UpdateHover(target, dt, offset, hoverTime, speed) {
            
                    let desired = new Vec2(target.X + offset.X, target.Y + offset.Y);
                    let desiredVelocity = DemoEocAi.Scale(DemoEocAi.Normalize(new Vec2(desired.X - this._position.X, desired.Y - this._position.Y)), speed);
                    this._velocity = DemoEocAi.Lerp(this._velocity, desiredVelocity, 0.08);
                    this._position = new Vec2(this._position.X + this._velocity.X * dt, this._position.Y + this._velocity.Y * dt);
                    this._position = DemoEocAi.ClampToArena(this._position, this._ctx.Width, this._ctx.Height, 60);
            
        }
        UpdateCharge(target, dt, speed, chargeTime) {
            
                    if (this._stateTimer <= 0.0001)
                    {
                        this._velocity = DemoEocAi.Scale(DemoEocAi.Normalize(new Vec2(target.X - this._position.X, target.Y - this._position.Y)), speed);
                    }
                    this._position = new Vec2(this._position.X + this._velocity.X * dt, this._position.Y + this._velocity.Y * dt);
                    this._position = DemoEocAi.ClampToArena(this._position, this._ctx.Width, this._ctx.Height, 40);
            
        }
        UpdateTransform(target, dt) {
            
                    let desiredVelocity = DemoEocAi.Scale(DemoEocAi.Normalize(new Vec2(target.X - this._position.X, target.Y - this._position.Y)), 80);
                    this._velocity = DemoEocAi.Lerp(this._velocity, desiredVelocity, 0.05);
                    this._position = new Vec2(this._position.X + this._velocity.X * dt, this._position.Y + this._velocity.Y * dt);
                    this._position = DemoEocAi.ClampToArena(this._position, this._ctx.Width, this._ctx.Height, 50);
            
        }
        TrySpawnMinions(target, dt) {
            
                    this._spawnTimer += dt;
                    if (this._spawnTimer < 2.2)
                    {
                        return;
                    }
            
                    if (this._phase == 1 && this._life > this._maxLife * 0.75)
                    {
                        return;
                    }
            
                    this._spawnTimer = 0;
                    for (let i = 0; i < this._minionActive.length; i++)
                    {
                        if (!this._minionActive[i])
                        {
                            this._minionActive[i] = true;
                            this._minionAge[i] = 0;
                            this._minionPhase[i] = this._ctx.Time + i * 0.9;
                            this._minionPos[i] = new Vec2(this._position.X, this._position.Y);
                            this._minionVel[i] = new Vec2(0, 0);
                            break;
                        }
                    }
            
        }
        UpdateMinions(target, dt) {
            
                    for (let i = 0; i < this._minionActive.length; i++)
                    {
                        if (!this._minionActive[i])
                        {
                            continue;
                        }
            
                        this._minionAge[i] += dt;
                        if (this._minionAge[i] > 2)
                        {
                            this._minionActive[i] = false;
                            continue;
                        }
            
                        let orbitAngle = this._minionAge[i] * 2.4 + this._minionPhase[i];
                        let orbitRadius = 50 + 12 * MathF.Sin(this._minionAge[i] * 3 + this._minionPhase[i]);
                        let desired = new Vec2(
                            target.X + MathF.Cos(orbitAngle) * orbitRadius,
                            target.Y + MathF.Sin(orbitAngle) * orbitRadius
                        );
                        let desiredVelocity = DemoEocAi.Scale(DemoEocAi.Normalize(new Vec2(desired.X - this._minionPos[i].X, desired.Y - this._minionPos[i].Y)), 140);
                        this._minionVel[i] = DemoEocAi.Lerp(this._minionVel[i], desiredVelocity, 0.2);
                        this._minionPos[i] = new Vec2(this._minionPos[i].X + this._minionVel[i].X * dt, this._minionPos[i].Y + this._minionVel[i].Y * dt);
                    }
            
        }
        ResetMinions() {
            
                    for (let i = 0; i < this._minionActive.length; i++)
                    {
                        this._minionActive[i] = false;
                        this._minionAge[i] = 0;
                        this._minionPhase[i] = 0;
                        this._minionPos[i] = new Vec2(0, 0);
                        this._minionVel[i] = new Vec2(0, 0);
                    }
            
        }
        DrawHealth(g) {
            
                    let barStart = new Vec2(18, 18);
                    let barWidth = 220;
                    let barEnd = new Vec2(barStart.X + barWidth, barStart.Y);
                    let ratio = this._maxLife <= 0 ? 0 : this._life / this._maxLife;
                    let filled = new Vec2(barStart.X + barWidth * ratio, barStart.Y);
            
                    g.Line(barStart, barEnd, new Color(40, 40, 50, 200), 6);
                    g.Line(barStart, filled, new Color(220, 70, 70, 220), 6);
                    g.Circle(barStart, 4, new Color(255, 180, 180, 200), 2);
            
        }
        DrawMinions(g) {
            
                    for (let i = 0; i < this._minionActive.length; i++)
                    {
                        if (!this._minionActive[i])
                        {
                            continue;
                        }
                        let pos = this._minionPos[i];
                        g.FillCircle(pos, 8, new Color(120, 30, 30));
                        g.Circle(pos, 8, new Color(200, 80, 80), 2);
                        let pupil = new Vec2(pos.X + 2, pos.Y + 2);
                        g.FillCircle(pupil, 3, new Color(30, 10, 10));
                    }
            
        }
        GetHoverOffset() {
            
                    if (this._ctx == null)
                    {
                        return new Vec2(0, -120);
                    }
                    let bob = MathF.Sin(this._ctx.Time * 1.3) * 24;
                    return new Vec2(MathF.Cos(this._ctx.Time * 0.9) * 80, -120 + bob);
            
        }
        GetPhase1HoverTime() {
            
                    return 1.05;
            
        }
        GetPhase2HoverTime() {
            
                    return 0.6;
            
        }
        GetPhase1ChargeSpeed() {
            
                    let ratio = this._maxLife <= 0 ? 0 : 1 - this._life / this._maxLife;
                    return 180 + 60 * ratio;
            
        }
        GetPhase2ChargeSpeed() {
            
                    let ratio = this._maxLife <= 0 ? 0 : 1 - this._life / this._maxLife;
                    return 230 + 80 * ratio;
            
        }
        GetPhase1ChargeTime() {
            
                    return 0.42;
            
        }
        GetPhase2ChargeTime() {
            
                    return 0.32;
            
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
        static DrawEye(g, center, target, isPhase2, time) {
            
                    let bodyRadius = 34;
                    let outline = isPhase2 ? new Color(255, 120, 120) : new Color(220, 80, 80);
                    let bodyColor = isPhase2 ? new Color(150, 35, 35) : new Color(90, 24, 24);
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
