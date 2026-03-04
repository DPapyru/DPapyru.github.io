// Generated from anims/matrix-mat4-transform.anim.ts
// Generated from anims/matrix-mat4-transform.cs
export function create(runtime) {
    const { Vector2, Vector3, Matrix, Color, MathF, AnimGeom, PrimitiveType, BlendState, VertexPositionColorTexture } = runtime;
    class MatrixMat4Transform {
        constructor() {
            this._ctx = null;
            this._yaw = null;
            this._pitch = null;
            this._zoom = null;
        }
        OnInit(ctx) {
            this._ctx = ctx;
            this._yaw = 0.85;
            this._pitch = 0.45;
            this._zoom = 1;
        }
        OnUpdate(dt) {
            if (this._ctx == null) {
                return;
            }
            if (this._ctx.Input.IsInside && this._ctx.Input.IsDown) {
                this._yaw += this._ctx.Input.DeltaX * 0.011;
                this._pitch -= this._ctx.Input.DeltaY * 0.011;
                this._pitch = MathF.Max(-1.2, MathF.Min(1.2, this._pitch));
            }
            this._zoom += this._ctx.Input.WheelDelta * 0.08;
            this._zoom = MathF.Max(0.35, MathF.Min(3, this._zoom));
        }
        OnRender(g) {
            if (this._ctx == null) {
                return;
            }
            g.Clear(new Color(9, 13, 20));
            let width = this._ctx.Width;
            let height = this._ctx.Height;
            let center = new Vector2(width * 0.5, height * 0.58);
            let scale = MathF.Min(width, height) * 0.32 * this._zoom;
            let mode = 0;
            if (this._ctx.Input.ModeLocked) {
                mode = this._ctx.Input.Mode;
            }
            let time = this._ctx.Time;
            let translate = Matrix.CreateTranslation(0.35 + 0.25 * MathF.Sin(time * 0.8), 0.18 * MathF.Cos(time * 0.65), 0);
            let rotate = Matrix.Multiply(Matrix.CreateRotationZ(time * 0.9), Matrix.CreateRotationX(0.55));
            let scaling = Matrix.CreateScale(0.75 + 0.3 * MathF.Sin(time * 0.75), 0.7 + 0.35 * MathF.Cos(time * 0.6), 0.9);
            let model = Matrix.Multiply(Matrix.Multiply(translate, rotate), scaling);
            if (mode == 1) {
                model = translate;
            }
            else {
                if (mode == 2) {
                    model = rotate;
                }
                else {
                    if (mode == 3) {
                        model = scaling;
                    }
                }
            }
            let view = Matrix.Multiply(Matrix.CreateRotationY(this._yaw), Matrix.CreateRotationX(this._pitch));
            let world = Matrix.Multiply(view, model);
            MatrixMat4Transform.DrawArrow3(g, Matrix.TransformVector3(view, new Vector3(0, 0, 0)), Matrix.TransformVector3(view, new Vector3(1.2, 0, 0)), new Color(255, 110, 110, 220), 1.8, center, scale);
            MatrixMat4Transform.DrawArrow3(g, Matrix.TransformVector3(view, new Vector3(0, 0, 0)), Matrix.TransformVector3(view, new Vector3(0, 1.2, 0)), new Color(120, 255, 140, 220), 1.8, center, scale);
            MatrixMat4Transform.DrawArrow3(g, Matrix.TransformVector3(view, new Vector3(0, 0, 0)), Matrix.TransformVector3(view, new Vector3(0, 0, 1.2)), new Color(120, 170, 255, 220), 1.8, center, scale);
            MatrixMat4Transform.DrawCube(g, view, new Color(85, 115, 145, 120), 1, center, scale);
            MatrixMat4Transform.DrawCube(g, world, new Color(255, 170, 105, 220), 1.8, center, scale);
            let vecOrigin = Matrix.TransformVector3(view, new Vector3(0, 0, 0));
            let vecTarget = Matrix.TransformVector3(world, new Vector3(0.7, 0.35, 0.25));
            MatrixMat4Transform.DrawArrow3(g, vecOrigin, vecTarget, new Color(255, 220, 120, 230), 2, center, scale);
            MatrixMat4Transform.DrawMatrixText(g, model, mode);
        }
        OnDispose() {
        }
        static DrawMatrixText(g, m, mode) {
            g.Text("Matrix \u53D8\u6362\uFF08\u6A21\u5F0F\uFF1A" + MatrixMat4Transform.ModeName(mode) + "\uFF09", new Vector2(12, 12), new Color(220, 230, 245, 220), 13);
            g.Text("\u62D6\u62FD\u65CB\u8F6C\u89C6\u89D2\uFF0C\u6EDA\u8F6E\u7F29\u653E\uFF1Bmode-select \u53EF\u5207\u6362\u77E9\u9635\u7C7B\u578B", new Vector2(12, 30), new Color(140, 185, 228, 210), 12);
            g.Text("[" + MatrixMat4Transform.Fmt(m.M00) + "  " + MatrixMat4Transform.Fmt(m.M01) + "  " + MatrixMat4Transform.Fmt(m.M02) + "  " + MatrixMat4Transform.Fmt(m.M03) + "]", new Vector2(12, 52), new Color(255, 210, 150, 220), 12);
            g.Text("[" + MatrixMat4Transform.Fmt(m.M10) + "  " + MatrixMat4Transform.Fmt(m.M11) + "  " + MatrixMat4Transform.Fmt(m.M12) + "  " + MatrixMat4Transform.Fmt(m.M13) + "]", new Vector2(12, 68), new Color(255, 210, 150, 220), 12);
            g.Text("[" + MatrixMat4Transform.Fmt(m.M20) + "  " + MatrixMat4Transform.Fmt(m.M21) + "  " + MatrixMat4Transform.Fmt(m.M22) + "  " + MatrixMat4Transform.Fmt(m.M23) + "]", new Vector2(12, 84), new Color(255, 210, 150, 220), 12);
            g.Text("[" + MatrixMat4Transform.Fmt(m.M30) + "  " + MatrixMat4Transform.Fmt(m.M31) + "  " + MatrixMat4Transform.Fmt(m.M32) + "  " + MatrixMat4Transform.Fmt(m.M33) + "]", new Vector2(12, 100), new Color(255, 210, 150, 220), 12);
        }
        static ModeName(mode) {
            if (mode == 1) {
                return "\u5E73\u79FB";
            }
            if (mode == 2) {
                return "\u65CB\u8F6C";
            }
            if (mode == 3) {
                return "\u7F29\u653E";
            }
            return "\u590D\u5408";
        }
        static Fmt(value) {
            return (MathF.Round(value * 100) / 100).toString();
        }
        static DrawCube(g, m, color, width, center, scale) {
            let p000 = Matrix.TransformVector3(m, new Vector3(-0.5, -0.5, -0.5));
            let p001 = Matrix.TransformVector3(m, new Vector3(-0.5, -0.5, 0.5));
            let p010 = Matrix.TransformVector3(m, new Vector3(-0.5, 0.5, -0.5));
            let p011 = Matrix.TransformVector3(m, new Vector3(-0.5, 0.5, 0.5));
            let p100 = Matrix.TransformVector3(m, new Vector3(0.5, -0.5, -0.5));
            let p101 = Matrix.TransformVector3(m, new Vector3(0.5, -0.5, 0.5));
            let p110 = Matrix.TransformVector3(m, new Vector3(0.5, 0.5, -0.5));
            let p111 = Matrix.TransformVector3(m, new Vector3(0.5, 0.5, 0.5));
            MatrixMat4Transform.DrawSegment3(g, p000, p001, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p000, p010, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p000, p100, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p111, p110, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p111, p101, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p111, p011, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p001, p011, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p001, p101, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p010, p011, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p010, p110, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p100, p101, color, width, center, scale);
            MatrixMat4Transform.DrawSegment3(g, p100, p110, color, width, center, scale);
        }
        static DrawSegment3(g, from, to, color, width, center, scale) {
            g.Line(MatrixMat4Transform.Project(from, center, scale), MatrixMat4Transform.Project(to, center, scale), color, width);
        }
        static DrawArrow3(g, from, to, color, width, center, scale) {
            MatrixMat4Transform.DrawArrow2(g, MatrixMat4Transform.Project(from, center, scale), MatrixMat4Transform.Project(to, center, scale), color, width, 10);
        }
        static DrawArrow2(g, from, to, color, width, headSize) {
            g.Line(from, to, color, width);
            let dir = new Vector2(to.X - from.X, to.Y - from.Y);
            let len = MathF.Sqrt(dir.X * dir.X + dir.Y * dir.Y);
            if (len <= 0.001) {
                return;
            }
            let ux = dir.X / len;
            let uy = dir.Y / len;
            let left = new Vector2(-uy, ux);
            let basePoint = new Vector2(to.X - ux * headSize, to.Y - uy * headSize);
            let leftPoint = new Vector2(basePoint.X + left.X * headSize * 0.55, basePoint.Y + left.Y * headSize * 0.55);
            let rightPoint = new Vector2(basePoint.X - left.X * headSize * 0.55, basePoint.Y - left.Y * headSize * 0.55);
            g.Line(to, leftPoint, color, width);
            g.Line(to, rightPoint, color, width);
        }
        static Project(v, center, scale) {
            let depth = 2.8 + v.Z;
            if (depth < 0.25) {
                depth = 0.25;
            }
            return new Vector2(center.X + v.X * scale / depth, center.Y - v.Y * scale / depth);
        }
    }
    return new MatrixMat4Transform();
}
