// Generated from anims/mat4-trs-compose.cs
export function create(runtime) {
    const { Vec2, Vec3, Mat4, Color, MathF, AnimGeom } = runtime;
    class Mat4TrsCompose {
        constructor() {
            this._ctx = null;
            this._yaw = null;
            this._pitch = null;
        }
        OnInit(ctx) {
            this._ctx = ctx;
            this._yaw = 0.85;
            this._pitch = 0.45;
        }
        OnUpdate(dt) {
            if (this._ctx == null)
            {
                return;
            }
            if (this._ctx.Input.IsInside && this._ctx.Input.IsDown)
            {
                this._yaw += this._ctx.Input.DeltaX * 0.011;
                this._pitch -= this._ctx.Input.DeltaY * 0.011;
                this._pitch = MathF.Max(-1.2, MathF.Min(1.2, this._pitch));
            }
        }
        OnRender(g) {
            if (this._ctx == null)
            {
                return;
            }
            g.Clear(new Color(9, 13, 20));
            let width = this._ctx.Width;
            let height = this._ctx.Height;
            let center = new Vec2(width * 0.5, height * 0.58);
            let scale = MathF.Min(width, height) * 0.32;
            let mode = this._ctx.Input.ModeLocked ? this._ctx.Input.Mode : 0;
            let time = this._ctx.Time;
            let translate = Mat4.Translation(0.35 + 0.25 * MathF.Sin(time * 0.8), 0.18 * MathF.Cos(time * 0.65), 0);
            let rotate = Mat4.Mul(Mat4.RotationZ(time * 0.9), Mat4.RotationX(0.55));
            let scaling = Mat4.Scale(0.75 + 0.3 * MathF.Sin(time * 0.75), 0.7 + 0.35 * MathF.Cos(time * 0.6), 0.9);
            let model = Mat4.Mul(Mat4.Mul(translate, rotate), scaling);
            switch (mode) {
                case 1:
                    model = translate;
                    break;
                case 2:
                    model = rotate;
                    break;
                case 3:
                    model = scaling;
                    break;
                default:
                    model = Mat4.Mul(Mat4.Mul(translate, rotate), scaling);
                    break;
            }
            let view = Mat4.Mul(Mat4.RotationY(this._yaw), Mat4.RotationX(this._pitch));
            let world = Mat4.Mul(view, model);
            Mat4TrsCompose.DrawArrow3(g, Mat4.MulVec3(view, new Vec3(0, 0, 0)), Mat4.MulVec3(view, new Vec3(1.2, 0, 0)), new Color(255, 110, 110, 220), 1.8, center, scale);
            Mat4TrsCompose.DrawArrow3(g, Mat4.MulVec3(view, new Vec3(0, 0, 0)), Mat4.MulVec3(view, new Vec3(0, 1.2, 0)), new Color(120, 255, 140, 220), 1.8, center, scale);
            Mat4TrsCompose.DrawArrow3(g, Mat4.MulVec3(view, new Vec3(0, 0, 0)), Mat4.MulVec3(view, new Vec3(0, 0, 1.2)), new Color(120, 170, 255, 220), 1.8, center, scale);
            Mat4TrsCompose.DrawCube(g, view, new Color(85, 115, 145, 120), 1, center, scale);
            Mat4TrsCompose.DrawCube(g, world, new Color(255, 170, 105, 220), 1.8, center, scale);
            g.Text("Mat4 TRS Compose", new Vec2(12, 12), new Color(220, 230, 245, 220), 13);
            g.Text("\u6A21\u5F0F: " + Mat4TrsCompose.ModeName(mode), new Vec2(12, 30), new Color(140, 185, 228, 210), 12);
            g.Text("\u62D6\u62FD\u65CB\u8F6C\u89C6\u89D2\uFF0Cmode-select \u5207\u6362 T/R/S", new Vec2(12, 46), new Color(130, 150, 175, 210), 12);
        }
        OnDispose() {
        }
        static ModeName(mode) {
            if (mode == 1)
            {
                return "\u4EC5\u5E73\u79FB";
            }
            if (mode == 2)
            {
                return "\u4EC5\u65CB\u8F6C";
            }
            if (mode == 3)
            {
                return "\u4EC5\u7F29\u653E";
            }
            return "TRS\u590D\u5408";
        }
        static DrawCube(g, m, color, width, center, scale) {
            let p000 = Mat4.MulVec3(m, new Vec3(-0.5, -0.5, -0.5));
            let p001 = Mat4.MulVec3(m, new Vec3(-0.5, -0.5, 0.5));
            let p010 = Mat4.MulVec3(m, new Vec3(-0.5, 0.5, -0.5));
            let p011 = Mat4.MulVec3(m, new Vec3(-0.5, 0.5, 0.5));
            let p100 = Mat4.MulVec3(m, new Vec3(0.5, -0.5, -0.5));
            let p101 = Mat4.MulVec3(m, new Vec3(0.5, -0.5, 0.5));
            let p110 = Mat4.MulVec3(m, new Vec3(0.5, 0.5, -0.5));
            let p111 = Mat4.MulVec3(m, new Vec3(0.5, 0.5, 0.5));
            Mat4TrsCompose.DrawSegment3(g, p000, p001, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p000, p010, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p000, p100, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p111, p110, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p111, p101, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p111, p011, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p001, p011, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p001, p101, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p010, p011, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p010, p110, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p100, p101, color, width, center, scale);
            Mat4TrsCompose.DrawSegment3(g, p100, p110, color, width, center, scale);
        }
        static DrawSegment3(g, from, to, color, width, center, scale) {
            g.Line(Mat4TrsCompose.Project(from, center, scale), Mat4TrsCompose.Project(to, center, scale), color, width);
        }
        static DrawArrow3(g, from, to, color, width, center, scale) {
            Mat4TrsCompose.DrawArrow2(g, Mat4TrsCompose.Project(from, center, scale), Mat4TrsCompose.Project(to, center, scale), color, width, 10);
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
    return new Mat4TrsCompose();
}

