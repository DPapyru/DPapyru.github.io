// Generated from anims/fna-vertex-demo.anim.ts
// Generated from anims/fna-vertex-demo.cs
export function create(runtime) {
    const { Vector2, Vector3, Matrix, Color, MathF, AnimGeom, PrimitiveType, BlendState, VertexPositionColorTexture } = runtime;
    class FnaVertexDemo {
        constructor() {
            this._vertices = new Array(3);
            this._indices = [0, 1, 2];
            this._ctx = null;
        }
        OnInit(ctx) {
            this._ctx = ctx;
        }
        OnUpdate(dt) {
        }
        OnRender(g) {
            if (this._ctx == null) {
                return;
            }
            g.Clear(new Color(8, 12, 18));
            let width = this._ctx.Width;
            let height = this._ctx.Height;
            let centerX = width * 0.5;
            let centerY = height * 0.55;
            let radius = MathF.Min(width, height) * 0.24;
            let spin = this._ctx.Time * 0.9;
            this._vertices[0] = FnaVertexDemo.BuildVertex(centerX, centerY, radius, spin + 0, new Color(255, 120, 120, 235), new Vector2(0, 0));
            this._vertices[1] = FnaVertexDemo.BuildVertex(centerX, centerY, radius, spin + 2.0943952, new Color(120, 0, 250, 235), new Vector2(1, 0));
            this._vertices[2] = FnaVertexDemo.BuildVertex(centerX, centerY, radius, spin + 4.1887903, new Color(120, 170, 255, 235), new Vector2(0.5, 1));
            g.UseEffect("anims/shaders/fna-vertex-demo.fx");
            g.SetBlendState(BlendState.AlphaBlend);
            g.SetFloat("uPulse", 0.5 + 0.5 * MathF.Sin(this._ctx.Time * 2));
            g.SetVector2("uCenter", new Vector2(centerX, centerY));
            g.SetColor("uTint", new Color(130, 220, 255, 255));
            g.DrawUserIndexedPrimitives(PrimitiveType.TriangleList, this._vertices, 0, this._vertices.length, this._indices, 0, 1);
            g.ClearEffect();
            g.Text("FNA Vertex \u002B FX Demo", new Vector2(12, 12), new Color(224, 234, 248, 240), 13);
        }
        OnDispose() {
        }
        static BuildVertex(cx, cy, radius, radians, color, uv) {
            let x = cx + MathF.Cos(radians) * radius;
            let y = cy + MathF.Sin(radians) * radius;
            return new VertexPositionColorTexture(new Vector3(x, y, 0), color, uv);
        }
    }
    return new FnaVertexDemo();
}
