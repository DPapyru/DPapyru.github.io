// Generated from anims/vec2-basic-ops.cs
export function create(runtime) {
    const { Vec2, Vec3, Mat4, Color, MathF, AnimGeom } = runtime;
    class Vec2BasicOps {
        constructor() {
            this._ctx = null;
            this._cursor = new Vec2(0, 0);
            this._mode = null;
        }
        OnInit(ctx) {
            this._ctx = ctx;
            this._cursor = new Vec2(0.45, 0.2);
            this._mode = 0;
        }
        OnUpdate(dt) {
            if (this._ctx == null)
            {
                return;
            }
            if (this._ctx.Input.IsInside)
            {
                let centerX = this._ctx.Width * 0.5;
                let centerY = this._ctx.Height * 0.58;
                this._cursor = new Vec2((this._ctx.Input.X - centerX) / (this._ctx.Width * 0.25), (centerY - this._ctx.Input.Y) / (this._ctx.Height * 0.25));
            }
            if (this._ctx.Input.ModeLocked)
            {
                this._mode = this._ctx.Input.Mode;
            }
            else
            {
                let phase = this._ctx.Time % 9;
                if (phase < 3)
                {
                    this._mode = 0;
                }
                else
                {
                    if (phase < 6)
                    {
                        this._mode = 1;
                    }
                    else
                    {
                        this._mode = 2;
                    }
                }
            }
        }
        OnRender(g) {
            if (this._ctx == null)
            {
                return;
            }
            g.Clear(new Color(10, 13, 19));
            let center = new Vec2(this._ctx.Width * 0.5, this._ctx.Height * 0.58);
            let scale = MathF.Min(this._ctx.Width, this._ctx.Height) * 0.32;
            let a = new Vec2(0.9, 0.35);
            let b = this._cursor;
            let result = a;
            let label = "a \u002B b";
            switch (this._mode) {
                case 1:
                    result = Vec2.Sub(a, b);
                    label = "a - b";
                    break;
                case 2:
                    result = Vec2.MulScalar(a, 1.45);
                    label = "a * 1.45";
                    break;
                default:
                    result = Vec2.Add(a, b);
                    label = "a \u002B b";
                    break;
            }
            AnimGeom.DrawAxes(g, center, scale, new Color(90, 110, 140, 210), new Color(45, 62, 88, 120));
            let aTip = AnimGeom.ToScreen(a, center, scale);
            let bTip = AnimGeom.ToScreen(b, center, scale);
            let rTip = AnimGeom.ToScreen(result, center, scale);
            AnimGeom.DrawArrow(g, center, aTip, new Color(110, 220, 255, 240), 2, 10);
            AnimGeom.DrawArrow(g, center, bTip, new Color(255, 150, 110, 240), 2, 10);
            AnimGeom.DrawArrow(g, center, rTip, new Color(150, 255, 130, 240), 2.6, 11);
            g.Text("Vec2 Basic Ops", new Vec2(12, 12), new Color(225, 235, 245, 240), 13);
            g.Text("\u6A21\u5F0F: " + label, new Vec2(12, 30), new Color(160, 198, 230, 220), 12);
            g.Text("\u84DD: a  \u6A59: b  \u7EFF: result", new Vec2(12, 48), new Color(130, 150, 175, 220), 12);
        }
        OnDispose() {
        }
    }
    return new Vec2BasicOps();
}

