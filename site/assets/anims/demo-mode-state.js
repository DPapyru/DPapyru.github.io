// Generated from anims/demo-mode-state.cs
export function create(runtime) {
    const { Vec2, Color, MathF, AnimGeom } = runtime;
    class DemoModeState {
        constructor() {
            this._ctx = null;
            this._angle = 0;
        }
        OnInit(ctx) {
            
                    this._ctx = ctx;
                    this._angle = 0;
            
        }
        OnUpdate(dt) {
            
                    if (this._ctx == null)
                    {
                        return;
                    }
            
                    let speed = MathF.Sin(this._ctx.Time * 0.9) * 1.4;
                    if (this._ctx.Input.ModeLocked)
                    {
                        if (this._ctx.Input.Mode == 1)
                        {
                            speed = 0;
                        }
                        else if (this._ctx.Input.Mode == 2)
                        {
                            speed = 1.8;
                        }
                        else if (this._ctx.Input.Mode == 3)
                        {
                            speed = -1.8;
                        }
                    }
            
                    this._angle += speed * dt;
            
        }
        OnRender(g) {
            
                    if (this._ctx == null)
                    {
                        return;
                    }
            
                    g.Clear(new Color(8, 12, 16));
            
                    let width = this._ctx.Width;
                    let height = this._ctx.Height;
                    let center = new Vec2(width * 0.5, height * 0.58);
                    let scale = MathF.Min(width, height) * 0.32;
            
                    AnimGeom.DrawAxes(g, center, scale);
            
                    let vector = new Vec2(MathF.Cos(this._angle) * 0.95, MathF.Sin(this._angle) * 0.95);
                    let tip = AnimGeom.ToScreen(vector, center, scale);
            
                    AnimGeom.DrawArrow(g, center, tip, new Color(120, 200, 255, 230), 2, 11);
                    g.Circle(center, scale, new Color(90, 120, 150, 120), 1);
                    g.FillCircle(tip, 5, new Color(255, 185, 115, 230));
            
        }
        OnDispose() {
        }
    }
    return new DemoModeState();
}
