// Generated from anims/vec2-project-decompose.cs
export function create(runtime) {
    const { Vec2, Vec3, Mat4, Color, MathF, AnimGeom } = runtime;
    class Vec2ProjectDecompose {
        constructor() {
            this._ctx = null;
            this._vector = new Vec2(0, 0);
            this._mode = null;
        }
        OnInit(ctx) {
            this._ctx = ctx;
            this._vector = new Vec2(0.95, 0.6);
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
                this._vector = new Vec2((this._ctx.Input.X - centerX) / (this._ctx.Width * 0.25), (centerY - this._ctx.Input.Y) / (this._ctx.Height * 0.25));
            }
            this._mode = this._ctx.Input.ModeLocked ? this._ctx.Input.Mode : 0;
        }
        OnRender(g) {
            if (this._ctx == null)
            {
                return;
            }
            g.Clear(new Color(8, 12, 18));
            let center = new Vec2(this._ctx.Width * 0.5, this._ctx.Height * 0.58);
            let scale = MathF.Min(this._ctx.Width, this._ctx.Height) * 0.33;
            let axis = new Vec2(MathF.Cos(this._ctx.Time * 0.55), MathF.Sin(this._ctx.Time * 0.55));
            let axisLen = MathF.Sqrt(axis.X * axis.X + axis.Y * axis.Y);
            if (axisLen > 0.0001)
            {
                axis = Vec2.DivScalar(axis, axisLen);
            }
            let dot = this._vector.X * axis.X + this._vector.Y * axis.Y;
            let proj = Vec2.MulScalar(axis, dot);
            let rej = Vec2.Sub(this._vector, proj);
            AnimGeom.DrawAxes(g, center, scale, new Color(88, 104, 130, 220), new Color(45, 58, 82, 130));
            let axisTipA = AnimGeom.ToScreen(Vec2.MulScalar(axis, 1.4), center, scale);
            let axisTipB = AnimGeom.ToScreen(Vec2.MulScalar(axis, -1.4), center, scale);
            g.Line(axisTipA, axisTipB, new Color(150, 175, 220, 190), 1.6);
            AnimGeom.DrawArrow(g, center, AnimGeom.ToScreen(this._vector, center, scale), new Color(118, 225, 255, 230), 2.2, 10);
            AnimGeom.DrawArrow(g, center, AnimGeom.ToScreen(proj, center, scale), new Color(255, 205, 120, 230), 2, 9);
            if (this._mode == 1)
            {
                AnimGeom.DrawArrow(g, AnimGeom.ToScreen(proj, center, scale), AnimGeom.ToScreen(this._vector, center, scale), new Color(255, 132, 132, 230), 2, 9);
            }
            g.Text("Vec2 Projection \u0026 Decompose", new Vec2(12, 12), new Color(225, 235, 245, 240), 13);
            g.Text(this._mode == 1 ? "\u5206\u89E3: v = proj \u002B rej" : "\u6295\u5F71: proj(v, axis)", new Vec2(12, 30), new Color(155, 190, 225, 220), 12);
            g.Text("\u767D\u7EBF: axis  \u84DD: v  \u9EC4: proj" + (this._mode == 1 ? "  \u7EA2: rej" : ""), new Vec2(12, 48), new Color(130, 150, 175, 220), 12);
        }
        OnDispose() {
        }
    }
    return new Vec2ProjectDecompose();
}

