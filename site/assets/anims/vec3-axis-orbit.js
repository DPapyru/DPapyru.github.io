// Generated from anims/vec3-axis-orbit.cs
export function create(runtime) {
    const { Vec2, Vec3, Mat4, Color, MathF, AnimGeom } = runtime;
    class Vec3AxisOrbit {
        constructor() {
            this._ctx = null;
            this._yaw = null;
            this._pitch = null;
            this._zoom = null;
        }
        OnInit(ctx) {
            this._ctx = ctx;
            this._yaw = 0.7;
            this._pitch = 0.35;
            this._zoom = 1;
        }
        OnUpdate(dt) {
            if (this._ctx == null)
            {
                return;
            }
            if (this._ctx.Input.IsInside && this._ctx.Input.IsDown)
            {
                this._yaw += this._ctx.Input.DeltaX * 0.012;
                this._pitch -= this._ctx.Input.DeltaY * 0.012;
                this._pitch = MathF.Max(-1.2, MathF.Min(1.2, this._pitch));
            }
            this._zoom += this._ctx.Input.WheelDelta * 0.08;
            this._zoom = MathF.Max(0.35, MathF.Min(3, this._zoom));
        }
        OnRender(g) {
            if (this._ctx == null)
            {
                return;
            }
            g.Clear(new Color(9, 13, 20));
            let width = this._ctx.Width;
            let height = this._ctx.Height;
            let center = new Vec2(width * 0.5, height * 0.56);
            let scale = MathF.Min(width, height) * 0.34 * this._zoom;
            let view = Mat4.Mul(Mat4.RotationY(this._yaw), Mat4.RotationX(this._pitch));
            let gridColor = new Color(48, 70, 94, 120);
            for (let i = -4; i <= 4; i++)
            {
                let t = i * 0.25;
                Vec3AxisOrbit.DrawSegment3(g, Mat4.MulVec3(view, new Vec3(t, 0, -1)), Mat4.MulVec3(view, new Vec3(t, 0, 1)), gridColor, 1, center, scale);
                Vec3AxisOrbit.DrawSegment3(g, Mat4.MulVec3(view, new Vec3(-1, 0, t)), Mat4.MulVec3(view, new Vec3(1, 0, t)), gridColor, 1, center, scale);
            }
            Vec3AxisOrbit.DrawArrow3(g, Mat4.MulVec3(view, new Vec3(0, 0, 0)), Mat4.MulVec3(view, new Vec3(1.2, 0, 0)), new Color(255, 110, 110, 240), 2, center, scale);
            Vec3AxisOrbit.DrawArrow3(g, Mat4.MulVec3(view, new Vec3(0, 0, 0)), Mat4.MulVec3(view, new Vec3(0, 1.2, 0)), new Color(120, 255, 140, 240), 2, center, scale);
            Vec3AxisOrbit.DrawArrow3(g, Mat4.MulVec3(view, new Vec3(0, 0, 0)), Mat4.MulVec3(view, new Vec3(0, 0, 1.2)), new Color(120, 170, 255, 240), 2, center, scale);
            g.Text("X", Vec3AxisOrbit.Project(Mat4.MulVec3(view, new Vec3(1.35, 0, 0)), center, scale), new Color(255, 140, 140), 14);
            g.Text("Y", Vec3AxisOrbit.Project(Mat4.MulVec3(view, new Vec3(0, 1.35, 0)), center, scale), new Color(150, 255, 170), 14);
            g.Text("Z", Vec3AxisOrbit.Project(Mat4.MulVec3(view, new Vec3(0, 0, 1.35)), center, scale), new Color(150, 190, 255), 14);
            g.Text("\u53F3\u624B\u7CFB 3D \u5750\u6807\u8F74\uFF08\u62D6\u62FD\u65CB\u8F6C\uFF0C\u6EDA\u8F6E\u7F29\u653E\uFF09", new Vec2(12, 12), new Color(220, 230, 240, 220), 13);
            g.Text("yaw=" + Vec3AxisOrbit.Fmt(this._yaw) + "  pitch=" + Vec3AxisOrbit.Fmt(this._pitch) + "  zoom=" + Vec3AxisOrbit.Fmt(this._zoom), new Vec2(12, 30), new Color(155, 195, 230, 210), 12);
        }
        OnDispose() {
        }
        static Fmt(value) {
            return (MathF.Round(value * 100) / 100).toString();
        }
        static DrawSegment3(g, from, to, color, width, center, scale) {
            g.Line(Vec3AxisOrbit.Project(from, center, scale), Vec3AxisOrbit.Project(to, center, scale), color, width);
        }
        static DrawArrow3(g, from, to, color, width, center, scale) {
            Vec3AxisOrbit.DrawArrow2(g, Vec3AxisOrbit.Project(from, center, scale), Vec3AxisOrbit.Project(to, center, scale), color, width, 10);
        }
        static DrawArrow2(g, from, to, color, width, headSize) {
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
        static Project(v, center, scale) {
            let depth = 2.8 + v.Z;
            if (depth < 0.25)
            {
                depth = 0.25;
            }
            return new Vec2(center.X + v.X * scale / depth, center.Y - v.Y * scale / depth);
        }
    }
    return new Vec3AxisOrbit();
}

