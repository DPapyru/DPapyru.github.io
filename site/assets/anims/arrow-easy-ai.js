// Generated from anims/arrow-easy-ai.anim.ts
export function create(runtime) {
    const { Vector2, Vector3, Matrix, Color, MathF, AnimGeom, PrimitiveType, BlendState, VertexPositionColorTexture } = runtime;
    class ArrowEasyAI {
        constructor() {
            this._ctx = null;
            this._time = null;
            this._vel = new Vector2(0, 0);
            this._center = new Vector2(0, 0);
        }
        OnInit(ctx) {
            this._ctx = ctx;
            this._time = 0;
            if (this._ctx == null)
            {
                return;
            }
            let width = this._ctx.Width;
            let height = this._ctx.Height;
            this._vel = new Vector2(6, -2);
            this._center = new Vector2(0, height * 0.2);
        }
        OnUpdate(dt) {
            if (this._ctx == null)
            {
                return;
            }
            let width = this._ctx.Width;
            let height = this._ctx.Height;
            if (this._time++ > 120)
            {
                this._vel = new Vector2(6, -2);
                this._center = new Vector2(0, height * 0.2);
                this._time = 0;
            }
            this._center.X += this._vel.X;
            this._center.Y += this._vel.Y;
            if (this._vel.Y < 6)
            {
                this._vel.Y += 0.1;
            }
        }
        OnRender(g) {
            if (this._ctx == null)
            {
                return;
            }
            g.Clear(new Color(8, 12, 16));
            let width = this._ctx.Width;
            let height = this._ctx.Height;
            let center = new Vector2(0.5 * width, 0.5 * height);
            let scale = MathF.Min(width, height) * 0.52;
            let vec2 = new Vector2(this._vel.X * 0.02, -this._vel.Y * 0.02);
            AnimGeom.DrawAxes(g, center, scale);
            AnimGeom.DrawArrow(g, this._center, AnimGeom.ToScreen(vec2, this._center, scale), new Color(255, 255, 255, 255), 3, 15);
        }
        OnDispose() {
        }
    }
    return new ArrowEasyAI();
}

