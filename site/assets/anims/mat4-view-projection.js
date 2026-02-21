// Generated from anims/mat4-view-projection.cs
export function create(runtime) {
    const { Vec2, Vec3, Mat4, Color, MathF, AnimGeom } = runtime;
    class Mat4ViewProjection {
        constructor() {
            this._ctx = null;
            this._yaw = null;
            this._pitch = null;
        }
        OnInit(ctx) {
            this._ctx = ctx;
            this._yaw = 0.55;
            this._pitch = 0.25;
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
            g.Clear(new Color(9, 12, 18));
            let center = new Vec2(this._ctx.Width * 0.5, this._ctx.Height * 0.58);
            let scale = MathF.Min(this._ctx.Width, this._ctx.Height) * 0.34;
            let aspect = this._ctx.Width / MathF.Max(1, this._ctx.Height);
            let view = Mat4.Mul(Mat4.Mul(Mat4.RotationY(this._yaw), Mat4.RotationX(this._pitch)), Mat4.Translation(0, 0, 2.8));
            let projection = Mat4.PerspectiveFovRh(1.05, aspect, 0.1, 10);
            let vp = Mat4.Mul(projection, view);
            let useProjection = !this._ctx.Input.ModeLocked || this._ctx.Input.Mode != 1;
            let m = useProjection ? vp : view;
            Mat4ViewProjection.DrawGrid(g, m, center, scale);
            Mat4ViewProjection.DrawCube(g, m, center, scale, new Color(255, 180, 110, 220), 1.9);
            Mat4ViewProjection.DrawAxis(g, m, center, scale);
            g.Text("Mat4 View \u002B Projection", new Vec2(12, 12), new Color(225, 235, 245, 220), 13);
            g.Text(useProjection ? "\u6A21\u5F0F: \u900F\u89C6\u002B\u89C6\u56FE" : "\u6A21\u5F0F: \u4EC5\u89C6\u56FE", new Vec2(12, 30), new Color(150, 188, 224, 220), 12);
            g.Text("\u62D6\u62FD\u65CB\u8F6C\u89C6\u89D2\uFF0Cmode-select \u53EF\u5207\u6362", new Vec2(12, 48), new Color(130, 150, 175, 220), 12);
        }
        OnDispose() {
        }
        static DrawGrid(g, m, center, scale) {
            let i = -4;
            while (i <= 4)
            {
                let t = i * 0.25;
                Mat4ViewProjection.DrawSegment(g, Mat4.MulVec3(m, new Vec3(t, 0, -1)), Mat4.MulVec3(m, new Vec3(t, 0, 1)), center, scale, new Color(52, 70, 95, 120), 1);
                Mat4ViewProjection.DrawSegment(g, Mat4.MulVec3(m, new Vec3(-1, 0, t)), Mat4.MulVec3(m, new Vec3(1, 0, t)), center, scale, new Color(52, 70, 95, 120), 1);
                i += 1;
            }
        }
        static DrawAxis(g, m, center, scale) {
            Mat4ViewProjection.DrawArrow(g, Mat4.MulVec3(m, new Vec3(0, 0, 0)), Mat4.MulVec3(m, new Vec3(1.1, 0, 0)), center, scale, new Color(255, 112, 112, 230), 2);
            Mat4ViewProjection.DrawArrow(g, Mat4.MulVec3(m, new Vec3(0, 0, 0)), Mat4.MulVec3(m, new Vec3(0, 1.1, 0)), center, scale, new Color(125, 255, 145, 230), 2);
            Mat4ViewProjection.DrawArrow(g, Mat4.MulVec3(m, new Vec3(0, 0, 0)), Mat4.MulVec3(m, new Vec3(0, 0, 1.1)), center, scale, new Color(130, 176, 255, 230), 2);
        }
        static DrawCube(g, m, center, scale, color, width) {
            let p000 = Mat4.MulVec3(m, new Vec3(-0.5, -0.5, -0.5));
            let p001 = Mat4.MulVec3(m, new Vec3(-0.5, -0.5, 0.5));
            let p010 = Mat4.MulVec3(m, new Vec3(-0.5, 0.5, -0.5));
            let p011 = Mat4.MulVec3(m, new Vec3(-0.5, 0.5, 0.5));
            let p100 = Mat4.MulVec3(m, new Vec3(0.5, -0.5, -0.5));
            let p101 = Mat4.MulVec3(m, new Vec3(0.5, -0.5, 0.5));
            let p110 = Mat4.MulVec3(m, new Vec3(0.5, 0.5, -0.5));
            let p111 = Mat4.MulVec3(m, new Vec3(0.5, 0.5, 0.5));
            let edges = [[p000, p001], [p000, p010], [p000, p100], [p111, p110], [p111, p101], [p111, p011], [p001, p011], [p001, p101], [p010, p011], [p010, p110], [p100, p101], [p100, p110]];
            for (const edge of edges)
            {
                Mat4ViewProjection.DrawSegment(g, edge[0], edge[1], center, scale, color, width);
            }
        }
        static DrawSegment(g, from, to, center, scale, color, width) {
            g.Line(Mat4ViewProjection.Project(from, center, scale), Mat4ViewProjection.Project(to, center, scale), color, width);
        }
        static DrawArrow(g, from, to, center, scale, color, width) {
            let from2 = Mat4ViewProjection.Project(from, center, scale);
            let to2 = Mat4ViewProjection.Project(to, center, scale);
            AnimGeom.DrawArrow(g, from2, to2, color, width, 10);
        }
        static Project(v, center, scale) {
            let depth = 2.8 + v.Z;
            if (depth < 0.2)
            {
                depth = 0.2;
            }
            return new Vec2(center.X + v.X * scale / depth, center.Y - v.Y * scale / depth);
        }
    }
    return new Mat4ViewProjection();
}

